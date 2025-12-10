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
    console.warn(`Event with slug "${slug}" not found in events.json`);
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
    // сюда подставляем уже нормальный embedUrl из JSON
    videoFrame.src = event.video.embedUrl;

    // принудительно показываем секцию, если она вдруг была скрыта
    const mediaSection = videoFrame.closest('.project-media');
    if (mediaSection) {
      mediaSection.style.display = 'block';
    }
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

  // === Similar Projects ===
  renderSimilarProjects(slug, events, formatDate);
}

function renderSimilarProjects(currentSlug, events, formatDate) {
  const container = document.querySelector('[data-projects]');
  if (!container) return;

  const limitAttr = container.getAttribute('data-projects-limit');
  const limit = Number.isFinite(parseInt(limitAttr, 10))
    ? parseInt(limitAttr, 10)
    : 2;

  const candidates = events.filter((e) => e.slug !== currentSlug);

  if (candidates.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Перемешивание (Fisher–Yates)
  const shuffled = candidates.slice();
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }

  const selected = shuffled.slice(0, limit);
  container.innerHTML = '';

  selected.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'similar-card';

    const titleEl = document.createElement('h3');
    titleEl.className = 'similar-title';
    titleEl.textContent = event.title || '';

    const metaEl = document.createElement('p');
    metaEl.className = 'similar-meta';
    const metaParts = [];
    if (event.city) metaParts.push(event.city);
    if (event.date) metaParts.push(formatDate(event.date));
    metaEl.textContent = metaParts.join(', ');

    const descEl = document.createElement('p');
    descEl.className = 'similar-description';
    descEl.textContent =
      event.shortDescription ||
      event.subtitle ||
      '';

    const actions = document.createElement('div');
    actions.className = 'similar-actions';

    // Remind me здесь опционален; можно включить по твоему желанию
    const isPast = event.status === 'past';
    const remindAllowed =
      !isPast &&
      event.remindEnabled !== false &&
      event.date &&
      event.venue &&
      event.city;

    if (remindAllowed) {
      const button = document.createElement('a');
      const start = event.date.replace(/-/g, '') + 'T180000Z';
      const end = event.date.replace(/-/g, '') + 'T193000Z';

      const gcalLink =
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(event.title)}` +
        `&dates=${start}/${end}` +
        `&details=${encodeURIComponent(event.shortDescription || '')}` +
        `&location=${encodeURIComponent(event.venue + ', ' + event.city)}` +
        `&sf=true&output=xml`;

      let href = gcalLink;
      if (event.icsFile && /Mac|iPhone|iPad/.test(navigator.platform)) {
        href = `webcal://${window.location.host}/${event.icsFile}`;
      }

      button.className = 'similar-button';
      button.textContent = 'Remind me';
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.href = href;

      actions.appendChild(button);
    }

    const projectLink = document.createElement('a');
    projectLink.className = 'similar-open-link';
    projectLink.href = `project-${event.slug}.html`;
    projectLink.textContent = 'open project';
    actions.appendChild(projectLink);

    card.appendChild(titleEl);
    card.appendChild(metaEl);
    card.appendChild(descEl);
    card.appendChild(actions);

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadProjectData);
