import React from 'react';
import {
  Shapes,
  Type,
  Code,
  Copy,
  Scissors,
  Volume2,
  Sliders,
  Plus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Zap,
} from 'lucide-react';

interface TouchToolbarProps {
  onOpenShapeModal: () => void;
  onAddTextLayer: () => void;
  onAddPathModal: () => void;
  onDuplicateSelected: () => void;
  onSplitSelected: () => void;
  onOpenAudioModal: () => void;
  selectedCount: number;
  onAlignLayers: (mode: 'left' | 'center' | 'right') => void;
  onAddKeyframeAtPlayhead: () => void;
}

export const TouchToolbar: React.FC<TouchToolbarProps> = ({
  onOpenShapeModal,
  onAddTextLayer,
  onAddPathModal,
  onDuplicateSelected,
  onSplitSelected,
  onOpenAudioModal,
  selectedCount,
  onAlignLayers,
  onAddKeyframeAtPlayhead,
}) => {
  return (
    <div className="bg-slate-900 border-t border-slate-800 text-slate-200 p-2 flex items-center justify-between gap-1 overflow-x-auto select-none z-20">
      {/* Primary Creation Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenShapeModal}
          className="flex items-center gap-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
        >
          <Shapes className="w-4 h-4" />
          <span>+ Shape</span>
        </button>

        <button
          onClick={onAddTextLayer}
          className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
        >
          <Type className="w-4 h-4" />
          <span>+ Text</span>
        </button>

        <button
          onClick={onAddPathModal}
          className="flex items-center gap-1.5 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border border-pink-500/30 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
        >
          <Code className="w-4 h-4" />
          <span>+ SVG Path</span>
        </button>
      </div>

      {/* Layer Operations for Selected Layers */}
      <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
        <button
          onClick={onAddKeyframeAtPlayhead}
          disabled={selectedCount === 0}
          className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 disabled:opacity-40 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
          title="Add Keyframe at Playhead"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Keyframe</span>
        </button>

        <button
          onClick={onDuplicateSelected}
          disabled={selectedCount === 0}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 rounded-xl transition-all active:scale-95"
          title="Duplicate Layer"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={onSplitSelected}
          disabled={selectedCount === 0}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 rounded-xl transition-all active:scale-95"
          title="Split Layer"
        >
          <Scissors className="w-4 h-4" />
        </button>
      </div>

      {/* Multi-Layer Alignment Quick Tools */}
      {selectedCount > 1 && (
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span className="text-[10px] text-cyan-400 font-bold px-1">{selectedCount} Selected:</span>
          <button
            onClick={() => onAlignLayers('left')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 text-xs"
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignLayers('center')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 text-xs"
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onAlignLayers('right')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 text-xs"
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
