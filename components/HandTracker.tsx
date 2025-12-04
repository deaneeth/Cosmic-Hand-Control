import React, { useEffect, useRef, useState } from 'react';
// @ts-ignore
import * as mpHands from '@mediapipe/hands';
import { detectGesture } from '../utils/gestureRecognition';
import { Gesture, HandData } from '../types';

interface Results {
    multiHandLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
    multiHandedness: Array<{ label: string; score: number }>;
    image: any;
}

interface HandTrackerProps {
  onHandUpdate: (data: HandData | null) => void;
  onCameraReady?: () => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate, onCameraReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    // Handle different export structures (Default export vs Named vs Namespace)
    const HandsClass = (mpHands as any).Hands || (mpHands as any).default?.Hands;
    
    if (!HandsClass) {
        setError("Failed to load MediaPipe Hands library.");
        return;
    }

    const hands = new HandsClass({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const classification = results.multiHandedness[0];
        
        const gesture = detectGesture(landmarks);
        
        // Calculate average palm position (approximate center of hand)
        // Using average of Wrist(0), IndexMCP(5), PinkyMCP(17)
        const p0 = landmarks[0];
        const p5 = landmarks[5];
        const p17 = landmarks[17];
        
        const palmX = (p0.x + p5.x + p17.x) / 3;
        const palmY = (p0.y + p5.y + p17.y) / 3;

        onHandUpdate({
          landmarks,
          gesture,
          palmPosition: { x: palmX, y: palmY },
          isRightHand: classification.label === 'Right',
        });
      } else {
        onHandUpdate(null);
      }
    });

    let stream: MediaStream | null = null;
    let requestAnimationFrameId: number;

    const startCamera = async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to load to prevent errors
                await new Promise((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => resolve(true);
                    }
                });
                
                await videoRef.current.play();
                setIsLoading(false);
                if (onCameraReady) onCameraReady();

                const loop = async () => {
                    if (videoRef.current && videoRef.current.readyState >= 2) { // HTMLMediaElement.HAVE_CURRENT_DATA
                        await hands.send({ image: videoRef.current });
                    }
                    requestAnimationFrameId = requestAnimationFrame(loop);
                };
                loop();
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Camera access denied or unavailable.");
            setIsLoading(false);
        }
    };

    startCamera();

    return () => {
        if (requestAnimationFrameId) cancelAnimationFrame(requestAnimationFrameId);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        hands.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute bottom-4 right-4 z-50 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-black/50 backdrop-blur-sm">
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform -scale-x-100" // Mirror the video for natural interaction
        playsInline
        muted // Muted is often required for autoplay
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xs">
          Loading AI...
        </div>
      )}
      {error && (
         <div className="absolute inset-0 flex items-center justify-center text-red-400 text-xs text-center p-2">
         {error}
       </div>
      )}
    </div>
  );
};

export default HandTracker;