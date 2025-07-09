import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getYouTubeEmbedUrl(url: string | undefined | null): string | null {
  if (!url) return null;

  // Regex to extract YouTube video ID from various URL formats
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
  const match = url.match(youtubeRegex);

  if (match && match[1]) {
    const videoId = match[1];
    // Add autoplay=1 and mute=1 for a better experience, as browsers often block autoplay with sound.
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`;
  }
  
  return null;
}
