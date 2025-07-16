import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBoardSkeleton,
  ErrorBoundary,
  ChartsBoard,
  ChartsBoardProps,
  Button,
  ChartTypeButtons,
  InstanceCount,
  ApdexScore,
  ScatterChart,
  Heatmap,
  Separator,
  MergedServerSearchList,
  MergedServerSearchListProps,
  Drawer,
  ServerChartsBoard,
  ScatterChartStatic,
  ChartsBoardHeader,
} from '@pinpoint-fe/ui/src/components';
import { ServerList } from '@pinpoint-fe/web/src/components/ServerList/ServerList';
import { GetServerMap } from '@pinpoint-fe/ui/src/constants';
import {
  useExperimentals,
  useGetServerMapGetResponseTimeHistogramDataV2,
  useServerMapSearchParameters,
} from '@pinpoint-fe/ui/src/hooks';
import { MdArrowBackIosNew, MdArrowForwardIos } from 'react-icons/md';
import { PiArrowSquareOut } from 'react-icons/pi';
import {
  currentServerAtom,
  CurrentTarget,
  NewServerMapCurrentTarget,
  scatterDataAtom,
  serverMapChartTypeAtom,
  serverMapCurrentTargetAtom,
} from '@pinpoint-fe/ui/src/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { getServerImagePath } from '@pinpoint-fe/ui/src/utils';
import { cn } from '@pinpoint-fe/ui/src/lib';
import { RxChevronRight } from 'react-icons/rx';

export interface ServerMapChartsBoardProps extends ServerMapChartsBoardFetcherProps {}

export const ServerMapChartsBoard = ({ ...props }: ServerMapChartsBoardProps) => {
  return (
    <>
      <ErrorBoundary>
        <React.Suspense fallback={<ChartBoardSkeleton />}>
          <ServerMapChartsBoardFetcher {...props} />
        </React.Suspense>
      </ErrorBoundary>
    </>
  );
};

export interface ServerMapChartsBoardFetcherProps
  extends Omit<ChartsBoardProps, 'timestamp' | 'nodeData' | 'header'> {
  nodeName?: string;
  authorizationGuideUrl?: string;
  currentPanelWidth: number;
  SERVER_LIST_WIDTH: number;
  resizeHandleWidth: number;
  SERVERMAP_CONTAINER_ID: string;
  serverMapCurrentTarget?: NewServerMapCurrentTarget;
  setServerMapCurrentTarget?: (target: NewServerMapCurrentTarget) => void;
}

