'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

// Core concepts that connect courses
const concepts = [
  { id: 'shadow', label: 'Shadow Work', pillar: 'mind' },
  { id: 'attachment', label: 'Attachment', pillar: 'relationships' },
  { id: 'nervous-system', label: 'Nervous System', pillar: 'body' },
  { id: 'presence', label: 'Presence', pillar: 'soul' },
  { id: 'polarity', label: 'Polarity', pillar: 'relationships' },
  { id: 'embodiment', label: 'Embodiment', pillar: 'body' },
  { id: 'archetypes', label: 'Archetypes', pillar: 'mind' },
  { id: 'boundaries', label: 'Boundaries', pillar: 'relationships' },
  { id: 'meaning', label: 'Meaning', pillar: 'soul' },
  { id: 'emotions', label: 'Emotional Processing', pillar: 'mind' },
  { id: 'trauma', label: 'Trauma & Healing', pillar: 'mind' },
  { id: 'intimacy', label: 'Intimacy', pillar: 'relationships' },
  { id: 'masculinity', label: 'Masculinity', pillar: 'body' },
  { id: 'femininity', label: 'Femininity', pillar: 'body' },
  { id: 'meditation', label: 'Meditation', pillar: 'soul' },
];

// Sample courses with their concept connections
const courses = [
  { id: 'shadow-work-fundamentals', label: 'Shadow Work', concepts: ['shadow', 'emotions', 'archetypes'], pillar: 'mind' },
  { id: 'dating-for-men', label: 'Dating for Men', concepts: ['presence', 'polarity', 'masculinity', 'attachment'], pillar: 'relationships' },
  { id: 'dating-for-women', label: 'Dating for Women', concepts: ['femininity', 'boundaries', 'attachment', 'polarity'], pillar: 'relationships' },
  { id: 'nervous-system-fundamentals', label: 'Nervous System', concepts: ['nervous-system', 'embodiment', 'trauma'], pillar: 'body' },
  { id: 'attachment-styles', label: 'Attachment Styles', concepts: ['attachment', 'emotions', 'intimacy'], pillar: 'relationships' },
  { id: 'embodied-masculinity', label: 'Embodied Masculinity', concepts: ['masculinity', 'presence', 'embodiment', 'polarity'], pillar: 'body' },
  { id: 'feminine-embodiment', label: 'Feminine Embodiment', concepts: ['femininity', 'embodiment', 'presence'], pillar: 'body' },
  { id: 'meaning-and-purpose', label: 'Meaning & Purpose', concepts: ['meaning', 'shadow', 'archetypes'], pillar: 'soul' },
  { id: 'meditation-foundations', label: 'Meditation', concepts: ['meditation', 'presence', 'nervous-system'], pillar: 'soul' },
  { id: 'relationship-repair', label: 'Relationship Repair', concepts: ['attachment', 'boundaries', 'intimacy', 'emotions'], pillar: 'relationships' },
];

// Pillar colors (muted versions)
const pillarColors: Record<string, string> = {
  mind: '#9B8B7A',      // Muted warm gray-brown
  body: '#8B9B8A',      // Muted sage green
  soul: '#8A8B9B',      // Muted blue-gray
  relationships: '#B8956B', // Warm amber/gold
};

