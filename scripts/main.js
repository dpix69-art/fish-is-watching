// ============================
// Utilities
// ============================

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
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
 * Extract YouTube video ID from embed URLs like:
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 */
function getYouTubeIdFromEmbedUrl(embedUrl) {
  if (!isNonEmptyString(embedUrl)) return null;
  const match = embedUrl.match(/\/embed\/([^?&#/]+)/);
  return match ? match[1] : null;
}

/**
 * Add params to reduce UI noise in YouTube iframe.
 * Note: YouTube still may show some overlays; full removal is not possible.
 */
function withQuietYouTubeParams(embedUrl) {
  // Keep controls so the user can manage audio.
  // Remove autoplay+mute to avoid confusing "silent" playback in some browsers.
  const params =
    'controls=1&modestbranding=1&rel=0&playsinline=1';

  return embedUrl.includes('?') ? `${embedUrl}&${params}` : `${embedUrl}?${params}`;
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (typeof text === 'string') el.textContent = text;
  return el;
}

// ============================
// Media preview (homepage cards)
// ============================

/**
 * Fixed-size 16:9 frame:
 * thumbnail button -> click -> iframe
 * No layout shift (same container size).
 */
function buildVideoPreview(embedUrl) {
  const frame = createEl('div', 'event-media-frame');

  const btn = createEl('button', 'event-video-preview');
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Play video');

  const videoId = getYouTubeIdFromEmbedUrl(embedUrl);
  if (videoId) {
    btn.style.backgroundImage = `url("https://i.ytimg.com/vi/${videoId}/hqdefault.jpg")`;
  } else {
    btn.classList.add('event-video-preview--empty');
  }

  btn.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = withQuietYouTubeParams(embedUrl);
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;

    frame.innerHTML = '';
    frame.appendChild(iframe);
  });

  frame.appendChild(btn);
  return frame;
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
 * Homepage rule:
 * Render only one preview per card to keep the page fast.
 * Priority: video -> audio
 */
function buildMediaPreview(event) {
  const hasVideo = event.video && isValidEmbedUrl(event.video.embedUrl);
  const hasAudio = event.audio && isValidEmbedUrl(event.audio.embedUrl);

  if (!hasVideo && !hasAudio) return null;

  const media = createEl('div', 'event-media');
  const label = createEl('p', 'event-media-title');

  if (hasVideo) {
    label.textContent = 'Watch on YouTube';
    media.appendChild(label);
    media.appendChild(buildVideoPreview(event.video.embedUrl));
    return media;
  }

  label.textContent = 'Listen on Bandcamp';
  media.appendChild(label);
  media.appendChild(buildBandcampEmbed(event.audio.embedUrl));
  return media;
}

// ============================
// Event card builder
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

    // webcal for macOS / iOS if .ics file exists
    if (event.icsFile && /Mac|iPhone|iPad/.test(navigator.platform)) {
      href = `webcal://${window.location.host}/${event.icsFile}`;
    }

    button.setAttribute('aria-label', `Add ${event.title} to calendar`);
    button.target = '_blank';
    button.rel = 'noopener noreferrer';
    button.href = href;

    footer.appendChild(button);
  }

  // "open project" link
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
// Rendering
// ============================

function renderEvents(events) {
  const container = document.getElementById('events-container');
  if (!container || !Array.isArray(events)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Keep events by status/date rules
  const filtered = events.filter((event) => {
    if (event.status === 'past') return true;
    if (event.status === 'upcoming') return true;

    if (!event.date) return true;
    const d = new Date(event.date);
    if (Number.isNaN(d.getTime())) return true;
    d.setHours(0, 0, 0, 0);
    return d >= today;
  });

  // Sort by date
  const sorted = filtered.slice().sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
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
