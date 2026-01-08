import cytoscape from 'cytoscape';
import { merge } from 'lodash';
import { ServerMapProps } from '../../ui';
import { defaultTheme, GraphStyle, ServerMapTheme } from './theme';

export const getTheme = (theme: ServerMapTheme) => {
  return merge({}, defaultTheme, theme);
};

export const getServerMapStyle = ({
  cy,
  theme,
  edgeLabelRenderer,
  nodeLabelRenderer,
}: {
  cy: cytoscape.Core;
  theme: ServerMapTheme;
  edgeLabelRenderer?: ServerMapProps['renderEdgeLabel'];
  nodeLabelRenderer?: ServerMapProps['renderNodeLabel'];
}) => {
  return [
    {
      selector: 'node',
      style: {
        ...theme.node?.default,
        width: GraphStyle.NODE_WIDTH,
        height: GraphStyle.NODE_HEIGHT,
        label: (el: cytoscape.NodeCollection) => {
          const nodeData = cy.data(el.data()?.id)?.data;
          return nodeLabelRenderer?.(nodeData) || nodeData?.label || '';
        },
        'background-image': (el: cytoscape.NodeCollection) => {
          const nodeData = cy.data(el.data()?.id)?.data;
          return nodeData?.imgArr;
        },
        'background-fit': 'contain' as cytoscape.Css.PropertyValueNode<'contain'>,
        'background-offset-y': '-5px',
      },
    },
    {
      selector: 'edge',
      style: {
        ...theme.edge?.default,
        label: (el: cytoscape.EdgeCollection) => {
          const edgeData = cy.data(el.data()?.id)?.data;
          return edgeLabelRenderer?.(edgeData) || '';
        },
      },
    },
    {
      selector: 'edge:loop',
      style: {
        ...theme.edge?.loop,
      },
    },
    {
      selector: 'node[type="serviceGroup"]', // 부모 노드만 선택
      style: {
        'background-opacity': 0.1, // 거의 투명하게
        'background-color': '#0f0f96', // 연한 배경색
        'border-width': 1, // 테두리만 보이게
        'border-color': '#0f0f96', // 테두리 색
        padding: 10, // 자식 노드와 테두리 사이 간격
        width: 5,
        height: 5,
      },
    },
    {
      // 부모 노드 스타일 - 상자처럼만 보이게!
      selector: ':parent', // 부모 노드만 선택
      style: {
        'background-opacity': 0.1, // 거의 투명하게
        'background-color': '#8f0f63',
        'border-width': 2, // 테두리만 보이게
        'border-color': '#95a5a6', // 테두리 색
        'border-style': 'dashed', // 점선으로 (선택사항)
        label: '', // 라벨 없애기
        padding: 10, // 자식 노드와 테두리 사이 간격
      },
    },
  ];
};
