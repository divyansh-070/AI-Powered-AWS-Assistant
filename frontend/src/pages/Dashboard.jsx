import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import PromptInput from '../components/PromptInput';
import ResultsTabs from '../components/ResultsTabs';
import { generateTemplate, estimateCost, securityCheck, generateDiagram } from '../services/api';
import { FileCode, ShieldCheck, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const [isLoadingSecurity, setIsLoadingSecurity] = useState(false);
  const [isLoadingDiagram, setIsLoadingDiagram] = useState(false);
  const [results, setResults] = useState(null);
  const [initialPrompt, setInitialPrompt] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const runAnalysis = async (templateYaml) => {
    if (!templateYaml) return;

    setIsLoadingCost(true);
    setIsLoadingSecurity(true);
    setIsLoadingDiagram(true);

    try {
      const [costRes, secRes, diagRes] = await Promise.allSettled([
        estimateCost(templateYaml),
        securityCheck(templateYaml),
        generateDiagram(templateYaml)
      ]);

      setResults((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          costEstimate: costRes.status === 'fulfilled' ? costRes.value.data : prev.costEstimate,
          securityReport: secRes.status === 'fulfilled' ? secRes.value.data : prev.securityReport,
          diagramCode: diagRes.status === 'fulfilled' ? diagRes.value.data?.mermaid_code : prev.diagramCode,
        };
      });
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setIsLoadingCost(false);
      setIsLoadingSecurity(false);
      setIsLoadingDiagram(false);
    }
  };

  // Listen for navigation state from History page
  useEffect(() => {
    if (location.state && location.state.templateYaml) {
      const tYaml = location.state.templateYaml;
      setInitialPrompt(location.state.prompt || "");
      setResults({
        templateYaml: tYaml,
        templateJson: location.state.templateJson || {},
        explanation: location.state.explanation || "",
        promptId: location.state.promptId,
        costEstimate: location.state.costEstimate || null,
        securityReport: location.state.securityReport || null,
        diagramCode: location.state.diagramCode || null,
      });
      toast.success("Loaded template from history!");

      // If missing analysis, run it
      if (!location.state.costEstimate || !location.state.securityReport || !location.state.diagramCode) {
        runAnalysis(tYaml);
      }
    }
  }, [location.state]);

  // Listen for ?new=true from "New Idea" sidebar button
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setResults(null);
      setInitialPrompt("");
      setResetKey(prev => prev + 1);
      setSearchParams({});
      toast.success('Started a new architecture workspace');
    }
  }, [searchParams, setSearchParams]);

  const handleGenerate = async (prompt) => {
    setIsLoading(true);
    try {
      const response = await generateTemplate(prompt);
      const data = response.data;
      const tYaml = data.template_yaml;

      const newResults = {
        templateYaml: tYaml,
        templateJson: data.template_json,
        explanation: data.explanation,
        promptId: data.prompt_id,
        costEstimate: null,
        securityReport: null,
        diagramCode: null,
      };

      setResults(newResults);
      toast.success('Template generated successfully! Analyzing cost, security, & topology...');

      // Run parallel Phase 2 analysis
      runAnalysis(tYaml);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || 'Failed to generate template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCost = async (region = 'us-east-1') => {
    if (!results?.templateYaml) return;
    setIsLoadingCost(true);
    try {
      const res = await estimateCost(results.templateYaml);
      setResults((prev) => ({ ...prev, costEstimate: res.data }));
      toast.success('Updated cost estimate');
    } catch (err) {
      toast.error('Failed to update cost estimate');
    } finally {
      setIsLoadingCost(false);
    }
  };

  const handleAuditSecurity = async () => {
    if (!results?.templateYaml) return;
    setIsLoadingSecurity(true);
    try {
      const res = await securityCheck(results.templateYaml);
      setResults((prev) => ({ ...prev, securityReport: res.data }));
      toast.success('Security audit refreshed');
    } catch (err) {
      toast.error('Failed to run security audit');
    } finally {
      setIsLoadingSecurity(false);
    }
  };

  const handleGenerateDiagram = async () => {
    if (!results?.templateYaml) return;
    setIsLoadingDiagram(true);
    try {
      const res = await generateDiagram(results.templateYaml);
      setResults((prev) => ({ ...prev, diagramCode: res.data?.mermaid_code }));
      toast.success('Architecture diagram updated');
    } catch (err) {
      toast.error('Failed to generate diagram');
    } finally {
      setIsLoadingDiagram(false);
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
          Describe your AWS infrastructure requirements in plain English, and the assistant will generate valid CloudFormation templates, security audits, cost estimates, and topology diagrams.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <FileCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>CloudFormation YAML & JSON</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>CIS Security Auditing</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monthly Cost Estimation</span>
          </span>
        </div>
      </div>
      
      {/* Input Form */}
      <PromptInput onSubmit={handleGenerate} isLoading={isLoading} resetKey={resetKey} initialPrompt={initialPrompt} />
      
      {/* Results Container */}
      <ResultsTabs
        results={results}
        isLoadingCost={isLoadingCost}
        isLoadingSecurity={isLoadingSecurity}
        isLoadingDiagram={isLoadingDiagram}
        onRefreshCost={handleRefreshCost}
        onAuditSecurity={handleAuditSecurity}
        onGenerateDiagram={handleGenerateDiagram}
      />
    </div>
  );
}
