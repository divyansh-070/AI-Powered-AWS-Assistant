import { useState } from 'react';
import toast from 'react-hot-toast';
import PromptInput from '../components/PromptInput';
import ResultsTabs from '../components/ResultsTabs';
import { generateTemplate } from '../services/api';
import { FileCode, ShieldCheck, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerate = async (prompt) => {
    setIsLoading(true);
    try {
      const response = await generateTemplate(prompt);
      const data = response.data;
      setResults({
        templateYaml: data.template_yaml,
        templateJson: data.template_json,
        explanation: data.explanation,
        promptId: data.prompt_id,
      });
      toast.success('Template generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to generate template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Banner */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">
          Design Infrastructure
        </h2>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Describe your AWS infrastructure requirements in plain English, and the assistant will generate valid CloudFormation templates.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>CloudFormation YAML & JSON</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
            <span>Security Rule Validation</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
            <span>Cost Estimation</span>
          </span>
        </div>
      </div>
      
      {/* Input Form */}
      <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />
      
      {/* Results Container */}
      <ResultsTabs results={results} />
    </div>
  );
}
