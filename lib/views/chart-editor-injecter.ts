import { withObserverModifier } from "../helpers/observe-modifier";

const expectedRowProps = ['series', 'xaxis', 'yaxis'];

export const chartEditorCss = `
  .chart-single-editor {
    border: 1px solid red !important;
  }
  .chart-single-editor .page-props-row {
    flex-direction: column !important;
    display: flex !important;
  }
`;

export const observeAndModifyChartEditor = withObserverModifier({
  targetClass: ".editor-panel",
  callback: (plugin, el) => {
    const panel = plugin.ui.getActivePanel();
    const record = panel?.getActiveRecord();
    if (!panel || !record) {
      // shouldnt happen
      return;
    }
    const row = record.row.kv;
    const isChart = expectedRowProps.every(att => row.hasOwnProperty(att));
    if (!isChart) {
      return;
    }

    console.log("chart editor context, modifying");
    el.classList.add('chart-single-editor');

    // Kill off the default editor for fields we have custom editors for.
    const interceptForIds = new Set([
      "options", "series", "data"
    ]);
    const killDefaultEdit = (ev: Event) => {
      const path = (ev as any).composedPath?.() ?? [];

      // find the nearest row in the event path
      const row = path.find(
        (n) =>
          n instanceof HTMLElement &&
          n.classList.contains("page-props-row") &&
          n.dataset.fieldId
      ) as HTMLElement | undefined;

      if (!row) return;
      if (!interceptForIds.has(row.dataset.fieldId!)) return;

      ev.stopImmediatePropagation();
      ev.stopPropagation();
      if (ev.cancelable) ev.preventDefault();

      path[0]?.dispatchEvent(
        new CustomEvent(`intercepted${ev.type}`, {
          bubbles: true,
          composed: true,
          detail: {
            currentTarget: ev.currentTarget,
            target: ev.target,
            type: ev.type
          }
        })
      );
    };

    el.addEventListener("click", killDefaultEdit, true);
    el.addEventListener("pointerdown", killDefaultEdit, true);
    el.addEventListener("pointerup", killDefaultEdit, true);
    el.addEventListener("dblclick", killDefaultEdit, true);
    
  },
  onLoad: (plugin) => {
    plugin.ui.injectCSS(chartEditorCss);
  }
})