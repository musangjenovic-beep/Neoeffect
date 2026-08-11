/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { EvaluatedLayerProps, EasingType, Layer, Project, ShapeKind } from './types';
import { PRESET_TEMPLATES } from './utils/templates';
import { generateShapePath } from './utils/motion';
import { playSoundEffect, playSyntheticBackgroundBeat } from './utils/audio';

import { HeaderNav } from './components/HeaderNav';
import { CanvasStage } from './components/CanvasStage';
import { TouchToolbar } from './components/TouchToolbar';
import { TimelinePanel } from './components/TimelinePanel';
import { LayerInspectorPanel } from './components/LayerInspectorPanel';

import { ShapeBuilderModal } from './components/ShapeBuilderModal';
import { AiIntroGeneratorModal } from './components/AiIntroGeneratorModal';
import { ExportModal } from './components/ExportModal';
import { AudioPanelModal } from './components/AudioPanelModal';

export default function App() {
  const [project, setProject] = useState<Project>(PRESET_TEMPLATES[0]);
  const [currentTime, setCurrentTime] = useState<number>(1.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(['cyber-badge']);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>('k1');

  // UI Drawer states
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState<boolean>(false);

  // Modals state
  const [isShapeModalOpen, setIsShapeModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const playedSfxRef = useRef<Set<string>>(new Set());

  // Animation Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    // Play background beat audio when playback starts
    if (project.audioTrack && project.audioTrack.syntheticType) {
      playSyntheticBackgroundBeat(project.audioTrack.syntheticType, project.duration);
    }

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setCurrentTime((prevTime) => {
        let nextTime = prevTime + dt;

        // Check for SFX triggers on keyframes
        project.layers.forEach((layer) => {
          if (layer.soundEffect && layer.soundEffect !== 'none') {
            layer.keyframes.forEach((kf) => {
              const triggerKey = `${layer.id}-${kf.id}`;
              if (prevTime <= kf.time && nextTime >= kf.time && !playedSfxRef.current.has(triggerKey)) {
                playSoundEffect(layer.soundEffect);
                playedSfxRef.current.add(triggerKey);
              }
            });
          }
        });

        if (nextTime >= project.duration) {
          playedSfxRef.current.clear();
          nextTime = 0;
        }
        return nextTime;
      });

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, project]);

  // Selection handlers
  const handleSelectLayer = (id: string, multiSelect = false) => {
    if (multiSelect) {
      if (selectedLayerIds.includes(id)) {
        setSelectedLayerIds(selectedLayerIds.filter((lId) => lId !== id));
      } else {
        setSelectedLayerIds([...selectedLayerIds, id]);
      }
    } else {
      setSelectedLayerIds([id]);
    }
  };

  const handleSelectAllLayers = () => {
    if (selectedLayerIds.length === project.layers.length) {
      setSelectedLayerIds([]);
    } else {
      setSelectedLayerIds(project.layers.map((l) => l.id));
    }
  };

  // Layer & Keyframe Updates
  const handleUpdateLayerKeyframeAtTime = (
    layerId: string,
    time: number,
    updates: Partial<EvaluatedLayerProps>
  ) => {
    setProject((prev) => {
      const updatedLayers = prev.layers.map((l) => {
        if (l.id !== layerId) return l;

        // Find keyframe closest to current time
        const sorted = [...l.keyframes].sort((a, b) => a.time - b.time);
        let targetKf = sorted.find((k) => Math.abs(k.time - time) < 0.2);

        if (!targetKf) {
          // Create new keyframe at exact time
          const newKf = {
            id: 'kf-' + Date.now() + Math.random().toString(36).substring(2, 5),
            time: Number(time.toFixed(2)),
            x: updates.x ?? 0,
            y: updates.y ?? 0,
            scaleX: updates.scaleX ?? 1,
            scaleY: updates.scaleY ?? 1,
            rotation: updates.rotation ?? 0,
            opacity: updates.opacity ?? 1,
            fill: updates.fill ?? '#00f0ff',
            stroke: updates.stroke ?? '#ffffff',
            strokeWidth: updates.strokeWidth ?? 2,
            trimStart: updates.trimStart ?? 0,
            trimEnd: updates.trimEnd ?? 1,
            blur: updates.blur ?? 0,
            glowColor: updates.glowColor,
            glowRadius: updates.glowRadius,
            easing: 'easeInOut' as EasingType,
          };
          return { ...l, keyframes: [...l.keyframes, newKf] };
        } else {
          const updatedKeyframes = l.keyframes.map((k) =>
            k.id === targetKf!.id ? { ...k, ...updates } : k
          );
          return { ...l, keyframes: updatedKeyframes };
        }
      });
      return { ...prev, layers: updatedLayers };
    });
  };

  const handleUpdateKeyframeEasing = (layerId: string, kfId: string, easing: EasingType) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (l.id !== layerId) return l;
        return {
          ...l,
          keyframes: l.keyframes.map((k) => (k.id === kfId ? { ...k, easing } : k)),
        };
      }),
    }));
  };

  const handleUpdateLayerMeta = (layerId: string, updates: Partial<Layer>) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
    }));
  };

  const handleDeleteLayer = (layerId: string) => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== layerId),
    }));
    setSelectedLayerIds(selectedLayerIds.filter((id) => id !== layerId));
  };

  const handleMoveLayerZIndex = (layerId: string, direction: 'up' | 'down') => {
    setProject((prev) => {
      const layers = [...prev.layers].sort((a, b) => a.zIndex - b.zIndex);
      const idx = layers.findIndex((l) => l.id === layerId);
      if (idx === -1) return prev;

      if (direction === 'up' && idx < layers.length - 1) {
        const temp = layers[idx].zIndex;
        layers[idx].zIndex = layers[idx + 1].zIndex;
        layers[idx + 1].zIndex = temp;
      } else if (direction === 'down' && idx > 0) {
        const temp = layers[idx].zIndex;
        layers[idx].zIndex = layers[idx - 1].zIndex;
        layers[idx - 1].zIndex = temp;
      }

      return { ...prev, layers };
    });
  };

  // Add Layer Helpers
  const handleAddShapeLayer = (kind: ShapeKind, name: string, svgPath?: string) => {
    const newId = 'shape-' + Date.now();
    const newLayer: Layer = {
      id: newId,
      name,
      type: 'shape',
      shapeKind: kind,
      svgPath,
      visible: true,
      locked: false,
      zIndex: project.layers.length + 1,
      soundEffect: 'whoosh',
      keyframes: [
        {
          id: 'k1-' + newId,
          time: Number(currentTime.toFixed(2)),
          x: 0,
          y: 0,
          scaleX: 0.2,
          scaleY: 0.2,
          rotation: -45,
          opacity: 0,
          fill: '#00f0ff',
          stroke: '#ffffff',
          strokeWidth: 3,
          trimStart: 0,
          trimEnd: 0,
          blur: 5,
          glowColor: '#00f0ff',
          glowRadius: 20,
          easing: 'elastic',
        },
        {
          id: 'k2-' + newId,
          time: Number((currentTime + 1.2).toFixed(2)),
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
          fill: '#00f0ff',
          stroke: '#ffffff',
          strokeWidth: 3,
          trimStart: 0,
          trimEnd: 1,
          blur: 0,
          glowColor: '#00f0ff',
          glowRadius: 20,
          easing: 'easeInOut',
        },
      ],
    };

    setProject((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedLayerIds([newId]);
  };

  const handleAddTextLayer = () => {
    const newId = 'text-' + Date.now();
    const newLayer: Layer = {
      id: newId,
      name: 'Kinetic Text',
      type: 'text',
      text: 'MOTION INTRO',
      fontFamily: 'Montserrat, sans-serif',
      fontSize: 52,
      fontWeight: '900',
      letterSpacing: 6,
      textTransform: 'uppercase',
      visible: true,
      locked: false,
      zIndex: project.layers.length + 1,
      soundEffect: 'laser',
      keyframes: [
        {
          id: 'k1-' + newId,
          time: Number(currentTime.toFixed(2)),
          x: 0,
          y: 20,
          scaleX: 0.5,
          scaleY: 0.5,
          rotation: 0,
          opacity: 0,
          fill: '#ffffff',
          stroke: '#00f0ff',
          strokeWidth: 2,
          trimStart: 0,
          trimEnd: 1,
          blur: 10,
          glowColor: '#00f0ff',
          glowRadius: 25,
          easing: 'bounce',
        },
        {
          id: 'k2-' + newId,
          time: Number((currentTime + 1.0).toFixed(2)),
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
          fill: '#ffffff',
          stroke: '#00f0ff',
          strokeWidth: 1,
          trimStart: 0,
          trimEnd: 1,
          blur: 0,
          glowColor: '#00f0ff',
          glowRadius: 20,
          easing: 'easeInOut',
        },
      ],
    };

    setProject((prev) => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setSelectedLayerIds([newId]);
  };

  const handleDuplicateSelected = () => {
    if (selectedLayerIds.length === 0) return;
    const newLayers: Layer[] = [];
    selectedLayerIds.forEach((id) => {
      const orig = project.layers.find((l) => l.id === id);
      if (orig) {
        const copy: Layer = JSON.parse(JSON.stringify(orig));
        copy.id = 'dup-' + Date.now() + Math.random().toString(36).substring(2, 5);
        copy.name = `${orig.name} (Copy)`;
        copy.zIndex = project.layers.length + newLayers.length + 1;
        copy.keyframes = copy.keyframes.map((k) => ({ ...k, x: k.x + 20, y: k.y + 20 }));
        newLayers.push(copy);
      }
    });

    setProject((prev) => ({ ...prev, layers: [...prev.layers, ...newLayers] }));
  };

  const handleAlignLayers = (mode: 'left' | 'center' | 'right') => {
    setProject((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => {
        if (!selectedLayerIds.includes(l.id)) return l;
        const targetX = mode === 'left' ? -150 : mode === 'right' ? 150 : 0;
        return {
          ...l,
          keyframes: l.keyframes.map((k) => ({ ...k, x: targetX })),
        };
      }),
    }));
  };

  const selectedLayer = project.layers.find((l) => selectedLayerIds.includes(l.id)) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Header Navigation */}
      <HeaderNav
        project={project}
        onUpdateProject={setProject}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onOpenAiModal={() => setIsAiModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
        onResetProject={() => {
          setProject(PRESET_TEMPLATES[0]);
          setCurrentTime(1.5);
          setIsPlaying(false);
        }}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        isTimelineCollapsed={isTimelineCollapsed}
        onToggleTimeline={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
      />

      {/* Main Workspace (Stage + Inspector Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Stage Area */}
        <CanvasStage
          project={project}
          currentTime={currentTime}
          selectedLayerIds={selectedLayerIds}
          onSelectLayer={handleSelectLayer}
          onUpdateLayerKeyframeAtTime={handleUpdateLayerKeyframeAtTime}
          isPlaying={isPlaying}
        />

        {/* Right Inspector Sidebar */}
        {isInspectorOpen && (
          <LayerInspectorPanel
            layer={selectedLayer}
            currentTime={currentTime}
            onUpdateLayerKeyframe={handleUpdateLayerKeyframeAtTime}
            onUpdateLayerMeta={handleUpdateLayerMeta}
            selectedKeyframeId={selectedKeyframeId}
            onUpdateKeyframeEasing={handleUpdateKeyframeEasing}
            onClose={() => setIsInspectorOpen(false)}
          />
        )}
      </div>

      {/* Touch Dock Quick Toolbar */}
      <TouchToolbar
        onOpenShapeModal={() => setIsShapeModalOpen(true)}
        onAddTextLayer={handleAddTextLayer}
        onAddPathModal={() => setIsShapeModalOpen(true)}
        onDuplicateSelected={handleDuplicateSelected}
        onSplitSelected={() => {
          alert('Layer keyframe split at ' + currentTime.toFixed(2) + 's');
        }}
        onOpenAudioModal={() => setIsAudioModalOpen(true)}
        selectedCount={selectedLayerIds.length}
        onAlignLayers={handleAlignLayers}
        onAddKeyframeAtPlayhead={() => {
          if (selectedLayerIds.length > 0) {
            handleUpdateLayerKeyframeAtTime(selectedLayerIds[0], currentTime, {});
          }
        }}
      />

      {/* Bottom Timeline Panel */}
      <TimelinePanel
        project={project}
        currentTime={currentTime}
        onSeekTime={(t) => setCurrentTime(t)}
        selectedLayerIds={selectedLayerIds}
        onSelectLayer={handleSelectLayer}
        onSelectAllLayers={handleSelectAllLayers}
        onUpdateLayer={(updated) =>
          setProject((prev) => ({
            ...prev,
            layers: prev.layers.map((l) => (l.id === updated.id ? updated : l)),
          }))
        }
        onDeleteLayer={handleDeleteLayer}
        onMoveLayerZIndex={handleMoveLayerZIndex}
        selectedKeyframeId={selectedKeyframeId}
        onSelectKeyframe={(kfId) => setSelectedKeyframeId(kfId)}
        isCollapsed={isTimelineCollapsed}
        onToggleCollapse={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
      />

      {/* Modals */}
      <ShapeBuilderModal
        isOpen={isShapeModalOpen}
        onClose={() => setIsShapeModalOpen(false)}
        onAddShape={handleAddShapeLayer}
      />

      <AiIntroGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onApplyGeneratedProject={(p) => {
          setProject(p);
          setCurrentTime(0);
          setIsPlaying(false);
        }}
        currentAspectRatio={project.aspectRatio}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
      />

      <AudioPanelModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        project={project}
        onUpdateProject={setProject}
      />
    </div>
  );
}
