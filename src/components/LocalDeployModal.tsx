import React, { useState } from 'react';
import {
  Server,
  Terminal,
  Copy,
  Check,
  Download,
  Folder,
  Layers,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

interface LocalDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalDeployModal: React.FC<LocalDeployModalProps> = ({ isOpen, onClose }) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scriptSetupBash = `#!/bin/bash
# ------------------------------------------------------------
# Quick Setup Script untuk NPM-Core di Server Lokal / VPS
# ------------------------------------------------------------
set -e

echo "=== [1/4] Membuat struktur folder ==="
mkdir -p npm-local/data/{conf.d,streams,htpasswd,letsencrypt,html}
mkdir -p npm-local/logs
cd npm-local

echo "=== [2/4] Menyiapkan nginx.conf master ==="
cat << 'EOF' > data/nginx.conf
user nginx;
worker_processes auto;
pid /var/run/nginx.pid;
error_log /var/log/nginx/error.log warn;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;
  sendfile on;
  keepalive_timeout 65;
  include /etc/nginx/conf.d/*.conf;
}

stream {
  include /etc/nginx/streams/*.conf;
}
EOF

echo "=== [3/4] Menyiapkan docker-compose.yml ==="
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  # 1. Nginx Reverse Proxy Engine
  nginx:
    image: nginx:alpine
    container_name: npm_nginx_engine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./data/conf.d:/etc/nginx/conf.d:ro
      - ./data/streams:/etc/nginx/streams:ro
      - ./data/htpasswd:/etc/nginx/htpasswd:ro
      - ./data/letsencrypt:/etc/letsencrypt
      - ./data/html:/var/www/html
      - ./logs:/var/log/nginx
    networks:
      - npm_net

  # 2. Certbot Let's Encrypt (Opsional jika domain publik)
  certbot:
    image: certbot/certbot
    container_name: npm_certbot
    restart: unless-stopped
    volumes:
      - ./data/letsencrypt:/etc/letsencrypt
      - ./data/html:/var/www/html
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"
    networks:
      - npm_net

networks:
  npm_net:
    driver: bridge
EOF

echo "=== [4/4] Menjalankan Container Nginx ==="
docker compose up -d

echo ""
echo "SELAMAT! Nginx Engine telah aktif di server lokal Anda."
echo "Port 80 & 443 sekarang siap menerima proxy host dari NPM-Core!"
`;

  const dockerComposeContent = `version: '3.8'

services:
  # 1. Reverse Proxy Engine
  nginx:
    image: nginx:alpine
    container_name: npm_nginx_engine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./data/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./data/conf.d:/etc/nginx/conf.d:ro
      - ./data/streams:/etc/nginx/streams:ro
      - ./data/htpasswd:/etc/nginx/htpasswd:ro
      - ./data/letsencrypt:/etc/letsencrypt
      - ./data/html:/var/www/html
      - ./logs:/var/log/nginx
    networks:
      - npm_net

networks:
  npm_net:
    driver: bridge`;

  const downloadSetupScript = () => {
    const blob = new Blob([scriptSetupBash], { type: 'text/x-sh' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup-npm-local.sh';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono text-xs">
      <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-[#383830] flex items-center justify-between bg-[#1e1f1c]">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-[#a6e22e]" />
            <div>
              <h2 className="font-bold text-white text-sm">
                Panduan Menerapkan di Server Lokal / VPS
              </h2>
              <span className="text-[10px] text-[#75715e]">
                Tutorial langkah demi langkah menjalankan Nginx Reverse Proxy di mesin lokal Anda
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#75715e] hover:text-white">
            ✕
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="px-5 py-2.5 bg-[#171815] border-b border-[#383830] flex items-center justify-between gap-2 overflow-x-auto">
          {[
            { step: 1, label: '1. Persyaratan' },
            { step: 2, label: '2. Setup Folder & Docker' },
            { step: 3, label: '3. Ekspor Config dari Web' },
            { step: 4, label: '4. Testing Domain Lokal' },
            { step: 5, label: '5. Setup MikroTik & NAT' },
          ].map((s) => (
            <button
              key={s.step}
              onClick={() => setActiveStep(s.step as any)}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeStep === s.step
                  ? 'bg-[#272822] text-[#a6e22e] border border-[#a6e22e]/40 font-bold'
                  : 'text-[#75715e] hover:text-white'
              }`}
            >
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-white leading-relaxed">
          {/* STEP 1: Persyaratan */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="bg-[#1e1f1c] border border-[#3e3d32] p-4 rounded space-y-3">
                <h3 className="text-sm font-bold text-[#a6e22e]">
                  Persyaratan Perangkat & Sistem Operasi
                </h3>
                <p className="text-[#f8f8f2]/90 text-xs">
                  Aplikasi ini dirancang untuk mengontrol Nginx melalui file konfigurasi. Di server lokal Anda (Laptop, PC bekas, Mini PC, Proxmox, Raspberry Pi, atau VPS lokal), Anda membutuhkan:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <span className="text-[#66d9ef] font-bold block mb-1">1. Sistem Operasi</span>
                    <span className="text-[11px] text-[#75715e]">
                      Linux (Ubuntu, Debian, AlmaLinux), macOS, atau Windows 10/11 dengan WSL2.
                    </span>
                  </div>

                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <span className="text-[#a6e22e] font-bold block mb-1">2. Docker & Compose</span>
                    <span className="text-[11px] text-[#75715e]">
                      Docker Engine 20+ & Docker Compose v2 (paling mudah & terisolasi).
                    </span>
                  </div>

                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <span className="text-[#fd971f] font-bold block mb-1">3. Port Terbuka</span>
                    <span className="text-[11px] text-[#75715e]">
                      Port 80 (HTTP) dan Port 443 (HTTPS) tidak sedang dipakai aplikasi lain (seperti Apache).
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded flex items-center justify-between">
                <div>
                  <span className="text-white font-bold text-xs block">Cek apakah Docker sudah terpasang:</span>
                  <code className="text-[#a6e22e] text-[11px]">docker --version && docker compose version</code>
                </div>
                <button
                  onClick={() => copyText('docker --version && docker compose version', 'cmd_check')}
                  className="px-2.5 py-1 rounded bg-[#272822] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32] flex items-center gap-1"
                >
                  {copiedId === 'cmd_check' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'cmd_check' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Setup Folder & Docker */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[#66d9ef] font-bold text-xs">
                  Opsi Otomatis: Jalankan Script bash ini di terminal server Anda
                </span>
                <button
                  onClick={downloadSetupScript}
                  className="px-3 py-1.5 rounded bg-[#a6e22e] text-[#1e1f1c] font-bold hover:bg-[#92cc26] flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download setup-npm-local.sh</span>
                </button>
              </div>

              <div className="bg-[#1e1f1c] border border-[#383830] p-3 rounded space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#75715e]">
                  <span>Atau copy-paste perintah 1 baris berikut langsung ke terminal server:</span>
                  <button
                    onClick={() => copyText(scriptSetupBash, 'bash_full')}
                    className="text-[#a6e22e] hover:underline flex items-center gap-1"
                  >
                    {copiedId === 'bash_full' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === 'bash_full' ? 'Tersalin!' : 'Salin Script'}</span>
                  </button>
                </div>
                <div className="bg-[#171815] p-3 rounded max-h-56 overflow-y-auto text-[10px] text-[#a6e22e]">
                  <pre>{scriptSetupBash}</pre>
                </div>
              </div>

              <div className="p-3 bg-[#1e1f1c] border border-[#3e3d32] rounded text-[11px] space-y-1">
                <span className="text-[#fd971f] font-bold">Struktur Direktori yang Terbentuk:</span>
                <pre className="text-[#75715e] text-[10px]">
{`npm-local/
├── docker-compose.yml
├── data/
│   ├── nginx.conf          # Master file konfigurasi Nginx
│   ├── conf.d/             # Folder tempat file .conf tiap host ditaruh
│   ├── streams/            # Folder stream TCP/UDP
│   ├── htpasswd/           # Folder password Basic Auth
│   └── letsencrypt/        # Folder sertifikat SSL
└── logs/                   # Log akses & error`}
                </pre>
              </div>
            </div>
          )}

          {/* STEP 3: Ekspor Config dari Web */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="bg-[#1e1f1c] border border-[#3e3d32] p-4 rounded space-y-3">
                <h3 className="text-sm font-bold text-[#e6db74]">
                  Bagaimana Menghubungkan Dashboard ini ke Nginx Server?
                </h3>
                <p className="text-xs text-[#f8f8f2]/90">
                  Ada dua cara menerapkan konfigurasi dari dashboard ke server Anda:
                </p>

                <div className="space-y-3 pt-2">
                  {/* Cara A */}
                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <span className="text-[#a6e22e] font-bold block mb-1">
                      Cara A (Paling Simpel): Export Config & Taruh di Server
                    </span>
                    <p className="text-[11px] text-[#75715e]">
                      1. Buat host yang Anda inginkan di dashboard web ini (misal <code className="text-white">api.local &rarr; 192.168.1.50:8080</code>).<br />
                      2. Buka tab <strong>Config Inspector</strong> atau klik <strong>"Export Bundle"</strong> di header.<br />
                      3. Simpan file <code className="text-white">&lt;namahost&gt;.conf</code> ke dalam folder server Anda di <code className="text-[#66d9ef]">./data/conf.d/</code>.<br />
                      4. Jalankan perintah reload di server:
                    </p>
                    <div className="mt-2 bg-[#171815] p-2 rounded flex items-center justify-between text-[11px]">
                      <code className="text-[#a6e22e]">docker exec npm_nginx_engine nginx -s reload</code>
                      <button
                        onClick={() => copyText('docker exec npm_nginx_engine nginx -s reload', 'cmd_reload')}
                        className="text-[#66d9ef] hover:underline"
                      >
                        {copiedId === 'cmd_reload' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                  </div>

                  {/* Cara B */}
                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <span className="text-[#66d9ef] font-bold block mb-1">
                      Cara B (Otomatis Full-Stack): Menggunakan Backend Node.js Controller
                    </span>
                    <p className="text-[11px] text-[#75715e]">
                      Jika Anda ingin dashboard web langsung menulis file dan me-reload Nginx secara otomatis tanpa manual copy-paste:
                      Jalankan backend Express API (lihat tab <em>"Cara Buat Sendiri &gt; 2. Kode Backend Node.js"</em>) di container yang sama atau server lokal yang mem-mount folder <code className="text-white">./data/conf.d</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Testing Domain Lokal */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="bg-[#1e1f1c] border border-[#3e3d32] p-4 rounded space-y-3">
                <h3 className="text-sm font-bold text-[#ae81ff]">
                  Cara Mengetes Domain di Jaringan Lokal (Tanpa Beli Domain)
                </h3>
                <p className="text-xs text-[#f8f8f2]/90">
                  Untuk mencoba nama domain seperti <code className="text-[#a6e22e]">app.local</code> atau <code className="text-[#66d9ef]">api.test</code> di server lokal:
                </p>

                <div className="space-y-3 text-[11px]">
                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <strong className="text-white block mb-1">Opsi 1: Edit file hosts di Laptop/PC Klien</strong>
                    <span className="text-[#75715e] block mb-2">
                      Tambahkan baris berikut di file <code className="text-white">/etc/hosts</code> (Linux/Mac) atau <code className="text-white">C:\Windows\System32\drivers\etc\hosts</code> (Windows):
                    </span>
                    <div className="bg-[#171815] p-2 rounded flex items-center justify-between text-[11px]">
                      <code className="text-[#a6e22e]">192.168.1.10   app.local   api.local</code>
                      <button
                        onClick={() => copyText('192.168.1.10   app.local   api.local', 'hosts_ex')}
                        className="text-[#66d9ef] hover:underline"
                      >
                        {copiedId === 'hosts_ex' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <span className="text-[10px] text-[#75715e] mt-1 block">
                      *(Ganti 192.168.1.10 dengan alamat IP server lokal Anda)*
                    </span>
                  </div>

                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <strong className="text-white block mb-1">Opsi 2: Menggunakan DNS Router / Pi-hole / Mikrotik</strong>
                    <span className="text-[#75715e]">
                      Jika Anda memiliki router Mikrotik atau Pi-hole, buat DNS Static record: <code className="text-white">*.local -&gt; IP Server</code>. Maka semua HP dan Laptop di WiFi lokal akan otomatis mengenali domain tersebut!
                    </span>
                  </div>

                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <strong className="text-white block mb-1">Opsi 3: Menggunakan Domain Publik Nyata</strong>
                    <span className="text-[#75715e]">
                      Jika server lokal Anda punya IP publik statis atau menggunakan Cloudflare Tunnel / Port Forwarding, arahkan DNS A Record domain Anda ke IP publik tersebut. Fitur Let's Encrypt di NPM-Core akan otomatis mengeluarkan SSL valid!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Setup MikroTik & NAT Port Forwarding */}
          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="bg-[#1e1f1c] border border-[#3e3d32] p-4 rounded space-y-3">
                <div className="flex items-center gap-2 text-[#a6e22e] font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                  <h3>Konfigurasi MikroTik: Port Forwarding 80 & 443 + Hairpin NAT</h3>
                </div>
                <p className="text-xs text-[#f8f8f2]/90">
                  <strong>YA, otomatis berfungsi!</strong> Ketika port 80 dan 443 di MikroTik diarahkan (dst-nat) ke IP server lokal Anda, Nginx container akan langsung membaca HTTP Host Header / TLS SNI dan meneruskan trafik ke service tujuan Anda.
                </p>

                <div className="space-y-3 pt-2 text-[11px]">
                  {/* PENTING 1: Ganti port WWW MikroTik */}
                  <div className="p-3 bg-[#272822] rounded border border-[#383830] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#f92672] font-bold">
                        1. PENTING: Ubah Port WebFig MikroTik (agar tidak bentrok dengan Port 80)
                      </span>
                      <button
                        onClick={() => copyText('/ip service set www port=8080', 'mt_www')}
                        className="text-[#66d9ef] hover:underline"
                      >
                        {copiedId === 'mt_www' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="text-[#75715e]">
                      Secara default, web admin MikroTik (WebFig) memakai port 80. Pindahkan ke port 8080:
                    </p>
                    <div className="bg-[#171815] p-2 rounded text-[#a6e22e]">
                      <code>/ip service set www port=8080</code>
                    </div>
                  </div>

                  {/* Rule 2 & 3: NAT Port Forwarding */}
                  <div className="p-3 bg-[#272822] rounded border border-[#383830] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#66d9ef] font-bold">
                        2. Port Forwarding Port 80 (HTTP) & 443 (HTTPS)
                      </span>
                      <button
                        onClick={() =>
                          copyText(
                            `/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=80 action=dst-nat to-addresses=192.168.88.50 to-ports=80 comment="NPM-HTTP"\n/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=443 action=dst-nat to-addresses=192.168.88.50 to-ports=443 comment="NPM-HTTPS"`,
                            'mt_nat'
                          )
                        }
                        className="text-[#66d9ef] hover:underline"
                      >
                        {copiedId === 'mt_nat' ? 'Tersalin' : 'Salin Semua'}
                      </button>
                    </div>
                    <p className="text-[#75715e]">
                      Ganti <code className="text-white">192.168.88.50</code> dengan IP server lokal Anda:
                    </p>
                    <div className="bg-[#171815] p-2 rounded text-[#a6e22e] space-y-1">
                      <div><code>/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=80 action=dst-nat to-addresses=192.168.88.50 to-ports=80 comment="NPM-HTTP"</code></div>
                      <div><code>/ip firewall nat add chain=dstnat in-interface-list=WAN protocol=tcp dst-port=443 action=dst-nat to-addresses=192.168.88.50 to-ports=443 comment="NPM-HTTPS"</code></div>
                    </div>
                  </div>

                  {/* Rule 4: Hairpin NAT */}
                  <div className="p-3 bg-[#272822] rounded border border-[#383830] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#e6db74] font-bold">
                        3. Hairpin NAT (Wajib jika ingin akses domain dari dalam WiFi lokal sendiri)
                      </span>
                      <button
                        onClick={() =>
                          copyText(
                            `/ip firewall nat add chain=srcnat src-address=192.168.88.0/24 dst-address=192.168.88.50 protocol=tcp dst-port=80,443 action=masquerade comment="Hairpin NAT NPM"`,
                            'mt_hairpin'
                          )
                        }
                        className="text-[#66d9ef] hover:underline"
                      >
                        {copiedId === 'mt_hairpin' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="text-[#75715e]">
                      Tanpa Hairpin NAT, saat laptop Anda terhubung ke WiFi lokal yang sama dan membuka domain publik Anda, koneksi akan timeout (loopback issue).
                    </p>
                    <div className="bg-[#171815] p-2 rounded text-[#a6e22e]">
                      <code>/ip firewall nat add chain=srcnat src-address=192.168.88.0/24 dst-address=192.168.88.50 protocol=tcp dst-port=80,443 action=masquerade comment="Hairpin NAT NPM"</code>
                    </div>
                    <span className="text-[10px] text-[#75715e] block">
                      *(Sesuaikan subnet 192.168.88.0/24 dengan IP LAN lokal Anda)*
                    </span>
                  </div>

                  {/* Keuntungan SSL Let's Encrypt */}
                  <div className="p-3 bg-[#272822] rounded border border-[#383830]">
                    <span className="text-[#a6e22e] font-bold block mb-1">
                      Otomatisasi SSL Let's Encrypt Langsung Aktif!
                    </span>
                    <p className="text-[#75715e]">
                      Karena port 80 langsung diteruskan ke Nginx, server Let's Encrypt di internet dapat langsung memverifikasi domain Anda (ACME Challenge). Anda bisa meminta sertifikat SSL HTTPS gratis bercentang hijau langsung dari dashboard ini tanpa konfigurasi manual!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#383830] bg-[#1e1f1c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="px-3 py-1.5 rounded bg-[#272822] text-[#75715e] hover:text-white"
              >
                &larr; Langkah Sebelumnya
              </button>
            )}
            {activeStep < 5 && (
              <button
                onClick={() => setActiveStep((prev) => (prev + 1) as any)}
                className="px-3 py-1.5 rounded bg-[#272822] text-[#66d9ef] hover:text-white border border-[#3e3d32]"
              >
                Langkah Berikutnya &rarr;
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#a6e22e] text-[#1e1f1c] font-bold hover:bg-[#92cc26]"
          >
            Selesai / Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
