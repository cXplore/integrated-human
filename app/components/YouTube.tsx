'use client';

interface YouTubeProps {
  id: string;
  title?: string;
}

export default function YouTube({ id, title = 'YouTube video' }: YouTubeProps) {
  return (
    <div className="my-8 relative overflow-hidden rounded-sm border border-[var(--border-color)]" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={`https://www.youtube.com/embed/${id}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}
