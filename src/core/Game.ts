import { Renderer } from "./Renderer";
import { Input } from "./Input";
import { Car } from "../world/Car";
import { Track } from "../world/Track";

export class Game {
  private ctx: CanvasRenderingContext2D;
  private last = 0;

  private input = new Input();
  private track = new Track();
  private car = new Car();
  private renderer: Renderer;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.renderer = new Renderer(this.ctx, this.canvas);
  }

  start() {
    requestAnimationFrame(this.loop);
  }

  private loop = (t: number) => {
    const dt = (t - this.last) / 1000;
    this.last = t;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.car.update(dt, this.input, this.track);
  }

  private render() {
    this.renderer.clear();
    this.renderer.drawTrack(this.track);
    this.renderer.drawCar(this.car);
  }
}
