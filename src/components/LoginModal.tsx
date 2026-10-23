import React, { useState } from 'react';
import { Lock, User, Key, ShieldCheck, Check } from 'lucide-react';
import { AdminUser } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('admin@proxymanager.local');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      if (email.trim() && password.length >= 6) {
        const user: AdminUser = {
          id: 'usr_admin_01',
          name: email.split('@')[0].toUpperCase(),
          email: email.trim(),
          role: 'superadmin',
          token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: email, iat: Date.now() }))}.signature_token_npm_core`,
          expiresAt: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
        };

        onLoginSuccess(user);
        setLoading(false);
        onClose();
      } else {
        setErrorMsg('Invalid credentials. Password must be at least 6 characters.');
        setLoading(false);
      }
    }, 400);
  };

  const handleQuickLogin = () => {
    setEmail('admin@proxymanager.local');
    setPassword('admin123');
    const user: AdminUser = {
      id: 'usr_admin_01',
      name: 'SUPERADMIN',
      email: 'admin@proxymanager.local',
      role: 'superadmin',
      token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify({ sub: 'admin@proxymanager.local', iat: Date.now() }))}.signature_token_npm_core`,
      expiresAt: new Date(Date.now() + 86400 * 1000 * 7).toISOString(),
    };
    onLoginSuccess(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono text-xs">
      <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-sm shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#383830]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#a6e22e]" />
            <h3 className="font-bold text-white text-sm">
              Admin JWT Authentication
            </h3>
          </div>
          <button onClick={onClose} className="text-[#75715e] hover:text-white">
            ✕
          </button>
        </div>

        {/* Demo credentials hint box */}
        <div className="bg-[#1e1f1c] border border-[#3e3d32] p-2.5 rounded text-[11px] space-y-1">
          <div className="text-[#66d9ef] font-semibold flex items-center justify-between">
            <span>Preconfigured Admin Account:</span>
            <button
              type="button"
              onClick={handleQuickLogin}
              className="text-[#a6e22e] underline hover:no-underline font-bold"
            >
              1-Click Demo Login
            </button>
          </div>
          <div className="text-[#75715e]">
            Email: <span className="text-white">admin@proxymanager.local</span>
          </div>
          <div className="text-[#75715e]">
            Password: <span className="text-white">admin123</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2 rounded bg-[#f92672]/20 border border-[#f92672]/40 text-[#f92672] text-[11px]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[#75715e] mb-1">Email Address:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
            />
          </div>

          <div>
            <label className="block text-[#75715e] mb-1">Password:</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#1e1f1c] text-[#75715e] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded bg-[#a6e22e] font-semibold text-[#1e1f1c] hover:bg-[#92cc26] transition-colors"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
