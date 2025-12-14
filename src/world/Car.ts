import { Input } from "../core/Input";
import { Track } from "./Track";

export class Car {
  x = 450 + 220;
  y = 350;
  angle = Math.PI;
  speed = 0;

  update(dt: number, input: Input, track: Track) {
    const accel = 500;
    const drag = 220;
    const maxFwd = 420;
    const maxRev = -180;
    const steerPower = 2.6;

    // aceleração / ré
    if (input.forward) this.speed += accel * dt;
    if (input.brake) this.speed -= accel * dt;

    // atrito (funciona pros dois sentidos)
    if (!input.forward && !input.brake) {
      this.speed -= Math.sign(this.speed) * drag * dt;
    }

    // limites
    if (this.speed > maxFwd) this.speed = maxFwd;
    if (this.speed < maxRev) this.speed = maxRev;

    // direção (vira também de ré)
    const steer = input.steer;
    const speedNorm = Math.min(Math.abs(this.speed) / maxFwd, 1);
    const steerFactor = 0.25 + 0.75 * speedNorm;
    this.angle += steer * steerPower * steerFactor * dt * Math.sign(this.speed || 1);

    // movimento
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // colisão simples com pista
    const dx = this.x - track.cx;
    const dy = this.y - track.cy;
    const d = Math.hypot(dx, dy);

    if (d > track.outer || d < track.inner) {
      this.speed = 0;
    }
  }
}
