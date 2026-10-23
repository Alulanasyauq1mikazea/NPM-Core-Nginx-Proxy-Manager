import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { ProxyHostsView } from './components/ProxyHostsView';
import { RedirectionsView } from './components/RedirectionsView';
import { StreamsView } from './components/StreamsView';
import { DeadHostsView } from './components/DeadHostsView';
import { AccessListsView } from './components/AccessListsView';
import { CertificatesView } from './components/CertificatesView';
import { ConfigInspectorView } from './components/ConfigInspectorView';
import { LiveLogDrawer } from './components/LiveLogDrawer';
import { HostEditModal } from './components/HostEditModal';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';
import { LocalDeployModal } from './components/LocalDeployModal';
import { LoginModal } from './components/LoginModal';
import { AdminLoginView } from './components/AdminLoginView';
import { DatabaseView } from './components/DatabaseView';
import { SettingsView } from './components/SettingsView';
import { DatabaseAuditEntry, INITIAL_AUDIT_LOGS } from './services/sqliteDb';

import {
  ProxyHost,
  RedirectionHost,
  DeadHost,
  StreamHost,
  AccessList,
  SslCertificate,
  AdminUser,
  NginxServerState,
  NginxLogEntry,
  DefaultSiteConfig,
} from './types';

import {
  INITIAL_ADMIN,
  INITIAL_CERTS,
  INITIAL_ACCESS_LISTS,
  INITIAL_PROXY_HOSTS,
  INITIAL_REDIRECTIONS,
  INITIAL_STREAMS,
  INITIAL_DEAD_HOSTS,
  INITIAL_SERVER_STATE,
  INITIAL_LOG_ENTRIES,
} from './services/mockData';

import {
  generateRandomLogEntry,
  generateExploitLogEntry,
} from './services/trafficSimulator';

import {
  generateProxyHostConfig,
  generateRedirectionHostConfig,
  generateStreamConfig,
  generateHtpasswd,
  generateMasterNginxConf,
  generateDockerCompose,
  generateDefaultSiteConfig,
  validateNginxSyntax,
} from './services/nginxGenerator';

