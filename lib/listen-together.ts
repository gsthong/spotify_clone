// @ts-ignore
import Peer from 'peerjs';

export interface ListenTogetherState {
  trackId: string | null;
  currentTime: number;
  isPlaying: boolean;
  queue: any[];
  sentAt: number;
}

export class ListenTogetherManager {
  private peer: Peer | null = null;
  private connections: Map<string, any> = new Map();
  private onSyncCallback: ((state: ListenTogetherState) => void) | null = null;

  constructor(sessionId?: string) {
    if (typeof window === 'undefined') return;
    this.peer = new Peer(sessionId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/'
    });

    this.peer.on('connection', (conn) => {
      this.connections.set(conn.peer, conn);
      conn.on('close', () => this.connections.delete(conn.peer));
    });
  }

  join(sessionId: string) {
    if (!this.peer) return;
    const conn = this.peer.connect(sessionId);
    conn.on('data', (data: any) => {
      if (data.type === 'sync' && this.onSyncCallback) {
        this.onSyncCallback(data.state);
      }
    });
  }

  broadcast(state: ListenTogetherState) {
    this.connections.forEach(conn => {
      conn.send({ type: 'sync', state });
    });
  }

  onSync(callback: (state: ListenTogetherState) => void) {
    this.onSyncCallback = callback;
  }

  get id() {
    return this.peer?.id;
  }

  destroy() {
    this.peer?.destroy();
  }
}
