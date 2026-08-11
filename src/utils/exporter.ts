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
    let exportCanvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let recorder: MediaRecorder | null = null;

    try {
      // Clamp canvas dimensions to safe max limit (max 2560px) to prevent GPU allocation crashes
      const safeWidth = Math.min(canvasWidth, 2560);
      const safeHeight = Math.min(canvasHeight, 2560);

      exportCanvas = document.createElement('canvas');
      exportCanvas.width = safeWidth;
      exportCanvas.height = safeHeight;
      ctx = exportCanvas.getContext('2d', { alpha: false, willReadFrequently: false });

      if (!ctx) {
        throw new Error('Canvas 2D context unavailable');
      }

      // Select optimal supported MIME type
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      // Tune bitrate according to resolution to avoid memory overflow
      let videoBitsPerSecond = 3000000; // Default 3 Mbps
      if (safeWidth <= 854) {
        videoBitsPerSecond = 1500000; // 1.5 Mbps for 480p
      } else if (safeWidth <= 1280) {
        videoBitsPerSecond = 3000000; // 3 Mbps for 720p
      } else if (safeWidth <= 1920) {
        videoBitsPerSecond = 5000000; // 5 Mbps for 1080p
      } else {
        videoBitsPerSecond = 8000000; // 8 Mbps max
      }

      const stream = exportCanvas.captureStream(project.fps);
      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onerror = (err) => {
        reject(new Error('MediaRecorder error: ' + String(err)));
      };

      recorder.onstop = () => {
        try {
          const finalBlob = new Blob(chunks, { type: mimeType });
          // Cleanup canvas memory
          if (exportCanvas) {
            exportCanvas.width = 1;
            exportCanvas.height = 1;
          }
          resolve(finalBlob);
        } catch (e) {
          reject(e);
        }
      };

      recorder.start();

      const totalFrames = Math.floor(project.duration * project.fps);

      for (let frame = 0; frame <= totalFrames; frame++) {
        const currentTime = frame / project.fps;

        if (onProgress) {
          const percent = Math.round((frame / totalFrames) * 100);
          onProgress(percent, `Rendering frame ${frame} / ${totalFrames} (${currentTime.toFixed(2)}s)...`);
        }

        // Render Frame
        await renderFrameToCanvas(ctx, project, currentTime, safeWidth, safeHeight);

        // Yield thread execution so browser doesn't freeze/crash
        if (frame % 3 === 0) {
          await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 10)));
        } else {
          await new Promise((r) => setTimeout(r, 8));
        }
      }

      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    } catch (err) {
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch (_) {}
      }
      reject(err);
    }
  });
}

// Draw a single frame at currentTime to canvas safely
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
  ctx.fillStyle = project.backgroundColor || '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  // Draw Background Pattern
  if (project.bgPattern === 'grid') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = Math.max(1, Math.round(width / 1000));
    const gridSize = Math.max(20, Math.round(width / 30));
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
    const dotSpacing = Math.max(20, Math.round(width / 30));
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

    // Apply Glow Filter safely without exceeding GPU memory
    if (props.glowRadius && props.glowRadius > 0) {
      ctx.shadowColor = props.glowColor || props.fill || '#00f0ff';
      // Cap glowRadius to max 20px so Gaussian blur calculation doesn't freeze browser
      ctx.shadowBlur = Math.min(props.glowRadius, 20);
    }

    if (props.blur && props.blur > 0) {
      ctx.filter = `blur(${Math.min(props.blur, 10)}px)`;
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
          const dash1 = parseFloat(trim.strokeDasharray.split(' ')[0]) || 0;
          const dash2 = parseFloat(trim.strokeDasharray.split(' ')[1]) || 0;
          if (dash1 > 0 || dash2 > 0) {
            ctx.setLineDash([dash1, dash2]);
            ctx.lineDashOffset = trim.strokeDashoffset;
          }
        } else if (props.strokeDasharray) {
          const dashes = props.strokeDasharray.split(' ').map(Number).filter((n) => !isNaN(n));
          if (dashes.length > 0) {
            ctx.setLineDash(dashes);
          }
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
