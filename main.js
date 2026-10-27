const CHANNEL_URL = 'https://www.youtube.com/@aslangt_retro';

function goalForSubscribers(subscribers) {
  for (const goal of [500, 1000, 5000, 10000, 25000, 50000, 100000]) {
    if (subscribers < goal) return goal;
  }
  return Math.ceil((subscribers + 1) / 100000) * 100000;
}

function formatFinnish(value) {
  return new Intl.NumberFormat('fi-FI').format(value);
}

function createVideoCard(video) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(video.id)) return null;
  const card = document.createElement('a');
  card.className = 'video-card';
  card.href = `https://www.youtube.com/watch?v=${video.id}`;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const thumb = document.createElement('div');
  thumb.className = 'video-thumb';
  const img = document.createElement('img');
  img.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  const play = document.createElement('span');
  play.className = 'video-play';
  play.textContent = '▶';
  play.setAttribute('aria-hidden', 'true');
  thumb.append(img, play);

  const title = document.createElement('p');
  title.className = 'video-title';
  title.textContent = video.title || 'Katso video YouTubessa';
  const meta = document.createElement('span');
  meta.className = 'video-meta';
  if (video.publishedAt) {
    const date = new Date(video.publishedAt);
    if (!Number.isNaN(date.getTime())) {
      meta.textContent = date.toLocaleDateString('fi-FI', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }
  card.append(thumb, title, meta);
  return card;
}

async function loadChannelData() {
  const response = await fetch(`data/channel.json?v=${Math.floor(Date.now() / 3600000)}`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Tilastojen lataus epäonnistui: ${response.status}`);
  const data = await response.json();

  if (Number.isSafeInteger(data.subscriberCount) && data.subscriberCount >= 0) {
    const count = data.subscriberCount;
    const goal = goalForSubscribers(count);
    const percent = Math.min(100, count / goal * 100);
    document.querySelector('#stats-title').textContent = formatFinnish(count);
    document.querySelector('#counter-note').textContent = `Seuraava tavoite: ${formatFinnish(goal)} tilaajaa`;
    document.querySelector('#milestone-label').textContent = `Kohti ${formatFinnish(goal)} tilaajaa`;
    document.querySelector('#progress-percent').textContent = `${Math.round(percent)} %`;
    document.querySelector('#goal-label').textContent = `${formatFinnish(goal)} tilaajaa`;
    document.querySelector('#progress-fill').style.width = `${percent}%`;
    const progress = document.querySelector('#progress-track');
    progress.setAttribute('aria-valuemax', String(goal));
    progress.setAttribute('aria-valuenow', String(count));
    progress.setAttribute('aria-valuetext', `${count} tilaajaa, tavoite ${goal}`);
  }

  if (Array.isArray(data.videos) && data.videos.length) {
    const cards = data.videos.slice(0, 3).map(createVideoCard).filter(Boolean);
    if (cards.length) document.querySelector('#videos-grid').replaceChildren(...cards);
  }
}

document.querySelector('#year').textContent = String(new Date().getFullYear());
loadChannelData().catch(() => {
  document.querySelector('#counter-note').textContent = 'Tilastot eivät ole juuri nyt saatavilla';
  const fallbackLink = document.querySelector('.videos-pending a');
  if (fallbackLink) fallbackLink.href = `${CHANNEL_URL}/videos`;
});
