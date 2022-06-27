import { DataQuery, DataSourceJsonData, QueryEditorProps, SelectableValue } from '@grafana/data';
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
}

export interface MetricsQuery extends EditorQuery {
  baseLine: boolean;
  showMultiline: boolean;
  dimensions: string;
  metricName: string;
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
  metricsList: object[];
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
