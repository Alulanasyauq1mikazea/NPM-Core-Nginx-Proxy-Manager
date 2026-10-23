import React, { useState } from 'react';
import { Cpu, Plus, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { StreamHost } from '../types';

interface StreamsViewProps {
  streams: StreamHost[];
  onSaveStream: (stream: StreamHost) => void;
  onDeleteStream: (id: string) => void;
  onToggleStream: (id: string) => void;
}

export const StreamsView: React.FC<StreamsViewProps> = ({
  streams,
  onSaveStream,
  onDeleteStream,
  onToggleStream,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StreamHost | null>(null);

  const [incomingPort, setIncomingPort] = useState<number>(5432);
  const [forwardHost, setForwardHost] = useState('10.0.0.1');
  const [forwardPort, setForwardPort] = useState<number>(5432);
  const [tcpForwarding, setTcpForwarding] = useState(true);
  const [udpForwarding, setUdpForwarding] = useState(false);

  const openNew = () => {
    setEditingItem(null);
    setIncomingPort(3306);
    setForwardHost('192.168.1.50');
    setForwardPort(3306);
    setTcpForwarding(true);
    setUdpForwarding(false);
    setIsModalOpen(true);
  };

  const openEdit = (s: StreamHost) => {
    setEditingItem(s);
    setIncomingPort(s.incomingPort);
    setForwardHost(s.forwardHost);
    setForwardPort(s.forwardPort);
    setTcpForwarding(s.tcpForwarding);
    setUdpForwarding(s.udpForwarding);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcpForwarding && !udpForwarding) {
      alert('Select at least TCP or UDP forwarding');
      return;
    }

    const item: StreamHost = {
      id: editingItem ? editingItem.id : `stream_${Date.now()}`,
      incomingPort: Number(incomingPort),
      forwardHost: forwardHost.trim(),
      forwardPort: Number(forwardPort),
      tcpForwarding,
      udpForwarding,
      enabled: true,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    onSaveStream(item);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#ae81ff]">STREAMS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            TCP / UDP Streams (Layer 4)
          </h1>
          <p className="text-xs text-[#75715e] font-mono mt-0.5">
            Transparently proxy raw TCP/UDP network connections (PostgreSQL, MySQL, MQTT, Redis)
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-3 py-2 rounded text-xs font-mono font-semibold bg-[#ae81ff] hover:bg-[#9c6bf0] text-[#1e1f1c] transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stream</span>
        </button>
      </div>

      <div className="bg-[#272822] border border-[#3e3d32] rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#1e1f1c] text-[#75715e] border-b border-[#383830]">
              <tr>
                <th className="py-2.5 px-4 font-medium w-12 text-center">STATE</th>
                <th className="py-2.5 px-4 font-medium">INCOMING PORT</th>
                <th className="py-2.5 px-4 font-medium">PROTOCOLS</th>
                <th className="py-2.5 px-4 font-medium">FORWARD UPSTREAM</th>
                <th className="py-2.5 px-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383830]">
              {streams.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#75715e]">
                    No TCP/UDP stream forwarders configured yet.
                  </td>
                </tr>
              ) : (
                streams.map((s) => (
                  <tr
                    key={s.id}
                    className={`hover:bg-[#2e2f29] transition-colors ${
                      !s.enabled ? 'opacity-60 bg-[#1c1d1a]' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggleStream(s.id)}
                        className={`w-7 h-4 rounded-full transition-colors relative inline-block ${
                          s.enabled ? 'bg-[#ae81ff]' : 'bg-[#49483e]'
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full bg-[#1e1f1c] absolute top-0.5 transition-transform ${
                            s.enabled ? 'left-3.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-3 px-4 font-bold text-white">
                      :{s.incomingPort}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {s.tcpForwarding && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#66d9ef]/10 text-[#66d9ef] border border-[#66d9ef]/30">
                            TCP
                          </span>
                        )}
                        {s.udpForwarding && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#a6e22e]/10 text-[#a6e22e] border border-[#a6e22e]/30">
                            UDP
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[#ae81ff] flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#75715e]" />
                      <span>
                        {s.forwardHost}:{s.forwardPort}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#f8f8f2] border border-[#3e3d32]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete stream for port ${s.incomingPort}?`)) {
                              onDeleteStream(s.id);
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-md shadow-2xl p-4 font-mono text-xs">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-[#383830]">
              {editingItem ? 'Edit TCP/UDP Stream' : 'New TCP/UDP Stream'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <label className="block text-[#75715e] mb-1">Incoming Listening Port:</label>
                <input
                  type="number"
                  min="1"
                  max="65535"
                  required
                  value={incomingPort}
                  onChange={(e) => setIncomingPort(Number(e.target.value))}
                  className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#ae81ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#75715e] mb-1">Forward Host / IP:</label>
                  <input
                    type="text"
                    required
                    value={forwardHost}
                    onChange={(e) => setForwardHost(e.target.value)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#ae81ff]"
                  />
                </div>
                <div>
                  <label className="block text-[#75715e] mb-1">Forward Port:</label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    required
                    value={forwardPort}
                    onChange={(e) => setForwardPort(Number(e.target.value))}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#ae81ff]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#383830]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tcpForwarding}
                    onChange={(e) => setTcpForwarding(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#ae81ff] focus:ring-0"
                  />
                  <span className="text-white">Enable TCP Forwarding</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={udpForwarding}
                    onChange={(e) => setUdpForwarding(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#ae81ff] focus:ring-0"
                  />
                  <span className="text-white">Enable UDP Forwarding</span>
                </label>
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
                  className="px-4 py-1.5 rounded bg-[#ae81ff] font-semibold text-[#1e1f1c] hover:bg-[#9c6bf0]"
                >
                  Save Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
