export type LayerType = 'shape' | 'text' | 'path' | 'image' | 'particles' | 'lightleak';

export type ShapeKind =
  | 'rect'
  | 'circle'
  | 'polygon'
  | 'star'
  | 'badge'
  | 'ring'
  | 'cyberGrid'
  | 'wave'
  | 'burst'
  | 'heart'
  | 'arrow';

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'elastic'
  | 'bounce'
  | 'cubicBezier';

export interface Keyframe {
  id: string;
  time: number; // seconds
  x: number; // offset from center
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number; // deg
  opacity: number; // 0..1
  fill: string;
  stroke: string;
  strokeWidth: number;
  trimStart: number; // 0..1
  trimEnd: number; // 0..1
  strokeDasharray?: string;
  blur: number;
  glowColor?: string;
  glowRadius?: number;
  easing: EasingType;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  shapeKind?: ShapeKind;
  sides?: number;
  innerRadius?: number;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  letterSpacing?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase';
  svgPath?: string;
  imageUrl?: string;
  blendMode?: string;
  zIndex: number;
  soundEffect?: SoundEffectType;
  keyframes: Keyframe[];
}

export type SoundEffectType =
  | 'none'
  | 'whoosh'
  | 'glitch'
  | 'bassDrop'
  | 'laser'
  | 'stinger'
  | 'pop'
  | 'beep'
  | 'riser';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'zoomBlur'
  | 'glitch'
  | 'shapeWipe'
  | 'rgbSplit'
  | 'flash';

export interface Transition {
  id: string;
  type: TransitionType;
  time: number;
  duration: number;
}

export interface AudioTrack {
  id: string;
  title: string;
  url?: string;
  duration: number;
  volume: number;
  waveform?: number[];
  syntheticType?: 'cyber' | 'energetic' | 'chill' | 'cinematic';
}

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5';

export interface Project {
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  fps: 30 | 60;
  duration: number; // seconds (e.g. 5.0)
  backgroundColor: string;
  backgroundGradient?: string;
  bgPattern?: 'none' | 'grid' | 'dots' | 'lines' | 'hexagons';
  audioTrack?: AudioTrack;
  layers: Layer[];
  transitions: Transition[];
}

export interface EvaluatedLayerProps {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  trimStart: number;
  trimEnd: number;
  strokeDasharray?: string;
  blur: number;
  glowColor?: string;
  glowRadius?: number;
}

export interface CanvasDimensions {
  width: number;
  height: number;
}
