import React, { useState } from 'react';
import { Share2, Plus, Trash2, Edit2, ArrowRight, Lock, ExternalLink } from 'lucide-react';
import { RedirectionHost, SslCertificate } from '../types';

interface RedirectionsViewProps {
  redirections: RedirectionHost[];
  certificates: SslCertificate[];
  onSaveRedirection: (redir: RedirectionHost) => void;
  onDeleteRedirection: (id: string) => void;
}

export const RedirectionsView: React.FC<RedirectionsViewProps> = ({
  redirections,
  certificates,
  onSaveRedirection,
  onDeleteRedirection,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RedirectionHost | null>(null);

  // Form state
  const [domainInput, setDomainInput] = useState('');
  const [forwardDomain, setForwardDomain] = useState('');
  const [statusCode, setStatusCode] = useState<301 | 302 | 307 | 308>(301);
  const [preservePath, setPreservePath] = useState(true);
  const [blockExploits, setBlockExploits] = useState(true);
  const [certificateId, setCertificateId] = useState<string>('');
  const [sslForced, setSslForced] = useState(false);

  const openNewModal = () => {
    setEditingItem(null);
    setDomainInput('');
    setForwardDomain('https://');
    setStatusCode(301);
    setPreservePath(true);
    setBlockExploits(true);
    setCertificateId('');
    setSslForced(false);
    setIsModalOpen(true);
  };

  const openEditModal = (item: RedirectionHost) => {
    setEditingItem(item);
    setDomainInput(item.domainNames.join(', '));
    setForwardDomain(item.forwardDomain);
    setStatusCode(item.statusCode);
    setPreservePath(item.preservePath);
    setBlockExploits(item.blockExploits);
    setCertificateId(item.certificateId || '');
    setSslForced(item.sslForced);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const domains = domainInput
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);

    if (domains.length === 0 || !forwardDomain) return;

    const newItem: RedirectionHost = {
      id: editingItem ? editingItem.id : `redir_${Date.now()}`,
      domainNames: domains,
      forwardDomain: forwardDomain.trim(),
      forwardPath: true,
      preservePath,
      statusCode,
      blockExploits,
      certificateId: certificateId ? certificateId : null,
      sslForced,
      hstsEnabled: sslForced,
      http2Support: Boolean(certificateId),
      advancedConfig: '',
      enabled: true,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    onSaveRedirection(newItem);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#fd971f]">REDIRECTIONS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            HTTP Redirection Hosts
          </h1>
          <p className="text-xs text-[#75715e] font-mono mt-0.5">
            Configure permanent 301 / temporary 302 redirects to canonical URLs or external sites
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-3 py-2 rounded text-xs font-mono font-semibold bg-[#fd971f] hover:bg-[#e08316] text-[#1e1f1c] transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Redirection</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-[#272822] border border-[#3e3d32] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#1e1f1c] text-[#75715e] border-b border-[#383830]">
              <tr>
                <th className="py-2.5 px-4 font-medium">SOURCE DOMAIN</th>
                <th className="py-2.5 px-4 font-medium">STATUS CODE</th>
                <th className="py-2.5 px-4 font-medium">FORWARD TARGET</th>
                <th className="py-2.5 px-4 font-medium">PRESERVE PATH</th>
                <th className="py-2.5 px-4 font-medium">SSL</th>
                <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383830]">
              {redirections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#75715e]">
                    No redirection hosts configured yet.
                  </td>
                </tr>
              ) : (
                redirections.map((r) => (
                  <tr key={r.id} className="hover:bg-[#2e2f29] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {r.domainNames.join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-[#fd971f]/10 text-[#fd971f] border border-[#fd971f]/30">
                        HTTP {r.statusCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#66d9ef] flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#75715e]" />
                      <span className="truncate max-w-sm">{r.forwardDomain}</span>
                    </td>
                    <td className="py-3 px-4 text-[#a6e22e]">
                      {r.preservePath ? 'Preserved ($request_uri)' : 'Exact Target Only'}
                    </td>
                    <td className="py-3 px-4">
                      {r.certificateId ? (
                        <span className="flex items-center gap-1 text-[#a6e22e] text-[11px]">
                          <Lock className="w-3 h-3" />
                          <span>HTTPS {r.sslForced ? '(Forced)' : ''}</span>
                        </span>
                      ) : (
                        <span className="text-[#75715e]">HTTP only</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(r)}
                          className="p-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#f8f8f2] border border-[#3e3d32]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete redirection for "${r.domainNames[0]}"?`)) {
                              onDeleteRedirection(r.id);
                            }
                          }}
                          className="p-1 rounded bg-[#1e1f1c] hover:bg-[#f92672]/20 text-[#75715e] hover:text-[#f92672] border border-[#3e3d32]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-md shadow-2xl overflow-hidden font-mono text-xs">
            <div className="p-4 border-b border-[#383830] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                {editingItem ? 'Edit Redirection Host' : 'New Redirection Host'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#75715e] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-[#75715e] mb-1">Source Domain(s):</label>
                <input
                  type="text"
                  required
                  placeholder="old-domain.com, sub.old.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#fd971f]"
                />
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">Forward Destination URL:</label>
                <input
                  type="url"
                  required
                  placeholder="https://newdomain.com"
                  value={forwardDomain}
                  onChange={(e) => setForwardDomain(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#fd971f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#75715e] mb-1">HTTP Status Code:</label>
                  <select
                    value={statusCode}
                    onChange={(e) => setStatusCode(Number(e.target.value) as any)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#fd971f]"
                  >
                    <option value={301}>301 Permanent Redirect</option>
                    <option value={302}>302 Temporary Redirect</option>
                    <option value={307}>307 Temporary Redirect (Strict)</option>
                    <option value={308}>308 Permanent Redirect (Strict)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#75715e] mb-1">SSL Certificate:</label>
                  <select
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#fd971f]"
                  >
                    <option value="">None (HTTP)</option>
                    {certificates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.niceName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#383830]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preservePath}
                    onChange={(e) => setPreservePath(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#fd971f] focus:ring-0"
                  />
                  <span className="text-white">Preserve URL Path (/blog/post -&gt; /blog/post)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sslForced}
                    onChange={(e) => setSslForced(e.target.checked)}
                    disabled={!certificateId}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#fd971f] focus:ring-0 disabled:opacity-40"
                  />
                  <span className={certificateId ? 'text-white' : 'text-[#75715e]'}>
                    Force SSL (Redirect 80 -&gt; 443)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#383830]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded bg-[#1e1f1c] text-[#75715e] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#fd971f] font-semibold text-[#1e1f1c] hover:bg-[#e08316]"
                >
                  Save Redirection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
