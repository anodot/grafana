// @ts-nocheck
import { urlBase, timeFormat, splitSign } from './constants';
import { isEqual } from 'lodash';
import TimeFilter from '../types.ts';
import { TimeRange } from '@grafana/data/types/time';
// export const getSourcesDestinationsLists = (datasets = []) => {
//     // takes first record and extracts sources and destinations for Select options
//     // const sources = new Set();
//     const destinations = new Set();
//     datasets.forEach(data => {
//         if (data && data[0]) {
//             data[0].properties.forEach((item) => {
//                 // if (item.key.includes('source_')) {
//                 //     sources.add(item.key.split('source_')[1]);
//                 // }
//                 // if (item.key.includes('destination_')) {
//                 //     destinations.add(item.key.split('destination_')[1]);
//                 // }
//                 destinations.add(item.key);
//             })
//         }
//     })
//
//     return Array.from(destinations)
//     // return { sources: Array.from(sources), destinations: Array.from(destinations) }
// }

// (destination_service_name)<----------------> (source_workload || source_canonical_service)

const getNodeId: string = (directions, directionKey, context = []) => {
  /* node  is a unique combination of direction and context */
  const res = {
    name: directions[directionKey],
  };
  context.forEach(key => {
    if (!directions[key]) {
      return null;
    } /* we don't need nodes with any null values */
    res[key] = directions[key] || 'null';
  });
  return JSON.stringify(res);
};

export const convertServerDataToTopology = (dataSets = [], sourceKey, destinationKey, context = [], options) => {
  const groupedData = groupDataOnNodesAndEdges(dataSets, sourceKey, destinationKey, context, options);
  const root = clusteriseData(groupedData, context[0]);
  const homelessIndex = root.children.findIndex(el => el.id === '0');
  if (homelessIndex !== -1) {
    root.children = [
      ...root.children.splice(0, homelessIndex),
      ...root.children.splice(homelessIndex + 1, root.children.length),
      ...root.children[homelessIndex].children,
    ];
  }
  return { root, links: groupedData.edges };
};

export const convertMetricsDataToSubTopology = (results, selectedNode, clusterby) => {
  const { activeSource, activeDest, ...contextFields } = selectedNode;
  const clusterId = JSON.stringify(contextFields);
  const datasetsDict = results.reduce((res, cur) => {
    if (cur.length && cur[0]?.what) {
      const metric = cur[0]?.what;
      res[metric] = res[metric] ? res[metric].concat(cur) : cur;
    }
    return res;
  }, {});
  const dataSets = Object.keys(datasetsDict).map(metric => ({ metric, dataSet: datasetsDict[metric] }));
  const context = Object.keys(contextFields);
  context.push(clusterby);
  const groupedData = groupDataOnNodesAndEdges(dataSets, activeSource, activeDest, context, { filters: contextFields });
  const root = clusteriseData(groupedData, clusterby, contextFields);
  root.children[0].children.push({
    cluster: JSON.stringify(contextFields),
    index: 0,
    nodeData: { ...contextFields, role: 'cluster-center' },
    nodeId: '{"role": "cluster_center"}',
    nodesEdges: [],
    type: 'node',
    role: 'clusterCenter',
    value: 1000,
  });
  const links = manageLinksInCluster(groupedData.edges, contextFields, clusterby);
  const homelessIndex = root.children.findIndex(el => el.id === '0');
  if (homelessIndex !== -1) {
    root.children = [
      ...root.children.splice(0, homelessIndex),
      ...root.children.splice(homelessIndex + 1, root.children.length),
      ...root.children[homelessIndex].children,
    ];
  }
  return { root, links };
};

