import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Pause,
  Play,
  Trash2,
  Download,
  Filter,
  Maximize2,
  Minimize2,
  X,
  Search,
} from 'lucide-react';
import { NginxLogEntry, LogLevel } from '../types';

interface LiveLogDrawerProps {
  logs: NginxLogEntry[];
  isOpen: boolean;
  onClose: () => void;
  onClearLogs: () => void;
  isStreamPaused: boolean;
  onTogglePause: () => void;
}

export const LiveLogDrawer: React.FC<LiveLogDrawerProps> = ({
  logs,
  isOpen,
  onClose,
  onClearLogs,
  isStreamPaused,
  onTogglePause,
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        log.host.toLowerCase().includes(q) ||
        log.path.toLowerCase().includes(q) ||
        log.remoteAddr.includes(q) ||
        log.status.toString().includes(q) ||
        (log.message && log.message.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleDownloadLogs = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `${l.remoteAddr} - - [${l.timestamp}] "${l.method} ${l.path} HTTP/1.1" ${l.status} ${l.bytesSent} "${l.userAgent}" ${l.responseTimeMs}ms [${l.host}]`
      )
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nginx-access-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#171815] border-t border-[#3e3d32] shadow-2xl transition-all duration-200 flex flex-col font-mono text-xs ${
        isExpanded ? 'h-[75vh]' : 'h-72'
      }`}
    >
      {/* Top control bar */}
      <div className="h-10 px-3 bg-[#1e1f1c] border-b border-[#383830] flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-white font-bold">
            <Terminal className="w-4 h-4 text-[#66d9ef]" />
            <span>Nginx Live Log Stream</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isStreamPaused ? 'bg-[#75715e]' : 'bg-[#a6e22e] animate-pulse'
              }`}
            />
            <span className="text-[#75715e]">
              {isStreamPaused ? 'STREAM PAUSED' : 'STREAMING'}
            </span>
            <span className="text-[#75715e]">({filteredLogs.length} events)</span>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 text-[#75715e] absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search regex, IP, path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#171815] border border-[#383830] rounded pl-7 pr-2 py-1 text-[11px] text-white w-44 focus:outline-none focus:border-[#66d9ef]"
            />
          </div>

          {/* Level Filter */}
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-[#171815] border border-[#383830] rounded px-2 py-1 text-[11px] text-[#f8f8f2] focus:outline-none"
          >
            <option value="ALL">All Levels</option>
            <option value="ACCESS">ACCESS (2xx/3xx)</option>
            <option value="WARN">WARN (4xx/WAF)</option>
            <option value="ERROR">ERROR (5xx)</option>
          </select>

          {/* Pause / Resume */}
          <button
            onClick={onTogglePause}
            title={isStreamPaused ? 'Resume stream' : 'Pause stream'}
            className="p-1.5 rounded bg-[#272822] hover:bg-[#383830] text-[#f8f8f2] border border-[#3e3d32]"
          >
            {isStreamPaused ? (
              <Play className="w-3.5 h-3.5 text-[#a6e22e]" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-[#fd971f]" />
            )}
          </button>

          {/* Auto Scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded text-[11px] border transition-colors ${
              autoScroll
                ? 'bg-[#272822] text-[#a6e22e] border-[#a6e22e]/40'
                : 'bg-[#171815] text-[#75715e] border-[#383830]'
            }`}
          >
            Auto-Scroll
          </button>

          {/* Clear */}
          <button
            onClick={onClearLogs}
            title="Clear current log buffer"
            className="p-1.5 rounded bg-[#272822] hover:bg-[#383830] text-[#75715e] hover:text-[#f92672] border border-[#3e3d32]"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownloadLogs}
            title="Download logs"
            className="p-1.5 rounded bg-[#272822] hover:bg-[#383830] text-[#66d9ef] border border-[#3e3d32]"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Minimize */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Restore' : 'Maximize'}
            className="p-1.5 rounded bg-[#272822] hover:bg-[#383830] text-[#75715e] hover:text-white border border-[#3e3d32]"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close log viewer"
            className="p-1.5 rounded bg-[#272822] hover:bg-[#f92672]/20 text-[#75715e] hover:text-[#f92672] border border-[#3e3d32]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal log entries container */}
      <div
        ref={logContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed selection:bg-[#f92672] selection:text-white"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-[#75715e] italic py-8 text-center">
            No log events in buffer. Use the traffic simulator in the dashboard to inject requests!
          </div>
        ) : (
          filteredLogs.map((log) => {
            let statusColor = '#a6e22e'; // 2xx
            if (log.status >= 500) statusColor = '#f92672';
            else if (log.status >= 400) statusColor = '#fd971f';
            else if (log.status >= 300) statusColor = '#e6db74';

            return (
              <div
                key={log.id}
                className="hover:bg-[#272822] px-2 py-0.5 rounded transition-colors flex items-start gap-2 group"
              >
                <span className="text-[#75715e] shrink-0 select-none">
                  [{log.timestamp}]
                </span>

                <span className="text-[#ae81ff] font-semibold shrink-0">
                  {log.remoteAddr}
                </span>

                <span className="text-[#66d9ef] font-bold shrink-0">
                  {log.method}
                </span>

                <span className="text-white truncate max-w-md" title={log.path}>
                  {log.path}
                </span>

                <span
                  className="font-bold px-1.5 rounded text-[10px] shrink-0 tabular-nums"
                  style={{
                    color: statusColor,
                    backgroundColor: `${statusColor}15`,
                    border: `1px solid ${statusColor}40`,
                  }}
                >
                  {log.status}
                </span>

                <span className="text-[#75715e] shrink-0 tabular-nums">
                  {log.bytesSent}B
                </span>

                <span className="text-[#66d9ef] shrink-0 tabular-nums">
                  {log.responseTimeMs}ms
                </span>

                <span className="text-[#e6db74] shrink-0">
                  [{log.host}]
                </span>

                {log.message && (
                  <span className="text-[#fd971f] italic truncate">
                    &bull; {log.message}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
