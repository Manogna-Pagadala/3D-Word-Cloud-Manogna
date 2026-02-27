import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { WordCloud } from './WordCloud';
import type { WordData } from '../types';
import { Suspense } from 'react';

interface SceneProps {
  words: WordData[]; // the list of words to display in the 3D scene
}

// Suspense needs a fallback component to show while 3D assets are loading
function LoadingFallback() {
  return null;
}

export function Scene({ words }: SceneProps) {
  return (
    // Canvas is the 3D viewport — everything 3D goes inside here
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }} // position the camera back so we can see the whole cloud
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Background color of the 3D scene */}
      <color attach="background" args={['#ffffff']} />

      {/* Lights so the scene is visible */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#4ecdc4" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />

      {/* Decorative star field in the background */}
      <Stars
        radius={30}
        depth={30}
        count={2000}
        factor={3}
        saturation={0.5}
        fade
        speed={0.5}
      />

      {/* Load the word cloud inside Suspense in case fonts take time to load */}
      <Suspense fallback={<LoadingFallback />}>
        <WordCloud words={words} />
      </Suspense>

      {/* OrbitControls lets the user drag to rotate and scroll to zoom */}
      <OrbitControls
        enableZoom
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        makeDefault
      />
    </Canvas>
  );
}