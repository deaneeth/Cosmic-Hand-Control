import * as THREE from 'three';

export enum Gesture {
  NONE = 'None',
  OPEN_PALM = 'Hover/Select',
  PINCH = 'Grab/Move',
  FIST = 'Explode',
  THUMBS_UP = 'Duplicate',
  CLOSED = 'Closed',
}

export interface HandData {
  landmarks: Array<{ x: number; y: number; z: number }>;
  gesture: Gesture;
  palmPosition: { x: number; y: number }; // Normalized 0-1
  isRightHand: boolean;
}

export interface BlockData {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  color: string;
  scale: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  mass: number;
}

export interface ParticleData {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  life: number; // 0 to 1
}