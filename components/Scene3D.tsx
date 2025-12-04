import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { BlockData, Gesture, HandData, ParticleData } from '../types';

// --- Constants ---
const BOUNDS = { x: 9, y: 6, z: 5 }; // Scene boundaries
const PHYSICS_OPTS = {
    drag: 0.96,        // Air resistance
    restitution: 0.7,  // Bounciness
    springStiffness: 0.15, // For hand grabbing
    repulsion: 0.2,    // Force pushing blocks apart
    radius: 0.8        // Approximate collision radius for blocks
};

// --- Utility Components ---

const ParticleSystem: React.FC<{ particles: ParticleData[]; onComplete: (id: string) => void }> = ({ particles, onComplete }) => {
    return (
        <group>
            {particles.map((p) => (
                <Particle key={p.id} data={p} onComplete={onComplete} />
            ))}
        </group>
    );
};

const Particle: React.FC<{ data: ParticleData; onComplete: (id: string) => void }> = ({ data, onComplete }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [life, setLife] = useState(1.0);
    // Store velocity in ref to avoid re-renders during physics
    const velocityRef = useRef(data.velocity.clone());

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        
        // Physics
        meshRef.current.position.add(velocityRef.current.clone().multiplyScalar(delta * 10));
        velocityRef.current.y -= delta * 0.5; // Gravity
        
        // Spin
        meshRef.current.rotation.x += delta * 4;
        meshRef.current.rotation.z += delta * 4;
        
        // Fade
        const newLife = life - delta * 1.5;
        setLife(newLife);
        
        if (newLife <= 0) {
            onComplete(data.id);
        } else {
            if (meshRef.current.material instanceof THREE.Material) {
                meshRef.current.material.opacity = newLife;
            }
            meshRef.current.scale.setScalar(newLife * 0.3);
        }
    });

    return (
        <mesh ref={meshRef} position={data.position}>
            <dodecahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color={data.color} transparent opacity={life} />
        </mesh>
    );
};

interface BlockProps {
    data: BlockData;
    isSelected: boolean;
    isHovered: boolean;
    onRegister: (id: string, mesh: THREE.Mesh) => void;
}

const Block = React.memo(({ data, isSelected, isHovered, onRegister }: BlockProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    useLayoutEffect(() => {
        if (meshRef.current) {
            onRegister(data.id, meshRef.current);
            // Initialize from data
            meshRef.current.position.copy(data.position);
            meshRef.current.rotation.copy(data.rotation);
        }
    }, [data.id, onRegister, data.position, data.rotation]);

    useFrame((state) => {
        if (!meshRef.current) return;
        
        // Visual effects only (Physics is handled in parent)
        if (isSelected || isHovered) {
             const scalePulse = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.05;
             meshRef.current.scale.setScalar(scalePulse);
             
             // Add a subtle emission pulse
             if(meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
                 meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
             }
        } else {
             meshRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
             if(meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
                 meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(meshRef.current.material.emissiveIntensity, 0, 0.1);
             }
        }
    });

    return (
        <mesh 
            ref={meshRef} 
            castShadow
            receiveShadow
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshPhysicalMaterial 
                color={isSelected ? "#ffffff" : data.color}
                transmission={0.4} 
                opacity={1}
                metalness={0.2}
                roughness={0.1}
                ior={1.5}
                thickness={1.5}
                clearcoat={1}
                attenuationColor={data.color}
                attenuationDistance={1.5}
                emissive={data.color}
                emissiveIntensity={0}
            />
            {(isSelected || isHovered) && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                    <lineBasicMaterial color="white" transparent opacity={0.5} />
                </lineSegments>
            )}
        </mesh>
    );
});

// --- Main Scene Content ---

interface SceneContentProps {
    handData: React.MutableRefObject<HandData | null>;
    blocks: BlockData[];
    setBlocks: React.Dispatch<React.SetStateAction<BlockData[]>>;
    onStatusChange: (status: string) => void;
}