export default function App() {
  // Authentication State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const isLoggedOut = localStorage.getItem('npm_is_logged_out');
    if (isLoggedOut === 'true') {
      return null;
    }
    const saved = localStorage.getItem('npm_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ADMIN;
      }
    }
    return INITIAL_ADMIN; // Default signed-in with demo account on first load
  });

  // App Data State
  const [proxyHosts, setProxyHosts] = useState<ProxyHost[]>(() => {
    const saved = localStorage.getItem('npm_proxy_hosts');
    return saved ? JSON.parse(saved) : INITIAL_PROXY_HOSTS;
  });

  const [redirections, setRedirections] = useState<RedirectionHost[]>(() => {
    const saved = localStorage.getItem('npm_redirections');
    return saved ? JSON.parse(saved) : INITIAL_REDIRECTIONS;
  });

  const [streams, setStreams] = useState<StreamHost[]>(() => {
    const saved = localStorage.getItem('npm_streams');
    return saved ? JSON.parse(saved) : INITIAL_STREAMS;
  });

  const [deadHosts, setDeadHosts] = useState<DeadHost[]>(() => {
    const saved = localStorage.getItem('npm_dead_hosts');
    return saved ? JSON.parse(saved) : INITIAL_DEAD_HOSTS;
  });

  const [accessLists, setAccessLists] = useState<AccessList[]>(() => {
    const saved = localStorage.getItem('npm_access_lists');
    return saved ? JSON.parse(saved) : INITIAL_ACCESS_LISTS;
  });

  const [certificates, setCertificates] = useState<SslCertificate[]>(() => {
    const saved = localStorage.getItem('npm_certificates');
    return saved ? JSON.parse(saved) : INITIAL_CERTS;
  });

  const [defaultSiteConfig, setDefaultSiteConfig] = useState<DefaultSiteConfig>(() => {
    const saved = localStorage.getItem('npm_default_site');
    return saved
      ? JSON.parse(saved)
      : {
          type: '444',
          redirectUrl: '',
          redirectCode: 301,
          customHtml: '',
        };
  });

  const [auditLogs, setAuditLogs] = useState<DatabaseAuditEntry[]>(() => {
    const saved = localStorage.getItem('npm_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const logAudit = (action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RELOAD', entity: string, targetId: string, details: string) => {
    const entry: DatabaseAuditEntry = {
      id: `aud_${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: adminUser?.email || 'admin@proxymanager.local',
      action,
      entity,
      targetId,
      details,
    };
    setAuditLogs((prev) => [entry, ...prev.slice(0, 99)]);
  };

  const [serverState, setServerState] = useState<NginxServerState>(INITIAL_SERVER_STATE);
  const [logs, setLogs] = useState<NginxLogEntry[]>(INITIAL_LOG_ENTRIES);

  // Navigation & Drawer States
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(true);
  const [isStreamPaused, setIsStreamPaused] = useState(false);

  // Modals
  const [editingHost, setEditingHost] = useState<ProxyHost | null>(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isArchitectureGuideOpen, setIsArchitectureGuideOpen] = useState(false);
  const [isLocalDeployOpen, setIsLocalDeployOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [inspectorSelectedPath, setInspectorSelectedPath] = useState<string | null>(null);
  const [syntaxNotification, setSyntaxNotification] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('npm_proxy_hosts', JSON.stringify(proxyHosts));
  }, [proxyHosts]);
  useEffect(() => {
    localStorage.setItem('npm_redirections', JSON.stringify(redirections));
  }, [redirections]);
  useEffect(() => {
    localStorage.setItem('npm_streams', JSON.stringify(streams));
  }, [streams]);
  useEffect(() => {
    localStorage.setItem('npm_dead_hosts', JSON.stringify(deadHosts));
  }, [deadHosts]);
  useEffect(() => {
    localStorage.setItem('npm_access_lists', JSON.stringify(accessLists));
  }, [accessLists]);
  useEffect(() => {
    localStorage.setItem('npm_certificates', JSON.stringify(certificates));
  }, [certificates]);
  useEffect(() => {
    localStorage.setItem('npm_default_site', JSON.stringify(defaultSiteConfig));
  }, [defaultSiteConfig]);
  useEffect(() => {
    localStorage.setItem('npm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    if (adminUser) {
      localStorage.setItem('npm_admin_session', JSON.stringify(adminUser));
    } else {
      localStorage.removeItem('npm_admin_session');
    }
  }, [adminUser]);

  // Real-Time Background Traffic & Log Stream Simulation
  useEffect(() => {
    const logInterval = setInterval(() => {
      if (!isStreamPaused) {
        const newLog = generateRandomLogEntry(proxyHosts);
        if (newLog) {
          setLogs((prev) => [newLog, ...prev.slice(0, 199)]);
        }
      }
    }, 2200);

    return () => clearInterval(logInterval);
  }, [proxyHosts, isStreamPaused]);

  // Real-Time Background Metrics Jitter & History Updates
  useEffect(() => {
    const metricInterval = setInterval(() => {
      setProxyHosts((prevHosts) =>
        prevHosts.map((host) => {
          if (!host.enabled) return host;
          const variance = (Math.random() - 0.49) * 0.15;
          const newRps = Math.max(5, Math.round(host.metrics.currentRps * (1 + variance)));
          const newLatency = Math.max(2, parseFloat((host.metrics.avgLatencyMs * (1 + variance * 0.7)).toFixed(1)));
          const now = Date.now();

          const newPoint = {
            timestamp: now,
            rps: newRps,
            latencyMs: newLatency,
            bandwidthKbps: Math.round(newRps * 3.8),
            status2xx: Math.round(newRps * 0.94),
            status4xx: Math.round(newRps * 0.05),
            status5xx: Math.round(newRps * 0.01),
          };

          const newHistory = [...host.metrics.history.slice(1), newPoint];

          return {
            ...host,
            metrics: {
              ...host.metrics,
              totalRequests: host.metrics.totalRequests + Math.round(newRps * 2.5),
              currentRps: newRps,
              avgLatencyMs: newLatency,
              history: newHistory,
            },
          };
        })
      );
    }, 3000);

    return () => clearInterval(metricInterval);
  }, []);

  // Reload Nginx Handler (Simulates nginx -s reload)
  const handleReloadNginx = () => {
    setServerState((prev) => ({ ...prev, isReloading: true }));

    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString();
      const timestamp = `${now.getDate()}/${now.toLocaleString('en', { month: 'short' })}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]} +0000`;

      // Add audit log entry
      const reloadLog: NginxLogEntry = {
        id: `log_reload_${Date.now()}`,
        timestamp,
        host: 'system',
        remoteAddr: '127.0.0.1',
        method: 'EXEC',
        path: 'nginx -s reload (SIGHUP)',
        status: 200,
        bytesSent: 0,
        responseTimeMs: 14.5,
        userAgent: 'NPM-Core Daemon',
        level: 'INFO',
        message: 'Configuration reloaded with zero downtime. Worker processes spawned.',
      };

      setLogs((prev) => [reloadLog, ...prev]);
      setServerState((prev) => ({
        ...prev,
        isReloading: false,
        lastReloadAt: timeStr,
        pid: prev.pid + 1,
        syntaxStatus: 'valid',
      }));

      setSyntaxNotification('nginx -s reload successful: workers reloaded with zero downtime.');
      setTimeout(() => setSyntaxNotification(null), 3500);
    }, 800);
  };

  // Test Nginx Syntax Handler (Simulates nginx -t)
  const handleTestSyntax = () => {
    // Validate master conf
    const master = generateMasterNginxConf();
    const check = validateNginxSyntax(master);

    const now = new Date().toLocaleTimeString();
    if (check.valid) {
      setServerState((prev) => ({
        ...prev,
        syntaxStatus: 'valid',
        lastSyntaxOutput: `[${now}] nginx: the configuration file /etc/nginx/nginx.conf syntax is ok\n[${now}] nginx: configuration file /etc/nginx/nginx.conf test is successful`,
      }));
      setSyntaxNotification("nginx -t passed: syntax is ok & test is successful!");
    } else {
      setServerState((prev) => ({
        ...prev,
        syntaxStatus: 'error',
        lastSyntaxOutput: `[${now}] nginx: [emerg] ${check.errors[0]}`,
      }));
      setSyntaxNotification(`nginx -t error: ${check.errors[0]}`);
    }

    setTimeout(() => setSyntaxNotification(null), 4000);
  };

  // Save Default Site Handler
  const handleSaveDefaultSite = (newConfig: DefaultSiteConfig) => {
    setDefaultSiteConfig(newConfig);
    logAudit(
      'UPDATE',
      'DEFAULT_SITE',
      'default.conf',
      `Updated unknown host behavior to: ${newConfig.type.toUpperCase()}`
    );
    handleReloadNginx();
  };

  // Export Complete Bundle Handler
  const handleExportBundle = () => {
    let combinedBundle = `# ============================================================\n`;
    combinedBundle += `# NPM-Core Configuration Export Bundle\n`;
    combinedBundle += `# Generated on: ${new Date().toISOString()}\n`;
    combinedBundle += `# ============================================================\n\n`;

    combinedBundle += `# --- /etc/nginx/nginx.conf ---\n`;
    combinedBundle += generateMasterNginxConf() + '\n\n';

    combinedBundle += `# --- /etc/nginx/conf.d/default.conf (Catch-All / Default Site) ---\n`;
    combinedBundle += generateDefaultSiteConfig(defaultSiteConfig) + '\n\n';

    combinedBundle += `# --- docker-compose.yml ---\n`;
    combinedBundle += generateDockerCompose() + '\n\n';

    proxyHosts.forEach((h) => {
      const cert = certificates.find((c) => c.id === h.certificateId);
      const acl = accessLists.find((a) => a.id === h.accessListId);
      combinedBundle += `# --- /etc/nginx/conf.d/${h.domainNames[0]}.conf ---\n`;
      combinedBundle += generateProxyHostConfig(h, cert, acl) + '\n\n';
    });

    const blob = new Blob([combinedBundle], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `npm-nginx-bundle-${Date.now()}.conf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Traffic Injections
  const handleSimulateRequest = (hostDomain: string, path: string, method: string) => {
    const now = new Date();
    const timestamp = `${now.getDate()}/${now.toLocaleString('en', { month: 'short' })}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]} +0000`;
    const newLog: NginxLogEntry = {
      id: `probe_${Date.now()}`,
      timestamp,
      host: hostDomain,
      remoteAddr: '192.168.1.15',
      method,
      path,
      status: 200,
      bytesSent: 3412,
      responseTimeMs: parseFloat((Math.random() * 8 + 3.2).toFixed(1)),
      userAgent: 'curl/8.7.1 (NPM-Core Web Probe)',
      level: 'ACCESS',
      upstreamAddr: '192.168.1.100:8000',
    };

    setLogs((prev) => [newLog, ...prev]);
    setIsLogDrawerOpen(true);
  };

  const handleSimulateExploit = (hostDomain: string) => {
    const exploitLog = generateExploitLogEntry(hostDomain);
    setLogs((prev) => [exploitLog, ...prev]);
    setIsLogDrawerOpen(true);
  };

  const handleSimulate502 = (hostDomain: string) => {
    const now = new Date();
    const timestamp = `${now.getDate()}/${now.toLocaleString('en', { month: 'short' })}/${now.getFullYear()}:${now.toTimeString().split(' ')[0]} +0000`;
    const errorLog: NginxLogEntry = {
      id: `err_502_${Date.now()}`,
      timestamp,
      host: hostDomain,
      remoteAddr: '198.51.100.4',
      method: 'GET',
      path: '/api/v2/payments/charge',
      status: 502,
      bytesSent: 166,
      responseTimeMs: 3004.2,
      userAgent: 'PaymentClient/1.0',
      level: 'ERROR',
      message: 'upstream prematurely closed connection while reading response header from upstream',
    };

    setLogs((prev) => [errorLog, ...prev]);
    setIsLogDrawerOpen(true);
  };

  // Proxy Host Actions
  const handleSaveProxyHost = (savedHost: ProxyHost) => {
    const exists = proxyHosts.some((h) => h.id === savedHost.id);
    setProxyHosts((prev) => {
      if (exists) {
        return prev.map((h) => (h.id === savedHost.id ? savedHost : h));
      }
      return [savedHost, ...prev];
    });
    logAudit(
      exists ? 'UPDATE' : 'CREATE',
      'proxy_hosts',
      savedHost.id,
      `${exists ? 'Updated' : 'Created'} proxy host ${savedHost.domainNames[0]} -> ${savedHost.forwardHost}:${savedHost.forwardPort}`
    );
    handleReloadNginx();
  };

  const handleDeleteProxyHost = (id: string) => {
    const target = proxyHosts.find((h) => h.id === id);
    setProxyHosts((prev) => prev.filter((h) => h.id !== id));
    logAudit(
      'DELETE',
      'proxy_hosts',
      id,
      `Deleted proxy host ${target ? target.domainNames[0] : id}`
    );
    handleReloadNginx();
  };

  const handleToggleProxyHost = (id: string) => {
    setProxyHosts((prev) =>
      prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h))
    );
    const target = proxyHosts.find((h) => h.id === id);
    logAudit(
      'UPDATE',
      'proxy_hosts',
      id,
      `Toggled host ${target ? target.domainNames[0] : id} state`
    );
    handleReloadNginx();
  };

  // Logout Handler
  const handleLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('npm_admin_session');
    localStorage.setItem('npm_is_logged_out', 'true');
    setSyntaxNotification('Sesi admin diakhiri. Berhasil logout.');
    setTimeout(() => setSyntaxNotification(null), 3000);
  };

  // Login Success Handler
  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    localStorage.removeItem('npm_is_logged_out');
    localStorage.setItem('npm_admin_session', JSON.stringify(user));
    setIsLoginModalOpen(false);
    setSyntaxNotification(`Selamat datang kembali, ${user.name}!`);
    setTimeout(() => setSyntaxNotification(null), 3000);
  };

  if (!adminUser) {
    return <AdminLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#1a1a17] text-[#f8f8f2] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        serverState={serverState}
        adminUser={adminUser}
        onReloadNginx={handleReloadNginx}
        onTestSyntax={handleTestSyntax}
        onOpenArchitectureGuide={() => setIsArchitectureGuideOpen(true)}
        onOpenLocalDeploy={() => setIsLocalDeployOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onExportBundle={handleExportBundle}
      />

      {/* Syntax Notification Toast */}
      {syntaxNotification && (
        <div className="fixed top-16 right-4 z-50 bg-[#272822] border border-[#a6e22e] text-[#a6e22e] px-4 py-2 rounded shadow-2xl font-mono text-xs flex items-center gap-2 animate-bounce">
          <span>&bull;</span>
          <span>{syntaxNotification}</span>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          counts={{
            proxyHosts: proxyHosts.length,
            redirections: redirections.length,
            streams: streams.length,
            deadHosts: deadHosts.length,
            accessLists: accessLists.length,
            certificates: certificates.length,
          }}
          logs={logs}
          isLogDrawerOpen={isLogDrawerOpen}
          onToggleLogDrawer={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
        />

        {/* Content Viewport */}
        <main
          className={`flex-1 p-4 md:p-6 overflow-y-auto ${
            isLogDrawerOpen ? 'pb-80' : 'pb-12'
          }`}
        >
          {currentTab === 'dashboard' && (
            <DashboardOverview
              hosts={proxyHosts}
              serverState={serverState}
              onSimulateRequest={handleSimulateRequest}
              onSimulateExploit={handleSimulateExploit}
              onSimulate502={handleSimulate502}
              onSelectHost={(hostId) => {
                const target = proxyHosts.find((h) => h.id === hostId);
                if (target) {
                  setEditingHost(target);
                  setIsHostModalOpen(true);
                }
              }}
            />
          )}

          {currentTab === 'proxy_hosts' && (
            <ProxyHostsView
              hosts={proxyHosts}
              certificates={certificates}
              accessLists={accessLists}
              onAddNewHost={() => {
                setEditingHost(null);
                setIsHostModalOpen(true);
              }}
              onEditHost={(host) => {
                setEditingHost(host);
                setIsHostModalOpen(true);
              }}
              onDeleteHost={handleDeleteProxyHost}
              onToggleEnabled={handleToggleProxyHost}
              onViewConfig={(host) => {
                setInspectorSelectedPath(`/etc/nginx/conf.d/${host.domainNames[0]}.conf`);
                setCurrentTab('inspector');
              }}
              onProbeHost={(domain) => handleSimulateRequest(domain, '/healthz', 'GET')}
            />
          )}

          {currentTab === 'redirections' && (
            <RedirectionsView
              redirections={redirections}
              certificates={certificates}
              onSaveRedirection={(item) => {
                setRedirections((prev) => {
                  const exists = prev.some((r) => r.id === item.id);
                  if (exists) return prev.map((r) => (r.id === item.id ? item : r));
                  return [item, ...prev];
                });
                handleReloadNginx();
              }}
              onDeleteRedirection={(id) => {
                setRedirections((prev) => prev.filter((r) => r.id !== id));
                handleReloadNginx();
              }}
            />
          )}

          {currentTab === 'streams' && (
            <StreamsView
              streams={streams}
              onSaveStream={(item) => {
                setStreams((prev) => {
                  const exists = prev.some((s) => s.id === item.id);
                  if (exists) return prev.map((s) => (s.id === item.id ? item : s));
                  return [item, ...prev];
                });
                handleReloadNginx();
              }}
              onDeleteStream={(id) => {
                setStreams((prev) => prev.filter((s) => s.id !== id));
                handleReloadNginx();
              }}
              onToggleStream={(id) => {
                setStreams((prev) =>
                  prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
                );
                handleReloadNginx();
              }}
            />
          )}

          {currentTab === 'dead_hosts' && (
            <DeadHostsView
              deadHosts={deadHosts}
              certificates={certificates}
              onSaveDeadHost={(item) => {
                setDeadHosts((prev) => {
                  const exists = prev.some((d) => d.id === item.id);
                  if (exists) return prev.map((d) => (d.id === item.id ? item : d));
                  return [item, ...prev];
                });
                handleReloadNginx();
              }}
              onDeleteDeadHost={(id) => {
                setDeadHosts((prev) => prev.filter((d) => d.id !== id));
                handleReloadNginx();
              }}
            />
          )}

          {currentTab === 'access_lists' && (
            <AccessListsView
              accessLists={accessLists}
              onSaveAccessList={(item) => {
                setAccessLists((prev) => {
                  const exists = prev.some((a) => a.id === item.id);
                  if (exists) return prev.map((a) => (a.id === item.id ? item : a));
                  return [item, ...prev];
                });
                handleReloadNginx();
              }}
              onDeleteAccessList={(id) => {
                setAccessLists((prev) => prev.filter((a) => a.id !== id));
                handleReloadNginx();
              }}
            />
          )}

          {currentTab === 'certificates' && (
            <CertificatesView
              certificates={certificates}
              onAddCertificate={(cert) => {
                setCertificates((prev) => [cert, ...prev]);
                handleReloadNginx();
              }}
              onRenewCertificate={(id) => {
                setCertificates((prev) =>
                  prev.map((c) =>
                    c.id === id
                      ? {
                          ...c,
                          expiresOn: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
                          status: 'valid',
                        }
                      : c
                  )
                );
                handleReloadNginx();
              }}
              onDeleteCertificate={(id) => {
                setCertificates((prev) => prev.filter((c) => c.id !== id));
                handleReloadNginx();
              }}
            />
          )}

          {currentTab === 'inspector' && (
            <ConfigInspectorView
              proxyHosts={proxyHosts}
              redirections={redirections}
              deadHosts={deadHosts}
              streams={streams}
              accessLists={accessLists}
              certificates={certificates}
              defaultSiteConfig={defaultSiteConfig}
              initialSelectedPath={inspectorSelectedPath}
              onTriggerReload={handleReloadNginx}
            />
          )}

          {currentTab === 'database' && (
            <DatabaseView
              proxyHosts={proxyHosts}
              redirections={redirections}
              deadHosts={deadHosts}
              streams={streams}
              accessLists={accessLists}
              certificates={certificates}
              adminUser={adminUser}
              auditLogs={auditLogs}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              currentConfig={defaultSiteConfig}
              onSaveConfig={handleSaveDefaultSite}
            />
          )}
        </main>
      </div>

      {/* Live Log Terminal Stream (Pinned at Bottom) */}
      <LiveLogDrawer
        logs={logs}
        isOpen={isLogDrawerOpen}
        onClose={() => setIsLogDrawerOpen(false)}
        onClearLogs={() => setLogs([])}
        isStreamPaused={isStreamPaused}
        onTogglePause={() => setIsStreamPaused(!isStreamPaused)}
      />

      {/* Host Edit Modal */}
      <HostEditModal
        initialHost={editingHost}
        certificates={certificates}
        accessLists={accessLists}
        isOpen={isHostModalOpen}
        onClose={() => {
          setIsHostModalOpen(false);
          setEditingHost(null);
        }}
        onSave={handleSaveProxyHost}
      />

      {/* Architecture Guide Modal */}
      <ArchitectureGuideModal
        isOpen={isArchitectureGuideOpen}
        onClose={() => setIsArchitectureGuideOpen(false)}
      />

      {/* Local Server Deployment Guide Modal */}
      <LocalDeployModal
        isOpen={isLocalDeployOpen}
        onClose={() => setIsLocalDeployOpen(false)}
      />

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
