async function loadEvents() {
  try {
    const response = await fetch('data/events.json');
    const data = await response.json();
    renderEvents(data.events);
  } catch (error) {
    console.error('Failed to load events:', error);
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function renderEvents(events) {
  const container = document.getElementById('events-container');
  let currentYear = null;

  events.forEach(event => {
    if (currentYear !== event.year) {
      const yearDivider = document.createElement('div');
      yearDivider.className = 'year-divider';
      yearDivider.textContent = `-- ${event.year}`;
      container.appendChild(yearDivider);
      currentYear = event.year;
    }

    const card = document.createElement('article');
    card.className = 'event-card';

    const title = document.createElement('h3');
    title.className = 'event-title';
    title.textContent = event.title;

    const subtitle = document.createElement('p');
    subtitle.className = 'event-subtitle';
    subtitle.textContent = event.subtitle;

    const description = document.createElement('p');
    description.className = 'event-description';
    description.textContent = event.description;

    const footer = document.createElement('div');
    footer.className = 'event-footer';

    const button = document.createElement('a');
    button.href = event.icsFile;
    button.className = 'event-button';
    button.textContent = 'Remind me';
    button.download = `${event.slug}.ics`;
    button.setAttribute('aria-label', `Download calendar reminder for ${event.title}`);

    const meta = document.createElement('p');
    meta.className = 'event-meta';
    meta.textContent = `${event.city}, ${formatDate(event.date)}`;

    footer.appendChild(button);
    footer.appendChild(meta);

    card.appendChild(title);
    card.appendChild(subtitle);
    card.appendChild(description);
    card.appendChild(footer);

    container.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', loadEvents);
