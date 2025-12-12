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

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function renderEvents(events) {
  const container = document.getElementById('events-container');
  if (!container || !Array.isArray(events)) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Фильтруем только будущие события
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
      const yearDivider = document.createElement('div');
      yearDivider.className = 'year-divider';
      yearDivider.textContent = `— ${year}`;
      container.appendChild(yearDivider);
      currentYear = year;
    }

    const projectUrl = `project-${event.slug}.html`;

    const card = document.createElement('article');
    card.className = 'event-card';

    // Заголовок как ссылка на страницу проекта
    const title = document.createElement('h3');
    title.className = 'event-title';

    const titleLink = document.createElement('a');
    titleLink.className = 'event-title-link';
    titleLink.href = projectUrl;
    titleLink.textContent = event.title;
    title.appendChild(titleLink);

    const subtitle = document.createElement('p');
    subtitle.className = 'event-subtitle';
    subtitle.textContent = event.subtitle || '';

    const description = document.createElement('p');
    description.className = 'event-description';
    const descriptionText =
      event.shortDescription || event.description || '';
    description.textContent = descriptionText;

    const footer = document.createElement('div');
    footer.className = 'event-footer';

    // Remind me — только если не past и разрешено
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

      const descriptionTextForCalendar = descriptionText;

      const gcalLink =
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(event.title)}` +
        `&dates=${start}/${end}` +
        `&details=${encodeURIComponent(descriptionTextForCalendar)}` +
        `&location=${encodeURIComponent(event.venue + ', ' + event.city)}` +
        `&sf=true&output=xml`;

      let href = gcalLink;

      // webcal для macOS / iOS, если есть .ics
      if (event.icsFile && /Mac|iPhone|iPad/.test(navigator.platform)) {
        href = `webcal://${window.location.host}/${event.icsFile}`;
      }

      button.className = 'event-button';
      button.textContent = 'Remind me';
      button.setAttribute('aria-label', `Add ${event.title} to calendar`);
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.href = href;

      footer.appendChild(button);
    }

    // Ссылка "open project"
    const openLink = document.createElement('a');
    openLink.className = 'event-open-link';
    openLink.href = projectUrl;
    openLink.textContent = 'open project';
    footer.appendChild(openLink);

    // Мета: город + дата
    const meta = document.createElement('p');
    meta.className = 'event-meta';
    meta.textContent = `${event.city}, ${formatDate(event.date)}`;
    footer.appendChild(meta);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(description);
    // ===== MEDIA PREVIEW (video > audio) =====
const hasVideo =
  event.video &&
  typeof event.video.embedUrl === 'string' &&
  event.video.embedUrl.trim() !== '' &&
  event.video.embedUrl !== 'about:blank';

const hasAudio =
  event.audio &&
  typeof event.audio.embedUrl === 'string' &&
  event.audio.embedUrl.trim() !== '' &&
  event.audio.embedUrl !== 'about:blank';

if (hasVideo || hasAudio) {
  const media = document.createElement('div');
  media.className = 'event-media';

  const label = document.createElement('p');
  label.className = 'event-media-title';

  const iframe = document.createElement('iframe');
  iframe.loading = 'lazy';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';

  if (hasVideo) {
    label.textContent = 'Watch';
    iframe.className = 'event-video';
    iframe.src = event.video.embedUrl;
    iframe.allow =
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
  } else {
    label.textContent = 'Listen on Bandcamp';
    iframe.className = 'event-bandcamp';
    iframe.src = event.audio.embedUrl;
    iframe.setAttribute('seamless', 'seamless');
  }

  media.appendChild(label);
  media.appendChild(iframe);
  card.appendChild(media);
}

    card.appendChild(footer);

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadEvents);
