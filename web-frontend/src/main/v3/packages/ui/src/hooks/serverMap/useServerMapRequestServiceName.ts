import { useServiceNameForLink } from '../utility/useServiceNameForLink';
import { useServerMapTargetServiceName } from './useServerMapTargetServiceName';

/**
 * map 우측 패널(ChartsBoard·실시간)의 조회가 나갈 service.
 *
 * 고른 노드가 있으면 그 노드의 service(`useServerMapTargetServiceName`), 아직 아무것도 고르지
 * 않았으면 화면의 service(`useServiceNameForLink` — 경로의 serviceName, 없으면 전역 선택값)다.
 * `enableServiceMap`이 꺼져 있으면 둘 다 undefined이므로 이 값도 undefined다. 그때는 요청에
 * 헤더가 실리지 않고, 캐시 키도 예전 그대로다.
 *
 * **폴백이 이 훅의 존재 이유다.** 대상의 service를 그대로 내려주면 페이지에 처음 들어올 때
 * 값이 `undefined → 화면의 service`로 한 번 바뀐다. 그 값이 조회 훅들의 queryKey에 들어 있어서
 * (헤더와 캐시 키가 같은 값에서 나와야 하므로) 키가 갈리고, 캐시에 없는 키라 React Query가
 * 같은 URL·같은 헤더로 요청을 한 번 더 보낸다 — apdex·statistics·scatter·heatmap이 진입할
 * 때마다 두 번씩 나갔다.
 *
 * 값이 `undefined`인 구간이 생기는 이유는 이렇다. map 응답이 오기 전에는 고른 대상이 없으므로
 * (`serverMapCurrentTargetDataAtom`이 undefined) 대상의 service를 알 수 없는데, 그동안에도
 * 우측 패널은 경로의 application을 기준으로 이미 조회를 시작한다. 그 조회의 헤더는 fetch
 * 인터셉터가 화면의 service로 채우므로, 처음부터 같은 값을 쓰면 대상이 정해진 뒤에도 키가
 * 그대로다(같은 service의 노드를 고른 경우 — 대부분이 여기에 해당한다).
 *
 * 다른 service의 노드를 고르면 그때는 값이 실제로 바뀌어야 하고, 바뀐 키로 다시 조회하는 것이
 * 맞다. 그 경우를 위해 `isCrossServiceTarget`을 함께 돌려준다 — 경로의 application은 화면
 * service 소속이라 그 요청의 기준이 될 수 없으므로, 호출자가 노드 자신을 기준으로 바꿔야 한다
 * (`useGetHistogramStatistics`의 `ignorePathApplication`).
 */
export const useServerMapRequestServiceName = () => {
  const targetServiceName = useServerMapTargetServiceName();
  const screenServiceName = useServiceNameForLink();

  return {
    /** 이 조회에 실을 service. 헤더(`pServiceName`)와 queryKey에 같이 쓴다. */
    requestServiceName: targetServiceName ?? screenServiceName,
    /** 고른 대상이 화면의 service가 아닌 다른 service에 속하는지 여부. */
    isCrossServiceTarget:
      !!targetServiceName && !!screenServiceName && targetServiceName !== screenServiceName,
  };
};
