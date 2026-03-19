import { HiOutlineArrowRight } from 'react-icons/hi';
import { parseServiceKey, getDisplayApplicationName } from '@pinpoint-fe/ui/src/utils';
import { Edge } from '@pinpoint-fe/server-map';
import { ServerIcon } from '../Application/ServerIcon';

export interface ChartsBoardHeaderProps {
  currentTarget: {
    imgPath?: string;
    applicationName?: string;
    type?: string;
    source?: string;
    target?: string;
    edges?: Edge[];
  } | null;
}

export const ChartsBoardHeader = ({ currentTarget }: ChartsBoardHeaderProps) => {
  return (
    <div className="flex items-center h-12 gap-2 px-2 text-lg font-semibold shrink-0 border-b-1">
      {currentTarget &&
        (currentTarget?.type === 'node' ? (
          <>
            <ServerIcon application={currentTarget} className="" />
            <div className="truncate">{currentTarget?.applicationName}</div>
          </>
        ) : (
          (() => {
            const parsedSource = parseServiceKey(currentTarget?.source ?? '');
            const sourceApp = {
              applicationName: getDisplayApplicationName(parsedSource.applicationName),
              serviceType: parsedSource.serviceType,
            };
            const targetApp = currentTarget.edges
              ? {
                  applicationName: `total: ${currentTarget.edges.length}`,
                  serviceType: parseServiceKey(currentTarget.edges[0].target).serviceType,
                }
              : (() => {
                  const parsedTarget = parseServiceKey(currentTarget?.target ?? '');
                  return {
                    applicationName: getDisplayApplicationName(parsedTarget.applicationName),
                    serviceType: parsedTarget.serviceType,
                  };
                })();

            return (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center flex-1 gap-2">
                  <ServerIcon application={sourceApp} className="" />
                  <div className="truncate">{sourceApp?.applicationName}</div>
                </div>
                <div className="w-5 mx-3">
                  <HiOutlineArrowRight />
                </div>
                <div className="flex items-center flex-1 gap-2">
                  <ServerIcon application={sourceApp} className="" />
                  <div className="truncate">{targetApp?.applicationName}</div>
                </div>
              </div>
            );
          })()
        ))}
    </div>
  );
};
