import { blur } from "./blur";
import { Brush, filterBlur, shadowBlur, supportsContextFilters } from "./brush";
import { DiamondShape } from "../register-default-shapes";

export const diamondBrush = (shape: DiamondShape): Brush => {
  const radius = shape.radius;
  const diameter = radius * 2;

  const canvas = document.createElement("canvas");
  canvas.width = diameter + radius + shadowBlur * 2;
  canvas.height = diameter + radius + shadowBlur * 2;
  const ctx = canvas.getContext("2d")!;

  if (supportsContextFilters) {
    ctx.filter = `blur(${filterBlur}px)`;
  }

  ctx.beginPath();

  ctx.shadowColor = "rgba(0,0,0,1)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = shadowBlur;

  const x = radius;
  const y = radius;

  // top center
  ctx.moveTo(shadowBlur + x + radius, shadowBlur + y);

  // middle right
  ctx.lineTo(shadowBlur + x + diameter, shadowBlur + y + radius);

  // bottom center
  ctx.lineTo(shadowBlur + x + radius, shadowBlur + y + diameter);

  // middle left
  ctx.lineTo(shadowBlur + x, shadowBlur + y + radius);

  // closing the path automatically creates
  // the top right edge
  ctx.closePath();

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
