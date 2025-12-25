import { css, html, LitElement, TemplateResult } from "lit";
import { until } from 'lit/directives/until.js';

import {openFormModal} from "./form-modal.js";
import { property } from "lit/decorators.js";
import { Dataset, DataValue, Dimension, IngestionFormat } from "../types.js";
import { parseDataset } from "../parse/parse.js";
import { buttonStyles } from "./styles.js";

function format(value: DataValue) {
  // number | string | Date | null;
  if (typeof value === 'number') {
    return value.toFixed(1);
  } else if (typeof value === 'string') {
    return value.slice(0, 32);
  } else if (value instanceof Date) {
    try {
      return value.toLocaleDateString();
    } catch {
      return "NaT";
    }
  } else {
    return "-";
  }
}

function name(o: string | Dimension | null): string {
  if (typeof o !== 'string') {
    return o?.displayName ?? o?.name ?? '';
  }
  return o?.toString();
}

export function renderDataset(obj: { dataset: Dataset; format: IngestionFormat } | null): TemplateResult {
  if (!obj) {
    return html`No dataset`;
  }
  let dataset: Dataset = obj.dataset;

  if (!dataset?.dimensions || !dataset?.source) {
    return html`<h3>Invalid data</h3>`;
  }
  return html`
    <table>
      <thead>
        <tr>
          ${dataset.dimensions.map(o => html`<th>${name(o)}</th>`)}
        </tr>
      </thead>
      <tbody>
        ${dataset.source.map(r => 
          html`<tr>
            ${dataset.dimensions.map((_, i) => html`<td>${format(r[i])}</tr>`)}
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
      overflow: auto;
      max-width: 100%;
      max-height: 300px;
    }
    thead {
      background: var(--cards-bg);
      position: sticky;
      top: 0;
    }
    ${buttonStyles}
  `;

  @property()
  ui: UIAPI | null = null;

  @property()
  prop: PluginProperty | undefined = undefined;

  render() {
    let content = this.prop?.text();
    let data = parseDataset(content);

    return html`
      <div class='entry'>
        <button
          @click=${this._editModal}
          @interceptedclick=${this._editModal}
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

  static register(plugin: CollectionPlugin) {
    if (!customElements.get("echarts-data")) {
      customElements.define("echarts-data", EchartsData);
    }

    plugin.properties.render("data", ({ record, prop }) => {
      let val = prop.text() || "{}";

      const el: EchartsData = document.createElement("echarts-data") as EchartsData;
      el.ui = plugin.ui;
      el.prop = prop;
      el.style.maxWidth = "100%";

      return el;
    });
  }
}
