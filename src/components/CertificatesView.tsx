import React, { useState } from 'react';
import { Lock, Plus, RefreshCw, CheckCircle2, AlertTriangle, Shield, Calendar, Terminal } from 'lucide-react';
import { SslCertificate } from '../types';

interface CertificatesViewProps {
  certificates: SslCertificate[];
  onAddCertificate: (cert: SslCertificate) => void;
  onRenewCertificate: (id: string) => void;
  onDeleteCertificate: (id: string) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  onAddCertificate,
  onRenewCertificate,
  onDeleteCertificate,
}) => {
  const [activeModal, setActiveModal] = useState<'letsencrypt' | 'custom' | null>(null);

  // Let's Encrypt Form
  const [leDomains, setLeDomains] = useState('');
  const [leEmail, setLeEmail] = useState('admin@production.tech');
  const [leAgree, setLeAgree] = useState(true);
  const [isRequestingLe, setIsRequestingLe] = useState(false);
  const [leConsoleLogs, setLeConsoleLogs] = useState<string[]>([]);

  // Custom Cert Form
  const [customName, setCustomName] = useState('');
  const [customDomains, setCustomDomains] = useState('');
  const [customCertPem, setCustomCertPem] = useState('');
  const [customKeyPem, setCustomKeyPem] = useState('');

  const handleRequestLetsEncrypt = (e: React.FormEvent) => {
    e.preventDefault();
    const domains = leDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (domains.length === 0) return;

    setIsRequestingLe(true);
    setLeConsoleLogs([
      `[1/4] Initiating ACME HTTP-01 challenge for: ${domains.join(', ')}`,
      `[2/4] Writing challenge tokens to /var/www/html/.well-known/acme-challenge/`,
    ]);

    setTimeout(() => {
      setLeConsoleLogs((prev) => [
        ...prev,
        `[3/4] Let's Encrypt validation server verified domain ownership via port 80 (HTTP-01)`,
        `[4/4] Generating 4096-bit RSA key and signing x509 leaf certificate...`,
      ]);

      setTimeout(() => {
        const newCert: SslCertificate = {
          id: `cert_le_${Date.now()}`,
          niceName: `Let's Encrypt (${domains[0]})`,
          domainNames: domains,
          provider: 'letsencrypt',
          expiresOn: new Date(Date.now() + 90 * 86400 * 1000).toISOString(),
          status: 'valid',
          autoRenew: true,
          ocspStapling: true,
        };

        onAddCertificate(newCert);
        setIsRequestingLe(false);
        setActiveModal(null);
        setLeConsoleLogs([]);
        setLeDomains('');
      }, 1200);
    }, 1200);
  };

  const handleSaveCustomCert = (e: React.FormEvent) => {
    e.preventDefault();
    const domains = customDomains.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
    if (domains.length === 0 || !customName.trim()) return;

    const newCert: SslCertificate = {
      id: `cert_custom_${Date.now()}`,
      niceName: customName.trim(),
      domainNames: domains,
      provider: 'custom',
      expiresOn: new Date(Date.now() + 365 * 86400 * 1000).toISOString(),
      status: 'valid',
      autoRenew: false,
      ocspStapling: true,
      certificatePem: customCertPem,
      privateKeyPem: customKeyPem,
    };

    onAddCertificate(newCert);
    setActiveModal(null);
    setCustomName('');
    setCustomDomains('');
    setCustomCertPem('');
    setCustomKeyPem('');
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#f92672]">SSL_CERTIFICATES</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            SSL / TLS Certificates Manager
          </h1>
          <p className="text-xs text-[#75715e] mt-0.5">
            Automated Let's Encrypt ACME challenges, custom certificates, and OCSP Stapling
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveModal('letsencrypt')}
            className="px-3 py-2 rounded font-semibold bg-[#a6e22e] hover:bg-[#92cc26] text-[#1e1f1c] transition-colors flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>Request Let's Encrypt</span>
          </button>
          <button
            onClick={() => setActiveModal('custom')}
            className="px-3 py-2 rounded bg-[#272822] hover:bg-[#383830] text-white border border-[#3e3d32] transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Custom Cert</span>
          </button>
        </div>
      </div>

      {/* Certificates Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certificates.map((cert) => {
          const daysLeft = Math.ceil(
            (new Date(cert.expiresOn).getTime() - Date.now()) / (1000 * 86400)
          );
          const isExpiringSoon = daysLeft <= 14;

          return (
            <div
              key={cert.id}
              className="bg-[#272822] border border-[#3e3d32] rounded p-4 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#a6e22e]" />
                      <h3 className="font-bold text-white text-sm">{cert.niceName}</h3>
                    </div>
                    <div className="text-[#75715e] text-xs mt-1">
                      Domains: {cert.domainNames.join(', ')}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cert.status === 'valid'
                        ? 'bg-[#a6e22e]/10 text-[#a6e22e] border border-[#a6e22e]/30'
                        : 'bg-[#f92672]/10 text-[#f92672] border border-[#f92672]/30'
                    }`}
                  >
                    {cert.status.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#383830] text-[11px]">
                  <div>
                    <span className="text-[#75715e]">Provider:</span>
                    <div className="text-white font-medium">
                      {cert.provider === 'letsencrypt' ? "Let's Encrypt (ACME)" : 'Custom Key/Cert'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#75715e]">Auto-Renew:</span>
                    <div className={cert.autoRenew ? 'text-[#a6e22e]' : 'text-[#75715e]'}>
                      {cert.autoRenew ? 'Enabled (Every 60d)' : 'Manual Renewal'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#75715e]">Expires On:</span>
                    <div className="text-white font-medium">
                      {new Date(cert.expiresOn).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#75715e]">Validity:</span>
                    <div className={isExpiringSoon ? 'text-[#f92672] font-bold' : 'text-[#a6e22e]'}>
                      {daysLeft} days remaining
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#383830]">
                <div className="text-[10px] text-[#75715e]">
                  {cert.ocspStapling ? 'OCSP Stapling On' : 'No OCSP'}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRenewCertificate(cert.id)}
                    title="Simulate SSL Renewal"
                    className="px-2.5 py-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32] flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Renew</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete certificate "${cert.niceName}"?`)) {
                        onDeleteCertificate(cert.id);
                      }
                    }}
                    className="p-1 rounded bg-[#1e1f1c] hover:bg-[#f92672]/20 text-[#75715e] hover:text-[#f92672] border border-[#3e3d32]"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Let's Encrypt Request Modal */}
      {activeModal === 'letsencrypt' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-lg shadow-2xl p-4">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-[#383830] flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#a6e22e]" />
              <span>Request Automated Let's Encrypt Certificate</span>
            </h3>

            <form onSubmit={handleRequestLetsEncrypt} className="space-y-4 mt-4">
              <div>
                <label className="block text-[#75715e] mb-1">Domain Name(s):</label>
                <input
                  type="text"
                  required
                  placeholder="app.example.com, api.example.com"
                  value={leDomains}
                  onChange={(e) => setLeDomains(e.target.value)}
                  disabled={isRequestingLe}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                />
                <span className="text-[10px] text-[#75715e] mt-1 block">
                  Ensure DNS A records point to this proxy server on Port 80
                </span>
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">Registration Email:</label>
                <input
                  type="email"
                  required
                  value={leEmail}
                  onChange={(e) => setLeEmail(e.target.value)}
                  disabled={isRequestingLe}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={leAgree}
                  onChange={(e) => setLeAgree(e.target.checked)}
                  disabled={isRequestingLe}
                  className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e]"
                />
                <span className="text-white text-xs">
                  I agree to the Let's Encrypt Subscriber Agreement
                </span>
              </label>

              {/* Console log box when requesting */}
              {leConsoleLogs.length > 0 && (
                <div className="bg-[#1e1f1c] border border-[#383830] p-2 rounded text-[11px] text-[#a6e22e] space-y-1">
                  {leConsoleLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-[#383830]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={isRequestingLe}
                  className="px-3 py-1.5 rounded bg-[#1e1f1c] text-[#75715e] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRequestingLe}
                  className="px-4 py-1.5 rounded bg-[#a6e22e] font-semibold text-[#1e1f1c] hover:bg-[#92cc26] flex items-center gap-2"
                >
                  {isRequestingLe && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRequestingLe ? 'Validating Challenge...' : 'Request Certificate'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Certificate Upload Modal */}
      {activeModal === 'custom' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-lg shadow-2xl p-4">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-[#383830]">
              Upload Custom SSL Certificate
            </h3>

            <form onSubmit={handleSaveCustomCert} className="space-y-4 mt-4">
              <div>
                <label className="block text-[#75715e] mb-1">Friendly Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloudflare Origin CA"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#66d9ef]"
                />
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">Covered Domains:</label>
                <input
                  type="text"
                  required
                  placeholder="*.domain.com, domain.com"
                  value={customDomains}
                  onChange={(e) => setCustomDomains(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#66d9ef]"
                />
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">Certificate PEM (fullchain.crt):</label>
                <textarea
                  rows={4}
                  required
                  placeholder="-----BEGIN CERTIFICATE----- ... -----END CERTIFICATE-----"
                  value={customCertPem}
                  onChange={(e) => setCustomCertPem(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-[#a6e22e] text-[10px]"
                />
              </div>

              <div>
                <label className="block text-[#75715e] mb-1">Private Key PEM (privkey.key):</label>
                <textarea
                  rows={3}
                  required
                  placeholder="-----BEGIN PRIVATE KEY----- ... -----END PRIVATE KEY-----"
                  value={customKeyPem}
                  onChange={(e) => setCustomKeyPem(e.target.value)}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-[#e6db74] text-[10px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#383830]">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded bg-[#1e1f1c] text-[#75715e] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#66d9ef] font-semibold text-[#1e1f1c] hover:bg-[#52c8de]"
                >
                  Save Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
