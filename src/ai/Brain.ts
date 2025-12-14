export class Brain {
  // rede 1 camada: outputs = tanh(W * inputs + b)
  W: number[][]; // [out][in]
  b: number[];   // [out]
  inputSize: number;
  outputSize: number;

  constructor(inputSize: number, outputSize: number) {
    this.inputSize = inputSize;
    this.outputSize = outputSize;
    this.W = Array.from({ length: outputSize }, () =>
      Array.from({ length: inputSize }, () => rand(-1, 1))
    );
    this.b = Array.from({ length: outputSize }, () => rand(-1, 1));
  }

  forward(inputs: number[]) {
    const out = new Array(this.outputSize).fill(0);
    for (let o = 0; o < this.outputSize; o++) {
      let s = this.b[o];
      for (let i = 0; i < this.inputSize; i++) s += this.W[o][i] * inputs[i];
      out[o] = Math.tanh(s);
    }
    return out; // [-1..1]
  }

  clone() {
    const c = new Brain(this.inputSize, this.outputSize);
    c.W = this.W.map(row => row.slice());
    c.b = this.b.slice();
    return c;
  }

  mutate(rate = 0.12, strength = 0.5) {
    for (let o = 0; o < this.outputSize; o++) {
      for (let i = 0; i < this.inputSize; i++) {
        if (Math.random() < rate) this.W[o][i] += rand(-strength, strength);
      }
      if (Math.random() < rate) this.b[o] += rand(-strength, strength);
    }
  }
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
