export class Input {
  private keys = new Set<string>();

  constructor() {
    window.addEventListener("keydown", (e) => this.keys.add(e.key.toLowerCase()));
    window.addEventListener("keyup", (e) => this.keys.delete(e.key.toLowerCase()));
  }

  private down(k: string) { return this.keys.has(k); }

  get forward() { return this.down("w"); }
  get brake()   { return this.down("s"); }

  get steer() {
    const left  = this.down("a") ? 1 : 0;
    const right = this.down("d") ? 1 : 0;
    return right - left; 
  }
}