const SceneContent: React.FC<SceneContentProps> = ({ handData, blocks, setBlocks, onStatusChange }) => {
    const { camera } = useThree();
    const [particles, setParticles] = useState<ParticleData[]>([]);
    
    // Interaction State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isGrabbing, setIsGrabbing] = useState(false);
    
    // Physics State Refs (separate from React state for performance)
    const blockRefs = useRef<Record<string, THREE.Mesh>>({});
    const physicsStore = useRef<Record<string, { velocity: THREE.Vector3; angularVelocity: THREE.Vector3, mass: number }>>({});
    
    const duplicateCooldownRef = useRef(0);
    const grabOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());

    // Sync physics store with React blocks state
    useEffect(() => {
        blocks.forEach(block => {
            if (!physicsStore.current[block.id]) {
                physicsStore.current[block.id] = {
                    velocity: block.velocity.clone(),
                    angularVelocity: block.angularVelocity.clone(),
                    mass: block.mass
                };
            }
        });
        
        // Cleanup removed blocks
        Object.keys(physicsStore.current).forEach(id => {
            if (!blocks.find(b => b.id === id)) {
                delete physicsStore.current[id];
                delete blockRefs.current[id];
            }
        });
    }, [blocks]);

    const spawnExplosion = (position: THREE.Vector3, color: string) => {
        const count = 20;
        const newParticles: ParticleData[] = [];
        for (let i = 0; i < count; i++) {
            newParticles.push({
                id: Math.random().toString(36).substr(2, 9),
                position: position.clone(),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4,
                    (Math.random() - 0.5) * 4
                ),
                color: color,
                life: 1.0,
            });
        }
        setParticles(prev => [...prev, ...newParticles]);
    };

    useFrame((state, delta) => {
        // --- 1. Hand Tracking & Projection ---
        const hand = handData.current;
        let targetPos: THREE.Vector3 | null = null;

        if (hand) {
            const handX = (1 - hand.palmPosition.x) * 2 - 1; 
            const handY = -(hand.palmPosition.y * 2 - 1); 
            const vector = new THREE.Vector3(handX, handY, 0.5);
            vector.unproject(camera);
            const dir = vector.sub(camera.position).normalize();
            const distanceToZ0 = -camera.position.z / dir.z;
            targetPos = camera.position.clone().add(dir.multiplyScalar(distanceToZ0));
        } else {
            setHoveredId(null);
        }

        // --- 2. Interaction Logic ---
        // Determine hovered block
        if (targetPos && !isGrabbing) {
            let closestDist = Infinity;
            let closestId: string | null = null;

            Object.entries(blockRefs.current).forEach(([id, mesh]) => {
                const m = mesh as THREE.Mesh;
                const dist = targetPos!.distanceTo(m.position);
                if (dist < 1.3) { 
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestId = id;
                    }
                }
            });
            setHoveredId(closestId);

            if (closestId && hand?.gesture === Gesture.OPEN_PALM) {
                setSelectedId(closestId);
                onStatusChange("Block Selected");
            } else if (!closestId && hand?.gesture === Gesture.OPEN_PALM) {
                setSelectedId(null);
            }
        }

        // Handle Grab Start/End
        if (hand?.gesture === Gesture.PINCH) {
            if (!isGrabbing && hoveredId) {
                setIsGrabbing(true);
                setSelectedId(hoveredId);
                const mesh = blockRefs.current[hoveredId];
                if (mesh && targetPos) {
                    grabOffsetRef.current.subVectors(mesh.position, targetPos);
                }
                onStatusChange("Grabbing");
            }
        } else {
            if (isGrabbing) {
                setIsGrabbing(false);
                onStatusChange("Released");
                // Fling effect: add a bit of the last movement to velocity?
                // Already handled implicitly by spring physics accumulating velocity
            }
        }

        // Handle Explode
        if (hand?.gesture === Gesture.FIST && selectedId) {
            const mesh = blockRefs.current[selectedId];
            const block = blocks.find(b => b.id === selectedId);
            if (mesh && block) {
                spawnExplosion(mesh.position, block.color);
                setBlocks(prev => prev.filter(b => b.id !== selectedId));
                setSelectedId(null);
                setHoveredId(null);
                setIsGrabbing(false);
                onStatusChange("Destroyed!");
            }
        }

        // Handle Duplicate
        if (hand?.gesture === Gesture.THUMBS_UP && selectedId && duplicateCooldownRef.current <= 0) {
            const parentBlock = blocks.find(b => b.id === selectedId);
            const parentMesh = blockRefs.current[selectedId];
            if (parentBlock && parentMesh) {
                const newId = Math.random().toString(36).substr(2, 9);
                const offset = new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2).normalize().multiplyScalar(1.5);
                const newPos = parentMesh.position.clone().add(offset);
                
                const newBlock: BlockData = {
                    ...parentBlock,
                    id: newId,
                    position: newPos,
                    velocity: new THREE.Vector3(), // Start still
                    angularVelocity: new THREE.Vector3((Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1, (Math.random()-0.5)*0.1),
                    mass: 1
                };
                setBlocks(prev => [...prev, newBlock]);
                duplicateCooldownRef.current = 60;
                onStatusChange("Duplicated!");
            }
        }
        if (duplicateCooldownRef.current > 0) duplicateCooldownRef.current--;

        // Pan Camera
        if (hand) {
            const handX = (1 - hand.palmPosition.x) * 2 - 1;
            if (handX > 0.85) camera.position.x += 5 * delta;
            else if (handX < -0.85) camera.position.x -= 5 * delta;
        }


        // --- 3. PHYSICS ENGINE ---
        
        const activeIds = Object.keys(blockRefs.current);
        const physics = physicsStore.current;

        // A. Collision Detection & Resolution (O(N^2) - fine for small N)
        for (let i = 0; i < activeIds.length; i++) {
            const idA = activeIds[i];
            const meshA = blockRefs.current[idA];
            const physA = physics[idA];
            if (!meshA || !physA) continue;

            for (let j = i + 1; j < activeIds.length; j++) {
                const idB = activeIds[j];
                const meshB = blockRefs.current[idB];
                const physB = physics[idB];
                if (!meshB || !physB) continue;

                // Simple Sphere Collision
                const diff = new THREE.Vector3().subVectors(meshA.position, meshB.position);
                const dist = diff.length();
                const minDistance = PHYSICS_OPTS.radius * 2; // 2x radius

                if (dist < minDistance) {
                    // Normalize collision normal
                    const normal = diff.normalize();
                    
                    // Penetration resolution (push apart)
                    const penetration = minDistance - dist;
                    const push = normal.clone().multiplyScalar(penetration * 0.5);
                    meshA.position.add(push);
                    meshB.position.sub(push);

                    // Velocity Reflection (Elastic)
                    // V' = V - 2(V . N)N * restitution
                    // Relative velocity
                    const relVel = new THREE.Vector3().subVectors(physA.velocity, physB.velocity);
                    const velAlongNormal = relVel.dot(normal);

                    if (velAlongNormal < 0) { // Only resolve if moving towards each other
                        const jVal = -(1 + PHYSICS_OPTS.restitution) * velAlongNormal;
                        const impulse = normal.clone().multiplyScalar(jVal * 0.5); // Assume equal mass
                        
                        physA.velocity.add(impulse);
                        physB.velocity.sub(impulse);
                        
                        // Add some spin on collision
                        physA.angularVelocity.add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.1));
                        physB.angularVelocity.add(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(0.1));
                    }
                }
            }
        }

        // B. Update Velocity & Position
        activeIds.forEach(id => {
            const mesh = blockRefs.current[id];
            const phys = physics[id];
            if (!mesh || !phys) return;

            // 1. Forces
            
            // Hand Spring Force
            if (isGrabbing && selectedId === id && targetPos) {
                const target = targetPos.clone().add(grabOffsetRef.current);
                const force = new THREE.Vector3().subVectors(target, mesh.position);
                // Hooke's Law: F = kx - cv
                force.multiplyScalar(PHYSICS_OPTS.springStiffness); // kx
                // Apply force to velocity (F=ma, m=1)
                phys.velocity.add(force);
                // Stronger damping when holding
                phys.velocity.multiplyScalar(0.9); 
            } else {
                // Regular air resistance
                phys.velocity.multiplyScalar(PHYSICS_OPTS.drag);
                phys.angularVelocity.multiplyScalar(0.98);
            }

            // Central Gravity / Centering force (keeps them from drifting too far forever)
            if (!isGrabbing) {
                const centerForce = mesh.position.clone().multiplyScalar(-0.005);
                phys.velocity.add(centerForce);
            }

            // 2. Integration (Euler)
            mesh.position.add(phys.velocity);
            mesh.rotation.x += phys.angularVelocity.x;
            mesh.rotation.y += phys.angularVelocity.y;
            mesh.rotation.z += phys.angularVelocity.z;

            // 3. Boundary Checks
            const buffer = 1.0; // Block size radius
            if (Math.abs(mesh.position.x) > BOUNDS.x - buffer) {
                mesh.position.x = Math.sign(mesh.position.x) * (BOUNDS.x - buffer);
                phys.velocity.x *= -PHYSICS_OPTS.restitution;
            }
            if (Math.abs(mesh.position.y) > BOUNDS.y - buffer) {
                mesh.position.y = Math.sign(mesh.position.y) * (BOUNDS.y - buffer);
                phys.velocity.y *= -PHYSICS_OPTS.restitution;
            }
            if (Math.abs(mesh.position.z) > BOUNDS.z - buffer) {
                 mesh.position.z = Math.sign(mesh.position.z) * (BOUNDS.z - buffer);
                 phys.velocity.z *= -PHYSICS_OPTS.restitution;
            }
        });

    });

    return (
        <>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={0.5} color="purple" />
            <spotLight position={[0, 15, 0]} angle={0.5} penumbra={1} intensity={1} castShadow />
            
            {blocks.map(block => (
                <Block 
                    key={block.id} 
                    data={block} 
                    isSelected={selectedId === block.id}
                    isHovered={hoveredId === block.id}
                    onRegister={(id, mesh) => blockRefs.current[id] = mesh}
                />
            ))}
            
            <ParticleSystem 
                particles={particles} 
                onComplete={(id) => setParticles(prev => prev.filter(p => p.id !== id))} 
            />
            
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        </>
    );
};