export const ServerMapChartsBoardFetcher = ({
  nodeName,
  authorizationGuideUrl,
  currentPanelWidth,
  SERVER_LIST_WIDTH,
  resizeHandleWidth,
  SERVERMAP_CONTAINER_ID,
  serverMapCurrentTarget,
  setServerMapCurrentTarget,
  children,
  ...props
}: ServerMapChartsBoardFetcherProps) => {
  const { t } = useTranslation();
  const experimentalOption = useExperimentals();
  const { application, dateRange } = useServerMapSearchParameters();

  const chartType = useAtomValue(serverMapChartTypeAtom);

  const currentServer = useAtomValue(currentServerAtom);
  const scatterData = useAtomValue(scatterDataAtom);

  // console.log('currentServer', currentServer);
  // console.log('application', application);
  console.log('serverMapCurrentTarget', serverMapCurrentTarget);
  // console.log('currentTargetData', currentTargetData);

  const [openServerView, setOpenServerView] = React.useState(false);
  const [openServerViewTransitionEnd, setServerViewTransitionEnd] = React.useState(false);
  const [isScatterDataOutdated, setIsScatterDataOutdated] = React.useState(chartType !== 'scatter');

  const useStatisticsAgentState = experimentalOption.statisticsAgentState.value || true;

  const { data, isLoading } = useGetServerMapGetResponseTimeHistogramDataV2({
    useStatisticsAgentState,
    nodeName:
      serverMapCurrentTarget?.hasOwnProperty('data') && !serverMapCurrentTarget?.data
        ? ''
        : serverMapCurrentTarget?.applicationName || application?.applicationName || '',
  });

  React.useEffect(() => {
    if (
      chartType === 'scatter' ||
      (scatterData?.dateRange && scatterData?.dateRange[0] === dateRange.from?.getTime())
      // from, to 둘 다 비교해야하는데 정확한 to를 useGetScatterData가 주지 않음
    ) {
      setIsScatterDataOutdated(false);
      return;
    }

    setIsScatterDataOutdated(true);
  }, [dateRange, scatterData]);

  const getClickedMergedNodeList = ({ nodes, edges }: NewServerMapCurrentTarget) => {
    if (nodes?.length) {
      return nodes?.sort((node1, node2) => node2?.totalCount - node1?.totalCount);
    }
    if (edges?.length) {
      return edges?.sort((edge1, edge2) => edge2?.totalCount - edge1?.totalCount);
    }
    return [];
  };

  const handleClickMergedItem: MergedServerSearchListProps['onClickItem'] = (nodeData) => {
    const { key, applicationName, serviceType } = nodeData;
    setServerMapCurrentTarget?.({
      id: key,
      applicationName,
      serviceType,
      imgPath: getServerImagePath(nodeData),
      type: 'node',
      nodes: serverMapCurrentTarget?.nodes,
      edges: serverMapCurrentTarget?.edges,
    });
  };

  const shouldHideScatter = React.useCallback(() => {
    return (
      serverMapCurrentTarget &&
      serverMapCurrentTarget?.data &&
      !(serverMapCurrentTarget?.data as GetServerMap.NodeData)?.isWas
    );
  }, [serverMapCurrentTarget]);

  const getServerData = React.useCallback(() => {
    if (!isLoading && data) {
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
    }

    return;
  }, [isLoading, data]);
  const serverData = getServerData();

  const timestamp = React.useMemo(() => {
    return data?.timeSeriesHistogram?.[0]?.values?.map((v) => v?.[0]);
  }, [data]);

  const renderChildren = () => {
    if (
      serverMapCurrentTarget?.type === 'node' &&
      serverMapCurrentTarget?.data &&
      !(serverMapCurrentTarget?.data as GetServerMap.NodeData)?.isAuthorized
    ) {
      return (
        <div className="flex justify-center pt-24 font-semibold text-status-fail">
          <a href={authorizationGuideUrl} target="_blank">
            You don't have authorization.
            {authorizationGuideUrl && <PiArrowSquareOut />}
          </a>
        </div>
      );
    }

    const hasNodesOrEdges = serverMapCurrentTarget?.nodes || serverMapCurrentTarget?.edges;
    // const isCurrentTargetUndefined = currentTargetData === undefined;
    // const isEdge = serverMapCurrentTarget?.type === 'edge';
    const isNode = serverMapCurrentTarget?.type === 'node';
    const hasServerList = Object.keys(data?.serverList || {}).length > 0;

    if (hasNodesOrEdges) {
      return (
        <MergedServerSearchList
          list={getClickedMergedNodeList(serverMapCurrentTarget) as GetServerMap.NodeData[]}
          onClickItem={handleClickMergedItem}
        />
      );
    }

    return (
      <>
        {hasServerList ? (
          <div className="flex items-center h-12 py-2.5 px-4 gap-2">
            <Button
              className="px-2 py-1 text-xs"
              variant="outline"
              onClick={() => setOpenServerView(!openServerView)}
            >
              {openServerView ? <MdArrowForwardIos /> : <MdArrowBackIosNew />}
              <span className="ml-2">VIEW SERVERS</span>
            </Button>
            <ChartTypeButtons />
            <InstanceCount nodeData={serverMapCurrentTarget as GetServerMap.NodeData} />
          </div>
        ) : !shouldHideScatter() ? (
          <div className="flex items-center h-12 py-2.5 px-4 gap-2">
            <ChartTypeButtons />
          </div>
        ) : null}

        {!shouldHideScatter() && (
          <>
            <div
              className={cn('w-full p-5', {
                'mb-12 aspect-[1.618]': chartType === 'scatter',
                'aspect-[1.4]': chartType === 'heatmap',
              })}
            >
              <div className="h-7">
                <ApdexScore
                  nodeData={(serverMapCurrentTarget as GetServerMap.NodeData) || application}
                />
              </div>

              {chartType === 'scatter' ? (
                <ScatterChart node={(serverMapCurrentTarget || application) as CurrentTarget} />
              ) : (
                <Heatmap
                  nodeData={(serverMapCurrentTarget as GetServerMap.NodeData) || application}
                />
              )}
            </div>
            <Separator />
          </>
        )}
      </>
    );
  };

  return (
    <>
      <ChartsBoard
        {...props}
        header={
          <ChartsBoardHeader
            currentTarget={
              openServerView
                ? null
                : serverMapCurrentTarget || {
                    ...application,
                    type: 'node',
                  }
            }
          />
        }
        timestamp={timestamp}
        nodeData={
          (serverMapCurrentTarget?.data as GetServerMap.NodeData)?.isAuthorized === false
            ? undefined
            : (serverData as unknown as GetServerMap.NodeData)
        }
        emptyMessage={t('COMMON.NO_DATA')}
      >
        {renderChildren()}
      </ChartsBoard>
      <Drawer
        open={openServerView}
        getContainer={`#${SERVERMAP_CONTAINER_ID}`}
        contentWrapperStyle={{
          width: currentPanelWidth + SERVER_LIST_WIDTH,
          right: currentPanelWidth + resizeHandleWidth,
        }}
        afterOpenChange={(openChange) => setServerViewTransitionEnd(openChange)}
        onClose={() => setOpenServerView(false)}
      >
        <div style={{ width: SERVER_LIST_WIDTH }}>
          <div className="flex items-center h-12 gap-1 font-semibold border-b-1 shrink-0">
            <img
              src={
                serverMapCurrentTarget?.imgPath || `/img/servers/${application?.serviceType}.png`
              }
              width={52}
            />
            <div className="truncate">
              {serverMapCurrentTarget?.applicationName || application?.applicationName}
            </div>
          </div>
          <ServerList disableFetch={!openServerView} />
        </div>
        <div style={{ width: currentPanelWidth }}>
          <ServerChartsBoard
            header={
              <div className="flex items-center h-12 gap-1 font-semibold border-b-1 shrink-0">
                <div className="flex items-center">
                  <RxChevronRight />
                </div>
                {currentServer?.agentId}
              </div>
            }
            disableFetch={!openServerView && !openServerViewTransitionEnd}
            nodeData={serverMapCurrentTarget as GetServerMap.NodeData}
          >
            {!shouldHideScatter() && application && (
              <>
                <div className="w-full p-5 mb-12 aspect-[1.618] relative">
                  <div className="h-7">
                    {currentServer?.agentId && (
                      <ApdexScore
                        nodeData={serverMapCurrentTarget as GetServerMap.NodeData}
                        agentId={currentServer?.agentId}
                      />
                    )}
                  </div>
                  <ScatterChartStatic
                    application={serverMapCurrentTarget!}
                    data={
                      isScatterDataOutdated ? [] : scatterData.acc[currentServer?.agentId || '']
                    }
                    range={[dateRange.from.getTime(), dateRange.to.getTime()]}
                    selectedAgentId={currentServer?.agentId || ''}
                  />
                  {isScatterDataOutdated && (
                    <div className="absolute top-0 left-0 z-[1000] flex flex-col items-center justify-center w-full h-[calc(100%+48px)] bg-background/50 text-center">
                      {t('SERVER_MAP.SCATTER_CHART_STATIC_WARN')
                        .split('\n')
                        .map((txt, i) => (
                          <p key={i}>{txt}</p>
                        ))}
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}
          </ServerChartsBoard>
        </div>
      </Drawer>
    </>
  );
};
