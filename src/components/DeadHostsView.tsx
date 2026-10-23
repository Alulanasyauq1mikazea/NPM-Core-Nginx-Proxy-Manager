import React, { useState } from 'react';
import { FileQuestion, Plus, Trash2, Edit2, Code } from 'lucide-react';
import { DeadHost, SslCertificate } from '../types';

interface DeadHostsViewProps {
  deadHosts: DeadHost[];
  certificates: SslCertificate[];
  onSaveDeadHost: (host: DeadHost) => void;
  onDeleteDeadHost: (id: string) => void;
}

export const DeadHostsView: React.FC<DeadHostsViewProps> = ({
  deadHosts,
  certificates,
  onSaveDeadHost,
  onDeleteDeadHost,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeadHost | null>(null);

  const [domainInput, setDomainInput] = useState('');
  const [customHtml, setCustomHtml] = useState('');
  const [certificateId, setCertificateId] = useState('');

  const openNew = () => {
    setEditingItem(null);
    setDomainInput('');
    setCustomHtml('');
    setCertificateId('');
    setIsModalOpen(true);
  };

  const openEdit = (h: DeadHost) => {
    setEditingItem(h);
    setDomainInput(h.domainNames.join(', '));
    setCustomHtml(h.customHtml);
    setCertificateId(h.certificateId || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const domains = domainInput.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (domains.length === 0) return;

    const item: DeadHost = {
      id: editingItem ? editingItem.id : `dead_${Date.now()}`,
      domainNames: domains,
      certificateId: certificateId || null,
      sslForced: Boolean(certificateId),
      http2Support: true,
      customHtml,
      enabled: true,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    onSaveDeadHost(item);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#f92672]">DEAD_HOSTS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            404 Dead Hosts & Deprecations
          </h1>
          <p className="text-xs text-[#75715e] font-mono mt-0.5">
            Return immediate HTTP 404 Not Found responses or maintenance pages without passing traffic upstream
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-3 py-2 rounded text-xs font-mono font-semibold bg-[#f92672] hover:bg-[#d8195d] text-white transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add 404 Host</span>
        </button>
      </div>

      <div className="bg-[#272822] border border-[#3e3d32] rounded overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#1e1f1c] text-[#75715e] border-b border-[#383830]">
            <tr>
              <th className="py-2.5 px-4 font-medium">DOMAIN NAME(S)</th>
              <th className="py-2.5 px-4 font-medium">RESPONSE STATUS</th>
              <th className="py-2.5 px-4 font-medium">CUSTOM HTML / STUB</th>
              <th className="py-2.5 px-4 font-medium">SSL</th>
              <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#383830]">
            {deadHosts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#75715e]">
                  No 404 dead hosts configured.
                </td>
              </tr>
            ) : (
              deadHosts.map((h) => (
                <tr key={h.id} className="hover:bg-[#2e2f29] transition-colors">
                  <td className="py-3 px-4 font-bold text-white">
                    {h.domainNames.join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-[#f92672]/15 text-[#f92672] border border-[#f92672]/30">
                      HTTP 404 Not Found
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#75715e]">
                    {h.customHtml ? (
                      <span className="text-[#a6e22e] flex items-center gap-1">
                        <Code className="w-3 h-3" />
                        <span>Custom HTML ({h.customHtml.length} chars)</span>
                      </span>
                    ) : (
                      <span>Default Nginx 404 Template</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#75715e]">
                    {h.certificateId ? 'HTTPS Active' : 'HTTP only'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(h)}
                        className="p-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#f8f8f2] border border-[#3e3d32]"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete 404 host "${h.domainNames[0]}"?`)) {
                            onDeleteDeadHost(h.id);
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-lg shadow-2xl p-4 font-mono text-xs">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-[#383830]">
              {editingItem ? 'Edit 404 Dead Host' : 'New 404 Dead Host'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-[#75715e] mb-1">Domain Name(s):</label>
                <input
                  type="text"
                  required
                  placeholder="old-api.example.com, test.example.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#f92672]"
                />
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">SSL Certificate:</label>
                <select
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#f92672]"
                >
                  <option value="">None (HTTP)</option>
                  {certificates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.niceName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">Custom 404 HTML (Optional):</label>
                <textarea
                  rows={5}
                  placeholder="<h1>Service Retired</h1><p>Contact admin@company.com</p>"
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-[#a6e22e] font-mono text-xs focus:outline-none focus:border-[#f92672]"
                />
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
                  className="px-4 py-1.5 rounded bg-[#f92672] font-semibold text-white hover:bg-[#d8195d]"
                >
                  Save 404 Host
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
