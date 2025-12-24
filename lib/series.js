import JSON5 from "../JSON5.js";
import { openFormModal } from "./modal.js";


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
  /** @type {UIAPI | null} */
  ui = null;
  /** @type {string | null | undefined | object | Array<any>} */
  val = null;
  /** @type {PluginProperty | undefined} */
  prop = undefined;

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

    const randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const uniqid = randLetter + Date.now();
    const btnId = `btn-${uniqid}`;
    

    let html = "";
    html += html += `<button id="${btnId}" class="button-normal button-normal-hover button-small"><span class="ti ti-pencil"></span>Edit series</button>`;

    html += "<table>";
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

    let content = this.prop?.text() ?? '';

    let elBtn = document.getElementById(btnId);
    elBtn?.addEventListener("click", () => {
      openFormModal(
        {
          "series": "textarea"
        },
        "Edit series",
        {
          "series": content
        }
      ).then((result) => {
        if (!result) {
          return;
        }
        console.log("results", result);
        this.prop?.set(result.series ?? content)
      })
    })
  }
}