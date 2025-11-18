
let cachedEvents = null;

async function loadEvents() {
  if (cachedEvents) return cachedEvents;

  const response = await fetch('data/events.json');
  const data = await response.json();
  const events = Array.isArray(data.events) ? data.events : [];
  // сортируем по дате (ближайшие сверху)
  cachedEvents = events.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    return da - db;
  });
  return cachedEvents;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function projectUrlFromSlug(slug) {
  return `project-${slug}.html`;
}

/* =============== Schedule (index) =============== */

function renderSchedule(container, events) {
  if (!container) return;
  container.innerHTML = '';

  events.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'event-card';

    const title = document.createElement('h3');
    title.className = 'event-title';

    const titleLink = document.createElement('a');
    titleLink.className = 'event-title-link';
    titleLink.href = projectUrlFromSlug(event.slug);
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

    if (event.icsFile) {
      const button = document.createElement('a');
      button.className = 'event-button';
      button.textContent = 'Remind me';
      button.href = event.icsFile;
      button.setAttribute('download', `${event.slug}.ics`);
      footer.appendChild(button);
    }

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

/* =============== Project detail header =============== */

function initProjectDetail(events) {
  const main = document.querySelector('[data-project-slug]');
  if (!main) return null;

  const slug = main.getAttribute('data-project-slug');
  if (!slug) return null;

  const event = events.find((e) => e.slug === slug);
  if (!event) {
    console.warn('Project not found for slug:', slug);
    return null;
  }

  const titleEl = main.querySelector('[data-project-field="title"]');
  const metaEl = main.querySelector('[data-project-field="meta"]');
  const subtitleEl = main.querySelector('[data-project-field="subtitle"]');
  const descriptionEl = main.querySelector('[data-project-field="description"]');
  const remindLink = main.querySelector('[data-project-remind]');

  if (titleEl) titleEl.textContent = event.title;
  if (metaEl) metaEl.textContent = `${event.city}, ${formatDate(event.date)}`;
  if (subtitleEl) subtitleEl.textContent = event.subtitle || '';
  if (descriptionEl) descriptionEl.textContent = event.description || '';

  if (remindLink && event.icsFile) {
    remindLink.href = event.icsFile;
    remindLink.textContent = 'Remind me';
    remindLink.setAttribute('download', `${event.slug}.ics`);
  } else if (remindLink) {
    remindLink.style.display = 'none';
  }

  return event;
}

/* =============== Similar Projects =============== */

function createSimilarCard(event, variant) {
  const card = document.createElement('article');
  card.className = 'similar-card';

  const title = document.createElement('h3');
  title.className = 'similar-title';
  title.textContent = event.title;

  const meta = document.createElement('p');
  meta.className = 'similar-meta';
  meta.textContent = `${event.city}, ${formatDate(event.date)}`;

  const description = document.createElement('p');
  description.className = 'similar-description';
  description.textContent = event.subtitle || event.description || '';

  const actions = document.createElement('div');
  actions.className = 'similar-actions';

  if (variant === 'detail' && event.icsFile) {
    const remind = document.createElement('a');
    remind.className = 'event-button';
    remind.textContent = 'Remind me';
    remind.href = event.icsFile;
    remind.setAttribute('download', `${event.slug}.ics`);
    actions.appendChild(remind);
  }

  const openLink = document.createElement('a');
  openLink.href = projectUrlFromSlug(event.slug);
  openLink.textContent = 'open project';
  actions.appendChild(openLink);

  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(description);
  card.appendChild(actions);

  return card;
}

function initSimilarProjects(events, currentProject) {
  const containers = document.querySelectorAll('.similar-list[data-projects]');
  if (!containers.length) return;

  containers.forEach((container) => {
    const variant = container.getAttribute('data-projects-variant') || 'simple';
    const limit = parseInt(
      container.getAttribute('data-projects-limit') || '2',
      10
    );
    const excludeCurrent =
      container.getAttribute('data-projects-exclude-current') === 'true';

    let list = [...events];
    if (excludeCurrent && currentProject) {
      list = list.filter((e) => e.slug !== currentProject.slug);
    }

    const picked = list.slice(0, limit);

    container.innerHTML = '';
    picked.forEach((event) => {
      container.appendChild(createSimilarCard(event, variant));
    });
  });
}

/* =============== Bootstrapping =============== */

document.addEventListener('DOMContentLoaded', async () => {
  let events = [];
  try {
    events = await loadEvents();
  } catch (error) {
    console.error('Failed to load events.json:', error);
    return;
  }

  // 1) Schedule на главной
  const scheduleContainer = document.getElementById('events-container');
  if (scheduleContainer) {
    renderSchedule(scheduleContainer, events);
  }

  // 2) Detalka проекта (если мы на project-*.html)
  const currentProject = initProjectDetail(events);

  // 3) Similar Projects на любых страницах
  initSimilarProjects(events, currentProject);
});
