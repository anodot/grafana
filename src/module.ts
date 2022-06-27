import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { EditorQuery, MyDataSourceOptions } from './types';
import {VariableQueryEditor} from "./VariableQueryEditor";

export const plugin = new DataSourcePlugin<DataSource, EditorQuery, MyDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
