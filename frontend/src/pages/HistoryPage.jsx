import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Generation History</h2>
        <p className="text-zinc-400 text-sm">View and manage your previously generated infrastructure templates.</p>
      </div>
      
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-center mb-3">
          <History className="w-5 h-5 text-zinc-500" />
        </div>
        <h3 className="text-sm font-semibold text-white mb-1">No history yet</h3>
        <p className="text-xs text-zinc-400 max-w-sm">
          Your past generations will appear here. Go to the dashboard to create your first AWS template.
        </p>
      </div>
    </div>
  );
}
