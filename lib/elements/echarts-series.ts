import { property } from "lit/decorators.js";
import JSON5 from "../JSON5.js";
import { openFormModal } from "./form-modal.js";
import { LitElement, css, html, } from "lit";

function parseEntries(str: string | null | undefined) {
  let entries = [];
  try {
    let obj = JSON5.parse(str);
    if (!Array.isArray(obj) && obj) {
      entries = [obj];
    } else if (Array.isArray(obj)) {
      entries = obj;
    }
  } catch (e) {
    console.error("Failed to parse series");
    console.error(e);
  }
  return entries;
}


export class EchartsSeries extends LitElement {
  @property()
  ui: UIAPI | null = null;

  @property()
  prop: PluginProperty | undefined = undefined;

  render() {
    let str = this.prop?.text();
    let entries = parseEntries(str);
    
    return html`
      <button
        @click=${this._editModal}
        @interceptedclick=${this._editModal}
      >
        <span class="ti ti-pencil"></span>Edit series
      </button>

      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>X</th>
            <th>Y</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map(e => 
            html`<tr>
              <td>${(e.type ? e.type?.toString() : "-")}</td>
              <td>${(e.encode?.x ? e.encode?.x.toString() : "-")}</td>
              <td>${(e.encode?.y ? e.encode?.y.toString() : "-")}</td>
            </tr>`
          )}
        </tbody>
      </table>
    `;
  }

  _editModal() {
    let content = this.prop?.text() ?? '';
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
  }

  static register(plugin: CollectionPlugin) {
    if (!customElements.get("echarts-series")) {
      customElements.define("echarts-series", EchartsSeries);
    }

    plugin.properties.render("series", ({ record, prop, view }) => {
      let val = prop.text() || "{}";

      const el = document.createElement("echarts-series") as EchartsSeries;
      el.ui = plugin.ui;
      el.prop = prop;
      return el;
    });
  }
}