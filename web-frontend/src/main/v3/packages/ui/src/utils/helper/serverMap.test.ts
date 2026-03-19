import { getBaseNodeId } from './serverMap';
import {
  ApplicationType,
  GetServerMap,
  FilteredMapType as FilteredMap,
} from '@pinpoint-fe/ui/src/constants';

describe('Test serverMap helper utils', () => {
  describe('Test "getBaseNodeId"', () => {
    test('Return fallback key (serviceName^applicationName^serviceType) when node list is empty', () => {
      const application: ApplicationType = {
        applicationName: 'test-app',
        serviceType: 'TOMCAT',
        serviceName: 'myService',
      };
      const applicationMapData: GetServerMap.ApplicationMapData = {
        range: { from: 0, to: 0, fromDateTime: '', toDateTime: '' },
        timestamp: [],
        nodeDataArray: [],
        linkDataArray: [],
      };

      const result = getBaseNodeId({ application, applicationMapData });
      expect(result).toBe('myService^test-app^TOMCAT');
    });

    test('Return node key when matching node exists', () => {
      const application: ApplicationType = {
        applicationName: 'test-app',
        serviceType: 'TOMCAT',
      };
      const applicationMapData: GetServerMap.ApplicationMapData = {
        range: { from: 0, to: 0, fromDateTime: '', toDateTime: '' },
        timestamp: [],
        nodeDataArray: [
          {
            key: 'myService^test-app^TOMCAT',
            applicationName: 'test-app',
            serviceType: 'TOMCAT',
          } as GetServerMap.NodeData,
          {
            key: 'myService^other-app^JETTY',
            applicationName: 'other-app',
            serviceType: 'JETTY',
          } as GetServerMap.NodeData,
        ],
        linkDataArray: [],
      };

      const result = getBaseNodeId({ application, applicationMapData });
      expect(result).toBe('myService^test-app^TOMCAT');
    });

    test('Return UNAUTHORIZED node key when node does not match but UNAUTHORIZED node exists', () => {
      const application: ApplicationType = {
        applicationName: 'test-app',
        serviceType: 'TOMCAT',
      };
      const applicationMapData: GetServerMap.ApplicationMapData = {
        range: { from: 0, to: 0, fromDateTime: '', toDateTime: '' },
        timestamp: [],
        nodeDataArray: [
          {
            key: 'myService^test-app^UNAUTHORIZED',
            applicationName: 'test-app',
            serviceType: 'UNAUTHORIZED',
          } as GetServerMap.NodeData,
          {
            key: 'myService^other-app^JETTY',
            applicationName: 'other-app',
            serviceType: 'JETTY',
          } as GetServerMap.NodeData,
        ],
        linkDataArray: [],
      };

      const result = getBaseNodeId({ application, applicationMapData });
      expect(result).toBe('myService^test-app^UNAUTHORIZED');
    });

    test('Return empty string when application is null', () => {
      const application = null;
      const applicationMapData: GetServerMap.ApplicationMapData = {
        range: { from: 0, to: 0, fromDateTime: '', toDateTime: '' },
        timestamp: [],
        nodeDataArray: [],
        linkDataArray: [],
      };

      const result = getBaseNodeId({ application, applicationMapData });
      expect(result).toBe('');
    });

    test('Return empty string when applicationMapData is undefined', () => {
      const application: ApplicationType = {
        applicationName: 'test-app',
        serviceType: 'TOMCAT',
      };

      const result = getBaseNodeId({ application });
      expect(result).toBe('');
    });

    test('Handle FilteredMap.ApplicationMapData type', () => {
      const application: ApplicationType = {
        applicationName: 'test-app',
        serviceType: 'TOMCAT',
      };
      const applicationMapData: FilteredMap.ApplicationMapData = {
        range: { from: 0, to: 0, fromDateTime: '', toDateTime: '' },
        timestamp: [],
        nodeDataArray: [
          {
            key: 'myService^test-app^TOMCAT',
            applicationName: 'test-app',
            serviceType: 'TOMCAT',
          } as FilteredMap.NodeData,
        ],
        linkDataArray: [],
      };

      const result = getBaseNodeId({ application, applicationMapData });
      expect(result).toBe('myService^test-app^TOMCAT');
    });

    test('Return fallback key when no matching node and no UNAUTHORIZED node', () => {
      const application: ApplicationType = {
        applicationName: 'test-app',
        serviceType: 'TOMCAT',
        serviceName: 'myService',
      };
      const applicationMapData: GetServerMap.ApplicationMapData = {
        range: { from: 0, to: 0, fromDateTime: '', toDateTime: '' },
        timestamp: [],
        nodeDataArray: [
          {
            key: 'myService^other-app^JETTY',
            applicationName: 'other-app',
            serviceType: 'JETTY',
          } as GetServerMap.NodeData,
        ],
        linkDataArray: [],
      };

      const result = getBaseNodeId({ application, applicationMapData });
      expect(result).toBe('myService^test-app^TOMCAT');
    });
  });
});
