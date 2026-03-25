const DiscordRPC = require('discord-rpc');
const WebSocket = require('ws');

const clientId = '123456789012345678'; // Default placeholder, user should update
const rpc = new DiscordRPC.Client({ transport: 'ipc' });

const wss = new WebSocket.Server({ port: 6463 });

let isRpcReady = false;

rpc.on('ready', () => {
  console.log('--- Vibe Discord Bridge ---');
  console.log('Connected to Discord! 🎮');
  isRpcReady = true;
});

wss.on('connection', (ws) => {
  console.log('Frontend connected 🌐');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'updatePresence' && isRpcReady) {
        const { track, artist, album, duration, currentTime, isPlaying } = data;
        
        rpc.setActivity({
          details: track,
          state: `by ${artist}`,
          startTimestamp: isPlaying ? Math.floor(Date.now() / 1000 - currentTime) : undefined,
          endTimestamp: isPlaying ? Math.floor(Date.now() / 1000 + (duration - currentTime)) : undefined,
          largeImageKey: 'vibe-logo',
          largeImageText: 'Vibe Music',
          smallImageKey: isPlaying ? 'play' : 'pause',
          instance: false,
        }).catch(err => console.error('RPC Error:', err));
      }
    } catch (err) {
      console.error('Parse Error:', err);
    }
  });

  ws.on('close', () => console.log('Frontend disconnected'));
});

rpc.login({ clientId }).catch(err => {
  console.error('Could not connect to Discord. Is it running?');
});

console.log('Bridge WebSocket server listening on ws://localhost:6463');
