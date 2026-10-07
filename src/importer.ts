import type { Song, YoutubeClient } from "./types.js";

export async function importSongs(
  client: YoutubeClient,
  playlistId: string,
  songs: Song[],
  delay: number,
  log: (message: string) => void = console.log,
) {
  const failed: Song[] = [];
  let added = 0;
  for (const [index, song] of songs.entries()) {
    if (index > 0 && delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    log(`[${index + 1}/${songs.length}] Buscando: ${song.title} - ${song.artist}`);
    try {
      const video = await client.searchVideo(song);
      if (!video) {
        log(`Não encontrado: ${song.title}`);
        failed.push(song);
        continue;
      }
      await client.addVideo(playlistId, video.videoId);
      added++;
      log(`Adicionado: ${video.foundTitle} | ${video.channelTitle}`);
    } catch (error) {
      log(`Erro em ${song.title}: ${error instanceof Error ? error.message : String(error)}`);
      failed.push(song);
    }
  }
  return { added, failed };
}
