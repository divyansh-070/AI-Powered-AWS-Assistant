import { Lightbulb } from 'lucide-react';

export default function ExplanationPanel({ explanation }) {
  if (!explanation) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        No explanation available.
      </div>
    );
  }

  // Very basic markdown parsing for paragraphs and bullet points
  const formatText = (text) => {
    const blocks = text.split('\n\n');
    return blocks.map((block, i) => {
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const items = block.split('\n').filter(line => line.trim().match(/^[-*]\s/));
        return (
          <ul key={i} className="list-disc pl-5 mb-4 text-slate-700 space-y-1">
            {items.map((item, j) => (
              <li key={j}>{item.replace(/^[-*]\s/, '')}</li>
            ))}
          </ul>
        );
      }
      return <p key={i} className="mb-4 text-slate-700 leading-relaxed">{block}</p>;
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold text-slate-800">Architecture Explanation</h3>
      </div>
      <div className="p-6 prose prose-slate max-w-none">
        {formatText(explanation)}
      </div>
    </div>
  );
}
