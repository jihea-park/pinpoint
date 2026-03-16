import { GetServerMap } from '@pinpoint-fe/ui/src/constants';

type LinkedData = Pick<GetServerMap.NodeData, 'applicationName' | 'serviceTypeCode'>;

export const useServerMapLinkedData = ({
  serverMapData,
  currentTargetData,
}: {
  serverMapData?: GetServerMap.ApplicationMapData;
  currentTargetData?: GetServerMap.NodeData;
}) => {
  return serverMapData?.linkDataArray.reduce(
    (acc, curr) => {
      if (curr.from === currentTargetData?.serviceKey) {
        acc?.to.push({
          applicationName: curr.targetInfo.applicationName,
          serviceTypeCode: curr.targetInfo.serviceTypeCode,
        });
      } else if (curr.to === currentTargetData?.serviceKey) {
        acc?.from.push({
          applicationName: curr.sourceInfo.applicationName,
          serviceTypeCode: curr.sourceInfo.serviceTypeCode,
        });
      }
      return acc;
    },
    { from: [], to: [] } as { from: LinkedData[]; to: LinkedData[] },
  );
};
