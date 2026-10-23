import { ProxyHost, NginxLogEntry, LogLevel } from '../types';

const SAMPLE_PATHS = [
  { path: '/api/v2/users/me', method: 'GET', weight: 4 },
  { path: '/api/v2/products', method: 'GET', weight: 5 },
  { path: '/api/v2/orders/checkout', method: 'POST', weight: 2 },
  { path: '/static/app.bundle.js', method: 'GET', weight: 3 },
  { path: '/api/v2/healthz', method: 'GET', weight: 4 },
  { path: '/dashboard/metrics', method: 'GET', weight: 3 },
  { path: '/api/v2/notifications/stream', method: 'GET', weight: 2 },
  { path: '/favicon.ico', method: 'GET', weight: 1 },
];

const SAMPLE_IPS = [
  '203.0.113.19',
  '198.51.100.82',
  '192.168.1.104',
  '172.16.42.11',
  '10.8.0.44',
  '82.165.197.1',
  '185.199.108.153',
];

const SAMPLE_USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/128.0',
  'curl/8.7.1',
  'PostmanRuntime/7.39.0',
  'Go-http-client/2.0',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
];

export function generateRandomLogEntry(hosts: ProxyHost[]): NginxLogEntry | null {
  const activeHosts = hosts.filter((h) => h.enabled);
  if (activeHosts.length === 0) return null;

  const host = activeHosts[Math.floor(Math.random() * activeHosts.length)];
  const domain = host.domainNames[0] || 'localhost';
  const pathObj = SAMPLE_PATHS[Math.floor(Math.random() * SAMPLE_PATHS.length)];
  const ip = SAMPLE_IPS[Math.floor(Math.random() * SAMPLE_IPS.length)];
  const ua = SAMPLE_USER_AGENTS[Math.floor(Math.random() * SAMPLE_USER_AGENTS.length)];

  // Determine status code based on probabilistic distribution
  const rand = Math.random();
  let status = 200;
  let level: LogLevel = 'ACCESS';
  let message: string | undefined = undefined;

  if (rand > 0.96) {
    status = 502;
    level = 'ERROR';
    message = `upstream connect() failed (111: Connection refused) while connecting to upstream ${host.forwardHost}:${host.forwardPort}`;
  } else if (rand > 0.92) {
    status = 404;
    level = 'WARN';
  } else if (rand > 0.88) {
    status = 304;
    level = 'ACCESS';
  } else if (rand > 0.84) {
    status = 201;
    level = 'ACCESS';
  }

  const responseTimeMs = parseFloat((Math.random() * 18 + 2.5).toFixed(1));
  const bytesSent = Math.floor(Math.random() * 8000 + 400);

  const now = new Date();
  const timestamp = `${now.getDate()}/${now.toLocaleString('en', { month: 'short' })}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]} +0000`;

  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp,
    host: domain,
    remoteAddr: ip,
    method: pathObj.method,
    path: pathObj.path,
    status,
    bytesSent,
    responseTimeMs,
    userAgent: ua,
    level,
    upstreamAddr: `${host.forwardHost}:${host.forwardPort}`,
    message,
  };
}

export function generateExploitLogEntry(hostDomain: string): NginxLogEntry {
  const attacks = [
    { path: '/.env', method: 'GET', exploit: 'Blocked .env credential exposure' },
    { path: '/.git/config', method: 'GET', exploit: 'Blocked git repo extraction' },
    { path: '/api/v1/search?q=1%27%20UNION%20SELECT%20null,password%20FROM%20users--', method: 'GET', exploit: 'SQLi regex match intercepted' },
    { path: '/cgi-bin/test.cgi?cmd=cat+/etc/passwd', method: 'GET', exploit: 'Remote command execution pattern blocked' },
  ];
  const item = attacks[Math.floor(Math.random() * attacks.length)];
  const now = new Date();
  const timestamp = `${now.getDate()}/${now.toLocaleString('en', { month: 'short' })}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]} +0000`;

  return {
    id: `exploit_${Date.now()}`,
    timestamp,
    host: hostDomain,
    remoteAddr: '194.26.29.11',
    method: item.method,
    path: item.path,
    status: 403,
    bytesSent: 162,
    responseTimeMs: 0.6,
    userAgent: 'sqlmap/1.8.4#stable (https://sqlmap.org)',
    level: 'WARN',
    message: `NPM-Core WAF: ${item.exploit}`,
  };
}
