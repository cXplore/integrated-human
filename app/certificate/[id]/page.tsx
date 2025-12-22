import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import CertificateView from './CertificateView';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certificateId: id },
  });

  if (!certificate) {
    return { title: 'Certificate Not Found' };
  }

  const isCertificate = certificate.credentialType === 'certificate';
  const docType = isCertificate ? 'Certificate' : 'Completion Record';

  return {
    title: `${docType} - ${certificate.courseName} | Integrated Human`,
    description: `${docType} for ${certificate.courseName} awarded to ${certificate.userName}`,
  };
}

export default async function CertificatePage({ params }: Props) {
  const { id } = await params;

  const certificate = await prisma.certificate.findUnique({
    where: { certificateId: id },
  });

  if (!certificate) {
    notFound();
  }

  return (
    <CertificateView
      certificateId={certificate.certificateId}
      courseName={certificate.courseName}
      userName={certificate.userName}
      issuedAt={certificate.issuedAt.toISOString()}
      credentialType={(certificate.credentialType as 'completion' | 'certificate') || 'completion'}
      courseTier={certificate.courseTier || 'beginner'}
      quizScore={certificate.quizScore}
    />
  );
}
