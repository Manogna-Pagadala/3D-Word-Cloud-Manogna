import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { WordData } from '../types';

// One color per topic — each topic group gets a different neon color
const TOPIC_COLORS = [
  '#222222',
  '#222222',
  '#222222',
  '#222222',
  '#222222',
  '#222222',
  '#222222',
];

// Spreads words evenly across a sphere using a mathematical pattern
// This avoids words clumping together in one area
function sphericalFibonacci(n: number, index: number): [number, number, number] {
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  const theta = Math.acos(1 - (2 * (index + 0.5)) / n);
  const phi = (2 * Math.PI * index) / goldenRatio;
  return [
    Math.sin(theta) * Math.cos(phi),
    Math.sin(theta) * Math.sin(phi),
    Math.cos(theta),
  ];
}

interface WordBubbleProps {
  word: string;
  weight: number;
  topic: number;
  position: [number, number, number];
  onHover: (word: string | null) => void; // called when mouse enters or leaves the word
  isHovered: boolean;
}

// Renders a single word in 3D space
function WordBubble({ word, weight, topic, position, onHover, isHovered }: WordBubbleProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  // Pick color based on which topic this word belongs to
  const color = TOPIC_COLORS[topic % TOPIC_COLORS.length];

  // More important words appear larger
  const fontSize = 0.12 + weight * 0.38;
  const baseScale = 1 + weight * 0.5;

  // Smoothly scale the word up when hovered and back down when not
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const target = isHovered ? baseScale * 1.3 : baseScale;
    meshRef.current.scale.lerp(
      new THREE.Vector3(target, target, target),
      delta * 8
    );
  });

  return (
    // Billboard makes the word always face the camera as the scene rotates
    <Billboard position={position}>
      <mesh
        ref={meshRef}
        scale={[baseScale, baseScale, baseScale]}
        onPointerEnter={() => onHover(word)}
        onPointerLeave={() => onHover(null)}
      >
        <Text
          fontSize={fontSize}
          color={isHovered ? '#ffffff' : color} // turn white on hover
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.4 + weight * 0.6} // more important words are more opaque
        >
          {word}
        </Text>
      </mesh>
    </Billboard>
  );
}

interface WordCloudProps {
  words: WordData[];
}

export function WordCloud({ words }: WordCloudProps) {
  const groupRef = useRef<THREE.Group>(null!);

  // Track which word the mouse is currently hovering over
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  // Sort by weight so most important words get the best positions
  // Limit to 60 words so the scene doesn't get too crowded
  const sortedWords = useMemo(
    () => [...words].sort((a, b) => b.weight - a.weight).slice(0, 60),
    [words]
  );

  // Calculate a position on the sphere for each word
  // More important words are placed closer to the center
  const positions = useMemo<[number, number, number][]>(() => {
    return sortedWords.map((w, i) => {
      const [x, y, z] = sphericalFibonacci(sortedWords.length, i);
      const radius = 2.5 + (1 - w.weight) * 1.5;
      return [x * radius, y * radius, z * radius];
    });
  }, [sortedWords]);

  // Slowly rotate the entire word cloud automatically
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.rotation.x += delta * 0.02;
  });

  return (
    <group ref={groupRef}>
      {sortedWords.map((word, i) => (
        <WordBubble
          key={word.word}
          word={word.word}
          weight={word.weight}
          topic={word.topic}
          position={positions[i]}
          onHover={setHoveredWord}
          isHovered={hoveredWord === word.word}
        />
      ))}
    </group>
  );
}