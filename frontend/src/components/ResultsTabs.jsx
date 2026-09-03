import { useState } from 'react';
import TemplateViewer from './TemplateViewer';
import ExplanationPanel from './ExplanationPanel';
import { FileCode, Lightbulb, DollarSign, ShieldCheck, Network } from 'lucide-react';

const TABS = [
  { id: 'template', label: 'Template', icon: FileCode },
  { id: 'explanation', label: 'Explanation', icon: Lightbulb },
  { id: 'cost', label: 'Cost Estimate', icon: DollarSign },
  { id: 'security', label: 'Security Report', icon: ShieldCheck },
  { id: 'diagram', label: 'Architecture Diagram', icon: Network }
];

export default function ResultsTabs({ results }) {
  const [activeTab, setActiveTab] = useState('template');

  if (!results || (!results.templateYaml && !results.explanation)) {
    return null;
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-[500px] shadow-sm">
      {/* Tab Navigation Header */}
      <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950 p-1.5 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
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
        {['cost', 'security', 'diagram'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-zinc-400 bg-zinc-900/40 rounded-lg border border-zinc-800 border-dashed p-8 text-center">
            <p className="text-xs mb-3 text-zinc-400">
              No data available for {TABS.find(t => t.id === activeTab)?.label} yet.
            </p>
            <button className="px-3 py-1.5 text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-md hover:bg-zinc-700 transition-colors">
              Generate Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
