'use client';

interface FeaturedImageProps {
  src: string;
  alt: string;
}

export default function FeaturedImage({ src, alt }: FeaturedImageProps) {
  return (
    <div className="mb-12 -mx-6 md:mx-0 relative overflow-hidden">
      <img
        src={src}
        alt={alt}
        className="w-full h-auto max-h-[400px] object-cover border border-zinc-800"
        onError={(e) => {
          // Hide image container if no generated image exists
          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
        }}
      />
    </div>
  );
}
