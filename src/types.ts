export type ProtocolScheme = 'http' | 'https';

export interface MetricHistoryPoint {
  timestamp: number;
  rps: number;
  latencyMs: number;
  bandwidthKbps: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
}

export interface HostMetrics {
  totalRequests: number;
  currentRps: number;
  avgLatencyMs: number;
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  bandwidthInKb: number;
  bandwidthOutKb: number;
  status2xxCount: number;
  status3xxCount: number;
  status4xxCount: number;
  status5xxCount: number;
  cacheHitRatio: number;
  history: MetricHistoryPoint[];
}

export interface ProxyHost {
  id: string;
  domainNames: string[];
  forwardScheme: ProtocolScheme;
  forwardHost: string;
  forwardPort: number;
  cachingEnabled: boolean;
  blockExploits: boolean;
  websocketSupport: boolean;
  accessListId: string | null;
  certificateId: string | null;
  sslForced: boolean;
  hstsEnabled: boolean;
  hstsSubdomains: boolean;
  http2Support: boolean;
  advancedConfig: string;
  enabled: boolean;
  createdAt: string;
  metrics: HostMetrics;
}

export interface RedirectionHost {
  id: string;
  domainNames: string[];
  forwardDomain: string;
  forwardPath: boolean;
  preservePath: boolean;
  statusCode: 301 | 302 | 307 | 308;
  blockExploits: boolean;
  certificateId: string | null;
  sslForced: boolean;
  hstsEnabled: boolean;
  http2Support: boolean;
  advancedConfig: string;
  enabled: boolean;
  createdAt: string;
}

export interface DeadHost {
  id: string;
  domainNames: string[];
  certificateId: string | null;
  sslForced: boolean;
  http2Support: boolean;
  customHtml: string;
  enabled: boolean;
  createdAt: string;
}

export interface StreamHost {
  id: string;
  incomingPort: number;
  forwardHost: string;
  forwardPort: number;
  tcpForwarding: boolean;
  udpForwarding: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface AccessListClient {
  id: string;
  address: string; // e.g. "192.168.1.0/24" or "10.0.0.1"
  directive: 'allow' | 'deny';
}

export interface AccessListAuthUser {
  id: string;
  username: string;
  passwordHash: string; // apr1 or sha512 simulation
  hint?: string;
}

export interface AccessList {
  id: string;
  name: string;
  description: string;
  satisfyAny: boolean; // satisfy any vs satisfy all
  passAuth: boolean;
  clients: AccessListClient[];
  items: AccessListAuthUser[];
  createdAt: string;
}

export interface SslCertificate {
  id: string;
  niceName: string;
  domainNames: string[];
  provider: 'letsencrypt' | 'custom';
  expiresOn: string;
  status: 'valid' | 'renewing' | 'expired' | 'failed';
  autoRenew: boolean;
  ocspStapling: boolean;
  certificatePem?: string;
  privateKeyPem?: string;
  intermediatePem?: string;
}

export type LogLevel = 'ACCESS' | 'INFO' | 'WARN' | 'ERROR';

export interface NginxLogEntry {
  id: string;
  timestamp: string;
  host: string;
  remoteAddr: string;
  method: string;
  path: string;
  status: number;
  bytesSent: number;
  responseTimeMs: number;
  userAgent: string;
  level: LogLevel;
  upstreamAddr?: string;
  message?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'viewer';
  token: string;
  expiresAt: string;
}

export interface NginxServerState {
  version: string;
  isRunning: boolean;
  pid: number;
  activeConnections: number;
  acceptedConnections: number;
  handledRequests: number;
  reading: number;
  writing: number;
  waiting: number;
  lastReloadAt: string;
  isReloading: boolean;
  lastSyntaxOutput: string;
  syntaxStatus: 'valid' | 'testing' | 'error';
}

export type DefaultSiteType =
  | 'congratulations'
  | '404'
  | '444'
  | 'redirect'
  | 'custom_html';

export interface DefaultSiteConfig {
  type: DefaultSiteType;
  redirectUrl?: string;
  redirectCode?: 301 | 302;
  customHtml?: string;
}

