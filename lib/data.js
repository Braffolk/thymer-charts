import JSON5 from "../JSON5.js";
import {openFormModal} from "./modal.js";

/**
 *
 * @param {CollectionPlugin} obj
 */
export function registerDataUI(obj) {
  if (!customElements.get("echarts-data")) {
    customElements.define("echarts-data", EchartsData);
  }

  obj.properties.render("data", ({ record, prop }) => {
    let val = prop.text() || "{}";

    /** @type {EchartsData} */
    const el = document.createElement("echarts-data");
    el.val = val;
    el.ui = obj.ui;
    el.prop = prop;


    el.setAttribute("val", val);

    return el;
  });

}

export function parseData(val) {
  if (!val) {
    return null;
  }
  if (val?.dimensions && val?.source) {
    return val;
  }

  if (typeof val === "string") {
    try {
      let obj = JSON5.parse(val);
      if (obj?.dimensions && obj?.source) {
        return obj;
      } else {
        throw Error(`Uknown data ${obj}`);
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

export function renderDataset(obj) {
  if (!obj?.dimensions || !obj?.source) {
    return `<h3>Invalid data</h3>`;
  }
  let html = "<table>";
  html += "<thead><tr>";
  obj.dimensions.forEach(
    (d) => (html += `<th>${d?.name ?? d?.displayName ?? d}</th>`)
  );
  html += "</tr></thead>";
  html += "<tbody>";
  obj.source.forEach((r) => {
    html += "<tr>";
    obj.dimensions.forEach((_, i) => {
      html += `<td>${r[i]}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody>";
  html += "</table>";

  return html;
}

export class EchartsData extends HTMLElement {
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
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.gap = "8px";

    let content = this.getAttribute("val");
    let data = parseData(content);
    let dataPreview = renderDataset(data);

    // 1. Show a preview of the value
    const preview = document.createElement("div");
    preview.style.flex = "1";
    preview.style.overflow = "hidden";
    preview.style.textOverflow = "ellipsis";
    preview.style.whiteSpace = "nowrap";
    preview.innerHTML = dataPreview ?? "Invalid";

    const dataEntry = () => {
      openFormModal(
        {
          "data": "textarea"
        },
        "Edit data",
        {
          "data": content
        }
      ).then((result) => {
        if (!result) {
          return;
        }
        console.log("results", result);
        this.prop?.set(result.data)
      })
    };

    const editBtn = this.ui?.createButton({
        label: "Edit data",
        icon: "ti-pencil", // check your icon list
        onClick: () => {
          dataEntry();
        }
    });

    container.addEventListener("click", (e) => e?.stopPropagation());

    container.appendChild(editBtn);
    container.appendChild(preview);

    container.style.display = "flex";
    container.style.flexDirection = "column";

    this.replaceChildren(container);
  }
}
