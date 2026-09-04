import { renderHook, act } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import {
  configurationAtom,
  CurrentTarget,
  selectedServiceAtom,
  serverMapCurrentTargetAtom,
  serverMapDataAtom,
} from '@pinpoint-fe/ui/src/atoms';
import { Configuration, GetServerMap } from '@pinpoint-fe/ui/src/constants';
import { useServerMapRequestServiceName } from './useServerMapRequestServiceName';

const mockLocation = { pathname: '/serviceMap/aService' };
jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useLocation: () => mockLocation,
}));

const store = getDefaultStore();

const configWithServiceMap = (enable: boolean) =>
  ({ 'experimental.enableServiceMap.value': enable }) as unknown as Configuration;

const setEnableServiceMap = (enable: boolean) => {
  act(() => {
    store.set(configurationAtom, configWithServiceMap(enable));
  });
};

const node = (serviceName: string, applicationName: string) =>
  ({
    key: `${serviceName}^${applicationName}^SPRING_BOOT`,
    serviceName,
    applicationName,
    serviceType: 'SPRING_BOOT',
  }) as GetServerMap.NodeData;

const link = (fromServiceName: string, fromApplicationName: string) =>
  ({
    key: `${fromServiceName}^${fromApplicationName}^SPRING_BOOT~otherService^b-1^SPRING_BOOT`,
    sourceInfo: {
      serviceName: fromServiceName,
      applicationName: fromApplicationName,
      serviceType: 'SPRING_BOOT',
    },
  }) as GetServerMap.LinkData;

const setMap = (
  nodeDataArray: GetServerMap.NodeData[],
  linkDataArray: GetServerMap.LinkData[] = [],
) => {
  act(() => {
    store.set(serverMapDataAtom, {
      applicationMapData: { nodeDataArray, linkDataArray },
    } as GetServerMap.Response);
  });
};

const setTarget = (target?: CurrentTarget) => {
  act(() => {
    store.set(serverMapCurrentTargetAtom, target);
  });
};

const render = (pathname = '/serviceMap/aService') => {
  mockLocation.pathname = pathname;
  return renderHook(() => useServerMapRequestServiceName()).result.current;
};

describe('useServerMapRequestServiceName', () => {
  beforeEach(() => {
    setEnableServiceMap(true);
    act(() => {
      store.set(selectedServiceAtom, 'aService');
    });
    setMap([]);
    setTarget(undefined);
  });

  // 이 훅의 존재 이유. 값이 도중에 undefined에서 바뀌면 queryKey가 갈려 같은 조회가 두 번 나간다.
  test('falls back to the screen service while nothing is picked yet', () => {
    setMap([node('aService', 'a-1')]);
    setTarget(undefined);

    expect(render('/serviceMap/aService').requestServiceName).toBe('aService');
  });

  test('keeps the same value once a node of the screen service is picked', () => {
    setMap([node('aService', 'a-1')]);

    const beforePick = render('/serviceMap/aService').requestServiceName;

    setTarget({ id: 'aService^a-1^SPRING_BOOT', type: 'node' });
    const afterPick = render('/serviceMap/aService');

    expect(beforePick).toBe('aService');
    expect(afterPick.requestServiceName).toBe('aService');
    expect(afterPick.isCrossServiceTarget).toBe(false);
  });

  test('uses the picked node service when it belongs to another service', () => {
    setMap([node('aService', 'a-1'), node('bService', 'b-1')]);
    setTarget({ id: 'bService^b-1^SPRING_BOOT', type: 'node' });

    const result = render('/serviceMap/aService');

    expect(result.requestServiceName).toBe('bService');
    expect(result.isCrossServiceTarget).toBe(true);
  });

  test('uses the source node service when a link is picked', () => {
    setMap([], [link('bService', 'b-1')]);
    setTarget({ id: 'bService^b-1^SPRING_BOOT~otherService^b-1^SPRING_BOOT', type: 'edge' });

    const result = render('/serviceMap/aService');

    expect(result.requestServiceName).toBe('bService');
    expect(result.isCrossServiceTarget).toBe(true);
  });

  // servermap 경로는 serviceName을 싣지 않으므로 화면의 service가 전역 선택값이 된다.
  test('falls back to the selected service on a path without a service name segment', () => {
    setMap([node('aService', 'a-1')]);
    setTarget(undefined);

    expect(render('/serverMap/a-1@SPRING_BOOT').requestServiceName).toBe('aService');
  });

  // 설정이 꺼진 저장소로 헤더가 새어 나가면 안 된다. 캐시 키도 예전 그대로여야 한다.
  test('is undefined when enableServiceMap is off', () => {
    setEnableServiceMap(false);
    setMap([node('aService', 'a-1'), node('bService', 'b-1')]);
    setTarget({ id: 'bService^b-1^SPRING_BOOT', type: 'node' });

    const result = render('/serviceMap/aService');

    expect(result.requestServiceName).toBeUndefined();
    expect(result.isCrossServiceTarget).toBe(false);
  });
});
