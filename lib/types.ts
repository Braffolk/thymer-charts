
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
