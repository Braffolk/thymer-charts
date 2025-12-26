import { parseDataset } from "./parse/parse";
import JSON5 from "./JSON5.js";
import { ChartFamily } from "./types";
import { parseSeries } from "./elements/echarts-series";

export type FormulaFunction = ({record, prop}: {record: PluginRecord, prop: PluginProperty}) => any;

export const createEchartsOptionsObject: FormulaFunction = ({record}) => {
    const xaxis = record.text("xaxis");
    const yaxis = record.text("yaxis");
    const radiusAxis = record.text("radiusAxis");
    const angleAxis = record.text("angleAxis");
    const singleAxis = record.text('singleAxis');
    const family: ChartFamily | string = record.text('family') || "cartesian";

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
    let series = parseSeries(seriesText);
    series = series.map(o => {
        if (o.encode?.x && o.encode?.y && yaxis == 'category') {
            o.encode.seriesName = o.encode.x;
        }
        if (o.encode?.x && o.encode?.y && xaxis == 'category') {
            o.encode.seriesName = o.encode.y;
        }
        return o;
    })

    let opts: Record<string, any> = {
        dataset: data,
        legend: {},
        tooltip: {
            trigger: family == "cartesian" ? "axis" : "item",
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
        let s = series[0];
        let x = s.encode?.x;
        let y = s.encode?.y;
        let v = s.encode?.value;
        if (x && y) {
            let ix = data.dimensions.findIndex(o => typeof o === 'string' ? o === x : o?.name === x);
            let iy = data.dimensions.findIndex(o => typeof o === 'string' ? o === y : o?.name === y);
            let iv = data.dimensions.findIndex(o => typeof o === 'string' ? o === v : o?.name === v);
            if (ix >= 0 && iy >= 0 && iv >= 0) {
                let vx = data.source.map(r => r[ix]).filter((v, i, arr) => arr.indexOf(v) === i);
                let vy = data.source.map(r => r[iy]).filter((v, i, arr) => arr.indexOf(v) === i);
                let rows = data.source.map(r => [r[ix], r[iy], r[iv]]);
                let min = Math.min(...rows.map(o => o[2]).filter(o => typeof o === 'number').filter(Number.isFinite));
                let max = Math.max(...rows.map(o => o[2]).filter(o => typeof o === 'number').filter(Number.isFinite));
                
                
                opts.matrix = {
                    x: {data: vx},
                    y: {data: vy},
                    left: 50
                }
                opts.visualMap = {
                    dimension: 2,
                    calculable: true,
                    min: min, max: max,
                    type: 'continuous'
                };
                delete s.encode;
                delete opts.dataset;
                delete opts.legend;
                s.data = rows;
                s.coordinateSystem = 'matrix';
            }
        }
    } else if (family == 'geo') {
        // geo has no axis, but it DOES have a .geo (lng, lat)
    }

    return JSON.stringify(opts);
}