export const convertAnomaliesToEdges = (dataSets, sourceKey, destinationKey, context) => {
  const anomalyEdges = {};
  let edgesCollection = [];
  const anomalyConnectionsDict = {};

  dataSets.forEach(({ metric, dataSet }) => {
    dataSet.forEach(record => {
      const { metrics = [], id } = record;
      const options = {
        isAnomaly: true,
        anomalyPrefix: 'anomaly-',
        anomalyId: id,
      };
      const { edges } = groupDataOnNodesAndEdges(
        [{ metric, dataSet: metrics }],
        sourceKey,
        destinationKey,
        context,
        options
      );
      if (edges.length) {
        anomalyEdges[id] = anomalyEdges[id] || [];
        anomalyEdges[id].push({ ...record, metricName: metric, edges });
        anomalyConnectionsDict[id] = (anomalyConnectionsDict[id] || []).concat(...edges.map(e => e.connectionId));
        edgesCollection = edgesCollection.concat(edges);
      }
    });
  });

  return {
    legendAnomalyData: Object.keys(anomalyEdges).map(anomalyId => ({
      anomalyId,
      affectedEdges: anomalyConnectionsDict[anomalyId],
      records: anomalyEdges[anomalyId],
      startDate: Math.min(...anomalyEdges[anomalyId].map(rec => rec.startDate)),
    })),
    topologyAnomalyData: { edgesCollection, anomalyConnectionsDict },
  };
};

export const mixEdges = (metricsEdges = [], anomalyEdges, isSubChart) => {
  const { edgesCollection, anomalyConnectionsDict } = anomalyEdges;
  /* For subchart case we have to use another pre-modifyed key: */
  const idKey = isSubChart ? 'subConnectionId' : 'connectionId';
  /* we store all anomaly duplicates by specific 'connectionId' in a dictionary */
  let anomaliesDict = {};
  edgesCollection.forEach(a => {
    anomaliesDict[a[idKey]] = (anomaliesDict[a[idKey]] || []).concat(a.duplicates);
  });

  /* mix all metric's duplicates with anomaly's duplicates if they have the same connectionId */
  return metricsEdges.map(m => {
    const res = { ...m };
    const anomalyDuplicates = anomaliesDict[m[idKey]];
    if (anomalyDuplicates) {
      res.latestAnomalyTime = Math.max(...anomalyDuplicates.map(a => a.record.anomalies[0][1]));
      res.duplicates = m.duplicates.concat(anomalyDuplicates);
      res.hasAnomaly = true;
      res.anomalies = anomalyDuplicates.map(a => ({
        anomalyId: a.anomalyId,
        affectedEdges: anomalyConnectionsDict[a.anomalyId],
      }));
    }
    return res;
  });
};

