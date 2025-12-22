'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

// Core concepts that connect courses
const concepts = [
  { id: 'shadow', label: 'Shadow Work', pillar: 'mind', description: 'Working with repressed parts of yourself' },
  { id: 'attachment', label: 'Attachment', pillar: 'relationships', description: 'How early bonds shape adult relating' },
  { id: 'nervous-system', label: 'Nervous System', pillar: 'body', description: 'Regulation, safety, and stress response' },
  { id: 'presence', label: 'Presence', pillar: 'soul', description: 'Being fully here, now' },
  { id: 'polarity', label: 'Polarity', pillar: 'relationships', description: 'Masculine-feminine dynamics' },
  { id: 'embodiment', label: 'Embodiment', pillar: 'body', description: 'Living wisdom in the body' },
  { id: 'archetypes', label: 'Archetypes', pillar: 'mind', description: 'Universal patterns of being' },
  { id: 'boundaries', label: 'Boundaries', pillar: 'relationships', description: 'Knowing where you end and others begin' },
  { id: 'meaning', label: 'Meaning', pillar: 'soul', description: 'Purpose, values, what matters' },
  { id: 'emotions', label: 'Emotions', pillar: 'mind', description: 'Feeling and processing emotional experience' },
  { id: 'trauma', label: 'Trauma', pillar: 'mind', description: 'Wounds and their healing' },
  { id: 'intimacy', label: 'Intimacy', pillar: 'relationships', description: 'Deep connection and vulnerability' },
  { id: 'masculinity', label: 'Masculinity', pillar: 'body', description: 'Healthy masculine expression' },
  { id: 'femininity', label: 'Femininity', pillar: 'body', description: 'Healthy feminine expression' },
  { id: 'meditation', label: 'Meditation', pillar: 'soul', description: 'Training attention and awareness' },
  { id: 'self-worth', label: 'Self-Worth', pillar: 'mind', description: 'Your fundamental value' },
  { id: 'communication', label: 'Communication', pillar: 'relationships', description: 'Expressing and receiving clearly' },
  { id: 'grief', label: 'Grief', pillar: 'soul', description: 'Processing loss and letting go' },
];

// Sample courses with their concept connections
const courses = [
  {
    id: 'shadow-work-fundamentals',
    label: 'Shadow Work Fundamentals',
    concepts: ['shadow', 'emotions', 'archetypes', 'self-worth'],
    pillar: 'mind',
    description: 'Meet the parts of yourself you\'ve hidden away'
  },
  {
    id: 'dating-for-men',
    label: 'Dating for Men',
    concepts: ['presence', 'polarity', 'masculinity', 'attachment', 'communication'],
    pillar: 'relationships',
    description: 'Authentic attraction through grounded presence'
  },
  {
    id: 'dating-for-women',
    label: 'Dating for Women',
    concepts: ['femininity', 'boundaries', 'attachment', 'polarity', 'self-worth'],
    pillar: 'relationships',
    description: 'Discernment, standards, and feminine power'
  },
  {
    id: 'nervous-system-fundamentals',
    label: 'Nervous System Fundamentals',
    concepts: ['nervous-system', 'embodiment', 'trauma', 'emotions'],
    pillar: 'body',
    description: 'Understanding your body\'s stress and safety signals'
  },
  {
    id: 'attachment-styles',
    label: 'Attachment Styles',
    concepts: ['attachment', 'emotions', 'intimacy', 'boundaries'],
    pillar: 'relationships',
    description: 'Why you relate the way you do'
  },
  {
    id: 'embodied-masculinity',
    label: 'Embodied Masculinity',
    concepts: ['masculinity', 'presence', 'embodiment', 'polarity', 'boundaries'],
    pillar: 'body',
    description: 'Strength, groundedness, and healthy masculine expression'
  },
  {
    id: 'feminine-embodiment',
    label: 'Feminine Embodiment',
    concepts: ['femininity', 'embodiment', 'presence', 'emotions'],
    pillar: 'body',
    description: 'Receptivity, flow, and healthy feminine expression'
  },
  {
    id: 'meaning-and-purpose',
    label: 'Meaning & Purpose',
    concepts: ['meaning', 'shadow', 'archetypes', 'grief'],
    pillar: 'soul',
    description: 'Finding what matters and why you\'re here'
  },
  {
    id: 'meditation-foundations',
    label: 'Meditation Foundations',
    concepts: ['meditation', 'presence', 'nervous-system', 'emotions'],
    pillar: 'soul',
    description: 'Training attention for clarity and calm'
  },
  {
    id: 'relationship-repair',
    label: 'Relationship Repair',
    concepts: ['attachment', 'boundaries', 'intimacy', 'emotions', 'communication'],
    pillar: 'relationships',
    description: 'Healing ruptures and rebuilding trust'
  },
  {
    id: 'burnout-recovery',
    label: 'Burnout Recovery',
    concepts: ['nervous-system', 'boundaries', 'meaning', 'self-worth'],
    pillar: 'body',
    description: 'Coming back from exhaustion'
  },
  {
    id: 'grief-and-loss',
    label: 'Grief & Loss',
    concepts: ['grief', 'emotions', 'meaning', 'presence'],
    pillar: 'soul',
    description: 'Moving through loss without bypassing'
  },
];

