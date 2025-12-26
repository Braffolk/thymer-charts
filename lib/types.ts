
export type DataValue = number | string | Date | null;
export type DataRow = DataValue[];
export type DataRows = DataRow[];

export type IngestionFormat = 'csv' | 'xlsx' | 'gsheets' | 'api' | 'parquet' | 'json' | 'auto';


export type DimensionType = 'number' | 'float' | 'int' | 'ordinal' | 'time';
export type DimensionTypeNumeric = 'number' | 'float' | 'int';

export interface Dimension {
  name: string;
  type: DimensionType;
  displayName?: string;
}

export interface Dataset {
  dimensions: (string | Dimension)[];
  source: DataRow[];
}


export type ChartFamily = 'cartesian' | 'polar' | 'matrix' | 'proportion' | 'geo' | 'single';

export const familySpecificProperties = [
  "xaxis",
  "yaxis",
  "singleAxis",
  "radiusAxis",
  "angleAxis",
  "geoUrl",
];

export const familyToProperties: Record<ChartFamily, string[]> = {
  'cartesian': ['xaxis', 'yaxis'],
  'polar': ['radiusAxis', 'angleAxis'],
  'matrix': [], // todo
  'proportion': [],
  'geo': ['geoUrl'], //todo
  'single': ['singleAxis']
}