import {
  Brush,
  filterBlur,
  halfLineWidth,
  lineWidth,
  shadowBlur,
  supportsContextFilters,
} from "./brush";
import { blur } from "./blur";
import { PathShape } from "../register-default-shapes";

export const pathBrush = (shape: PathShape): Brush => {
  const offsetX = -shadowBlur - halfLineWidth;
  const offsetY = -shadowBlur - halfLineWidth;

  let rect = { x0: 0, y0: 0, x1: 0, y1: 0 };
  const points: [x: number, y: number][] = [];

  shape.points.forEach(({ x, y }) => {
    rect.x0 = Math.min(rect.x0, x);
    rect.x1 = Math.max(rect.x1, x);
    rect.y0 = Math.min(rect.y0, y);
    rect.y1 = Math.max(rect.y1, y);

    points.push([x, y]);
  });

  let width = rect.x1 - rect.x0;
  let height = rect.y1 - rect.y0;

  const canvas = document.createElement("canvas");
  canvas.width = width + shadowBlur * 2 + lineWidth;
  canvas.height = height + shadowBlur * 2 + lineWidth;
  const ctx = canvas.getContext("2d")!;
  ctx.lineWidth = lineWidth;

  if (supportsContextFilters) {
    ctx.filter = `blur(${filterBlur}px)`;
  }

  ctx.beginPath();
  ctx.shadowColor = "rgba(0,0,0,1)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = shadowBlur;

  points.forEach(([x, y]) => {
    ctx.lineTo(x + halfLineWidth + shadowBlur, y + halfLineWidth + shadowBlur);
  });
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.stroke();

  if (!supportsContextFilters) {
    blur(ctx, `${filterBlur}`);
  }

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    offsetX,
    offsetY,
  };
};
