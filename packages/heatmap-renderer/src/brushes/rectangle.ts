import { Brush, filterBlur, shadowBlur, supportsContextFilters } from "./brush";
import { blur } from "./blur";
import {RectangleShape} from "../register-default-shapes";

export const rectangleBrush = (shape: RectangleShape): Brush => {
  const canvas = document.createElement("canvas");
  canvas.width = shape.width + shadowBlur * 2;
  canvas.height = shape.height + shadowBlur * 2;
  const ctx = canvas.getContext("2d")!;

  if (supportsContextFilters) {
    ctx.filter = `blur(${filterBlur}px)`;
  }

  ctx.beginPath();

  ctx.shadowColor = "rgba(0,0,0,1)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = shadowBlur;

  ctx.fillStyle = "rgba(0,0,0,1)";
  ctx.fillRect(shadowBlur, shadowBlur, shape.width, shape.height);

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
