import { useState } from 'react';
import TemplateViewer from './TemplateViewer';
import ExplanationPanel from './ExplanationPanel';
import CostEstimate from './CostEstimate';
import SecurityReport from './SecurityReport';
import DiagramViewer from './DiagramViewer';
import { FileCode, Lightbulb, DollarSign, ShieldCheck, Network } from 'lucide-react';

const TABS = [
  { id: 'template', label: 'Template', icon: FileCode },
  { id: 'explanation', label: 'Explanation', icon: Lightbulb },
  { id: 'cost', label: 'Cost Estimate', icon: DollarSign },
  { id: 'security', label: 'Security Report', icon: ShieldCheck },
  { id: 'diagram', label: 'Architecture Diagram', icon: Network }
];

export default function ResultsTabs({
  results,
  isLoadingCost,
  isLoadingSecurity,
  isLoadingDiagram,
  onRefreshCost,
  onAuditSecurity,
  onGenerateDiagram
}) {
  const [activeTab, setActiveTab] = useState('template');

  if (!results || (!results.templateYaml && !results.explanation)) {
    return null;
  }

  // Calculate small badges for security issues or cost
  const securityScore = results.securityReport?.score;
  const totalCost = results.costEstimate?.total_monthly;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-[520px] shadow-sm">
      {/* Tab Navigation Header */}
      <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950 p-1.5 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          let badge = null;
          if (tab.id === 'cost' && totalCost !== undefined) {
            badge = `$${Number(totalCost).toFixed(0)}/mo`;
          } else if (tab.id === 'security' && securityScore !== undefined) {
            badge = `${securityScore}/100`;
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white border border-zinc-700/80 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-zinc-400" />
              <span>{tab.label}</span>
              {badge && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  tab.id === 'cost'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : securityScore >= 85
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-5 bg-zinc-950">
        {activeTab === 'template' && (
          <TemplateViewer templateYaml={results.templateYaml} templateJson={results.templateJson} />
        )}
        
        {activeTab === 'explanation' && (
          <ExplanationPanel explanation={results.explanation} />
        )}

        {activeTab === 'cost' && (
          <CostEstimate
            costData={results.costEstimate}
            isLoading={isLoadingCost}
            onRefresh={onRefreshCost}
          />
        )}

        {activeTab === 'security' && (
          <SecurityReport
            securityData={results.securityReport}
            isLoading={isLoadingSecurity}
            onAudit={onAuditSecurity}
          />
        )}

        {activeTab === 'diagram' && (
          <DiagramViewer
            diagramCode={results.diagramCode}
            isLoading={isLoadingDiagram}
            onGenerate={onGenerateDiagram}
          />
        )}
      </div>
    </div>
  );
}
