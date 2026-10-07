import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseConfig } from '../src/config.js';
import { parseSongs, readSongs } from '../src/songs.js';
import { importSongs } from '../src/importer.js';
import type { YoutubeClient } from '../src/types.js';

test('validates and trims song fields', () => {
  assert.deepEqual(parseSongs([{ title: ' Sweet ', artist: ' CAS ' }]), [{ title: 'Sweet', artist: 'CAS' }]);
  for (const value of [null, {}, [], [null], [{ title: '', artist: 'CAS' }], [{ title: 'Sweet', artist: 1 }]]) {
    assert.throws(() => parseSongs(value));
  }
});

test('accepts the instrumental example list', async () => {
  assert.deepEqual(await readSongs('musicas.example.json'), [
    { title: 'xoxoxo', artist: 'corto.alto' },
    { title: 'Hopopono', artist: 'GoGo Penguin' },
  ]);
});

test('CLI defaults and overrides', () => {
  const defaults = parseConfig([]);
  assert.equal(defaults.help, false);
  if (defaults.help) return;
  assert.equal(defaults.title, 'soft');
  assert.equal(defaults.privacy, 'private');
  assert.equal(defaults.delay, 500);
  const config = parseConfig(['--title', 'My playlist', '--privacy', 'unlisted', '--playlist-id', 'PL123', '--delay', '0']);
  if (config.help) return;
  assert.equal(config.title, 'My playlist');
  assert.equal(config.privacy, 'unlisted');
  assert.equal(config.playlistId, 'PL123');
  assert.equal(config.delay, 0);
  assert.deepEqual(parseConfig(['-h']), { help: true });
});

test('rejects invalid options and destructive report paths', () => {
  for (const args of [
    ['--privacy', 'invalid'], ['--delay', '-1'], ['--delay', 'abc'],
    ['--delay', '0.5'], ['--title', ' '], ['--input', ''],
    ['--playlist-id', ''], ['--unknown'],
    ['--failures', 'musicas.example.json'], ['--failures', './credentials.json'],
  ]) assert.throws(() => parseConfig(args));
});

test('continues after missing results, search errors and insert errors', async () => {
  const songs = ['ok', 'missing', 'search-error', 'insert-error', 'last'].map(title => ({ title, artist: 'Artist' }));
  const inserted: string[] = [];
  const client: YoutubeClient = {
    async createPlaylist() { throw new Error('Must use the supplied playlist'); },
    async searchVideo(song) {
      if (song.title === 'missing') return null;
      if (song.title === 'search-error') throw new Error('Search failed');
      return { videoId: song.title, foundTitle: song.title, channelTitle: 'Channel' };
    },
    async addVideo(playlistId, videoId) {
      assert.equal(playlistId, 'PL123');
      if (videoId === 'insert-error') throw new Error('Insert failed');
      inserted.push(videoId);
    },
  };
  const result = await importSongs(client, 'PL123', songs, 0, () => {});
  assert.equal(result.added, 2);
  assert.deepEqual(inserted, ['ok', 'last']);
  assert.deepEqual(result.failed, songs.slice(1, 4));
});
