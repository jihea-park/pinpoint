import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getServerMapPath,
  convertParamsToQueryString,
  getRealtimePath,
} from '@pinpoint-fe/ui/src/utils';
import { useServerMapSearchParameters } from '@pinpoint-fe/ui/src/hooks';
import {
  serverMapDataAtom,
  serverMapCurrentTargetAtom,
  CurrentTarget,
  NewServerMapCurrentTarget,
} from '@pinpoint-fe/ui/src/atoms';
import { Configuration, GetServerMap } from '@pinpoint-fe/ui/src/constants';
import {
  DatetimePicker,
  DatetimePickerChangeHandler,
  MainHeader,
  LayoutWithHorizontalResizable,
  ApplicationCombinedList,
  HelpPopover,
  ApplicationCombinedListProps,
} from '@pinpoint-fe/ui';
import { PiTreeStructureDuotone } from 'react-icons/pi';
import { ServerMapChartsBoard } from '@pinpoint-fe/ui/src/components/ServerMap/ServerMapChartBoard';
import { ServerMapTemp } from '@pinpoint-fe/ui/src/components/ServerMapTemp';

export interface ServermapPageProps {
  authorizationGuideUrl?: string;
  configuration?: Configuration & Record<string, string>;
  ApplicationList?: (props: ApplicationCombinedListProps) => JSX.Element;
}

export const ServerMapPage = ({
  authorizationGuideUrl,
  configuration,
  ApplicationList = ApplicationCombinedList,
}: ServermapPageProps) => {
  const periodMax = configuration?.[`periodMax.serverMap`];
  const periodInterval = configuration?.[`periodInterval.serverMap`];
  const SERVERMAP_CONTAINER_ID = 'server-map-main-container';
  const containerRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { dateRange, application, searchParameters, queryOption, pathname } =
    useServerMapSearchParameters();
  const [serverMapCurrentTarget, setServerMapCurrentTarget] = React.useState<
    NewServerMapCurrentTarget | undefined
  >();
  // const serverMapData = useAtomValue(serverMapDataAtom);

  const { t } = useTranslation();

  // console.log('serverMapData', serverMapData);
  // console.log('serverMapCurrentTarget', serverMapCurrentTarget);
  // console.log('currentTargetData', currentTargetData);

  // React.useEffect(() => {
  //   // setShowFilter(false);

  //   if (
  //     serverMapData &&
  //     serverMapData?.applicationMapData?.nodeDataArray &&
  //     serverMapData?.applicationMapData?.nodeDataArray.length
  //   ) {
  //     let currentTarget: CurrentTarget;
  //     const isTargetIncluded =
  //       serverMapCurrentTarget &&
  //       ((serverMapData.applicationMapData.nodeDataArray as GetServerMap.NodeData[]).some(
  //         ({ key }) => key === serverMapCurrentTarget.id,
  //       ) ||
  //         (serverMapData.applicationMapData.linkDataArray as GetServerMap.LinkData[]).some(
  //           ({ key }) => key === serverMapCurrentTarget.id,
  //         ));

  //     if (isTargetIncluded || serverMapCurrentTarget?.nodes || serverMapCurrentTarget?.edges) {
  //       currentTarget = serverMapCurrentTarget;
  //       setServerMapCurrentTarget(currentTarget);
  //     } else {
  //       const applicationInfo = (
  //         serverMapData.applicationMapData.nodeDataArray as GetServerMap.NodeData[]
  //       ).find((node) => {
  //         return (
  //           getApplicationKey(application!) === node.key ||
  //           (node.applicationName === application?.applicationName &&
  //             node.serviceType === 'UNAUTHORIZED')
  //         );
  //       })!;

  //       if (applicationInfo) {
  //         const { applicationName, serviceType } = applicationInfo;
  //         currentTarget = {
  //           applicationName,
  //           serviceType,
  //           imgPath: getServerImagePath({ applicationName, serviceType }),
  //           type: 'node',
  //         };
  //         setServerMapCurrentTarget(currentTarget);
  //       }
  //     }
  //   } else {
  //     setServerMapCurrentTarget(undefined);
  //   }
  // }, [serverMapData]);

  const handleChangeDateRagePicker = React.useCallback(
    (({ formattedDates: formattedDate, isRealtime }) => {
      if (isRealtime) {
        navigate(`${getRealtimePath(application!)}`);
      } else {
        navigate(
          `${getServerMapPath(application!)}?${convertParamsToQueryString({
            ...formattedDate,
            ...queryOption,
          })}`,
        );
      }
    }) as DatetimePickerChangeHandler,
    [application?.applicationName, queryOption],
  );

  return (
    <div className="flex flex-col flex-1 h-full">
      <MainHeader
        title={
          <div className="flex items-center gap-2">
            <PiTreeStructureDuotone />
            <div className="flex items-center gap-1">
              Servermap
              <HelpPopover helpKey="HELP_VIEWER.SERVER_MAP" />
            </div>
          </div>
        }
      >
        <ApplicationList
          open={!application}
          selectedApplication={application}
          onClickApplication={(application) => navigate(getServerMapPath(application))}
        />
        {application && (
          <div className="flex gap-1 ml-auto">
            <DatetimePicker
              enableRealtimeButton
              from={searchParameters.from}
              to={searchParameters.to}
              onChange={handleChangeDateRagePicker}
              maxDateRangeDays={periodMax}
              outOfDateRangeMessage={t('DATE_RANGE_PICKER.MAX_SEARCH_PERIOD', {
                maxSearchPeriod: periodMax,
              })}
              timeUnits={periodInterval}
            />
            <HelpPopover helpKey="HELP_VIEWER.NAVBAR" />
          </div>
        )}
      </MainHeader>
      {application && (
        <div
          id={SERVERMAP_CONTAINER_ID}
          className="relative flex-1 h-full overflow-x-hidden"
          ref={containerRef}
        >
          <LayoutWithHorizontalResizable>
            <ServerMapTemp
              serverMapCurrentTarget={serverMapCurrentTarget}
              setServerMapCurrentTarget={setServerMapCurrentTarget}
            />
            {({ currentPanelWidth, SERVER_LIST_WIDTH, resizeHandleWidth }) => (
              <>
                <ServerMapChartsBoard
                  authorizationGuideUrl={authorizationGuideUrl}
                  currentPanelWidth={currentPanelWidth}
                  SERVER_LIST_WIDTH={SERVER_LIST_WIDTH}
                  resizeHandleWidth={resizeHandleWidth}
                  SERVERMAP_CONTAINER_ID={SERVERMAP_CONTAINER_ID}
                  serverMapCurrentTarget={serverMapCurrentTarget}
                  setServerMapCurrentTarget={setServerMapCurrentTarget}
                />
              </>
            )}
          </LayoutWithHorizontalResizable>
        </div>
      )}
    </div>
  );
};
