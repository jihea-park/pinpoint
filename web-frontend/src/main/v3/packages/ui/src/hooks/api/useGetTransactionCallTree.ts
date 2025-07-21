import { END_POINTS, TransactionCallTree } from '@pinpoint-fe/ui/src/constants';
import { convertParamsToQueryString } from '@pinpoint-fe/ui/src/utils';
import { useTransactionSearchParameters } from '../searchParameters';
import { useExperimentals } from '../utility';
import { useSuspenseQuery } from '@tanstack/react-query';
import { queryFn } from './reactQueryHelper';

const getQueryString = (queryParams: Partial<TransactionCallTree.Parameters>) => {
  if (queryParams?.agentId && queryParams?.spanId && queryParams?.traceId) {
    return '?' + convertParamsToQueryString(queryParams);
  }
  return '';
};

export const useGetTransactionCallTree = () => {
  const { statisticsAgentState } = useExperimentals();
  const { transactionInfo } = useTransactionSearchParameters();

  const queryParams = {
    agentId: transactionInfo?.agentId,
    spanId: transactionInfo?.spanId,
    traceId: transactionInfo?.traceId,
    focusTimestamp: transactionInfo?.focusTimestamp,
    useStatisticsAgentState: statisticsAgentState.value,
  };

  const queryString = getQueryString(queryParams);

  const { data, isLoading, refetch } = useSuspenseQuery<TransactionCallTree.Response | null>({
    queryKey: [END_POINTS.TRANSACTION_TRACE_CALL_TREE, queryString],
    queryFn: queryFn(`${END_POINTS.TRANSACTION_TRACE_CALL_TREE}${queryString}`),
  });

  const mapData = getMapData(data ?? undefined);
  const tableData = convertToTree(mapData, '');

  return { data, tableData, isLoading, mapData };
};

const getMapData = (data?: TransactionCallTree.Response) => {
  return data?.callStack.map((callStack, i) => {
    return Object.entries(data?.callStackIndex).reduce((acc, curr) => {
      if (curr[0] === 'agent' && !callStack[curr[1]]) {
        return {
          ...acc,
          [curr[0]]: callStack[curr[1]],
          attributedAgent: getAgentKey(data, i),
        };
      }
      return {
        ...acc,
        [curr[0]]: callStack[curr[1]],
      };
    }, {} as TransactionCallTree.CallStackKeyValueMap);
  });
};

const convertToTree = (
  items: TransactionCallTree.CallStackKeyValueMap[] = [],
  parentId?: string,
): TransactionCallTree.CallStackKeyValueMap[] => {
  const result: TransactionCallTree.CallStackKeyValueMap[] = [];

  for (const item of items) {
    if (item.parentId === parentId) {
      const newItem: TransactionCallTree.CallStackKeyValueMap = {
        ...item,
      };

      const subRows = convertToTree(items, item.id);
      if (subRows.length > 0) {
        newItem.subRows = subRows;
      }

      result.push(newItem);
    }
  }

  return result;
};

const getAgentKey = (datas: TransactionCallTree.Response, rowIndex: number) => {
  let agentKey = null;

  for (let i = rowIndex - 1; agentKey === null; i--) {
    agentKey = datas.callStack[i][20]; // 20th index indicates agentKey
  }
  return agentKey;
};
