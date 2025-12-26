import { withObserverModifier } from "../helpers/observe-modifier";
import { patchedIdleCallback } from "../helpers/patched-idlecallback";
import { ChartFamily, familySpecificProperties, familyToProperties } from "../types";

const expectedRowProps = ['series', 'xaxis', 'yaxis'];

export const chartEditorCss = `
  .chart-single-editor {
    border: 1px solid red !important;
  }
  .chart-single-editor .page-props-row {
    flex-direction: column !important;
    display: flex;
  }
`;

const getPropertyRows = (el: HTMLElement): Record<string, HTMLElement> => {
  const rows = Array.from(el.querySelectorAll(".page-props-row"));
  return Object.fromEntries(
    rows.map(row => {
      const name = row.getAttribute("data-field-id");
      return [name, row as HTMLElement];
    })
  )
}

const onFamilyPotentiallyChanged = (record: PluginRecord, el: HTMLElement) => {
  const family = record.prop('family')?.value?.[1] ?? 'cartesian';
  const allowed = familyToProperties[family as ChartFamily] ?? [];
  const propertyRows = getPropertyRows(el);

  familySpecificProperties.forEach((property) => {
    if (!propertyRows[property]?.style) {
      return;
    }
    if (!allowed.includes(property)) {
      propertyRows[property].style.display = "none";
    } else {
      propertyRows[property].style.display = "flex";
    }
  })
}

const getPanelAndRecord = (plugin: CollectionPlugin): [PluginPanel | null, PluginRecord | null, any | null] => {
  const panel = plugin.ui.getActivePanel();
  const record = panel?.getActiveRecord();
  if (!panel || !record) {
    // shouldnt happen
    return [null, null, null];
  }
  const row = record.row.kv;
  const isChart = expectedRowProps.every(att => row.hasOwnProperty(att));
  if (!isChart) {
    return [null, null, null];
  }
  return [panel, record, row];
}

export const observeAndModifyChartEditor = withObserverModifier({
  targetClass: ".editor-panel",
  callback: (plugin, el) => {
    const [panel, record, row] = getPanelAndRecord(plugin);
    if (!row) {
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

    patchedIdleCallback(() => onFamilyPotentiallyChanged(record, el), 500);
  },
  onLoad: (plugin) => {
    plugin.ui.injectCSS(chartEditorCss);
  },
  onRowChange: (plugin, el, id) => {
    if (id !== 'family') {
      return;
    }
    const [panel, record, row] = getPanelAndRecord(plugin);
    if (!row) {
      return;
    }
    setTimeout(() => {
      onFamilyPotentiallyChanged(record, el);
    }, 500);
  }
})