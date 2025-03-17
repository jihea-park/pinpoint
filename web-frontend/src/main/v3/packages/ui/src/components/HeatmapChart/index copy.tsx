import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { throttle } from 'lodash';

const data = [
  { group: 'A', variable: 'v1', value: '30' },
  { group: 'A', variable: 'v2', value: '95' },
  { group: 'A', variable: 'v3', value: '22' },
  { group: 'A', variable: 'v4', value: '14' },
  { group: 'A', variable: 'v5', value: '59' },
  { group: 'A', variable: 'v6', value: '52' },
  { group: 'A', variable: 'v7', value: '88' },
  { group: 'A', variable: 'v8', value: '20' },
  { group: 'A', variable: 'v9', value: '99' },
  { group: 'A', variable: 'v10', value: '66' },
  { group: 'B', variable: 'v1', value: '37' },
  { group: 'B', variable: 'v2', value: '50' },
  { group: 'B', variable: 'v3', value: '81' },
  { group: 'B', variable: 'v4', value: '79' },
  { group: 'B', variable: 'v5', value: '84' },
  { group: 'B', variable: 'v6', value: '91' },
  { group: 'B', variable: 'v7', value: '82' },
  { group: 'B', variable: 'v8', value: '89' },
  { group: 'B', variable: 'v9', value: '6' },
  { group: 'B', variable: 'v10', value: '67' },
  { group: 'C', variable: 'v1', value: '96' },
  { group: 'C', variable: 'v2', value: '13' },
  { group: 'C', variable: 'v3', value: '98' },
  { group: 'C', variable: 'v4', value: '10' },
  { group: 'C', variable: 'v5', value: '86' },
  { group: 'C', variable: 'v6', value: '23' },
  { group: 'C', variable: 'v7', value: '74' },
  { group: 'C', variable: 'v8', value: '47' },
  { group: 'C', variable: 'v9', value: '73' },
  { group: 'C', variable: 'v10', value: '40' },
  { group: 'D', variable: 'v1', value: '75' },
  { group: 'D', variable: 'v2', value: '18' },
  { group: 'D', variable: 'v3', value: '92' },
  { group: 'D', variable: 'v4', value: '43' },
  { group: 'D', variable: 'v5', value: '16' },
  { group: 'D', variable: 'v6', value: '27' },
  { group: 'D', variable: 'v7', value: '76' },
  { group: 'D', variable: 'v8', value: '24' },
  { group: 'D', variable: 'v9', value: '1' },
  { group: 'D', variable: 'v10', value: '87' },
  { group: 'E', variable: 'v1', value: '44' },
  { group: 'E', variable: 'v2', value: '29' },
  { group: 'E', variable: 'v3', value: '58' },
  { group: 'E', variable: 'v4', value: '55' },
  { group: 'E', variable: 'v5', value: '65' },
  { group: 'E', variable: 'v6', value: '56' },
  { group: 'E', variable: 'v7', value: '9' },
  { group: 'E', variable: 'v8', value: '78' },
  { group: 'E', variable: 'v9', value: '49' },
  { group: 'E', variable: 'v10', value: '36' },
  { group: 'F', variable: 'v1', value: '35' },
  { group: 'F', variable: 'v2', value: '80' },
  { group: 'F', variable: 'v3', value: '8' },
  { group: 'F', variable: 'v4', value: '46' },
  { group: 'F', variable: 'v5', value: '48' },
  { group: 'F', variable: 'v6', value: '100' },
  { group: 'F', variable: 'v7', value: '17' },
  { group: 'F', variable: 'v8', value: '41' },
  { group: 'F', variable: 'v9', value: '33' },
  { group: 'F', variable: 'v10', value: '11' },
  { group: 'G', variable: 'v1', value: '77' },
  { group: 'G', variable: 'v2', value: '62' },
  { group: 'G', variable: 'v3', value: '94' },
  { group: 'G', variable: 'v4', value: '15' },
  { group: 'G', variable: 'v5', value: '69' },
  { group: 'G', variable: 'v6', value: '63' },
  { group: 'G', variable: 'v7', value: '61' },
  { group: 'G', variable: 'v8', value: '54' },
  { group: 'G', variable: 'v9', value: '38' },
  { group: 'G', variable: 'v10', value: '93' },
  { group: 'H', variable: 'v1', value: '39' },
  { group: 'H', variable: 'v2', value: '26' },
  { group: 'H', variable: 'v3', value: '90' },
  { group: 'H', variable: 'v4', value: '83' },
  { group: 'H', variable: 'v5', value: '31' },
  { group: 'H', variable: 'v6', value: '2' },
  { group: 'H', variable: 'v7', value: '51' },
  { group: 'H', variable: 'v8', value: '28' },
  { group: 'H', variable: 'v9', value: '42' },
  { group: 'H', variable: 'v10', value: '7' },
  { group: 'I', variable: 'v1', value: '5' },
  { group: 'I', variable: 'v2', value: '60' },
  { group: 'I', variable: 'v3', value: '21' },
  { group: 'I', variable: 'v4', value: '25' },
  { group: 'I', variable: 'v5', value: '3' },
  { group: 'I', variable: 'v6', value: '70' },
  { group: 'I', variable: 'v7', value: '34' },
  { group: 'I', variable: 'v8', value: '68' },
  { group: 'I', variable: 'v9', value: '57' },
  { group: 'I', variable: 'v10', value: '32' },
  { group: 'J', variable: 'v1', value: '19' },
  { group: 'J', variable: 'v2', value: '85' },
  { group: 'J', variable: 'v3', value: '53' },
  { group: 'J', variable: 'v4', value: '45' },
  { group: 'J', variable: 'v5', value: '71' },
  { group: 'J', variable: 'v6', value: '64' },
  { group: 'J', variable: 'v7', value: '4' },
  { group: 'J', variable: 'v8', value: '12' },
  { group: 'J', variable: 'v9', value: '97' },
  { group: 'J', variable: 'v10', value: '72' },
];

