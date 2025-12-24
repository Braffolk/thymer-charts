import JSON5 from "./lib/JSON5.js";

import { EchartsSeries } from "./lib/elements/echarts-series.js";
import { EchartsData } from "./lib/elements/echarts-data.js";
import { FormModal } from "./lib/elements/form-modal.js";
import { parseData } from "./lib/helpers.js";
import { EchartsChart, observeAndInject } from "./lib/elements/echarts-chart.js";

export class Plugin extends CollectionPlugin {
  observer: MutationObserver | null = null

  onLoad() {
    EchartsChart.register(this);
    EchartsData.register(this);
    EchartsSeries.register(this);
    FormModal.register();

    this.properties.formula("options", ({ record }) => {
      const xaxis = record.text("x-axis");
      const yaxis = record.text("y-axis");
      let dataText = record.text("data");
      let data = parseData(dataText);
      if (!data) {
        data = {
          source: [],
          dimensions: [],
        };
      }
      let seriesText = record.text("series");
      let series = [];
      try {
        series = JSON5.parse(seriesText);
        if (!Array.isArray(series)) {
          series = [];
        }
      } catch (e) {
        console.error(e);
        console.log("Failed to parse series", series);
        series = [];
      }

      let opts = {
        dataset: data,
        xAxis: {
          type: xaxis,
        },
        legend: {},
        tooltip: {
          trigger: "axis",
        },
        yAxis: {
          type: yaxis,
        },
        series: series,
      };
      return JSON.stringify(opts);
    });

    this.startObserving();
    this.views.afterRenderGalleryCard(
      "Gallery",
      ({ record, view, element }) => {
        element
          .getElementsByClassName("gallery-view-card-banner-container")?.[0]
          ?.remove();
      }
    );
  }

  startObserving() {
    this.observer = observeAndInject(this);
  }

  onUnload() {
    if (this.observer) this.observer.disconnect();
  }
}
