"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import { Suspense, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";

const motionPreference = "(prefers-reduced-motion: reduce)";

function subscribeToMotionPreference(onChange: () => void) {
  const mediaQuery = window.matchMedia(motionPreference);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getMotionPreference() {
  return window.matchMedia(motionPreference).matches;
}

function useReducedMotion() {
  return useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, () => false);
}

function Sculpture({ reducedMotion }: { reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (reducedMotion || !group.current || !core.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.pointer.y * 0.15, 0.025);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, -state.pointer.x * 0.12, 0.025);
    core.current.rotation.y -= delta * 0.18;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      <Float speed={reducedMotion ? 0 : 0.8} rotationIntensity={reducedMotion ? 0 : 0.07} floatIntensity={reducedMotion ? 0 : 0.16}>
        <mesh ref={core} scale={1.2}>
          <icosahedronGeometry args={[1, 3]} />
          <meshStandardMaterial color="#dd8b35" roughness={0.34} metalness={0.38} wireframe />
        </mesh>
        <mesh scale={0.58}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial color="#ffd77c" roughness={0.24} metalness={0.35} emissive="#bf6428" emissiveIntensity={0.24} />
        </mesh>
        <mesh rotation={[0.3, 0.1, 0.7]}>
          <torusGeometry args={[1.52, 0.006, 8, 180]} />
          <meshBasicMaterial color="#f3bc4c" transparent opacity={0.64} />
        </mesh>
        <mesh rotation={[1.1, 0.3, -0.4]}>
          <torusGeometry args={[1.76, 0.004, 8, 180]} />
          <meshBasicMaterial color="#d96a35" transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[0.1, 1.15, 0.3]}>
          <torusGeometry args={[1.35, 0.005, 8, 180]} />
          <meshBasicMaterial color="#f5dfaa" transparent opacity={0.48} />
        </mesh>
        {Array.from({ length: 12 }, (_, index) => {
          const angle = (index / 12) * Math.PI * 2;
          const position: [number, number, number] = [Math.cos(angle) * 1.92, Math.sin(angle * 2) * 0.5, Math.sin(angle) * 1.92];
          return <mesh key={index} position={position}><sphereGeometry args={[index % 3 === 0 ? 0.045 : 0.022, 12, 12]} /><meshBasicMaterial color={index % 3 === 0 ? "#d96a35" : "#f4c65d"} /></mesh>;
        })}
      </Float>
      <Sparkles count={65} scale={4.8} size={1.6} speed={reducedMotion ? 0 : 0.18} color="#e8a743" opacity={0.52} />
    </group>
  );
}

function SceneContent({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={1.15} />
      <pointLight position={[3, 2, 4]} intensity={16} color="#ffca67" />
      <pointLight position={[-3, -2, 1]} intensity={10} color="#ed7743" />
      <Suspense fallback={null}><Sculpture reducedMotion={reducedMotion} /></Suspense>
    </>
  );
}

export default function HeroScene() {
  const reducedMotion = useReducedMotion();

  return (
    <Canvas
      camera={{ position: [0, 0, 5.3], fov: 38 }}
      dpr={[1, 1.5]}
      frameloop={reducedMotion ? "demand" : "always"}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      fallback={<div className="scene-fallback" role="img" aria-label="Abstract geometric line illustration" />}
      aria-label="Interactive 3D geometric sculpture"
    >
      <SceneContent reducedMotion={reducedMotion} />
    </Canvas>
  );
}