interface Node {
  id: string;
  label: string;
  type: 'course' | 'concept';
  pillar: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Edge {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  variant?: 'full' | 'compact';
  focusPillar?: string;
  showLabels?: boolean;
  interactive?: boolean;
  height?: number;
}

export default function KnowledgeGraph({
  variant = 'compact',
  focusPillar,
  showLabels = true,
  interactive = true,
  height = 400,
}: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height });
  const animationRef = useRef<number | null>(null);

  // Initialize nodes and edges
  useEffect(() => {
    const initNodes: Node[] = [];
    const initEdges: Edge[] = [];

    // Add course nodes
    courses.forEach((course, i) => {
      if (focusPillar && course.pillar !== focusPillar) return;

      const angle = (i / courses.length) * Math.PI * 2;
      const radius = dimensions.width * 0.3;
      initNodes.push({
        id: course.id,
        label: course.label,
        type: 'course',
        pillar: course.pillar,
        x: dimensions.width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 50,
        y: dimensions.height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 50,
        vx: 0,
        vy: 0,
        radius: variant === 'compact' ? 8 : 12,
      });

      // Create edges between courses that share concepts
      course.concepts.forEach(conceptId => {
        courses.forEach(otherCourse => {
          if (otherCourse.id !== course.id && otherCourse.concepts.includes(conceptId)) {
            // Avoid duplicate edges
            const edgeExists = initEdges.some(
              e => (e.source === course.id && e.target === otherCourse.id) ||
                   (e.source === otherCourse.id && e.target === course.id)
            );
            if (!edgeExists) {
              initEdges.push({ source: course.id, target: otherCourse.id });
            }
          }
        });
      });
    });

    // Add concept nodes (smaller, in between)
    if (variant === 'full') {
      concepts.forEach((concept, i) => {
        if (focusPillar && concept.pillar !== focusPillar) return;

        const angle = (i / concepts.length) * Math.PI * 2;
        const radius = dimensions.width * 0.15;
        initNodes.push({
          id: concept.id,
          label: concept.label,
          type: 'concept',
          pillar: concept.pillar,
          x: dimensions.width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
          y: dimensions.height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
          vx: 0,
          vy: 0,
          radius: 5,
        });
      });
    }

    setNodes(initNodes);
    setEdges(initEdges);
  }, [dimensions, variant, focusPillar]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Physics simulation and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    let localNodes = [...nodes];

    const simulate = () => {
      // Apply forces
      localNodes.forEach(node => {
        // Center gravity
        const dx = dimensions.width / 2 - node.x;
        const dy = dimensions.height / 2 - node.y;
        node.vx += dx * 0.0001;
        node.vy += dy * 0.0001;

        // Repulsion between nodes
        localNodes.forEach(other => {
          if (other.id !== node.id) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (node.radius + other.radius) * 4;
            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.05;
              node.vx += dx * force;
              node.vy += dy * force;
            }
          }
        });
      });

      // Apply edge attraction
      edges.forEach(edge => {
        const source = localNodes.find(n => n.id === edge.source);
        const target = localNodes.find(n => n.id === edge.target);
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 100) * 0.0005;
          source.vx += dx * force;
          source.vy += dy * force;
          target.vx -= dx * force;
          target.vy -= dy * force;
        }
      });

      // Update positions with damping
      localNodes.forEach(node => {
        node.vx *= 0.9;
        node.vy *= 0.9;
        node.x += node.vx;
        node.y += node.vy;

        // Keep within bounds
        const padding = 30;
        node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x));
        node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y));
      });

      // Draw
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw edges
      edges.forEach(edge => {
        const source = localNodes.find(n => n.id === edge.source);
        const target = localNodes.find(n => n.id === edge.target);
        if (source && target) {
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Draw nodes
      localNodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const color = pillarColors[node.pillar] || '#B8956B';

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (isHovered ? 1.3 : 1), 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? color : `${color}CC`;
        ctx.fill();

        // Glow effect
        if (node.type === 'course') {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `${color}20`;
          ctx.fill();
        }

        // Labels
        if (showLabels && (node.type === 'course' || isHovered)) {
          ctx.font = `${isHovered ? '12px' : '10px'} system-ui, sans-serif`;
          ctx.fillStyle = isHovered ? '#ffffff' : '#888888';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + node.radius + 14);
        }
      });

      setNodes([...localNodes]);
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, edges, dimensions, hoveredNode, showLabels]);

  // Mouse interaction
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
    });

    setHoveredNode(hovered || null);
    canvas.style.cursor = hovered?.type === 'course' ? 'pointer' : 'default';
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive || !hoveredNode || hoveredNode.type !== 'course') return;

    // Navigate to course
    window.location.href = `/courses/${hoveredNode.id}`;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={handleClick}
        className="rounded-lg"
      />

      {/* Legend */}
      {variant === 'full' && (
        <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pillarColors.mind }} />
            <span>Mind</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pillarColors.body }} />
            <span>Body</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pillarColors.soul }} />
            <span>Soul</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: pillarColors.relationships }} />
            <span>Relationships</span>
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredNode && hoveredNode.type === 'course' && (
        <div className="absolute top-4 right-4 bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-sm max-w-xs">
          <p className="text-white font-medium">{hoveredNode.label}</p>
          <p className="text-gray-400 text-xs mt-1">Click to view course</p>
        </div>
      )}
    </div>
  );
}
