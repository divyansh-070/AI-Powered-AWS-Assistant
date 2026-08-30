import { useState } from 'react';
import { Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  "Create a web app with EC2, RDS MySQL, and S3 bucket",
  "Set up a serverless API with Lambda and DynamoDB",
  "Deploy a static website with S3 and CloudFront",
  "Create a VPC with public and private subnets"
];

export default function PromptInput({ onSubmit, isLoading }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
      <form onSubmit={handleSubmit} className="p-6">
        <label htmlFor="prompt" className="block text-sm font-semibold text-slate-700 mb-2">
          Describe your architecture
        </label>
        <textarea
          id="prompt"
          rows={4}
          disabled={isLoading}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your AWS infrastructure in plain English..."
          className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-500 resize-none"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isLoading}
              onClick={() => setPrompt(suggestion)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {isLoading ? "Generating..." : "Generate Template"}
          </button>
        </div>
      </form>
    </div>
  );
}
