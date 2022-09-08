import { Heatmap } from "@makepanic/heatmap-renderer";

export interface ExampleResult {
  destroy: Function;
  heatmap: Heatmap;
}
export type Example = (wrapper: HTMLElement) => ExampleResult;
