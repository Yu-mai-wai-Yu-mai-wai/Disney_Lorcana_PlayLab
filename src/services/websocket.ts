import { WebSocketActionType, WebSocketMessagePayload, RoomStatePayload } from '../types/lorcana';

const WS_ENDPOINT = import.meta.env.VITE_WS_ENDPOINT || 'wss://demo.execute-api.us-east-1.amazonaws.com/prod';

type MessageCallback = (data: WebSocketMessagePayload) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private listeners: Map<string, Set<MessageCallback>> = new Map();
  private isConnected: boolean = false;
  private currentRoomId: string | null = null;
  private currentRole: 'player1' | 'player2' = 'player1';
  private currentUsername: string = 'Illumineer';
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.listeners.set('all', new Set());
  }

  // Connect to AWS API Gateway WebSockets
  public connect(username?: string): Promise<boolean> {
    if (username) this.currentUsername = username;

    return new Promise((resolve) => {
      try {
        // Mock socket mode for offline testing / sandbox fallback
        if (WS_ENDPOINT.includes('demo.execute-api')) {
          console.log('[WebSocket] Sandbox Mock Active (AWS Ready)');
          this.isConnected = true;
          this.emitMockState();
          resolve(true);
          return;
        }

        this.socket = new WebSocket(WS_ENDPOINT);

        this.socket.onopen = () => {
          console.log('[WebSocket] 🟢 Connected to AWS API Gateway WebSockets');
          this.isConnected = true;
          this.reconnectAttempts = 0;
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
          this.isConnected = false;
          resolve(false);
        };

        this.socket.onclose = () => {
          console.log('[WebSocket] 🔴 Connection Closed');
          this.isConnected = false;
          this.attemptReconnect();
        };
      } catch (err) {
        console.error('[WebSocket] Connect Exception:', err);
        this.isConnected = false;
        resolve(false);
      }
    });
  }

  // Join a 6-digit Lorcana Match Room
  public joinRoom(roomId: string, username?: string): void {
    this.currentRoomId = roomId;
    if (username) this.currentUsername = username;

    const payload: WebSocketMessagePayload = {
      action: 'JOIN_ROOM',
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
    const payload: WebSocketMessagePayload = {
      action: 'CREATE_ROOM',
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
    const payload: WebSocketMessagePayload = {
      action: 'JOIN_ROOM',
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
    const payload: WebSocketMessagePayload = {
      action: 'MATCHMAKING_JOIN',
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
    const payload: WebSocketMessagePayload = {
      action: 'MATCHMAKING_LEAVE',
      username: this.currentUsername,
    };
    this.send(payload);
  }
  // ------------------------------------

  // Send action to opponent in <100ms
  public sendAction(action: WebSocketActionType, payloadData: Partial<WebSocketMessagePayload>): void {
    const payload: WebSocketMessagePayload = {
      action,
      roomId: this.currentRoomId || '108249',
      username: this.currentUsername,
      role: this.currentRole,
      ...payloadData,
    };

    this.send(payload);
  }

  // Raw Send
  private send(data: WebSocketMessagePayload): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.log('[WebSocket] Dispatched offline mock action:', data.action);
    }
  }

  // Auto Reconnect Engine
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`[WebSocket] Auto-reconnecting in ${timeout / 1000}s (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.connect();
      }, timeout);
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
  private handleIncomingMessage(data: WebSocketMessagePayload): void {
    if (data.action === 'ROOM_STATE' && data.role) {
      this.currentRole = data.role;
    }

    // Call specific action listeners
    const specificListeners = this.listeners.get(data.action);
    if (specificListeners) {
      specificListeners.forEach((cb) => cb(data));
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
        roomId: '108249',
        role: 'player1',
        username: this.currentUsername,
      });
    }, 100);
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  public getCurrentRole(): 'player1' | 'player2' {
    return this.currentRole;
  }
}

export const webSocketService = new WebSocketService();
