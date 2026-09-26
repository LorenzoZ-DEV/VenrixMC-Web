import Image from "next/image";

/**
 * Copertina a riempimento (va dentro un contenitore `relative`) che accetta sia
 * percorsi locali sia URL esterni.
 *
 * next/image ottimizza solo gli host dichiarati in next.config.js e per
 * qualunque altro dominio va in errore ("hostname is not configured"): per una
 * copertina incollata dal pannello news (imgur, ibb, un CDN qualsiasi) usiamo
 * quindi un <img> normale, così ogni link funziona senza toccare la config.
 */
export function CoverImage({
  src,
  alt,
  className = "",
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (/^https?:\/\//i.test(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
}
