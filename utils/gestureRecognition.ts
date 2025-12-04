import { Gesture } from '../types';

// Key Landmark Indices (MediaPipe Hands)
// 0: Wrist
// 4: Thumb Tip
// 8: Index Tip
// 12: Middle Tip
// 16: Ring Tip
// 20: Pinky Tip

const distance = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

export const detectGesture = (landmarks: Array<{ x: number; y: number; z: number }>): Gesture => {
  if (!landmarks || landmarks.length < 21) return Gesture.NONE;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  // Calculate distances for fingers to wrist (to check if curled)
  const indexDist = distance(indexTip, wrist);
  const middleDist = distance(middleTip, wrist);
  const ringDist = distance(ringTip, wrist);
  const pinkyDist = distance(pinkyTip, wrist);
  
  // Reference distance (wrist to middle finger mcp approx, used for scale)
  const scaleRef = distance(landmarks[0], landmarks[9]); 

  // 1. PINCH: Thumb and Index tips are very close
  const pinchDist = distance(thumbTip, indexTip);
  if (pinchDist < 0.05) {
    return Gesture.PINCH;
  }

  // 2. FIST: All fingers curled close to palm/wrist
  // We use a threshold relative to the hand scale
  const curledThreshold = scaleRef * 0.9; 
  if (indexDist < curledThreshold && middleDist < curledThreshold && ringDist < curledThreshold && pinkyDist < curledThreshold) {
    return Gesture.FIST;
  }

  // 3. THUMBS UP: Thumb is up/extended, others are curled
  // Checking vertical relation (thumb tip significantly higher than others, y is inverted in some coords but assume 0 is top)
  // MediaPipe: y increases downwards. So "Up" means lower y value.
  const isThumbUp = thumbTip.y < landmarks[3].y && thumbTip.y < indexTip.y; 
  if (isThumbUp && indexDist < curledThreshold && middleDist < curledThreshold && ringDist < curledThreshold && pinkyDist < curledThreshold) {
    return Gesture.THUMBS_UP;
  }

  // 4. OPEN PALM (Default if fingers extended)
  if (indexDist > curledThreshold && middleDist > curledThreshold && ringDist > curledThreshold && pinkyDist > curledThreshold) {
    return Gesture.OPEN_PALM;
  }

  return Gesture.NONE;
};
