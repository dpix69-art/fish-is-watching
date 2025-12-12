// ============================
// Helpers
// ============================

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function isValidEmbedUrl(url) {
  return isNonEmptyString(url) && url !== 'about:blank';
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Extract YouTube video ID from an embed URL like:
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 */
function getYouTubeIdFromEmbedUrl(embedUrl) {
  if (!isNonEmptyString(embedUrl)) return null;
  const m = embedUrl.match(/\/embed\/([^?&#/]+)/);
  return m ? m[1] : null;
}

function withYouTubeParams(embedUrl) {
  // максимально "тихо":
  // controls=0 — без панели
  // modestbranding=1 — меньше брендинга
  // rel=0 — меньше "чужих" рекомендаций
  // playsinline=1 — без полноэкранного прыжка на мобилке
  // autoplay=1 — чтобы клик реально запускал
  // mute=1 — часто нужно для autoplay в браузерах
  const params =
    'autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1';

  return embedUrl.includes('?') ? `${embedUrl}&${params}` : `${embedUrl}?${params}`;
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof text === 'string') el.textContent = text;
  return el;
}

// ============================
// Media preview builders
// ============================

function buildVideoPreview(embedUrl) {
  const videoId = getYouTubeIdFromEmbedUrl(embedUrl);

  const btn = createEl('button', 'event-video-preview');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Play video preview');

  // thumbnail сразу — мгновенный "смысл" для куратора
  if (videoId) {
    btn.style.backgroundImage = `url("https://i.ytimg.com/vi/${videoId}/hqdefault.jpg")`;
  } else {
    // если ID не распарсился — хотя бы нейтральный фон
    btn.classList.add('event-video-preview--empty');
  }

  btn.addEventListener('click', () => {
    const iframe = createEl('iframe', 'event-video');
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = withYouTubeParams(embedUrl);
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    btn.replaceWith(iframe);
  });

  return btn;
}

function buildBandcampEmbed(embedUrl) {
  const iframe = createEl('iframe', 'event-bandcamp');
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.src = embedUrl;
  iframe.setAttribute('seamless', 'seamless');
  return iframe;
}

/**
 * One preview per card to keep homepage light:
 * priority: video > audio
 */
function buildMediaPreview(event) {
  const hasVideo = event.video && isValidEmbedUrl(event.video.embedUrl);
  const hasAudio = event.audio && isValidEmbedUrl(event.audio.embedUrl);

  if (!hasVideo && !hasAudio) return null;

  const media = createEl('div', 'event-media');
  const label = createEl('p', 'event-media-title');

  if (hasVideo) {
    label.textContent = 'Watch';
    media.appendChild(label);
    media.appendChild(buildVideoPreview(event.video.embedUrl));
    return media;
  }

  // audio
  label.textContent = 'Listen on Bandcamp';
  media.appendChild(label);
  media.appendChild(buildBandcampEmbed(event.audio.embedUrl));
  return media;
}

// ============================
// Card builder
// ============================

function buildEventCard(event) {
  const projectUrl = `project-${event.slug}.html`;

  const card = createEl('article', 'event-card');

  // Title (link)
  const title = createEl('h3', 'event-title');
  const titleLink = createEl('a', 'event-title-link', event.title);
  titleLink.href = projectUrl;
  title.appendChild(titleLink);

  // Subtitle
  const subtitle = createEl('p', 'event-subtitle', event.subtitle || '');

  // Description
  const description = createEl('p', 'event-description');
  const descriptionText = event.shortDescription || event.description || '';
  description.textContent = descriptionText;

  // Footer
  const footer = createEl('div', 'event-footer');

  // Remind me (only if allowed)
  const isPast = event.status === 'past';
  const remindAllowed =
    !isPast &&
    event.remindEnabled !== false &&
    event.date &&
    event.venue &&
    event.city;

  if (remindAllowed) {
    const button = createEl('a', 'event-button', 'Remind me');

    const start = event.date.replace(/-/g, '') + 'T180000Z';
    const end = event.date.replace(/-/g, '') + 'T193000Z';

    const gcalLink =
      `https://calendar.google.com/calendar/render?action=TEMPLATE` +
      `&text=${encodeURIComponent(event.title)}` +
      `&dates=${start}/${end}` +
      `&details=${encodeURIComponent(descriptionText)}` +
      `&location=${encodeURIComponent(event.venue + ', ' + event.city)}` +
      `&sf=true&output=xml`;

    let href = gcalLink;

    // webcal для macOS / iOS, если есть .ics
    if (event.icsFile && /Mac|iPhone|iPad/.test(navigator.platform)) {
      href = `webcal://${window.location.host}/${event.icsFile}`;
    }

    button.setAttribute('aria-label', `Add ${event.title} to calendar`);
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.href = href;

    footer.appendChild(button);
  }

  // Open project link
  const openLink = createEl('a', 'event-open-link', 'open project');
  openLink.href = projectUrl;
  footer.appendChild(openLink);

  // Meta: city + date
  const meta = createEl('p', 'event-meta');
  meta.textContent = `${event.city}, ${formatDate(event.date)}`;
  footer.appendChild(meta);

  // Assemble in visual order
  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(description);

  const media = buildMediaPreview(event);
  if (media) card.appendChild(media);

  card.appendChild(footer);

  return card;
}

// ============================
// Render
// ============================

function renderEvents(events) {
  const container = document.getElementById('events-container');
  if (!container || !Array.isArray(events)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Фильтруем только будущие события (и past/upcoming по флагу)
  const upcoming = events.filter((event) => {
    if (event.status === 'past') return true;
    if (event.status === 'upcoming') return true;

    if (!event.date) return true;
    const d = new Date(event.date);
    if (Number.isNaN(d.getTime())) return true;
    d.setHours(0, 0, 0, 0);
    return d >= today;
  });

  if (upcoming.length === 0) {
    container.innerHTML = '';
    return;
  }

  // Сортировка по дате
  const sorted = upcoming.slice().sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return da - db;
  });

  container.innerHTML = '';

  let currentYear = null;

  sorted.forEach((event) => {
    const year =
      typeof event.year === 'number'
        ? event.year
        : new Date(event.date).getFullYear();

    if (currentYear !== year) {
      const yearDivider = createEl('div', 'year-divider', `— ${year}`);
      container.appendChild(yearDivider);
      currentYear = year;
    }

    container.appendChild(buildEventCard(event));
  });
}

// ============================
// Data loading
// ============================

async function loadEvents() {
  try {
    const response = await fetch('data/events.json');
    const data = await response.json();
    const events = Array.isArray(data.events) ? data.events : [];
    renderEvents(events);
  } catch (error) {
    console.error('Failed to load events:', error);
  }
}

document.addEventListener('DOMContentLoaded', loadEvents);
