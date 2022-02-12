//region HTTP

export const getUrlPath = (url: string): string => {
  const u = new URL(url);
  return u.href.replace(u.origin, ''); // весь url минус origin
}

export const joinUrl = (path: string, baseUrl: string) => {
  if (!baseUrl || path.includes('http://') || path.includes('https://'))
    return path;
  return baseUrl + (path[0] === '/' ? path : `/${path}`);
}

//endregion
