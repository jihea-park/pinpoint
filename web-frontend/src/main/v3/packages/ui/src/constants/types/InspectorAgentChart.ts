export namespace InspectorAgentChart {
  export interface Parameters {
    agentId: string;
    from: number;
    to: number;
    metricDefinitionId: string;
  }

  export interface Response {
    title: string;
    timestamp: number[];
    metricValueGroups: MetricValueGroup[];
  }
  export interface MetricValueGroup {
    tags: Tag[];
    metricValues: MetricValue[];
  }

  export interface Tag {
    name: string;
    value: string;
  }

  export interface MetricValue {
    chartType: string;
    fieldName: string;
    unit: string;
    valueList: number[];
  }
}
