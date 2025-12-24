import JSON5 from "../JSON5.js";
import defaultTheme from "../chart-theme.js";

/**
 * 
 * @param {HTMLElement} el 
 * @param {string|null} strOverride 
 * @returns 
 */
export function renderChart(el, strOverride = null) {
  let width = "max(300px, 100%)";
  if (!el?.parentElement) {
    return;
  }
  if (el.parentElement?.classList?.contains("page-props-cell")) {
    width = "300px";
  }
  el.innerHTML = `
			<div class="echart" style="width: ${width}; height: 300px"></div>
		`;

  const str = strOverride ?? el.getAttribute("options");
  let options = {};
  try {
    options = JSON5.parse(str);
  } catch (e) {
    console.log("Failed to parse", str);
    console.error(e);
  }

  let elChart = el.getElementsByClassName("echart")[0];

  var script = document.createElement("script");
  script.onload = function () {
    echarts.registerTheme("thymer", defaultTheme);

    let active = echarts.init(elChart, "thymer", {
      renderer: "svg",
    });
    active.setOption(options);
  };
  script.src = "https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js";
  document.head.appendChild(script);
}

export class Chart extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {}

  render() {
    renderChart(this);
  }
}