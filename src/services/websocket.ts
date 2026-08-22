import { WebSocketActionType, WebSocketMessagePayload, RoomStatePayload } from '../types/lorcana';

const WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT || 'wss://demo.execute-api.us-east-1.amazonaws.com/prod';

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
  private currentUsername: string = 'Illumineer';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

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

        // Mock socket mode for offline testing / sandbox fallback
        if (WS_ENDPOINT.includes('demo.execute-api')) {
          console.log('[WebSocket] Sandbox Mock Active (AWS Ready)');
          this.setConnectionStatus('connected');
          this.emitMockState();
          resolve(true);
          return;
        }

        this.socket = new WebSocket(WS_ENDPOINT);

        this.socket.onopen = () => {
          console.log('[WebSocket] 🟢 Connected to AWS API Gateway WebSockets');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          this.flushQueue();
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

    // Mock fallback trigger for instantaneous local feedback
    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        this.handleIncomingMessage({
          action: 'ROOM_STATE',
          roomId,
          role: 'player1',
          username: this.currentUsername,
          payload: {
            roomId,
            players: [
              { connectionId: 'conn-1', username: this.currentUsername, role: 'player1' },
              { connectionId: 'conn-2', username: 'Opponent_Illumineer', role: 'player2' },
            ],
            loreP1: 0,
            loreP2: 0,
            inkP1: 0,
            inkP2: 0,
          },
        });
      }, 150);
    }
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

    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.currentRoomId = roomId;
        this.handleIncomingMessage({
          action: 'ROOM_CREATED',
          roomId,
          username: this.currentUsername,
          role: 'player1',
          payload: { deckId, deckName },
        });
      }, 500);
    }
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

    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        this.handleIncomingMessage({
          action: 'ROOM_STATE',
          roomId,
          role: 'player2',
          username: this.currentUsername,
          payload: {
            roomId,
            players: [
              { connectionId: 'conn-1', username: 'Host_Illumineer', role: 'player1' },
              { connectionId: 'conn-2', username: this.currentUsername, role: 'player2' },
            ],
            loreP1: 0, loreP2: 0, inkP1: 0, inkP2: 0,
          },
        });
        setTimeout(() => {
          this.handleIncomingMessage({ action: 'GAME_START', roomId });
        }, 500);
      }, 600);
    }
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

    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        this.handleIncomingMessage({ action: 'WAITING', username: this.currentUsername });
      }, 200);

      setTimeout(() => {
        const roomId = 'MATCH1';
        this.currentRoomId = roomId;
        this.handleIncomingMessage({
          action: 'MATCH_FOUND',
          roomId,
          role: 'player1',
          username: this.currentUsername,
        });
      }, 3200);
    }
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

    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        this.handleIncomingMessage({
          action: 'PLAYER_RECONNECTED',
          gameAction: 'PLAYER_RECONNECTED',
          roomId,
          role: this.currentRole,
          username: this.currentUsername,
          isSelf: true,
        });
      }, 300);
    }
  }

  public requestUndo(previousState: any, roomId?: string): void {
    const targetRoomId = roomId || this.currentRoomId || '108249';
    // Send via standard sendAction envelope for 100% AWS WS relay compatibility
    this.sendAction('UNDO_REQUESTED' as any, {
      roomId: targetRoomId,
      role: this.currentRole,
      username: this.currentUsername,
      requesterUsername: this.currentUsername,
      requesterRole: this.currentRole,
      previousState,
    });

    // Also send explicit REQUEST_UNDO for direct backend route handlers
    this.send({
      action: 'REQUEST_UNDO',
      gameAction: 'REQUEST_UNDO',
      type: 'REQUEST_UNDO',
      roomId: targetRoomId,
      username: this.currentUsername,
      role: this.currentRole,
      previousState,
    });

    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        this.handleIncomingMessage({
          action: 'UNDO_REQUESTED',
          gameAction: 'UNDO_REQUESTED',
          roomId: targetRoomId,
          requesterUsername: this.currentUsername,
          requesterRole: this.currentRole,
          previousState,
        });
      }, 300);
    }
  }

  public respondUndo(voteAccepted: boolean, previousState?: any, roomId?: string): void {
    const targetRoomId = roomId || this.currentRoomId || '108249';
    // Send via standard sendAction envelope for 100% AWS WS relay compatibility
    this.sendAction('UNDO_RESOLVED' as any, {
      roomId: targetRoomId,
      role: this.currentRole,
      username: this.currentUsername,
      voteAccepted,
      previousState,
      respondedBy: this.currentUsername,
    });

    // Also send explicit RESPOND_UNDO for direct backend route handlers
    this.send({
      action: 'RESPOND_UNDO',
      gameAction: 'RESPOND_UNDO',
      type: 'RESPOND_UNDO',
      roomId: targetRoomId,
      username: this.currentUsername,
      voteAccepted,
      previousState,
    });

    if (WS_ENDPOINT.includes('demo.execute-api')) {
      setTimeout(() => {
        this.handleIncomingMessage({
          action: 'UNDO_RESOLVED',
          gameAction: 'UNDO_RESOLVED',
          roomId: targetRoomId,
          voteAccepted,
          previousState,
          respondedBy: this.currentUsername,
        });
      }, 300);
    }
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
    const roomId = payloadData.roomId || this.currentRoomId || '108249';
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

  // Initial Mock State for Sandbox Testing
  private emitMockState(): void {
    setTimeout(() => {
      this.handleIncomingMessage({
        action: 'ROOM_STATE',
        gameAction: 'ROOM_STATE',
        roomId: '108249',
        role: 'player1',
        username: this.currentUsername,
      });
    }, 100);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public disconnect(): void {
    if (this.socket) {
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
