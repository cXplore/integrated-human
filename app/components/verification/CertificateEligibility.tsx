'use client';

import { useState, useEffect } from 'react';
import { Award, CheckCircle, Circle, Lock, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Requirement {
  requirement: string;
  met: boolean;
  details?: string;
}

interface EligibilityStatus {
  eligible: boolean;
  requirements: Requirement[];
}

interface Props {
  courseSlug: string;
  courseName: string;
  courseTier: 'intro' | 'beginner' | 'intermediate' | 'advanced' | 'flagship';
}

export default function CertificateEligibility({ courseSlug, courseName, courseTier }: Props) {
  const [status, setStatus] = useState<EligibilityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    checkEligibility();
  }, [courseSlug]);

  async function checkEligibility() {
    try {
      const res = await fetch(`/api/verification/gate?course=${courseSlug}&certificate=true`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to check eligibility:', error);
    } finally {
      setLoading(false);
    }
  }

  async function claimCertificate() {
    setClaiming(true);
    try {
      const res = await fetch('/api/certificates/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to certificate page
        window.location.href = `/certificate/${data.certificateId}`;
      }
    } catch (error) {
      console.error('Failed to claim certificate:', error);
    } finally {
      setClaiming(false);
    }
  }

  const isVerifiedCourse = ['advanced', 'flagship'].includes(courseTier);
  const credentialType = isVerifiedCourse ? 'Certificate' : 'Completion Record';

  if (loading) {
    return (
      <div className="animate-pulse bg-zinc-800/50 rounded-lg p-6">
        <div className="h-6 bg-zinc-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-zinc-700 rounded w-full"></div>
          <div className="h-4 bg-zinc-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const metCount = status.requirements.filter(r => r.met).length;
  const totalCount = status.requirements.length;
  const progress = Math.round((metCount / totalCount) * 100);

  return (
    <div className={`rounded-lg border overflow-hidden ${
      status.eligible
        ? 'bg-gradient-to-br from-amber-900/20 to-amber-800/10 border-amber-700/50'
        : 'bg-zinc-800/30 border-zinc-700'
    }`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${
            status.eligible ? 'bg-amber-600/20' : 'bg-zinc-700/50'
          }`}>
            <Award className={`w-8 h-8 ${
              status.eligible ? 'text-amber-400' : 'text-zinc-500'
            }`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">
              {credentialType}
            </h3>
            <p className="text-zinc-400 text-sm">
              {status.eligible
                ? `You've earned your ${credentialType.toLowerCase()} for ${courseName}!`
                : `Complete the requirements below to earn your ${credentialType.toLowerCase()}.`}
            </p>

            {/* Progress bar */}
            {!status.eligible && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-zinc-500 mb-1">
                  <span>{metCount} of {totalCount} requirements met</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Requirements List */}
      <div className="border-t border-zinc-700/50">
        {status.requirements.map((req, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-6 py-3 ${
              i !== status.requirements.length - 1 ? 'border-b border-zinc-700/30' : ''
            }`}
          >
            {req.met ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-zinc-600 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${req.met ? 'text-zinc-300' : 'text-zinc-400'}`}>
                {req.requirement}
              </p>
              {req.details && (
                <p className="text-xs text-zinc-500 mt-0.5">{req.details}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div className="p-4 bg-zinc-800/30 border-t border-zinc-700/50">
        {status.eligible ? (
          <button
            onClick={claimCertificate}
            disabled={claiming}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-700 text-white rounded-lg font-medium transition-colors"
          >
            {claiming ? (
              'Generating...'
            ) : (
              <>
                <Award className="w-5 h-5" />
                Claim Your {credentialType}
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {isVerifiedCourse
                ? 'Complete all requirements to earn a verified certificate.'
                : 'Complete the course to receive your completion record.'}
            </p>
            <Lock className="w-5 h-5 text-zinc-600" />
          </div>
        )}
      </div>

      {/* Verified Badge Info */}
      {isVerifiedCourse && status.eligible && (
        <div className="px-6 py-3 bg-amber-900/10 border-t border-amber-700/30">
          <p className="text-xs text-amber-300/80 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            This is a verified certificate confirming demonstrated competence through AI-assessed skill evaluations.
          </p>
        </div>
      )}
    </div>
  );
}
