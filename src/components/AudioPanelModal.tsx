import React from 'react';
import { Project } from '../types';
import { playSoundEffect, playSyntheticBackgroundBeat } from '../utils/audio';
import { X, Volume2, Music, Play } from 'lucide-react';

interface AudioPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateProject: (p: Project) => void;
}

export const AudioPanelModal: React.FC<AudioPanelModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
}) => {
  if (!isOpen) return null;

  const currentAudio = project.audioTrack || {
    id: 'cyber-beat',
    title: 'Cyber Synthwave',
    duration: project.duration,
    volume: 0.8,
    syntheticType: 'cyber',
  };

  const handleSelectBeat = (type: 'cyber' | 'energetic' | 'chill' | 'cinematic', title: string) => {
    onUpdateProject({
      ...project,
      audioTrack: {
        id: type,
        title,
        duration: project.duration,
        volume: currentAudio.volume,
        syntheticType: type,
      },
    });
    playSyntheticBackgroundBeat(type, 3);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Audio & Sound FX Panel</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <label className="text-slate-300 text-xs font-semibold block mb-2">Background Beat Theme:</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleSelectBeat('cyber', 'Cyber Synthwave 128BPM')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentAudio.syntheticType === 'cyber' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <span>Cyber Synthwave</span>
                <Play className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleSelectBeat('energetic', 'Heavy Bass EDM 140BPM')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentAudio.syntheticType === 'energetic' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <span>Heavy Bass EDM</span>
                <Play className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleSelectBeat('chill', 'Acoustic Bright 90BPM')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentAudio.syntheticType === 'chill' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <span>Acoustic Vlog Chill</span>
                <Play className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleSelectBeat('cinematic', 'Cinematic Riser 100BPM')}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  currentAudio.syntheticType === 'cinematic' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400 font-bold' : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <span>Cinematic Riser</span>
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 text-xs font-semibold block mb-1">
              Volume Level ({Math.round(currentAudio.volume * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={currentAudio.volume}
              onChange={(e) =>
                onUpdateProject({
                  ...project,
                  audioTrack: { ...currentAudio, volume: parseFloat(e.target.value) },
                })
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <label className="text-slate-300 text-xs font-semibold block mb-2">Test Sound Effects:</label>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              {(['whoosh', 'glitch', 'bassDrop', 'laser', 'stinger', 'pop', 'beep', 'riser'] as const).map((sfx) => (
                <button
                  key={sfx}
                  onClick={() => playSoundEffect(sfx)}
                  className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2 rounded-lg text-center capitalize"
                >
                  🔊 {sfx}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
