import { ApplicationType } from '@pinpoint-fe/ui/src/constants';

export const getApplicationTypeAndName = (path = '') => {
  const splittedPath = path.match(/\/?([^/]+)[@|^]([^/]+)$/);
  const applicationName = splittedPath?.[1];
  const serviceType = splittedPath?.[2];

  if (applicationName && serviceType) {
    return { applicationName, serviceType };
  }

  return null;
};

/**
 * Parses the FilteredMap URL path segment with the format:
 *   serviceName@applicationName@serviceType
 *
 * Falls back to the 2-part format (applicationName@serviceType) for backward compatibility.
 */
export const getApplicationTypeAndNameFromServicePath = (path = '') => {
  const lastSegment = path.match(/\/([^/]+)$/)?.[1];
  if (!lastSegment) return null;

  const parts = lastSegment.split('@');
  if (parts.length >= 3) {
    const serviceName = parts[0];
    const serviceType = parts[parts.length - 1];
    const applicationName = parts.slice(1, -1).join('@');
    return { serviceName, applicationName, serviceType };
  } else if (parts.length === 2) {
    return { applicationName: parts[0], serviceType: parts[1] };
  }

  return null;
};

/**
 * Parses a serviceKey of the format `serviceName^applicationName^serviceType`.
 * The applicationName may contain escaped carets (`\^`), which are treated as literal `^`
 * rather than delimiters.
 *
 * Example: `myService^myAppli\^cation^myType`
 *   → { serviceName: 'myService', applicationName: 'myAppli\^cation', serviceType: 'myType' }
 */
export const parseServiceKey = (serviceKey: string) => {
  // Split on ^ that is NOT preceded by backslash
  const parts = serviceKey.split(/(?<!\\)\^/);
  const serviceName = parts[0];
  const serviceType = parts[parts.length - 1];
  // Rejoin middle parts (in case there were multiple unescaped ^ — shouldn't happen in valid keys)
  const applicationName = parts.slice(1, -1).join('\\^');
  return { serviceName, applicationName, serviceType };
};

/**
 * Converts the stored applicationName (with `\^` escapes) to a display-friendly string
 * by replacing `\^` with `^`.
 */
export const getDisplayApplicationName = (applicationName: string) => {
  return applicationName.replace(/\\\^/g, '^');
};

export const getApplicationKey = (application?: ApplicationType) => {
  const escapedApplicationName = (application?.applicationName ?? '').replace(/\^/g, '\\^');
  return `${application?.serviceName ?? ''}^${escapedApplicationName}^${application?.serviceType}`;
};
