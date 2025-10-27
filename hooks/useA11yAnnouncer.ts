import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for managing accessible announcements via ARIA live region
 */
export function useA11yAnnouncer() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create live region on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create live region element
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    liveRegionRef.current = liveRegion;

    return () => {
      if (liveRegionRef.current) {
        document.body.removeChild(liveRegionRef.current);
        liveRegionRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Announce a message
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set priority
    liveRegionRef.current.setAttribute('aria-live', priority);

    // Clear and then set message (ensures it's announced even if same as previous)
    liveRegionRef.current.textContent = '';
    
    // Small delay to ensure the clear is processed
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }

      // Clear after 5 seconds
      timeoutRef.current = setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = '';
        }
      }, 5000);
    }, 50);
  }, []);

  return { announce };
}
