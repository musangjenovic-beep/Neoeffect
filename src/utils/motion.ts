import { EasingType, EvaluatedLayerProps, Keyframe, ShapeKind } from '../types';

// Easing Functions
export function applyEasing(t: number, easing: EasingType): number {
  const clampT = Math.max(0, Math.min(1, t));
  switch (easing) {
    case 'easeIn':
      return clampT * clampT * clampT;
    case 'easeOut':
      return 1 - Math.pow(1 - clampT, 3);
    case 'easeInOut':
      return clampT < 0.5
        ? 4 * clampT * clampT * clampT
        : 1 - Math.pow(-2 * clampT + 2, 3) / 2;
    case 'elastic':
      if (clampT === 0) return 0;
      if (clampT === 1) return 1;
      return Math.pow(2, -10 * clampT) * Math.sin((clampT * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    case 'bounce':
      const n1 = 7.5625;
      const d1 = 2.75;
      let x = clampT;
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        x -= 1.5 / d1;
        return n1 * x * x + 0.75;
      } else if (x < 2.5 / d1) {
        x -= 2.25 / d1;
        return n1 * x * x + 0.9375;
      } else {
        x -= 2.625 / d1;
        return n1 * x * x + 0.984375;
      }
    case 'cubicBezier':
      // Smooth sigmoid
      return clampT * clampT * (3 - 2 * clampT);
    case 'linear':
    default:
      return clampT;
  }
}

// Color interpolation (hex to rgba)
export function interpolateColor(color1: string, color2: string, factor: number): string {
  if (color1 === color2) return color1;
  if (!color1 || !color2) return color1 || color2 || '#ffffff';

  const parseHex = (hex: string) => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    if (c.length === 6) c = c + 'ff';
    const num = parseInt(c, 16);
    return [
      (num >> 24) & 255,
      (num >> 16) & 255,
      (num >> 8) & 255,
      (num & 255) / 255,
    ];
  };

  try {
    const rgba1 = parseHex(color1);
    const rgba2 = parseHex(color2);

    const r = Math.round(rgba1[0] + (rgba2[0] - rgba1[0]) * factor);
    const g = Math.round(rgba1[1] + (rgba2[1] - rgba1[1]) * factor);
    const b = Math.round(rgba1[2] + (rgba2[2] - rgba1[2]) * factor);
    const a = (rgba1[3] + (rgba2[3] - rgba1[3]) * factor).toFixed(2);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch {
    return factor < 0.5 ? color1 : color2;
  }
}

// Evaluate layer properties at currentTime
export function evaluateKeyframes(
  keyframes: Keyframe[],
  currentTime: number
): EvaluatedLayerProps {
  if (!keyframes || keyframes.length === 0) {
    return {
      x: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 1,
      fill: '#00f0ff',
      stroke: '#ffffff',
      strokeWidth: 2,
      trimStart: 0,
      trimEnd: 1,
      blur: 0,
      glowColor: '#00f0ff',
      glowRadius: 0,
    };
  }

  const sorted = [...keyframes].sort((a, b) => a.time - b.time);

  // Before first keyframe
  if (currentTime <= sorted[0].time) {
    const k = sorted[0];
    return {
      x: k.x,
      y: k.y,
      scaleX: k.scaleX,
      scaleY: k.scaleY,
      rotation: k.rotation,
      opacity: k.opacity,
      fill: k.fill,
      stroke: k.stroke,
      strokeWidth: k.strokeWidth,
      trimStart: k.trimStart,
      trimEnd: k.trimEnd,
      strokeDasharray: k.strokeDasharray,
      blur: k.blur,
      glowColor: k.glowColor,
      glowRadius: k.glowRadius,
    };
  }

  // After last keyframe
  if (currentTime >= sorted[sorted.length - 1].time) {
    const k = sorted[sorted.length - 1];
    return {
      x: k.x,
      y: k.y,
      scaleX: k.scaleX,
      scaleY: k.scaleY,
      rotation: k.rotation,
      opacity: k.opacity,
      fill: k.fill,
      stroke: k.stroke,
      strokeWidth: k.strokeWidth,
      trimStart: k.trimStart,
      trimEnd: k.trimEnd,
      strokeDasharray: k.strokeDasharray,
      blur: k.blur,
      glowColor: k.glowColor,
      glowRadius: k.glowRadius,
    };
  }

  // Between keyframes
  let prev = sorted[0];
  let next = sorted[1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (currentTime >= sorted[i].time && currentTime <= sorted[i + 1].time) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  const duration = next.time - prev.time;
  const rawProgress = duration > 0 ? (currentTime - prev.time) / duration : 1;
  const easedProgress = applyEasing(rawProgress, prev.easing || 'easeInOut');

  const interp = (a: number, b: number) => a + (b - a) * easedProgress;

  return {
    x: interp(prev.x, next.x),
    y: interp(prev.y, next.y),
    scaleX: interp(prev.scaleX, next.scaleX),
    scaleY: interp(prev.scaleY, next.scaleY),
    rotation: interp(prev.rotation, next.rotation),
    opacity: interp(prev.opacity, next.opacity),
    fill: interpolateColor(prev.fill, next.fill, easedProgress),
    stroke: interpolateColor(prev.stroke, next.stroke, easedProgress),
    strokeWidth: interp(prev.strokeWidth, next.strokeWidth),
    trimStart: interp(prev.trimStart, next.trimStart),
    trimEnd: interp(prev.trimEnd, next.trimEnd),
    strokeDasharray: prev.strokeDasharray,
    blur: interp(prev.blur, next.blur),
    glowColor: prev.glowColor || next.glowColor,
    glowRadius: interp(prev.glowRadius || 0, next.glowRadius || 0),
  };
}

// Generate SVG Paths for Preset Shapes
export function generateShapePath(
  kind: ShapeKind = 'rect',
  size = 200,
  sides = 6,
  innerRadius = 0.5
): string {
  const r = size / 2;
  switch (kind) {
    case 'circle': {
      return `M 0,${-r} A ${r},${r} 0 1,0 0,${r} A ${r},${r} 0 1,0 0,${-r} Z`;
    }
    case 'ring': {
      const ir = r * innerRadius;
      return `M 0,${-r} A ${r},${r} 0 1,0 0,${r} A ${r},${r} 0 1,0 0,${-r} Z M 0,${-ir} A ${ir},${ir} 0 1,1 0,${ir} A ${ir},${ir} 0 1,1 0,${-ir} Z`;
    }
    case 'rect': {
      const w = size;
      const h = size;
      const rx = 12; // rounded corner
      return `M ${-w / 2 + rx},${-h / 2} L ${w / 2 - rx},${-h / 2} Q ${w / 2},${-h / 2} ${w / 2},${-h / 2 + rx} L ${w / 2},${h / 2 - rx} Q ${w / 2},${h / 2} ${w / 2 - rx},${h / 2} L ${-w / 2 + rx},${h / 2} Q ${-w / 2},${h / 2} ${-w / 2},${h / 2 - rx} L ${-w / 2},${-h / 2 + rx} Q ${-w / 2},${-h / 2} ${-w / 2 + rx},${-h / 2} Z`;
    }
    case 'polygon': {
      const points: string[] = [];
      const count = Math.max(3, sides);
      for (let i = 0; i < count; i++) {
        const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
        const px = r * Math.cos(angle);
        const py = r * Math.sin(angle);
        points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)},${py.toFixed(2)}`);
      }
      points.push('Z');
      return points.join(' ');
    }
    case 'star': {
      const points: string[] = [];
      const count = Math.max(3, sides) * 2;
      for (let i = 0; i < count; i++) {
        const currentR = i % 2 === 0 ? r : r * innerRadius;
        const angle = (i * Math.PI) / (count / 2) - Math.PI / 2;
        const px = currentR * Math.cos(angle);
        const py = currentR * Math.sin(angle);
        points.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(2)},${py.toFixed(2)}`);
      }
      points.push('Z');
      return points.join(' ');
    }
    case 'badge': {
      // Hexagonal Cyber Badge with chamfered corners
      const w = size * 0.9;
      const h = size * 0.9;
      const c = 24; // chamfer
      return `M ${-w / 2 + c},${-h / 2} L ${w / 2 - c},${-h / 2} L ${w / 2},${-h / 2 + c} L ${w / 2},${h / 2 - c} L ${w / 2 - c},${h / 2} L ${-w / 2 + c},${h / 2} L ${-w / 2},${h / 2 - c} L ${-w / 2},${-h / 2 + c} Z`;
    }
    case 'cyberGrid': {
      // Tech framing lines
      const w = size;
      const h = size;
      return `M ${-w / 2},${-h / 2} L ${-w / 2 + 40},${-h / 2} M ${w / 2 - 40},${-h / 2} L ${w / 2},${-h / 2} L ${w / 2},${-h / 2 + 40} M ${w / 2},${h / 2 - 40} L ${w / 2},${h / 2} L ${w / 2 - 40},${h / 2} M ${-w / 2 + 40},${h / 2} L ${-w / 2},${h / 2} L ${-w / 2},${h / 2 - 40} M ${-w / 2},${-h / 2 + 40} L ${-w / 2},${-h / 2}`;
    }
    case 'wave': {
      const w = size * 1.2;
      return `M ${-w / 2},0 C ${-w / 4},${-r * 0.8} ${0},${r * 0.8} ${w / 4},0 C ${w * 0.35},${-r * 0.6} ${w * 0.45},${r * 0.6} ${w / 2},0`;
    }
    case 'burst': {
      const rays: string[] = [];
      const rayCount = 12;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * 2 * Math.PI) / rayCount;
        const x1 = (r * 0.3) * Math.cos(angle);
        const y1 = (r * 0.3) * Math.sin(angle);
        const x2 = r * Math.cos(angle);
        const y2 = r * Math.sin(angle);
        rays.push(`M ${x1.toFixed(2)},${y1.toFixed(2)} L ${x2.toFixed(2)},${y2.toFixed(2)}`);
      }
      return rays.join(' ');
    }
    case 'heart': {
      return `M 0,${r * 0.3} C ${-r * 0.8},${-r * 0.6} ${-r * 1.1},${r * 0.1} 0,${r} C ${r * 1.1},${r * 0.1} ${r * 0.8},${-r * 0.6} 0,${r * 0.3} Z`;
    }
    case 'arrow': {
      const w = size;
      return `M ${-w / 2},0 L ${w / 4},0 M ${0},${-r / 2} L ${w / 4},0 L ${0},${r / 2}`;
    }
    default:
      return `M ${-r},${-r} L ${r},${-r} L ${r},${r} L ${-r},${r} Z`;
  }
}

// Calculate SVG Trim Path parameters (strokeDasharray and strokeDashoffset)
export function getTrimPathStyle(
  trimStart: number,
  trimEnd: number,
  approxPathLength = 1000
) {
  const start = Math.max(0, Math.min(1, trimStart));
  const end = Math.max(start, Math.min(1, trimEnd));
  const drawLength = (end - start) * approxPathLength;
  const gapLength = approxPathLength - drawLength;
  const offset = -start * approxPathLength;

  return {
    strokeDasharray: `${drawLength} ${gapLength}`,
    strokeDashoffset: offset,
  };
}
