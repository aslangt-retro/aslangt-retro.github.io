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

// YouTube Data API does not expose an explicit Shorts flag. Current Shorts
// can be up to 3 minutes, so we include only videos longer than 180 seconds.
// This intentionally omits normal landscape videos of 3 minutes or less too.
function durationInSeconds(value) {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value || '');
  if (!match) return 0;
  const [, days = 0, hours = 0, minutes = 0, seconds = 0] = match;
  return Number(days) * 86400 + Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

const videos = [];
let nextPageToken;
for (let page = 0; page < 4 && videos.length < 3; page++) {
  const playlist = await youtube('playlistItems', {
    part: 'contentDetails',
    playlistId: uploadsPlaylist,
    maxResults: 50,
    ...(nextPageToken ? { pageToken: nextPageToken } : {}),
  });
  const ids = (playlist.items || []).map(item => item.contentDetails?.videoId).filter(Boolean);

  if (ids.length) {
    const result = await youtube('videos', { part: 'snippet,status,contentDetails', id: ids.join(',') });
    const byId = new Map((result.items || [])
      .filter(video => video.status?.privacyStatus === 'public'
        && video.snippet?.title
        && durationInSeconds(video.contentDetails?.duration) > 180)
      .map(video => [video.id, video]));
    for (const id of ids) {
      const video = byId.get(id);
      if (!video) continue;
      videos.push({ id: video.id, title: video.snippet.title, publishedAt: video.snippet.publishedAt });
      if (videos.length === 3) break;
    }
  }

  nextPageToken = playlist.nextPageToken;
  if (!nextPageToken) break;
}

const subscriberCount = channel.statistics?.subscriberCount == null
  ? NaN : Number(channel.statistics.subscriberCount);
const output = {
  subscriberCount: channel.statistics?.hiddenSubscriberCount || !Number.isSafeInteger(subscriberCount) ? null : subscriberCount,
  videos,
  updatedAt: new Date().toISOString(),
};

await writeFile(new URL('../data/channel.json', import.meta.url), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Updated AslanGT: subscribers ${output.subscriberCount ?? 'hidden'}, long-form videos ${videos.length}`);
