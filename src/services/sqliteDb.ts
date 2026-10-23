import {
  ProxyHost,
  RedirectionHost,
  DeadHost,
  StreamHost,
  AccessList,
  SslCertificate,
  AdminUser,
} from '../types';

export interface DatabaseAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RELOAD' | 'LOGIN';
  entity: string;
  targetId: string;
  details: string;
}

export interface SqliteTableSchema {
  name: string;
  columns: { name: string; type: string; isPk?: boolean; nullable?: boolean }[];
  rowCount: number;
}

/**
 * Generates an authentic SQL dump (.sql) compatible with SQLite 3
 */
export function generateSqlDump(
  hosts: ProxyHost[],
  redirections: RedirectionHost[],
  streams: StreamHost[],
  deadHosts: DeadHost[],
  accessLists: AccessList[],
  certificates: SslCertificate[],
  adminUser: AdminUser | null,
  auditLogs: DatabaseAuditEntry[]
): string {
  let sql = `-- ============================================================\n`;
  sql += `-- NPM-Core SQLite Database Export\n`;
  sql += `-- Engine: SQLite 3.45 (WAL Mode)\n`;
  sql += `-- Exported At: ${new Date().toISOString()}\n`;
  sql += `-- ============================================================\n\n`;

  sql += `PRAGMA foreign_keys = ON;\n`;
  sql += `PRAGMA journal_mode = WAL;\n\n`;

  // 1. users table
  sql += `-- Table: users\n`;
  sql += `CREATE TABLE IF NOT EXISTS users (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  name TEXT NOT NULL,\n`;
  sql += `  email TEXT UNIQUE NOT NULL,\n`;
  sql += `  role TEXT NOT NULL DEFAULT 'admin',\n`;
  sql += `  password_hash TEXT NOT NULL,\n`;
  sql += `  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n`;
  sql += `);\n\n`;

  if (adminUser) {
    sql += `INSERT OR REPLACE INTO users (id, name, email, role, password_hash) VALUES (\n`;
    sql += `  '${adminUser.id}', '${adminUser.name}', '${adminUser.email}', '${adminUser.role}',\n`;
    sql += `  '$2b$12$K8y5k5qZg/91x9v...simulated_bcrypt'\n`;
    sql += `);\n\n`;
  }

  // 2. ssl_certificates table
  sql += `-- Table: ssl_certificates\n`;
  sql += `CREATE TABLE IF NOT EXISTS ssl_certificates (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  nice_name TEXT NOT NULL,\n`;
  sql += `  domain_names_json TEXT NOT NULL,\n`;
  sql += `  provider TEXT NOT NULL,\n`;
  sql += `  expires_on DATETIME NOT NULL,\n`;
  sql += `  status TEXT NOT NULL DEFAULT 'valid',\n`;
  sql += `  auto_renew INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  ocsp_stapling INTEGER NOT NULL DEFAULT 1\n`;
  sql += `);\n\n`;

  for (const cert of certificates) {
    sql += `INSERT OR REPLACE INTO ssl_certificates VALUES (\n`;
    sql += `  '${cert.id}', '${cert.niceName.replace(/'/g, "''")}', '${JSON.stringify(cert.domainNames)}',\n`;
    sql += `  '${cert.provider}', '${cert.expiresOn}', '${cert.status}', ${cert.autoRenew ? 1 : 0}, ${cert.ocspStapling ? 1 : 0}\n`;
    sql += `);\n`;
  }
  sql += `\n`;

  // 3. access_lists table
  sql += `-- Table: access_lists\n`;
  sql += `CREATE TABLE IF NOT EXISTS access_lists (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  name TEXT NOT NULL,\n`;
  sql += `  description TEXT,\n`;
  sql += `  satisfy_any INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  pass_auth INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  clients_json TEXT NOT NULL,\n`;
  sql += `  items_json TEXT NOT NULL,\n`;
  sql += `  created_at DATETIME\n`;
  sql += `);\n\n`;

  for (const acl of accessLists) {
    sql += `INSERT OR REPLACE INTO access_lists VALUES (\n`;
    sql += `  '${acl.id}', '${acl.name.replace(/'/g, "''")}', '${(acl.description || '').replace(/'/g, "''")}',\n`;
    sql += `  ${acl.satisfyAny ? 1 : 0}, ${acl.passAuth ? 1 : 0}, '${JSON.stringify(acl.clients).replace(/'/g, "''")}',\n`;
    sql += `  '${JSON.stringify(acl.items).replace(/'/g, "''")}', '${acl.createdAt}'\n`;
    sql += `);\n`;
  }
  sql += `\n`;

  // 4. proxy_hosts table
  sql += `-- Table: proxy_hosts\n`;
  sql += `CREATE TABLE IF NOT EXISTS proxy_hosts (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  domain_names_json TEXT NOT NULL,\n`;
  sql += `  forward_scheme TEXT NOT NULL DEFAULT 'http',\n`;
  sql += `  forward_host TEXT NOT NULL,\n`;
  sql += `  forward_port INTEGER NOT NULL,\n`;
  sql += `  caching_enabled INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  block_exploits INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  websocket_support INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  access_list_id TEXT REFERENCES access_lists(id) ON DELETE SET NULL,\n`;
  sql += `  certificate_id TEXT REFERENCES ssl_certificates(id) ON DELETE SET NULL,\n`;
  sql += `  ssl_forced INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  hsts_enabled INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  hsts_subdomains INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  http2_support INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  advanced_config TEXT,\n`;
  sql += `  enabled INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  created_at DATETIME\n`;
  sql += `);\n\n`;

  for (const h of hosts) {
    sql += `INSERT OR REPLACE INTO proxy_hosts VALUES (\n`;
    sql += `  '${h.id}', '${JSON.stringify(h.domainNames)}', '${h.forwardScheme}', '${h.forwardHost}', ${h.forwardPort},\n`;
    sql += `  ${h.cachingEnabled ? 1 : 0}, ${h.blockExploits ? 1 : 0}, ${h.websocketSupport ? 1 : 0},\n`;
    sql += `  ${h.accessListId ? `'${h.accessListId}'` : 'NULL'}, ${h.certificateId ? `'${h.certificateId}'` : 'NULL'},\n`;
    sql += `  ${h.sslForced ? 1 : 0}, ${h.hstsEnabled ? 1 : 0}, ${h.hstsSubdomains ? 1 : 0}, ${h.http2Support ? 1 : 0},\n`;
    sql += `  '${(h.advancedConfig || '').replace(/'/g, "''")}', ${h.enabled ? 1 : 0}, '${h.createdAt}'\n`;
    sql += `);\n`;
  }
  sql += `\n`;

  // 5. redirection_hosts table
  sql += `-- Table: redirection_hosts\n`;
  sql += `CREATE TABLE IF NOT EXISTS redirection_hosts (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  domain_names_json TEXT NOT NULL,\n`;
  sql += `  forward_domain TEXT NOT NULL,\n`;
  sql += `  preserve_path INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  status_code INTEGER NOT NULL DEFAULT 301,\n`;
  sql += `  certificate_id TEXT REFERENCES ssl_certificates(id),\n`;
  sql += `  ssl_forced INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  enabled INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  created_at DATETIME\n`;
  sql += `);\n\n`;

  for (const r of redirections) {
    sql += `INSERT OR REPLACE INTO redirection_hosts VALUES (\n`;
    sql += `  '${r.id}', '${JSON.stringify(r.domainNames)}', '${r.forwardDomain.replace(/'/g, "''")}',\n`;
    sql += `  ${r.preservePath ? 1 : 0}, ${r.statusCode}, ${r.certificateId ? `'${r.certificateId}'` : 'NULL'},\n`;
    sql += `  ${r.sslForced ? 1 : 0}, ${r.enabled ? 1 : 0}, '${r.createdAt}'\n`;
    sql += `);\n`;
  }
  sql += `\n`;

  // 6. stream_hosts table
  sql += `-- Table: stream_hosts\n`;
  sql += `CREATE TABLE IF NOT EXISTS stream_hosts (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  incoming_port INTEGER NOT NULL,\n`;
  sql += `  forward_host TEXT NOT NULL,\n`;
  sql += `  forward_port INTEGER NOT NULL,\n`;
  sql += `  tcp_forwarding INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  udp_forwarding INTEGER NOT NULL DEFAULT 0,\n`;
  sql += `  enabled INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  created_at DATETIME\n`;
  sql += `);\n\n`;

  for (const s of streams) {
    sql += `INSERT OR REPLACE INTO stream_hosts VALUES (\n`;
    sql += `  '${s.id}', ${s.incomingPort}, '${s.forwardHost}', ${s.forwardPort},\n`;
    sql += `  ${s.tcpForwarding ? 1 : 0}, ${s.udpForwarding ? 1 : 0}, ${s.enabled ? 1 : 0}, '${s.createdAt}'\n`;
    sql += `);\n`;
  }
  sql += `\n`;

  // 7. dead_hosts table
  sql += `-- Table: dead_hosts\n`;
  sql += `CREATE TABLE IF NOT EXISTS dead_hosts (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  domain_names_json TEXT NOT NULL,\n`;
  sql += `  certificate_id TEXT REFERENCES ssl_certificates(id),\n`;
  sql += `  custom_html TEXT,\n`;
  sql += `  enabled INTEGER NOT NULL DEFAULT 1,\n`;
  sql += `  created_at DATETIME\n`;
  sql += `);\n\n`;

  for (const d of deadHosts) {
    sql += `INSERT OR REPLACE INTO dead_hosts VALUES (\n`;
    sql += `  '${d.id}', '${JSON.stringify(d.domainNames)}', ${d.certificateId ? `'${d.certificateId}'` : 'NULL'},\n`;
    sql += `  '${(d.customHtml || '').replace(/'/g, "''")}', ${d.enabled ? 1 : 0}, '${d.createdAt}'\n`;
    sql += `);\n`;
  }
  sql += `\n`;

  // 8. audit_logs table
  sql += `-- Table: audit_logs\n`;
  sql += `CREATE TABLE IF NOT EXISTS audit_logs (\n`;
  sql += `  id TEXT PRIMARY KEY,\n`;
  sql += `  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,\n`;
  sql += `  actor TEXT NOT NULL,\n`;
  sql += `  action TEXT NOT NULL,\n`;
  sql += `  entity TEXT NOT NULL,\n`;
  sql += `  target_id TEXT,\n`;
  sql += `  details TEXT\n`;
  sql += `);\n\n`;

  for (const l of auditLogs) {
    sql += `INSERT OR REPLACE INTO audit_logs VALUES (\n`;
    sql += `  '${l.id}', '${l.timestamp}', '${l.actor}', '${l.action}', '${l.entity}', '${l.targetId}', '${l.details.replace(/'/g, "''")}'\n`;
    sql += `);\n`;
  }

  return sql;
}

export const INITIAL_AUDIT_LOGS: DatabaseAuditEntry[] = [
  {
    id: 'aud_1',
    timestamp: '2026-10-22 18:30:15',
    actor: 'admin@proxymanager.local',
    action: 'CREATE',
    entity: 'proxy_hosts',
    targetId: 'proxy_host_api',
    details: 'Created host api.production.tech -> 192.168.1.100:8000',
  },
  {
    id: 'aud_2',
    timestamp: '2026-10-22 18:32:40',
    actor: 'admin@proxymanager.local',
    action: 'CREATE',
    entity: 'access_lists',
    targetId: 'acl_internal_office',
    details: 'Created access list: Internal Office & VPN Only',
  },
  {
    id: 'aud_3',
    timestamp: '2026-10-22 19:15:00',
    actor: 'admin@proxymanager.local',
    action: 'RELOAD',
    entity: 'nginx_engine',
    targetId: 'pid_1428',
    details: 'Triggered SIGHUP zero-downtime configuration reload',
  },
];
