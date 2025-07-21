/* eslint-disable  @typescript-eslint/no-explicit-any */
export namespace TransactionCallTree {
  export interface Parameters {
    agentId: string;
    spanId: string;
    traceId: string;
    focusTimestamp: number;
    useStatisticsAgentState?: boolean;
  }

  export interface Response {
    logLinkEnable: boolean;
    logButtonName: string;
    disableButtonMessage: string;
    logPageUrl: string;
    transactionId: string;
    spanId: number;
    completeState: string;
    loggingTransactionInfo: boolean;
    focusCallStackId?: number;
    callStackStart: number;
    callStackEnd: number;
    callStackIndex: CallStackIndex;
    callStack: any[][]; // ['depth', 'begin', 'end', 'excludeFromTimeline', 'applicationName', 'tab', 'id', 'parentId', 'isMethod', 'hasChild', 'title', 'arguments', 'executeTime', 'gap', 'elapsedTime', 'barWidth', 'executionMilliseconds', 'simpleClassName', 'methodType', 'apiType', 'agent', 'isFocused', 'hasException', 'isAuthorized', 'agentName', 'lineNumber', 'location', 'applicationServiceType', 'exceptionChainId']
    agentId: string;
    applicationName: string;
    agentName: string;
    uri: string;
  }

  export interface CallStackIndex {
    depth: number;
    begin: number;
    end: number;
    excludeFromTimeline: number;
    applicationName: number;
    tab: number;
    id: number;
    parentId: string;
    isMethod: number;
    hasChild: number;
    title: number;
    arguments: number;
    executeTime: number;
    gap: number;
    elapsedTime: number;
    barWidth: number;
    executionMilliseconds: number;
    simpleClassName: number;
    methodType: number;
    apiType: number;
    agent: number;
    isFocused: number;
    hasException: number;
    isAuthorized: number;
    agentName: number;
    lineNumber: number;
    location: number;
    applicationServiceType: number;
    exceptionChainId: number;
  }

  export interface ToAgentIdNameMap {}

  export interface FromAgentIdNameMap {}

  export type CallStackKeyValueMap = {
    [K in keyof CallStackIndex]: any;
  } & { subRows?: CallStackKeyValueMap[]; attributedAgent?: string };
}
