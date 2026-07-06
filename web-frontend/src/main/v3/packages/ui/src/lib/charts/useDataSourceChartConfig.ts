import { InspectorAgentDataSourceChart } from '@pinpoint-fe/ui/src/constants';
import { useChartType } from './useChartType';
import { InspectorChartOptions, InspectorSeriesOption } from './useChartConfig';
import { AxisTooltipParam } from './useChartTooltip';
import { DataSourceTooltipRow, useDataSourceChartTooltip } from './useDataSourceChartTooltip';

// Agent DataSource 차트의 커스텀 tooltip 이 렌더링되는 외부 요소 id.
export const DATA_SOURCE_TOOLTIP_ID = 'dataSourceTooltip';

export const useDataSourceChartConfig = (data?: InspectorAgentDataSourceChart.Response | null) => {
  const { getTooltipData, getTooltipStr, tooltipTitleList } = useDataSourceChartTooltip(
    data?.metricValueGroups,
  );
  const { getChartType } = useChartType();

  if (!data) return null;

  const chartData = {
    title: data.title,
    timestamp: data.timestamp,
    metricValues: data.metricValueGroups.map(({ metricValues, tags }, index) => {
      const id = tags.find(({ name }) => name === 'id')?.value ?? index;
      const databaseName = tags.find(({ name }) => name === 'databaseName')?.value ?? `Database`;
      const newFieldName = `${databaseName}-${id}`;

      return { ...metricValues[0], fieldName: newFieldName, dataLabel: databaseName };
    }),
  };

  const unit = chartData.metricValues[0]?.unit ?? '';

  const seriesOptions = chartData.metricValues.reduce<Record<string, InspectorSeriesOption>>(
    (acc, { fieldName, chartType, unit: fieldUnit, dataLabel }) => {
      acc[fieldName] = {
        ...getChartType(chartType),
        unit: fieldUnit,
        name: dataLabel,
      };
      return acc;
    },
    {},
  );

  // 커스텀 tooltip: 모든 database group 의 값을 표로 만들어 외부 요소(#dataSourceTooltip)에 그린다.
  // floating tooltip 을 쓰지 않으므로 formatter 는 부수효과 후 빈 문자열을 반환한다.
  const tooltipFormatter = (params: AxisTooltipParam[]) => {
    const element =
      typeof document !== 'undefined' && document.querySelector(`#${DATA_SOURCE_TOOLTIP_ID}`);
    if (!element || !Array.isArray(params) || params.length === 0) return '';

    const focusIndex = params[0].dataIndex ?? 0;
    const colorBySeriesIndex: Record<number, string | undefined> = {};
    params.forEach((param) => {
      if (typeof param.seriesIndex === 'number') {
        colorBySeriesIndex[param.seriesIndex] = param.color;
      }
    });

    const values = getTooltipData(focusIndex);
    const rows: DataSourceTooltipRow[] = chartData.metricValues.map((metricValue, index) => ({
      name: metricValue.dataLabel,
      color: colorBySeriesIndex[index],
      values: values[index] ?? {},
    }));

    element.innerHTML = getTooltipStr(['', ...tooltipTitleList], rows);
    return '';
  };

  const chartOptions: InspectorChartOptions = {
    seriesOptions,
    yAxis: [{ unit, name: 'Active Avg' }],
    // billboard 에서 dataSource 차트는 tooltip.linked 를 쓰지 않았으므로 그룹에 넣지 않는다.
    legendShow: false,
    tooltipFormatter,
  };

  return { chartData, chartOptions };
};
