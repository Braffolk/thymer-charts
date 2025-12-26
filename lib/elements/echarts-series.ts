import { property } from "lit/decorators.js";
import JSON5 from "../JSON5.js";
import { ModalFieldType, openFormModal } from "./form-modal.js";
import { LitElement, css, html, } from "lit";
import { buttonStyles } from "./styles.js";
import { parseDataset } from "../parse/parse.js";

export function parseSeries(str: string | null | undefined) {
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
  static styles = css`
    ${buttonStyles}
  `;

  @property()
  ui: UIAPI | null = null;

  @property()
  prop: PluginProperty | undefined = undefined;

  @property()
  record: PluginRecord | undefined = undefined;

  render() {
    let str = this.prop?.text();
    let entries = parseSeries(str);

    const encodeKeys: string[] = [];
    const seen = new Set<string>();
    for (const e of entries) {
      const enc = (e as any)?.encode;
      if (!enc || typeof enc !== "object") continue;
      for (const k of Object.keys(enc)) {
        if (!seen.has(k)) {
          seen.add(k);
          encodeKeys.push(k);
        }
      }
    }
    
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
            ${encodeKeys.map((k) => html`<th>${k}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${entries.map(e =>
            html`<tr>
              <td>${(e.type ? e.type?.toString() : "-")}</td>
              ${encodeKeys.map((k) => {
                const v = (e as any)?.encode?.[k];
                return html`<td>${v == null ? "-" : String(v)}</td>`;
              })}
            </tr>`
          )}
        </tbody>
      </table>
    `;
  }

  _editModal() {
    let content = this.prop?.text() ?? '';
    let family = this.record.prop('family').text() ?? 'cartesian';
    let dataset = parseDataset(this.record.prop('data').text())?.dataset;
    let fieldType = `s.${family}` as ModalFieldType;
    openFormModal(
      {
        "series": fieldType
      },
      "Edit series",
      {
        "series": parseSeries(content)
      },
      {
        "family": family,
        "data": dataset
      }
    ).then((result) => {
      if (!result) {
        return;
      }
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
      el.record = record;
      return el;
    });
  }
}