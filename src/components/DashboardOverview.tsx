import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Clock,
  ArrowDownUp,
  ShieldAlert,
  Send,
  AlertOctagon,
  Lock,
  Globe,
  Radio,
} from 'lucide-react';
import { ProxyHost, NginxServerState } from '../types';

interface DashboardOverviewProps {
  hosts: ProxyHost[];
  serverState: NginxServerState;
  onSimulateRequest: (hostDomain: string, path: string, method: string) => void;
  onSimulateExploit: (hostDomain: string) => void;
  onSimulate502: (hostDomain: string) => void;
  onSelectHost: (hostId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  hosts,
  serverState,
  onSimulateRequest,
  onSimulateExploit,
  onSimulate502,
  onSelectHost,
}) => {
  const [selectedHostId, setSelectedHostId] = useState<string>('all');

  // Compute aggregated metrics
  const activeHosts = hosts.filter((h) => h.enabled);
  const totalRps = activeHosts.reduce((acc, h) => acc + h.metrics.currentRps, 0);
  const totalRequests = activeHosts.reduce((acc, h) => acc + h.metrics.totalRequests, 0);
  const avgLatency =
    activeHosts.length > 0
      ? (activeHosts.reduce((acc, h) => acc + h.metrics.avgLatencyMs, 0) / activeHosts.length).toFixed(1)
      : '0.0';

  const total2xx = activeHosts.reduce((acc, h) => acc + h.metrics.status2xxCount, 0);
  const total3xx = activeHosts.reduce((acc, h) => acc + h.metrics.status3xxCount, 0);
  const total4xx = activeHosts.reduce((acc, h) => acc + h.metrics.status4xxCount, 0);
  const total5xx = activeHosts.reduce((acc, h) => acc + h.metrics.status5xxCount, 0);
  const totalStatusCodes = total2xx + total3xx + total4xx + total5xx || 1;

  const pct2xx = Math.round((total2xx / totalStatusCodes) * 100);
  const pct3xx = Math.round((total3xx / totalStatusCodes) * 100);
  const pct4xx = Math.round((total4xx / totalStatusCodes) * 100);
  const pct5xx = Math.max(0, 100 - pct2xx - pct3xx - pct4xx);

  // Focus host for chart
  const focusHost =
    selectedHostId === 'all'
      ? activeHosts[0] || hosts[0]
      : hosts.find((h) => h.id === selectedHostId) || hosts[0];

  const history = focusHost?.metrics.history || [];

  // SVG dimensions for sparklines
  const chartWidth = 560;
  const chartHeight = 160;
  const maxRps = Math.max(...history.map((p) => p.rps), 50) * 1.15;
  const maxLatency = Math.max(...history.map((p) => p.latencyMs), 20) * 1.2;

  // Generate SVG paths
  const rpsPoints = history.map((pt, idx) => {
    const x = (idx / Math.max(history.length - 1, 1)) * chartWidth;
    const y = chartHeight - (pt.rps / maxRps) * chartHeight;
    return `${x},${y}`;
  });

  const rpsPathD =
    rpsPoints.length > 0
      ? `M 0,${chartHeight} L ${rpsPoints.join(' L ')} L ${chartWidth},${chartHeight} Z`
      : '';
  const rpsLineD = rpsPoints.length > 0 ? `M ${rpsPoints.join(' L ')}` : '';

  const latencyPoints = history.map((pt, idx) => {
    const x = (idx / Math.max(history.length - 1, 1)) * chartWidth;
    const y = chartHeight - (pt.latencyMs / maxLatency) * chartHeight;
    return `${x},${y}`;
  });
  const latencyLineD = latencyPoints.length > 0 ? `M ${latencyPoints.join(' L ')}` : '';

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Engine Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#383830]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#75715e]">
            <span>INFRASTRUCTURE</span>
            <span>/</span>
            <span className="text-[#a6e22e]">LIVE_TELEMETRY</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono mt-1">
            Nginx Reverse Proxy Monitoring
          </h1>
        </div>

        {/* Live Traffic Simulator Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-[#75715e] hidden md:inline">
            Inject Traffic:
          </span>
          <button
            onClick={() => {
              const domain = focusHost?.domainNames[0] || 'api.production.tech';
              onSimulateRequest(domain, '/api/v2/products', 'GET');
            }}
            className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#383830] text-[#a6e22e] border border-[#a6e22e]/40 transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3 h-3" />
            <span>GET 200 OK</span>
          </button>
          <button
            onClick={() => {
              const domain = focusHost?.domainNames[0] || 'api.production.tech';
              onSimulateExploit(domain);
            }}
            className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#383830] text-[#fd971f] border border-[#fd971f]/40 transition-colors flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Test WAF 403</span>
          </button>
          <button
            onClick={() => {
              const domain = focusHost?.domainNames[0] || 'api.production.tech';
              onSimulate502(domain);
            }}
            className="px-2.5 py-1.5 rounded text-xs font-mono bg-[#272822] hover:bg-[#383830] text-[#f92672] border border-[#f92672]/40 transition-colors flex items-center gap-1.5"
          >
            <AlertOctagon className="w-3 h-3" />
            <span>Trigger 502</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Strips (Monokai Terminal Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Global Requests / Sec */}
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3 relative overflow-hidden">
          <div className="flex items-center justify-between text-[#75715e] text-xs font-mono mb-1">
            <span>REQUEST_RATE</span>
            <span className="flex items-center gap-1 text-[#a6e22e]">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalRps}
            </span>
            <span className="text-xs font-mono text-[#a6e22e]">req/sec</span>
          </div>
          <div className="text-[11px] font-mono text-[#75715e] mt-1">
            Across {activeHosts.length} active reverse proxies
          </div>
        </div>

        {/* Metric 2: Average Latency */}
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="flex items-center justify-between text-[#75715e] text-xs font-mono mb-1">
            <span>AVG_LATENCY_P95</span>
            <Clock className="w-3.5 h-3.5 text-[#66d9ef]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {avgLatency}
            </span>
            <span className="text-xs font-mono text-[#66d9ef]">ms</span>
          </div>
          <div className="text-[11px] font-mono text-[#75715e] mt-1">
            p99 max peak: {(parseFloat(avgLatency) * 2.3).toFixed(1)} ms
          </div>
        </div>

        {/* Metric 3: Total Requests */}
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="flex items-center justify-between text-[#75715e] text-xs font-mono mb-1">
            <span>TOTAL_REQUESTS</span>
            <Zap className="w-3.5 h-3.5 text-[#e6db74]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {totalRequests.toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#75715e] mt-1">
            Since last reload ({serverState.lastReloadAt})
          </div>
        </div>

        {/* Metric 4: Nginx Worker Connections */}
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-3">
          <div className="flex items-center justify-between text-[#75715e] text-xs font-mono mb-1">
            <span>NGINX_CONNECTIONS</span>
            <ArrowDownUp className="w-3.5 h-3.5 text-[#ae81ff]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {serverState.activeConnections}
            </span>
            <span className="text-xs font-mono text-[#ae81ff]">active</span>
          </div>
          <div className="text-[11px] font-mono text-[#75715e] mt-1 flex gap-2">
            <span>R:{serverState.reading}</span>
            <span>W:{serverState.writing}</span>
            <span>Wait:{serverState.waiting}</span>
          </div>
        </div>
      </div>

      {/* Grafana-style Charts & Visualizers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel 1: Live RPS & Bandwidth Telemetry Chart */}
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#a6e22e]" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Requests Per Second (Real-Time)
              </span>
            </div>

            {/* Host Filter Dropdown */}
            <select
              value={selectedHostId}
              onChange={(e) => setSelectedHostId(e.target.value)}
              className="bg-[#1e1f1c] text-[#f8f8f2] border border-[#49483e] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#a6e22e]"
            >
              <option value="all">Focus: All Active Hosts</option>
              {hosts.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.domainNames[0]} ({h.metrics.currentRps} rps)
                </option>
              ))}
            </select>
          </div>

          {/* SVG Sparkline Area Chart */}
          <div className="relative w-full overflow-hidden bg-[#1e1f1c] border border-[#383830] rounded p-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-40 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="rpsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a6e22e" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#a6e22e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="#383830" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#383830" strokeDasharray="3 3" />
              <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="#383830" strokeDasharray="3 3" />

              {/* Area fill */}
              {rpsPathD && <path d={rpsPathD} fill="url(#rpsGradient)" />}
              {/* Stroke line */}
              {rpsLineD && <path d={rpsLineD} fill="none" stroke="#a6e22e" strokeWidth="2" />}
            </svg>

            {/* Chart Axes Legends */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#75715e] mt-2">
              <span>-60s</span>
              <span>-30s</span>
              <span className="text-[#a6e22e]">now ({focusHost?.metrics.currentRps || 0} req/s)</span>
            </div>
          </div>
        </div>

        {/* Panel 2: Latency Distribution & Status Code Breakdown */}
        <div className="bg-[#272822] border border-[#3e3d32] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#66d9ef]" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Latency Curve & Status Codes
              </span>
            </div>
            <span className="text-xs font-mono text-[#75715e]">
              p50: {focusHost?.metrics.latencyP50}ms · p95: {focusHost?.metrics.latencyP95}ms
            </span>
          </div>

          {/* SVG Latency Curve */}
          <div className="relative w-full overflow-hidden bg-[#1e1f1c] border border-[#383830] rounded p-2 mb-3">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-24 overflow-visible"
              preserveAspectRatio="none"
            >
              <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="#383830" strokeDasharray="3 3" />
              {latencyLineD && <path d={latencyLineD} fill="none" stroke="#66d9ef" strokeWidth="2" />}
            </svg>
            <div className="flex justify-between text-[10px] font-mono text-[#75715e]">
              <span>Latency timeline</span>
              <span className="text-[#66d9ef]">avg: {focusHost?.metrics.avgLatencyMs} ms</span>
            </div>
          </div>

          {/* HTTP Status Code Proportions Bar */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-[#75715e] mb-1.5">
              <span>HTTP_STATUS_DISTRIBUTION</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-[#a6e22e]">2xx ({pct2xx}%)</span>
                <span className="text-[#e6db74]">3xx ({pct3xx}%)</span>
                <span className="text-[#fd971f]">4xx ({pct4xx}%)</span>
                <span className="text-[#f92672]">5xx ({pct5xx}%)</span>
              </div>
            </div>

            {/* Stacked bar */}
            <div className="w-full h-3 rounded bg-[#1e1f1c] flex overflow-hidden border border-[#3e3d32]">
              <div style={{ width: `${pct2xx}%` }} className="bg-[#a6e22e] h-full transition-all" title="2xx Success" />
              <div style={{ width: `${pct3xx}%` }} className="bg-[#e6db74] h-full transition-all" title="3xx Redirect" />
              <div style={{ width: `${pct4xx}%` }} className="bg-[#fd971f] h-full transition-all" title="4xx Client Error / Blocked" />
              <div style={{ width: `${pct5xx}%` }} className="bg-[#f92672] h-full transition-all" title="5xx Server Error" />
            </div>
          </div>
        </div>
      </div>

      {/* Upstream Proxy Hosts Table */}
      <div className="bg-[#272822] border border-[#3e3d32] rounded overflow-hidden">
        <div className="p-3 border-b border-[#383830] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#66d9ef]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Configured Upstream Targets
            </span>
          </div>
          <span className="text-xs font-mono text-[#75715e]">
            {activeHosts.length} of {hosts.length} enabled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#1e1f1c] text-[#75715e] border-b border-[#383830]">
              <tr>
                <th className="py-2.5 px-4 font-medium">DOMAIN(S)</th>
                <th className="py-2.5 px-4 font-medium">FORWARD UPSTREAM</th>
                <th className="py-2.5 px-4 font-medium">SSL / SECURITY</th>
                <th className="py-2.5 px-4 font-medium text-right">RPS</th>
                <th className="py-2.5 px-4 font-medium text-right">P95 LATENCY</th>
                <th className="py-2.5 px-4 font-medium text-right">CACHE HIT</th>
                <th className="py-2.5 px-4 font-medium text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#383830]">
              {hosts.map((host) => (
                <tr
                  key={host.id}
                  className="hover:bg-[#32332a] transition-colors group cursor-pointer"
                  onClick={() => onSelectHost(host.id)}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span className={host.enabled ? 'text-white' : 'text-[#75715e] line-through'}>
                        {host.domainNames[0]}
                      </span>
                      {host.domainNames.length > 1 && (
                        <span className="text-[10px] text-[#75715e]">
                          +{host.domainNames.length - 1}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-[#66d9ef]">
                    {host.forwardScheme}://{host.forwardHost}:{host.forwardPort}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {host.certificateId ? (
                        <span className="flex items-center gap-1 text-[#a6e22e] text-[11px]">
                          <Lock className="w-3 h-3" />
                          <span>HTTPS {host.http2Support ? 'H2' : ''}</span>
                        </span>
                      ) : (
                        <span className="text-[#75715e] text-[11px]">Plain HTTP</span>
                      )}
                      {host.blockExploits && (
                        <span className="text-[10px] text-[#fd971f] px-1 bg-[#fd971f]/10 rounded">
                          WAF
                        </span>
                      )}
                      {host.websocketSupport && (
                        <span className="text-[10px] text-[#ae81ff] px-1 bg-[#ae81ff]/10 rounded">
                          WS
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-right tabular-nums text-white">
                    {host.enabled ? `${host.metrics.currentRps} r/s` : '0 r/s'}
                  </td>

                  <td className="py-3 px-4 text-right tabular-nums text-[#66d9ef]">
                    {host.enabled ? `${host.metrics.latencyP95} ms` : '-'}
                  </td>

                  <td className="py-3 px-4 text-right tabular-nums text-[#a6e22e]">
                    {host.cachingEnabled ? `${host.metrics.cacheHitRatio}%` : 'Off'}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSimulateRequest(host.domainNames[0], '/test', 'GET');
                      }}
                      className="px-2 py-1 rounded bg-[#1e1f1c] hover:bg-[#3e3d32] text-[#f8f8f2] border border-[#49483e] text-[11px] transition-colors"
                    >
                      Probe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
