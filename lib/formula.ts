import { parseDataset } from "./parse/parse";
import JSON5 from "./JSON5.js";

export type FormulaFunction = ({record, prop}: {record: PluginRecord, prop: PluginProperty}) => any;

export type ChartFamily = 'cartesian' | 'polar' | 'matrix' | 'proportion' | 'geo' | 'single';

export const createEchartsOptionsObject: FormulaFunction = ({record}) => {
    const xaxis = record.text("xaxis");
    const yaxis = record.text("yaxis");
    const radiusAxis = record.text("radiusAxis");
    const angleAxis = record.text("angleAxis");
    const singleAxis = record.text('singleAxis');
    const family: ChartFamily | string = record.text('family');

    const dataText = record.text("data");

    
    const result = parseDataset(dataText);
    let data = result?.dataset;

    if (!data) {
        data = {
            source: [],
            dimensions: [],
        };
    }
    let seriesText = record.text("series");
    let series = [];
    try {
        series = JSON5.parse(seriesText);
        if (!Array.isArray(series)) {
        series = [];
        }
    } catch (e) {
        console.error(e);
        console.log("Failed to parse series", series);
        series = [];
    }

    let opts: Record<string, any> = {
        dataset: data,
        legend: {},
        tooltip: {
            trigger: "axis",
        },
        series: series,
    };

    if (family == 'cartesian') {
        opts.xAxis = { type: xaxis ?? "value" };
        opts.yAxis = { type: yaxis ?? "value" };
    } else if (family == 'polar') {
        if (radiusAxis) {
            opts.radiusAxis = { type: radiusAxis ?? "value" };
        }
        if (angleAxis) {
            opts.angleAxis = { type: angleAxis ?? "value" };
        }
    } else if (family == 'single') {
        opts.singleAxis = { type: singleAxis ?? "value" };
    } else if (family == 'proportion') {
        // proportion has no axis
    } else if (family == 'matrix') {
        // pass for now
    } else if (family == 'geo') {
        // geo has no axis, but it DOES have a .geo
    }

    console.log("opts", opts);

    return JSON.stringify(opts);
}