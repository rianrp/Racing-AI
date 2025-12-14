import { Renderer } from "./Renderer";
import { Track } from "../world/Track";
import { Car } from "../world/Car";
import { Brain } from "../ai/Brain";

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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.renderer = new Renderer(this.ctx, this.canvas);

    this.cars = this.createPopulation();
    this.best = this.cars[0];

    // carrega cérebro salvo (V4)
    const saved = localStorage.getItem("bestBrain");
    if (saved) {
      const br = Brain.fromJSON(JSON.parse(saved));
      for (const c of this.cars) c.brain = br.clone();
      console.log("✅ Loaded saved brain from localStorage");
    }
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  private createPopulation() {
    const inputSize = 10 + 1; // rayCount(10) + speed
    const outputSize = 3;     // steer, throttle, brake

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

    for (const c of this.cars) c.update(dt, null, this.track);

    this.best = this.cars.reduce((a, b) => (b.fitness > a.fitness ? b : a), this.cars[0]);

    // avança geração se todos morreram OU tempo limite atingido
    const alive = this.cars.some(c => c.alive);
    if (!alive || this.generationTime > this.maxGenerationTime) {
      this.nextGeneration();
    }
  }

  private nextGeneration() {
    const sorted = [...this.cars].sort((a, b) => b.fitness - a.fitness);
    const eliteCount = Math.max(2, Math.floor(this.populationSize * 0.1));
    const elite = sorted.slice(0, eliteCount);

    // salva o melhor cérebro (V4)
    localStorage.setItem("bestBrain", JSON.stringify(sorted[0].brain!.toJSON()));

    // annealing: mutação alta no início, baixa depois
    const strength = this.generation < 10 ? 0.8 : 0.35;
    const rate = this.generation < 10 ? 0.15 : 0.08;

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
