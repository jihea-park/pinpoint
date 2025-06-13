import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBoardSkeleton,
  ErrorBoundary,
  ChartsBoard,
  ChartsBoardProps,
} from '@pinpoint-fe/ui/src/components';
import { GetServerMap } from '@pinpoint-fe/ui/src/constants';
import {
  useExperimentals,
  useGetServerMapGetResponseTimeHistogramDataV2,
} from '@pinpoint-fe/ui/src/hooks';

export interface ServerMapChartsBoardProps extends ServerMapChartsBoardFetcherProps {}

export const ServerMapChartsBoard = ({ ...props }: ServerMapChartsBoardProps) => {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<ChartBoardSkeleton />}>
        <ServerMapChartsBoardFetcher {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export interface ServerMapChartsBoardFetcherProps
  extends Omit<ChartsBoardProps, 'timestamp' | 'nodeData'> {}

export const ServerMapChartsBoardFetcher = ({
  children,
  ...props
}: ServerMapChartsBoardFetcherProps) => {
  const { t } = useTranslation();
  const experimentalOption = useExperimentals();
  const useStatisticsAgentState = experimentalOption.statisticsAgentState.value || true;
  const { data } = useGetServerMapGetResponseTimeHistogramDataV2({ useStatisticsAgentState });

  const getServerData = React.useCallback(() => {
    return {
      histogram: data?.histogram,
      responseStatistics: data?.responseStatistics,
      timeSeriesHistogram: data?.timeSeriesHistogram?.map((tsh) => {
        return {
          ...tsh,
          values: tsh.values.map((v) => v?.[1]),
        };
      }),
    };
  }, [data]);
  const serverData = getServerData();
  const timestamp = React.useMemo(() => {
    return data?.timeSeriesHistogram?.[0]?.values?.map((v) => v?.[0]);
  }, [data]);

  return (
    <ChartsBoard
      {...props}
      timestamp={timestamp}
      nodeData={serverData as unknown as GetServerMap.NodeData}
      emptyMessage={t('COMMON.NO_DATA')}
    >
      {children}
    </ChartsBoard>
  );
};
