import React from 'react';
import {
  Activity,
  Globe,
  Share2,
  Cpu,
  FileQuestion,
  ShieldCheck,
  Lock,
  FileCode,
  Terminal,
  Database,
  Settings,
} from 'lucide-react';
import { NginxLogEntry } from '../types';

export type NavTab =
  | 'dashboard'
  | 'proxy_hosts'
  | 'redirections'
  | 'streams'
  | 'dead_hosts'
  | 'access_lists'
  | 'certificates'
  | 'inspector'
  | 'database'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: {
    proxyHosts: number;
    redirections: number;
    streams: number;
    deadHosts: number;
    accessLists: number;
    certificates: number;
  };
  logs: NginxLogEntry[];
  isLogDrawerOpen: boolean;
  onToggleLogDrawer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  logs,
  isLogDrawerOpen,
  onToggleLogDrawer,
}) => {
  const errorCount = logs.filter((l) => l.level === 'ERROR' || l.status >= 500).length;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Telemetry Monitor',
      subtitle: 'Grafana-style metrics',
      icon: Activity,
      color: '#a6e22e',
      count: null,
    },
    {
      id: 'proxy_hosts' as NavTab,
      label: 'Proxy Hosts',
      subtitle: 'Reverse proxy HTTP/S',
      icon: Globe,
      color: '#66d9ef',
      count: counts.proxyHosts,
    },
    {
      id: 'redirections' as NavTab,
      label: 'Redirection Hosts',
      subtitle: '301 / 302 redirects',
      icon: Share2,
      color: '#fd971f',
      count: counts.redirections,
    },
    {
      id: 'streams' as NavTab,
      label: 'Streams (TCP/UDP)',
      subtitle: 'Layer 4 proxying',
      icon: Cpu,
      color: '#ae81ff',
      count: counts.streams,
    },
    {
      id: 'dead_hosts' as NavTab,
      label: '404 Dead Hosts',
      subtitle: 'Deprecations & stubs',
      icon: FileQuestion,
      color: '#75715e',
      count: counts.deadHosts,
    },
    {
      id: 'access_lists' as NavTab,
      label: 'Access Lists',
      subtitle: 'IP whitelist & Basic auth',
      icon: ShieldCheck,
      color: '#a6e22e',
      count: counts.accessLists,
    },
    {
      id: 'certificates' as NavTab,
      label: 'SSL Certificates',
      subtitle: "Let's Encrypt & Custom",
      icon: Lock,
      color: '#f92672',
      count: counts.certificates,
    },
    {
      id: 'inspector' as NavTab,
      label: 'Config Inspector',
      subtitle: 'Generated .conf files',
      icon: FileCode,
      color: '#e6db74',
      count: null,
    },
    {
      id: 'database' as NavTab,
      label: 'Database (SQLite)',
      subtitle: 'data/database.sqlite',
      icon: Database,
      color: '#a6e22e',
      count: 7,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      subtitle: 'Default site & catch-all',
      icon: Settings,
      color: '#00c875',
      count: null,
    },
  ];

  return (
    <aside className="w-64 border-r border-[#383830] bg-[#1e1f1c] flex flex-col shrink-0 select-none">
      {/* Workspace section header */}
      <div className="p-3 border-b border-[#2d2e27]">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#75715e]">
          Engine Workspace
        </div>
      </div>

      {/* Nav list */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center justify-between group ${
                isActive
                  ? 'bg-[#272822] text-white border-l-2 border-[#a6e22e]'
                  : 'text-[#f8f8f2]/70 hover:bg-[#272822]/50 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
                  style={{ color: item.color }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate leading-tight">
                    {item.label}
                  </div>
                  <div className="text-[10px] text-[#75715e] truncate font-mono">
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.count !== null && (
                <span className="text-[11px] font-mono tabular-nums text-[#75715e] group-hover:text-white">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Log Drawer Toggle at Bottom */}
      <div className="p-3 border-t border-[#383830] bg-[#171815]">
        <button
          onClick={onToggleLogDrawer}
          className={`w-full px-3 py-2.5 rounded font-mono text-xs flex items-center justify-between border transition-all ${
            isLogDrawerOpen
              ? 'bg-[#272822] border-[#a6e22e]/50 text-[#a6e22e]'
              : 'bg-[#1e1f1c] border-[#383830] text-[#75715e] hover:text-[#f8f8f2]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#66d9ef]" />
            <span>Live Log Stream</span>
          </div>

          <div className="flex items-center gap-1.5">
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#f92672]/20 text-[#f92672]">
                {errorCount} err
              </span>
            )}
            <span className="text-[10px] text-[#75715e]">
              {logs.length}
            </span>
          </div>
        </button>
      </div>
    </aside>
  );
};
