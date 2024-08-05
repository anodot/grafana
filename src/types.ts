import { DataSourceJsonData, QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataQuery } from '@grafana/schema';
import { DataSource } from './DataSource';

export type OnChangeType = (key: string | object, value?: any, runQuery?: boolean) => void;

export interface EditorQuery extends DataQuery {
  scenario: string;
}

export type QEditorProps = QueryEditorProps<DataSource, EditorQuery>;

export interface TopologyQuery extends EditorQuery {
  deltaValue: number;
  duration: number[];
  score: number[];
  direction: SelectableValue;
  durationStep?: number;
  durationUnit: 'minutes';
  deltaType: string;
  sortBy: string;
  timeScales: SelectableValue[];
  openedOnly: boolean;
  showEvents: boolean;
  requestsStrategy: string;
  source: string;
  destination: string;
  metrics: SelectableValue[];
  notOperator: boolean;
}

export interface AlertsQuery extends EditorQuery {
  severities: object[];
  types: object[];
  recipient: object;
  showOpen: boolean;
  acknowledge: '' | 'ACK' | 'NOACK';
  feedback: object[];
}
export enum MeasuresTypesEnum {
  COMPOSITES = 'composites',
  MEASURES = 'measures',
}
export type MeasureWithComposites = {
  value: string;
  type: MeasuresTypesEnum;
  originId?: string;
};

export interface MetricsQuery extends EditorQuery {
  baseLine: boolean;
  addQuery: boolean;
  showMultiline: boolean;
  dimensions: string;
  measure: MeasureWithComposites;
  functions: string;
  sortBy: string;
  size: number;
  applyVariables?: boolean;
}

export interface AnomalyQuery extends EditorQuery {
  score: number[];
  duration: number[];
  durationStep: number;
  durationUnit: string;
  deltaValue: number;
  deltaType: string;
  direction: string[] | SelectableValue[];
  timeScales: object;
  requestCharts: boolean;
  addQuery: boolean;
  includeBaseline: boolean;
  sortBy: string;
  metrics: SelectableValue[];
  openedOnly: boolean;
  notOperator: boolean;
  size: number;
  dimensions: string;
  applyVariables?: boolean;
}

export interface ScenarioProps<TsQuery extends EditorQuery> extends QueryEditorProps<DataSource, EditorQuery> {
  metricsList?: Array<FlatObject<any>>;
  query: TsQuery;
  onFormChange: OnChangeType;
}

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {
  url?: string;
  callId?: number;
  timeInterval?: number[];
  apiPostfix?: string;
  authApiPostfix?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  password?: string;
  apiToken?: string;
  token?: string;
}

export interface TimeFilter {
  [x: string]: number;
  from: number;
  to: number;
}
export interface DimensionType {
  key: string;
  value: any;
  not?: boolean;
}

export type FlatObject<T = string | number | boolean> = Record<string, T>;

export type Option<T = any> = SelectableValue<T>;
