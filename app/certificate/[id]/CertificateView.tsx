'use client';

import { useRef } from 'react';

interface CertificateViewProps {
  certificateId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
  credentialType: 'completion' | 'certificate';
  courseTier: string;
  quizScore?: number | null;
}

// Tier display names
const tierLabels: Record<string, string> = {
  intro: 'Introductory',
  beginner: 'Foundation',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  flagship: 'Mastery',
};

export default function CertificateView({
  certificateId,
  courseName,
  userName,
  issuedAt,
  credentialType,
  courseTier,
  quizScore,
}: CertificateViewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const isCertificate = credentialType === 'certificate';
  const tierLabel = tierLabels[courseTier] || courseTier;

  // Different styling based on credential type
  const styles = isCertificate
    ? {
        // Full certificate - richer design
        bg: '#faf8f5',
        border: '#8b6b4a',
        headerText: '#2d2420',
        bodyText: '#6b5d52',
        accent: '#8b6b4a',
        subtle: '#8c7b6d',
      }
    : {
        // Completion record - simpler, modern design
        bg: '#f8f9fa',
        border: '#94a3b8',
        headerText: '#1e293b',
        bodyText: '#64748b',
        accent: '#475569',
        subtle: '#94a3b8',
      };

  return (
    <div className="min-h-screen bg-zinc-950 py-12 px-6">
      {/* Print/Download Controls - Hidden in print */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden">
        <a
          href="/profile"
          className="text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Profile
        </a>
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-white text-zinc-900 font-medium hover:bg-gray-200 transition-colors"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Certificate/Completion Record */}
      <div
        ref={certificateRef}
        className="max-w-4xl mx-auto p-12 md:p-16 print:p-16 print:max-w-none print:m-0"
        style={{ backgroundColor: styles.bg, aspectRatio: '1.414' }}
      >
        {/* Border Design */}
        <div
          className="h-full p-8 md:p-12 flex flex-col justify-between relative"
          style={{ border: `${isCertificate ? '4px' : '2px'} solid ${styles.border}` }}
        >
          {/* Corner Ornaments - only for full certificates */}
          {isCertificate && (
            <>
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2" style={{ borderColor: styles.border }} />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2" style={{ borderColor: styles.border }} />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2" style={{ borderColor: styles.border }} />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2" style={{ borderColor: styles.border }} />
            </>
          )}

          {/* Header */}
          <div className="text-center">
            {/* Tier Badge */}
            <div
              className="inline-block px-4 py-1 text-xs font-medium tracking-widest uppercase mb-4"
              style={{
                backgroundColor: isCertificate ? styles.accent : styles.border,
                color: 'white',
              }}
            >
              {tierLabel} {isCertificate ? 'Certificate' : 'Level'}
            </div>

            <h1
              className="font-serif text-3xl md:text-4xl mb-2 tracking-wide"
              style={{ color: styles.headerText }}
            >
              {isCertificate ? 'Certificate of Achievement' : 'Record of Completion'}
            </h1>
            <div className="w-24 h-0.5 mx-auto" style={{ backgroundColor: styles.border }} />
          </div>

          {/* Main Content */}
          <div className="text-center flex-1 flex flex-col justify-center py-8">
            <p className="text-lg mb-4" style={{ color: styles.bodyText }}>
              This is to {isCertificate ? 'certify' : 'acknowledge'} that
            </p>
            <p
              className="font-serif text-4xl md:text-5xl mb-6 font-light"
              style={{ color: styles.headerText }}
            >
              {userName}
            </p>
            <p className="text-lg mb-4" style={{ color: styles.bodyText }}>
              has successfully completed
            </p>
            <p
              className="font-serif text-2xl md:text-3xl mb-4 font-medium"
              style={{ color: styles.accent }}
            >
              {courseName}
            </p>

            {/* Quiz Score - only show for certificates with scores */}
            {isCertificate && quizScore && (
              <p className="text-sm mb-4" style={{ color: styles.bodyText }}>
                Assessment Score: {quizScore}%
              </p>
            )}

            <p style={{ color: styles.bodyText }}>
              Awarded on {formattedDate}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="w-40 pt-2" style={{ borderTop: `1px solid ${styles.border}` }}>
                <p className="text-sm" style={{ color: styles.bodyText }}>Integrated Human</p>
              </div>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl" style={{ color: styles.headerText }}>Integrated Human</p>
              <p className="text-xs mt-1" style={{ color: styles.subtle }}>integratedhuman.co</p>
            </div>
            <div className="text-center">
              <div className="w-40 pt-2" style={{ borderTop: `1px solid ${styles.border}` }}>
                <p className="text-sm" style={{ color: styles.bodyText }}>
                  {isCertificate ? 'Certificate' : 'Record'} ID
                </p>
                <p className="text-xs font-mono" style={{ color: styles.subtle }}>
                  {certificateId.slice(0, 12)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Note */}
      <div className="max-w-4xl mx-auto mt-8 text-center print:hidden">
        <p className="text-gray-500 text-sm">
          This {isCertificate ? 'certificate' : 'completion record'} can be verified at{' '}
          <span className="text-gray-400">integratedhuman.co/certificate/{certificateId}</span>
        </p>
        {isCertificate && (
          <p className="text-gray-600 text-xs mt-2">
            <a href="/transparency/certificates" className="hover:text-gray-400 underline">
              Learn about our certificate standards →
            </a>
          </p>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
