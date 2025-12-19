'use client';

import { useRef } from 'react';

interface CertificateViewProps {
  certificateId: string;
  courseName: string;
  userName: string;
  issuedAt: string;
}

export default function CertificateView({
  certificateId,
  courseName,
  userName,
  issuedAt,
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

      {/* Certificate */}
      <div
        ref={certificateRef}
        className="max-w-4xl mx-auto bg-[#faf8f5] p-12 md:p-16 print:p-16 print:max-w-none print:m-0"
        style={{ aspectRatio: '1.414' }}
      >
        {/* Border Design */}
        <div className="h-full border-4 border-[#8b6b4a] p-8 md:p-12 flex flex-col justify-between relative">
          {/* Corner Ornaments */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#8b6b4a]" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#8b6b4a]" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#8b6b4a]" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#8b6b4a]" />

          {/* Header */}
          <div className="text-center">
            <h1 className="font-serif text-3xl md:text-4xl text-[#2d2420] mb-2 tracking-wide">
              Certificate of Completion
            </h1>
            <div className="w-24 h-0.5 bg-[#8b6b4a] mx-auto" />
          </div>

          {/* Main Content */}
          <div className="text-center flex-1 flex flex-col justify-center py-8">
            <p className="text-[#6b5d52] text-lg mb-4">This is to certify that</p>
            <p className="font-serif text-4xl md:text-5xl text-[#2d2420] mb-6 font-light">
              {userName}
            </p>
            <p className="text-[#6b5d52] text-lg mb-4">has successfully completed</p>
            <p className="font-serif text-2xl md:text-3xl text-[#8b6b4a] mb-8 font-medium">
              {courseName}
            </p>
            <p className="text-[#6b5d52]">
              Awarded on {formattedDate}
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end">
            <div className="text-center">
              <div className="w-40 border-t border-[#8b6b4a] pt-2">
                <p className="text-[#6b5d52] text-sm">Integrated Human</p>
              </div>
            </div>
            <div className="text-center">
              <p className="font-serif text-xl text-[#2d2420]">Integrated Human</p>
              <p className="text-[#8c7b6d] text-xs mt-1">integratedhuman.co</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-[#8b6b4a] pt-2">
                <p className="text-[#6b5d52] text-sm">Certificate ID</p>
                <p className="text-[#8c7b6d] text-xs font-mono">{certificateId.slice(0, 12)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Note */}
      <div className="max-w-4xl mx-auto mt-8 text-center print:hidden">
        <p className="text-gray-500 text-sm">
          This certificate can be verified at this URL. Certificate ID: {certificateId}
        </p>
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
