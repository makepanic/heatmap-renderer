import { Brush, filterBlur, shadowBlur, supportsContextFilters } from "./brush";
import { blur } from "./blur";
import { CircleShape } from "../register-default-shapes";

export const circleBrush = ({ radius }: CircleShape): Brush => {
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2 + shadowBlur * 2;
  canvas.height = radius * 2 + shadowBlur * 2;
  const ctx = canvas.getContext("2d")!;

  if (supportsContextFilters) {
    ctx.filter = `blur(${filterBlur}px)`;
  }

  const x = radius;
  const y = radius;

  ctx.beginPath();
  // circle shadow
  ctx.shadowColor = "rgba(0,0,0,1)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = shadowBlur;

  // regular fill
  ctx.arc(x + shadowBlur, y + shadowBlur, radius, 0, 2 * Math.PI, false);
  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fill();

  if (!supportsContextFilters) {
    blur(ctx, `${filterBlur}`);
  }

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    offsetX: -shadowBlur,
    offsetY: -shadowBlur,
  };
};
