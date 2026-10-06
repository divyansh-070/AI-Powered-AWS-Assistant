import { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Network, ZoomIn, ZoomOut, RotateCcw, Copy, Check, Download, Code2, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DiagramViewer({ diagramCode, isLoading, onGenerate }) {
  const [svgContent, setSvgContent] = useState('');
  const [renderError, setRenderError] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showRawCode, setShowRawCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#09090b',
        primaryColor: '#3b82f6',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#1d4ed8',
        lineColor: '#64748b',
        secondaryColor: '#1e293b',
        tertiaryColor: '#0f172a'
      }
    });
  }, []);

  useEffect(() => {
    if (!diagramCode) return;

    let isMounted = true;
    const renderDiagram = async () => {
      setRenderError(null);
      const uniqueId = 'mermaid-render-' + Math.random().toString(36).substring(2, 9);
      try {
        const { svg } = await mermaid.render(uniqueId, diagramCode);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setRenderError(err?.message || 'Failed to render Mermaid diagram.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [diagramCode]);

  const handleCopyCode = () => {
    if (!diagramCode) return;
    navigator.clipboard.writeText(diagramCode);
    setCopied(true);
    toast.success('Copied Mermaid syntax to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aws-architecture-diagram.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Downloaded architecture diagram (SVG)');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[380px] text-zinc-400 gap-3">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-zinc-300">Synthesizing AWS Architecture Topology Diagram...</p>
      </div>
    );
  }

  if (!diagramCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-zinc-400 text-center p-8 bg-zinc-900/40 rounded-lg border border-zinc-800 border-dashed">
        <Network className="w-8 h-8 text-zinc-500 mb-2" />
        <p className="text-sm text-zinc-300 font-medium mb-1">No Architecture Diagram Generated Yet</p>
        <p className="text-xs text-zinc-500 max-w-sm mb-4">Generate the visual topology to inspect directional dependencies between VPC, EC2, RDS, and S3.</p>
        {onGenerate && (
          <button
            onClick={onGenerate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Generate Architecture Diagram</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Control Toolbar */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-300 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawCode(!showRawCode)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            {showRawCode ? <Eye className="w-3.5 h-3.5" /> : <Code2 className="w-3.5 h-3.5" />}
            <span>{showRawCode ? 'Visual Diagram' : 'View Mermaid Code'}</span>
          </button>

          {onGenerate && (
            <button
              onClick={onGenerate}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-generate</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom Controls */}
          {!showRawCode && (
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md p-0.5 mr-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                title="Zoom Out"
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-mono text-zinc-400">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(2.0, z + 0.15))}
                title="Zoom In"
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1)}
                title="Reset Zoom"
                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Syntax'}</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download SVG</span>
          </button>
        </div>
      </div>

      {/* Main Diagram Canvas or Code Viewer */}
      {showRawCode ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
          <pre>{diagramCode}</pre>
        </div>
      ) : renderError ? (
        <div className="bg-zinc-900 border border-red-500/30 rounded-xl p-6 text-center text-red-400 text-xs">
          <p className="font-semibold mb-1">Failed to render diagram</p>
          <p className="text-zinc-400 font-mono text-[11px] mb-3">{renderError}</p>
          <button
            onClick={() => setShowRawCode(true)}
            className="px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-md hover:bg-zinc-700"
          >
            Inspect Raw Mermaid Syntax
          </button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 min-h-[440px] flex items-center justify-center overflow-auto shadow-inner"
        >
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}
            className="w-full flex justify-center"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
}
