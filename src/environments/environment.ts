// GENERADO AUTOMÁTICAMENTE POR scripts/set-env.js DESDE .env
// NO EDITAR MANUALMENTE ESTE ARCHIVO. Modifica el archivo .env en la raíz.

const isBrowser = typeof window !== 'undefined';
const isDuckDns = isBrowser &&
  (window.location.hostname.includes('duckdns.org') ||
   window.location.hostname.includes('bomberos') ||
   window.location.protocol === 'https:');

export const environment = {
  production: false,
  useMocks: false,
  apiMs1Url: isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org/api/v1' : 'http://localhost:3000/api/v1',
  mfe1CrisisUrl: isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org/mfe1/remoteEntry.js' : 'http://localhost:4201/remoteEntry.js',
  mfe2FlotasUrl: isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org/mfe2/remoteEntry.js' : 'https://bomberos-uagrm-scz.duckdns.org/mfe2/remoteEntry.js',
  mfe3InventarioUrl: isDuckDns ? 'https://bomberos-uagrm-scz.duckdns.org/mfe3/remoteEntry.js' : 'https://bomberos-uagrm-scz.duckdns.org/mfe3/remoteEntry.js'
};
