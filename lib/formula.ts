import { parseDataset } from "./parse/parse";
import JSON5 from "./JSON5.js";

export type FormulaFunction = ({record, prop}: {record: PluginRecord, prop: PluginProperty}) => any;

export const createEchartsOptionsObject: FormulaFunction = ({record}) => {
    const xaxis = record.text("x-axis");
    const yaxis = record.text("y-axis");
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

    let opts = {
        dataset: data,
        xAxis: {
            type: xaxis,
        },
        legend: {},
            tooltip: {
            trigger: "axis",
        },
        yAxis: {
            type: yaxis,
        },
        series: series,
    };
    return JSON.stringify(opts);
}