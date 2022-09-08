export interface Brush {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
}

export const shadowBlur = 40;
export const filterBlur = 8;
export const lineWidth = 8;
export const halfLineWidth = lineWidth / 2;

// detects feature availability
export const supportsContextFilters =
  "filter" in CanvasRenderingContext2D.prototype;
