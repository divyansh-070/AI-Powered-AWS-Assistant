import { useState } from 'react';
import { DollarSign, Server, Database, HardDrive, RefreshCw, Info, CheckCircle2, Globe } from 'lucide-react';

const REGIONS = [
  { id: 'us-east-1', name: 'US East (N. Virginia)' },
  { id: 'us-west-2', name: 'US West (Oregon)' },
  { id: 'eu-west-1', name: 'EU (Ireland)' },
  { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' }
];

export default function CostEstimate({ costData, isLoading, onRefresh }) {
  const [selectedRegion, setSelectedRegion] = useState('us-east-1');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-zinc-400 gap-3">
        <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-zinc-300">Calculating AWS resource pricing breakdown...</p>
      </div>
    );
  }

  if (!costData || !costData.breakdown) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-400 text-center p-8 bg-zinc-900/40 rounded-lg border border-zinc-800 border-dashed">
        <DollarSign className="w-8 h-8 text-zinc-500 mb-2" />
        <p className="text-sm text-zinc-300 font-medium mb-1">No Cost Estimate Generated Yet</p>
        <p className="text-xs text-zinc-500 max-w-sm mb-4">Generate your CloudFormation template first to calculate monthly expenditure.</p>
        {onRefresh && (
          <button
            onClick={() => onRefresh(selectedRegion)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Calculate Cost Now</span>
          </button>
        )}
      </div>
    );
  }

  const totalMonthly = Number(costData.total_monthly || 0);
  const hourlyEst = (totalMonthly / 730).toFixed(4);
  const breakdown = costData.breakdown || [];

  const getResourceIcon = (type) => {
    if (type.includes('EC2::Instance')) return Server;
    if (type.includes('RDS')) return Database;
    if (type.includes('S3') || type.includes('EBS')) return HardDrive;
    return Server;
  };

  const handleRegionChange = (e) => {
    const newRegion = e.target.value;
    setSelectedRegion(newRegion);
    if (onRefresh) {
      onRefresh(newRegion);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Estimated Monthly Cost</span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              ${totalMonthly.toFixed(2)}
            </span>
            <span className="text-xs font-medium text-zinc-400">/ month</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            ≈ ${hourlyEst} / hour across 730 active monthly hours
          </p>
        </div>

        {/* Region Selector */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Target Region</span>
            <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Globe className="w-4 h-4" />
            </span>
          </div>
          <select
            value={selectedRegion}
            onChange={handleRegionChange}
            className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.id})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500 mt-2">
            Rates benchmarked against AWS On-Demand catalogs
          </p>
        </div>

        {/* Resource Count Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Billable Components</span>
            <span className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Server className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {breakdown.filter((b) => b.monthly_cost > 0).length}
            </span>
            <span className="text-xs font-medium text-zinc-400">of {breakdown.length} total resources</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Includes Free-Tier AWS VPC & Security Groups ($0.00)</span>
          </div>
        </div>
      </div>

      {/* Itemized Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Itemized Cost Breakdown</h3>
          {onRefresh && (
            <button
              onClick={() => onRefresh(selectedRegion)}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">AWS Type</th>
                <th className="py-3 px-4">Pricing Details</th>
                <th className="py-3 px-4 text-right">Monthly Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {breakdown.map((item, idx) => {
                const Icon = getResourceIcon(item.resource_type || '');
                const isFree = item.monthly_cost === 0;

                return (
                  <tr key={idx} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-medium text-zinc-200 flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>{item.resource}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-400">
                      {item.resource_type}
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      {item.details || 'Standard consumption baseline'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      {isFree ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Free Tier ($0.00)
                        </span>
                      ) : (
                        <span className="font-semibold text-zinc-100">
                          ${Number(item.monthly_cost).toFixed(2)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FinOps Disclaimer */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400">
        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
        <p>
          Calculated using standard AWS On-Demand baseline rates. Actual billing may vary based on exact utilization, egress data transfer, storage snapshots, and applicable AWS 12-Month Free Tier credits.
        </p>
      </div>
    </div>
  );
}
