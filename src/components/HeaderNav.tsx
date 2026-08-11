import React from 'react';
import {
  Play,
  Pause,
  Download,
  Sparkles,
  Layers,
  Smartphone,
  Tv,
  Square,
  Volume2,
  FolderOpen,
  Save,
  RotateCcw,
} from 'lucide-react';
import { AspectRatio, Project } from '../types';
import { PRESET_TEMPLATES } from '../utils/templates';

interface HeaderNavProps {
  project: Project;
  onUpdateProject: (p: Project) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenAiModal: () => void;
  onOpenExportModal: () => void;
  onOpenAudioModal: () => void;
  onResetProject: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  isTimelineCollapsed: boolean;
  onToggleTimeline: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  project,
  onUpdateProject,
  isPlaying,
  onTogglePlay,
  onOpenAiModal,
  onOpenExportModal,
  onOpenAudioModal,
  onResetProject,
  isInspectorOpen,
  onToggleInspector,
  isTimelineCollapsed,
  onToggleTimeline,
}) => {
  const handleRatioChange = (ratio: AspectRatio) => {
    onUpdateProject({ ...project, aspectRatio: ratio });
  };

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const found = PRESET_TEMPLATES.find((t) => t.id === templateId);
    if (found) {
      onUpdateProject(JSON.parse(JSON.stringify(found)));
    }
  };

  const handleSaveJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${project.title.toLowerCase().replace(/\s+/g, '-')}-project.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleLoadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string);
          if (parsed && parsed.layers) {
            onUpdateProject(parsed);
          }
        } catch {
          alert('Invalid project JSON file');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800/80 text-white px-2 py-1 flex items-center justify-between gap-1.5 select-none z-30 min-h-[42px] overflow-x-auto">
      {/* Title Input (Compact without logo) */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="text"
          value={project.title}
          onChange={(e) => onUpdateProject({ ...project, title: e.target.value })}
          className="bg-transparent font-bold text-xs sm:text-sm text-cyan-300 focus:outline-none focus:border-b focus:border-cyan-400 px-1 w-28 sm:w-36 truncate"
        />
      </div>

      {/* Templates & AI Button */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <select
          onChange={handleTemplateSelect}
          className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg text-[11px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500 max-w-[130px] truncate"
          defaultValue=""
        >
          <option value="" disabled>
            ✨ Templates...
          </option>
          {PRESET_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>

        <button
          onClick={onOpenAiModal}
          className="flex items-center gap-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow transition-all active:scale-95"
        >
          <Sparkles className="w-3 h-3 text-yellow-300 animate-pulse" />
          <span className="hidden sm:inline">AI Intro Wizard</span>
        </button>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] flex-shrink-0">
        <button
          onClick={() => handleRatioChange('16:9')}
          title="16:9 Landscape"
          className={`px-1.5 py-0.5 rounded font-medium transition-all ${
            project.aspectRatio === '16:9' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tv className="w-3 h-3" />
        </button>

        <button
          onClick={() => handleRatioChange('9:16')}
          title="9:16 Vertical Shorts"
          className={`px-1.5 py-0.5 rounded font-medium transition-all ${
            project.aspectRatio === '9:16' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-3 h-3" />
        </button>

        <button
          onClick={() => handleRatioChange('1:1')}
          title="1:1 Square"
          className={`px-1.5 py-0.5 rounded font-medium transition-all ${
            project.aspectRatio === '1:1' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Square className="w-3 h-3" />
        </button>
      </div>

      {/* Playhead Control & Toggle Panels */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onTogglePlay}
          className={`p-1.5 rounded-full font-bold transition-all shadow active:scale-90 ${
            isPlaying ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
          }`}
          title={isPlaying ? 'Pause' : 'Play Intro'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
        </button>

        <button
          onClick={onOpenAudioModal}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg text-xs"
          title="Audio & SFX"
        >
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        <button
          onClick={onToggleInspector}
          className={`px-2 py-1 border rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
            isInspectorOpen
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle Inspector Drawer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Inspector</span>
        </button>

        <button
          onClick={onToggleTimeline}
          className={`px-2 py-1 border rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
            !isTimelineCollapsed
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
          title="Toggle Timeline Panel"
        >
          <span className="hidden md:inline">Timeline</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="flex items-center gap-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] px-2.5 py-1 rounded-lg shadow transition-all active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export MP4</span>
        </button>

        <button
          onClick={handleSaveJson}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 hidden sm:block"
          title="Save Project JSON"
        >
          <Save className="w-3.5 h-3.5" />
        </button>

        <label className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 cursor-pointer hidden sm:block" title="Load Project JSON">
          <FolderOpen className="w-3.5 h-3.5" />
          <input type="file" accept=".json" onChange={handleLoadJson} className="hidden" />
        </label>

        <button
          onClick={onResetProject}
          className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800"
          title="Reset Canvas"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
