export class Track {
  cx = 450;
  cy = 350;
  outer = 280;
  inner = 160;

  checkpointCount = 12;
  checkpoints = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);
}
