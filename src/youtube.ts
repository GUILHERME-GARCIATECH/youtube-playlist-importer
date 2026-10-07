import { authenticate } from "@google-cloud/local-auth";
import { youtube, auth as googleAuth } from "googleapis/build/src/apis/youtube/index.js";
import type { YoutubeClient } from "./types.js";

export async function getYoutubeClient(credentials: string): Promise<YoutubeClient> {
  const session = await authenticate({
    keyfilePath: credentials,
    scopes: ["https://www.googleapis.com/auth/youtube"],
  });
  // local-auth uses an older auth library; transfer tokens to the API's client.
  const auth = new googleAuth.OAuth2(session._clientId, session._clientSecret);
  auth.setCredentials(session.credentials);
  const api = youtube({ version: "v3", auth });
  return {
    async createPlaylist(title, description, privacy) {
      const response = await api.playlists.insert({
        part: ["snippet", "status"],
        requestBody: { snippet: { title, description }, status: { privacyStatus: privacy } },
      });
      if (!response.data.id) throw new Error("O YouTube não retornou o ID da playlist criada.");
      return response.data.id;
    },
    async searchVideo(song) {
      const response = await api.search.list({
        part: ["snippet"],
        q: `${song.title} ${song.artist} official audio`,
        type: ["video"], maxResults: 1, videoCategoryId: "10",
      });
      const item = response.data.items?.[0];
      if (!item?.id?.videoId) return null;
      return {
        videoId: item.id.videoId,
        foundTitle: item.snippet?.title ?? song.title,
        channelTitle: item.snippet?.channelTitle ?? "Canal desconhecido",
      };
    },
    async addVideo(playlistId, videoId) {
      await api.playlistItems.insert({
        part: ["snippet"],
        requestBody: { snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } } },
      });
    },
  };
}
