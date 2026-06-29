# Issue #6585 (Scatter Chart 성능 개선) — 현황 분석 & 측정 프로토콜

> 이슈: https://oss.navercorp.com/pinpoint/pinpoint-naver/issues/6585 (Open, 담당: jihea-park)
> 작성 목적: 이어서 진행하기 전에 "현재 OSS 코드베이스에서 무엇이 끝났고, 메모리/렌더 성능이
> 실제로 어디까지 개선됐는지"를 수치로 확정하기 위함. light mode 구현 착수 여부는 이 측정 결과로 결정.

## 1. 코드 반영 현황 (정적 분석)

| 이슈 항목 | 해결책 | 현재 코드 | 위치 |
|---|---|---|---|
| 1. 렌더링 느림 | curr/acc 분리 + 증분 push | ✅ 반영 | `atoms/scatter.ts`, `utils/helper/scatter.ts` |
| 2-1. 메모리: 캐시 off | swr→react-query, 캐시 off | ✅ 반영 | `hooks/api/useGetScatterData.ts` (`gcTime: 0`) |
| 2-2. 메모리: light mode (비트맵만 보유, dot GC) | scatter-chart v1.6.0 lightMode | ❌ 미반영 | scatter-chart v1.5.1, mode 옵션 없음 |

내부 fork에서 진행됐던 작업(원 커밋 `7605c75 [#6585] enhance scatter render performance`,
`2f4c018 [#6585] disable scatter api response cache`) 중 렌더 개선과 캐시 off는 OSS에 반영됨.
light mode(v1.6.0)는 OSS scatter-chart(v1.5.1)에 미포팅.

## 2. 데이터 누적 지점 (= 메모리 위험 지점)

페칭 루프: `useGetScatterData`가 `backwardDirection`, `limit: 10000`으로
`complete: true`가 될 때까지 `to`를 `resultFrom-1`로 당기며 반복 호출 → 모든 틱 데이터가 두 곳에 쌓임.

### (A) Jotai atom `acc` — 무한 누적
- `getScatterData()`가 매 틱 `prev.acc[agentName].push(...)` + `prev.acc[__total__].push(...)` (`utils/helper/scatter.ts:67~`)
- 소비처(전량 필요로 보이는 곳):
  - `components/ServerMap/ServerMapChartBoard.tsx:345` → `ScatterChartStatic data={scatterData.acc[agentId]}`
  - `components/FilterMap/FilteredMapChartsBoard.tsx:204,213,292,302`
- `curr`는 매 틱 초기화되지만 `acc`는 세션 동안 계속 증가.

### (B) scatter-chart 내부 `this.data` / `this.datas[legend]` — 무한 누적
- `render(data, {append:true})` → `this.data = [...this.data, ...data]` (`ScatterChart.ts:417`)
- `this.datas[legend].push(...)` (`ScatterChart.ts:~436`)
- 이 데이터를 버리지 못하는 이유(=light mode 설계 시 풀어야 할 의존성):
  - **legend count**: `setLegendCount`가 `this.datas[type].reduce(...)`로 줌 범위 내 점 개수 계산 (`ScatterChart.ts:320`)
  - **줌/리사이즈 재렌더**: 축 변경 시 보유 데이터로 다시 그림 (`render(this.data)` `ScatterChart.ts:565`)
  - hover tooltip 등 좌표→데이터 역참조

### 참고: 이미 있는 비트맵 능력
- `toBase64Image()` = `capture-mode` 클래스 + `toPng(container)` (`ScatterChart.ts:568`)
- 현재는 **이미지 내보내기 전용**. light mode(스트리밍 중 dot 버리고 누적 비트맵 유지)와는 미연결.
  → light mode 구현 시 이 캡처 경로 재활용 후보.

## 3. 측정 프로토콜 (본인이 실행)

이슈 본문 측정 환경과 동일 기준으로 v2 대비/개선 전후 비교. **3회 평균**.

### 대상 URL (이슈에 기록된 대량 케이스)
- 120만건: `serverMap/APIGW-DEV@VERTX?from=...&to=...` (1시간 범위)
- 350만건: `serverMap/APIGW-DEV@VERTX?from=...&to=...` (3시간 범위)
- ※ 현재 유효한 대량 트래픽 application으로 from/to 갱신 필요.

### 3-1. 렌더링 성능 (문제 1 재측정 — 이슈 본문 미갱신 항목)
1. Chrome DevTools → Performance 탭
2. application 진입 ~ scatter 차트 그리기 완료까지 record
3. 측정값: scatter 렌더에 소요된 scripting/rendering 시간 (이슈는 초 단위 기록)
4. 같은 데이터로 v2(`/`)와 v3(`/v3`) 각각 3회 → 표:

| 건수 | v2(s) | v3(s) | 비교 |
|---|---|---|---|
| ~1,185,446 | | | |
| ~3,577,207 | | | |

→ 목표: 350만건에서 v3가 v2 수준 이하(이슈 본문엔 개선 전 +38%로 기록됨)

### 3-2. 메모리 (문제 2 재측정)
1. DevTools → Memory 탭 (또는 Performance Monitor의 JS heap size)
2. application 진입 후 페칭 완료(차트 그리기 끝)까지 대기
3. **JS Heap 최대치(MB)** 기록. GC 강제 후 안정 heap도 기록.
4. 캐시 off 적용 전후 비교는 어렵다면, 현재값만 확보 후 light mode 적용 시 재측정:

| 건수 | 현재(mb) | (light mode 후, mb) | 증감 |
|---|---|---|---|
| ~50만 | | | |
| ~80만 | | | |
| ~350만 | | | |

5. **한계점 탐색**: 건수를 늘리며 탭이 죽는 임계 heap 확인 (이슈: v2 ~5천만건/3GB대).

### 3-3. 판정 기준 (light mode 착수 여부)
- 렌더: 350만건에서 v2 대비 동등 이하면 문제 1 → **클로징 가능**, 본문에 수치 기록.
- 메모리: 현재 대량 케이스에서 임계 heap이 실사용 데이터 규모 대비 충분히 여유 있으면 light mode 보류 가능.
  반대로 실사용 규모에서 OOM/임계 근접이면 light mode 구현 진행.

## 4. light mode 미착수 시에도 가능한 경량 개선 (옵션)
- atom `acc` 전량 보유 최소화: 소비처가 ServerMapStatic + FilterMap board 뿐 →
  정말 전체 dot 배열이 필요한지, count류만 분리 유지 가능한지 검토.

## 5. 미해결 확인 사항
- 내부 fork(scatter-chart v1.6.0) light mode 구현 접근/포팅 가능 여부 → 내부 scatter-chart 패키지 직접 확인 필요 (코드 검색 미인덱싱).
