export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Generation History</h2>
        <p className="text-slate-500">View and manage your previously generated infrastructure templates.</p>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center p-12 text-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No history yet</h3>
        <p className="text-slate-500 max-w-sm">
          Your past generations will appear here. Go to the dashboard to create your first AWS template.
        </p>
      </div>
    </div>
  );
}
