import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, FileCode } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center p-8 text-zinc-400 bg-zinc-900/40 rounded-lg border border-zinc-800 border-dashed">
        <p className="text-xs">No template generated yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-300 font-mono">template.{activeTab}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Format selector */}
          <div className="flex bg-zinc-950 p-0.5 rounded-md border border-zinc-800">
            <button
              onClick={() => setActiveTab('yaml')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'yaml' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              YAML
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'json' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              JSON
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-md transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Syntax Area */}
      <div className="flex-1 overflow-auto bg-zinc-950 p-1">
        <SyntaxHighlighter
          language={activeTab}
          style={vscDarkPlus}
          customStyle={{ margin: 0, padding: '0.875rem', background: 'transparent', fontSize: '0.825rem', lineHeight: '1.5' }}
          showLineNumbers
        >
          {content || '// No content available'}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
