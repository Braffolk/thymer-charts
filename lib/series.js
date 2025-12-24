import JSON5 from "../JSON5.js";


/**
 *
 * @param {CollectionPlugin} obj
 */
export function registerSeriesUI(obj) {
  if (!customElements.get("echarts-data")) {
    customElements.define("echarts-data", EchartsSeries);
  }

  if (!customElements.get("echarts-series")) {
      customElements.define("echarts-series", EchartsSeries);
    }

    obj.properties.render("series", ({ record, prop, view }) => {
      let val = prop.text() || "{}";

      const el = document.createElement("echarts-series");
      el.val = val;
      el.ui = obj.ui;
      el.prop = prop;
      el.setAttribute("val", val);
      return el;
    });


}

export class EchartsSeries extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {}

  render() {
    let entries = [];
    let isInvalid = false;
    try {
      let str = this.getAttribute("val");
      let obj = JSON5.parse(str);
      if (!Array.isArray(obj)) {
        entries = [obj];
      } else {
        entries = obj;
      }
    } catch (e) {
      console.error("Failed to parse series");
      console.error(e);
    }
    let html = "<table>";
    html += "<thead>";
      html += "<tr>";
        html += "<th>Type</th>";
        html += "<th>X</th>";
        html += "<th>Y</th>";
      html += "</tr>";
    html += "</thead>";

    html += "<tbody>";
    entries.forEach((e) => {
      html += "<tr>";
      html += "<td>"
        + (e.type ? e.type.toString() : "-")
        + "</td>";
      html += "<td>"
        + (e.encode?.x ? e.encode?.x.toString() : "-")
        + "</td>";
      html += "<td>"
        + (e.encode?.y ? e.encode?.y.toString() : "-")
        + "</td>";
      
      html += "</tr>";
    });
    html += "</tbody></table>";
    this.innerHTML = html;
  }
}