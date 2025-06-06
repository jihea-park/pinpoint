import React from 'react';
import { useLocation } from 'react-router-dom';
import { addMilliseconds, subMinutes } from 'date-fns';
import { getApplicationTypeAndName } from '@pinpoint-fe/ui/src/utils';
import { getSearchParameters, getDateRange } from './utils';

export const useServerMapSearchParameters = () => {
  const regex =
    /^(\/serverMap\/realtime|\/scatterFullScreenMode\/realtime|\/heatmapFullScreenMode\/realtime)/;
  const intervalRef = React.useRef<NodeJS.Timeout>();
  const { search, pathname } = useLocation();
  const searchParameters = getSearchParameters(search);
  const queryOption = getServerMapQueryOption(searchParameters);
  const application = getApplicationTypeAndName(pathname);

  const isRealtime = regex.test(pathname);
  const range = getDateRange(search, isRealtime);
  const dateRange = { ...getDateRange(search, false), isRealtime };
  const [realtimeDateRange, setRealtimeDateRange] = React.useState({ ...range, isRealtime });

  React.useEffect(() => {
    if (isRealtime) {
      const now = new Date();
      setRealtimeDateRange({
        from: subMinutes(now, 5),
        to: now,
        isRealtime: true,
      });
      intervalRef.current = setInterval(() => {
        setRealtimeDateRange((prev) => ({
          isRealtime: true,
          from: addMilliseconds(prev.from, 2000),
          to: addMilliseconds(prev.to, 2000),
        }));
      }, 2000);
    } else {
      intervalRef.current && clearInterval(intervalRef.current);
    }
  }, [isRealtime]);
  return {
    search,
    pathname,
    dateRange: isRealtime ? realtimeDateRange : dateRange,
    searchParameters,
    application,
    queryOption,
  };
};

const getServerMapQueryOption = (searchParameters: { [k: string]: string }) => {
  const inbound = searchParameters?.inbound ? parseInt(searchParameters?.inbound, 10) : 1;
  const outbound = searchParameters?.outbound ? parseInt(searchParameters?.outbound, 10) : 1;
  const wasOnly = searchParameters?.wasOnly ? searchParameters?.wasOnly === 'true' : false;
  const bidirectional = searchParameters?.bidirectional
    ? searchParameters?.bidirectional === 'true'
    : false;

  return {
    inbound,
    outbound,
    bidirectional,
    wasOnly,
  };
};
