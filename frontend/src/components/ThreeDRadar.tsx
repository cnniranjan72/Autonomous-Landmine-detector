import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

const RadarSweep = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z -= delta * 0.8; // smooth rotation
    }
  });

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[2.7, 64]} />
      <meshBasicMaterial
        color="#00ff88"
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const RadarGrid = () => {
  return (
    <group>
      {/* Outer Circle */}
      <mesh>
        <ringGeometry args={[2.5, 2.7, 64]} />
        <meshBasicMaterial color="#00ffaa" opacity={0.5} transparent />
      </mesh>

      {/* Middle Circle */}
      <mesh>
        <ringGeometry args={[1.6, 1.8, 64]} />
        <meshBasicMaterial color="#00ffaa" opacity={0.25} transparent />
      </mesh>

      {/* Inner Circle */}
      <mesh>
        <ringGeometry args={[0.7, 0.9, 64]} />
        <meshBasicMaterial color="#00ffaa" opacity={0.2} transparent />
      </mesh>

      {/* Cross Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              -3, 0, 0,
              3, 0, 0,
              0, -3, 0,
              0, 3, 0,
            ])}
            count={4}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ffaa" opacity={0.3} transparent />
      </lineSegments>
    </group>
  );
};

export const ThreeDRadar = () => {
  return (
    <div className="w-full h-[350px] border border-primary/30 rounded-xl bg-black/40 backdrop-blur-sm">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <RadarGrid />
        <RadarSweep />

        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>

      <div className="text-center text-xs text-primary mt-1 font-mono opacity-70">
        3D Radar Visualization • GPR Mode
      </div>
    </div>
  );
};
