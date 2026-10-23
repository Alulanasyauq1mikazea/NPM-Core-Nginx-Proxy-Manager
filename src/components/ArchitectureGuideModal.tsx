import React, { useState } from 'react';
import {
  BookOpen,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  Code,
  Copy,
  Check,
  Server,
  ArrowRight,
} from 'lucide-react';
import { generateDockerCompose } from '../services/nginxGenerator';

interface ArchitectureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureGuideModal: React.FC<ArchitectureGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'backend_code' | 'docker' | 'security'>('blueprint');

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleBackendSnippet = `// server.js - Node.js Express Controller untuk Nginx Proxy Manager
const express = require('express');
const fs = require('fs/promises');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
app.use(express.json());

// 1. Template generator untuk Nginx .conf
function buildNginxConfig(domain, targetHost, targetPort, ssl = false) {
  return \`
upstream backend_\${domain.replace(/[^a-zA-Z0-9]/g, '_')} {
  server \${targetHost}:\${targetPort};
  keepalive 32;
}

server {
  listen 80;
  server_name \${domain};

  location /.well-known/acme-challenge/ {
    root /var/www/html;
  }

  location / {
    proxy_pass http://backend_\${domain.replace(/[^a-zA-Z0-9]/g, '_')};
    proxy_http_version 1.1;
    proxy_set_header Host \\$host;
    proxy_set_header X-Real-IP \\$remote_addr;
    proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
    proxy_set_header Upgrade \\$http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
\`;
}

// 2. Endpoint Tambah Proxy Host Baru
app.post('/api/hosts', async (req, res) => {
  const { domain, forwardHost, forwardPort } = req.body;
  const filePath = \`/etc/nginx/conf.d/\${domain}.conf\`;

  try {
    // A. Buat isi file konfigurasi Nginx
    const configContent = buildNginxConfig(domain, forwardHost, forwardPort);
    
    // B. Tulis ke direktori mount Nginx
    await fs.writeFile(filePath, configContent, 'utf-8');

    // C. Uji sintaks: nginx -t
    const testResult = await execPromise('docker exec nginx_engine nginx -t');

    // D. Jika valid, jalankan reload zero-downtime: nginx -s reload
    await execPromise('docker exec nginx_engine nginx -s reload');

    res.json({ success: true, message: 'Host berhasil ditambahkan & Nginx di-reload!' });
  } catch (error) {
    // Rollback jika sintaks gagal
    await fs.unlink(filePath).catch(() => {});
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Endpoint Otomatisasi SSL Let's Encrypt (Certbot)
app.post('/api/ssl/request', async (req, res) => {
  const { domain, email } = req.body;
  const cmd = \`certbot certonly --webroot -w /var/www/html -d \${domain} --email \${email} --agree-tos --non-interactive\`;

  try {
    const { stdout } = await execPromise(cmd);
    await execPromise('docker exec nginx_engine nginx -s reload');
    res.json({ success: true, log: stdout });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(3000, () => console.log('NPM Controller API running on port 3000'));`;

  const dockerComposeYaml = generateDockerCompose();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono text-xs">
      <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#383830] flex items-center justify-between bg-[#1e1f1c]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-[#f92672]" />
            <div>
              <h2 className="font-bold text-white text-sm">
                Panduan Arsitektur: Cara Membuat Nginx Proxy Manager Sendiri
              </h2>
              <span className="text-[10px] text-[#75715e]">
                Blueprint teknis: Frontend UI + Node.js API + Nginx Engine + Certbot
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#75715e] hover:text-white">
            ✕
          </button>
        </div>

        {/* Subtabs */}
        <div className="px-5 pt-2 border-b border-[#383830] flex items-center gap-2 bg-[#1e1f1c]">
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'blueprint'
                ? 'border-[#a6e22e] text-[#a6e22e]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            1. Konsep & Arsitektur
          </button>
          <button
            onClick={() => setActiveTab('backend_code')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'backend_code'
                ? 'border-[#66d9ef] text-[#66d9ef]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            2. Kode Backend Node.js
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'docker'
                ? 'border-[#fd971f] text-[#fd971f]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            3. Docker Compose Setup
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-3 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'security'
                ? 'border-[#ae81ff] text-[#ae81ff]'
                : 'border-transparent text-[#75715e] hover:text-white'
            }`}
          >
            4. Keamanan & Zero-Downtime
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-white leading-relaxed">
          {/* TAB 1: BLUEPRINT */}
          {activeTab === 'blueprint' && (
            <div className="space-y-4">
              <div className="bg-[#1e1f1c] border border-[#3e3d32] rounded p-4">
                <h3 className="text-sm font-bold text-[#a6e22e] mb-2">
                  Jawaban: Sangat Bisa Dibuat Sendiri!
                </h3>
                <p className="text-xs text-[#f8f8f2]/90 mb-3">
                  Aplikasi seperti <strong className="text-[#66d9ef]">Nginx Proxy Manager (NPM / NPMPlus)</strong> pada dasarnya adalah 
                  sebuah <em>Control Plane</em> (Web UI + REST API) yang bertugas mengelola file teks konfigurasi Nginx dan mengirim sinyal reload ke Nginx daemon.
                </p>

                {/* Architecture Diagram */}
                <div className="p-3 bg-[#272822] border border-[#383830] rounded font-mono text-[11px] text-[#f8f8f2] space-y-2">
                  <div className="text-[#fd971f] font-bold">Diagram Alur Kerja (Control Plane + Data Plane):</div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="p-1.5 bg-[#1e1f1c] border border-[#a6e22e] text-[#a6e22e] rounded">
                      [1] Web UI (React)
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#75715e]" />
                    <span className="p-1.5 bg-[#1e1f1c] border border-[#66d9ef] text-[#66d9ef] rounded">
                      [2] Express Backend API
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#75715e]" />
                    <span className="p-1.5 bg-[#1e1f1c] border border-[#e6db74] text-[#e6db74] rounded">
                      [3] /etc/nginx/conf.d/*.conf
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#75715e]" />
                    <span className="p-1.5 bg-[#1e1f1c] border border-[#f92672] text-[#f92672] rounded">
                      [4] Nginx Master (SIGHUP)
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Main Components */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded">
                  <div className="text-[#a6e22e] font-bold mb-1 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" />
                    <span>A. Engine Nginx</span>
                  </div>
                  <p className="text-[11px] text-[#75715e]">
                    Menjalankan image <code className="text-[#66d9ef]">nginx:alpine</code>. Mendengarkan port 80 & 443. File konfigurasi dimasukkan lewat shared volume.
                  </p>
                </div>

                <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded">
                  <div className="text-[#66d9ef] font-bold mb-1 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>B. Backend API</span>
                  </div>
                  <p className="text-[11px] text-[#75715e]">
                    Node.js / Express untuk login JWT, menyimpan daftar host di database (SQLite / JSON), menulis file .conf, dan mengeksekusi <code className="text-[#e6db74]">nginx -s reload</code>.
                  </p>
                </div>

                <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded">
                  <div className="text-[#fd971f] font-bold mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>C. Certbot SSL</span>
                  </div>
                  <p className="text-[11px] text-[#75715e]">
                    Mengurus challenge ACME Let's Encrypt secara otomatis di background, menyimpan cert ke <code className="text-[#66d9ef]">/etc/letsencrypt/live/</code>.
                  </p>
                </div>
              </div>

              {/* Database Role Card */}
              <div className="bg-[#1e1f1c] border border-[#e6db74]/40 p-4 rounded space-y-2">
                <div className="flex items-center gap-2 text-[#e6db74] font-bold text-xs">
                  <span>Apakah Sistem Seperti Ini Perlu Menggunakan Database?</span>
                </div>
                <div className="text-[11px] text-[#f8f8f2]/90 leading-relaxed space-y-1.5">
                  <p>
                    <strong>YA, tapi tidak harus database berat seperti MySQL/PostgreSQL. Cukup SQLite!</strong>
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[#75715e]">
                    <li>
                      <strong className="text-white">Nginx Engine</strong> sendiri <span className="text-[#f92672]">TIDAK punya database</span> dan hanya membaca file teks <code className="text-[#a6e22e]">.conf</code>.
                    </li>
                    <li>
                      Namun <strong className="text-white">Aplikasi Controller (Web UI & Backend)</strong> memerlukan database untuk:
                      <ul className="list-circle pl-4 text-[10px] mt-0.5 space-y-0.5">
                        <li>Menyimpan akun login admin & hashing password (bcrypt/JWT).</li>
                        <li>Menyimpan metadata host (tanggal dibuat, deskripsi, toggle enable/disable tanpa hapus config).</li>
                        <li>Melacak tanggal kadaluarsa sertifikat SSL & jadwal auto-renew.</li>
                        <li>Memudahkan query data saat membuka dasbor daripada harus mem-parsing ulang puluhan file .conf.</li>
                      </ul>
                    </li>
                    <li>
                      <strong className="text-[#66d9ef]">Kenapa SQLite?</strong> SQLite hanya berbentuk 1 file tunggal (<code className="text-white">data/database.sqlite</code>), sangat cepat, konsumsi RAM &lt; 10 MB, dan tidak perlu install MySQL server terpisah.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BACKEND CODE */}
          {activeTab === 'backend_code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#66d9ef] font-bold">
                  Contoh Implementasi Backend Node.js (Express Controller):
                </span>
                <button
                  onClick={() => copyToClipboard(sampleBackendSnippet, 'backend')}
                  className="px-2.5 py-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#a6e22e] border border-[#3e3d32] flex items-center gap-1.5"
                >
                  {copiedCode === 'backend' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'backend' ? 'Tersalin!' : 'Salin Kode'}</span>
                </button>
              </div>

              <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded overflow-x-auto max-h-96">
                <pre className="text-[#f8f8f2] text-[11px] leading-relaxed">
                  {sampleBackendSnippet}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: DOCKER COMPOSE */}
          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[#fd971f] font-bold">
                  File docker-compose.yml Lengkap Siap Jalankan:
                </span>
                <button
                  onClick={() => copyToClipboard(dockerComposeYaml, 'docker')}
                  className="px-2.5 py-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#a6e22e] border border-[#3e3d32] flex items-center gap-1.5"
                >
                  {copiedCode === 'docker' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'docker' ? 'Tersalin!' : 'Salin Docker Compose'}</span>
                </button>
              </div>

              <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded overflow-x-auto max-h-96">
                <pre className="text-[#f8f8f2] text-[11px] leading-relaxed">
                  {dockerComposeYaml}
                </pre>
              </div>

              <div className="text-[11px] text-[#75715e] bg-[#1e1f1c] p-3 rounded border border-[#383830]">
                Cukup letakkan file ini bersama folder backend Anda dan jalankan <code className="text-[#a6e22e]">docker compose up -d</code>.
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="text-[#ae81ff] font-bold text-sm">
                Praktik Terbaik & Keamanan Produksi:
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-[#1e1f1c] border border-[#383830] rounded">
                  <div className="text-[#a6e22e] font-bold text-xs mb-1">
                    1. Atomic Config Writing & Verifikasi Sebelum Reload
                  </div>
                  <p className="text-[11px] text-[#75715e]">
                    Jangan langsung menulis file final jika sintaksnya belum teruji. Tulis ke <code className="text-white">.tmp</code>, jalankan <code className="text-[#66d9ef]">nginx -t</code>. Jika sukses, rename (atomic move) ke <code className="text-white">.conf</code> lalu jalankan reload. Ini mencegah Nginx mati karena kesalahan ketik domain/port.
                  </p>
                </div>

                <div className="p-3 bg-[#1e1f1c] border border-[#383830] rounded">
                  <div className="text-[#66d9ef] font-bold text-xs mb-1">
                    2. Zero-Downtime Reload via SIGHUP
                  </div>
                  <p className="text-[11px] text-[#75715e]">
                    Perintah <code className="text-[#a6e22e]">nginx -s reload</code> (atau kirim sinyal SIGHUP ke PID master) memulai worker baru dengan konfigurasi baru sambil membiarkan worker lama menyelesaikan koneksi aktif pengguna sampai selesai. Tidak ada koneksi yang drop!
                  </p>
                </div>

                <div className="p-3 bg-[#1e1f1c] border border-[#383830] rounded">
                  <div className="text-[#f92672] font-bold text-xs mb-1">
                    3. Sanitasi Input Domain & Parameter
                  </div>
                  <p className="text-[11px] text-[#75715e]">
                    Pastikan karakter di domain names disaring ketat (hanya alfanumerik, titik, dan strip) untuk mencegah <em>Nginx Config Injection</em> (misal memasukkan karakter <code className="text-white">;</code> atau directive berbahaya).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#383830] bg-[#1e1f1c] flex items-center justify-between">
          <span className="text-[10px] text-[#75715e]">
            Aplikasi NPM-Core ini menerapkan 100% arsitektur di atas secara interaktif
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#a6e22e] text-[#1e1f1c] font-bold hover:bg-[#92cc26]"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
};
