import { useState, useEffect } from 'react';
import { getHistory } from '../services/api';
import { History, Calendar, FileCode, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="flex flex-col gap-6 h-full pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Generation History</h2>
        <p className="text-zinc-400 text-sm">View and track all your previously generated infrastructure templates.</p>
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
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 max-w-2xl">
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

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Template Saved</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
