import React from 'react';
import { Gesture } from '../types';
import { Hand, Grab, XCircle, Copy, MoveHorizontal } from 'lucide-react';

interface UIOverlayProps {
    currentGesture: Gesture;
    status: string;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ currentGesture, status }) => {
    return (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-6 z-40">
            {/* Header / Instructions */}
            <div className="flex justify-between items-start">
                <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white max-w-sm">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                        Cosmic Hand Control
                    </h1>
                    <p className="text-sm text-gray-300 mb-4">
                        Use your hand to interact with the universe.
                    </p>
                    <ul className="space-y-2 text-xs text-gray-400">
                        <li className="flex items-center gap-2">
                            <Hand size={14} className="text-blue-400"/> 
                            <span className="font-semibold text-white">Open Palm:</span> Select & Hover
                        </li>
                        <li className="flex items-center gap-2">
                            <Grab size={14} className="text-green-400"/> 
                            <span className="font-semibold text-white">Pinch:</span> Grab & Drag
                        </li>
                        <li className="flex items-center gap-2">
                            <XCircle size={14} className="text-red-400"/> 
                            <span className="font-semibold text-white">Fist:</span> Explode
                        </li>
                        <li className="flex items-center gap-2">
                            <Copy size={14} className="text-yellow-400"/> 
                            <span className="font-semibold text-white">Thumbs Up:</span> Duplicate
                        </li>
                         <li className="flex items-center gap-2">
                            <MoveHorizontal size={14} className="text-purple-400"/> 
                            <span className="font-semibold text-white">Wave Side:</span> Pan Camera
                        </li>
                    </ul>
                </div>
            </div>

            {/* Status Footer */}
            <div className="flex justify-between items-end">
                <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400">Current Gesture</span>
                            <span className="text-xl font-bold text-blue-300">{currentGesture}</span>
                        </div>
                        <div className="w-px h-8 bg-white/20"></div>
                        <div className="flex flex-col">
                             <span className="text-[10px] uppercase tracking-wider text-gray-400">Status</span>
                             <span className="text-lg text-white">{status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UIOverlay;
