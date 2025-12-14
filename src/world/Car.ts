import { Input } from "../core/Input";
import { Track } from "./Track";
import { Sensors } from "./Sensors";
import { Brain } from "../ai/Brain";

export class Car {
    x = 450 + 220;
    y = 350;
    angle = Math.PI;
    speed = 0;

    sensors = new Sensors();

    alive = true;
    fitness = 0;

    // V3.1 - stuck detection
    stuckTime = 0;
    lastX = this.x;
    lastY = this.y;
    lastTheta = Math.atan2(this.y - 350, this.x - 450);
    prevSteer = 0;
    checkpointIndex = 0;

    brain?: Brain;

    update(dt: number, input: Input | null, track: Track) {
        if (!this.alive) return;

        const accel = 500;
        const drag = 220;
        const maxFwd = 420;
        const maxRev = -180;
        const steerPower = 2.6;

        // sensores sempre atualizam
        this.sensors.update(this.x, this.y, this.angle, track);

        // freio automático quando perto da parede
        const danger = Math.max(...this.sensors.readings); // 0..1 (1 = parede perto)
        const autoBrake = danger > 0.75;

        // decide ação (manual ou IA)
        let forward = false;
        let brake = false;
        let steer = 0;

        if (this.brain) {
            const inputs = [
                ...this.sensors.readings,                         // 0..1
                Math.max(-1, Math.min(1, this.speed / maxFwd)),   // speed norm
            ];
            const [oSteer, oThrottle, oBrake] = this.brain.forward(inputs);
            steer = oSteer;                 // [-1..1]
            forward = oThrottle > 0;        // bool
            brake = oBrake > 0.2;
        } else if (input) {
            forward = input.forward;
            brake = input.brake;
            steer = input.steer;
        }

        // aplica freio automático
        if (autoBrake) {
            brake = true;
            forward = false;
        }

        // suaviza steering (reduz nervosismo)
        steer = this.prevSteer * 0.7 + steer * 0.3;
        this.prevSteer = steer;

        // acelera / ré
        if (forward) this.speed += accel * dt;
        if (brake) this.speed -= accel * dt;

        // atrito
        if (!forward && !brake) this.speed -= Math.sign(this.speed) * drag * dt;

        // limites
        if (this.speed > maxFwd) this.speed = maxFwd;
        if (this.speed < maxRev) this.speed = maxRev;

        // direção
        const speedNorm = Math.min(Math.abs(this.speed) / maxFwd, 1);
        const steerFactor = 0.25 + 0.75 * speedNorm;
        this.angle += steer * steerPower * steerFactor * dt * Math.sign(this.speed || 1);

        // mover
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;

        // colisão: prende no anel (e mata, pra evolução aprender)
        const dx = this.x - track.cx;
        const dy = this.y - track.cy;
        const d = Math.hypot(dx, dy);
        const carRadius = 14;

        if (d > track.outer - carRadius) {
            const k = (track.outer - carRadius) / d;
            this.x = track.cx + dx * k;
            this.y = track.cy + dy * k;
            this.speed = 0;
            this.fitness -= 50;
            this.alive = false;
        }

        if (d < track.inner + carRadius) {
            const k = (track.inner + carRadius) / d;
            this.x = track.cx + dx * k;
            this.y = track.cy + dy * k;
            this.speed = 0;
            this.fitness -= 50;
            this.alive = false;
        }

        // ---- FITNESS MELHOR (V3.1) ----
        const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
        this.lastX = this.x;
        this.lastY = this.y;

        // ---- CHECKPOINTS (V4) ----
        const theta = Math.atan2(this.y - track.cy, this.x - track.cx);
        const target = track.checkpoints[this.checkpointIndex];

        // distância angular pequena
        const diff = Math.atan2(Math.sin(theta - target), Math.cos(theta - target));

        if (Math.abs(diff) < 0.18) { // ~10 graus
            this.checkpointIndex = (this.checkpointIndex + 1) % track.checkpointCount;
            this.fitness += 30; // recompensa forte
        }

        // progresso angular na pista (anti-horário)
        let dTheta = theta - this.lastTheta;

        // normaliza pra [-PI, PI]
        if (dTheta > Math.PI) dTheta -= Math.PI * 2;
        if (dTheta < -Math.PI) dTheta += Math.PI * 2;

        this.lastTheta = theta;

        // recompensa por avançar no sentido anti-horário
        this.fitness += Math.max(0, dTheta) * 30;

        // travou?
        if (moved < 0.2) this.stuckTime += dt;
        else this.stuckTime = 0;

        // se ficar travado ~1.2s, morre
        if (this.stuckTime > 1.2) {
            this.fitness -= 5;
            this.alive = false;
        }
    }

    reset() {
        this.x = 450 + 220;
        this.y = 350;
        this.angle = Math.PI;
        this.speed = 0;
        this.alive = true;
        this.fitness = 0;
        this.stuckTime = 0;
        this.lastX = this.x;
        this.lastY = this.y;
        this.lastTheta = Math.atan2(this.y - 350, this.x - 450);
        this.prevSteer = 0;
        this.checkpointIndex = 0;
    }
}
