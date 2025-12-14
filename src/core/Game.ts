import { Renderer } from "./Renderer";
import { Track } from "../world/Track";
import { Car } from "../world/Car";
import { Brain } from "../ai/Brain";
import { Logger } from "../utils/Logger";

export class Game {
  private ctx: CanvasRenderingContext2D;
  private last = 0;

  private track = new Track();
  private renderer: Renderer;

  private generation = 1;
  private populationSize = 80;
  private generationTime = 0;
  private maxGenerationTime = 20; // segundos

  private cars: Car[] = [];
  private best!: Car;
  private canvas: HTMLCanvasElement;
  private logger = new Logger();
  private frameCount = 0;
  private logInterval = 60; // loga a cada 60 frames (~1s)

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.renderer = new Renderer(this.ctx, this.canvas);
    this.logger.event("System initialized");
    this.logger.info(`Population size: ${this.populationSize}`);
    this.logger.info(`Max generation time: ${this.maxGenerationTime}s`);
    this.cars = this.createPopulation();
    this.best = this.cars[0];
    this.logger.success(`Created population of ${this.populationSize} cars`);

    const saved = localStorage.getItem("bestBrain");
    if (saved) {
      const br = Brain.fromJSON(JSON.parse(saved));
      for (const c of this.cars) c.brain = br.clone();
      this.logger.success("✅ Loaded saved brain from localStorage");
      this.logger.data("Brain inputs", br.inputSize);
      this.logger.data("Brain outputs", br.outputSize);
    } else {
      this.logger.warning("No saved brain found, starting fresh");
    }
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  private createPopulation() {
    const inputSize = 10 + 1;
    const outputSize = 3;
    return Array.from({ length: this.populationSize }, () => {
      const c = new Car();
      c.brain = new Brain(inputSize, outputSize);
      return c;
    });
  }

  private loop = (t: number) => {
    const dt = Math.min(0.033, (t - this.last) / 1000);
    this.last = t;
    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.generationTime += dt;
    this.frameCount++;

    for (const c of this.cars) c.update(dt, null, this.track);
    const prevBest = this.best;

    this.best = this.cars.reduce((a, b) => (b.fitness > a.fitness ? b : a), this.cars[0]);

    if (this.frameCount % this.logInterval === 0) {
      const aliveCount = this.cars.filter(c => c.alive).length;
      this.logger.info(`——— GEN ${this.generation} Frame ${this.frameCount} ———`);
      this.logger.data("Alive cars", `${aliveCount}/${this.populationSize}`);
      this.logger.data("Best fitness", this.best.fitness.toFixed(2));
      this.logger.data("Checkpoint", `${this.best.checkpointIndex}/${this.track.checkpointCount}`);
      this.logger.data("Speed", this.best.speed.toFixed(1));
      this.logger.data("Position", `x:${this.best.x.toFixed(0)} y:${this.best.y.toFixed(0)}`);
      
      const sensorData = this.best.sensors.readings.map(r => r.toFixed(2)).join(', ');
      this.logger.data("Sensors [10]", `[${sensorData}]`);
      
      if (this.best.brain) {
        const inputs = [
          ...this.best.sensors.readings,
          Math.max(-1, Math.min(1, this.best.speed / 420))
        ];
        const outputs = this.best.brain.forward(inputs);
        this.logger.data("Neural output", `Steer:${outputs[0].toFixed(2)} Throttle:${outputs[1].toFixed(2)} Brake:${outputs[2].toFixed(2)}`);
      }
    }

    if (prevBest && this.best !== prevBest) {
      this.logger.event(`🏆 New best! Fitness: ${this.best.fitness.toFixed(2)}`);
    }

    const alive = this.cars.some(c => c.alive);
    if (!alive) {
      this.logger.warning("☠️ All cars died");
      this.nextGeneration();
    } else if (this.generationTime > this.maxGenerationTime) {
      this.logger.warning("⏰ Time limit reached");
      this.nextGeneration();
    }
  }

  private nextGeneration() {
    const sorted = [...this.cars].sort((a, b) => b.fitness - a.fitness);
    const eliteCount = Math.max(2, Math.floor(this.populationSize * 0.1));
    const elite = sorted.slice(0, eliteCount);

    this.logger.event(`💥 GENERATION ${this.generation} COMPLETE`);
    this.logger.success(`Best fitness: ${sorted[0].fitness.toFixed(2)}`);
    this.logger.success(`Best checkpoint: ${sorted[0].checkpointIndex}/${this.track.checkpointCount}`);
    this.logger.data("Top 5 fitness", sorted.slice(0, 5).map(c => c.fitness.toFixed(1)).join(', '));
    this.logger.data("Elite count", eliteCount);

    // salva o melhor cérebro (V4)
    localStorage.setItem("bestBrain", JSON.stringify(sorted[0].brain!.toJSON()));
    this.logger.success("💾 Brain saved to localStorage");

    const strength = this.generation < 10 ? 0.8 : 0.35;
    const rate = this.generation < 10 ? 0.15 : 0.08;
    this.logger.data("Mutation", `Rate:${rate} Strength:${strength}`);

    const next: Car[] = [];
    while (next.length < this.populationSize) {
      const parent = elite[Math.floor(Math.random() * elite.length)];
      const child = new Car();
      child.brain = parent.brain!.clone();
      child.brain.mutate(rate, strength);
      next.push(child);
    }

    this.cars = next;
    this.generation++;
    this.generationTime = 0;

    for (const c of this.cars) c.reset();
    this.logger.event(`▶️ Starting GENERATION ${this.generation}`);
    this.logger.info(`All ${this.populationSize} cars reset`);
  }

  private render() {
    this.renderer.clear();
    this.renderer.drawTrack(this.track);
    this.renderer.drawCar(this.best);

    this.ctx.fillStyle = "rgba(255,255,255,0.85)";
    this.ctx.font = "14px ui-monospace, monospace";
    this.ctx.fillText(`GEN ${this.generation}`, 12, 20);
    this.ctx.fillText(`FIT ${this.best.fitness.toFixed(2)}`, 12, 40);
    this.ctx.fillText(`CP ${this.best.checkpointIndex}/${this.track.checkpointCount}`, 12, 60);
    const timeLeft = Math.max(0, this.maxGenerationTime - this.generationTime);
    this.ctx.fillText(`TIME ${timeLeft.toFixed(1)}s`, 12, 80);
  }
}
