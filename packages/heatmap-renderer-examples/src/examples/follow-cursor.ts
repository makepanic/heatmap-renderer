import { Heatmap, ShapeType } from "@makepanic/heatmap-renderer/src";
import {
  CircleShape,
  registerDefaultShapes,
} from "@makepanic/heatmap-renderer/src/register-default-shapes";
import { Example } from "./example";

const radius = 20;
const max = 10;

export const followCursor: Example = (wrapper: HTMLElement) => {
  const circles: CircleShape[] = [];

  const heatmap = new Heatmap(wrapper, {
    max,
    debug: false,
  });
  registerDefaultShapes(heatmap);

  const rerender = () => {
    heatmap.render(circles);
  };
  const pointerMove = (event: PointerEvent) => {
    circles.push({
      type: ShapeType.circle,
      radius: radius,
      value: 1,
      x: event.offsetX - radius,
      y: event.offsetY - radius,
    });
    requestAnimationFrame(rerender);
  };

  wrapper.addEventListener("pointermove", pointerMove, false);

  return {
    heatmap,
    destroy: () => {
      wrapper.removeEventListener("pointermove", pointerMove);
      heatmap.destroy();
    },
  };
};
