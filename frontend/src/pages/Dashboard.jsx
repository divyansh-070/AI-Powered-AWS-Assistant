import { useState } from 'react';
import toast from 'react-hot-toast';
import PromptInput from '../components/PromptInput';
import ResultsTabs from '../components/ResultsTabs';
import { generateTemplate } from '../services/api';

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
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Design Infrastructure</h2>
        <p className="text-slate-500">Describe what you want to build, and AI will generate the AWS CloudFormation template for you.</p>
      </div>
      
      <PromptInput onSubmit={handleGenerate} isLoading={isLoading} />
      
      <ResultsTabs results={results} />
    </div>
  );
}
