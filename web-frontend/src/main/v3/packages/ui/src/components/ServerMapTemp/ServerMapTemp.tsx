import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ErrorBoundary,
  ServerMapCore,
  ServerMapCoreProps,
  ServerMapSkeleton,
} from '@pinpoint-fe/ui/src/components';
import { FilterWizard } from '@pinpoint-fe/ui/src/components/FilterMap';
import { GetServerMap, FilteredMapType as FilteredMap } from '@pinpoint-fe/ui/src/constants';
import {
  useExperimentals,
  useGetServerMapDataV2,
  useServerMapSearchParameters,
} from '@pinpoint-fe/ui/src/hooks';
import { IoMdClose } from 'react-icons/io';
import {
  getServerMapPath,
  convertParamsToQueryString,
  getFormattedDateRange,
  getBaseNodeId,
  getServerImagePath,
} from '@pinpoint-fe/ui/src/utils';
import { MergedEdge, MergedNode } from '@pinpoint-fe/server-map';
import { serverMapDataAtom, NewServerMapCurrentTarget } from '@pinpoint-fe/ui/src/atoms';
import { useAtom } from 'jotai';
import {
  useFilterWizardOnClickApply,
  useServerMapOnClickMenuItem,
} from '@pinpoint-fe/ui/src/hooks/servermap';

export interface ServerMapTempFetcherProps {
  serverMapCurrentTarget?: NewServerMapCurrentTarget;
  setServerMapCurrentTarget?: (target: NewServerMapCurrentTarget | undefined) => void;
}

export const ServerMapTemp = ({ ...props }: ServerMapTempFetcherProps) => {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<ServerMapSkeleton className="w-full h-full" />}>
        <ServerMapTempFetcher {...props} />
      </React.Suspense>
    </ErrorBoundary>
  );
};

export const ServerMapTempFetcher = ({
  serverMapCurrentTarget,
  setServerMapCurrentTarget,
}: ServerMapTempFetcherProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { dateRange, application, searchParameters, queryOption, pathname } =
    useServerMapSearchParameters();
  const experimentalOption = useExperimentals();
  const useStatisticsAgentState = experimentalOption.statisticsAgentState.value || true;

  const [filter, setFilter] = React.useState<FilteredMap.FilterState>();
  const [showFilter, setShowFilter] = React.useState(false);

  // TODO: ServerMap.tsx에서 local state로 변경 필요
  const [serverMapData, setServerMapDataAtom] = useAtom(serverMapDataAtom);
  // const [serverMapCurrentTarget, setServerMapCurrentTarget] = useAtom(serverMapCurrentTargetAtom);

  // console.log('serverMapCurrentTarget', serverMapCurrentTarget);

  React.useEffect(() => {
    setShowFilter(false);
    setServerMapCurrentTarget?.(undefined);
  }, [pathname]);

  const { data, isLoading, error } = useGetServerMapDataV2({
    shouldPoll: false,
    useStatisticsAgentState,
  });

  React.useEffect(() => {
    setServerMapDataAtom(data);
  }, [data]);

  // FilterWizard
  const handleClickApply = useFilterWizardOnClickApply<GetServerMap.LinkData>({
    from: searchParameters.from,
    to: searchParameters.to,
  });

  // ServerMapCore
  const handleClickNode: ServerMapCoreProps['onClickNode'] = ({
    data: clickedNodeData,
    eventType,
  }) => {
    const { label, type, imgPath, id, nodes } = clickedNodeData as MergedNode;
    if (eventType === 'left' || eventType === 'programmatic') {
      let targetData;

      if (type === 'USER') {
        targetData = (data?.applicationMapData?.nodeDataArray as GetServerMap.NodeData[])?.find(
          ({ category }) => category === type,
        );
      }

      targetData = (data?.applicationMapData?.nodeDataArray as GetServerMap.NodeData[])?.find(
        ({ key }) => key === id || key === `${label}^${type}`,
      );

      setServerMapCurrentTarget?.({
        id,
        applicationName: label,
        serviceType: type,
        imgPath: imgPath!,
        nodes: nodes?.map((n) => {
          const nodeDataFromServerMapData = data?.applicationMapData?.nodeDataArray?.find(
            (nda: GetServerMap.NodeData) => nda?.key === n?.id,
          );
          return {
            ...n,
            ...nodeDataFromServerMapData,
          };
        }),
        data: targetData,
        type: 'node',
      });
    }
  };

  const handleClickEdge: ServerMapCoreProps['onClickEdge'] = ({
    data: clickedEdgeData,
    eventType,
  }) => {
    const { id, source, target, edges } = clickedEdgeData as MergedEdge;
    if (eventType === 'left') {
      let targetData = (data?.applicationMapData?.linkDataArray as GetServerMap.LinkData[])?.find(
        ({ key }) => key === id,
      );

      setServerMapCurrentTarget?.({
        id,
        source,
        target,
        edges: edges?.map((e) => {
          const nodeDataFromServerMapData = data?.applicationMapData?.nodeDataArray?.find(
            (nda: GetServerMap.NodeData) => nda?.key === e?.target,
          );

          return {
            ...e,
            ...nodeDataFromServerMapData,
          };
        }),
        data: targetData,
        type: 'edge',
      });
    }
  };

  const handleMergeStateChange = () => {
    if (data) {
      const [applicationName, serviceType] = getBaseNodeId({
        application,
        applicationMapData: data?.applicationMapData,
      }).split('^');

      setServerMapCurrentTarget?.({
        applicationName,
        serviceType,
        imgPath: getServerImagePath({ applicationName, serviceType }),
        type: 'node',
      });
    }
  };

  const handleClickMenuItem = useServerMapOnClickMenuItem<
    GetServerMap.NodeData,
    GetServerMap.LinkData
  >({
    from: searchParameters.from,
    to: searchParameters.to,
    setFilter,
    setShowFilter,
  });

  return (
    <div className="relative w-full h-full">
      {application && (
        <>
          {showFilter && (
            <div className="absolute top-3 left-3 z-[1] bg-background rounded-lg shadow-lg border">
              <button
                className="absolute text-xl top-3 right-3 text-muted-foreground"
                onClick={() => setShowFilter(false)}
              >
                <IoMdClose />
              </button>
              <FilterWizard
                hideStatus={true}
                tempFilter={filter}
                openConfigures={true}
                onClickApply={handleClickApply}
              />
            </div>
          )}
          <ServerMapCore
            data={data || {}}
            isLoading={isLoading}
            error={error}
            forceLayoutUpdate={true}
            onClickNode={handleClickNode}
            onClickEdge={handleClickEdge}
            onMergeStateChange={handleMergeStateChange}
            baseNodeId={getBaseNodeId({
              application,
              applicationMapData: data?.applicationMapData,
            })}
            inputPlaceHolder={t('COMMON.SEARCH_INPUT')}
            queryOption={queryOption}
            onApplyChangedOption={(option) => {
              navigate(
                `${getServerMapPath(application)}?${convertParamsToQueryString({
                  ...getFormattedDateRange(dateRange),
                  ...option,
                })}`,
              );
            }}
            onClickMenuItem={handleClickMenuItem}
          />
        </>
      )}
    </div>
  );
};
