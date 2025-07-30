import React from 'react';
import { GoDotFill } from 'react-icons/go';
import { FaChartLine } from 'react-icons/fa';
import { BASE_PATH, GetHistogramStatistics } from '@pinpoint-fe/ui/src/constants';
import {
  Button,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
  getInspectorPath,
  useServerMapSearchParameters,
} from '../..';

export interface ServerListProps {
  currentServer?: string;
  data?: GetHistogramStatistics.Response;
  className?: string;
  onClick?: (agentId?: string) => void;
}

export const ServerListTemp = ({ currentServer, data, className, onClick }: ServerListProps) => {
  const { searchParameters, application } = useServerMapSearchParameters();

  return (
    <div className={cn('h-full', className)}>
      <div className="p-3 flex gap-2 flex-col h-[calc(100%-45px)] overflow-y-auto">
        {Object.keys(data?.serverList || {})?.map((groupName, i) => {
          const instancesList = data?.serverList[groupName]?.instanceList;
          return (
            <React.Fragment key={i}>
              <div className="flex items-center h-8 gap-1 text-sm">
                <div className="truncate">{groupName}</div>
              </div>
              <TooltipProvider>
                <ul>
                  {Object.keys(instancesList || {}).map((instanceKey, index) => {
                    const instance = instancesList?.[instanceKey];
                    const slow = data?.agentHistogram?.[instanceKey]?.Slow;
                    const error = data?.agentHistogram?.[instanceKey]?.Error;

                    return (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <li
                            key={index}
                            className={cn(
                              'flex items-center h-7 px-2 cursor-pointer rounded text-xs hover:bg-neutral-200 gap-1',
                              {
                                'font-semibold bg-neutral-200': instanceKey === currentServer,
                              },
                            )}
                            onClick={() => onClick?.(instanceKey)}
                          >
                            <GoDotFill
                              className={cn('fill-status-success mr-1', {
                                'fill-status-warn': !!(slow && slow > 0),
                                'fill-status-fail': !!(error && error > 0),
                              })}
                            />
                            {instance?.agentName || instanceKey}
                            <Button
                              className="z-10 h-5 p-1 ml-auto rounded-sm text-xxs"
                              onClick={() => {
                                window.open(
                                  `${BASE_PATH}${getInspectorPath(application, searchParameters)}&agentId=${instanceKey || ''}`,
                                );
                              }}
                            >
                              <FaChartLine className="text-white" />
                            </Button>
                          </li>
                        </TooltipTrigger>
                        <TooltipContent>
                          <>
                            <div>
                              <span className="text-gray-500">Agent ID:</span> {instanceKey}
                            </div>
                            <div>
                              <span className="text-gray-500">Agent Name:</span>{' '}
                              {instance?.agentName}
                            </div>
                          </>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </ul>
              </TooltipProvider>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
