import JSON5 from "./JSON5.js";
import type { Dataset } from "./types.js";



export function parseData(val: any): Dataset | null {
  if (!val) {
    return null;
  }
  if (val?.dimensions && val?.source) {
    return val;
  }

  if (typeof val === "string") {
    try {
      let obj = JSON5.parse(val);
      if (obj?.dimensions && obj?.source) {
        return obj;
      } else {
        throw Error(`Uknown data ${obj}`);
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  }
  return null;
}