import React, { useState } from 'react';
import {
  Server,
  Lock,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Terminal,
} from 'lucide-react';
import { AdminUser } from '../types';

interface AdminLoginViewProps {
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@proxymanager.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // Validate credentials
      if (!email.trim()) {
        setErrorMsg('Email address is required.');
        setIsLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        setIsLoading(false);
        return;
      }

      // Successful JWT generation
      const displayName =
        email.toLowerCase() === 'admin@proxymanager.local'
          ? 'DevOps Administrator'
          : email.split('@')[0].toUpperCase();

      const user: AdminUser = {
        id: `usr_${Date.now()}`,
        name: displayName,
        email: email.trim(),
        role: 'superadmin',
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
          JSON.stringify({
            sub: email.trim(),
            role: 'superadmin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400 * 7,
          })
        )}.npm_core_signed_key_2026`,
        expiresAt: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
      };

      setIsLoading(false);
      onLoginSuccess(user);
    }, 450);
  };

  const handleDemoLogin = () => {
    setEmail('admin@proxymanager.local');
    setPassword('admin123');
    setIsLoading(true);
    setTimeout(() => {
      const user: AdminUser = {
        id: 'usr_admin_01',
        name: 'DevOps Administrator',
        email: 'admin@proxymanager.local',
        role: 'superadmin',
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
          JSON.stringify({
            sub: 'admin@proxymanager.local',
            role: 'superadmin',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 86400 * 7,
          })
        )}.npm_core_signed_key_2026`,
        expiresAt: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
      };
      setIsLoading(false);
      onLoginSuccess(user);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#141512] flex items-center justify-center p-4 font-mono text-xs select-none">
      <div className="w-full max-w-md bg-[#1e1f1c] border border-[#3e3d32] rounded shadow-2xl overflow-hidden flex flex-col">
        {/* Top Terminal Title Bar */}
        <div className="px-5 py-3.5 bg-[#272822] border-b border-[#383830] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#1e1f1c] border border-[#49483e] flex items-center justify-center text-[#a6e22e]">
              <Server className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white tracking-wide">
              NPM<span className="text-[#a6e22e]">-Core</span> Control Plane
            </span>
          </div>
          <span className="text-[10px] uppercase text-[#75715e] border border-[#3e3d32] px-2 py-0.5 rounded bg-[#1e1f1c]">
            SECURE ACCESS
          </span>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h1 className="text-base font-bold text-white">
              Administrator Authentication
            </h1>
            <p className="text-[11px] text-[#75715e] mt-1">
              Sign in with your administrator credentials to manage Nginx reverse proxy routes, SSL certificates, and firewall policies.
            </p>
          </div>

          {/* Quick 1-Click Demo Login Banner */}
          <div className="bg-[#272822] border border-[#49483e] rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#66d9ef] font-semibold text-[11px]">
                Akun Admin Default:
              </span>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="px-2 py-1 rounded bg-[#a6e22e] text-[#1e1f1c] text-[10px] font-bold hover:bg-[#92cc26] transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>1-Click Login</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[11px] text-[#75715e] font-mono space-y-0.5">
              <div>Email: <span className="text-white">admin@proxymanager.local</span></div>
              <div>Password: <span className="text-white">admin123</span></div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-[#f92672]/15 border border-[#f92672]/40 rounded text-[#f92672] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[#75715e] mb-1 font-semibold">
                Email Address:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@proxymanager.local"
                disabled={isLoading}
                className="w-full bg-[#141512] border border-[#383830] rounded p-2.5 text-white placeholder-[#75715e] focus:outline-none focus:border-[#a6e22e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[#75715e] mb-1 font-semibold">
                Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full bg-[#141512] border border-[#383830] rounded p-2.5 pr-10 text-white placeholder-[#75715e] focus:outline-none focus:border-[#a6e22e] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75715e] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded bg-[#a6e22e] hover:bg-[#92cc26] text-[#1e1f1c] font-bold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#1e1f1c] border-t-transparent rounded-full animate-spin" />
                  <span>Verifying JWT Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sign In as Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Security badge footer */}
          <div className="pt-3 border-t border-[#383830] text-[10px] text-[#75715e] flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[#a6e22e]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>JWT Bearer Security Active</span>
            </span>
            <span>Nginx Engine v1.27</span>
          </div>
        </div>
      </div>
    </div>
  );
};
