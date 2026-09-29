import { WebSocketActionType, WebSocketMessagePayload, RoomStatePayload } from '../types/lorcana';

function getWsEndpoint(): string {
  const envEndpoint = import.meta.env.VITE_WS_ENDPOINT;
  if (envEndpoint && envEndpoint.startsWith('ws')) {
    return envEndpoint;
  }
  if (typeof window !== 'undefined' && window.location && window.location.host) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws`;
  }
  return '';
}

type MessageCallback = (data: WebSocketMessagePayload) => void;

type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private connectionStatus: ConnectionStatus = 'disconnected';
  private isConnected: boolean = false;
  private currentRoomId: string | null = null;
  private currentRole: 'player1' | 'player2' = 'player1';
  private currentUsername: string = (() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lorcana_guest_name');
      if (saved) return saved;
      const gen = `Illumineer_${Math.floor(1000 + Math.random() * 9000)}`;
      try { localStorage.setItem('lorcana_guest_name', gen); } catch (e) {}
      return gen;
    }
    return 'Illumineer';
  })();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.listeners.set('all', new Set());
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.isConnected = status === 'connected';
    this.statusListeners.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('[WebSocket] Status listener error:', err);
      }
    });
  }

  public onStatusChange(cb: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.connectionStatus);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  private messageQueue: any[] = [];

  // Connect to AWS API Gateway WebSockets
  public connect(username?: string): Promise<boolean> {
    if (username) this.currentUsername = username;

    return new Promise((resolve) => {
      try {
        // Reuse already open connection
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.setConnectionStatus('connected');
          resolve(true);
          return;
        }

        this.setConnectionStatus('connecting');

        // Wait if already connecting
        if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
          const checkTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
              clearInterval(checkTimer);
              this.setConnectionStatus('connected');
              this.flushQueue();
              resolve(true);
            } else if (!this.socket || this.socket.readyState > WebSocket.OPEN) {
              clearInterval(checkTimer);
              this.setConnectionStatus('disconnected');
              resolve(false);
            }
          }, 50);
          return;
        }

        const endpoint = getWsEndpoint();
        if (!endpoint) {
          console.error('[WebSocket] No endpoint: set VITE_WS_ENDPOINT');
          this.setConnectionStatus('disconnected');
          resolve(false);
          return;
        }

        this.socket = new WebSocket(endpoint);

        this.socket.onopen = () => {
          console.log('[WebSocket] 🟢 Connected to AWS API Gateway WebSockets');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          this.flushQueue();

          // Heartbeat Ping loop every 20s to prevent Nginx/ALB idle disconnect
          if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
          this.heartbeatTimer = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
              this.socket.send(JSON.stringify({ action: 'PING', type: 'PING' }));
            }
          }, 20000);

          // Auto-rejoin active room upon reconnect
          if (this.currentRoomId) {
            console.log(`[WebSocket] Restoring active room ${this.currentRoomId} as ${this.currentRole}`);
            this.rejoinRoom(this.currentRoomId);
          }

          resolve(true);
        };

        this.socket.onmessage = (event) => {
          try {
            const data: WebSocketMessagePayload = JSON.parse(event.data);
            this.handleIncomingMessage(data);
          } catch (err) {
            console.error('[WebSocket] Message Parse Error:', err);
          }
        };

        this.socket.onerror = (err) => {
          console.warn('[WebSocket] Connection Error:', err);
          this.setConnectionStatus('disconnected');
          resolve(false);
        };

        this.socket.onclose = () => {
          console.log('[WebSocket] 🔴 Connection Closed');
          if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
          }
          this.setConnectionStatus('disconnected');
          this.attemptReconnect();
        };
      } catch (err) {
        console.error('[WebSocket] Connect Exception:', err);
        this.setConnectionStatus('disconnected');
        resolve(false);
      }
    });
  }

  private flushQueue(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN && this.messageQueue.length > 0) {
      console.log(`[WebSocket] Flushing ${this.messageQueue.length} queued messages`);
      while (this.messageQueue.length > 0) {
        const item = this.messageQueue.shift();
        try {
          this.socket.send(JSON.stringify(item));
        } catch (e) {
          console.error('[WebSocket] Failed to send queued message', e);
        }
      }
    }
  }

  // Join a 6-digit Lorcana Match Room
  public joinRoom(roomId: string, username?: string): void {
    this.currentRoomId = roomId;
    if (username) this.currentUsername = username;

    const payload: any = {
      action: 'JOIN_ROOM',
      gameAction: 'JOIN_ROOM',
      type: 'JOIN_ROOM',
      roomId,
      username: this.currentUsername,
    };

    this.send(payload);
  }

  // --- SPRINT 3 Match Lobby Methods ---
  public createRoom(deckId: string, deckName: string): void {
    const payload: any = {
      action: 'CREATE_ROOM',
      gameAction: 'CREATE_ROOM',
      type: 'CREATE_ROOM',
      username: this.currentUsername,
      deckId,
      deckName,
    };
    this.send(payload);
  }

  public joinRoomWithDeck(roomId: string, deckId: string, deckName: string): void {
    this.currentRoomId = roomId;
    this.currentRole = 'player2';
    const payload: any = {
      action: 'JOIN_ROOM',
      gameAction: 'JOIN_ROOM',
      type: 'JOIN_ROOM',
      roomId,
      username: this.currentUsername,
      deckId,
      deckName,
    };
    this.send(payload);
  }

  public findMatch(deckId: string, deckName: string): void {
    const payload: any = {
      action: 'MATCHMAKING_JOIN',
      gameAction: 'MATCHMAKING_JOIN',
      type: 'MATCHMAKING_JOIN',
      username: this.currentUsername,
      deckId,
      deckName,
    };
    this.send(payload);
  }

  public cancelMatchmaking(): void {
    const payload: any = {
      action: 'MATCHMAKING_LEAVE',
      gameAction: 'MATCHMAKING_LEAVE',
      type: 'MATCHMAKING_LEAVE',
      username: this.currentUsername,
    };
    this.send(payload);
  }

  public setRoomId(roomId: string): void {
    this.currentRoomId = roomId;
  }

  public setRole(role: 'player1' | 'player2'): void {
    this.currentRole = role;
  }

  public setUsername(username: string): void {
    this.currentUsername = username;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('lorcana_guest_name', username); } catch (e) {}
    }
  }

  public getUsername(): string {
    return this.currentUsername;
  }

  public rejoinRoom(roomId: string, deckId?: string, deckName?: string): void {
    this.currentRoomId = roomId;
    const payload: any = {
      action: 'REJOIN_ROOM',
      gameAction: 'REJOIN_ROOM',
      type: 'REJOIN_ROOM',
      roomId,
      username: this.currentUsername,
      role: this.currentRole,
      deckId,
      deckName,
    };
    this.send(payload);

    // Also sendAction to ensure it relays across AWS WS relay if REJOIN_ROOM route is unrouted
    this.sendAction('PLAYER_RECONNECTED' as any, {
      roomId,
      role: this.currentRole,
      username: this.currentUsername,
      isSelf: false,
    });
  }

  public requestUndo(previousState: any, roomId?: string): void {
    const targetRoomId = roomId || this.currentRoomId;
    if (!targetRoomId) return;
    // Send single canonical UNDO_REQUESTED envelope to avoid duplicate handling
    this.sendAction('UNDO_REQUESTED' as any, {
      roomId: targetRoomId,
      role: this.currentRole,
      username: this.currentUsername,
      requesterUsername: this.currentUsername,
      requesterRole: this.currentRole,
      previousState,
    });
  }

  public respondUndo(voteAccepted: boolean, previousState?: any, roomId?: string): void {
    const targetRoomId = roomId || this.currentRoomId;
    if (!targetRoomId) return;
    // Send single canonical UNDO_RESOLVED envelope to avoid duplicate handling
    this.sendAction('UNDO_RESOLVED' as any, {
      roomId: targetRoomId,
      role: this.currentRole,
      username: this.currentUsername,
      voteAccepted,
      previousState,
      respondedBy: this.currentUsername,
    });
  }

  public sendChat(message: string, roomId?: string, role?: 'player1' | 'player2'): void {
    this.sendAction('CHAT_MESSAGE' as WebSocketActionType, {
      message,
      roomId: roomId || this.currentRoomId || undefined,
      role: role || this.currentRole,
      username: this.currentUsername,
    });
  }
  // ------------------------------------

  // Send action to opponent in <100ms
  public sendAction(action: WebSocketActionType, payloadData: Partial<WebSocketMessagePayload>): void {
    const roomId = payloadData.roomId || this.currentRoomId;
    if (!roomId) {
      console.warn('[WebSocket] sendAction without a room, dropped:', action);
      return;
    }
    const role = payloadData.role || this.currentRole;
    const username = payloadData.username || this.currentUsername;

    const payload: any = {
      action: action,
      gameAction: action,
      realAction: action,
      type: action,
      roomId,
      username,
      role,
      ...payloadData,
      payload: {
        ...(payloadData.payload || {}),
        roomId,
        role,
        username,
        gameAction: action,
      },
    };

    this.send(payload);
  }

  // Raw Send
  private send(data: WebSocketMessagePayload): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else if (this.socket && this.socket.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Socket connecting, queueing payload:', data.action);
      this.messageQueue.push(data);
    } else {
      console.log('[WebSocket] Socket disconnected, attempting auto-connect and queueing:', data.action);
      this.messageQueue.push(data);
      this.connect();
    }
  }

  // Auto Reconnect Engine
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setConnectionStatus('reconnecting');
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[WebSocket] Auto-reconnecting in ${timeout / 1000}s (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect();
      }, timeout);
    } else {
      this.setConnectionStatus('disconnected');
    }
  }

  // Subscribe to WebSocket Events
  public subscribe(action: string, callback: MessageCallback): () => void {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, new Set());
    }
    this.listeners.get(action)!.add(callback);

    return () => {
      this.listeners.get(action)?.delete(callback);
    };
  }

  // Dispatch incoming messages to subscribed callbacks
  private handleIncomingMessage(data: any): void {
    if (data.action === 'PONG' || data.type === 'PONG') {
      return;
    }

    const targetAction = data.gameAction || data.realAction || data.action || data.type || (data.payload && (data.payload.gameAction || data.payload.action || data.payload.type));

    if (targetAction === 'ROOM_CREATED') {
      if (data.roomId) this.currentRoomId = data.roomId;
      this.currentRole = 'player1';
    } else if (targetAction === 'MATCH_FOUND' || targetAction === 'ROOM_STATE' || targetAction === 'GAME_START') {
      if (data.roomId) this.currentRoomId = data.roomId;
    }

    // Call specific action listeners by targetAction
    if (targetAction && this.listeners.has(targetAction)) {
      this.listeners.get(targetAction)!.forEach((cb) => cb(data));
    }

    // Also call if data.action is different from targetAction (e.g. if 'sendAction' was passed)
    if (data.action && data.action !== targetAction && this.listeners.has(data.action)) {
      this.listeners.get(data.action)!.forEach((cb) => cb(data));
    }

    // Call 'all' listeners
    const allListeners = this.listeners.get('all');
    if (allListeners) {
      allListeners.forEach((cb) => cb(data));
    }
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Explicit voluntary exit (Exit Match button).
   * Sends LEAVE_ROOM so the backend hard-deletes the player record and
   * notifies the opponent (OPPONENT_LEFT) — the slot frees up immediately,
   * unlike a network drop which keeps a 60s rejoin grace period.
   */
  public leaveRoom(): void {
    const roomId = this.currentRoomId;
    if (!roomId) {
      this.disconnect();
      return;
    }
    const payload: any = {
      action: 'LEAVE_ROOM',
      gameAction: 'LEAVE_ROOM',
      type: 'LEAVE_ROOM',
      roomId,
      username: this.currentUsername,
    };
    try {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        // Send synchronously, then close after a short flush window
        this.socket.send(JSON.stringify(payload));
        setTimeout(() => this.disconnect(), 250);
        return;
      }
    } catch (e) {
      console.error('[WebSocket] leaveRoom send failed', e);
    }
    this.disconnect();
  }

  public disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.socket) {
      // Prevent auto-reconnect firing on a deliberate close
      this.socket.onclose = null;
      this.socket.close();
      this.socket = null;
    }
    this.setConnectionStatus('disconnected');
    this.currentRoomId = null;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  public getCurrentRole(): 'player1' | 'player2' {
    return this.currentRole;
  }
}

export const webSocketService = new WebSocketService();
