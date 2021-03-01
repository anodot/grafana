import React, { useEffect, useState } from 'react';
import FormSelect from '../components/FormField/FormSelect';
import { alertTypesOptions, severityOptions } from '../utils/constants';
import { AlertsQuery, ScenarioProps } from '../types';

export const defaultAlertsQuery: Partial<AlertsQuery> = {};

const AlertsQueryEditor = (props: ScenarioProps<AlertsQuery>) => {
  const { query, onChange, onRunQuery, datasource } = props;
  const [subscribersOptions, setSubscribers] = useState([]);

  useEffect(() => {
    onRunQuery();
    Promise.all([datasource.getUsers(), datasource.getChannels()]).then(results => {
      const subscribersDict = {};
      const usersOptions = results[0].map(u => ({ label: `${u.firstName} ${u.lastName}`, value: u._id, type: 'user' }));
      const channelsOptions = results[1].map(ch => ({ label: ch.name, value: ch.id, type: 'channel' }));
      const united = usersOptions.concat(channelsOptions);
      united.forEach(opt => {
        subscribersDict[opt.value] = opt;
      });
      setSubscribers(usersOptions.concat(channelsOptions));
    });
  }, []);

  const onFormChange = (key, value, runQuery = false) => {
    const newQuery = { ...query, [key]: value.value ?? value };
    onChange(newQuery);
    onRunQuery();
  };

  return (
    <>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSelect
            isMulti
            inputWidth={0}
            label={'Recipient (Users / Channels)'}
            value={query.recipient}
            options={subscribersOptions}
            onChange={value => onFormChange('recipient', value)}
          />
        </div>
      </div>
      <div className="gf-form-inline">
        <div className="gf-form gf-form--grow">
          <FormSelect
            isMulti
            isClearable
            inputWidth={0}
            label={'Alert Type'}
            value={query.types}
            options={alertTypesOptions}
            onChange={value =>
              onFormChange(
                'types',
                value.map(d => d.value)
              )
            }
          />
        </div>
        <div className="gf-form gf-form--grow">
          <FormSelect
            isMulti
            isClearable
            inputWidth={0}
            label={'Severity'}
            value={query.severities}
            options={severityOptions}
            onChange={value =>
              onFormChange(
                'severities',
                value.map(d => d.value)
              )
            }
          />
        </div>
      </div>
    </>
  );
};

export default AlertsQueryEditor;
