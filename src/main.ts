import { Game } from "./core/Game";


const canvas = document.querySelector<HTMLCanvasElement>("#game")!;
canvas.width = 900;
canvas.height = 700;

const game = new Game(canvas);
game.start();  
