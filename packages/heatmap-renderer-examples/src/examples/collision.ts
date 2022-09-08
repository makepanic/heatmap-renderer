import { ShapeType, Heatmap } from "@makepanic/heatmap-renderer/src";
import {
  DefaultShapes,
  registerDefaultShapes,
} from "@makepanic/heatmap-renderer/src/register-default-shapes";
import { Example } from "./example";

interface Vel {
  x: number;
  y: number;
}
interface O {
  vel: Vel;
  shape: DefaultShapes;
}

const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
}

const pathSize = (
    field: "x" | "y",
    path: { x: number; y: number }[]
): number => {
  const { s0, s1 } = path.reduce(
      (all, p) => ({
        s0: Math.min(all.s0, p[field]),
        s1: Math.max(all.s1, p[field]),
      }),
      { s0: +Infinity, s1: 0 }
  );

  return s1 - s0;
};
const w = (r: DefaultShapes) =>
    r.type === ShapeType.rectangle
        ? r.width
        : r.type === ShapeType.circle || r.type === ShapeType.diamond
            ? r.radius * 2
            : pathSize("x", r.points);
const h = (r: DefaultShapes) =>
    r.type === ShapeType.rectangle
        ? r.height
        : r.type === ShapeType.circle || r.type === ShapeType.diamond
            ? r.radius * 2
            : pathSize("y", r.points);
const r = () => Math.random();
const r2 = () => 2 * r() * (getRandomInt(6) - 3);
const num = () => Math.floor(getRandomInt(100));
const move = (o: O, maxWidth: number, maxHeight: number) => {
  if (o.shape.x + w(o.shape) + o.vel.x > maxWidth) {
    o.vel.x *= -1;
  } else if (o.shape.x + o.vel.x < 0) {
    o.vel.x *= -1;
  }
  if (o.shape.y + +h(o.shape) + o.vel.y > maxHeight) {
    o.vel.y *= -1;
  } else if (o.shape.y + o.vel.y < 0) {
    o.vel.y *= -1;
  }

  o.shape.x += o.vel.x;
  o.shape.y += o.vel.y;
};

export const collision: Example = (wrapper: HTMLElement) => {
  let running = true;

  const genShape = (): O => {
    const rn = r();
    const x = document.body.clientWidth / 2;
    const y = document.body.clientHeight / 2;
    if (rn <= 1 / 4) {
      return {
        vel: { x: r2(), y: r2() },
        shape: { value: num(), x, y, radius: 40, type: ShapeType.diamond },
      };
    } else if (rn <= 2 / 4) {
      return {
        vel: { x: r2(), y: r2() },
        shape: { value: num(), x, y, radius: 20, type: ShapeType.circle },
      };
    } else if (rn <= 3 / 4) {
      return {
        vel: { x: r2(), y: r2() },
        shape: {
          value: num(),
          x,
          y,
          points: [
            { x: 0, y: 100 },
            { x: 0, y: 0 },
            { x: 200, y: 0 },
            { x: 200, y: 100 },
          ],
          type: ShapeType.path,
        },
      };
    } else {
      return {
        vel: { x: r2(), y: r2() },
        shape: {
          value: num(),
          x,
          y,
          width: r() * 200,
          height: r() * 100,
          type: ShapeType.rectangle,
        },
      };
    }
  };

  const objects: O[] = [...new Array(256).keys()].map(() => genShape());

  const heatmap = new Heatmap(wrapper, {
    max: objects.reduce((max, val) => Math.max(max, val.shape.value), 0),
    debug: true,
  });
  registerDefaultShapes(heatmap);

  const render = () => {
    objects.forEach((o) => move(o, heatmap.width, heatmap.height));
    heatmap.render(objects.map((o) => o.shape));
  };
  const renderFrame = () => {
    requestAnimationFrame(() => {
      if (!running) return;
      render();
      renderFrame();
    });
  };

  renderFrame();

  return {
    heatmap,
    destroy: () => {
      running = false;
      heatmap.destroy();
    },
  };
};
