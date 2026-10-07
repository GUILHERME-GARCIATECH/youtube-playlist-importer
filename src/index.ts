import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { HELP, parseConfig } from "./config.js";
import { readSongs } from "./songs.js";
import { importSongs } from "./importer.js";

async function main() {
  const config = parseConfig(process.argv.slice(2));
  if (config.help) {
    console.log(HELP);
    return;
  }
  const songs = await readSongs(config.input);
  try {
    await access(config.credentials);
  } catch {
    throw new Error(`Credenciais não encontradas: ${config.credentials}. Veja a configuração OAuth no README.`);
  }
  // Prepare the report before making any changes on YouTube.
  await mkdir(dirname(config.failures), { recursive: true });
  await writeFile(config.failures, JSON.stringify(songs, null, 2) + "\n");
  const { getYoutubeClient } = await import("./youtube.js");
  const client = await getYoutubeClient(config.credentials);
  console.log(config.playlistId ? "Usando playlist existente..." : "Criando playlist...");
  const playlistId = config.playlistId ?? await client.createPlaylist(config.title, config.description, config.privacy);
  console.log(`Playlist: https://www.youtube.com/playlist?list=${playlistId}`);
  const result = await importSongs(client, playlistId, songs, config.delay);
  await writeFile(config.failures, JSON.stringify(result.failed, null, 2) + "\n");
  console.log(`Finalizado: ${result.added} adicionadas; ${result.failed.length} falhas.`);
  if (result.failed.length) {
    console.log(`Músicas pendentes salvas em ${config.failures}`);
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
