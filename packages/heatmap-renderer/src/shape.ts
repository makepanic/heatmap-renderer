export enum ShapeType {
  circle,
  rectangle,
  diamond,
  path,
}
export interface BaseShape {
  x: number;
  y: number;
  value: number;
  type: ShapeType;
}
