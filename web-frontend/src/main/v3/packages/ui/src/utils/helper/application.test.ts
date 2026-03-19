import {
  getApplicationTypeAndName,
  getApplicationKey,
  parseServiceKey,
  getDisplayApplicationName,
} from './application';
import { ApplicationType } from '@pinpoint-fe/ui/src/constants';

describe('Test application helper utils', () => {
  describe('Test "getApplicationTypeAndName"', () => {
    test('Extract application name and service type from valid path', () => {
      const path = '/appName@serviceType';
      const result = getApplicationTypeAndName(path);
      expect(result).toEqual({
        applicationName: 'appName',
        serviceType: 'serviceType',
      });
    });

    test('Extract application name and service type from path with caret separator', () => {
      const path = '/appName^serviceType';
      const result = getApplicationTypeAndName(path);
      expect(result).toEqual({
        applicationName: 'appName',
        serviceType: 'serviceType',
      });
    });

    test('Extract application name and service type from path without leading slash', () => {
      const path = 'appName@serviceType';
      const result = getApplicationTypeAndName(path);
      expect(result).toEqual({
        applicationName: 'appName',
        serviceType: 'serviceType',
      });
    });

    test('Return null when path does not match pattern', () => {
      const path = '/invalid-path';
      const result = getApplicationTypeAndName(path);
      expect(result).toBeNull();
    });

    test('Return null when path is empty', () => {
      const path = '';
      const result = getApplicationTypeAndName(path);
      expect(result).toBeNull();
    });

    test('Return null when path has no separator', () => {
      const path = '/appName';
      const result = getApplicationTypeAndName(path);
      expect(result).toBeNull();
    });

    test('Handle path with multiple segments', () => {
      const path = '/parent/appName@serviceType';
      const result = getApplicationTypeAndName(path);
      expect(result).toEqual({
        applicationName: 'appName',
        serviceType: 'serviceType',
      });
    });
  });

  describe('Test "getApplicationKey"', () => {
    test('Return key format (serviceName^applicationName^serviceType)', () => {
      const application: ApplicationType = {
        applicationName: 'appName',
        serviceType: 'serviceType',
        serviceName: 'myService',
      };
      const result = getApplicationKey(application);
      expect(result).toBe('myService^appName^serviceType');
    });

    test('Return key with empty serviceName when serviceName is not provided', () => {
      const application: ApplicationType = {
        applicationName: 'appName',
        serviceType: 'serviceType',
      };
      const result = getApplicationKey(application);
      expect(result).toBe('^appName^serviceType');
    });

    test('Escape ^ in applicationName', () => {
      const application: ApplicationType = {
        applicationName: 'app^name',
        serviceType: 'serviceType',
        serviceName: 'myService',
      };
      const result = getApplicationKey(application);
      expect(result).toBe('myService^app\\^name^serviceType');
    });

    test('Handle application with special characters', () => {
      const application: ApplicationType = {
        applicationName: 'app-name',
        serviceType: 'service_type',
        serviceName: 'myService',
      };
      const result = getApplicationKey(application);
      expect(result).toBe('myService^app-name^service_type');
    });
  });

  describe('Test "parseServiceKey"', () => {
    test('Parse basic serviceKey', () => {
      const result = parseServiceKey('myService^myApp^myType');
      expect(result).toEqual({
        serviceName: 'myService',
        applicationName: 'myApp',
        serviceType: 'myType',
      });
    });

    test('Parse serviceKey with escaped ^ in applicationName', () => {
      const result = parseServiceKey('myService^myAppli\\^cation^myType');
      expect(result).toEqual({
        serviceName: 'myService',
        applicationName: 'myAppli\\^cation',
        serviceType: 'myType',
      });
    });

    test('Parse serviceKey with empty serviceName', () => {
      const result = parseServiceKey('^myApp^myType');
      expect(result).toEqual({
        serviceName: '',
        applicationName: 'myApp',
        serviceType: 'myType',
      });
    });
  });

  describe('Test "getDisplayApplicationName"', () => {
    test('Replace escaped ^ with ^ for display', () => {
      expect(getDisplayApplicationName('myAppli\\^cation')).toBe('myAppli^cation');
    });

    test('Leave applicationName unchanged when no escaped ^', () => {
      expect(getDisplayApplicationName('myApp')).toBe('myApp');
    });

    test('Replace multiple escaped ^ ', () => {
      expect(getDisplayApplicationName('a\\^b\\^c')).toBe('a^b^c');
    });
  });
});
