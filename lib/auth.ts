export interface BasicCredentials {
  username: string;
  password: string;
}

export function decodeBasicAuthHeader(header: string | null): BasicCredentials | null {
  if (!header) {
    return null;
  }

  const [scheme, encoded] = header.split(' ');
  if (!scheme || !encoded || scheme.toLowerCase() !== 'basic') {
    return null;
  }

  const decoded = typeof globalThis.atob === 'function'
    ? globalThis.atob(encoded)
    : Buffer.from(encoded, 'base64').toString('utf8');

  const separator = decoded.indexOf(':');
  if (separator < 0) {
    return null;
  }

  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

export function isValidDiaryAuth(header: string | null, expectedUser: string | undefined, expectedPass: string | undefined): boolean {
  if (!expectedUser || !expectedPass) {
    return false;
  }

  const credentials = decodeBasicAuthHeader(header);
  if (!credentials) {
    return false;
  }

  return credentials.username === expectedUser && credentials.password === expectedPass;
}

