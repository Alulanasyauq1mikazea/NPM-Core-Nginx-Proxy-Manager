import React, { useState } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
} from 'lucide-react';
import {
  ProxyHost,
  RedirectionHost,
  DeadHost,
  StreamHost,
  AccessList,
  SslCertificate,
  DefaultSiteConfig,
} from '../types';
import {
  generateProxyHostConfig,
  generateRedirectionHostConfig,
  generateDeadHostConfig,
  generateStreamConfig,
  generateHtpasswd,
  generateMasterNginxConf,
  generateDockerCompose,
  generateDefaultSiteConfig,
  validateNginxSyntax,
} from '../services/nginxGenerator';

import { generateSqlDump, INITIAL_AUDIT_LOGS } from '../services/sqliteDb';

interface ConfigInspectorViewProps {
  proxyHosts: ProxyHost[];
  redirections: RedirectionHost[];
  deadHosts: DeadHost[];
  streams: StreamHost[];
  accessLists: AccessList[];
  certificates: SslCertificate[];
  defaultSiteConfig?: DefaultSiteConfig;
  initialSelectedPath?: string | null;
  onTriggerReload: () => void;
}

export const ConfigInspectorView: React.FC<ConfigInspectorViewProps> = ({
  proxyHosts,
  redirections,
  deadHosts,
  streams,
  accessLists,
  certificates,
  defaultSiteConfig,
  initialSelectedPath,
  onTriggerReload,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate all files in memory
  const masterConf = generateMasterNginxConf();
  const composeYaml = generateDockerCompose();
  const sqliteDump = generateSqlDump(
    proxyHosts,
    redirections,
    streams,
    deadHosts,
    accessLists,
    certificates,
    null,
    INITIAL_AUDIT_LOGS
  );

  const fileMap: { [path: string]: { content: string; type: string } } = {
    '/etc/nginx/nginx.conf': { content: masterConf, type: 'master' },
    'docker-compose.yml': { content: composeYaml, type: 'docker' },
    'data/schema.sql': { content: sqliteDump, type: 'sql' },
  };

  if (defaultSiteConfig) {
    fileMap['/etc/nginx/conf.d/default.conf'] = {
      content: generateDefaultSiteConfig(defaultSiteConfig),
      type: 'default_site',
    };
  }

  // Add proxy host files
  for (const host of proxyHosts) {
    const cert = certificates.find((c) => c.id === host.certificateId);
    const acl = accessLists.find((a) => a.id === host.accessListId);
    const path = `/etc/nginx/conf.d/${host.domainNames[0]}.conf`;
    fileMap[path] = {
      content: generateProxyHostConfig(host, cert, acl),
      type: 'proxy',
    };
  }

  // Add redirection host files
  for (const redir of redirections) {
    const cert = certificates.find((c) => c.id === redir.certificateId);
    const path = `/etc/nginx/conf.d/redir_${redir.domainNames[0]}.conf`;
    fileMap[path] = {
      content: generateRedirectionHostConfig(redir, cert),
      type: 'redirection',
    };
  }

  // Add dead host files
  for (const dead of deadHosts) {
    const cert = certificates.find((c) => c.id === dead.certificateId);
    const path = `/etc/nginx/conf.d/dead_${dead.domainNames[0]}.conf`;
    fileMap[path] = {
      content: generateDeadHostConfig(dead, cert),
      type: 'dead',
    };
  }

  // Add stream files
  for (const stream of streams) {
    const path = `/etc/nginx/streams/stream_${stream.incomingPort}.conf`;
    fileMap[path] = {
      content: generateStreamConfig(stream),
      type: 'stream',
    };
  }

  // Add htpasswd files
  for (const acl of accessLists) {
    const path = `/etc/nginx/htpasswd/list_${acl.id}`;
    fileMap[path] = {
      content: generateHtpasswd(acl),
      type: 'auth',
    };
  }

  const filePaths = Object.keys(fileMap);
  const [selectedPath, setSelectedPath] = useState<string>(() => {
    if (initialSelectedPath && fileMap[initialSelectedPath]) {
      return initialSelectedPath;
    }
    return filePaths[2] || filePaths[0];
  });

  // Sync if initialSelectedPath changes
  React.useEffect(() => {
    if (initialSelectedPath && fileMap[initialSelectedPath]) {
      setSelectedPath(initialSelectedPath);
    }
  }, [initialSelectedPath]);

  const activeContent = fileMap[selectedPath]?.content || '';
  const syntaxCheck = validateNginxSyntax(activeContent);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedPath.split('/').pop() || 'config.conf';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 font-mono text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#e6db74]">CONFIG_INSPECTOR</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-1">
            Nginx Configuration Files & Syntax Linter
          </h1>
          <p className="text-xs text-[#75715e] mt-0.5">
            Inspect real, syntactically correct Nginx .conf files generated from your dashboard state
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded bg-[#272822] hover:bg-[#383830] text-white border border-[#3e3d32] transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#a6e22e]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy File'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded bg-[#272822] hover:bg-[#383830] text-[#fd971f] border border-[#3e3d32] transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: File Tree Selector */}
        <div className="lg:col-span-4 bg-[#272822] border border-[#3e3d32] rounded p-3 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold pb-2 border-b border-[#383830]">
            <FolderTree className="w-4 h-4 text-[#66d9ef]" />
            <span>VFS /etc/nginx/</span>
          </div>

          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filePaths.map((path) => {
              const isSelected = selectedPath === path;
              const fileType = fileMap[path].type;

              let typeColor = '#66d9ef';
              if (fileType === 'master') typeColor = '#ae81ff';
              if (fileType === 'docker') typeColor = '#fd971f';
              if (fileType === 'sql') typeColor = '#e6db74';
              if (fileType === 'stream') typeColor = '#a6e22e';
              if (fileType === 'redirection') typeColor = '#fd971f';

              return (
                <button
                  key={path}
                  onClick={() => setSelectedPath(path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#1e1f1c] text-white border-l-2 border-[#a6e22e]'
                      : 'text-[#75715e] hover:bg-[#1e1f1c]/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className="w-3.5 h-3.5 shrink-0" style={{ color: typeColor }} />
                    <span className="truncate">{path}</span>
                  </div>
                  <span className="text-[10px] text-[#75715e] uppercase">
                    {fileType}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Editor & Syntax Linter */}
        <div className="lg:col-span-8 bg-[#1e1f1c] border border-[#383830] rounded flex flex-col overflow-hidden">
          {/* File bar */}
          <div className="px-4 py-2 bg-[#272822] border-b border-[#383830] flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold">
              <span>{selectedPath}</span>
            </div>

            <div className="flex items-center gap-2">
              {syntaxCheck.valid ? (
                <span className="flex items-center gap-1 text-[#a6e22e] text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>nginx -t OK</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#f92672] text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Syntax Error ({syntaxCheck.errors.length})</span>
                </span>
              )}
            </div>
          </div>

          {/* Code Viewer with Monokai styling */}
          <div className="p-4 overflow-x-auto flex-1 max-h-[500px] overflow-y-auto font-mono text-xs leading-relaxed selection:bg-[#f92672] selection:text-white">
            <pre className="text-[#f8f8f2] whitespace-pre">
              {activeContent.split('\n').map((line, idx) => {
                const lineNum = (idx + 1).toString().padStart(3, ' ');
                const isComment = line.trim().startsWith('#');
                const isDirective = line.includes('listen') || line.includes('server_name') || line.includes('proxy_pass') || line.includes('location');

                return (
                  <div key={idx} className="hover:bg-[#272822] px-1 py-0.5 rounded flex">
                    <span className="text-[#75715e] select-none pr-3 w-10 shrink-0 text-right">
                      {lineNum}
                    </span>
                    <span
                      className={
                        isComment
                          ? 'text-[#75715e] italic'
                          : isDirective
                          ? 'text-[#66d9ef]'
                          : 'text-[#f8f8f2]'
                      }
                    >
                      {line}
                    </span>
                  </div>
                );
              })}
            </pre>
          </div>

          {/* Syntax check footer */}
          <div className="p-3 bg-[#272822] border-t border-[#383830] text-[11px]">
            {syntaxCheck.valid ? (
              <div className="text-[#a6e22e] flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                <span>nginx: configuration syntax is valid and ready for 'nginx -s reload'</span>
              </div>
            ) : (
              <div className="text-[#f92672] space-y-1">
                {syntaxCheck.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
