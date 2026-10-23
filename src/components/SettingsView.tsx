import React, { useState } from 'react';
import {
  Settings,
  Globe,
  Radio,
  CheckCircle2,
  Code,
  ArrowRight,
  ShieldAlert,
  Server,
  Save,
} from 'lucide-react';
import { DefaultSiteConfig, DefaultSiteType } from '../types';

interface SettingsViewProps {
  currentConfig: DefaultSiteConfig;
  onSaveConfig: (newConfig: DefaultSiteConfig) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentConfig,
  onSaveConfig,
}) => {
  const [activeSection, setActiveSection] = useState<'default_site'>('default_site');
  const [selectedType, setSelectedType] = useState<DefaultSiteType>(currentConfig.type || '444');
  const [redirectUrl, setRedirectUrl] = useState<string>(currentConfig.redirectUrl || 'https://');
  const [redirectCode, setRedirectCode] = useState<301 | 302>(currentConfig.redirectCode || 302);
  const [customHtml, setCustomHtml] = useState<string>(
    currentConfig.customHtml ||
      `<div style="font-family:sans-serif;text-align:center;padding:60px;background:#1e1f1c;color:#f8f8f2;">\n  <h1 style="color:#fd971f;">404 Not Found</h1>\n  <p>The host you requested is not configured on this server.</p>\n</div>`
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: DefaultSiteConfig = {
      type: selectedType,
      redirectUrl: selectedType === 'redirect' ? redirectUrl : undefined,
      redirectCode: selectedType === 'redirect' ? redirectCode : undefined,
      customHtml: selectedType === 'custom_html' ? customHtml : undefined,
    };
    onSaveConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#a6e22e]">SETTINGS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            Global Proxy Settings & Default Site
          </h1>
          <p className="text-xs text-[#75715e] mt-0.5">
            Configure how Nginx responds when accessed via direct IP or unmapped hostnames
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3 py-1.5 rounded bg-[#a6e22e]/15 border border-[#a6e22e] text-[#a6e22e] flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved & Nginx reloaded!</span>
          </div>
        )}
      </div>

      {/* Main Settings Layout matching user's reference image */}
      <div className="bg-[#1e1f1c] border border-[#3e3d32] rounded shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
        {/* Left Subnav */}
        <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-[#383830] p-4 bg-[#171815] space-y-2">
          <div className="text-[11px] uppercase font-bold text-white mb-3">Settings</div>
          <button
            onClick={() => setActiveSection('default_site')}
            className={`w-full text-left px-3 py-2 rounded text-xs font-semibold flex items-center justify-between transition-colors ${
              activeSection === 'default_site'
                ? 'bg-[#272822] text-[#a6e22e] border-l-2 border-[#a6e22e]'
                : 'text-[#75715e] hover:text-white'
            }`}
          >
            <span>Default Site</span>
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-9 p-6 flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-white">
                What to show when Nginx is hit with an unknown Host
              </h2>
              <p className="text-[11px] text-[#75715e] mt-0.5">
                Catch-all default_server response when a request arrives without a matching domain or via raw IP
              </p>
            </div>

            {/* Radio options container */}
            <div className="space-y-2.5">
              {/* Option 1: Congratulations Page */}
              <label
                onClick={() => setSelectedType('congratulations')}
                className={`flex items-center gap-3 p-3.5 rounded border cursor-pointer transition-all ${
                  selectedType === 'congratulations'
                    ? 'bg-[#272822] border-[#66d9ef] text-white shadow-sm'
                    : 'bg-[#171815]/50 border-[#383830] text-[#75715e] hover:border-[#49483e] hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedType === 'congratulations'
                      ? 'border-[#66d9ef] bg-[#66d9ef]'
                      : 'border-[#49483e]'
                  }`}
                >
                  {selectedType === 'congratulations' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e1f1c]" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-xs text-white">Congratulations Page</span>
                  <span className="text-[10px] text-[#75715e] block">
                    Shows default NPM-Core landing page confirming the reverse proxy is online
                  </span>
                </div>
              </label>

              {/* Option 2: 404 Page */}
              <label
                onClick={() => setSelectedType('404')}
                className={`flex items-center gap-3 p-3.5 rounded border cursor-pointer transition-all ${
                  selectedType === '404'
                    ? 'bg-[#272822] border-[#66d9ef] text-white shadow-sm'
                    : 'bg-[#171815]/50 border-[#383830] text-[#75715e] hover:border-[#49483e] hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedType === '404'
                      ? 'border-[#66d9ef] bg-[#66d9ef]'
                      : 'border-[#49483e]'
                  }`}
                >
                  {selectedType === '404' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e1f1c]" />
                  )}
                </div>
                <div>
                  <span className="font-medium text-xs text-white">404 Page</span>
                  <span className="text-[10px] text-[#75715e] block">
                    Returns standard HTTP 404 Not Found error
                  </span>
                </div>
              </label>

              {/* Option 3: No Response (444) - Highlighted in user image */}
              <label
                onClick={() => setSelectedType('444')}
                className={`flex items-center gap-3 p-3.5 rounded border cursor-pointer transition-all ${
                  selectedType === '444'
                    ? 'bg-[#272822] border-[#00c875] text-white ring-1 ring-[#00c875]/30 shadow-md'
                    : 'bg-[#171815]/50 border-[#383830] text-[#75715e] hover:border-[#49483e] hover:text-white'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedType === '444'
                      ? 'border-[#00c875] bg-[#00c875]'
                      : 'border-[#49483e]'
                  }`}
                >
                  {selectedType === '444' && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#1e1f1c]" />
                  )}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-xs text-white flex items-center gap-1.5">
                      <span>No Response (444)</span>
                      <span className="text-[10px] bg-[#a6e22e]/10 text-[#a6e22e] px-1.5 py-0.2 rounded border border-[#a6e22e]/30">
                        Recommended Security
                      </span>
                    </span>
                    <span className="text-[10px] text-[#75715e] block">
                      Drops the TCP socket connection immediately without sending HTTP headers (protects against IP port scanners)
                    </span>
                  </div>
                  <ShieldAlert className="w-4 h-4 text-[#a6e22e] hidden sm:block opacity-60" />
                </div>
              </label>

              {/* Option 4: Redirect */}
              <label
                onClick={() => setSelectedType('redirect')}
                className={`flex flex-col p-3.5 rounded border cursor-pointer transition-all ${
                  selectedType === 'redirect'
                    ? 'bg-[#272822] border-[#66d9ef] text-white shadow-sm'
                    : 'bg-[#171815]/50 border-[#383830] text-[#75715e] hover:border-[#49483e] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === 'redirect'
                        ? 'border-[#66d9ef] bg-[#66d9ef]'
                        : 'border-[#49483e]'
                    }`}
                  >
                    {selectedType === 'redirect' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1e1f1c]" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-xs text-white">Redirect</span>
                    <span className="text-[10px] text-[#75715e] block">
                      Redirects the visitor to an external URL or main website
                    </span>
                  </div>
                </div>

                {selectedType === 'redirect' && (
                  <div className="mt-3 pl-7 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <select
                        value={redirectCode}
                        onChange={(e) => setRedirectCode(Number(e.target.value) as any)}
                        className="bg-[#171815] border border-[#383830] rounded px-2 py-1 text-white text-xs"
                      >
                        <option value={302}>302 Found (Temporary)</option>
                        <option value={301}>301 Moved (Permanent)</option>
                      </select>
                      <input
                        type="url"
                        required
                        value={redirectUrl}
                        onChange={(e) => setRedirectUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="flex-1 bg-[#141512] border border-[#383830] rounded px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#66d9ef]"
                      />
                    </div>
                  </div>
                )}
              </label>

              {/* Option 5: Custom HTML */}
              <label
                onClick={() => setSelectedType('custom_html')}
                className={`flex flex-col p-3.5 rounded border cursor-pointer transition-all ${
                  selectedType === 'custom_html'
                    ? 'bg-[#272822] border-[#66d9ef] text-white shadow-sm'
                    : 'bg-[#171815]/50 border-[#383830] text-[#75715e] hover:border-[#49483e] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === 'custom_html'
                        ? 'border-[#66d9ef] bg-[#66d9ef]'
                        : 'border-[#49483e]'
                    }`}
                  >
                    {selectedType === 'custom_html' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1e1f1c]" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-xs text-white">Custom HTML</span>
                    <span className="text-[10px] text-[#75715e] block">
                      Returns a custom HTML payload response
                    </span>
                  </div>
                </div>

                {selectedType === 'custom_html' && (
                  <div className="mt-3 pl-7" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      rows={4}
                      value={customHtml}
                      onChange={(e) => setCustomHtml(e.target.value)}
                      className="w-full bg-[#141512] border border-[#383830] rounded p-2 text-[#a6e22e] font-mono text-xs focus:outline-none focus:border-[#66d9ef]"
                    />
                  </div>
                )}
              </label>
            </div>

            {/* Bottom Save Bar */}
            <div className="pt-4 border-t border-[#383830] flex items-center justify-between">
              <span className="text-[10px] text-[#75715e]">
                Generates <code className="text-[#a6e22e]">/etc/nginx/conf.d/default.conf</code> with <code className="text-[#66d9ef]">server_name _;</code>
              </span>
              <button
                type="submit"
                className="px-6 py-2 rounded bg-[#00c875] hover:bg-[#00b066] text-[#1e1f1c] font-bold text-xs transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