// Pillar colors
const pillarColors: Record<string, string> = {
  mind: '#9B8B7A',
  body: '#8B9B8A',
  soul: '#8A8B9B',
  relationships: '#B8956B',
};

const pillarNames: Record<string, string> = {
  mind: 'Mind',
  body: 'Body',
  soul: 'Soul',
  relationships: 'Relationships',
};

interface Node {
  id: string;
  label: string;
  type: 'course' | 'concept';
  pillar: string;
  description?: string;
  concepts?: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Edge {
  source: string;
  target: string;
  type: 'course-concept' | 'course-course';
}

export default function ExploreGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<Node[]>([]);

  // Initialize nodes and edges
  useEffect(() => {
    const initNodes: Node[] = [];
    const initEdges: Edge[] = [];

    // Add course nodes (outer ring)
    courses.forEach((course, i) => {
      const angle = (i / courses.length) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
      initNodes.push({
        id: course.id,
        label: course.label,
        type: 'course',
        pillar: course.pillar,
        description: course.description,
        concepts: course.concepts,
        x: dimensions.width / 2 + Math.cos(angle) * radius,
        y: dimensions.height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 14,
      });
    });

    // Add concept nodes (inner area)
    concepts.forEach((concept, i) => {
      const angle = (i / concepts.length) * Math.PI * 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.15;
      initNodes.push({
        id: concept.id,
        label: concept.label,
        type: 'concept',
        pillar: concept.pillar,
        description: concept.description,
        x: dimensions.width / 2 + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
        y: dimensions.height / 2 + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        radius: 6,
      });
    });

    // Create edges: course to concept
    courses.forEach(course => {
      course.concepts.forEach(conceptId => {
        initEdges.push({
          source: course.id,
          target: conceptId,
          type: 'course-concept',
        });
      });
    });

    setNodes(initNodes);
    setEdges(initEdges);
    nodesRef.current = initNodes;
  }, [dimensions]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.offsetWidth, 1200);
        setDimensions({
          width,
          height: Math.min(600, window.innerHeight * 0.6),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Physics simulation and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    let localNodes = [...nodes];
    nodesRef.current = localNodes;

    const simulate = () => {
      // Apply forces
      localNodes.forEach(node => {
        // Center gravity (stronger for concepts)
        const centerForce = node.type === 'concept' ? 0.0003 : 0.0001;
        const dx = dimensions.width / 2 - node.x;
        const dy = dimensions.height / 2 - node.y;
        node.vx += dx * centerForce;
        node.vy += dy * centerForce;

        // Repulsion between nodes
        localNodes.forEach(other => {
          if (other.id !== node.id) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = (node.radius + other.radius) * 3;
            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.03;
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
          const idealDist = edge.type === 'course-concept' ? 120 : 150;
          const force = (dist - idealDist) * 0.0003;
          source.vx += dx * force;
          source.vy += dy * force;
          target.vx -= dx * force;
          target.vy -= dy * force;
        }
      });

      // Update positions with damping
      localNodes.forEach(node => {
        node.vx *= 0.92;
        node.vy *= 0.92;
        node.x += node.vx;
        node.y += node.vy;

        // Keep within bounds
        const padding = 50;
        node.x = Math.max(padding, Math.min(dimensions.width - padding, node.x));
        node.y = Math.max(padding, Math.min(dimensions.height - padding, node.y));
      });

      // Determine which nodes/edges to highlight
      const activeNode = selectedNode || hoveredNode;
      const highlightedConcepts = activeNode?.type === 'course' ? activeNode.concepts || [] : [];
      const highlightedCourses = activeNode?.type === 'concept'
        ? courses.filter(c => c.concepts.includes(activeNode.id)).map(c => c.id)
        : [];

      // Draw
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw edges
      edges.forEach(edge => {
        const source = localNodes.find(n => n.id === edge.source);
        const target = localNodes.find(n => n.id === edge.target);
        if (source && target) {
          const isHighlighted = activeNode && (
            (activeNode.type === 'course' && activeNode.id === source.id) ||
            (activeNode.type === 'concept' && activeNode.id === target.id)
          );

          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = isHighlighted
            ? `${pillarColors[source.pillar]}99`
            : 'rgba(70, 70, 70, 0.25)';
          ctx.lineWidth = isHighlighted ? 2 : 1;
          ctx.stroke();
        }
      });

      // Draw nodes
      localNodes.forEach(node => {
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;
        const isHighlighted = highlightedConcepts.includes(node.id) || highlightedCourses.includes(node.id);
        const isDimmed = activeNode && !isHovered && !isSelected && !isHighlighted && node.id !== activeNode.id;

        const color = pillarColors[node.pillar] || '#B8956B';
        const alpha = isDimmed ? '40' : 'FF';

        // Glow for highlighted/hovered
        if ((isHighlighted || isHovered || isSelected) && !isDimmed) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = `${color}30`;
          ctx.fill();
        }

        // Main node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * (isHovered || isSelected ? 1.2 : 1), 0, Math.PI * 2);
        ctx.fillStyle = `${color}${alpha}`;
        ctx.fill();

        // Border for courses
        if (node.type === 'course') {
          ctx.strokeStyle = `${color}${isDimmed ? '40' : 'CC'}`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Labels
        const showLabel = node.type === 'course' || isHovered || isSelected || isHighlighted;
        if (showLabel && !isDimmed) {
          ctx.font = `${node.type === 'course' ? '11px' : '10px'} system-ui, sans-serif`;
          ctx.fillStyle = isHovered || isSelected ? '#ffffff' : '#999999';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + node.radius + 14);
        }
      });

      nodesRef.current = localNodes;
      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length, edges, dimensions, hoveredNode, selectedNode]);

  // Mouse interaction
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hovered = nodesRef.current.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius * 2;
    });

    setHoveredNode(hovered || null);
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredNode) {
      setSelectedNode(selectedNode?.id === hoveredNode.id ? null : hoveredNode);
    } else {
      setSelectedNode(null);
    }
  }, [hoveredNode, selectedNode]);

  // Get related courses for selected concept
  const getRelatedCourses = (conceptId: string) => {
    return courses.filter(c => c.concepts.includes(conceptId));
  };

  // Get shared concepts between two courses
  const getSharedConcepts = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return [];
    return course.concepts.map(cid => concepts.find(c => c.id === cid)).filter(Boolean);
  };

  const activeNode = selectedNode || hoveredNode;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Graph */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas
          ref={canvasRef}
          style={{ width: dimensions.width, height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => !selectedNode && setHoveredNode(null)}
          onClick={handleClick}
          className="rounded-lg bg-zinc-900/50 border border-zinc-800"
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 text-xs">
          {Object.entries(pillarColors).map(([pillar, color]) => (
            <div key={pillar} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-gray-500">{pillarNames[pillar]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="lg:w-80 bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        {activeNode ? (
          <div className="space-y-4">
            {/* Node info */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pillarColors[activeNode.pillar] }}
                />
                <span className="text-xs text-gray-500 uppercase tracking-wide">
                  {activeNode.type === 'course' ? 'Course' : 'Concept'} · {pillarNames[activeNode.pillar]}
                </span>
              </div>
              <h3 className="font-serif text-xl text-white">{activeNode.label}</h3>
              {activeNode.description && (
                <p className="text-gray-400 text-sm mt-2">{activeNode.description}</p>
              )}
            </div>

            {/* For courses: show concepts */}
            {activeNode.type === 'course' && activeNode.concepts && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">Teaches</h4>
                <div className="flex flex-wrap gap-2">
                  {activeNode.concepts.map(cid => {
                    const concept = concepts.find(c => c.id === cid);
                    return concept ? (
                      <span
                        key={cid}
                        className="px-2 py-1 text-xs rounded-full border"
                        style={{
                          borderColor: pillarColors[concept.pillar],
                          color: pillarColors[concept.pillar]
                        }}
                      >
                        {concept.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* For concepts: show related courses */}
            {activeNode.type === 'concept' && (
              <div>
                <h4 className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Courses that teach this
                </h4>
                <div className="space-y-2">
                  {getRelatedCourses(activeNode.id).map(course => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="block p-2 rounded border border-zinc-700 hover:border-zinc-500 transition-colors"
                    >
                      <span className="text-white text-sm">{course.label}</span>
                      <span
                        className="ml-2 text-xs"
                        style={{ color: pillarColors[course.pillar] }}
                      >
                        {pillarNames[course.pillar]}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Action button for courses */}
            {activeNode.type === 'course' && (
              <Link
                href={`/courses/${activeNode.id}`}
                className="block w-full text-center px-4 py-2 border border-zinc-600 text-gray-300 hover:bg-zinc-800 hover:text-white transition-colors rounded text-sm"
              >
                View Course →
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="mb-4">Hover over a node to see details</p>
            <p className="text-sm">
              <strong className="text-gray-400">Large nodes</strong> are courses<br />
              <strong className="text-gray-400">Small nodes</strong> are concepts<br />
              <strong className="text-gray-400">Lines</strong> show what each course teaches
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
