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

### 대상 application/시간대 (확정 — 2026-06-29 localhost:8080 백엔드 실측)

**application: `APIGW-DEV-PGD1` (VERTX)** — 현재 유효한 고트래픽 게이트웨이.
실측으로 윈도우별 총 dot 수를 페이지네이션 누적해 확인. 이슈의 두 tier를 거의 정확히 재현:

| 윈도우 | 실측 총 건수 | 이슈 대응 tier | from (KST) | to (KST) |
|---|---|---|---|---|
| 1시간 | 607,912 | — | 2026-06-29-15-43-20 | 2026-06-29-16-43-20 |
| **2시간** | **1,198,516** | **이슈 120만건 (1,185,446)** | 2026-06-29-14-43-20 | 2026-06-29-16-43-20 |
| 3시간 | 1,780,058 | 중간 | 2026-06-29-13-43-20 | 2026-06-29-16-43-20 |
| **6시간** | **3,585,814** | **이슈 350만건 (3,577,207)** | 2026-06-29-10-43-20 | 2026-06-29-16-43-20 |

측정 URL (dev 서버, base `/`, KST 기준 `yyyy-MM-dd-HH-mm-ss`):

```
# 120만건 (2h)
http://localhost:3000/serverMap/APIGW-DEV-PGD1@VERTX?from=2026-06-29-14-43-20&to=2026-06-29-16-43-20&inbound=1&outbound=1&bidirectional=false&wasOnly=false

# 350만건 (6h)
http://localhost:3000/serverMap/APIGW-DEV-PGD1@VERTX?from=2026-06-29-10-43-20&to=2026-06-29-16-43-20&inbound=1&outbound=1&bidirectional=false&wasOnly=false
```

- 서버맵 로드 후 `APIGW-DEV-PGD1` 노드를 선택하면 우측 패널 scatter가 렌더됨(측정 대상).
- ⚠️ HBase TTL로 데이터가 만료되므로 **위 시간대는 곧 무효화됨**. 재측정 시:
  `scratchpad/count_scatter.py "APIGW-DEV-PGD1" "VERTX" <hours> <end_epoch_ms>`로 새 윈도우의 실건수 재확인 후 KST 시각으로 URL 생성.
- 프로브 스크립트: `count_scatter.py`(총 건수 누적), `probe_scatter.py`(단일 틱/현재시각 확인).

### 3-1. 렌더링 성능 (문제 1 재측정 — 이슈 본문 미갱신 항목)
측정: Chrome Performance 패널, 노드 클릭~scatter 렌더 완료까지 record 후 Summary 판독.
- 핵심 지표 = **Scripting**(이슈가 지목한 "v3 상태관리 연산"). 보조 = 메인스레드 busy.
- ⚠️ Summary의 **Total은 녹화 구간 길이**(fetch 대기 idle 포함)라 렌더 시간이 아님 → 비교 지표로 쓰지 말 것.

측정 결과 (3회 평균 권장, 아래는 1차):

| 건수 | Scripting | 메인스레드 busy | Painting+Rendering | 전송량 | (녹화 Total) |
|---|---|---|---|---|---|
| 1,198,516 (2h) | **5,431 ms** | ~6,381 ms | 274 ms | 4,075 kB | 29,034 ms (대부분 idle) |
| 3,585,814 (6h) | 녹화 불가 → 임시 계측으로 분해 측정(아래) | | | | |
| 3,585,814 (6h, 12.5s 슬라이스) | 3,358 ms (부분) | — | 127 ms | 2,085 kB | 12,540 ms |

#### 임시 계측 결과 (performance.now, 6h 전체 로드 누적 — 가장 정확)
`getScatterData`(상태관리 연산)와 scatter-chart `render`(캔버스 그리기)를 분해 계측:

| 단계 | 2h(1,198,516) | 6h(3,585,814) | dot 배율 | 시간 배율 |
|---|---|---|---|---|
| getScatterData (상태관리 연산) | 103.9 ms (120 calls) | **289.4 ms** (359 calls) | ×2.99 | ×2.79 (선형) |
| scatter-chart render (캔버스 드로잉) | 1,808.2 ms (126 calls) | **15,631.4 ms** (365 calls) | ×2.99 | **×8.6 (초선형)** |

**핵심 발견 1 — 병목 위치가 바뀜:**
- 이슈 원 가설 = "v3 상태관리 연산이 원인". 그러나 측정 결과 **상태관리는 선형(289ms)으로 거의 무시 가능**(curr/acc 개선 `7605c75`로 이미 해결).
- **실제 병목은 캔버스 render = 15.6초** (3.5M). 상태관리가 아니라 **드로잉/카운트 비용**.

**핵심 발견 2 — render가 O(n²)로 추정 (구체적 최적화 포인트):**
- render는 dot ×3에 시간 ×8.6 → **초선형**. 원인 유력: `render()`가 매 틱마다 `setLegendCount`에서
  `this.datas[type].reduce(...)`로 **누적 전체를 재카운트**함 (`scatter-chart/src/ui/ScatterChart.ts:320`).
  틱마다 누적 전량을 다시 도는 구조 → 총 작업량 ≈ O(n²).
