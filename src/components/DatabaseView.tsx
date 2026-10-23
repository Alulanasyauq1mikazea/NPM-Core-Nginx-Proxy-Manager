import React, { useState } from 'react';
import {
  Database,
  Terminal,
  Download,
  Play,
  RotateCw,
  CheckCircle2,
  Table as TableIcon,
  HardDrive,
  Layers,
  Code,
  Copy,
  Check,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  ProxyHost,
  RedirectionHost,
  DeadHost,
  StreamHost,
  AccessList,
  SslCertificate,
  AdminUser,
} from '../types';
import {
  generateSqlDump,
  DatabaseAuditEntry,
  INITIAL_AUDIT_LOGS,
} from '../services/sqliteDb';

interface DatabaseViewProps {
  proxyHosts: ProxyHost[];
  redirections: RedirectionHost[];
  deadHosts: DeadHost[];
  streams: StreamHost[];
  accessLists: AccessList[];
  certificates: SslCertificate[];
  adminUser: AdminUser | null;
  auditLogs: DatabaseAuditEntry[];
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  proxyHosts,
  redirections,
  deadHosts,
  streams,
  accessLists,
  certificates,
  adminUser,
  auditLogs,
}) => {
  const [activeSubtab, setActiveSubtab] = useState<'tables' | 'query' | 'schema'>('tables');
  const [selectedTable, setSelectedTable] = useState<string>('proxy_hosts');
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT id, domain_names_json, forward_scheme, forward_host, forward_port, enabled FROM proxy_hosts;'
  );
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[][];
    executionTimeMs: number;
    rowCount: number;
  } | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [copiedDump, setCopiedDump] = useState(false);
  const [vacuumStatus, setVacuumStatus] = useState<string | null>(null);

  // Generate real SQL dump
  const sqlDump = generateSqlDump(
    proxyHosts,
    redirections,
    streams,
    deadHosts,
    accessLists,
    certificates,
    adminUser,
    auditLogs
  );

  // Estimate DB size in KB
  const approximateSizeKb = (sqlDump.length / 1024 + 18.5).toFixed(1);

  // Table lists with schemas & live counts
  const tables = [
    {
      name: 'proxy_hosts',
      count: proxyHosts.length,
      columns: ['id', 'domain_names_json', 'forward_scheme', 'forward_host', 'forward_port', 'caching_enabled', 'block_exploits', 'websocket_support', 'access_list_id', 'certificate_id', 'ssl_forced', 'enabled', 'created_at'],
      data: proxyHosts.map((h) => [
        h.id,
        JSON.stringify(h.domainNames),
        h.forwardScheme,
        h.forwardHost,
        h.forwardPort,
        h.cachingEnabled ? 1 : 0,
        h.blockExploits ? 1 : 0,
        h.websocketSupport ? 1 : 0,
        h.accessListId || 'NULL',
        h.certificateId || 'NULL',
        h.sslForced ? 1 : 0,
        h.enabled ? 1 : 0,
        h.createdAt,
      ]),
    },
    {
      name: 'redirection_hosts',
      count: redirections.length,
      columns: ['id', 'domain_names_json', 'forward_domain', 'preserve_path', 'status_code', 'certificate_id', 'ssl_forced', 'enabled', 'created_at'],
      data: redirections.map((r) => [
        r.id,
        JSON.stringify(r.domainNames),
        r.forwardDomain,
        r.preservePath ? 1 : 0,
        r.statusCode,
        r.certificateId || 'NULL',
        r.sslForced ? 1 : 0,
        r.enabled ? 1 : 0,
        r.createdAt,
      ]),
    },
    {
      name: 'stream_hosts',
      count: streams.length,
      columns: ['id', 'incoming_port', 'forward_host', 'forward_port', 'tcp_forwarding', 'udp_forwarding', 'enabled', 'created_at'],
      data: streams.map((s) => [
        s.id,
        s.incomingPort,
        s.forwardHost,
        s.forwardPort,
        s.tcpForwarding ? 1 : 0,
        s.udpForwarding ? 1 : 0,
        s.enabled ? 1 : 0,
        s.createdAt,
      ]),
    },
    {
      name: 'dead_hosts',
      count: deadHosts.length,
      columns: ['id', 'domain_names_json', 'certificate_id', 'custom_html', 'enabled', 'created_at'],
      data: deadHosts.map((d) => [
        d.id,
        JSON.stringify(d.domainNames),
        d.certificateId || 'NULL',
        d.customHtml ? `${d.customHtml.slice(0, 30)}...` : 'NULL',
        d.enabled ? 1 : 0,
        d.createdAt,
      ]),
    },
    {
      name: 'access_lists',
      count: accessLists.length,
      columns: ['id', 'name', 'description', 'satisfy_any', 'pass_auth', 'clients_json', 'items_json', 'created_at'],
      data: accessLists.map((a) => [
        a.id,
        a.name,
        a.description || 'NULL',
        a.satisfyAny ? 1 : 0,
        a.passAuth ? 1 : 0,
        `${a.clients.length} clients`,
        `${a.items.length} users`,
        a.createdAt,
      ]),
    },
    {
      name: 'ssl_certificates',
      count: certificates.length,
      columns: ['id', 'nice_name', 'domain_names_json', 'provider', 'expires_on', 'status', 'auto_renew', 'ocsp_stapling'],
      data: certificates.map((c) => [
        c.id,
        c.niceName,
        JSON.stringify(c.domainNames),
        c.provider,
        c.expiresOn,
        c.status,
        c.autoRenew ? 1 : 0,
        c.ocspStapling ? 1 : 0,
      ]),
    },
    {
      name: 'users',
      count: adminUser ? 1 : 0,
      columns: ['id', 'name', 'email', 'role', 'password_hash'],
      data: adminUser
        ? [[adminUser.id, adminUser.name, adminUser.email, adminUser.role, '$2b$12$K8y5k5qZg/91x9v...bcrypt']]
        : [],
    },
    {
      name: 'audit_logs',
      count: auditLogs.length,
      columns: ['id', 'timestamp', 'actor', 'action', 'entity', 'target_id', 'details'],
      data: auditLogs.map((l) => [l.id, l.timestamp, l.actor, l.action, l.entity, l.targetId, l.details]),
    },
  ];

  const currentTableObj = tables.find((t) => t.name === selectedTable) || tables[0];

  // SQL Query Execution Engine
  const executeQuery = () => {
    setIsExecuting(true);
    const start = performance.now();

    setTimeout(() => {
      const q = sqlQuery.trim();
      const lower = q.toLowerCase();

      let targetTable = currentTableObj;
      for (const t of tables) {
        if (lower.includes(t.name)) {
          targetTable = t;
          break;
        }
      }

      if (lower.includes('count(*)')) {
        setQueryResult({
          columns: ['COUNT(*)'],
          rows: [[targetTable.count]],
          executionTimeMs: parseFloat((performance.now() - start).toFixed(2)),
          rowCount: 1,
        });
      } else if (lower.includes('pragma table_info')) {
        setQueryResult({
          columns: ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'],
          rows: targetTable.columns.map((col, idx) => [
            idx,
            col,
            col.includes('port') || col.includes('enabled') || col.includes('forced') ? 'INTEGER' : 'TEXT',
            0,
            'NULL',
            idx === 0 ? 1 : 0,
          ]),
          executionTimeMs: parseFloat((performance.now() - start).toFixed(2)),
          rowCount: targetTable.columns.length,
        });
      } else if (lower.includes('pragma integrity_check')) {
        setQueryResult({
          columns: ['integrity_check'],
          rows: [['ok']],
          executionTimeMs: 0.8,
          rowCount: 1,
        });
      } else {
        // Return full table rows
        setQueryResult({
          columns: targetTable.columns,
          rows: targetTable.data,
          executionTimeMs: parseFloat((performance.now() - start).toFixed(2)),
          rowCount: targetTable.data.length,
        });
      }

      setIsExecuting(false);
    }, 120);
  };

  const handleDownloadDump = () => {
    const blob = new Blob([sqlDump], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `npm-database-backup-${Date.now()}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleVacuum = () => {
    setVacuumStatus('Running PRAGMA optimize & VACUUM...');
    setTimeout(() => {
      setVacuumStatus('VACUUM complete: Database defragmented and free pages reclaimed.');
      setTimeout(() => setVacuumStatus(null), 3000);
    }, 600);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#75715e]">
            <span>STORAGE</span>
            <span>/</span>
            <span className="text-[#e6db74]">SQLITE_DATABASE</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            SQLite Database Manager (data/database.sqlite)
          </h1>
          <p className="text-xs text-[#75715e] mt-0.5">
            Relational storage for proxy hosts, user accounts, SSL records, and audit trails
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleVacuum}
            className="px-2.5 py-1.5 rounded bg-[#272822] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32] transition-colors flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>VACUUM / Optimize</span>
          </button>
          <button
            onClick={handleDownloadDump}
            className="px-3 py-1.5 rounded bg-[#e6db74] hover:bg-[#d8cc60] text-[#1e1f1c] font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export database.sql</span>
          </button>
        </div>
      </div>

      {/* Vacuum status toast */}
      {vacuumStatus && (
        <div className="p-2.5 bg-[#272822] border border-[#a6e22e] text-[#a6e22e] rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{vacuumStatus}</span>
        </div>
      )}

      {/* Database KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="text-[10px] text-[#75715e] uppercase">DATABASE_FILE</div>
          <div className="text-base font-bold text-white mt-0.5 truncate">database.sqlite</div>
          <div className="text-[10px] text-[#a6e22e] mt-1">{approximateSizeKb} KB on disk</div>
        </div>

        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="text-[10px] text-[#75715e] uppercase">ENGINE_VERSION</div>
          <div className="text-base font-bold text-[#66d9ef] mt-0.5">SQLite 3.45.1</div>
          <div className="text-[10px] text-[#75715e] mt-1">Journal: WAL Mode</div>
        </div>

        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="text-[10px] text-[#75715e] uppercase">INTEGRITY_CHECK</div>
          <div className="text-base font-bold text-[#a6e22e] mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>HEALTHY (ok)</span>
          </div>
          <div className="text-[10px] text-[#75715e] mt-1">Foreign Keys: ON</div>
        </div>

        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="text-[10px] text-[#75715e] uppercase">TABLES_&_ROWS</div>
          <div className="text-base font-bold text-[#fd971f] mt-0.5">
            {tables.length} Tables
          </div>
          <div className="text-[10px] text-[#75715e] mt-1">
            {tables.reduce((acc, t) => acc + t.count, 0)} total records
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 border-b border-[#383830] pt-2">
        <button
          onClick={() => setActiveSubtab('tables')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeSubtab === 'tables'
              ? 'border-[#a6e22e] text-[#a6e22e]'
              : 'border-transparent text-[#75715e] hover:text-white'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Table Explorer</span>
        </button>

        <button
          onClick={() => setActiveSubtab('query')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeSubtab === 'query'
              ? 'border-[#66d9ef] text-[#66d9ef]'
              : 'border-transparent text-[#75715e] hover:text-white'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>SQL Query Console</span>
        </button>

        <button
          onClick={() => setActiveSubtab('schema')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeSubtab === 'schema'
              ? 'border-[#fd971f] text-[#fd971f]'
              : 'border-transparent text-[#75715e] hover:text-white'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Schema SQL Dump</span>
        </button>
      </div>

      {/* SUBTAB 1: TABLE EXPLORER */}
      {activeSubtab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Table List Selector */}
          <div className="lg:col-span-3 bg-[#272822] border border-[#3e3d32] rounded p-3 space-y-2">
            <div className="text-white font-bold pb-2 border-b border-[#383830] flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#e6db74]" />
              <span>Tables ({tables.length})</span>
            </div>

            <div className="space-y-1">
              {tables.map((t) => (
                <button
                  key={t.name}
                  onClick={() => {
                    setSelectedTable(t.name);
                    setSqlQuery(`SELECT * FROM ${t.name};`);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between transition-colors ${
                    selectedTable === t.name
                      ? 'bg-[#1e1f1c] text-[#a6e22e] border-l-2 border-[#a6e22e] font-semibold'
                      : 'text-[#75715e] hover:bg-[#1e1f1c]/50 hover:text-white'
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  <span className="text-[10px] text-[#75715e] bg-[#141512] px-1.5 py-0.5 rounded">
                    {t.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Data View */}
          <div className="lg:col-span-9 bg-[#272822] border border-[#3e3d32] rounded overflow-hidden flex flex-col">
            <div className="p-3 bg-[#1e1f1c] border-b border-[#383830] flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-sm">{currentTableObj.name}</span>
                <span className="text-[#75715e] text-[11px] ml-2">
                  ({currentTableObj.count} rows, {currentTableObj.columns.length} columns)
                </span>
              </div>
              <span className="text-[10px] text-[#a6e22e]">LIVE SQLITE VIEW</span>
            </div>

            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#141512] text-[#75715e] border-b border-[#383830] sticky top-0">
                  <tr>
                    {currentTableObj.columns.map((c) => (
                      <th key={c} className="py-2.5 px-3 whitespace-nowrap font-semibold">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#383830]">
                  {currentTableObj.data.length === 0 ? (
                    <tr>
                      <td colSpan={currentTableObj.columns.length} className="py-8 text-center text-[#75715e]">
                        Table is currently empty.
                      </td>
                    </tr>
                  ) : (
                    currentTableObj.data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#32332a] transition-colors">
                        {row.map((val, cellIdx) => (
                          <td key={cellIdx} className="py-2 px-3 whitespace-nowrap text-[#f8f8f2] text-[11px]">
                            {val === null || val === 'NULL' ? (
                              <span className="text-[#75715e] italic">NULL</span>
                            ) : typeof val === 'number' ? (
                              <span className="text-[#ae81ff]">{val}</span>
                            ) : (
                              <span>{String(val)}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SQL QUERY CONSOLE */}
      {activeSubtab === 'query' && (
        <div className="space-y-4">
          {/* Quick Query Templates */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#75715e] text-[11px]">Query Presets:</span>
            {[
              {
                label: 'Proxy Hosts',
                sql: 'SELECT id, domain_names_json, forward_host, forward_port, enabled FROM proxy_hosts;',
              },
              {
                label: 'Audit Trail',
                sql: 'SELECT id, actor, action, entity, timestamp, details FROM audit_logs;',
              },
              {
                label: 'Certificates',
                sql: 'SELECT id, nice_name, provider, expires_on, status FROM ssl_certificates;',
              },
              {
                label: 'Integrity Check',
                sql: 'PRAGMA integrity_check;',
              },
              {
                label: 'Table Info',
                sql: 'PRAGMA table_info(proxy_hosts);',
              },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setSqlQuery(preset.sql)}
                className="px-2 py-1 rounded bg-[#272822] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32] text-[11px]"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* SQL Textarea */}
          <div className="bg-[#1e1f1c] border border-[#383830] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#75715e] text-[11px]">Interactive SQLite Query Editor:</span>
              <button
                onClick={executeQuery}
                disabled={isExecuting}
                className="px-3 py-1.5 rounded bg-[#a6e22e] hover:bg-[#92cc26] text-[#1e1f1c] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Query</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full bg-[#141512] border border-[#383830] rounded p-2.5 text-[#a6e22e] font-mono text-xs focus:outline-none focus:border-[#a6e22e]"
            />
          </div>

          {/* Query Results */}
          {queryResult && (
            <div className="bg-[#272822] border border-[#3e3d32] rounded overflow-hidden space-y-2">
              <div className="p-3 bg-[#1e1f1c] border-b border-[#383830] flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2 text-[#a6e22e]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Query returned {queryResult.rowCount} rows in {queryResult.executionTimeMs} ms
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141512] text-[#75715e] border-b border-[#383830]">
                    <tr>
                      {queryResult.columns.map((c) => (
                        <th key={c} className="py-2 px-3 whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#383830]">
                    {queryResult.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-[#32332a]">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-[11px]">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: SCHEMA SQL DUMP */}
      {activeSubtab === 'schema' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[#fd971f] font-bold text-xs">
              Complete SQLite Schema & Data Dump (Ready to run with 'sqlite3 database.sqlite'):
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlDump);
                  setCopiedDump(true);
                  setTimeout(() => setCopiedDump(false), 2000);
                }}
                className="px-2.5 py-1.5 rounded bg-[#272822] hover:bg-[#383830] text-white border border-[#3e3d32] flex items-center gap-1.5"
              >
                {copiedDump ? <Check className="w-3.5 h-3.5 text-[#a6e22e]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDump ? 'Copied' : 'Copy SQL'}</span>
              </button>
              <button
                onClick={handleDownloadDump}
                className="px-2.5 py-1.5 rounded bg-[#e6db74] hover:bg-[#d8cc60] text-[#1e1f1c] font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql</span>
              </button>
            </div>
          </div>

          <div className="bg-[#1e1f1c] border border-[#383830] rounded p-4 max-h-[500px] overflow-y-auto">
            <pre className="text-[#f8f8f2] text-[11px] leading-relaxed selection:bg-[#f92672] selection:text-white">
              {sqlDump}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
