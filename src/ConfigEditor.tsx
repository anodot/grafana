import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { InlineFormLabel, Input, useTheme } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from './types';
import { urlApiPostfix, urlBase, urlGrafanaHelp } from './utils/constants';
import FormSwitch from './components/FormField/FormSwitch';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

export const ConfigEditor: React.FC<Props> = (props) => {
  const [showFullUrl, setFullUrl] = useState(false);
  const { colors } = useTheme();
  const { options } = props;
  const { jsonData, secureJsonFields } = options;

  const secureJsonData = (options.secureJsonData || {}) as MySecureJsonData;

  useEffect(() => {
    props.onOptionsChange({
      ...props.options,
      jsonData: {
        ...props.options.jsonData,
        url: props.options.jsonData.url || urlBase,
        apiPostfix: props.options.jsonData.apiPostfix || urlApiPostfix,
      },
    });
  }, []);

  const onTokenChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { onOptionsChange, options } = props;
      /* Trim " quotes around the string if it was copied wrong from the Anodot website */
      const token = event.target.value; // event.target.value?.replace('"', '');
      onOptionsChange({
        ...options,
        secureJsonData: {
          token: token?.replace(/"/g, ''),
        },
      });
    },
    [props]
  );

  const onUrlChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { onOptionsChange, options } = props;
      const newJsonData = {
        ...options.jsonData,
        url: event.target.value,
      };
      onOptionsChange({
        ...options,
        jsonData: newJsonData,
      });
    },
    [props, showFullUrl]
  );

  const onUrlSuffixChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { onOptionsChange, options } = props;
      const newJsonData = {
        ...options.jsonData,
        apiPostfix: event.target.value,
      };
      onOptionsChange({
        ...options,
        jsonData: newJsonData,
      });
    },
    [props]
  );

  return (
    <div className="gf-form-group">
      <div className={'gf-form'}>
        <InlineFormLabel
          tooltip={<p>Set your Anodot domain to access API, E.g: &quot;yourCompanyName.anodot.com&quot;</p>}
        >
          Anodot API URL *
        </InlineFormLabel>
        <Input
          placeholder={"E.g: 'https://app.anodot.com'"}
          type="text"
          width={30}
          value={jsonData.url}
          onChange={onUrlChange}
        />
      </div>
      <div style={{ margin: 0 }} className={'gf-form'}>
        <FormSwitch
          value={showFullUrl}
          labelWidth={10}
          label={'Set API relative path'}
          onChange={(e) => setFullUrl(e.target.checked)}
          tooltip={<p>Relative API path E.g: &quot;/api/v2&quot;</p>}
        />
        {showFullUrl ? (
          <Input
            type={'text'}
            placeholder={"E.g: '/api/v2'"}
            width={15}
            value={jsonData.apiPostfix}
            onChange={onUrlSuffixChange}
          />
        ) : (
          <div className="gf-form-text">{jsonData.apiPostfix}</div>
        )}
      </div>
      <div className={'gf-form'}>
        <InlineFormLabel
          tooltip={
            <p>
              You can get Anodot API tokens following from Anodot Admins or in settings console on{' '}
              <a style={{ color: colors.linkExternal }} href={urlGrafanaHelp} target={'_blank'} rel="noreferrer">
                app.anodot.com
              </a>
            </p>
          }
        >
          Anodot API Token *
        </InlineFormLabel>
        <Input
          required
          type="password"
          width={30}
          placeholder={secureJsonFields?.token ? 'configured' : ''}
          value={secureJsonData.token ?? ''}
          onChange={onTokenChange}
        />
      </div>
      <p>
        <a style={{ color: colors.linkExternal }} href={urlGrafanaHelp} target={'_blank'} rel="noreferrer">
          Learn More
        </a>
      </p>
    </div>
  );
};
