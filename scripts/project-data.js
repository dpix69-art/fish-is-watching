// scripts/project-data.js

async function loadProjectData() {
  const main = document.querySelector('[data-project-slug]');
  if (!main) return; // не страница проекта

  const slug = main.getAttribute('data-project-slug');
  if (!slug) return;

  let data;
  try {
    const response = await fetch('data/events.json');
    data = await response.json();
  } catch (error) {
    console.error('Failed to load events.json', error);
    return;
  }

  const events = Array.isArray(data.events) ? data.events : [];
  const event = events.find((e) => e.slug === slug);
  if (!event) {
    console.warn('No event found for slug:', slug);
    return;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Заголовок, дата/город, сабтайтл
  const titleEl = main.querySelector('[data-project-field="title"]');
  const metaEl = main.querySelector('[data-project-field="meta"]');
  const subtitleEl = main.querySelector('[data-project-field="subtitle"]');

  if (titleEl) titleEl.textContent = event.title || '';
  if (metaEl) {
    const metaParts = [];
    if (event.city) metaParts.push(event.city);
    if (event.date) metaParts.push(formatDate(event.date));
    metaEl.textContent = metaParts.join(', ');
  }
  if (subtitleEl) subtitleEl.textContent = event.subtitle || '';

  // Тело: абзацы
  const bodyContainer = main.querySelector('[data-project-field="body"]');
  if (bodyContainer) {
    bodyContainer.innerHTML = '';
    if (Array.isArray(event.body)) {
      event.body.forEach((paragraph) => {
        const p = document.createElement('p');
        p.className = 'project-description';
        p.textContent = paragraph;
        bodyContainer.appendChild(p);
      });
    }
  }

  // Подпись
  const captionEl = main.querySelector('[data-project-field="caption"]');
  if (captionEl && event.caption) {
    captionEl.textContent = event.caption;
  }

  // Видео
  const videoFrame = main.querySelector('[data-project-video]');
  if (videoFrame && event.video && event.video.embedUrl) {
    videoFrame.src = event.video.embedUrl;
  }

  // Аудио / Bandcamp
  const audioFrame = main.querySelector('[data-project-audio]');
  if (audioFrame && event.audio && event.audio.embedUrl) {
    audioFrame.src = event.audio.embedUrl;
  }

  // Фотогалерея
  const photosContainer = main.querySelector('[data-project-photos]');
  if (photosContainer && Array.isArray(event.photos)) {
    photosContainer.innerHTML = '';
    event.photos.forEach((photo) => {
      const figure = document.createElement('figure');
      figure.className = 'project-photo';

      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = photo.alt || '';

      figure.appendChild(img);
      photosContainer.appendChild(figure);
    });
  }
}

document.addEventListener('DOMContentLoaded', loadProjectData);
