import React from 'react';
import cytoscape, { InputEventObject } from 'cytoscape';
import dagre, { DagreLayoutOptions } from 'cytoscape-dagre';
import cytoscapePopper from 'cytoscape-popper';
import { computePosition, flip, shift, limitShift, offset } from '@floating-ui/dom';

import { Node, Edge, MergedNode, MergedEdge, MergeInfo } from '../types';
import { getMergedData } from '../core/merge';
import { getServerMapStyle, getTheme } from '../constants/style/theme-helper';
import { GraphStyle, ServerMapTheme } from '../constants/style/theme';
import { keyBy } from 'lodash';

function popperFactory(ref: any, content: HTMLElement, opts: any) {
  const popperOptions = {
    middleware: [
      offset({ mainAxis: 2, crossAxis: 0 }),
      flip(),
      shift({ limiter: limitShift() }),
    ],
    ...opts,
  };

  function update() {
    const reference = {
      getBoundingClientRect: ref.getBoundingClientRect.bind(ref),
      contextElement: ref,
    };
    computePosition(reference as any, content, popperOptions).then(({ x, y }) => {
      Object.assign(content.style, {
        left: `${x}px`,
        top: `${y}px`,
        position: 'absolute',
        // zIndex: 5555,
        pointerEvents: 'none',
      });
    });
  }
  update();
  return { update, content };
}

