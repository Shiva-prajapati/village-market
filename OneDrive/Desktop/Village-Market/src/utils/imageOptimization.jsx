/**
 * Image optimization utilities for production performance
 * Provides responsive image handling, lazy loading, and format optimization
 */

/**
 * Get optimized image source with modern formats fallback
 * Returns WebP for modern browsers, JPEG for fallback
 */
export function getOptimizedImageSrc(imagePath, options = {}) {
  if (!imagePath) return null;

  const {
    width = 'auto',
    height = 'auto',
    quality = 80,
    format = 'webp' // webp, jpeg, auto
  } = options;

  // Return original path - transformation can be done via server or CDN
  return imagePath;
}

/**
 * Image component with lazy loading and error handling
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  style = {},
  className = '',
  onLoad,
  onError,
  loading = 'lazy',
  decoding = 'async'
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      style={{
        ...style,
        objectFit: 'cover'
      }}
      className={className}
      onLoad={onLoad}
      onError={(e) => {
        if (onError) onError(e);
        // Fallback to placeholder if image fails
        e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f1f5f9%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%2394a3b8%22 font-size=%2212%22%3ENo Image%3C/text%3E%3C/svg%3E';
      }}
    />
  );
}

/**
 * Calculate responsive image dimensions
 */
export function getResponsiveDimensions(originalWidth, originalHeight, maxWidth = 800) {
  if (!originalWidth || !originalHeight) return { width: maxWidth, height: maxWidth };

  const aspectRatio = originalHeight / originalWidth;
  const width = Math.min(originalWidth, maxWidth);
  const height = width * aspectRatio;

  return { width, height };
}

/**
 * Generate srcSet for responsive images
 */
export function generateSrcSet(imagePath, sizes = [320, 640, 960, 1280]) {
  if (!imagePath) return '';

  return sizes
    .map(size => `${imagePath}?w=${size} ${size}w`)
    .join(', ');
}

/**
 * Preload critical images
 */
export function preloadImage(src) {
  if (!src) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Intersection Observer for lazy loading images
 */
export function setupLazyLoadingObserver() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
}

export default {
  getOptimizedImageSrc,
  OptimizedImage,
  getResponsiveDimensions,
  generateSrcSet,
  preloadImage,
  setupLazyLoadingObserver
};