type HeatmapData = {
  group: string;
  variable: string;
  value: string;
};
const DEFAULT = 450;

const HeatmapChart = ({ data: _data }: { data?: any }) => {
  const margin = { top: 20, right: 25, bottom: 30, left: 40 };
  // const width = 450 - margin.left - margin.right;
  // const height = 450 - margin.top - margin.bottom;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0); // chartWidth
  const [height, setHeight] = useState(0); // chartHeight

  useEffect(() => {
    if (containerRef.current) {
      const throttledCalculateHeight = throttle(() => {
        setWidth((containerRef.current?.clientWidth || DEFAULT) - margin.left - margin.right);
        setHeight((containerRef.current?.clientHeight || DEFAULT) - margin.left - margin.right);
      }, 200);

      const resizeObserver = new ResizeObserver(() => {
        throttledCalculateHeight();
      });

      resizeObserver.observe(containerRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, []);

  const svgRef = useRef<SVGSVGElement>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>();
  const [selectedCells, setSelectedCells] = useState(new Set<string>()); // 'group:variable'

  useEffect(() => {
    if (!data) {
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // 기존 요소 삭제

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const myGroups = Array.from(new Set(data.map((d) => d.group)));
    const myVars = Array.from(new Set(data.map((d) => d.variable)));

    console.log('myGroups', myGroups);
    console.log('myVars', myVars);

    // x축 생성
    const x = d3.scaleBand().range([0, width]).domain(myGroups).padding(0.05);
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain')
      .remove();

    // y축 생성
    const y = d3.scaleBand().range([height, 0]).domain(myVars).padding(0.05);
    g.append('g').call(d3.axisLeft(y).tickSize(0)).select('.domain').remove();

    // 색상 스케일
    const myColor = d3.scaleSequential().interpolator(d3.interpolateInferno).domain([1, 100]);

    const tooltip = d3
      .select('body')
      .append('div')
      .style('opacity', 0)
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background-color', 'white')
      .style('border', 'solid 2px')
      .style('border-radius', '5px')
      .style('padding', '5px');

    const mouseover = (event: MouseEvent, _d: HeatmapData) => {
      tooltip.style('opacity', 1);
      d3.select(event?.currentTarget as SVGRectElement)
        .style('stroke', 'black')
        .style('opacity', 1);
    };

    const mouseleave = (event: MouseEvent, _d: HeatmapData) => {
      tooltip.style('opacity', 0);
      d3.select(event.currentTarget as SVGRectElement)
        .style('stroke', 'none')
        .style('opacity', 0.8);
    };

    const mousedown = (event: MouseEvent, d: HeatmapData) => {
      console.log('mousedown', d, `${d.group}:${d.variable}`, event);
      setStartPoint({ x: x(d.group) || 0, y: y(d.variable) || 0 });

      const newSet = new Set<string>();
      newSet.add(`${d.group}:${d.variable}`);
      setSelectedCells(newSet);
    };

    const mousemove = (event: MouseEvent, d: HeatmapData) => {
      if (!startPoint) {
        tooltip
          .html(`The exact value of this cell is: ${d.value}`)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`);
        return;
      }

      const endPoint = {
        x: x(d.group) || 0,
        y: y(d.variable) || 0,
      };

      const xMin = Math.min(startPoint.x, endPoint.x);
      const xMax = Math.max(startPoint.x, endPoint.x) + x.bandwidth();
      const yMin = Math.min(startPoint.y, endPoint.y);
      const yMax = Math.max(startPoint.y, endPoint.y) + y.bandwidth();

      // 드래그 영역 내에 있는 모든 셀 선택
      const newSelectedCells = new Set<string>();

      data.forEach((d) => {
        const cellLeft = x(d.group) ?? 0;
        const cellTop = y(d.variable) ?? 0;

        const cellWidth = x.bandwidth();
        const cellHeight = y.bandwidth();

        const cellRight = cellLeft + cellWidth;
        const cellBottom = cellTop + cellHeight;

        if (cellLeft >= xMin && cellRight <= xMax && cellTop >= yMin && cellBottom <= yMax) {
          newSelectedCells.add(`${d.group}:${d.variable}`);
        }
      });

      setSelectedCells(newSelectedCells);
    };

    const mouseup = (_event: MouseEvent, _d: HeatmapData) => {
      console.log('mouseup', selectedCells);

      setStartPoint(null);
      setSelectedCells(new Set());
    };

    // Success 하나 더 그려서 Failed 표현
    const cells = g
      .selectAll()
      .data(
        data.filter((d) => {
          return x(d.group) && y(d.variable);
        }),
        (d) => `${d?.group}:${d?.variable}`,
      )
      .join('rect')
      .attr('x', (d) => x(d.group) || 0)
      .attr('y', (d) => y(d.variable) || 0)
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', (d) =>
        selectedCells.has(d.group + ':' + d.variable) ? 'red' : myColor(Number(d?.value)),
      )
      .style('fill-opacity', 0.5) // 투명도 50%
      .style('stroke-width', 4)
      .on('mouseover', mouseover)
      .on('mousemove', mousemove)
      .on('mouseleave', mouseleave)
      .on('mousedown', mousedown)
      .on('mouseup', mouseup);

    // Failed
    // const cells2 = g
    //   .selectAll()
    //   .data(data, (d) => `${d?.group}:${d?.variable}`)
    //   .join('rect')
    //   .attr('x', (d) => x(d.group) || 0)
    //   .attr('y', (d) => y(d.variable) || 0)
    //   .attr('rx', 4)
    //   .attr('ry', 4)
    //   .attr('width', x.bandwidth())
    //   .attr('height', y.bandwidth())
    //   .style('fill', (d) =>
    //     selectedCells.has(d.group + ':' + d.variable) ? 'white' : myColor(Number(d?.value)),
    //   )
    //   .style('fill-opacity', 0.5) // 투명도 50%
    //   .style('stroke-width', 4)
    //   .on('mouseover', mouseover)
    //   .on('mousemove', mousemove)
    //   .on('mouseleave', mouseleave)
    //   .on('mousedown', mousedown)
    //   .on('mouseup', mouseup);

    return () => {
      tooltip.remove();
    };
  }, [width, height, data, selectedCells, startPoint]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '500px' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default HeatmapChart;
