import React from 'react';
import { END_POINTS, GetServerMapOnlyResponseTimeHistogram } from '@pinpoint-fe/ui/src/constants';
import { convertParamsToQueryString } from '@pinpoint-fe/ui/src/utils';
import { useServerMapSearchParameters } from '../searchParameters';
import { useQuery } from '@tanstack/react-query';
import { queryFn } from './reactQueryHelper';

const getQueryString = (queryParams: Partial<GetServerMapOnlyResponseTimeHistogram.Parameters>) => {
  if (
    queryParams.useStatisticsAgentState !== null &&
    queryParams.useStatisticsAgentState !== undefined &&
    queryParams.applicationName &&
    queryParams.serviceTypeName &&
    queryParams.from &&
    queryParams.to
  ) {
    return '?' + convertParamsToQueryString(queryParams);
  }
  return '';
};

export const useGetServerMapGetResponseTimeHistogramDataV2 = ({
  useStatisticsAgentState,
}: {
  useStatisticsAgentState?: boolean;
}) => {
  const { dateRange, search, application, queryOption } = useServerMapSearchParameters();
  const from = dateRange.from.getTime();
  const to = dateRange.to.getTime();

  const [queryParams, setQueryParams] = React.useState<
    Partial<GetServerMapOnlyResponseTimeHistogram.Parameters>
  >({
    from,
    to,
    calleeRange: queryOption.inbound,
    callerRange: queryOption.outbound,
    wasOnly: !!queryOption.wasOnly,
    bidirectional: !!queryOption.bidirectional,
    useStatisticsAgentState,
    serviceTypeName: application?.serviceType,
    applicationName: application?.applicationName,
  });
  const queryString = getQueryString(queryParams);

  React.useEffect(() => {
    setQueryParams((prev) => ({
      ...prev,
      applicationName: application?.applicationName,
      serviceTypeName: application?.serviceType,
      calleeRange: queryOption.inbound,
      callerRange: queryOption.outbound,
      wasOnly: !!queryOption.wasOnly,
      bidirectional: !!queryOption.bidirectional,
      useStatisticsAgentState,
      from,
      to,
    }));
  }, [
    application?.applicationName,
    application?.serviceType,
    from,
    to,
    search,
    useStatisticsAgentState,
  ]);

  const { data, isLoading } = useQuery<GetServerMapOnlyResponseTimeHistogram.Response>({
    queryKey: [END_POINTS.SERVER_MAP_GET_RESPONSE_TIME_HISTOGRAM_DATA_V2, queryString],
    queryFn: queryFn(`${END_POINTS.SERVER_MAP_GET_RESPONSE_TIME_HISTOGRAM_DATA_V2}${queryString}`),
    enabled: !!queryString,
  });

  return { data, isLoading };
};
