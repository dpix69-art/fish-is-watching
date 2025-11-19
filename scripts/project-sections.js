// scripts/project-sections.js

document.addEventListener('DOMContentLoaded', () => {
  // ===== VIDEO BLOCK =====
  const videoSection = document.querySelector('.project-media');
  if (videoSection) {
    const iframe = videoSection.querySelector('iframe');
    const src = iframe ? iframe.getAttribute('src') : null;

    // если нет iframe или src пустой / about:blank — прячем блок
    if (!iframe || !src || src === 'about:blank') {
      videoSection.style.display = 'none';
    }
  }

  // ===== AUDIO / BANDCAMP BLOCK =====
  const audioSection = document.querySelector('.project-bandcamp');
  if (audioSection) {
    const iframe = audioSection.querySelector('iframe');
    const src = iframe ? iframe.getAttribute('src') : null;

    if (!iframe || !src || src === 'about:blank') {
      audioSection.style.display = 'none';
    }
  }

  // ===== PHOTO GALLERY =====
  const gallerySection = document.querySelector('.project-gallery');
  if (gallerySection) {
    const images = Array.from(gallerySection.querySelectorAll('photos'));

    const hasRealImage = images.some((img) => {
      const src = img.getAttribute('src');
      return src && src.trim() !== '';
    });

    if (!hasRealImage) {
      gallerySection.style.display = 'flex';

      // если нет фоток — подпись тоже не нужна
      const caption = document.querySelector('.project-caption');
      if (caption) {
        caption.style.display = 'block';
      }
    }
  }
});
