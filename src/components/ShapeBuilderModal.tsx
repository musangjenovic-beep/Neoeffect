import React, { useState } from 'react';
import { ShapeKind } from '../types';
import { generateShapePath } from '../utils/motion';
import { X, Shapes, Code, Check } from 'lucide-react';

interface ShapeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddShape: (kind: ShapeKind, name: string, svgPath?: string) => void;
}

const PRESET_SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: 'rect', label: 'Rounded Rect' },
  { kind: 'circle', label: 'Circle' },
  { kind: 'ring', label: 'Glow Ring' },
  { kind: 'badge', label: 'Cyber Shield' },
  { kind: 'polygon', label: 'Hexagon' },
  { kind: 'star', label: 'Star' },
  { kind: 'cyberGrid', label: 'Tech Frame' },
  { kind: 'wave', label: 'Organic Wave' },
  { kind: 'burst', label: 'Energy Burst' },
  { kind: 'heart', label: 'Heart' },
  { kind: 'arrow', label: 'Arrow' },
];

export const ShapeBuilderModal: React.FC<ShapeBuilderModalProps> = ({
  isOpen,
  onClose,
  onAddShape,
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [customPath, setCustomPath] = useState('');
  const [customName, setCustomName] = useState('Custom SVG Path');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shapes className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">SVG Shape Builder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2.5 text-center transition-all ${
              activeTab === 'preset' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Preset Shapes Grid
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2.5 text-center transition-all ${
              activeTab === 'custom' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            Custom SVG Path Code
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'preset' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {PRESET_SHAPES.map((item) => {
                const pathD = generateShapePath(item.kind, 60);
                return (
                  <button
                    key={item.kind}
                    onClick={() => {
                      onAddShape(item.kind, item.label);
                      onClose();
                    }}
                    className="flex flex-col items-center justify-center p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all hover:scale-105 group"
                  >
                    <svg className="w-12 h-12 text-cyan-400 group-hover:text-pink-400 transition-colors" viewBox="-50 -50 100 100">
                      <path d={pathD} fill="rgba(0, 240, 255, 0.15)" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="text-[11px] font-medium text-slate-300 mt-2 text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-xs block mb-1">Layer Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs block mb-1">SVG Path Code (d attribute)</label>
                <textarea
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="e.g. M 0 -50 L 50 50 L -50 50 Z"
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-cyan-300"
                />
              </div>

              <button
                onClick={() => {
                  if (customPath.trim()) {
                    onAddShape('rect', customName, customPath.trim());
                    onClose();
                  }
                }}
                disabled={!customPath.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Add Custom SVG Shape</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
