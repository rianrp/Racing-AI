import { Track } from "../world/Track";
import { Car } from "../world/Car";

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement
  ) {
    this.ctx = ctx;
    this.canvas = canvas;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTrack(track: Track) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(track.cx, track.cy);

    ctx.beginPath();
    ctx.arc(0, 0, track.outer, 0, Math.PI * 2);
    ctx.arc(0, 0, track.inner, 0, Math.PI * 2, true);
    ctx.fillStyle = "#1f2937";
    ctx.fill();

    ctx.restore();
  }

  drawCar(car: Car) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(-10, -20, 20, 40);

    ctx.restore();
  }
}
