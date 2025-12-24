import { css, html, LitElement, TemplateResult } from "lit";

import {openFormModal} from "../modal.js";
import { property } from "lit/decorators.js";
import {parseData} from "../helpers.js";
import { Dataset, Dimension } from "../types.js";


function name(o: string | Dimension | null): string {
  if (typeof o !== 'string') {
    return o?.displayName ?? o?.name ?? '';
  }
  return o?.toString();
}

export function renderDataset(obj: Dataset | null): TemplateResult {
  if (!obj?.dimensions || !obj?.source) {
    return html`<h3>Invalid data</h3>`;
  }
  return html`
    <table>
      <thead>
        <tr>
          ${obj.dimensions.map(o => html`<th>${name(o)}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${obj.source.map(r => 
          html`<tr>
            ${obj.dimensions.map((_, i) => html`<td>${r[i]}</tr>`)}
          </tr>`
        )}
      </tbody>
    </table>
  `;
}

export class EchartsData extends LitElement {
  static styles = css`
    .entry {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .preview {
      flex: 1;
      overflow: hidden;
    }
  `;

  @property()
  ui: UIAPI | null = null;

  @property()
  val: any = null;

  @property()
  prop: PluginProperty | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  _editModal() {
    let content = this.prop?.text();
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
  }

  render() {
    let content = this.prop?.text();
    console.log("content", content);
    let data = parseData(content);
    console.log("data", data);

    return html`
      <div class='entry'>
        <button
          class="button-normal button-normal-hover button-small"
          @click="${this._editModal}"
        >
          <span class="ti ti-pencil"></span>
          Edit data
        </button>
        <div class='preview'>
          ${renderDataset(data)}
        </div>
        
      </div>
    `;
  }

  static register(plugin: CollectionPlugin) {
    if (!customElements.get("echarts-data")) {
      customElements.define("echarts-data", EchartsData);
    }

    plugin.properties.render("data", ({ record, prop }) => {
      let val = prop.text() || "{}";

      const el: EchartsData = document.createElement("echarts-data") as EchartsData;
      el.val = val;
      el.ui = plugin.ui;
      el.prop = prop;

      return el;
    });
  }
}