function drawSixPartCircle(ctx: CanvasRenderingContext2D, size: number) {
  const center = size / 2;
  const radius = size / 2 - 2;
  const colors = ['blue', 'blue', 'yellow', 'red', 'red', 'white'];

  ctx.clearRect(0, 0, size, size);
  for (let i = 0; i < 6; i++) {
    const startAngle = (-Math.PI / 2) + (i * Math.PI / 3);
    const endAngle = startAngle + Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle, false);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = 'green'; // 테두리 색상
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function createSixPartCircle(): HTMLCanvasElement {
  const size = 40;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  drawSixPartCircle(ctx, size);
  canvas.dataset.originalSize = String(size); // 원본 크기 저장
  return canvas;
}

cytoscape.use(dagre);
cytoscape.use(cytoscapePopper(popperFactory as any));  

type ClickEventHandler<T> = (param: {
  data?: T;
  eventType: 'right' | 'left' | 'programmatic';
  position: Partial<cytoscape.Position>;
}) => void;

export interface ServerMapProps extends Pick<React.HTMLProps<HTMLDivElement>, 'className' | 'style'> {
  data: {
    nodes: Node[];
    edges: Edge[];
  };
  baseNodeId: string;
  customTheme?: ServerMapTheme;
  forceLayoutUpdate?: boolean;
  onClickNode?: ClickEventHandler<MergedNode>;
  onClickEdge?: ClickEventHandler<MergedEdge>;
  onClickBackground?: ClickEventHandler<{}>;
  onDataMerged?: (mergeInfo: MergeInfo) => void;
  renderNodeLabel?: (node: MergedNode) => string | undefined;
  renderEdgeLabel?: (edge: MergedEdge) => string | undefined;
  renderNode?: (node: MergedNode, transactionStatusSVGString: string) => string;
  cy?: (cy: cytoscape.Core) => void;
}

export const ServerMap = ({
  data,
  customTheme = {},
  baseNodeId,
  forceLayoutUpdate,
  onClickNode,
  onClickEdge,
  onClickBackground,
  onDataMerged,
  renderNodeLabel,
  renderEdgeLabel,
  renderNode,
  className,
  style,
  cy,
}: ServerMapProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const cyRef = React.useRef<cytoscape.Core>();
  const layoutRef = React.useRef<cytoscape.Layouts>();
  const poppersRef = React.useRef<any[]>([]);
  const serverMapTheme = getTheme(customTheme);
  const [selectedElementId, setSelectedElementId] = React.useState('');

  React.useEffect(() => {
    return () => {
      cyRef?.current?.destroy();
    };
  }, []);

  React.useEffect(() => {
    setSelectedElementId(baseNodeId);

    if (cyRef.current) {
      layoutRef.current?.removeAllListeners();
      layoutRef.current?.stop();
      layoutRef.current = undefined;
      cyRef.current.removeData();
      cyRef.current.removeAllListeners();
      cyRef.current.destroy();
      cyRef.current = undefined;
    }

    cyRef.current = cytoscape({
      zoom: 1,
      minZoom: 0.1,
      maxZoom: 3,
      wheelSensitivity: 0.2,
      container: containerRef.current,
    });
    cy?.(cyRef.current);

    cyRef.current.style(
      getServerMapStyle({
        cy: cyRef.current,
        theme: serverMapTheme,
        edgeLabelRenderer: renderEdgeLabel,
        nodeLabelRenderer: renderNodeLabel,
      }),
    );

    addEventListener();
  }, [baseNodeId]);

  React.useEffect(() => {
    const cy = cyRef.current;
    if (cy) {
      cy.style(
        getServerMapStyle({
          cy,
          theme: serverMapTheme,
          edgeLabelRenderer: renderEdgeLabel,
          nodeLabelRenderer: renderNodeLabel,
        }),
      );
    }
  }, [renderNodeLabel, renderEdgeLabel]);

  React.useEffect(() => {
    if (data) {
      const cy = cyRef.current;
      if (cy) {
        const { nodes: newNodes, edges: newEdges, mergeInfo } = getMergedData(data, renderNode);
        let addedNodes: cytoscape.CollectionReturnValue[] | undefined;
        onDataMerged?.(mergeInfo);

        cy.batch(() => {
          cy.removeData();
          cy.data(keyBy([...newNodes, ...newEdges], 'data.id'));

          const oldNodeKeys = cy.nodes().map((node) => node.id());
          const newNodeKeys = newNodes.map(({ data }) => data.id);

          new Set([...oldNodeKeys, ...newNodeKeys]).forEach((key) => {
            const isOldNodes = oldNodeKeys.includes(key);
            const isNewNodes = newNodeKeys.includes(key);
            const shouldRemove = isOldNodes && !isNewNodes;
            const shouldAdd = !isOldNodes && isNewNodes;

            if (shouldRemove) {
              const node = cy.getElementById(key);

              node.remove();
              node.connectedEdges().remove();
            } else if (shouldAdd) {
              const { data } = newNodes.find(({ data }) => data.id === key)!;
              const connectedEdges = newEdges.filter(({ data }) => data.source === key || data.target === key);

              addedNodes = addedNodes ? [...addedNodes, cy.add({ data })] : [cy.add({ data })]; // add node
              connectedEdges.forEach(({ data }) => {
                const sourceNode = cy.getElementById(data.source);
                const targetNode = cy.getElementById(data.target);

                sourceNode.inside() && targetNode.inside() && cy.add({ data }); // add edge
              });
            } else {
              return;
            }
          });
        });

        if (!layoutRef.current || forceLayoutUpdate) {
          layoutRef.current = cy?.layout({
            name: 'dagre',
            fit: false,
            rankDir: 'LR',
            rankSep: 200,
          } as DagreLayoutOptions);
          layoutRef.current.run();
        } else {
          if (addedNodes && addedNodes.length > 0) {
            const centerNode = cy.getElementById(baseNodeId);
            const { x: centerNodeX, y: centerNodeY } = centerNode.position();
            const { y1: centerNodeY1, y2: centerNodeY2 } = centerNode.boundingBox();
            let rankDiff: number; // Indicates rank diff between added node and the center node

            addedNodes.forEach((addedNode: any) => {
              rankDiff = 0;
              const predecessors = addedNode.predecessors();
              const successors = addedNode.successors();

              const hasIncomers = predecessors.contains(centerNode); // or hasOutgoers
              const traverseTarget = hasIncomers ? predecessors : successors;

              rankDiff =
                traverseTarget
                  .nodes()
                  .toArray()
                  .findIndex((ele: any) => ele.id() === baseNodeId) + 1;
              const newX =
                centerNodeX + rankDiff * (GraphStyle.RANK_SEP + GraphStyle.NODE_WIDTH) * (hasIncomers ? 1 : -1);

              const { y } = addedNode.position();
              const { h, y1 } = addedNode.boundingBox();
              const labelHeight = h - (y - y1) * 2;

              const overlayableNodes = cy.nodes().filter((node: any) => {
                const isSameNode = node.same(addedNode);
                const { x } = node.position();
                const width = node.width();
                const isXPosOverlaid = Math.abs(newX - x) <= width;

                return !isSameNode && isXPosOverlaid;
              });

              let newY1;

              if (Math.random() >= 0.5) {
                // Add at the top
                const topY = Math.min(
                  ...overlayableNodes.map((node: any) => node.position().y - GraphStyle.NODE_RADIUS),
                  centerNodeY - GraphStyle.NODE_RADIUS,
                );
                const newY2 = topY - GraphStyle.NODE_RADIUS;

                newY1 = newY2 - h;
              } else {
                // Add at the bottom
                const bottomY = Math.max(...overlayableNodes.map((node: any) => node.boundingBox().y2), centerNodeY2);

                newY1 = bottomY + GraphStyle.NODE_RADIUS;
              }

              const newY = (h - labelHeight) / 2 + newY1;

              addedNode.position({
                x: newX,
                y: newY,
              });
            });

            const selectedElement = cy.getElementById(selectedElementId);

            if (selectedElement.inside()) {
              selectedElement.isNode() ? highlightNode(selectedElement) : highlightEdge(selectedElement);
            } else {
              highlightNode(cy.getElementById(baseNodeId));
            }
          }
        }
      }
    }
  }, [data]);

  React.useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    // 기존 popper 제거
    poppersRef.current.forEach((popper) => {
      if (popper && popper.content && popper.content.parentNode) {
        popper.content.parentNode.removeChild(popper.content);
      }
    });
    poppersRef.current = [];

    cy.nodes().forEach((node) => {
      const popper = node.popper({
        content: () => {
          const canvas = createSixPartCircle();
          canvas.style.display = 'block';
          canvas.style.background = 'white';
          document.body.appendChild(canvas);
          return canvas;
        },
        popper: {
          placement: 'right-start',
        },
      });
      poppersRef.current.push(popper);
    });

    // 노드 위치 변경 시 popper 위치 업데이트
    cy.on('position', (e) => {
      poppersRef.current.forEach((popper) => popper.update && popper.update());
    });
    cy.on('pan zoom resize', () => {
      poppersRef.current.forEach((popper) => popper.update && popper.update());
    });

    // zoom 이벤트에서 popper 크기 조절 및 다시 그리기
    cy.on('zoom', () => {
      const zoom = cy.zoom();
      poppersRef.current.forEach((popper) => {
        const canvas = popper.content;
        if (canvas && canvas.dataset.originalSize) {
          const originalSize = Number(canvas.dataset.originalSize);
          const newSize = originalSize * zoom;
          canvas.width = newSize;
          canvas.height = newSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawSixPartCircle(ctx, newSize);
          }
          canvas.style.width = `${newSize}px`;
          canvas.style.height = `${newSize}px`;
        }
      });
    });

    // cleanup
    return () => {
      poppersRef.current.forEach((popper) => {
        if (popper && popper.content && popper.content.parentNode) {
          popper.content.parentNode.removeChild(popper.content);
        }
      });
      poppersRef.current = [];
    };
  }, [data]);

  const handleClickNode = (param: Parameters<ClickEventHandler<MergedNode>>[0]) => {
    onClickNode?.(param);
  };

  const handleClickLink = (param: Parameters<ClickEventHandler<MergedEdge>>[0]) => {
    onClickEdge?.(param);
  };

  const handleClickBackground = (param: Parameters<ClickEventHandler<any>>[0]) => {
    onClickBackground?.(param);
  };

  const addEventListener = React.useCallback(() => {
    const cy = cyRef?.current;

    if (cy) {
      cy.on('layoutready', () => {
        const baseNode = cy.getElementById(baseNodeId);
        highlightNode(baseNode);
        cy.resize();
        cy.center(baseNode);
      })
        .on('mouseover', ({ target }) => {
          cy.container()!.style.cursor = target === cy ? 'default' : 'pointer';
        })
        .on('mouseout', () => {
          cy.container()!.style.cursor = 'default';
        })
        .on('tap', ({ target, originalEvent, renderedPosition }: InputEventObject) => {
          const eventType = renderedPosition ? 'left' : 'programmatic';
          const position = {
            x: renderedPosition?.x,
            y: renderedPosition?.y,
          };

          if (target === cy) {
            handleClickBackground({
              eventType,
              position,
            });
          } else if (target.isNode()) {
            highlightNode(target);

            handleClickNode({
              eventType,
              position,
              data: target.data(),
            });

            setSelectedElementId(target.id());
          } else if (target.isEdge()) {
            highlightEdge(target);

            handleClickLink({
              eventType,
              position,
              data: target.data(),
            });

            setSelectedElementId(target.id());
          }
        })
        .on('cxttap', ({ target, renderedPosition }: InputEventObject) => {
          const eventType = 'right';
          const position = {
            x: renderedPosition.x,
            y: renderedPosition.y,
          };

          if (target === cy) {
            handleClickBackground({
              eventType,
              position,
            });
          } else if (target.isNode()) {
            handleClickNode({
              eventType,
              position,
              data: target.data(),
            });
          } else if (target.isEdge()) {
            handleClickLink({
              eventType,
              position,
              data: target.data(),
            });
          }
        });
    }
  }, [onClickNode, onClickEdge, onClickBackground]);

  const highlightNode = (target: cytoscape.CollectionReturnValue) => {
    const cy = cyRef.current!;
    cy.nodes().style(serverMapTheme.node?.default!);
    cy.edges().style(serverMapTheme.edge?.default!);
    cy.getElementById(baseNodeId).style(serverMapTheme.node?.main!);
    target.style(serverMapTheme.node?.highlight!);
    target.connectedEdges().style(serverMapTheme.edge?.highlight!);
  };

  const highlightEdge = (target: cytoscape.CollectionReturnValue) => {
    const cy = cyRef.current!;

    cy.nodes().style(serverMapTheme.node?.default!);
    cy.edges().style(serverMapTheme.edge?.default!);
    cy.getElementById(baseNodeId).style(serverMapTheme.node?.main!);
    target.connectedNodes().style({ 'border-color': serverMapTheme.node?.highlight?.['border-color']! });
    target.style(serverMapTheme.edge?.highlight!);
  };

  return (
    <div
      style={{ width: '100%', height: '100%', overflow: 'hidden', ...style }}
      className={className}
      ref={containerRef}
    />
  );
};
