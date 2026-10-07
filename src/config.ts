import { parseArgs } from "node:util";
import { resolve } from "node:path";
import type { Privacy } from "./types.js";

export const HELP = `Uso: npm start -- [opções]

  --input <arquivo>         Lista JSON (padrão: musicas.json)
  --credentials <arquivo>   OAuth do Google (padrão: credentials.json)
  --title <nome>            Nome da nova playlist (padrão: soft)
  --description <texto>     Descrição da nova playlist
  --privacy <valor>         private, unlisted ou public (padrão: private)
  --playlist-id <id>        Adicionar a uma playlist existente, sem criar outra
  --failures <arquivo>      Relatório JSON (padrão: falhas.json)
  --delay <ms>              Intervalo entre músicas (padrão: 500)
  --help, -h                Mostrar esta ajuda

Caminhos relativos são resolvidos a partir da pasta atual.`;

export function parseConfig(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      input: { type: "string", default: "musicas.json" },
      credentials: { type: "string", default: "credentials.json" },
      title: { type: "string", default: "soft" },
      description: { type: "string", default: "Playlist importada automaticamente via script Node.js." },
      privacy: { type: "string", default: "private" },
      "playlist-id": { type: "string" },
      failures: { type: "string", default: "falhas.json" },
      delay: { type: "string", default: "500" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) return { help: true } as const;
  if (!["private", "unlisted", "public"].includes(values.privacy)) {
    throw new Error("--privacy deve ser private, unlisted ou public.");
  }
  const delay = Number(values.delay);
  if (!values.delay.trim() || !Number.isSafeInteger(delay) || delay < 0) {
    throw new Error("--delay deve ser um número inteiro maior ou igual a zero.");
  }
  if (!values.title.trim()) throw new Error("--title não pode ser vazio.");
  for (const key of ["input", "credentials", "failures"] as const) {
    if (!values[key].trim()) throw new Error(`--${key} não pode ser vazio.`);
  }
  if (values["playlist-id"] !== undefined && !values["playlist-id"].trim()) {
    throw new Error("--playlist-id não pode ser vazio.");
  }
  const input = resolve(values.input);
  const credentials = resolve(values.credentials);
  const failures = resolve(values.failures);
  const normalized = (path: string) => process.platform === "win32" ? path.toLowerCase() : path;
  if ([input, credentials].some((path) => normalized(path) === normalized(failures))) {
    throw new Error("O arquivo de falhas deve ser diferente da entrada e das credenciais.");
  }
  return {
    help: false,
    input, credentials, failures,
    title: values.title.trim(),
    description: values.description,
    privacy: values.privacy as Privacy,
    playlistId: values["playlist-id"]?.trim(),
    delay,
  } as const;
}
