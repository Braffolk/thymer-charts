# Thymer ECharts Plugin

This plugin integrates Apache ECharts into Thymer, allowing for the creation, configuration, and rendering of charts directly within collection records and text documents.

![Thymer charts](./examples/thymer-charts.png)

## Functionality

The plugin extends the collection capabilities with two primary rendering modes:

1.  **Chart Editor View**: A custom collection view that provides a split-pane interface. It displays the rendered chart on one side and configuration controls (JSON editors for data and series) on the other.
2.  **Inline Widgets**: A DOM observation mechanism that detects specific link references (e.g., `[[Chart Name]]`) formatted as "Link with Icons" and replaces them with an interactive ECharts web component.

## Data Model

The plugin relies on specific properties within the collection to generate the chart configuration.

| Property | Type | Description |
| :--- | :--- | :--- |
| **title** | Text | The display name of the record. |
| **xaxis** | Choice | Axis type definition (e.g., `value`, `category`, `time`). |
| **yaxis** | Choice | Axis type definition. |
| **data** | Text | The dataset definition in JSON5 format. |
| **series** | Text | The series configuration in JSON5 format. |
| **options** | Formula | **Read-only.** Aggregates the above fields into a valid ECharts option object string. |

## Usage

### Chart Editor View

1.  Embed the collection into a document using `/app`.
2.  Change the view type on the embedded block to **Chart Editor**.
3.  Filter the view to a specific record to access the editing interface.
4.  Modifications to the JSON fields in the right-hand panel trigger an immediate re-render of the chart.

### Inline Rendering

To render a chart within a text note:

1.  Create a link to the chart record (e.g., `[[Line Chart]]`).
2.  Set the link style to **Link with Icons** (or Link Button).
3.  The plugin's `MutationObserver` detects this element, validates the target record, and injects the `<echarts-chart>` custom element into the DOM.

## Development

This project uses the Thymer Plugin SDK and requires a local Chrome instance with remote debugging enabled.

### Prerequisites

*   Node.js
*   Google Chrome, Brave, or MS Edge

### Installation

```bash
npm install
```

### Debugging

Start Chrome with the remote debugging port enabled:

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome-debug-profile" --no-first-run https://myaccount.thymer.com
```

**Windows:**
```bash
chrome --remote-debugging-port=9222 --no-first-run https://myaccount.thymer.com
```

### Build and Watch

To start the development loop with Hot Module Replacement (HMR):

```bash
npm run dev
```

### Deployment

To generate the final bundle for manual installation:

1.  Run `npm run build`.
2.  Copy the contents of `dist/plugin.js` into the Thymer **Custom Code** dialog.
3.  Copy the contents of `plugin.json` into the Thymer **Configuration** dialog.

## Architecture

The codebase is structured into modular TypeScript components:

*   **`plugin.ts`**: Entry point. Registers properties, views, and initializes the `MutationObserver`.
*   **`echarts-chart.ts`**: A `LitElement` wrapper for the ECharts library. Handles script loading, resizing, and theme application.
*   **`echarts-data.ts` / `echarts-series.ts`**: Custom property renderers that provide preview tables and trigger the modal editor.
*   **`form-modal.ts`**: A framework-agnostic modal implementation that matches Thymer's native DOM structure and CSS variables.
*   **`helpers.ts`**: Utilities for parsing JSON5.