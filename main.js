
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
  if (!container) return;

  container.innerHTML = '';

  let currentYear = null;

  events.forEach((event) => {
    const year = event.year || new Date(event.date).getFullYear();

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

    // ===== Заголовок: делаем его ссылкой на страницу проекта =====
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
    description.textContent = event.description || '';

    const footer = document.createElement('div');
    footer.className = 'event-footer';

    // ===== Кнопка Remind me (как было, через Google Calendar / webcal) =====
    if (event.date && event.venue && event.city) {
      const button = document.createElement('a');

      const start = event.date.replace(/-/g, '') + 'T180000Z';
      const end = event.date.replace(/-/g, '') + 'T193000Z';

      const gcalLink =
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(event.title)}` +
        `&dates=${start}/${end}` +
        `&details=${encodeURIComponent(event.description || '')}` +
        `&location=${encodeURIComponent(event.venue + ', ' + event.city)}` +
        `&sf=true&output=xml`;

      const webcalLink = `webcal://${window.location.host}/${event.icsFile}`;

      button.className = 'event-button';
      button.textContent = 'Remind me';
      button.setAttribute('aria-label', `Add ${event.title} to calendar`);
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
      button.href = gcalLink;

      if (/Mac|iPhone|iPad/.test(navigator.platform) && event.icsFile) {
        button.href = webcalLink;
      }

      footer.appendChild(button);
    }

    // ===== Новая ссылка: open project =====
    const openLink = document.createElement('a');
    openLink.href = projectUrl;
    openLink.textContent = 'open project';
    footer.appendChild(openLink);

    // ===== Мета: город + дата =====
    const meta = document.createElement('p');
    meta.className = 'event-meta';
    meta.textContent = `${event.city}, ${formatDate(event.date)}`;
    footer.appendChild(meta);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(description);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadEvents);
