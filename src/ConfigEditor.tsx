import React, { ChangeEvent, useEffect } from 'react';
import { Field, Icon, Input, Tooltip, useTheme } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from './types';
import { urlBase, urlGrafanaHelp } from './utils/constants';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export const ConfigEditor: React.FC<Props> = props => {
  const { colors } = useTheme();
  const protStr = 'https://';
  const { options } = props;
  const { jsonData, secureJsonFields } = options;

  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

  useEffect(() => {
    props.onOptionsChange({
      ...props.options,
      jsonData: {
        ...props.options.jsonData,
        url: props.options.jsonData.url || urlBase,
      },
    });
  }, []);

  const onTokenChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = props;
    /* Trim " quotes around the string if it was copied wrong from the Anodot website */
    const token = event.target.value; // event.target.value?.replace('"', '');
    onOptionsChange({
      ...options,
      secureJsonData: {
        token: token?.replace(/"/g, ''),
      },
    });
  };

  const onUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = props;
    const newJsonData = {
      ...options.jsonData,
      url: protStr + event.target.value,
    };
    onOptionsChange({
      ...options,
      jsonData: newJsonData,
    });
  };

  return (
    <div className="gf-form-group">
      <Field className={'width-30'} horizontal required label="Anodot API URL" description="API URL for your domain">
        <Input
          prefix={protStr}
          type="text"
          css={''}
          width={30}
          value={jsonData.url?.replace(protStr, '')}
          suffix={
            <Tooltip content={<p>Set your anodot domain e.x. "yourCompanyName.anodot.com"</p>} theme={'info'}>
              <Icon name="info-circle" />
            </Tooltip>
          }
          onChange={onUrlChange}
        />
      </Field>
      <Field
        className={'width-30'}
        horizontal
        required
        label="Anodot API Token"
        description="The API token to access the data."
      >
        <Input
          type="password"
          css={''}
          width={30}
          placeholder={secureJsonFields?.token ? 'configured' : ''}
          value={secureJsonData.token ?? ''}
          suffix={
            <Tooltip
              content={
                <p>
                  You can get Anodot API tokens following from Anodot Admins or in settings console on{' '}
                  <a style={{ color: colors.linkExternal }} href={urlGrafanaHelp} target={'_blank'}>
                    app.anodot.com
                  </a>
                </p>
              }
              theme={'info'}
            >
              <Icon name="info-circle" />
            </Tooltip>
          }
          onChange={onTokenChange}
        />
      </Field>
      <p>
        <a style={{ color: colors.linkExternal }} href={urlGrafanaHelp} target={'_blank'}>
          Learn More
        </a>
      </p>
    </div>
  );
};
