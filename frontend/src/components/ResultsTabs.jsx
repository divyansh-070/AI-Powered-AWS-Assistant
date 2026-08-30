import { useState } from 'react';
import TemplateViewer from './TemplateViewer';
import ExplanationPanel from './ExplanationPanel';

const TABS = [
  { id: 'template', label: 'Template' },
  { id: 'explanation', label: 'Explanation' },
  { id: 'cost', label: 'Cost Estimate' },
  { id: 'security', label: 'Security Report' },
  { id: 'diagram', label: 'Architecture Diagram' }
];

export default function ResultsTabs({ results }) {
  const [activeTab, setActiveTab] = useState('template');

  if (!results || (!results.templateYaml && !results.explanation)) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
              activeTab === tab.id
                ? 'text-blue-600 bg-white'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>
      <div className="flex-1 p-6 bg-slate-50/50">
        {activeTab === 'template' && (
          <TemplateViewer templateYaml={results.templateYaml} templateJson={results.templateJson} />
        )}
        {activeTab === 'explanation' && (
          <ExplanationPanel explanation={results.explanation} />
        )}
        {['cost', 'security', 'diagram'].includes(activeTab) && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 bg-white rounded-lg border border-slate-200 border-dashed p-12">
            <p className="mb-4">No data available for {TABS.find(t => t.id === activeTab)?.label} yet.</p>
            <button className="px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-md hover:bg-blue-100 transition-colors">
              Generate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
