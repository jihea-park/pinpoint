import { InspectorAgentDataSourceChart } from '@pinpoint-fe/ui/src/constants';
import { escapeHTMLEntities } from '@pinpoint-fe/ui/src/utils';

export type DataSourceTooltipValues = {
  jdbcUrl?: string;
  serviceType?: string;
  activeAvg?: number;
  activeMax?: number;
  totalMax?: number;
};

export type DataSourceTooltipRow = {
  name: string;
  color?: string;
  values: DataSourceTooltipValues;
};

export const useDataSourceChartTooltip = (
  tooltipData: InspectorAgentDataSourceChart.MetricValueGroup[] = [],
) => {
  const tooltipTitleList = ['Jdbc URL', 'ServiceType', 'Active Avg', 'Active Max', 'Total Max'];

  const getTooltipData = (focusIndex: number): DataSourceTooltipValues[] =>
    tooltipData.map(({ metricValues, tags }) => {
      const getTagValue = (name: string) =>
        tags.find(({ name: tagName }: InspectorAgentDataSourceChart.TagValue) => tagName === name)
          ?.value;
      const getMetricValue = (name: string) =>
        metricValues.find(
          ({ fieldName }: InspectorAgentDataSourceChart.MetricValue) => fieldName === name,
        )?.valueList[focusIndex];
      return {
        jdbcUrl: getTagValue('jdbcUrl'),
        serviceType: getTagValue('serviceType'),
        activeAvg: getMetricValue('activeAvg'),
        activeMax: getMetricValue('activeMax'),
        totalMax: getMetricValue('totalMax'),
      };
    });

  const getTooltipStr = (titleList: string[], rows: DataSourceTooltipRow[]) => {
    const header = titleList.map((title) => `<th>${escapeHTMLEntities(title)}</th>`).join('');
    const body = rows
      .map(({ name, color, values }) => {
        const cells = [
          values.jdbcUrl,
          values.serviceType,
          values.activeAvg,
          values.activeMax,
          values.totalMax,
        ]
          .map(
            (value) =>
              `<td class="value"><div style="word-break:break-all;white-space:normal;">${escapeHTMLEntities(
                String(value ?? ''),
              )}</div></td>`,
          )
          .join('');
        return `<tr>
            <td class="name"><span style="display:inline-block;width:10px;height:10px;margin-right:5px;background-color:${
              color ?? ''
            };"></span>${escapeHTMLEntities(name)}</td>
            ${cells}
          </tr>`;
      })
      .join('');
    return `<table style="width:100%;box-shadow:none;">
    <tbody><tr>${header}</tr>${body}</tbody></table>`;
  };

  return { getTooltipData, getTooltipStr, tooltipTitleList };
};
