import { useState } from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SecurityReport({ securityData, isLoading, onAudit }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [expandedIssues, setExpandedIssues] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-zinc-400 gap-3">
        <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-zinc-300">Auditing CloudFormation against CIS Security Benchmarks...</p>
      </div>
    );
  }

  if (!securityData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-zinc-400 text-center p-8 bg-zinc-900/40 rounded-lg border border-zinc-800 border-dashed">
        <ShieldCheck className="w-8 h-8 text-zinc-500 mb-2" />
        <p className="text-sm text-zinc-300 font-medium mb-1">No Security Audit Generated Yet</p>
        <p className="text-xs text-zinc-500 max-w-sm mb-4">Run the security rules engine to scan for open ports, public buckets, and unencrypted databases.</p>
        {onAudit && (
          <button
            onClick={onAudit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Run Security Audit</span>
          </button>
        )}
      </div>
    );
  }

  const score = Number(securityData.score ?? 100);
  const issues = securityData.issues || [];
  const summary = securityData.summary || 'Security review complete.';

  const highCount = issues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = issues.filter((i) => i.severity === 'MEDIUM').length;
  const lowCount = issues.filter((i) => i.severity === 'LOW').length;

  const filteredIssues = issues.filter((issue) => {
    if (filterSeverity === 'ALL') return true;
    return issue.severity === filterSeverity;
  });

  const getScoreTheme = (s) => {
    if (s >= 85) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Grade: A (Secure)', icon: ShieldCheck };
    if (s >= 70) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Grade: B (Moderate)', icon: AlertTriangle };
    return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Grade: C/D (High Risk)', icon: ShieldAlert };
  };

  const theme = getScoreTheme(score);
  const ScoreIcon = theme.icon;

  const toggleExpand = (idx) => {
    setExpandedIssues((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyFix = (fixText, idx) => {
    navigator.clipboard.writeText(fixText);
    setCopiedIndex(idx);
    toast.success('Copied remediation snippet to clipboard');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Score Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Score Card */}
        <div className={`md:col-span-2 bg-zinc-900 border ${theme.border} rounded-xl p-5 flex items-center justify-between shadow-sm`}>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">Security Health Score</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-extrabold ${theme.color} tracking-tight`}>
                {score}
              </span>
              <span className="text-zinc-500 font-semibold text-sm">/ 100</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{summary}</p>
          </div>
          <div className={`p-4 rounded-xl ${theme.bg} ${theme.color} border ${theme.border}`}>
            <ScoreIcon className="w-8 h-8" />
          </div>
        </div>

        {/* Issue Counts */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center gap-2">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Findings Severity</span>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{highCount} High</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{mediumCount} Med</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{lowCount} Low</span>
            </div>
          </div>
        </div>

        {/* Benchmark Standard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-center gap-1 text-xs">
          <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Compliance Benchmark</span>
          <div className="flex items-center gap-1.5 text-zinc-200 font-medium mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>CIS AWS Foundations</span>
          </div>
          <span className="text-[11px] text-zinc-500">AWS Well-Architected Framework</span>
        </div>
      </div>

      {/* Filter Tabs & Refresh */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5">
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterSeverity(lvl)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterSeverity === lvl
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {lvl === 'ALL' ? `All Findings (${issues.length})` : `${lvl}`}
            </button>
          ))}
        </div>

        {onAudit && (
          <button
            onClick={onAudit}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-scan</span>
          </button>
        )}
      </div>

      {/* Issue Accordion List */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900/40 rounded-xl border border-zinc-800 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="text-sm font-semibold text-zinc-200">No Security Issues Found</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            {filterSeverity === 'ALL'
              ? 'Your template complies with configured CIS security rules and AWS Well-Architected best practices.'
              : `Zero ${filterSeverity} severity vulnerabilities detected in this template.`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredIssues.map((issue, idx) => {
            const isExpanded = expandedIssues[idx] ?? true;
            const isHigh = issue.severity === 'HIGH';
            const isMed = issue.severity === 'MEDIUM';

            const badgeBg = isHigh ? 'bg-red-500/10 text-red-400 border-red-500/20' : isMed ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20';

            return (
              <div
                key={idx}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden transition-all shadow-sm"
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(idx)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeBg}`}>
                      {issue.severity}
                    </span>
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
                        <span>{issue.issue}</span>
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                        Affected Resource: <span className="text-zinc-300 font-semibold">{issue.resource}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-zinc-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Body: Remediation */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800/80 bg-zinc-950/40">
                    <div className="flex items-center justify-between mt-2 mb-1.5">
                      <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        Recommended Remediation Fix:
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyFix(issue.fix, idx);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition-colors"
                      >
                        {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIndex === idx ? 'Copied' : 'Copy Fix'}</span>
                      </button>
                    </div>

                    <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {issue.fix}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
