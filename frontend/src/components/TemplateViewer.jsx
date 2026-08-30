import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

export default function TemplateViewer({ templateYaml, templateJson }) {
  const [activeTab, setActiveTab] = useState('yaml');
  const [copied, setCopied] = useState(false);

  const content = activeTab === 'yaml' ? templateYaml : (templateJson ? JSON.stringify(templateJson, null, 2) : '');

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!templateYaml && !templateJson) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
        <p>No template generated yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden shadow-lg border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('yaml')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'yaml' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            YAML
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'json' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            JSON
          </button>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#1E1E1E]">
        <SyntaxHighlighter
          language={activeTab}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem' }}
          showLineNumbers
        >
          {content || '// No content available'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
