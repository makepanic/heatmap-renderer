import GUI from "lil-gui";
import { collision } from "./examples/collision";
import { followCursor } from "./examples/follow-cursor";
import { ExampleResult } from "./examples/example";

import "normalize.css/normalize.css";

const gui = new GUI();

const wrapper = document.querySelector(
  "#heatmapContainerWrapper"
) as HTMLElement;

let i = 0;

const initialWidth = wrapper.clientWidth;
const initialHeight = wrapper.clientHeight;
let example: ExampleResult = collision(wrapper);

const options = {
  demo: collision,
  resize() {
    let width = 777;
    let height = 555;
    i++;
    if (i % 2 === 0) {
      width = initialWidth;
      height = initialHeight;
    }

    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    example?.heatmap.resize(width, height);
    example?.heatmap.redraw();
  },
};

gui
  .add(options, "demo", {
    Shapes: collision,
    FollowCursor: followCursor,
  })
  .onChange((value: any) => {
    if (example) {
      example.destroy();
    }
    example = value(wrapper);
  });
gui.add(options, "resize");