const groupDataOnNodesAndEdges = (dataSets = [], sourceKey, destinationKey, context = [], options = {}) => {
  const { isAnomaly = false, anomalyPrefix = '', anomalyId = null, filters } = options;
  if (!dataSets.length || !sourceKey || !destinationKey) {
    return { nodes: [], edges: [] };
  }

  const edgesDict = {};

  dataSets.forEach(({ metric, dataSet }) => {
    dataSet.forEach(record => {
      const fieldsDict = {};
      const { properties } = record;

      properties.forEach(({ key, value }) => {
        fieldsDict[key] = value;
      });

      if (
        !fieldsDict[sourceKey] ||
        fieldsDict[sourceKey] === 'unknown' ||
        !fieldsDict[destinationKey] ||
        fieldsDict[destinationKey] === 'unknown'
      ) {
        return;
      }

      if (filters) {
        /* Here we can filter edges for a subchart */
        let isMatching = true;
        for (let key in filters) {
          if (key === 'name') {
            isMatching = fieldsDict[sourceKey] === filters.name || fieldsDict[destinationKey] === filters.name;
          } else {
            isMatching = fieldsDict[key] === filters[key];
          }
          if (!isMatching) {
            return;
          }
        }
      }

      const fromNodeId = getNodeId(fieldsDict, sourceKey, context);
      const toNodeId = getNodeId(fieldsDict, destinationKey, context);

      if (fromNodeId === toNodeId) {
        return;
      } // we don't need edges connecting the same node

      /* As we need from->to edge has the same Id as to->from, we can just sort them as strings and keep in permanent order */
      const sortedDirections = [fromNodeId, toNodeId].sort((a, b) => a.localeCompare(b));
      const connectionId = sortedDirections[0] + splitSign + sortedDirections[1]; // same for both directions
      if (!edgesDict[connectionId]) {
        edgesDict[connectionId] = {
          // same values for all duplicates
          connectionId,
          endPoints: [fromNodeId, toNodeId], // unordered list of end points,
          activeSource: sourceKey,
          activeDest: destinationKey,
          duplicates: [], // place for duplicates differences
          hasAnomaly: false,
        };
      }

      const duplicate = {
        // personal information for every record
        isAnomaly,
        metric,
        from: fromNodeId.replace('"name":', `"${sourceKey}":`),
        to: toNodeId.replace('"name":', `"${destinationKey}":`),
        record,
      };

      if (isAnomaly) {
        duplicate.anomalyId = anomalyId;
      }

      edgesDict[connectionId].duplicates.push(duplicate);
    });
  });

  const linksCounter = {};
  const nodesDict = {};
  const edges = Object.values(edgesDict);

  edges.forEach(edge => {
    /* build nodes dict based on edges' end-points and count amount of links for every node */
    const { connectionId, duplicates, endPoints, activeDest, activeSource } = edge;

    endPoints.forEach((epId, i) => {
      const parsedName = JSON.parse(epId);
      if (filters) {
        /* Here we can filter nodes for a subchart */
        let isMatching = true;
        for (let key in filters) {
          isMatching = parsedName[key] === filters[key];
          if (!isMatching) {
            // endPoints[i] = '{ "name": "out_of_cluster"}';
            return;
          }
        }
      }
      linksCounter[epId] = linksCounter[epId] ? linksCounter[epId] + 1 : 1;
      nodesDict[epId] = nodesDict[epId] || { edgesData: [], fields: context, activeDest, activeSource };
      nodesDict[epId].edgesData.push({ connectionId, duplicates });
    });

    // linksCounter[e.to] = linksCounter[e.to] ? linksCounter[e.to] + 1 : 1;
    // // put unique directions in a dict
    // nodesDict[e.from] = nodesDict[e.from] || {edgesData: [], fields: [ sourceKey, ...context]};
    // nodesDict[e.from].edgesData.push({ connectionId, duplicates });
    // nodesDict[e.to] = nodesDict[e.to] || {edgesData: [], fields: [ destinationKey, ...context]};
    // nodesDict[e.to].edgesData.push({ connectionId, duplicates })
  });

  /* add value based on the counter - how many links do every node has */
  const nodes = Object.keys(nodesDict).map(nodeId => {
    const { edgesData, activeDest, activeSource } = nodesDict[nodeId];
    return {
      cluster: '0',
      value: nodeId === ('unknown' || !linksCounter[nodeId]) ? 0 : linksCounter[nodeId],
      nodesEdges: edgesData,
      nodeId,
      nodeData: { ...JSON.parse(nodeId), activeDest, activeSource },
    };
  });

  return { nodes, edges };
};

export function convertBackAnomalies(groupedList) {
  const dict = {};
  groupedList.forEach(group => {
    const { duplicates, ...directInfo } = group;
    duplicates.forEach(d => {
      dict[d.anomalyId] = dict[d.anomalyId] || [];
      dict[d.anomalyId].push({ directInfo, ...d });
    });
  });

  return Object.keys(dict).map(anomalyId => ({
    id: anomalyId,
    duplicates: dict[anomalyId],
    anomalyData: dict[anomalyId]?.[0]?.anomalyData,
  }));
}

const clusteriseData = ({ nodes }, clusterBy) => {
  const root = { id: 'root', type: 'cluster', children: [] };
  nodes.forEach((node, index) => {
    const n = { ...node, type: 'node', index };

    if (clusterBy) {
      const parentsContext = JSON.parse(node.nodeId);
      delete parentsContext[clusterBy]; // all fields except clusterBy field

      n.cluster = JSON.stringify(parentsContext);

      let cluster = root.children.find(c => c.id === n.cluster);
      if (cluster) {
        cluster.children.push(n);
      } else {
        root.children.push({
          id: n.cluster,
          nodeData: { ...parentsContext, role: 'cluster' },
          type: 'cluster',
          children: [n],
        });
      }
    } else {
      let cluster = root.children.find(c => c.id === n.cluster);
      if (cluster) {
        cluster.children.push(n);
      } else {
        root.children.push({ id: n.cluster, type: 'cluster', children: [n] });
      }
    }
  });

  return root;
};

