import { useState, useEffect } from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';

const SUGGESTIONS = [
  "Create a web app with EC2, RDS MySQL, and S3 bucket",
  "Set up a serverless API with Lambda and DynamoDB",
  "Deploy a static website with S3 and CloudFront",
  "Create a VPC with public and private subnets"
];

export default function PromptInput({ onSubmit, isLoading, resetKey }) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (resetKey) {
      setPrompt("");
    }
  }, [resetKey]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-5 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-between mb-2.5">
          <label htmlFor="prompt" className="text-xs font-medium uppercase tracking-wider text-zinc-400">
            Prompt
          </label>
        </div>

        <textarea
          id="prompt"
          rows={4}
          disabled={isLoading}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your AWS infrastructure in plain English..."
          className="w-full p-3.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none text-sm disabled:opacity-50"
        />

        {/* Suggestion Chips */}
        <div className="mt-3.5">
          <p className="text-[11px] text-zinc-500 mb-2 font-medium">Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => setPrompt(suggestion)}
                className="text-xs px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <span>{suggestion}</span>
                <ArrowUpRight className="w-3 h-3 text-zinc-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-xs text-zinc-950 bg-white hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            {isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-zinc-950" />
            )}
            <span>{isLoading ? "Generating..." : "Generate Template"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
