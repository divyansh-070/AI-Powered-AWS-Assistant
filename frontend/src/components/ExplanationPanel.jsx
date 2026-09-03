import { Lightbulb } from 'lucide-react';

export default function ExplanationPanel({ explanation }) {
  if (!explanation) {
    return (
      <div className="p-8 text-center text-zinc-500 bg-zinc-950 rounded-lg border border-zinc-800">
        No explanation available.
      </div>
    );
  }

  // Basic markdown parsing for paragraphs and bullet points
  const formatText = (text) => {
    const blocks = text.split('\n\n');
    return blocks.map((block, i) => {
      if (block.startsWith('- ') || block.startsWith('* ')) {
        const items = block.split('\n').filter(line => line.trim().match(/^[-*]\s/));
        return (
          <ul key={i} className="list-disc pl-5 mb-4 text-zinc-300 space-y-1 text-sm">
            {items.map((item, j) => (
              <li key={j}>{item.replace(/^[-*]\s/, '')}</li>
            ))}
          </ul>
        );
      }
      return <p key={i} className="mb-4 text-zinc-300 leading-relaxed text-sm">{block}</p>;
    });
  };

  return (
    <div className="bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-zinc-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Architecture Explanation</h3>
      </div>
      <div className="p-5 text-zinc-300 font-sans">
        {formatText(explanation)}
      </div>
    </div>
  );
}
