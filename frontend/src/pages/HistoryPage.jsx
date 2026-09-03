import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../services/api';
import TemplateViewer from '../components/TemplateViewer';
import ExplanationPanel from '../components/ExplanationPanel';
import { History, Calendar, ChevronDown, ChevronUp, ExternalLink, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await getHistory();
      setHistoryItems(response.data.items || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load history items');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleOpenInDashboard = (item) => {
    // Navigate to dashboard and store state
    navigate('/', {
      state: {
        prompt: item.prompt_text,
        templateYaml: item.generated_template,
        explanation: item.explanation,
        promptId: item.id
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Generation History</h2>
        <p className="text-zinc-400 text-sm">Click on any past prompt below to reopen and inspect its generated CloudFormation template.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12 bg-zinc-900 border border-zinc-800 rounded-xl min-h-[300px]">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : historyItems.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[350px]">
          <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center mb-3">
            <History className="w-5 h-5 text-zinc-500" />
          </div>
          <h3 className="text-sm font-semibold text-white mb-1">No history records yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm">
            Your generated CloudFormation templates will automatically save here. Go to the dashboard to generate your first architecture template.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyItems.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={`bg-zinc-900 border transition-all rounded-xl overflow-hidden ${
                  isExpanded ? 'border-zinc-700 shadow-md' : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Card Bar */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none hover:bg-zinc-800/40"
                >
                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        ID #{item.id}
                      </span>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white line-clamp-2">
                      {item.prompt_text}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInDashboard(item);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-zinc-950 bg-white hover:bg-zinc-200 rounded-md transition-colors flex items-center gap-1.5"
                    >
                      <span>Open in Dashboard</span>
                      <ExternalLink className="w-3 h-3 text-zinc-950" />
                    </button>

                    <button className="p-1.5 text-zinc-400 hover:text-white bg-zinc-800 rounded-md border border-zinc-700">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Template & Explanation Content */}
                {isExpanded && (
                  <div className="p-5 border-t border-zinc-800 bg-zinc-950 space-y-6">
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                        <span>CloudFormation Template</span>
                      </h4>
                      <div className="min-h-[300px]">
                        <TemplateViewer templateYaml={item.generated_template} />
                      </div>
                    </div>

                    {item.explanation && (
                      <div className="space-y-2">
                        <ExplanationPanel explanation={item.explanation} />
                      </div>
                    )}
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
