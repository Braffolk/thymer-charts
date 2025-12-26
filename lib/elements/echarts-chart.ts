import JSON5 from "../JSON5.js";
import defaultTheme from "../chart-theme.js";
import { html, css, LitElement, PropertyValues } from "lit";
import { customElement, property } from 'lit/decorators.js';
import { withObserverModifier } from "../helpers/observe-modifier.js";

const ECHARTS_SRC =
  "https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js";

function loadScriptOnce(src: string) {
  // cache on window to avoid duplicates across multiple instances
  let w = window as any;
  if (!w.__echartsScriptPromise) {
    w.__echartsScriptPromise = new Promise((resolve, reject) => {
      // already loaded?
      if (w.echarts) return resolve(w.echarts);

      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        existing.addEventListener("load", () => resolve(w.echarts));
        existing.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve(w.echarts);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return w.__echartsScriptPromise;
}

export class EchartsChart extends LitElement {
  static styles = css`
    .chart {
      width: max(300px, 100%);
      height: 300px;
    }
  `;

  @property()
  options: string | Promise<string> = "{}"

  _chart: any | null = null;
  _ro: ResizeObserver | null = null
  _resizeTimer: any | null = null

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // cleanup ResizeObserver + debounce timer
    if (this._ro) {
      this._ro.disconnect();
      this._ro = null;
    }
    if (this._resizeTimer) {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = null;
    }

    // cleanup chart
    if (this._chart) {
      this._chart.dispose();
      this._chart = null;
    }
  }

  async _parseOptions() {
    let str = this.options ?? this.getAttribute("options") ?? "";
    if (!!str && typeof str !== 'string' && typeof str.then === 'function') {
      str = await str;
    }
    if (!str) return {};
    try {
      return JSON5.parse(str);
    } catch (e) {
      console.log("Failed to parse", str);
      console.error(e);
      return {};
    }
  }

  _queueResize(delayMs: number = 80) {
    if (!this._chart) return;

    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      this._resizeTimer = null;
      if (this._chart) this._chart.resize();
    }, delayMs);
  }

  async firstUpdated() {
    await loadScriptOnce(ECHARTS_SRC);

    const el = this.renderRoot.querySelector(".chart");
    if (!el) return;

    let w = window as any;

    // register theme once per page
    if (!w.__thymerEchartsThemeRegistered) {
      w.echarts.registerTheme("thymer", defaultTheme);
      w.__thymerEchartsThemeRegistered = true;
    }

    // init on the actual div inside shadow DOM
    this._chart = w.echarts.init(el, "thymer", { renderer: "svg" });
    this._chart.setOption(await this._parseOptions(), true);

    // Observe element size changes (NOT window resize)
    this._ro = new ResizeObserver(() => {
      this._queueResize(80); // tweak 50-150ms if you want
    });
    this._ro.observe(el);

    // optional: catch initial layout settling
    this._queueResize(0);
  }

  updated(changed: PropertyValues<this>) {
    // apply new options when attribute/property changes
    if (changed.has("options") && this._chart) {
      this._parseOptions().then(opts => {
        this._chart.setOption(opts, true);
        this._queueResize(0);
      })
    }
  }

  render() {
    return html`<div class="chart"></div>`;
  }

  static register(plugin: CollectionPlugin) {
    if (!customElements.get("echarts-chart")) {
      customElements.define("echarts-chart", EchartsChart);
    }

    plugin.properties.render("options", ({ record, prop, view }) => {
      let options = prop.text();

      const el = document.createElement("echarts-chart") as EchartsChart;
      el.options = options;
      el.style.width = "100%";
      return el;
    });
  }
}


export const observeAndInjectChartEmbeds = withObserverModifier({
  targetClass: ".lineitem-ref.clickable",
  callback: (plugin, el) => {
    if (el.classList.contains("noembed")) {
      return;
    }
    const guid = el.getAttribute("data-guid");
    if (!guid) return;
    const record = plugin.data.getRecord(guid);
    const row = record?.row;

    if (!row?.kv?.series) {
      return;
    }
    const allProps = record?.getAllProperties();
    const options = allProps?.find((o) => o.name === "options")?.value?.[1];
    if (!options) {
      return;
    }

    const chartContainer = document.createElement("div");
    chartContainer.style.width = "100%";
    chartContainer.style.height = "100%";
    chartContainer.textContent = "";

    el.appendChild(chartContainer);
    setTimeout(() => {
      if (chartContainer && options) {
        if (el.parentElement) {
          el.parentElement.style.display = "flex";
          el.parentElement.style.width = "100%";
        }
        el.style.background = "transparent";
        el.style.border = "none";
        el.style.width = "100%";
        let elChart = document.createElement("echarts-chart") as EchartsChart;
        elChart.options = options;
        el.replaceChildren(elChart);
      }
    }, 1);
  }
})
