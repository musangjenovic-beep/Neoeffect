import React, { useState } from 'react';
import { EasingType, EvaluatedLayerProps, Keyframe, Layer, SoundEffectType } from '../types';
import { evaluateKeyframes } from '../utils/motion';
import { playSoundEffect } from '../utils/audio';
import {
  Sliders,
  Palette,
  Sparkles,
  Type,
  Volume2,
  Zap,
  Move,
  Layers,
  Activity,
  PenTool,
} from 'lucide-react';

interface LayerInspectorPanelProps {
  layer: Layer | null;
  currentTime: number;
  onUpdateLayerKeyframe: (layerId: string, time: number, updates: Partial<EvaluatedLayerProps>) => void;
  onUpdateLayerMeta: (layerId: string, updates: Partial<Layer>) => void;
  selectedKeyframeId: string | null;
  onUpdateKeyframeEasing: (layerId: string, kfId: string, easing: EasingType) => void;
  onClose?: () => void;
}

export const LayerInspectorPanel: React.FC<LayerInspectorPanelProps> = ({
  layer,
  currentTime,
  onUpdateLayerKeyframe,
  onUpdateLayerMeta,
  selectedKeyframeId,
  onUpdateKeyframeEasing,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'transform' | 'appearance' | 'trimPath' | 'glow' | 'text' | 'sfx'>('transform');

  if (!layer) {
    return (
      <aside className="w-80 bg-slate-900 border-l border-slate-800 p-4 text-slate-500 text-xs flex flex-col items-center justify-center text-center select-none relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-slate-500 hover:text-white p-1 rounded"
            title="Close Inspector"
          >
            ✕
          </button>
        )}
        <Sliders className="w-8 h-8 text-slate-700 mb-2" />
        <p className="font-medium text-slate-400">No Layer Selected</p>
        <p className="text-[11px] mt-1 text-slate-600">Tap a layer in the canvas or timeline to inspect and edit properties.</p>
      </aside>
    );
  }

  const evaluated = evaluateKeyframes(layer.keyframes, currentTime);
  const activeKf = layer.keyframes.find((k) => k.id === selectedKeyframeId) || layer.keyframes[0];

  const handlePropChange = (key: keyof EvaluatedLayerProps, val: any) => {
    onUpdateLayerKeyframe(layer.id, currentTime, { [key]: val });
  };

  return (
    <aside className="w-80 bg-slate-900 border-l border-slate-800 text-slate-200 flex flex-col h-full select-none z-10 overflow-hidden flex-shrink-0">
      {/* Layer Name Header */}
      <div className="p-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            value={layer.name}
            onChange={(e) => onUpdateLayerMeta(layer.id, { name: e.target.value })}
            className="bg-transparent font-semibold text-xs sm:text-sm text-white focus:outline-none focus:border-b focus:border-cyan-400 truncate max-w-[140px]"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">
            {layer.type.toUpperCase()}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded hover:bg-slate-800"
              title="Close Inspector"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Accordion Tabs Bar */}
      <div className="grid grid-cols-6 border-b border-slate-800 bg-slate-950 text-xs">
        <button
          onClick={() => setActiveTab('transform')}
          className={`py-2 flex justify-center ${activeTab === 'transform' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          title="Transform"
        >
          <Move className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`py-2 flex justify-center ${activeTab === 'appearance' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          title="Fill & Stroke"
        >
          <Palette className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('trimPath')}
          className={`py-2 flex justify-center ${activeTab === 'trimPath' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          title="Trim Path Write-On"
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTab('glow')}
          className={`py-2 flex justify-center ${activeTab === 'glow' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          title="Glow & Effects"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {layer.type === 'text' && (
          <button
            onClick={() => setActiveTab('text')}
            className={`py-2 flex justify-center ${activeTab === 'text' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
            title="Text Typography"
          >
            <Type className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => setActiveTab('sfx')}
          className={`py-2 flex justify-center ${activeTab === 'sfx' ? 'text-cyan-400 border-b-2 border-cyan-400 font-bold' : 'text-slate-400 hover:text-white'}`}
          title="Keyframe SFX"
        >
          <Volume2 className="w-4 h-4" />
        </button>
      </div>

      {/* Inspector Form Controls */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
        {/* TRANSFORM TAB */}
        {activeTab === 'transform' && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Position X ({evaluated.x}px)</label>
              <input
                type="range"
                min="-400"
                max="400"
                value={evaluated.x}
                onChange={(e) => handlePropChange('x', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Position Y ({evaluated.y}px)</label>
              <input
                type="range"
                min="-400"
                max="400"
                value={evaluated.y}
                onChange={(e) => handlePropChange('y', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Scale X ({evaluated.scaleX.toFixed(2)})</label>
                <input
                  type="range"
                  min="0.05"
                  max="4"
                  step="0.05"
                  value={evaluated.scaleX}
                  onChange={(e) => handlePropChange('scaleX', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Scale Y ({evaluated.scaleY.toFixed(2)})</label>
                <input
                  type="range"
                  min="0.05"
                  max="4"
                  step="0.05"
                  value={evaluated.scaleY}
                  onChange={(e) => handlePropChange('scaleY', parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Rotation ({evaluated.rotation}°)</label>
              <input
                type="range"
                min="-360"
                max="360"
                value={evaluated.rotation}
                onChange={(e) => handlePropChange('rotation', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Opacity ({Math.round(evaluated.opacity * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={evaluated.opacity}
                onChange={(e) => handlePropChange('opacity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Keyframe Easing Selector */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-cyan-400 text-[11px] font-bold block mb-1 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Keyframe Easing Curve</span>
              </label>
              <select
                value={activeKf?.easing || 'easeInOut'}
                onChange={(e) => onUpdateKeyframeEasing(layer.id, activeKf.id, e.target.value as EasingType)}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="linear">Linear (Constant)</option>
                <option value="easeIn">Ease In (Accelerate)</option>
                <option value="easeOut">Ease Out (Decelerate)</option>
                <option value="easeInOut">Ease In Out (Smooth)</option>
                <option value="elastic">Elastic (Spring Bounce)</option>
                <option value="bounce">Bounce Impact</option>
                <option value="cubicBezier">Smooth Sigmoid</option>
              </select>
            </div>
          </div>
        )}

        {/* APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Fill Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={evaluated.fill.startsWith('#') ? evaluated.fill : '#00f0ff'}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={evaluated.fill}
                  onChange={(e) => handlePropChange('fill', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Stroke Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={evaluated.stroke.startsWith('#') ? evaluated.stroke : '#ffffff'}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={evaluated.stroke}
                  onChange={(e) => handlePropChange('stroke', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Stroke Width ({evaluated.strokeWidth}px)</label>
              <input
                type="range"
                min="0"
                max="30"
                value={evaluated.strokeWidth}
                onChange={(e) => handlePropChange('strokeWidth', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TRIM PATH WRITE-ON STROKE TAB */}
        {activeTab === 'trimPath' && (
          <div className="space-y-3">
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-2 rounded text-[11px] text-cyan-300">
              ✨ <strong>After Effects Trim Path:</strong> Animate stroke line drawing in/out smoothly!
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Trim Start ({Math.round(evaluated.trimStart * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={evaluated.trimStart}
                onChange={(e) => handlePropChange('trimStart', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Trim End ({Math.round(evaluated.trimEnd * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={evaluated.trimEnd}
                onChange={(e) => handlePropChange('trimEnd', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* GLOW & FX TAB */}
        {activeTab === 'glow' && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Neon Glow Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={evaluated.glowColor || '#00f0ff'}
                  onChange={(e) => handlePropChange('glowColor', e.target.value)}
                  className="w-8 h-8 rounded bg-transparent border border-slate-700 cursor-pointer"
                />
                <input
                  type="text"
                  value={evaluated.glowColor || '#00f0ff'}
                  onChange={(e) => handlePropChange('glowColor', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Glow Radius ({evaluated.glowRadius || 0}px)</label>
              <input
                type="range"
                min="0"
                max="50"
                value={evaluated.glowRadius || 0}
                onChange={(e) => handlePropChange('glowRadius', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Blur Filter ({evaluated.blur}px)</label>
              <input
                type="range"
                min="0"
                max="30"
                value={evaluated.blur}
                onChange={(e) => handlePropChange('blur', parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TYPOGRAPHY TAB */}
        {activeTab === 'text' && layer.type === 'text' && (
          <div className="space-y-3">
            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Text String</label>
              <textarea
                value={layer.text || ''}
                onChange={(e) => onUpdateLayerMeta(layer.id, { text: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs"
                rows={2}
              />
            </div>

            <div>
              <label className="text-slate-400 text-[11px] block mb-1">Font Family</label>
              <select
                value={layer.fontFamily || 'Inter, sans-serif'}
                onChange={(e) => onUpdateLayerMeta(layer.id, { fontFamily: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="Inter, sans-serif">Inter Clean</option>
                <option value="Montserrat, sans-serif">Montserrat Bold</option>
                <option value="Playfair Display, serif">Playfair Display Serif</option>
                <option value="Teko, sans-serif">Teko Cyber Gaming</option>
                <option value="Outfit, sans-serif">Outfit Modern Tech</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Font Size</label>
                <input
                  type="number"
                  value={layer.fontSize || 48}
                  onChange={(e) => onUpdateLayerMeta(layer.id, { fontSize: parseInt(e.target.value) || 48 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Text Transform</label>
                <select
                  value={layer.textTransform || 'uppercase'}
                  onChange={(e) => onUpdateLayerMeta(layer.id, { textTransform: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                >
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="none">Normal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SFX TRIGGER TAB */}
        {activeTab === 'sfx' && (
          <div className="space-y-3">
            <label className="text-slate-400 text-[11px] block mb-1">Sound Effect Trigger on Entrance</label>
            <select
              value={layer.soundEffect || 'none'}
              onChange={(e) => {
                const sfx = e.target.value as SoundEffectType;
                onUpdateLayerMeta(layer.id, { soundEffect: sfx });
                playSoundEffect(sfx);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
            >
              <option value="none">None</option>
              <option value="whoosh">Whoosh Air Sweep</option>
              <option value="glitch">Cyber Glitch Stutter</option>
              <option value="bassDrop">Sub-Bass Heavy Drop</option>
              <option value="laser">Laser Beam Downslide</option>
              <option value="stinger">Heavy Stinger Impact</option>
              <option value="pop">High Pop Impulse</option>
              <option value="beep">Tech Beep Ping</option>
              <option value="riser">Riser Frequency Slide</option>
            </select>

            <button
              onClick={() => playSoundEffect(layer.soundEffect || 'whoosh')}
              className="w-full bg-slate-800 hover:bg-slate-700 text-cyan-400 py-1.5 rounded border border-slate-700 font-semibold flex items-center justify-center gap-1.5"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Test Sound Effect</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
