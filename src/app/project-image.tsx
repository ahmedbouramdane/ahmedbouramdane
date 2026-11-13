import Image from "next/image";

type ProjectImageProps = {
  src: string;
  alt: string;
  className: string;
  sizes?: string;
};

export default function ProjectImage({ src, alt, className, sizes }: ProjectImageProps) {
  if (src.startsWith("/projects/") || src.startsWith("/certificates/")) {
    return <Image className={className} src={src} alt={alt} fill sizes={sizes ?? "100vw"} />;
  }

  if (src.startsWith("/api/portfolio-images/")) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={src} alt={alt} />;
  }

  if (!src.startsWith("https://") && !src.startsWith("blob:")) {
    return <span className={className} role={alt ? "img" : undefined} aria-label={alt || undefined} />;
  }

  // Use the browser loader for admin-provided HTTPS images instead of allowing arbitrary image hosts in Next config.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={src} alt={alt} />;
}
