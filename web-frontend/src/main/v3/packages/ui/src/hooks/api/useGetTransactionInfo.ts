import useSWR from 'swr';
import { END_POINTS, TransactionInfoType as TransactionInfo } from '@pinpoint-fe/ui/src/constants';
import { convertParamsToQueryString } from '@pinpoint-fe/ui/src/utils';
import { useTransactionSearchParameters } from '../searchParameters';
import { swrConfigs } from './swrConfigs';
import { useExperimentals } from '../utility';

const getQueryString = (queryParams: Partial<TransactionInfo.Parameters>) => {
  if (queryParams?.agentId && queryParams?.spanId && queryParams?.traceId) {
    return '?' + convertParamsToQueryString(queryParams);
  }
  return '';
};

export const useGetTransactionInfo = () => {
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

  const { data, isLoading, isValidating } = useSWR<TransactionInfo.Response>(
    queryString ? `${END_POINTS.TRANSACTION_INFO}${queryString}` : null,
    swrConfigs,
  );

  return { data, isLoading, isValidating };
};
