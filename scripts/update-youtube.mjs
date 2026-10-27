// Run in GitHub Actions. Never embed YOUTUBE_API_KEY into a public site file.
import { writeFile } from 'node:fs/promises';

const apiKey = process.env.YOUTUBE_API_KEY;
if (!apiKey) {
  console.error('Missing YOUTUBE_API_KEY. Set it in GitHub Actions secrets.');
  process.exit(1);
}

async function youtube(endpoint, params) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  // Send key in the header so the query string does not get logged by intermediaries.
  const response = await fetch(url, { headers: { 'X-goog-api-key': apiKey } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube ${endpoint} API failed: ${response.status} ${body.slice(0, 300)}`);
  }
  return response.json();
}

const channels = await youtube('channels', {
  part: 'statistics,contentDetails',
  forHandle: '@aslangt_retro',
});
const channel = channels.items?.[0];
if (!channel?.id) throw new Error('YouTube-kanavaa @aslangt_retro ei löytynyt.');

const uploadsPlaylist = channel.contentDetails?.relatedPlaylists?.uploads;
if (!uploadsPlaylist) throw new Error('Kanavan lataussoittolistaa ei löytynyt.');

const playlist = await youtube('playlistItems', {
  part: 'contentDetails',
  playlistId: uploadsPlaylist,
  maxResults: 15,
});
const ids = (playlist.items || []).map(item => item.contentDetails?.videoId).filter(Boolean);
let videos = [];
if (ids.length) {
  const result = await youtube('videos', { part: 'snippet,status', id: ids.join(',') });
  const byId = new Map((result.items || [])
    .filter(video => video.status?.privacyStatus === 'public' && video.snippet?.title)
    .map(video => [video.id, video]));
  videos = ids.map(id => byId.get(id)).filter(Boolean).slice(0, 3).map(video => ({
    id: video.id,
    title: video.snippet.title,
    publishedAt: video.snippet.publishedAt,
  }));
}

const subscriberCount = Number(channel.statistics?.subscriberCount);
const output = {
  subscriberCount: channel.statistics?.hiddenSubscriberCount || !Number.isSafeInteger(subscriberCount) ? null : subscriberCount,
  videos,
  updatedAt: new Date().toISOString(),
};

await writeFile(new URL('../data/channel.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Updated Aslan GT: subscribers ${output.subscriberCount ?? 'hidden'}, videos ${videos.length}`);
