'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Avatar3DProps {
  isSpeaking?: boolean;
  audioElement?: HTMLAudioElement | null;
}

// RPM Avatar model with audio-driven lip sync
function RPMAvatar({ audioAnalyser, isSpeaking }: { audioAnalyser: AnalyserNode | null; isSpeaking: boolean }) {
  const { scene } = useGLTF('/models/avatar.glb');
  const meshesRef = useRef<THREE.SkinnedMesh[]>([]);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Find all skinned meshes with morph targets
  useEffect(() => {
    meshesRef.current = [];
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetInfluences && child.morphTargetDictionary) {
        meshesRef.current.push(child);
      }
    });
  }, [scene]);

  // Setup audio analyser data array
  useEffect(() => {
    if (audioAnalyser) {
      dataArrayRef.current = new Uint8Array(audioAnalyser.frequencyBinCount);
    }
  }, [audioAnalyser]);

  // Animate lip sync based on audio
  useFrame((state, delta) => {
    if (!meshesRef.current.length) return;

    // Get audio data if speaking
    let mouthOpen = 0;
    let vowelE = 0;
    let vowelO = 0;
    let vowelU = 0;

    if (isSpeaking && audioAnalyser && dataArrayRef.current) {
      audioAnalyser.getByteFrequencyData(dataArrayRef.current);

      // Calculate average volume from low-mid frequencies (voice range)
      const voiceRange = dataArrayRef.current.slice(2, 24);
      const avgVolume = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;

      // Normalize to 0-1 range with boost
      const normalizedVolume = Math.min(1, (avgVolume / 100) * 1.2);

      // Map volume to mouth opening
      mouthOpen = normalizedVolume * 0.6;

      // Vowel variation based on frequency bands
      const lowFreq = dataArrayRef.current.slice(2, 8).reduce((a, b) => a + b, 0) / 6;
      const highFreq = dataArrayRef.current.slice(16, 24).reduce((a, b) => a + b, 0) / 8;

      vowelO = (lowFreq / 128) * normalizedVolume * 0.5;
      vowelU = (lowFreq / 128) * normalizedVolume * 0.3;
      vowelE = (highFreq / 128) * normalizedVolume * 0.4;
    }

    // Smooth interpolation
    const lerpSpeed = 15 * delta;

    // Target viseme values
    const targets: Record<string, number> = {
      'viseme_aa': mouthOpen * 0.7,
      'viseme_O': vowelO,
      'viseme_U': vowelU,
      'viseme_E': vowelE,
      'viseme_I': vowelE * 0.5,
      'viseme_sil': isSpeaking ? 0 : 0.05,
    };

    // Apply to all meshes
    meshesRef.current.forEach(mesh => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      Object.entries(targets).forEach(([viseme, target]) => {
        const idx = mesh.morphTargetDictionary![viseme];
        if (idx !== undefined) {
          const current = mesh.morphTargetInfluences![idx] || 0;
          mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(current, target, lerpSpeed);
        }
      });

      // Decay other visemes
      Object.keys(mesh.morphTargetDictionary).forEach(key => {
        if (key.startsWith('viseme_') && !targets[key]) {
          const idx = mesh.morphTargetDictionary![key];
          if (idx !== undefined) {
            const current = mesh.morphTargetInfluences![idx] || 0;
            mesh.morphTargetInfluences![idx] = THREE.MathUtils.lerp(current, 0, lerpSpeed);
          }
        }
      });
    });

    // Eye blink animation
    const blinkInterval = 3.5;
    const blinkDuration = 0.12;
    const time = state.clock.elapsedTime;
    const blinkPhase = time % blinkInterval;
    let blinkValue = 0;

    if (blinkPhase < blinkDuration) {
      blinkValue = Math.sin((blinkPhase / blinkDuration) * Math.PI);
    }

    meshesRef.current.forEach(mesh => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

      const leftIdx = mesh.morphTargetDictionary['eyeBlinkLeft'];
      const rightIdx = mesh.morphTargetDictionary['eyeBlinkRight'];

      if (leftIdx !== undefined) mesh.morphTargetInfluences[leftIdx] = blinkValue;
      if (rightIdx !== undefined) mesh.morphTargetInfluences[rightIdx] = blinkValue;
    });

    // Subtle idle animation
    scene.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
  });

  return <primitive object={scene} scale={1.5} position={[0, 0.85, 0]} />;
}

// Camera setup
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 1.65, 2.0);
    camera.lookAt(0, 1.55, 0);
  }, [camera]);
  return null;
}

// Loading fallback
function LoadingFallback() {
  return (
    <Html center>
      <div className="text-white/60 text-sm">Loading avatar...</div>
    </Html>
  );
}

export default function Avatar3D({ isSpeaking = false, audioElement = null }: Avatar3DProps) {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const sourceCreatedRef = useRef(false);

  useEffect(() => {
    if (!audioElement) return;

    const setupAudio = () => {
      if (audioContext || sourceCreatedRef.current) return;

      try {
        const ctx = new AudioContext();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;
        analyserNode.smoothingTimeConstant = 0.7;

        const source = ctx.createMediaElementSource(audioElement);
        source.connect(analyserNode);
        analyserNode.connect(ctx.destination);

        sourceCreatedRef.current = true;
        setAudioContext(ctx);
        setAnalyser(analyserNode);
      } catch (err) {
        console.error('Audio setup error:', err);
      }
    };

    audioElement.addEventListener('play', setupAudio);
    return () => audioElement.removeEventListener('play', setupAudio);
  }, [audioElement, audioContext]);

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ fov: 35, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <CameraSetup />
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 5, 5]} intensity={0.9} />
        <directionalLight position={[-3, 3, -3]} intensity={0.4} />
        <Suspense fallback={<LoadingFallback />}>
          <RPMAvatar audioAnalyser={analyser} isSpeaking={isSpeaking} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/avatar.glb');
