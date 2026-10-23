import React, { useState } from 'react';
import {
  Globe,
  Lock,
  Sliders,
  Code,
  Check,
  Shield,
  Zap,
  Info,
} from 'lucide-react';
import { ProxyHost, SslCertificate, AccessList, ProtocolScheme } from '../types';
import { generateProxyHostConfig } from '../services/nginxGenerator';

interface HostEditModalProps {
  initialHost?: ProxyHost | null;
  certificates: SslCertificate[];
  accessLists: AccessList[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (host: ProxyHost) => void;
}

export const HostEditModal: React.FC<HostEditModalProps> = ({
  initialHost,
  certificates,
  accessLists,
  isOpen,
  onClose,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'ssl' | 'advanced' | 'preview'>('details');

  // Form State
  const [domainInput, setDomainInput] = useState<string>(
    initialHost ? initialHost.domainNames.join(', ') : ''
  );
  const [forwardScheme, setForwardScheme] = useState<ProtocolScheme>(
    initialHost ? initialHost.forwardScheme : 'http'
  );
  const [forwardHost, setForwardHost] = useState<string>(
    initialHost ? initialHost.forwardHost : ''
  );
  const [forwardPort, setForwardPort] = useState<number>(
    initialHost ? initialHost.forwardPort : 8080
  );
  const [cachingEnabled, setCachingEnabled] = useState<boolean>(
    initialHost ? initialHost.cachingEnabled : false
  );
  const [blockExploits, setBlockExploits] = useState<boolean>(
    initialHost ? initialHost.blockExploits : true
  );
  const [websocketSupport, setWebsocketSupport] = useState<boolean>(
    initialHost ? initialHost.websocketSupport : true
  );
  const [accessListId, setAccessListId] = useState<string>(
    initialHost?.accessListId || ''
  );

  // SSL State
  const [certificateId, setCertificateId] = useState<string>(
    initialHost?.certificateId || ''
  );
  const [sslForced, setSslForced] = useState<boolean>(
    initialHost ? initialHost.sslForced : true
  );
  const [hstsEnabled, setHstsEnabled] = useState<boolean>(
    initialHost ? initialHost.hstsEnabled : true
  );
  const [hstsSubdomains, setHstsSubdomains] = useState<boolean>(
    initialHost ? initialHost.hstsSubdomains : false
  );
  const [http2Support, setHttp2Support] = useState<boolean>(
    initialHost ? initialHost.http2Support : true
  );

  // Advanced State
  const [advancedConfig, setAdvancedConfig] = useState<string>(
    initialHost ? initialHost.advancedConfig : ''
  );

  if (!isOpen) return null;

  // Build draft host object for preview
  const draftDomains = domainInput
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  const draftHost: ProxyHost = {
    id: initialHost ? initialHost.id : `host_${Date.now()}`,
    domainNames: draftDomains.length > 0 ? draftDomains : ['example.com'],
    forwardScheme,
    forwardHost: forwardHost || '127.0.0.1',
    forwardPort: Number(forwardPort) || 80,
    cachingEnabled,
    blockExploits,
    websocketSupport,
    accessListId: accessListId || null,
    certificateId: certificateId || null,
    sslForced,
    hstsEnabled,
    hstsSubdomains,
    http2Support,
    advancedConfig,
    enabled: initialHost ? initialHost.enabled : true,
    createdAt: initialHost ? initialHost.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 19),
    metrics: initialHost
      ? initialHost.metrics
      : {
          totalRequests: 0,
          currentRps: 0,
          avgLatencyMs: 0,
          latencyP50: 0,
          latencyP95: 0,
          latencyP99: 0,
          bandwidthInKb: 0,
          bandwidthOutKb: 0,
          status2xxCount: 0,
          status3xxCount: 0,
          status4xxCount: 0,
          status5xxCount: 0,
          cacheHitRatio: 0,
          history: [],
        },
  };

  const selectedCert = certificates.find((c) => c.id === certificateId);
  const selectedAcl = accessLists.find((a) => a.id === accessListId);
  const previewConfig = generateProxyHostConfig(draftHost, selectedCert, selectedAcl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftDomains.length === 0 || !forwardHost.trim()) {
      alert('Please provide domain name(s) and forward host/IP');
      return;
    }
    onSave(draftHost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl font-mono text-xs overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#383830] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#a6e22e]" />
            <h2 className="font-bold text-white text-sm">
              {initialHost ? 'Edit Proxy Host' : 'New Proxy Host'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#75715e] hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-[#383830] flex items-center gap-2 bg-[#1e1f1c]">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-3 py-2 border-b-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-[#a6e22e] text-[#a6e22e]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ssl')}
            className={`px-3 py-2 border-b-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'ssl'
                ? 'border-[#a6e22e] text-[#a6e22e]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>SSL / TLS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`px-3 py-2 border-b-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'advanced'
                ? 'border-[#a6e22e] text-[#a6e22e]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            <span>Custom Directives</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 border-b-2 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'border-[#66d9ef] text-[#66d9ef]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Live .conf Preview</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[#75715e] mb-1 font-semibold">
                  Domain Name(s):
                </label>
                <input
                  type="text"
                  required
                  placeholder="api.example.com, core.example.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                />
                <span className="text-[10px] text-[#75715e] mt-1 block">
                  Comma separated for multiple domains serving the same upstream
                </span>
              </div>

              {/* Upstream destination */}
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-3">
                  <label className="block text-[#75715e] mb-1 font-semibold">
                    Scheme:
                  </label>
                  <select
                    value={forwardScheme}
                    onChange={(e) => setForwardScheme(e.target.value as ProtocolScheme)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                  >
                    <option value="http">http</option>
                    <option value="https">https</option>
                  </select>
                </div>

                <div className="col-span-6">
                  <label className="block text-[#75715e] mb-1 font-semibold">
                    Forward Hostname / IP:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="192.168.1.50 or backend_app"
                    value={forwardHost}
                    onChange={(e) => setForwardHost(e.target.value)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                  />
                </div>

                <div className="col-span-3">
                  <label className="block text-[#75715e] mb-1 font-semibold">
                    Port:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    required
                    value={forwardPort}
                    onChange={(e) => setForwardPort(Number(e.target.value))}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                  />
                </div>
              </div>

              {/* Feature Toggles */}
              <div className="pt-2 border-t border-[#383830] space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cachingEnabled}
                    onChange={(e) => setCachingEnabled(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0"
                  />
                  <div>
                    <span className="text-white font-medium">Cache Static Assets</span>
                    <span className="text-[#75715e] text-[10px] block">
                      Caches images, css, js, fonts for 7 days via proxy_cache
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={blockExploits}
                    onChange={(e) => setBlockExploits(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#fd971f] focus:ring-0"
                  />
                  <div>
                    <span className="text-white font-medium">Block Common Exploits (WAF Rules)</span>
                    <span className="text-[#75715e] text-[10px] block">
                      Blocks access to .env, .git, SQL injection keywords, and PHP eval attacks
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={websocketSupport}
                    onChange={(e) => setWebsocketSupport(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#ae81ff] focus:ring-0"
                  />
                  <div>
                    <span className="text-white font-medium">Websockets Support</span>
                    <span className="text-[#75715e] text-[10px] block">
                      Sets Upgrade and Connection headers for Socket.io, ws, and GraphQL subscriptions
                    </span>
                  </div>
                </label>
              </div>

              {/* Access List selection */}
              <div className="pt-2 border-t border-[#383830]">
                <label className="block text-[#75715e] mb-1 font-semibold">
                  Access List (Restricted Access):
                </label>
                <select
                  value={accessListId}
                  onChange={(e) => setAccessListId(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                >
                  <option value="">None (Publicly Accessible)</option>
                  {accessLists.map((acl) => (
                    <option key={acl.id} value={acl.id}>
                      {acl.name} ({acl.clients.length} IP rules, {acl.items.length} auth users)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: SSL */}
          {activeTab === 'ssl' && (
            <div className="space-y-4">
              <div>
                <label className="block text-[#75715e] mb-1 font-semibold">
                  SSL Certificate:
                </label>
                <select
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                >
                  <option value="">None (Plain HTTP on port 80 only)</option>
                  {certificates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.niceName} ({c.provider === 'letsencrypt' ? "Let's Encrypt" : 'Custom'})
                    </option>
                  ))}
                </select>
                {!certificateId && (
                  <span className="text-[10px] text-[#fd971f] mt-1 block">
                    No certificate selected. Traffic will only be served over unencrypted HTTP (Port 80).
                  </span>
                )}
              </div>

              {certificateId && (
                <div className="space-y-3 pt-2 border-t border-[#383830]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sslForced}
                      onChange={(e) => setSslForced(e.target.checked)}
                      className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0"
                    />
                    <div>
                      <span className="text-white font-medium">Force SSL</span>
                      <span className="text-[#75715e] text-[10px] block">
                        Redirects all incoming HTTP (port 80) requests to HTTPS (port 443)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hstsEnabled}
                      onChange={(e) => setHstsEnabled(e.target.checked)}
                      className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0"
                    />
                    <div>
                      <span className="text-white font-medium">HSTS Enabled (Strict-Transport-Security)</span>
                      <span className="text-[#75715e] text-[10px] block">
                        Instructs browsers to only connect via HTTPS for 2 years (63072000s)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer pl-6">
                    <input
                      type="checkbox"
                      checked={hstsSubdomains}
                      onChange={(e) => setHstsSubdomains(e.target.checked)}
                      disabled={!hstsEnabled}
                      className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0 disabled:opacity-40"
                    />
                    <div>
                      <span className="text-white font-medium">HSTS Subdomains</span>
                      <span className="text-[#75715e] text-[10px] block">
                        Applies HSTS policy to all subdomains (includeSubDomains)
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={http2Support}
                      onChange={(e) => setHttp2Support(e.target.checked)}
                      className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0"
                    />
                    <div>
                      <span className="text-white font-medium">HTTP/2 Support</span>
                      <span className="text-[#75715e] text-[10px] block">
                        Enables multiplexed HTTP/2 protocol on SSL port 443
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADVANCED */}
          {activeTab === 'advanced' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[#75715e] mb-1 font-semibold">
                  Custom Nginx Directives:
                </label>
                <textarea
                  rows={8}
                  placeholder={`# Example directives:\nclient_max_body_size 100M;\nproxy_connect_timeout 10s;\nproxy_read_timeout 120s;`}
                  value={advancedConfig}
                  onChange={(e) => setAdvancedConfig(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-[#a6e22e] font-mono text-xs focus:outline-none focus:border-[#a6e22e]"
                />
                <span className="text-[10px] text-[#75715e] mt-1 block">
                  These lines will be injected verbatim into the Nginx server block.
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#75715e] text-[11px]">
                <span>Generated Nginx Configuration:</span>
                <span className="text-[#a6e22e]">Auto-updated</span>
              </div>
              <div className="bg-[#1e1f1c] border border-[#383830] rounded p-3 overflow-x-auto max-h-80 overflow-y-auto">
                <pre className="text-[#f8f8f2] text-[11px] leading-relaxed">
                  {previewConfig}
                </pre>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#383830]">
            <div className="text-[10px] text-[#75715e]">
              Saved configurations take effect immediately upon next Nginx reload
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded bg-[#1e1f1c] text-[#75715e] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#a6e22e] font-semibold text-[#1e1f1c] hover:bg-[#92cc26]"
              >
                Save Proxy Host
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
