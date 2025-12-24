import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRef, ref, type Ref } from "lit/directives/ref.js";

export type ModalFieldType = "text" | "textarea" | "number" | "json";
export type ModalSchema = Record<string, ModalFieldType>;
export type ModalResult = Record<string, unknown> | null;

function prettifyLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export class FormModal extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property({ attribute: false })
  schema: ModalSchema = {};

  @property({ type: String })
  title: string = "Configuration";

  @property({ attribute: false })
  initialValues: Record<string, unknown> = {};

  // Internal refs / state
  private _resolver: ((v: ModalResult) => void) | null = null;
  private _inputRefs: Record<string, Ref<HTMLInputElement | HTMLTextAreaElement>> =
    {};

  private _active = false;

  // ---------- Static helper (same API shape as your old function) ----------
  static open(
    schema: ModalSchema,
    title = "Configuration",
    initialValues: Record<string, unknown> = {}
  ): Promise<Record<string, unknown> | null> {
    return new Promise((resolve) => {
      const el = document.createElement("form-modal") as FormModal;
      el.schema = schema;
      el.title = title;
      el.initialValues = initialValues;
      el._resolver = resolve;
      document.body.appendChild(el);

      // next frame -> animate in + focus
      requestAnimationFrame(() => {
        el._active = true;
        el.requestUpdate();
      });
    });
  }

  // ---------- Lifecycle ----------
  protected willUpdate(changed: Map<PropertyKey, unknown>): void {
    // Ensure refs exist for all schema keys
    if (changed.has("schema")) {
      const next: typeof this._inputRefs = {};
      for (const key of Object.keys(this.schema ?? {})) {
        next[key] = this._inputRefs[key] ?? createRef();
      }
      this._inputRefs = next;
    }
  }

  protected firstUpdated(): void {
    // focus first input after initial paint
    requestAnimationFrame(() => {
      const firstKey = Object.keys(this._inputRefs)[0];
      const first = firstKey ? this._inputRefs[firstKey]?.value : null;
      first?.focus?.();
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // if removed externally, resolve as cancelled to avoid hanging promises
    if (this._resolver) {
      const r = this._resolver;
      this._resolver = null;
      r(null);
    }
  }

  // ---------- Actions ----------
  private _close(result: ModalResult): void {
    // animate out then remove
    this._active = false;
    this.requestUpdate();

    const resolver = this._resolver;
    this._resolver = null;

    window.setTimeout(() => {
      this.remove();
      resolver?.(result);
    }, 150); // match your CSS transition timing
  }

  private _handleOverlayClick(e: MouseEvent): void {
    // close only if clicking the background, not inside dialog
    if (e.target === this.querySelector(".modal-background")) {
      this._close(null);
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (e.key === "Escape") {
      e.preventDefault();
      this._close(null);
      return;
    }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this._handleSave();
    }
  }

  private _handleSave(): void {
    const result: Record<string, unknown> = {};
    let hasError = false;

    for (const [key, type] of Object.entries(this.schema)) {
      const input = this._inputRefs[key]?.value;
      const raw = (input as HTMLInputElement | HTMLTextAreaElement | null)?.value ?? "";

      if (type === "number") {
        const n = Number.parseFloat(raw);
        result[key] = Number.isFinite(n) ? n : null;
      } else if (type === "json") {
        // clear error style first
        if (input) (input as HTMLElement).style.borderColor = "";

        try {
          result[key] = raw.trim() === "" ? null : JSON.parse(raw);
        } catch {
          hasError = true;
          if (input) (input as HTMLElement).style.borderColor = "red";
          result[key] = raw; // keep raw
        }
      } else {
        result[key] = raw;
      }
    }

    if (!hasError) this._close(result);
  }

  // ---------- Rendering helpers ----------
  private _fieldTemplate(key: string, type: ModalFieldType) {
    const labelText = prettifyLabel(key);
    const initial = this.initialValues?.[key];

    const value =
      type === "json"
        ? isObject(initial) || Array.isArray(initial)
          ? JSON.stringify(initial, null, 2)
          : (initial ?? "")
        : (initial ?? "");

    const r = this._inputRefs[key] ?? (this._inputRefs[key] = createRef());

    if (type === "textarea" || type === "json") {
      return html`
        <div class="form-field">
          <label>${labelText}</label>
          <textarea
            ${ref(r)}
            class="form-input w-full ${type === "json" ? "code" : ""}"
            style="min-height: 200px; resize: vertical"
          >${String(value)}</textarea>
        </div>
      `;
    }

    if (type === "number") {
      return html`
        <div class="form-field">
          <label>${labelText}</label>
          <input
            ${ref(r)}
            type="number"
            class="form-input w-full"
            .value=${String(value)}
          />
        </div>
      `;
    }

    // default text
    return html`
      <div class="form-field">
        <label>${labelText}</label>
        <input
          ${ref(r)}
          type="text"
          class="form-input w-full"
          .value=${String(value)}
        />
      </div>
    `;
  }

  render() {
    // NOTE: these classes match your existing DOM structure :contentReference[oaicite:1]{index=1}
    return html`
      <div class="modal-background" @click=${this._handleOverlayClick}>
        <div
          class="modal-dialog modal-size-medium modal-dialog-has-border animate-open ${this
            ._active
            ? "active"
            : ""}"
          @keydown=${this._handleKeyDown}
          tabindex="0"
        >
          <div class="modal-main">
            <div class="modal-sidebar"></div>

            <div class="modal-body">
              <div class="modal-p">
                <h1 class="modal-h1" style="margin-bottom: 20px">${this.title}</h1>

                ${Object.entries(this.schema).map(([k, t]) =>
                  this._fieldTemplate(k, t)
                )}
              </div>
            </div>

            <div class="modal-bottom-bar">
              <div style="display:flex;justify-content:flex-end;gap:10px">
                <button class="button" @click=${() => this._close(null)}>
                  Cancel
                </button>
                <button class="button-primary" @click=${this._handleSave}>
                  <span
                    class="ti ti-check"
                    style="margin-right: 5px; font-weight: bold;"
                  ></span>
                  Save
                </button>
              </div>
            </div>
          </div>

          <div style="position:absolute;top:15px;right:15px">
            <button
              class="button-minimal button-small"
              @click=${() => this._close(null)}
            >
              <span class="ti ti-x"></span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static register() {
    if (!customElements.get("form-modal")) {
      customElements.define("form-modal", FormModal);
    }
  }
}

// Keep your existing call-site API:
export function openFormModal(
  schema: ModalSchema,
  title = "Configuration",
  initialValues: Record<string, unknown> = {}
): Promise<Record<string, unknown> | null> {
  return FormModal.open(schema, title, initialValues);
}
