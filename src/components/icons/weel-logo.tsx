// src/components/icons/weel-logo.tsx
import Image from 'next/image';
import type { SVGProps } from 'react'; // Keep for props consistency if extended

// IMPORTANT: Please save your logo image as 'weel-logo.png' 
// in the 'public/images/' directory of your project.

export function WeelLogo(props: SVGProps<SVGSVGElement> & { className?: string }) {
  // The className prop from the parent (e.g., AppHeader) will still apply to the container div,
  // allowing sizing (like h-8 w-8) to work.
  // The image itself will maintain its original colors.
  return (
    <div className={props.className} data-ai-hint="logo image container">
      <Image
        src="/images/icon.png" // Path relative to the 'public' directory
        alt="Weel Logo"
        width={32} // Desired display width in pixels
        height={32} // Desired display height in pixels
        priority // Optional: if the logo is critical for LCP
      />
    </div>
  );
}
