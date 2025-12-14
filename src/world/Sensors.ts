import { Track } from "./Track";

export type RayHit = { dist: number; px: number; py: number } | null;

export class Sensors {
  rayCount = 10;           // use par (10, 12, 14...)
  rayLength = 180;
  raySpread = Math.PI * 0.9; // leque (frente e trás)

  readings: number[] = [];
  rays: Array<{ x1: number; y1: number; x2: number; y2: number; hit: RayHit }> = [];

  update(x: number, y: number, angle: number, track: Track) {
    this.castRays(x, y, angle, track);
    this.readings = this.rays.map(r => (r.hit ? 1 - r.hit.dist / this.rayLength : 0));
  }

  private castRays(x: number, y: number, angle: number, track: Track) {
    this.rays.length = 0;

    const half = Math.floor(this.rayCount / 2);

    // FRONT group (centro do carro)
    for (let i = 0; i < half; i++) {
      const t = half === 1 ? 0.5 : i / (half - 1);
      const a = angle + (this.raySpread / 2) - t * this.raySpread;

      const x2 = x + Math.cos(a) * this.rayLength;
      const y2 = y + Math.sin(a) * this.rayLength;

      const hit = this.hitRing(x, y, x2, y2, track);
      this.rays.push({ x1: x, y1: y, x2, y2, hit });
    }

    // BACK group (mesmo leque, só que +PI)
    for (let i = 0; i < half; i++) {
      const t = half === 1 ? 0.5 : i / (half - 1);
      const a = (angle + Math.PI) + (this.raySpread / 2) - t * this.raySpread;

      const x2 = x + Math.cos(a) * this.rayLength;
      const y2 = y + Math.sin(a) * this.rayLength;

      const hit = this.hitRing(x, y, x2, y2, track);
      this.rays.push({ x1: x, y1: y, x2, y2, hit });
    }
  }

  private hitRing(x1: number, y1: number, x2: number, y2: number, track: Track): RayHit {
    const outer = this.hitCircle(x1, y1, x2, y2, track.cx, track.cy, track.outer);
    const inner = this.hitCircle(x1, y1, x2, y2, track.cx, track.cy, track.inner);

    const candidates = [outer, inner].filter(Boolean) as { t: number; px: number; py: number }[];
    if (!candidates.length) return null;

    candidates.sort((a, b) => a.t - b.t);
    const c = candidates[0];

    const dist = Math.hypot(c.px - x1, c.py - y1);
    return { dist, px: c.px, py: c.py };
  }

  private hitCircle(
    x1: number, y1: number, x2: number, y2: number,
    cx: number, cy: number, r: number
  ): { t: number; px: number; py: number } | null {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const fx = x1 - cx;
    const fy = y1 - cy;

    const a = dx * dx + dy * dy;
    const b = 2 * (fx * dx + fy * dy);
    const c = fx * fx + fy * fy - r * r;

    const disc = b * b - 4 * a * c;
    if (disc < 0) return null;

    const s = Math.sqrt(disc);
    const t1 = (-b - s) / (2 * a);
    const t2 = (-b + s) / (2 * a);

    let t = Infinity;
    if (t1 >= 0 && t1 <= 1) t = Math.min(t, t1);
    if (t2 >= 0 && t2 <= 1) t = Math.min(t, t2);
    if (!isFinite(t)) return null;

    return { t, px: x1 + dx * t, py: y1 + dy * t };
  }
}
