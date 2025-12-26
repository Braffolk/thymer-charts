import { EchartsSeries } from "./lib/elements/echarts-series.js";
import { EchartsData } from "./lib/elements/echarts-data.js";
import { FormModal } from "./lib/elements/form-modal.js";
import { EchartsChart, observeAndInjectChartEmbeds } from "./lib/elements/echarts-chart.js";
import { chartGalleryViewHooks } from "./lib/views/chart-gallery.js";
import { createEchartsOptionsObject } from "./lib/formula.js";
import { observeAndModifyChartEditor } from "./lib/views/chart-editor-injecter.js";
import { EchartsSeriesInput } from "./lib/elements/echarts-series-input.js";

export class Plugin extends CollectionPlugin {
  destructors: Array<() => void> = [];

  onLoad() {
    console.log(`thymer-charts loaded ${new Date().toTimeString()}`);
    EchartsChart.register(this);
    EchartsData.register(this);
    EchartsSeries.register(this);
    FormModal.register();
    EchartsSeriesInput.register(this);

    this.properties.formula("options", createEchartsOptionsObject);

    this.startObserving();
    this.views.register("Gallery", chartGalleryViewHooks);
  }

  startObserving() {
    this.destructors.push(observeAndInjectChartEmbeds(this));
    this.destructors.push(observeAndModifyChartEditor(this));
  }

  onUnload() {
    while (this.destructors.length > 0) {
      try {
        this.destructors.pop()?.();
      } catch (e) {
        console.error(e);
      }
    }
  }
}