// --- Scene Wrapper ---

interface Scene3DProps {
    handData: React.MutableRefObject<HandData | null>;
    onStatusChange: (status: string) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ handData, onStatusChange }) => {
    // Initial Blocks Generation
    const [blocks, setBlocks] = useState<BlockData[]>(() => {
        const initialBlocks: BlockData[] = [];
        const colors = ["#00f3ff", "#bc13fe", "#ff00aa", "#4d00ff", "#33ccff"];
        for (let i = 0; i < 15; i++) {
            initialBlocks.push({
                id: Math.random().toString(36).substr(2, 9),
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 5
                ),
                rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
                color: colors[Math.floor(Math.random() * colors.length)],
                scale: new THREE.Vector3(1, 1, 1),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1, 
                    (Math.random() - 0.5) * 0.1, 
                    (Math.random() - 0.5) * 0.1
                ),
                angularVelocity: new THREE.Vector3(
                     (Math.random() - 0.5) * 0.05,
                     (Math.random() - 0.5) * 0.05,
                     (Math.random() - 0.5) * 0.05
                ),
                mass: 1.0
            });
        }
        return initialBlocks;
    });

    return (
        <div className="w-full h-screen bg-black">
            <Canvas shadows camera={{ position: [0, 0, 14], fov: 50 }}>
                <SceneContent 
                    handData={handData} 
                    blocks={blocks} 
                    setBlocks={setBlocks}
                    onStatusChange={onStatusChange}
                />
                <Environment preset="night" />
            </Canvas>
        </div>
    );
};

export default Scene3D;