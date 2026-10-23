import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Edit2, Key, Network, FileText } from 'lucide-react';
import { AccessList, AccessListClient, AccessListAuthUser } from '../types';

interface AccessListsViewProps {
  accessLists: AccessList[];
  onSaveAccessList: (acl: AccessList) => void;
  onDeleteAccessList: (id: string) => void;
}

export const AccessListsView: React.FC<AccessListsViewProps> = ({
  accessLists,
  onSaveAccessList,
  onDeleteAccessList,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AccessList | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [satisfyAny, setSatisfyAny] = useState(false);
  const [passAuth, setPassAuth] = useState(true);
  const [clients, setClients] = useState<AccessListClient[]>([
    { id: '1', address: '192.168.1.0/24', directive: 'allow' },
    { id: '2', address: 'all', directive: 'deny' },
  ]);
  const [authUsers, setAuthUsers] = useState<AccessListAuthUser[]>([
    { id: '1', username: 'admin', passwordHash: '$apr1$98d7fa..$kJh89aYh9s8DF98S', hint: 'Master password' },
  ]);

  // Client inputs
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newIpDirective, setNewIpDirective] = useState<'allow' | 'deny'>('allow');

  // User inputs
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const openNew = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setSatisfyAny(false);
    setPassAuth(true);
    setClients([
      { id: 'c1', address: '192.168.1.0/24', directive: 'allow' },
      { id: 'c2', address: 'all', directive: 'deny' },
    ]);
    setAuthUsers([]);
    setIsModalOpen(true);
  };

  const openEdit = (acl: AccessList) => {
    setEditingItem(acl);
    setName(acl.name);
    setDescription(acl.description);
    setSatisfyAny(acl.satisfyAny);
    setPassAuth(acl.passAuth);
    setClients([...acl.clients]);
    setAuthUsers([...acl.items]);
    setIsModalOpen(true);
  };

  const addClient = () => {
    if (!newIpAddress.trim()) return;
    setClients([
      ...clients,
      {
        id: `cli_${Date.now()}`,
        address: newIpAddress.trim(),
        directive: newIpDirective,
      },
    ]);
    setNewIpAddress('');
  };

  const removeClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
  };

  const addAuthUser = () => {
    if (!newUsername.trim() || !newPassword.trim()) return;
    // Simulate APR1 apache htpasswd hashing
    const simulatedHash = `$apr1$${Math.random().toString(36).substring(2, 8)}$${btoa(newPassword).substring(0, 16)}`;
    setAuthUsers([
      ...authUsers,
      {
        id: `usr_${Date.now()}`,
        username: newUsername.trim(),
        passwordHash: simulatedHash,
        hint: `Pass: ${newPassword.replace(/./g, '•')}`,
      },
    ]);
    setNewUsername('');
    setNewPassword('');
  };

  const removeAuthUser = (id: string) => {
    setAuthUsers(authUsers.filter((u) => u.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const item: AccessList = {
      id: editingItem ? editingItem.id : `acl_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      satisfyAny,
      passAuth,
      clients,
      items: authUsers,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    onSaveAccessList(item);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#75715e]">
            <span>ENGINE</span>
            <span>/</span>
            <span className="text-[#a6e22e]">ACCESS_LISTS</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            Access Lists & Basic Authentication
          </h1>
          <p className="text-xs text-[#75715e] font-mono mt-0.5">
            Configure IP whitelist/blacklist CIDRs and HTTP Basic Auth credentials with satisfy any/all policies
          </p>
        </div>

        <button
          onClick={openNew}
          className="px-3 py-2 rounded text-xs font-mono font-semibold bg-[#a6e22e] hover:bg-[#92cc26] text-[#1e1f1c] transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Access List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessLists.map((acl) => (
          <div
            key={acl.id}
            className="bg-[#272822] border border-[#3e3d32] rounded p-4 flex flex-col justify-between font-mono text-xs space-y-4 shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-white text-sm">{acl.name}</h3>
                  <p className="text-[#75715e] text-xs mt-0.5">{acl.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(acl)}
                    className="p-1.5 rounded bg-[#1e1f1c] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete access list "${acl.name}"?`)) {
                        onDeleteAccessList(acl.id);
                      }
                    }}
                    className="p-1.5 rounded bg-[#1e1f1c] hover:bg-[#f92672]/20 text-[#75715e] hover:text-[#f92672] border border-[#3e3d32]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#66d9ef]/10 text-[#66d9ef] border border-[#66d9ef]/30">
                  satisfy {acl.satisfyAny ? 'any (IP OR Auth)' : 'all (IP AND Auth)'}
                </span>
                {acl.passAuth && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-[#a6e22e]/10 text-[#a6e22e] border border-[#a6e22e]/30">
                    Pass Auth to Upstream
                  </span>
                )}
              </div>

              {/* IP Directives Summary */}
              <div className="mt-4 space-y-1.5">
                <div className="text-[11px] text-[#75715e] flex items-center gap-1">
                  <Network className="w-3 h-3 text-[#fd971f]" />
                  <span>IP Directives ({acl.clients.length}):</span>
                </div>
                <div className="bg-[#1e1f1c] p-2 rounded border border-[#383830] space-y-1 max-h-24 overflow-y-auto">
                  {acl.clients.map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-[11px]">
                      <span className={c.directive === 'allow' ? 'text-[#a6e22e]' : 'text-[#f92672]'}>
                        {c.directive} {c.address};
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Auth Users */}
              <div className="mt-3 space-y-1.5">
                <div className="text-[11px] text-[#75715e] flex items-center gap-1">
                  <Key className="w-3 h-3 text-[#e6db74]" />
                  <span>HTTP Basic Auth Users ({acl.items.length}):</span>
                </div>
                <div className="bg-[#1e1f1c] p-2 rounded border border-[#383830] space-y-1 max-h-20 overflow-y-auto">
                  {acl.items.length === 0 ? (
                    <div className="text-[#75715e] text-[10px]">No basic auth users configured</div>
                  ) : (
                    acl.items.map((u) => (
                      <div key={u.id} className="flex justify-between items-center text-[11px]">
                        <span className="text-white font-semibold">{u.username}</span>
                        <span className="text-[#75715e] text-[10px]">{u.hint || 'Encrypted'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Access List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#272822] border border-[#49483e] rounded w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl p-4 font-mono text-xs">
            <h3 className="font-bold text-white text-sm pb-3 border-b border-[#383830]">
              {editingItem ? 'Edit Access List' : 'New Access List'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#75715e] mb-1">List Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Internal Team Only"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                  />
                </div>
                <div>
                  <label className="block text-[#75715e] mb-1">Description:</label>
                  <input
                    type="text"
                    placeholder="Brief explanation"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#1e1f1c] border border-[#383830] rounded p-2 text-white focus:outline-none focus:border-[#a6e22e]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#383830]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={satisfyAny}
                    onChange={(e) => setSatisfyAny(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0"
                  />
                  <span className="text-white">
                    Satisfy Any (Client allowed if IP matches OR Basic Auth is passed)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={passAuth}
                    onChange={(e) => setPassAuth(e.target.checked)}
                    className="rounded bg-[#1e1f1c] border-[#3e3d32] text-[#a6e22e] focus:ring-0"
                  />
                  <span className="text-white">Pass Authorization Header to Upstream</span>
                </label>
              </div>

              {/* IP Rules Section */}
              <div className="pt-3 border-t border-[#383830] space-y-2">
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-[#fd971f]" />
                  IP Whitelist / Blacklist Rules
                </span>

                <div className="flex gap-2">
                  <select
                    value={newIpDirective}
                    onChange={(e) => setNewIpDirective(e.target.value as any)}
                    className="bg-[#1e1f1c] border border-[#383830] rounded px-2 py-1.5 text-white"
                  >
                    <option value="allow">allow</option>
                    <option value="deny">deny</option>
                  </select>
                  <input
                    type="text"
                    placeholder="192.168.1.0/24 or all"
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                    className="flex-1 bg-[#1e1f1c] border border-[#383830] rounded px-2 py-1.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={addClient}
                    className="px-3 py-1.5 rounded bg-[#383830] hover:bg-[#49483e] text-white"
                  >
                    Add Rule
                  </button>
                </div>

                <div className="bg-[#1e1f1c] p-2 rounded border border-[#383830] space-y-1 max-h-32 overflow-y-auto">
                  {clients.map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-[11px] p-1 hover:bg-[#272822] rounded">
                      <span className={c.directive === 'allow' ? 'text-[#a6e22e]' : 'text-[#f92672]'}>
                        {c.directive} {c.address};
                      </span>
                      <button
                        type="button"
                        onClick={() => removeClient(c.id)}
                        className="text-[#75715e] hover:text-[#f92672]"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Basic Auth Users Section */}
              <div className="pt-3 border-t border-[#383830] space-y-2">
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#e6db74]" />
                  HTTP Basic Auth Users (.htpasswd)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-[#1e1f1c] border border-[#383830] rounded px-2 py-1.5 text-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="flex-1 bg-[#1e1f1c] border border-[#383830] rounded px-2 py-1.5 text-white"
                    />
                    <button
                      type="button"
                      onClick={addAuthUser}
                      className="px-3 py-1.5 rounded bg-[#383830] hover:bg-[#49483e] text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="bg-[#1e1f1c] p-2 rounded border border-[#383830] space-y-1 max-h-24 overflow-y-auto">
                  {authUsers.map((u) => (
                    <div key={u.id} className="flex justify-between items-center text-[11px] p-1 hover:bg-[#272822] rounded">
                      <span className="text-white">{u.username}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[#75715e] text-[10px]">{u.hint}</span>
                        <button
                          type="button"
                          onClick={() => removeAuthUser(u.id)}
                          className="text-[#75715e] hover:text-[#f92672]"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                  className="px-4 py-1.5 rounded bg-[#a6e22e] font-semibold text-[#1e1f1c] hover:bg-[#92cc26]"
                >
                  Save Access List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