export function getQueryParamsUrl(params, url = '') {
  const format = (str, key) => {
    if (params[key]) {
      return str + (str === url ? '?' : '&') + `${key}=${params[key]}`;
    }
    return str;
  };

  return Object.keys(params).reduce(format, url);
}

export const getPluoral = (n, base, suffix = 's') => base + (n === 1 ? '' : suffix);

export function getDateRange(days, startFlag) {
  if (isNaN(days)) {
    if (days?.length) {
      // custom case when calendar gives us an array [from, to], not amount of days
      const [fromDate, toDate] = days.map(d => new Date(d).getTime() / 1000);
      return startFlag ? { startDate: fromDate, endDate: toDate } : { fromDate, toDate };
    }
    return {}; // no values
  } else {
    const SECS_IN_DAY = 86400; // 24 * 60 * 60
    const toDate = Math.floor(Date.now() / 1000);
    const fromDate = toDate - days * SECS_IN_DAY;
    return startFlag ? { startDate: fromDate, endDate: toDate } : { fromDate, toDate };
  }
}

export const formatDate = (secs, format = 'MM/DD/YYYY') => {
  const addZero = v => ('0' + v).slice(-2);
  let d = new Date(secs * 1000);
  const hours = `${addZero(d.getHours())}:${addZero(d.getMinutes())}`;
  const date = format
    .replace('DD', addZero(d.getDate()))
    .replace('MM', addZero(d.getMonth() + 1))
    .replace('YYYY', addZero(d.getYear() - 100));
  return (checkIsToday(secs * 1000) ? 'Today ' : `${date} `) + hours;
};

export const checkIsToday = mSeconds => {
  return new Date().getTime() - mSeconds < 86400000 && new Date().getDate() === new Date(mSeconds).getDate();
};

export const formatDuration = (seconds, shortPostfix = false) => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${shortPostfix ? 'm' : getPluoral(minutes, 'minute')}`;
  }
  const roundedHours = Math.round(minutes / 30) / 2;
  if (roundedHours > 24) {
    const days = Math.round(roundedHours / 24) / 2;
    return `${days} ${shortPostfix ? 'd' : getPluoral(days, 'day')}`;
  }
  return `${roundedHours} ${shortPostfix ? 'h' : getPluoral(roundedHours, 'hour')}`;
};

export function getQ(metric, filters = [], stringify) {
  const expression = [];
  if (metric) {
    expression.push({
      type: 'property',
      key: 'what',
      value: metric,
      isExact: true,
    });
  }
  const q = {
    expression: [...expression, ...filters],
  };
  return stringify ? JSON.stringify(q) : q;
}

export const manageLinksInCluster = (links, clusterFields, clusterBy) => {
  /* mutate links from child nodes to cluster's center */
  const subConnectionsMap = {};
  links.forEach(l => {
    l.endPoints = l.endPoints.map(ep => {
      const clusterDefinition = JSON.parse(ep);
      delete clusterDefinition[clusterBy];

      return isEqual(clusterDefinition, clusterFields) ? ep : '{"role": "cluster_center"}';
    });
    const sortedDirections = l.endPoints.sort((a, b) => a.localeCompare(b));
    l.subConnectionId = sortedDirections[0] + splitSign + sortedDirections[1];
    subConnectionsMap[l.subConnectionId] = subConnectionsMap[l.subConnectionId] || [];
    subConnectionsMap[l.subConnectionId].push(l);
  });

  return Object.values(subConnectionsMap).map(edges => {
    if (edges.length > 1) {
      const duplicates = edges.map(edge => edge.duplicates);
      return {
        ...edges[0],
        duplicates: [].concat(...duplicates),
        hasAnomaly: duplicates.some(d => d.isAnomaly),
      };
    } else {
      return edges[0];
    }
  });
};

export function readTime(time: TimeRange, startName = 'startDate', endName = 'endDate'): TimeFilter {
  const from = Math.floor(new Date(time!.from.valueOf()).getTime() / 1000);
  const to = Math.floor(new Date(time!.to.valueOf()).getTime() / 1000);
  return {
    [startName]: from,
    [endName]: to,
  };
}

export const arrayToOptions = (arr, key) =>
  arr.map(item => {
    const value = key ? item[key] : item;
    return { label: value, value };
  });

export const addLabel = value => ({ label: value, value });
