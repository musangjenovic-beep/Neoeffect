import React, { useRef, useEffect, useState } from 'react';
import { AspectRatio, CanvasDimensions, EvaluatedLayerProps, Layer, Project } from '../types';
import { evaluateKeyframes, generateShapePath, getTrimPathStyle } from '../utils/motion';
import { Maximize2, Move, RotateCw, ZoomIn } from 'lucide-react';

interface CanvasStageProps {
  project: Project;
  currentTime: number;
  selectedLayerIds: string[];
  onSelectLayer: (id: string, multiSelect?: boolean) => void;
  onUpdateLayerKeyframeAtTime: (layerId: string, time: number, updates: Partial<EvaluatedLayerProps>) => void;
  isPlaying: boolean;
}

export const CanvasStage: React.FC<CanvasStageProps> = ({
  project,
  currentTime,
  selectedLayerIds,
  onSelectLayer,
  onUpdateLayerKeyframeAtTime,
  isPlaying,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions>({ width: 800, height: 450 });

  // Touch/Drag gizmo state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'position' | 'scale' | 'rotate' | null>(null);
  const [startTouchPos, setStartTouchPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialProps, setInitialProps] = useState<EvaluatedLayerProps | null>(null);

  // Compute Stage dimensions according to aspect ratio with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const maxW = Math.max(100, rect.width - 24);
      const maxH = Math.max(100, rect.height - 24);

      let ratio = 16 / 9;
      if (project.aspectRatio === '9:16') ratio = 9 / 16;
      else if (project.aspectRatio === '1:1') ratio = 1;
      else if (project.aspectRatio === '4:5') ratio = 4 / 5;

      let w = maxW;
      let h = w / ratio;

      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }

      setDimensions({ width: Math.round(w), height: Math.round(h) });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [project.aspectRatio]);

  // Render Loop on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // 1. Clear & Background
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = project.backgroundColor || '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    if (project.bgPattern === 'grid') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (project.bgPattern === 'dots') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      const dotSpacing = 24;
      for (let x = 12; x < width; x += dotSpacing) {
        for (let y = 12; y < height; y += dotSpacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Render Layers
    const sortedLayers = [...project.layers]
      .filter((l) => l.visible)
      .sort((a, b) => a.zIndex - b.zIndex);

    for (const layer of sortedLayers) {
      const props = evaluateKeyframes(layer.keyframes, currentTime);
      if (props.opacity <= 0.001) continue;

      ctx.save();
      ctx.globalAlpha = props.opacity;

      if (props.glowRadius && props.glowRadius > 0) {
        ctx.shadowColor = props.glowColor || props.fill || '#00f0ff';
        ctx.shadowBlur = props.glowRadius;
      }

      if (props.blur && props.blur > 0) {
        ctx.filter = `blur(${props.blur}px)`;
      }

      const targetX = centerX + props.x;
      const targetY = centerY + props.y;

      ctx.translate(targetX, targetY);
      ctx.rotate((props.rotation * Math.PI) / 180);
      ctx.scale(props.scaleX, props.scaleY);

      if (layer.type === 'shape') {
        const d = layer.svgPath || generateShapePath(layer.shapeKind, 180, layer.sides, layer.innerRadius);
        const p = new Path2D(d);

        if (props.fill && props.fill !== 'none' && props.fill !== 'transparent') {
          ctx.fillStyle = props.fill;
          ctx.fill(p);
        }

        if (props.stroke && props.stroke !== 'none' && props.strokeWidth > 0) {
          ctx.strokeStyle = props.stroke;
          ctx.lineWidth = props.strokeWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          if (props.trimStart > 0 || props.trimEnd < 1) {
            const trim = getTrimPathStyle(props.trimStart, props.trimEnd, 800);
            ctx.setLineDash([
              parseFloat(trim.strokeDasharray.split(' ')[0]),
              parseFloat(trim.strokeDasharray.split(' ')[1]),
            ]);
            ctx.lineDashOffset = trim.strokeDashoffset;
          } else if (props.strokeDasharray) {
            ctx.setLineDash(props.strokeDasharray.split(' ').map(Number));
          }

          ctx.stroke(p);
        }
      } else if (layer.type === 'text') {
        const fontStr = `${layer.fontWeight || '700'} ${layer.fontSize || 48}px ${layer.fontFamily || 'Inter, sans-serif'}`;
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = layer.textTransform === 'uppercase' ? (layer.text || '').toUpperCase() : layer.text || '';

        if (props.fill && props.fill !== 'none') {
          ctx.fillStyle = props.fill;
          ctx.fillText(text, 0, 0);
        }

        if (props.stroke && props.stroke !== 'none' && props.strokeWidth > 0) {
          ctx.strokeStyle = props.stroke;
          ctx.lineWidth = props.strokeWidth;
          ctx.strokeText(text, 0, 0);
        }
      }

      ctx.restore();
    }
  }, [project, currentTime, dimensions]);

  // Touch Gizmo Interaction Handling
  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    mode: 'position' | 'scale' | 'rotate' = 'position'
  ) => {
    if (selectedLayerIds.length === 0) return;
    const primaryId = selectedLayerIds[0];
    const layer = project.layers.find((l) => l.id === primaryId);
    if (!layer) return;

    setIsDragging(true);
    setDragMode(mode);
    setStartTouchPos({ x: e.clientX, y: e.clientY });

    const currentEvaluated = evaluateKeyframes(layer.keyframes, currentTime);
    setInitialProps(currentEvaluated);

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !initialProps || selectedLayerIds.length === 0) return;
    const dx = e.clientX - startTouchPos.x;
    const dy = e.clientY - startTouchPos.y;

    for (const layerId of selectedLayerIds) {
      if (dragMode === 'position') {
        onUpdateLayerKeyframeAtTime(layerId, currentTime, {
          x: Math.round(initialProps.x + dx),
          y: Math.round(initialProps.y + dy),
        });
      } else if (dragMode === 'scale') {
        const scaleFactor = 1 + (dx + dy) / 200;
        onUpdateLayerKeyframeAtTime(layerId, currentTime, {
          scaleX: Math.max(0.1, Number((initialProps.scaleX * scaleFactor).toFixed(2))),
          scaleY: Math.max(0.1, Number((initialProps.scaleY * scaleFactor).toFixed(2))),
        });
      } else if (dragMode === 'rotate') {
        const angleDelta = Math.round(dx * 0.8);
        onUpdateLayerKeyframeAtTime(layerId, currentTime, {
          rotation: (initialProps.rotation + angleDelta) % 360,
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setDragMode(null);
    setInitialProps(null);
  };

  // Primary selected layer props for gizmo bounds
  const primaryLayer = project.layers.find((l) => selectedLayerIds.includes(l.id));
  const primaryProps = primaryLayer ? evaluateKeyframes(primaryLayer.keyframes, currentTime) : null;

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full bg-slate-950 flex items-center justify-center p-3 relative overflow-hidden select-none"
    >
      {/* Canvas Frame Container */}
      <div
        className="relative shadow-2xl rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full block"
        />

        {/* Safe Margin Guide Overlay */}
        <div className="absolute inset-4 border border-cyan-500/10 pointer-events-none rounded-lg" />
        <div className="absolute inset-8 border border-pink-500/10 pointer-events-none rounded-lg" />

        {/* Selected Layer Touch Transform Gizmo */}
        {primaryLayer && primaryProps && (
          <div
            onPointerDown={(e) => handlePointerDown(e, 'position')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute z-20 cursor-move border-2 border-cyan-400 border-dashed rounded touch-none"
            style={{
              left: dimensions.width / 2 + primaryProps.x - 70,
              top: dimensions.height / 2 + primaryProps.y - 70,
              width: 140,
              height: 140,
              transform: `scale(${primaryProps.scaleX}, ${primaryProps.scaleY}) rotate(${primaryProps.rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            {/* Center Position Icon */}
            <div className="absolute inset-0 flex items-center justify-center text-cyan-400 opacity-60 hover:opacity-100">
              <Move className="w-5 h-5 drop-shadow" />
            </div>

            {/* Scale Handle Corner */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown(e, 'scale');
              }}
              className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center shadow-lg cursor-se-resize touch-none"
              title="Scale Layer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </div>

            {/* Rotation Handle Top */}
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                handlePointerDown(e, 'rotate');
              }}
              className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center shadow-lg cursor-grab touch-none"
              title="Rotate Layer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Time HUD overlay */}
        <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur border border-slate-800 text-cyan-400 text-[11px] font-mono px-2 py-1 rounded-md flex items-center gap-2">
          <span>{currentTime.toFixed(2)}s</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-300">{project.duration.toFixed(1)}s</span>
          <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
            {project.fps} FPS
          </span>
        </div>
      </div>
    </div>
  );
};
