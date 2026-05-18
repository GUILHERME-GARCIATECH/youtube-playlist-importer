import fs from "node:fs/promises";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";

const SCOPES = ["https://www.googleapis.com/auth/youtube"];
const PLAYLIST_TITLE = "soft";
const PLAYLIST_DESCRIPTION = "Playlist importada automaticamente via script Node.js.";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getYoutubeClient() {
    const auth = await authenticate({
        keyfilePath: "./credentials.json",
        scopes: SCOPES
    });

    return google.youtube({
        version: "v3",
        auth
    });
}

async function createPlaylist(youtube) {
    const response = await youtube.playlists.insert({
        part: ["snippet", "status"],
        requestBody: {
            snippet: {
                title: PLAYLIST_TITLE,
                description: PLAYLIST_DESCRIPTION
            },
            status: {
                privacyStatus: "private"
            }
        }
    });

    return response.data.id;
}

async function searchVideo(youtube, title, artist) {
    const query = `${title} ${artist} official audio`;

    const response = await youtube.search.list({
        part: ["snippet"],
        q: query,
        type: ["video"],
        maxResults: 1,
        videoCategoryId: "10"
    });

    const item = response.data.items?.[0];

    if (!item) {
        return null;
    }

    return {
        videoId: item.id.videoId,
        foundTitle: item.snippet.title,
        channelTitle: item.snippet.channelTitle
    };
}

async function addVideoToPlaylist(youtube, playlistId, videoId) {
    await youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
            snippet: {
                playlistId,
                resourceId: {
                    kind: "youtube#video",
                    videoId
                }
            }
        }
    });
}

async function main() {
    const raw = await fs.readFile("./musicas.json", "utf-8");
    const songs = JSON.parse(raw);

    const youtube = await getYoutubeClient();

    console.log("Criando playlist...");
    const playlistId = await createPlaylist(youtube);

    console.log(`Playlist criada: ${PLAYLIST_TITLE}`);
    console.log(`ID: ${playlistId}`);
    console.log("");

    const failed = [];

    for (const song of songs) {
        try {
            console.log(`Buscando: ${song.title} - ${song.artist}`);

            const video = await searchVideo(youtube, song.title, song.artist);

            if (!video) {
                console.log(`Não encontrado: ${song.title}`);
                failed.push(song);
                continue;
            }

            await addVideoToPlaylist(youtube, playlistId, video.videoId);

            console.log(`Adicionado: ${video.foundTitle} | ${video.channelTitle}`);
            console.log("");

            await sleep(500);
        } catch (error) {
            console.log(`Erro em: ${song.title} - ${song.artist}`);
            console.log(error.message);
            failed.push(song);
        }
    }

    if (failed.length > 0) {
        await fs.writeFile("./falhas.json", JSON.stringify(failed, null, 2));
        console.log("Algumas músicas falharam. Veja falhas.json");
    }

    console.log("Finalizado.");
    console.log(`Abra: https://www.youtube.com/playlist?list=${playlistId}`);
}

main().catch((error) => {
    console.error("Erro geral:");
    console.error(error);
});