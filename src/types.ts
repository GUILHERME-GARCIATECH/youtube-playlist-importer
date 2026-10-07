export interface Song {
  title: string;
  artist: string;
}

export interface Video {
  videoId: string;
  foundTitle: string;
  channelTitle: string;
}

export type Privacy = "private" | "unlisted" | "public";

export interface YoutubeClient {
  createPlaylist(title: string, description: string, privacy: Privacy): Promise<string>;
  searchVideo(song: Song): Promise<Video | null>;
  addVideo(playlistId: string, videoId: string): Promise<void>;
}
