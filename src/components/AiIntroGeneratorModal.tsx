import React, { useState } from 'react';
import { Project } from '../types';
import { Sparkles, Loader2, X, Wand2, ArrowRight } from 'lucide-react';

interface AiIntroGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyGeneratedProject: (project: Project) => void;
  currentAspectRatio: string;
}

const PROMPT_SUGGESTIONS = [
  'Cyberpunk gaming intro with neon purple badge and electric kinetic text OVERKILL',
  'Minimalist clean tech logo reveal for NEXUS with elastic write-on lines',
  'Organic wave pastel intro for a travel vlog channel LILY VLOGS',
  'Golden luxury starburst reveal for an executive channel ELITE VISION',
  'Heavy EDM energy burst with glitching text and sub-bass drop',
];

export const AiIntroGeneratorModal: React.FC<AiIntroGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyGeneratedProject,
  currentAspectRatio,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-generate-intro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          aspectRatio: currentAspectRatio,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.project) {
        throw new Error(data.error || 'Failed to generate AI Motion Intro');
      }

      onApplyGeneratedProject(data.project);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error connecting to AI Intro Generator service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900/40 to-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">AI Motion Intro Wizard</h3>
              <p className="text-[11px] text-purple-300">Powered by Gemini 3.6 Flash Server Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-slate-300 text-xs font-semibold block mb-1">
              Describe your desired motion intro style & title:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create an epic sci-fi neon logo intro with kinetic write-on text 'AURA TECH'..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
          </div>

          {/* Prompt Suggestions */}
          <div>
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Try a preset AI prompt:</span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(sug)}
                  className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-purple-300 px-2.5 py-1 rounded-lg text-left transition-colors"
                >
                  ✨ {sug}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">{error}</div>}

          {/* Action Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-yellow-300" />
                <span>Designing Animated SVG Layers with Gemini AI...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-yellow-300" />
                <span>Generate Intro Project Setup</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
