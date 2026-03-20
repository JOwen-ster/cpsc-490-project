import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract owner and repo from a GitHub URL or "owner/repo" string.
 * @example "https://github.com/facebook/react" -> { owner: "facebook", repo: "react" }
 * @example "facebook/react" -> { owner: "facebook", repo: "react" }
 */
export function parseGitHubLink(link: string): { owner: string; repo: string } | null {
  // Normalize by removing protocol and hostname
  let path = link.trim().replace(/^https?:\/\/(www\.)?github\.com\//, "");
  
  // Remove trailing slashes and .git
  path = path.replace(/\/$/, "").replace(/\.git$/, "");
  
  const parts = path.split("/");
  if (parts.length >= 2) {
    return {
      owner: parts[parts.length - 2],
      repo: parts[parts.length - 1],
    };
  }
  
  return null;
}
