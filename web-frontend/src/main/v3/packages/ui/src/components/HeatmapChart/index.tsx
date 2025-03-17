import React from 'react';
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

// 행과 열의 레이블
const myGroups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const myVars = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9', 'v10'];

type HeatmapData = {
  group: string;
  variable: string;
  value: string;
};

type Cell = { x: number; y: number; width: number; height: number; value: any };

const DEFAULT = 450;

const HeatmapChart = ({ data: _data }: { data?: any }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [cells, setCells] = React.useState<Cell[]>([]);
  const [selectedCells, setSelectedCells] = React.useState(new Set());

  React.useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);

    return () => {
      window.removeEventListener('resize', drawChart);
    };
  }, []);

  function drawChart() {
    if (canvasRef.current === null || containerRef.current === null) {
      return;
    }
    // 컨테이너 크기 가져오기
    const containerWidth = containerRef.current.offsetWidth;
    const containerHeight = containerRef.current.offsetHeight;

    // 캔버스 해상도 설정 (내부 크기)
    canvasRef.current.width = containerWidth;
    canvasRef.current.height = containerHeight;

    const ctx = canvasRef.current.getContext('2d');

    if (ctx === null) {
      return;
    }

    // 스케일 변환 초기화
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 여백 및 차원 설정
    const margin = { top: 30, right: 30, bottom: 30, left: 30 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const cellWidth = width / myGroups.length;
    const cellHeight = height / myVars.length;

    const colorScale = (value: number) => `rgba(${255 - value * 2.5}, 0, ${value * 2.5}, 0.5)`;

    const newCells: Cell[] = [];

    data.forEach((d) => {
      const x = margin.left + myGroups.indexOf(d.group) * cellWidth;
      const y = margin.top + myVars.indexOf(d.variable) * cellHeight;
      ctx.fillStyle = selectedCells.has(`${d.group}:${d.variable}`)
        ? 'red'
        : colorScale(Number(d.value));
      ctx.fillRect(x, y, cellWidth, cellHeight);
      ctx.strokeStyle = 'black';
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      newCells.push({ x, y, width: cellWidth, height: cellHeight, value: d.value });
    });

    setCells(newCells);
  }

  function handleMouseMove(event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) {
    const rect = canvasRef?.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 마우스 아래의 셀 찾기
    const cell = cells.find(
      (c) => mouseX >= c.x && mouseX <= c.x + c.width && mouseY >= c.y && mouseY <= c.y + c.height,
    );

    console.log('cell', cell);

    if (cell) {
      // tooltip.style.opacity = 1;
      // tooltip.style.left = `${event.pageX + 10}px`;
      // tooltip.style.top = `${event.pageY + 10}px`;
      // tooltip.innerHTML = `Value: ${cell.value}`;
    } else {
      // tooltip.style.opacity = 0;
    }
  }

  return (
    <div
      id="chartContainer"
      ref={containerRef}
      style={{ width: '100%', height: DEFAULT, position: 'relative' }}
    >
      <canvas
        id="canvas"
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        onMouseMove={handleMouseMove}
      ></canvas>
      <div
        id="tooltip"
        style={{
          position: 'absolute',
          opacity: 0,
          backgroundColor: 'white',
          border: 'solid 1px black',
          borderRadius: '5px',
          padding: '5px',
          pointerEvents: 'none',
        }}
      ></div>
    </div>
  );
};

export default HeatmapChart;
