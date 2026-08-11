import React, { useRef } from 'react';
import { Keyframe, Layer, Project } from '../types';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Volume2,
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react';

interface TimelinePanelProps {
  project: Project;
  currentTime: number;
  onSeekTime: (time: number) => void;
  selectedLayerIds: string[];
  onSelectLayer: (id: string, multiSelect?: boolean) => void;
  onSelectAllLayers: () => void;
  onUpdateLayer: (updatedLayer: Layer) => void;
  onDeleteLayer: (id: string) => void;
  onMoveLayerZIndex: (id: string, direction: 'up' | 'down') => void;
  selectedKeyframeId: string | null;
  onSelectKeyframe: (kfId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  project,
  currentTime,
  onSeekTime,
  selectedLayerIds,
  onSelectLayer,
  onSelectAllLayers,
  onUpdateLayer,
  onDeleteLayer,
  onMoveLayerZIndex,
  selectedKeyframeId,
  onSelectKeyframe,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeekTime(progress * project.duration);
  };

  return (
    <div
      className={`bg-slate-900 border-t border-slate-800 text-slate-200 flex flex-col transition-all duration-300 ease-in-out select-none z-10 ${
        isCollapsed ? 'h-10 overflow-hidden' : 'h-52'
      }`}
    >
      {/* Timeline Header Ruler Bar */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950 px-2 py-1 text-xs h-10">
        {/* Layer Controls Title & Expand Button */}
        <div className="w-48 sm:w-56 flex items-center justify-between font-bold text-slate-300 text-[11px] uppercase tracking-wider pr-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSelectAllLayers}
              className="text-cyan-400 hover:text-cyan-300 transition-all"
              title="Select All Layers"
            >
              {selectedLayerIds.length === project.layers.length && project.layers.length > 0 ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span className="truncate">Layers ({project.layers.length})</span>
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-cyan-400 hover:text-cyan-200 hover:bg-slate-800 rounded transition-colors"
              title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline Down'}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Time Ruler Scrubber Bar */}
        <div
          ref={rulerRef}
          onClick={handleRulerClick}
          className="flex-1 relative h-7 bg-slate-900/90 border-l border-slate-800 cursor-pointer overflow-hidden rounded-r"
        >
          {/* Ticks */}
          {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 border-l border-slate-700/60 flex flex-col justify-between pointer-events-none"
              style={{ left: `${(i / project.duration) * 100}%` }}
            >
              <span className="text-[9px] font-mono text-slate-500 pl-1">{i}s</span>
            </div>
          ))}

          {/* Current Playhead Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-20 pointer-events-none"
            style={{ left: `${(currentTime / project.duration) * 100}%` }}
          >
            <div className="w-2.5 h-2.5 bg-cyan-400 -translate-x-1/2 rotate-45 shadow-md shadow-cyan-400/50" />
          </div>
        </div>
      </div>

      {/* Layer Tracks Scroll Area */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {project.layers.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No layers added yet. Tap <span className="text-cyan-400 font-bold">+ Shape</span> or{' '}
              <span className="text-indigo-400 font-bold">+ Text</span> to create your first layer!
            </div>
          ) : (
            [...project.layers]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((layer) => {
                const isSelected = selectedLayerIds.includes(layer.id);
                return (
                  <div
                    key={layer.id}
                    className={`flex items-center h-9 px-2 text-xs transition-colors ${
                      isSelected ? 'bg-cyan-500/10 border-l-2 border-cyan-400' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Layer Meta Info & Actions */}
                    <div className="w-48 sm:w-56 flex items-center justify-between gap-1 pr-2 border-r border-slate-800/80">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <button
                          onClick={() => onSelectLayer(layer.id, true)}
                          className={`text-slate-400 hover:text-cyan-400 ${isSelected ? 'text-cyan-400' : ''}`}
                        >
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </button>

                        <span
                          onClick={(e) => onSelectLayer(layer.id, e.shiftKey)}
                          className="truncate font-medium text-slate-200 cursor-pointer max-w-[90px] sm:max-w-[110px]"
                          title={layer.name}
                        >
                          {layer.name}
                        </span>

                        {layer.soundEffect && layer.soundEffect !== 'none' && (
                          <Volume2 className="w-3 h-3 text-amber-400 flex-shrink-0" title={`SFX: ${layer.soundEffect}`} />
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => onUpdateLayer({ ...layer, visible: !layer.visible })}
                          className="p-1 hover:text-cyan-400 text-slate-400"
                          title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                        </button>

                        <button
                          onClick={() => onMoveLayerZIndex(layer.id, 'up')}
                          className="p-0.5 hover:text-cyan-400 text-slate-400"
                          title="Move Z-Index Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onMoveLayerZIndex(layer.id, 'down')}
                          className="p-0.5 hover:text-cyan-400 text-slate-400"
                          title="Move Z-Index Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => onDeleteLayer(layer.id)}
                          className="p-1 hover:text-rose-400 text-slate-500"
                          title="Delete Layer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Keyframe Track Canvas */}
                    <div className="flex-1 relative h-full bg-slate-900/40">
                      {layer.keyframes.map((kf) => {
                        const leftPct = (kf.time / project.duration) * 100;
                        const isKfSelected = selectedKeyframeId === kf.id;
                        return (
                          <div
                            key={kf.id}
                            onClick={() => {
                              onSelectLayer(layer.id);
                              onSelectKeyframe(kf.id);
                              onSeekTime(kf.time);
                            }}
                            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 border cursor-pointer transition-transform hover:scale-125 z-10 ${
                              isKfSelected
                                ? 'bg-amber-400 border-white shadow-lg shadow-amber-400/50 scale-125'
                                : 'bg-cyan-500 border-cyan-300'
                            }`}
                            style={{ left: `${leftPct}%` }}
                            title={`Keyframe at ${kf.time.toFixed(2)}s (${kf.easing})`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
};
