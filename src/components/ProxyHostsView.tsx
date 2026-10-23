import React, { useState } from 'react';
import {
  Globe,
  Plus,
  Search,
  Lock,
  Unlock,
  Shield,
  Zap,
  MoreVertical,
  Code,
  Edit2,
  Trash2,
  ExternalLink,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ProxyHost, SslCertificate, AccessList } from '../types';

interface ProxyHostsViewProps {
  hosts: ProxyHost[];
  certificates: SslCertificate[];
  accessLists: AccessList[];
  onAddNewHost: () => void;
  onEditHost: (host: ProxyHost) => void;
  onDeleteHost: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onViewConfig: (host: ProxyHost) => void;
  onProbeHost: (domain: string) => void;
}

export const ProxyHostsView: React.FC<ProxyHostsViewProps> = ({
  hosts,
  certificates,
  accessLists,
  onAddNewHost,
  onEditHost,
  onDeleteHost,
  onToggleEnabled,
  onViewConfig,
  onProbeHost,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredHosts = hosts.filter((h) => {
    const q = searchQuery.toLowerCase();
    return (
      h.domainNames.some((d) => d.toLowerCase().includes(q)) ||
      h.forwardHost.toLowerCase().includes(q) ||
      h.forwardPort.toString().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#66d9ef]">PROXY_HOSTS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            HTTP & HTTPS Proxy Hosts
          </h1>
          <p className="text-xs text-[#75715e] font-mono mt-0.5">
            Forward inbound domain traffic to internal services and Docker containers
          </p>
        </div>

        <button
          onClick={onAddNewHost}
          className="px-3 py-2 rounded text-xs font-mono font-semibold bg-[#a6e22e] hover:bg-[#92cc26] text-[#1e1f1c] transition-colors flex items-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Proxy Host</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-[#272822] p-2 rounded border border-[#3e3d32]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#75715e] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter domains, upstream IP, or port..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1e1f1c] border border-[#383830] rounded pl-9 pr-3 py-1.5 text-xs font-mono text-white placeholder-[#75715e] focus:outline-none focus:border-[#66d9ef]"
          />
        </div>

        <div className="text-xs font-mono text-[#75715e] hidden sm:block">
          Showing {filteredHosts.length} of {hosts.length} configured hosts
        </div>
      </div>

      {/* Hosts Table */}
      <div className="bg-[#272822] border border-[#3e3d32] rounded overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#1e1f1c] text-[#75715e] border-b border-[#383830]">
              <tr>
                <th className="py-2.5 px-4 font-medium w-12 text-center">STATE</th>
                <th className="py-2.5 px-4 font-medium">SOURCE DOMAINS</th>
                <th className="py-2.5 px-4 font-medium">UPSTREAM TARGET</th>
                <th className="py-2.5 px-4 font-medium">SSL CERTIFICATE</th>
                <th className="py-2.5 px-4 font-medium">POLICIES</th>
                <th className="py-2.5 px-4 font-medium">ACCESS CONTROL</th>
                <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383830]">
              {filteredHosts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#75715e]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p>No proxy hosts match the search criteria.</p>
                      <button
                        onClick={onAddNewHost}
                        className="text-xs text-[#a6e22e] underline hover:no-underline"
                      >
                        Create your first proxy host
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredHosts.map((host) => {
                  const cert = certificates.find((c) => c.id === host.certificateId);
                  const acl = accessLists.find((a) => a.id === host.accessListId);
                  const isMenuOpen = activeMenuId === host.id;

                  return (
                    <tr
                      key={host.id}
                      className={`hover:bg-[#2e2f29] transition-colors ${
                        !host.enabled ? 'opacity-60 bg-[#1c1d1a]' : ''
                      }`}
                    >
                      {/* State Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onToggleEnabled(host.id)}
                          title={host.enabled ? 'Host is Enabled. Click to disable' : 'Host is Disabled. Click to enable'}
                          className={`w-7 h-4 rounded-full transition-colors relative inline-block ${
                            host.enabled ? 'bg-[#a6e22e]' : 'bg-[#49483e]'
                          }`}
                        >
                          <span
                            className={`w-3 h-3 rounded-full bg-[#1e1f1c] absolute top-0.5 transition-transform ${
                              host.enabled ? 'left-3.5' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Source Domains */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className={host.enabled ? '' : 'line-through text-[#75715e]'}>
                              {host.domainNames[0]}
                            </span>
                            <a
                              href={`http://${host.domainNames[0]}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[#75715e] hover:text-[#66d9ef]"
                              title="Open domain in browser (if DNS pointed)"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                          {host.domainNames.length > 1 && (
                            <div className="text-[11px] text-[#75715e] flex flex-wrap gap-1">
                              {host.domainNames.slice(1).map((d) => (
                                <span key={d} className="px-1 py-0.2 rounded bg-[#1e1f1c]">
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Upstream Target */}
                      <td className="py-3 px-4">
                        <div className="text-[#66d9ef] font-semibold">
                          {host.forwardScheme}://{host.forwardHost}:{host.forwardPort}
                        </div>
                        <div className="text-[10px] text-[#75715e]">
                          Keepalive 32 · fail_timeout=10s
                        </div>
                      </td>

                      {/* SSL Certificate */}
                      <td className="py-3 px-4">
                        {cert ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-[#a6e22e]">
                              <Lock className="w-3 h-3" />
                              <span className="font-medium truncate max-w-[140px]" title={cert.niceName}>
                                {cert.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom SSL'}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#75715e]">
                              {host.sslForced ? 'Force SSL' : 'Optional SSL'}
                              {host.http2Support ? ' · HTTP/2' : ''}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[#75715e]">
                            <Unlock className="w-3 h-3" />
                            <span>None (HTTP only)</span>
                          </div>
                        )}
                      </td>

                      {/* Policies (Cache, Exploit block, Websocket) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {host.cachingEnabled && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#a6e22e]/10 text-[#a6e22e] border border-[#a6e22e]/30"
                              title="Static assets caching active"
                            >
                              Cache
                            </span>
                          )}
                          {host.blockExploits && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#fd971f]/10 text-[#fd971f] border border-[#fd971f]/30"
                              title="WAF rules enabled (blocking .env, SQLi, .git)"
                            >
                              WAF
                            </span>
                          )}
                          {host.websocketSupport && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[#ae81ff]/10 text-[#ae81ff] border border-[#ae81ff]/30"
                              title="WebSocket upgrade support enabled"
                            >
                              WS
                            </span>
                          )}
                          {!host.cachingEnabled && !host.blockExploits && !host.websocketSupport && (
                            <span className="text-[#75715e] text-[11px]">Standard</span>
                          )}
                        </div>
                      </td>

                      {/* Access Control */}
                      <td className="py-3 px-4">
                        {acl ? (
                          <span className="text-[#e6db74] flex items-center gap-1 text-[11px]" title={acl.description}>
                            <Shield className="w-3 h-3" />
                            <span className="truncate max-w-[110px]">{acl.name}</span>
                          </span>
                        ) : (
                          <span className="text-[#75715e] text-[11px]">Public Access</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Quick probe button */}
                          <button
                            onClick={() => onProbeHost(host.domainNames[0])}
                            title="Send simulated test curl to this host"
                            className="p-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#a6e22e] border border-[#3e3d32] transition-colors"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>

                          {/* View Nginx config button */}
                          <button
                            onClick={() => onViewConfig(host)}
                            title="Inspect generated Nginx .conf file"
                            className="p-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32] transition-colors"
                          >
                            <Code className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => onEditHost(host)}
                            title="Edit proxy host parameters"
                            className="p-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#f8f8f2] border border-[#3e3d32] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              if (confirm(`Delete proxy host for "${host.domainNames[0]}"?`)) {
                                onDeleteHost(host.id);
                              }
                            }}
                            title="Delete this host"
                            className="p-1 rounded bg-[#1e1f1c] hover:bg-[#f92672]/20 text-[#75715e] hover:text-[#f92672] border border-[#3e3d32] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
