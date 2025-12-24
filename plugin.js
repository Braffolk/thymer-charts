import JSON5 from "./JSON5.js";

import { EchartsSeries, registerSeriesUI } from "./lib/series.js";
import {parseData, renderDataset, EchartsData, registerDataUI} from "./lib/data.js";
import {renderChart, Chart} from "./lib/chart.js";


export class Plugin extends CollectionPlugin {
  onLoad() {
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

	registerDataUI(this);
	registerSeriesUI(this);

    if (!customElements.get("e-chart")) {
      customElements.define("e-chart", Chart);
    }

    this.properties.render("options", ({ record, prop, view }) => {
      let options = prop.text() || "{}";

      const el = document.createElement("e-chart");

      el.setAttribute("options", options);
      return el;
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
    const targetClass = ".lineitem-ref.clickable";

    const attach = (el) => {
      if (el.classList.contains("chart-widget-hijack")) {
        return;
      }

      const guid = el.getAttribute("data-guid");
      if (!guid) return;
      const record = this.data.getRecord(guid);
      const row = record?.row;

      if (!row?.kv?.series) {
        return;
      }
      const allProps = record?.getAllProperties();
      const options = allProps?.find((o) => o.name === "options")?.value?.[1];
      if (!options) {
        return;
      }

      el.dataset.hasChart = "true";
      el.classList.add("chart-widget-hijack");

      const chartContainer = document.createElement("div");
      chartContainer.style.width = "100%";
      chartContainer.style.height = "100%";
      chartContainer.textContent = "";

      el.appendChild(chartContainer);
      setTimeout(() => {
        console.log("el", el);
        if (chartContainer) {
          el.parentElement.style.display = "flex";
          el.parentElement.style.width = "100%";
          el.style.background = "transparent";
          el.style.border = "none";
          el.style.width = "100%";
          renderChart(chartContainer, options);
        }
      }, 1);
    };

    // 2. MUTATION OBSERVER (The Robot Logic)
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          // Check if it's an element
          if (node.nodeType === 1) {
            // Check if the node itself is a link button
            if (node.classList.contains(targetClass)) {
              attach(node);
            }
            // Check if the node CONTAINS link buttons (e.g. a whole paragraph pasted in)
            else if (node.querySelectorAll) {
              node.querySelectorAll(targetClass).forEach(attach);
            }
          }
        });
      });
    });

    // Watch the whole body, just like the Robot
    this.observer.observe(document.body, { childList: true, subtree: true });

    // Attach to existing ones on load
    setTimeout(() => {
      document.querySelectorAll(targetClass).forEach(attach);
    }, 1000);
  }

  onUnload() {
    if (this.observer) this.observer.disconnect();
  }
}
