import { css, html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";

import { parseDataset } from "../parse/parse.js";
import { buttonStyles } from "./styles.js";
import { parseSeries } from "./echarts-series.js";
import { ChartFamily, Dataset, Dimension } from "../types.js";

/**
 * Produces/edits a JSON string like:
 * [
 *   { "type": "bar", "encode": { "x": "colb", "y": "colu" } }
 * ]
 */
export class EchartsSeriesInput extends LitElement {
  static styles = css`
    ${buttonStyles}

    table.entry {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    table.entry th,
    table.entry td {
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 8px 10px;
      vertical-align: middle;
      text-align: left;
    }
    table.entry thead th {
      font-weight: 600;
      opacity: 0.9;
    }

    .row-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      white-space: nowrap;
    }

    select,
    input[type="text"] {
      width: 100%;
      min-width: 140px;
      box-sizing: border-box;
    }

    .muted {
      opacity: 0.7;
      font-size: 12px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .footerbar {
      margin-top: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: flex-start;
    }
  `;

  @property()
  plugin: CollectionPlugin | null = null;

  @property()
  value: string | null = null;

  @property()
  family: string | ChartFamily | null = null;

  @property({ attribute: false })
  data: Dataset | null = null;

  @state()
  private _series: Array<any> = [];

    protected willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has("data") && typeof this.data === "string") {
        try {
        this.data = JSON.parse(this.data);
        } catch {
        this.data = { dimensions: [], source: [] } as any;
        }
    }

    if (changed.has("value")) {
        this._series = this._normalizeSeries(parseSeries(this.value));
    }
    }

  render() {
    const family = this._coerceFamily(this.family);
    if (!family) return html`<h3>Missing family! Please pick family first.</h3>`;

    const fields = this._fieldsForFamily(family);

    return html`
      <div class="topbar">
        <div class="muted">
          ${this.data?.dimensions?.length
            ? html`Dimensions: <b>${this.data.dimensions.length}</b>`
            : html`No dataset dimensions detected (you can still type manually).`}
        </div>
        <button class="btn" @click=${this._addSeries}>+ Add series</button>
      </div>

      <table class="entry">
        <thead>
          <tr>
            <th style="width: 160px;">Type</th>
            ${fields.map((f) => html`<th>${f.label}</th>`)}
            <th style="width: 140px;"></th>
          </tr>
        </thead>

        <tbody>
          ${this._series.length === 0
            ? html`<tr><td colspan=${2 + fields.length} class="muted">No series yet. Click “Add series”.</td></tr>`
            : this._series.map((s, i) => this._renderRow(s, i, family, fields))}
        </tbody>
      </table>

      <div class="footerbar">
        <button class="btn" @click=${this._addSeries}>+ Add series</button>
      </div>
    `;
  }

  private _renderRow(
    s: any,
    index: number,
    family: ChartFamily,
    fields: Array<{ key: string; label: string }>
  ) {
    const encode = (s?.encode && typeof s.encode === "object") ? s.encode : {};
    const type = typeof s?.type === "string" ? s.type : this._defaultTypeForFamily(family);

    return html`
      <tr class="serie">
        <td>
          <select
            .value=${type}
            @change=${(e: Event) => this._onTypeChange(index, (e.target as HTMLSelectElement).value)}
          >
            ${this._seriesTypeOptions(family).map(
              (t) => html`<option value=${t} ?selected=${t === type}>${t}</option>`
            )}
          </select>
        </td>

        ${fields.map((f) =>
          html`<td>${this._renderDimPicker(index, f.key, encode?.[f.key] ?? null)}</td>`
        )}

        <td>
          <div class="row-actions">
            <button class="btn" @click=${() => this._deleteSeries(index)}>Delete</button>
          </div>
        </td>
      </tr>
    `;
  }

  private _renderDimPicker(seriesIndex: number, encodeKey: string, current: unknown) {
    const getName = (o: string | Dimension) => (typeof o === "string" ? o : o.name);
    const cur = current == null ? "" : (typeof current === "string" ? current : String(current));

    const dims = (this.data as Dataset | null)?.dimensions ?? [];

    if (dims.length) {
        const customSentinel = "__custom__";
        const isCustom = cur !== "" && !dims.find((o) => getName(o) === cur);
        const selectValue = isCustom ? customSentinel : cur;

        console.log('selectValue', selectValue);

        return html`
        <select
            .value=${selectValue}
            @change=${(e: Event) => {
            const v = (e.target as HTMLSelectElement).value;
            if (v === customSentinel) this._setEncode(seriesIndex, encodeKey, "");
            else this._setEncode(seriesIndex, encodeKey, v);
            }}
        >
            <option value="" ?selected=${selectValue === ""}>(unset)</option>
            ${dims.map((d) => html`<option value=${getName(d)} ?selected=${getName(d) === selectValue}>${getName(d)}</option>`)}
            <option value=${customSentinel} ?selected=${selectValue === customSentinel}>Custom…</option>
        </select>

        ${isCustom || selectValue === customSentinel
            ? html`
                <div style="margin-top:6px;">
                <input
                    type="text"
                    placeholder="Enter dimension (string)"
                    .value=${cur}
                    @input=${(e: Event) =>
                    this._setEncode(seriesIndex, encodeKey, (e.target as HTMLInputElement).value)}
                />
                </div>
            `
            : nothing}
        `;
    }

    return html`
        <input
        type="text"
        placeholder="Dimension (string)"
        .value=${cur}
        @input=${(e: Event) => this._setEncode(seriesIndex, encodeKey, (e.target as HTMLInputElement).value)}
        />
    `;
    }

  private _onTypeChange(index: number, type: string) {
    const next = this._clone(this._series);
    next[index] = next[index] ?? {};
    next[index].type = type;
    next[index].encode = (next[index].encode && typeof next[index].encode === "object") ? next[index].encode : {};
    this._series = next;
    this._commitValue();
  }

  private _setEncode(seriesIndex: number, key: string, raw: string) {
    const v = (raw ?? "").trim();

    const next = this._clone(this._series);
    next[seriesIndex] = next[seriesIndex] ?? {};
    next[seriesIndex].type = typeof next[seriesIndex].type === "string" ? next[seriesIndex].type : "bar";
    next[seriesIndex].encode = (next[seriesIndex].encode && typeof next[seriesIndex].encode === "object") ? next[seriesIndex].encode : {};

    if (!v) {
      delete next[seriesIndex].encode[key];
      // If encode becomes empty, remove it entirely (keeps output clean)
      if (Object.keys(next[seriesIndex].encode).length === 0) delete next[seriesIndex].encode;
    } else {
      next[seriesIndex].encode[key] = v;
    }

    this._series = next;
    this._commitValue();
  }

  private _addSeries = () => {
    const family = this._coerceFamily(this.family);
    const type = this._defaultTypeForFamily(family);

    const next = this._clone(this._series);
    next.push({ type, encode: {} });

    this._series = next;
    this._commitValue();
  };

  private _deleteSeries(index: number) {
    const next = this._clone(this._series);
    next.splice(index, 1);
    this._series = next;
    this._commitValue();
  }

  private _commitValue() {
    // Normalize again to avoid junk (empty encode, missing type, etc.)
    const normalized = this._normalizeSeries(this._series);

    // IMPORTANT: this.value is the single source of truth outside; keep it in sync
    this.value = JSON.stringify(normalized);

    // Bubble like a normal input so surrounding “row change” handlers catch it
    this.dispatchEvent(
      new CustomEvent("input", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
    this.dispatchEvent(
      new CustomEvent("change", {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _normalizeSeries(raw: any): Array<any> {
    const arr = Array.isArray(raw) ? raw : [];
    const out: Array<any> = [];

    for (const item of arr) {
      if (!item || typeof item !== "object") continue;

      const type = typeof (item as any).type === "string" ? (item as any).type : "bar";
      const encode = (item as any).encode && typeof (item as any).encode === "object" ? (item as any).encode : undefined;

      const normalized: any = { type };

      if (encode) {
        // drop empty strings
        const cleaned: Record<string, any> = {};
        for (const [k, v] of Object.entries(encode)) {
          if (typeof v === "string") {
            const t = v.trim();
            if (t) cleaned[k] = t;
          } else if (v != null) {
            cleaned[k] = v;
          }
        }
        if (Object.keys(cleaned).length) normalized.encode = cleaned;
      }

      out.push(normalized);
    }

    return out;
  }

  private _fieldsForFamily(family: ChartFamily): Array<{ key: string; label: string }> {
    switch (family) {
      case "cartesian":
        return [
          { key: "x", label: "X" },
          { key: "y", label: "Y" },
        ];
      case "polar":
        return [
          { key: "radius", label: "Radius" },
          { key: "angle", label: "Angle" },
        ];
      case "proportion":
        return [{ key: "value", label: "Value" }];
      case "geo":
        return [
          { key: "lng", label: "Lng" },
          { key: "lat", label: "Lat" },
        ];
      case "single":
        return [{ key: "single", label: "Single" }];
      case "matrix":
        // You can extend this once you decide the encode keys for matrix in your plugin.
        return [];
      default:
        return [];
    }
  }

  private _seriesTypeOptions(family: ChartFamily): string[] {
    // Keep broad; user can pick whatever they want even if it’s “weird” for the family.
    const common = ["line", "bar", "scatter", "effectScatter", "heatmap", "custom"];
    const proportion = ["pie", "funnel", "gauge", "treemap", "sunburst"];
    const geo = ["map", "lines", "scatter", "effectScatter"];
    const polar = ["line", "bar", "scatter", "heatmap"];
    const single = ["scatter", "bar", "line"];
    const matrix = ["heatmap", "custom"];

    const set = new Set<string>(common);

    const add = (xs: string[]) => xs.forEach((x) => set.add(x));

    if (family === "proportion") add(proportion);
    if (family === "geo") add(geo);
    if (family === "polar") add(polar);
    if (family === "single") add(single);
    if (family === "matrix") add(matrix);

    return Array.from(set);
  }

  private _defaultTypeForFamily(family: ChartFamily | null): string {
    switch (family) {
      case "proportion":
        return "pie";
      case "geo":
        return "map";
      case "polar":
        return "bar";
      case "single":
        return "scatter";
      case "matrix":
        return "heatmap";
      case "cartesian":
      default:
        return "bar";
    }
  }

  private _coerceFamily(f: string | ChartFamily | null): ChartFamily | null {
    if (!f) return null;
    const v = String(f);
    if (v === "cartesian" || v === "polar" || v === "matrix" || v === "proportion" || v === "geo" || v === "single")
      return v as ChartFamily;
    return null;
  }


  private _clone<T>(x: T): T {
    try {
      // modern browsers
      // @ts-ignore
      return structuredClone(x);
    } catch {
      return JSON.parse(JSON.stringify(x ?? null));
    }
  }

  static register(plugin: CollectionPlugin) {
    if (!customElements.get("echarts-series-input")) {
      customElements.define("echarts-series-input", EchartsSeriesInput);
    }
  }
}