- → **개선안**: legend count를 매 틱 전량 재계산하지 말고 **증분 카운트**(이번 틱 delta만 더함)로 전환.
  이것만으로 대량 케이스 render 시간 대폭 단축 기대. (이슈 #1의 남은 실질 개선 포인트)
- 그 외 후보: 오프스크린/배치 드로잉, 다운샘플링, WebGL.
- ※ 계측 overhead(per-call console.log) 포함이라 절대값은 보수적으로 해석. 배율/비율이 핵심.

- 메인스레드 busy 내역: localhost(앱) 2,496.8ms + [unattributed](GC·브라우저) 3,883.6ms.
- **6h(350만건) 확인 결과 (중요): 사이트·스캐터차트는 정상 렌더됨. 죽는 건 DevTools Performance "녹화" 탭뿐.**
  - 즉 **앱은 3.5M을 버팀 → 이슈 #2(탭이 죽는 메모리 리밋)는 현재 코드에서 3.5M으로 재현 안 됨.**
    캐시 off + curr/acc 개선으로 이슈 최악 케이스를 견디는 것으로 보임. → **light mode 필요성 낮아짐.**
  - Performance 녹화는 ~30~60초간 전 이벤트를 메모리에 적재 → 대량 로드에서 DevTools 자체가 OOM (앱 문제 아님).
  - 6h 렌더 Scripting은 녹화 대신 (A) 8~10초 짧은 녹화 또는 (B) performance.mark/measure 임시 계측으로 확보.
- v2 비교는 v2 앱 구동 시에만. 이슈 본문은 개선 전 350만건에서 v3가 v2 대비 +38%였음.
→ 목표: 350만건에서 v3가 v2 수준 이하.

### 3-2. 메모리 (문제 2 재측정)
측정: Performance Monitor의 JS heap size, 또는 Console에서 `performance.memory.usedJSHeapSize` 폴링(peak 자동 추적, Chrome 전용). Performance "녹화"는 대량 로드에서 DevTools를 죽이므로 사용 금지.

측정 결과 (2026-06-29, APIGW-DEV-PGD1, localhost:8080):

| 건수 | peak heap(MB) | GC 후 잔존(MB) |
|---|---|---|
| 3,585,814 (6h) | **1,352.7** | **669.1** |

- 이슈 본문의 탭 사망 임계 = "3GB 후반~4GB". → **350만건 peak 1.35GB는 임계의 약 1/3, 여유 큼.**
- 죽으려면 대략 2.5~3배(≈900만~1000만건) 규모 필요 → 일반 조회 범위 밖.
- 사이트·스캐터차트는 6h에서 정상 렌더(앞 절 참고). 즉 캐시 off + curr/acc로 이슈 #2가 실사용 규모에서 해소됨.

### 3-3. 판정 (측정 완료)
- **메모리(이슈 #2): 사실상 해결.** 350만건 peak 1.35GB로 임계(3.5~4GB) 대비 충분한 여유.
  → **light mode 불필요(보류)**. (단, 수천만건 초대량 케이스까지 보장하려면 별도 과제)
- **렌더(이슈 #1): 상태관리 연산은 해결됨(289ms, 선형). 남은 병목은 render의 초선형(O(n²)) 증가.**
  → 이슈 원 가설("상태관리 연산이 원인")은 curr/acc로 해소됐고, **남은 실질 개선은
    `setLegendCount` 전량 재카운트(O(n²)) → 증분 카운트로 전환**. 이게 이슈 #1의 다음 액션.

### 다음에 할 일 (우선순위)
1. **[권장 다음 작업] render O(n²) 개선**: `scatter-chart/src/ui/ScatterChart.ts`의 `setLegendCount`가
   매 render() 틱마다 `this.datas[type].reduce(...)`로 누적 전량을 재카운트하는 것을 **증분 카운트**로 변경.
   - 변경 후 동일 프로토콜(2h/6h 임시 계측)로 render 시간 재측정해 개선폭 확인.
   - 회귀 주의: 줌/리사이즈/legend 토글 시 카운트 정확성 유지.
2. 측정 결과(메모리 peak 1.35GB, 연산 289ms vs 렌더 15.6s, render O(n²))를 이슈 #6585 본문 코멘트로 정리.
3. light mode·초대량(수천만건) 대응은 **별도 이슈로 분리** 제안.
4. (1) 개선까지 반영되면 이슈 #6585 **클로징** 검토.

### 임시 계측 코드 (측정 완료 → 제거됨)
- 측정에 쓴 `TEMP[#6585]` 계측은 `utils/helper/scatter.ts`, `scatter-chart/src/ui/ScatterChart.ts`에 넣었다가 제거함.
- 재측정 필요 시: 두 함수(getScatterData / ScatterChart.render)에 performance.now 누적 + globalThis 로깅 재삽입.
- 측정 도구: scratchpad `count_scatter.py`(건수), `probe_scatter.py`(현재시각/틱).

## 4. light mode 미착수 시에도 가능한 경량 개선 (옵션)
- atom `acc` 전량 보유 최소화: 소비처가 ServerMapStatic + FilterMap board 뿐 →
  정말 전체 dot 배열이 필요한지, count류만 분리 유지 가능한지 검토.

## 5. 미해결 확인 사항
- 내부 fork(scatter-chart v1.6.0) light mode 구현 접근/포팅 가능 여부 → 내부 scatter-chart 패키지 직접 확인 필요 (코드 검색 미인덱싱).
