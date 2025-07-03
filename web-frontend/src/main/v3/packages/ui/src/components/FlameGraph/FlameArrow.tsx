export interface FlameArrowProps {
  x1?: string | number;
  y1?: string | number;
  x2?: string | number;
  y2?: string | number;
}

export const FlameArrow = ({ x1, y1, x2, y2 }: FlameArrowProps) => {
  return (
    <>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="5.6"
        refX="8"
        refY="2.8"
        orient="auto"
        markerUnits="strokeWidth"
      >
        <polygon points="0 0, 8 2.8, 0 5.6" fill="black" />
      </marker>
      <path
        d={`
    M ${x1},${y1}
    C ${Number(x1) + 70},${y1},
      ${Number(x2) - 70},${y2},
      ${x2},${y2}
  `}
        fill="none"
        stroke="black"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
      />
      {/* <line
        x1={x1 || 0}
        y1={y1 || 0}
        x2={x2 || 0}
        y2={y2 || 0}
        stroke="black"
        strokeWidth="1.5"
        markerEnd="url(#arrowhead)"
      /> */}
    </>
  );
};
