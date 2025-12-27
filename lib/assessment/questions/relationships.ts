/**
 * RELATIONSHIPS PILLAR ASSESSMENT QUESTIONS
 *
 * 9 Dimensions, 57 Questions
 *
 * Dimensions:
 * 1. Attachment Patterns (8 questions)
 * 2. Relational Communication (7 questions)
 * 3. Boundary Health (7 questions)
 * 4. Conflict & Repair (7 questions)
 * 5. Trust & Vulnerability (6 questions)
 * 6. Empathy & Attunement (6 questions)
 * 7. Intimacy & Depth (6 questions)
 * 8. Social Connection (5 questions)
 * 9. Relational Self-Awareness (5 questions)
 */

import type { Question } from '../types';

export const RELATIONSHIPS_QUESTIONS: Question[] = [
  // ==========================================================================
  // DIMENSION 1: ATTACHMENT PATTERNS (8 questions)
  // ==========================================================================

  // Facet: Security in Connection
  {
    id: 'rel_attach_secure_1',
    text: 'I feel secure in my close relationships.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'attachment-security',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_attach_secure_2',
    text: 'I trust that the people close to me will be there when I need them.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'attachment-security',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_attach_secure_3',
    text: 'I can depend on others without losing myself.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'attachment-security',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Abandonment Response
  {
    id: 'rel_attach_abandon_1',
    text: 'I worry about being abandoned or rejected by people I care about.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'abandonment-patterns',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_attach_abandon_2',
    text: 'Small signs of distance in a relationship trigger intense anxiety for me.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'abandonment-patterns',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Avoidance Patterns
  {
    id: 'rel_attach_avoid_1',
    text: 'I feel uncomfortable when relationships become too close.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'avoidance-patterns',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_attach_avoid_2',
    text: 'I pull away when someone wants to get emotionally close.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'avoidance-patterns',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_attach_avoid_3',
    text: 'I am comfortable with intimacy and emotional closeness.',
    pillar: 'relationships',
    dimensionId: 'attachment-patterns',
    facetId: 'avoidance-patterns',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 2: RELATIONAL COMMUNICATION (7 questions)
  // ==========================================================================

  // Facet: Expression Clarity
  {
    id: 'rel_comm_express_1',
    text: 'I can clearly express my needs and feelings to others.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'expression-clarity',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_comm_express_2',
    text: 'I struggle to put my emotions into words.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'expression-clarity',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Receptive Listening
  {
    id: 'rel_comm_listen_1',
    text: 'When someone is talking to me, I truly listen rather than planning my response.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'receptive-listening',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'rel_comm_listen_2',
    text: 'Others feel heard and understood by me.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'receptive-listening',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Difficult Conversations
  {
    id: 'rel_comm_difficult_1',
    text: 'I can have difficult conversations without becoming defensive or shutting down.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'difficult-conversations',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_comm_difficult_2',
    text: 'I avoid important conversations because I fear conflict.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'difficult-conversations',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_comm_difficult_3',
    text: 'I can stay calm and present during tense discussions.',
    pillar: 'relationships',
    dimensionId: 'communication',
    facetId: 'difficult-conversations',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 3: BOUNDARY HEALTH (7 questions)
  // ==========================================================================

  // Facet: Boundary Awareness
  {
    id: 'rel_bound_aware_1',
    text: 'I know what my personal limits are in relationships.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_bound_aware_2',
    text: 'I recognize when someone is crossing my boundaries.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-awareness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Boundary Communication
  {
    id: 'rel_bound_comm_1',
    text: 'I can say no when I need to, even when it disappoints others.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-communication',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_bound_comm_2',
    text: 'I have difficulty setting limits with others.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-communication',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Boundary Maintenance
  {
    id: 'rel_bound_maintain_1',
    text: 'I hold my boundaries even when others push back.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-maintenance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'rel_bound_maintain_2',
    text: 'I give in to others\' demands even when it violates my limits.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-maintenance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_bound_maintain_3',
    text: 'I maintain my boundaries with compassion rather than rigidity.',
    pillar: 'relationships',
    dimensionId: 'boundaries',
    facetId: 'boundary-maintenance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 4: CONFLICT & REPAIR (7 questions)
  // ==========================================================================

  // Facet: Conflict Style
  {
    id: 'rel_conflict_style_1',
    text: 'I can engage constructively with disagreements.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'conflict-style',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_conflict_style_2',
    text: 'During conflict, I become defensive, attack, or shut down.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'conflict-style',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_conflict_style_3',
    text: 'I can express my perspective in conflict without attacking the other person.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'conflict-style',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Repair Initiation
  {
    id: 'rel_conflict_initiate_1',
    text: 'After a disagreement, I am willing to reach out first to repair things.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'repair-initiation',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },
  {
    id: 'rel_conflict_initiate_2',
    text: 'I take responsibility for my part in conflicts.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'repair-initiation',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Repair Reception
  {
    id: 'rel_conflict_receive_1',
    text: 'I can accept apologies and move forward after being hurt.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'repair-reception',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_conflict_receive_2',
    text: 'I hold onto grudges and resentments.',
    pillar: 'relationships',
    dimensionId: 'conflict-repair',
    facetId: 'repair-reception',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 5: TRUST & VULNERABILITY (6 questions)
  // ==========================================================================

  // Facet: Trust Capacity
  {
    id: 'rel_trust_cap_1',
    text: 'I can trust others appropriately based on their track record.',
    pillar: 'relationships',
    dimensionId: 'trust-vulnerability',
    facetId: 'trust-capacity',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_trust_cap_2',
    text: 'I am suspicious of others\' motives even when there is no reason to be.',
    pillar: 'relationships',
    dimensionId: 'trust-vulnerability',
    facetId: 'trust-capacity',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_trust_cap_3',
    text: 'I give people a fair chance to earn my trust.',
    pillar: 'relationships',
    dimensionId: 'trust-vulnerability',
    facetId: 'trust-capacity',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Vulnerability Tolerance
  {
    id: 'rel_trust_vuln_1',
    text: 'I can be emotionally vulnerable with people I trust.',
    pillar: 'relationships',
    dimensionId: 'trust-vulnerability',
    facetId: 'vulnerability-tolerance',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_trust_vuln_2',
    text: 'I keep my guard up even with close friends and family.',
    pillar: 'relationships',
    dimensionId: 'trust-vulnerability',
    facetId: 'vulnerability-tolerance',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_trust_vuln_3',
    text: 'I am comfortable letting others see my imperfections.',
    pillar: 'relationships',
    dimensionId: 'trust-vulnerability',
    facetId: 'vulnerability-tolerance',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 6: EMPATHY & ATTUNEMENT (6 questions)
  // ==========================================================================

  // Facet: Empathic Accuracy
  {
    id: 'rel_empathy_accuracy_1',
    text: 'I can accurately sense what others are feeling.',
    pillar: 'relationships',
    dimensionId: 'empathy-attunement',
    facetId: 'empathic-accuracy',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_empathy_accuracy_2',
    text: 'I often misread other people\'s emotional states.',
    pillar: 'relationships',
    dimensionId: 'empathy-attunement',
    facetId: 'empathic-accuracy',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_empathy_accuracy_3',
    text: 'I pick up on subtle cues about how others are feeling.',
    pillar: 'relationships',
    dimensionId: 'empathy-attunement',
    facetId: 'empathic-accuracy',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Empathic Response
  {
    id: 'rel_empathy_response_1',
    text: 'When someone shares their feelings, I know how to respond supportively.',
    pillar: 'relationships',
    dimensionId: 'empathy-attunement',
    facetId: 'empathic-response',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_empathy_response_2',
    text: 'I feel awkward or unsure when others express strong emotions.',
    pillar: 'relationships',
    dimensionId: 'empathy-attunement',
    facetId: 'empathic-response',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_empathy_response_3',
    text: 'Others feel comforted and supported by me.',
    pillar: 'relationships',
    dimensionId: 'empathy-attunement',
    facetId: 'empathic-response',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 7: INTIMACY & DEPTH (6 questions)
  // ==========================================================================

  // Facet: Intimacy Capacity
  {
    id: 'rel_intim_cap_1',
    text: 'I have relationships with deep emotional connection.',
    pillar: 'relationships',
    dimensionId: 'intimacy-depth',
    facetId: 'intimacy-capacity',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_intim_cap_2',
    text: 'My relationships stay at a surface level.',
    pillar: 'relationships',
    dimensionId: 'intimacy-depth',
    facetId: 'intimacy-capacity',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_intim_cap_3',
    text: 'I create meaningful depth of connection with others.',
    pillar: 'relationships',
    dimensionId: 'intimacy-depth',
    facetId: 'intimacy-capacity',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // Facet: Intimacy Comfort
  {
    id: 'rel_intim_comfort_1',
    text: 'I am comfortable with increasing closeness in relationships.',
    pillar: 'relationships',
    dimensionId: 'intimacy-depth',
    facetId: 'intimacy-comfort',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_intim_comfort_2',
    text: 'When relationships become too close, I feel a need to create distance.',
    pillar: 'relationships',
    dimensionId: 'intimacy-depth',
    facetId: 'intimacy-comfort',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },
  {
    id: 'rel_intim_comfort_3',
    text: 'Deep intimacy feels safe and natural to me.',
    pillar: 'relationships',
    dimensionId: 'intimacy-depth',
    facetId: 'intimacy-comfort',
    type: 'agreement',
    scale: 7,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 8: SOCIAL CONNECTION (5 questions)
  // ==========================================================================

  // Facet: Sense of Belonging
  {
    id: 'rel_social_belong_1',
    text: 'I feel like I belong in communities and groups.',
    pillar: 'relationships',
    dimensionId: 'social-connection',
    facetId: 'social-belonging',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_social_belong_2',
    text: 'I often feel like an outsider.',
    pillar: 'relationships',
    dimensionId: 'social-connection',
    facetId: 'social-belonging',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // Facet: Connection Quality
  {
    id: 'rel_social_quality_1',
    text: 'I have people in my life I can turn to for support.',
    pillar: 'relationships',
    dimensionId: 'social-connection',
    facetId: 'connection-quality',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_social_quality_2',
    text: 'My social connections are meaningful rather than superficial.',
    pillar: 'relationships',
    dimensionId: 'social-connection',
    facetId: 'connection-quality',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_social_quality_3',
    text: 'I feel lonely even when I am around other people.',
    pillar: 'relationships',
    dimensionId: 'social-connection',
    facetId: 'connection-quality',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    reverseScored: true,
    required: true,
  },

  // ==========================================================================
  // DIMENSION 9: RELATIONAL SELF-AWARENESS (5 questions)
  // ==========================================================================

  // Facet: Pattern Awareness
  {
    id: 'rel_aware_pattern_1',
    text: 'I am aware of my patterns in relationships.',
    pillar: 'relationships',
    dimensionId: 'relational-patterns',
    facetId: 'pattern-awareness',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_aware_pattern_2',
    text: 'I notice recurring dynamics in my relationships.',
    pillar: 'relationships',
    dimensionId: 'relational-patterns',
    facetId: 'pattern-awareness',
    type: 'frequency',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Almost always'],
    required: true,
  },

  // Facet: Origin Understanding
  {
    id: 'rel_aware_origin_1',
    text: 'I understand how my early experiences shaped my relationship patterns.',
    pillar: 'relationships',
    dimensionId: 'relational-patterns',
    facetId: 'origin-understanding',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_aware_origin_2',
    text: 'I can see connections between my current relationships and my family of origin.',
    pillar: 'relationships',
    dimensionId: 'relational-patterns',
    facetId: 'origin-understanding',
    type: 'agreement',
    scale: 7,
    required: true,
  },
  {
    id: 'rel_aware_origin_3',
    text: 'I have worked to understand and heal relationship wounds from my past.',
    pillar: 'relationships',
    dimensionId: 'relational-patterns',
    facetId: 'origin-understanding',
    type: 'agreement',
    scale: 7,
    required: true,
    sensitive: true,
  },
];

export const RELATIONSHIPS_QUESTION_COUNT = RELATIONSHIPS_QUESTIONS.length;
