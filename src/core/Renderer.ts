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
        this.ctx.fillStyle = "#0f141a";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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

        // sensores (primeiro pra ficar por baixo do carro)
        this.drawSensors(car);

        ctx.save();
        ctx.translate(car.x, car.y);
        ctx.rotate(car.angle);

        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(-10, -20, 20, 40);

        // “frente” do carro
        ctx.fillStyle = "#0b0d10";
        ctx.fillRect(-3, -20, 6, 8);

        ctx.restore();
    }

    private drawSensors(car: Car) {
        const { ctx } = this;

        for (const r of car.sensors.rays) {
            // raio base
            ctx.beginPath();
            ctx.moveTo(r.x1, r.y1);

            const endX = r.hit ? r.hit.px : r.x2;
            const endY = r.hit ? r.hit.py : r.y2;

            ctx.lineTo(endX, endY);
            ctx.strokeStyle = "rgba(16,185,129,0.9)"; // verde
            ctx.lineWidth = 2;
            ctx.stroke();

            // restante do raio (até o máximo), em vermelho
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(r.x2, r.y2);
            ctx.strokeStyle = "rgba(239,68,68,0.45)"; // vermelho
            ctx.lineWidth = 2;
            ctx.stroke();

            // ponto de impacto
            if (r.hit) {
                ctx.beginPath();
                ctx.arc(r.hit.px, r.hit.py, 4, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(251,191,36,0.95)"; // amarelo
                ctx.fill();
            }
        }
    }
}
