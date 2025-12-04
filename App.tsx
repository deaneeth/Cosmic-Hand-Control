import React, { useRef, useState } from 'react';
import Scene3D from './components/Scene3D';
import HandTracker from './components/HandTracker';
import UIOverlay from './components/UIOverlay';
import { HandData, Gesture } from './types';

const App: React.FC = () => {
  // We use a ref for high-frequency hand data to avoid React render loop lag in the 3D scene
  const handDataRef = useRef<HandData | null>(null);
  
  // State for UI updates (lower frequency)
  const [currentGesture, setCurrentGesture] = useState<Gesture>(Gesture.NONE);
  const [status, setStatus] = useState<string>("Waiting for camera...");
  const [cameraReady, setCameraReady] = useState(false);

  const handleHandUpdate = (data: HandData | null) => {
    handDataRef.current = data;
    
    // throttle UI updates slightly or just pass through if performant
    if (data && data.gesture !== currentGesture) {
        setCurrentGesture(data.gesture);
    } else if (!data && currentGesture !== Gesture.NONE) {
        setCurrentGesture(Gesture.NONE);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans selection:bg-blue-500 selection:text-white">
      
      {/* 3D Scene Layer */}
      <Scene3D 
        handData={handDataRef} 
        onStatusChange={setStatus} 
      />

      {/* UI Overlay Layer */}
      <UIOverlay 
        currentGesture={currentGesture} 
        status={cameraReady ? status : "Initializing AI Model..."} 
      />

      {/* Hand Tracker (Hidden/Corner) */}
      <HandTracker 
        onHandUpdate={handleHandUpdate} 
        onCameraReady={() => {
            setCameraReady(true);
            setStatus("Ready! Show your hand.");
        }}
      />
      
    </div>
  );
};

export default App;
