import { readFile } from "node:fs/promises";
import type { Song } from "./types.js";

export function parseSongs(value: unknown): Song[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("A lista de músicas deve ser um array JSON não vazio.");
  }
  return value.map((song: unknown, index) => {
    if (typeof song !== "object" || song === null ||
        !("title" in song) || typeof song.title !== "string" || !song.title.trim() ||
        !("artist" in song) || typeof song.artist !== "string" || !song.artist.trim()) {
      throw new Error(`Música ${index + 1}: title e artist devem ser textos não vazios.`);
    }
    return { title: song.title.trim(), artist: song.artist.trim() };
  });
}

export async function readSongs(path: string): Promise<Song[]> {
  const raw = await readFile(path, "utf8");
  let value: unknown;
  try {
    value = JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(`JSON inválido em ${path}. Confira vírgulas e aspas.`);
  }
  return parseSongs(value);
}
