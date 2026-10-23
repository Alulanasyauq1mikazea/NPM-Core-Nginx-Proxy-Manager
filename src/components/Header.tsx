import React from 'react';
import {
  Server,
  Terminal,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  User,
  LogOut,
  Download,
} from 'lucide-react';
import { AdminUser, NginxServerState } from '../types';

interface HeaderProps {
  serverState: NginxServerState;
  adminUser: AdminUser | null;
  onReloadNginx: () => void;
  onTestSyntax: () => void;
  onOpenArchitectureGuide: () => void;
  onOpenLocalDeploy: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onExportBundle: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  serverState,
  adminUser,
  onReloadNginx,
  onTestSyntax,
  onOpenArchitectureGuide,
  onOpenLocalDeploy,
  onOpenLoginModal,
  onLogout,
  onExportBundle,
}) => {
  return (
    <header className="h-14 border-b border-[#383830] bg-[#1e1f1c] px-4 flex items-center justify-between gap-4 sticky top-0 z-30 select-none">
      {/* Zone 1: Brand Wordmark & Engine Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#272822] border border-[#49483e] flex items-center justify-center text-[#a6e22e] shadow-sm">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white font-mono text-sm">
                NPM<span className="text-[#a6e22e]">-Core</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#272822] text-[#66d9ef] border border-[#3e3d32]">
                v1.27 Nginx Engine
              </span>
            </div>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#75715e] border-l border-[#383830] pl-3">
          {serverState.isReloading ? (
            <span className="flex items-center gap-1.5 text-[#e6db74]">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Reloading Nginx...</span>
            </span>
          ) : serverState.syntaxStatus === 'valid' ? (
            <span className="flex items-center gap-1.5 text-[#a6e22e]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PID {serverState.pid} · Online</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#f92672]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Syntax Warning</span>
            </span>
          )}
        </div>
      </div>

      {/* Zone 2 & 3: Management Actions */}
      <div className="flex items-center gap-2">
        {/* Test syntax button */}
        <button
          onClick={onTestSyntax}
          title="Run 'nginx -t' to verify all configuration files"
          className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32] transition-colors flex items-center gap-1.5"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">nginx -t</span>
        </button>

        {/* Reload button */}
        <button
          onClick={onReloadNginx}
          disabled={serverState.isReloading}
          title="Run 'nginx -s reload' to apply changes with zero downtime"
          className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#383830] text-[#a6e22e] border border-[#3e3d32] transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${serverState.isReloading ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">nginx -s reload</span>
        </button>

        {/* Export bundle button */}
        <button
          onClick={onExportBundle}
          title="Download Nginx config files and docker-compose.yml"
          className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#383830] text-[#fd971f] border border-[#3e3d32] transition-colors flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Export Bundle</span>
        </button>

        {/* Architecture & Build-It-Yourself Guide */}
        <button
          onClick={onOpenArchitectureGuide}
          className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#f92672]/15 hover:bg-[#f92672]/25 text-[#f92672] border border-[#f92672]/40 transition-colors flex items-center gap-1.5"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cara Buat Sendiri</span>
        </button>

        {/* Local Server Deployment Guide Button */}
        <button
          onClick={onOpenLocalDeploy}
          className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#a6e22e]/15 hover:bg-[#a6e22e]/25 text-[#a6e22e] border border-[#a6e22e]/40 transition-colors flex items-center gap-1.5 font-semibold"
        >
          <Server className="w-3.5 h-3.5" />
          <span>Deploy Lokal</span>
        </button>

        {/* Admin profile / login */}
        {adminUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-[#383830]">
            <div className="hidden lg:block text-right">
              <div className="text-xs font-mono text-white leading-tight">{adminUser.name}</div>
              <div className="text-[10px] font-mono text-[#a6e22e] leading-tight">JWT Active</div>
            </div>
            <button
              onClick={onLogout}
              title="Keluar dari akun administrator"
              className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#f92672]/20 text-[#75715e] hover:text-[#f92672] border border-[#3e3d32] hover:border-[#f92672]/40 transition-colors flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#f92672]" />
              <span className="hidden sm:inline text-white">Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="px-3 py-1.5 rounded text-xs font-mono bg-[#a6e22e] text-[#1e1f1c] font-semibold hover:bg-[#92cc26] transition-colors flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Admin Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
