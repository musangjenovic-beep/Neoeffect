import React, { useState } from 'react';
import { Project } from '../types';
import { renderProjectToVideo } from '../utils/exporter';
import { X, Download, Film, Loader2, CheckCircle2, Play } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [resolution, setResolution] = useState<'1080p' | '720p' | '4k'>('1080p');
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsRendering(true);
    setProgress(0);
    setProgressMsg('Initializing Canvas frame renderer...');
    setVideoUrl(null);

    let width = 1920;
    let height = 1080;

    if (project.aspectRatio === '9:16') {
      width = resolution === '4k' ? 2160 : resolution === '1080p' ? 1080 : 720;
      height = resolution === '4k' ? 3840 : resolution === '1080p' ? 1920 : 1280;
    } else if (project.aspectRatio === '1:1') {
      width = resolution === '4k' ? 2160 : resolution === '1080p' ? 1080 : 720;
      height = width;
    } else {
      width = resolution === '4k' ? 3840 : resolution === '1080p' ? 1920 : 1280;
      height = resolution === '4k' ? 2160 : resolution === '1080p' ? 1080 : 720;
    }

    try {
      const blob = await renderProjectToVideo(
        project,
        width,
        height,
        (pct, msg) => {
          setProgress(pct);
          setProgressMsg(msg);
        }
      );

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
    } catch (err: any) {
      alert('Export failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Export MP4 / WebM Intro</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {!videoUrl && !isRendering && (
            <>
              <div>
                <label className="text-slate-300 text-xs font-semibold block mb-1">Select Output Resolution:</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => setResolution('720p')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      resolution === '720p' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    720p HD
                  </button>
                  <button
                    onClick={() => setResolution('1080p')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      resolution === '1080p' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    1080p Full HD
                  </button>
                  <button
                    onClick={() => setResolution('4k')}
                    className={`py-2 rounded-xl font-bold border transition-all ${
                      resolution === '4k' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-400' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    4K Ultra HD
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  • Format: <span className="text-slate-200 font-bold">MP4 / WebM Video</span>
                </p>
                <p>
                  • Duration: <span className="text-slate-200 font-bold">{project.duration} seconds</span>
                </p>
                <p>
                  • Frame Rate: <span className="text-slate-200 font-bold">{project.fps} FPS</span>
                </p>
              </div>

              <button
                onClick={handleStartExport}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Film className="w-4 h-4" />
                <span>Start Video Render Process</span>
              </button>
            </>
          )}

          {/* Rendering Progress Indicator */}
          {isRendering && (
            <div className="py-6 space-y-3 text-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="font-bold text-white text-sm">Synthesizing Frames ({progress}%)</p>
              <p className="text-xs text-slate-400 font-mono">{progressMsg}</p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Completed Video Player & Download Link */}
          {videoUrl && !isRendering && (
            <div className="space-y-3 text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Render Completed Successfully!</span>
              </div>

              <video src={videoUrl} controls autoPlay loop className="w-full max-h-56 rounded-xl border border-slate-800 bg-black" />

              <a
                href={videoUrl}
                download={`${project.title.toLowerCase().replace(/\s+/g, '-')}-intro.mp4`}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Video File (.mp4)</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
