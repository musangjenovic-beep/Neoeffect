import { EvaluatedLayerProps, Project } from '../types';
import { evaluateKeyframes, generateShapePath, getTrimPathStyle } from './motion';

export interface ExportProgressCallback {
  (progress: number, message: string): void;
}

export async function renderProjectToVideo(
  project: Project,
  canvasWidth: number,
  canvasHeight: number,
  onProgress?: ExportProgressCallback
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvasWidth;
      exportCanvas.height = canvasHeight;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Check supported MIME types
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      }

      const stream = exportCanvas.captureStream(project.fps);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        resolve(finalBlob);
      };

      recorder.start();

      const totalFrames = Math.floor(project.duration * project.fps);
      const frameDurationMs = 1000 / project.fps;

      for (let frame = 0; frame <= totalFrames; frame++) {
        const currentTime = frame / project.fps;

        if (onProgress) {
          const percent = Math.round((frame / totalFrames) * 100);
          onProgress(percent, `Rendering frame ${frame} / ${totalFrames} (${currentTime.toFixed(2)}s)...`);
        }

        // Draw Canvas Frame
        await renderFrameToCanvas(ctx, project, currentTime, canvasWidth, canvasHeight);

        // Allow browser frame tick
        await new Promise((r) => setTimeout(r, frameDurationMs));
      }

      recorder.stop();
    } catch (err) {
      reject(err);
    }
  });
}

// Draw a single frame at currentTime to canvas
export async function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  project: Project,
  currentTime: number,
  width: number,
  height: number
) {
  const centerX = width / 2;
  const centerY = height / 2;

  // 1. Draw Background
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  if (project.backgroundGradient) {
    // Fill with gradient or fallback bg
    ctx.fillStyle = project.backgroundColor || '#000000';
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = project.backgroundColor || '#0a0a0f';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw Background Pattern
  if (project.bgPattern === 'grid') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const dotSpacing = 30;
    for (let x = 15; x < width; x += dotSpacing) {
      for (let y = 15; y < height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();

  // 2. Sort and Render Layers
  const sortedLayers = [...project.layers]
    .filter((l) => l.visible)
    .sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    const props: EvaluatedLayerProps = evaluateKeyframes(layer.keyframes, currentTime);

    if (props.opacity <= 0.01) continue;

    ctx.save();
    ctx.globalAlpha = props.opacity;

    // Apply Glow Filter
    if (props.glowRadius && props.glowRadius > 0) {
      ctx.shadowColor = props.glowColor || props.fill || '#00f0ff';
      ctx.shadowBlur = props.glowRadius;
    }

    if (props.blur && props.blur > 0) {
      ctx.filter = `blur(${props.blur}px)`;
    }

    // Blend mode
    if (layer.blendMode) {
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
    }

    // Transform position relative to canvas center
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

        // Trim Path stroke offset simulation
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
}
