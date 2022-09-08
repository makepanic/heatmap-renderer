import { Heatmap } from "./heatmap";
import { BaseShape, ShapeType } from "./shape";
import { circleBrush } from "./brushes/circle";
import { diamondBrush } from "./brushes/diamond";
import { pathBrush } from "./brushes/path";
import { rectangleBrush } from "./brushes/rectangle";

export interface CircleShape extends BaseShape {
  radius: number;
  type: ShapeType.circle;
}
export interface DiamondShape extends BaseShape {
  radius: number;
  type: ShapeType.diamond;
}
export interface RectangleShape extends BaseShape {
  width: number;
  height: number;
  type: ShapeType.rectangle;
}
export interface PathShape extends BaseShape {
  type: ShapeType.path;
  points: { x: number; y: number }[];
}

export type DefaultShapes =
  | CircleShape
  | DiamondShape
  | RectangleShape
  | PathShape;

export function registerDefaultShapes(heatmap: Heatmap) {
  heatmap.registerShape({
    type: ShapeType.circle,
    id: (item: CircleShape) => `${item.radius}`,
    brushFactory: circleBrush,
  });
  heatmap.registerShape({
    type: ShapeType.rectangle,
    id: (item: RectangleShape) => `${item.width}${item.height}`,
    brushFactory: rectangleBrush,
  });
  heatmap.registerShape({
    type: ShapeType.diamond,
    id: (item: DiamondShape) => `${item.radius}`,
    brushFactory: diamondBrush,
  });
  heatmap.registerShape({
    type: ShapeType.path,
    id: (item: PathShape) => JSON.stringify(item.points),
    brushFactory: pathBrush,
  });

  return heatmap;
}
