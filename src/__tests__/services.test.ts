import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { apiService } from '../services/api';
import { webSocketService } from '../services/websocket';
import { MockWebSocket, MOCK_JWT_TOKEN, MOCK_USER_PROFILE, MOCK_DECK } from '../tests/mocks/awsMocks';

describe('AWS API & WebSocket Services QA Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. apiService REST Endpoints QA Tests', () => {
    it('TC-SERV-01: register should successfully POST to /auth/register and return token', async () => {
      const mockSuccessResponse = {
        message: 'User registered successfully',
        token: MOCK_JWT_TOKEN,
        user: MOCK_USER_PROFILE,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockSuccessResponse,
      } as any);

      const res = await apiService.register('NewIllumineer', 'test@lorcana.cloud', 'Secret123!');
      expect(res.token).toBe(MOCK_JWT_TOKEN);
      expect(res.user?.username).toBe('TestIllumineer');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('TC-SERV-02: login should handle incorrect credentials error gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid username or password' }),
      } as any);

      const res = await apiService.login('WrongUser', 'WrongPassword');
      expect(res.error).toBe('Invalid username or password');
      expect(res.token).toBeUndefined();
    });

    it('TC-SERV-03: saveDeck should include Authorization header when token is present', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Deck saved', deckId: 'deck-123' }),
      } as any);

      const res = await apiService.saveDeck('Ruby/Amethyst Test', [{ id: 'card-1', count: 4 }], MOCK_JWT_TOKEN);
      expect(res.deckId).toBe('deck-123');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/decks'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_JWT_TOKEN}`,
          }),
        })
      );
    });

    it('TC-SERV-04: getUserDecks should fetch list of user decks from DynamoDB endpoint', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ decks: [MOCK_DECK] }),
      } as any);

      const res = await apiService.getUserDecks(MOCK_JWT_TOKEN);
      expect(res.decks).toHaveLength(1);
      expect(res.decks[0].name).toBe(MOCK_DECK.name);
    });

    it('TC-SERV-05: deleteDeck should send DELETE request with deckId in URL path', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Deck deleted' }),
      } as any);

      const res = await apiService.deleteDeck('deck-lorcana-qa-01', MOCK_JWT_TOKEN);
      expect(res.message).toBe('Deck deleted');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/decks/deck-lorcana-qa-01'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('2. WebSocket Client QA Tests', () => {
    let originalWebSocket: any;

    beforeEach(() => {
      originalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = MockWebSocket as any;
      MockWebSocket.instances = [];
    });

    afterEach(() => {
      (global as any).WebSocket = originalWebSocket;
      webSocketService.disconnect();
    });

    it('TC-SERV-06: should track connection status and transition to connected', async () => {
      const statuses: string[] = [];
      const unsub = webSocketService.onStatusChange((status) => statuses.push(status));

      const connectPromise = webSocketService.connect('TestPlayer');
      await connectPromise;

      expect(webSocketService.getStatus()).toBe('connected');
      expect(statuses).toContain('connecting');
      expect(statuses).toContain('connected');
      unsub();
    });

    it('TC-SERV-07: should emit joinRoom message with correct action payload', async () => {
      await webSocketService.connect('PlayerAlpha');
      await new Promise((r) => setTimeout(r, 20));

      webSocketService.joinRoom('ROOM-QA-999', 'PlayerAlpha');
      await new Promise((r) => setTimeout(r, 20));

      const socketInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      expect(socketInstance.sentMessages.length).toBeGreaterThan(0);

      const lastSent = JSON.parse(socketInstance.sentMessages[socketInstance.sentMessages.length - 1]);
      expect(lastSent.action).toBe('JOIN_ROOM');
      expect(lastSent.roomId).toBe('ROOM-QA-999');
      expect(lastSent.username).toBe('PlayerAlpha');
    });

    it('TC-SERV-08: should dispatch action payload with sendAction', async () => {
      await webSocketService.connect('PlayerAlpha');
      await new Promise((r) => setTimeout(r, 20));

      webSocketService.sendAction('CARD_MOVED', { roomId: 'ROOM-QA-999', role: 'player1' });
      await new Promise((r) => setTimeout(r, 20));

      const socketInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      const sentPayloads = socketInstance.sentMessages.map((m) => JSON.parse(m));
      const movedPayload = sentPayloads.find((p) => p.action === 'CARD_MOVED');

      expect(movedPayload).toBeDefined();
      expect(movedPayload.roomId).toBe('ROOM-QA-999');
      expect(movedPayload.role).toBe('player1');
    });

    it('TC-SERV-09: should notify registered message listener when WebSocket message arrives', async () => {
      await webSocketService.connect('PlayerAlpha');
      await new Promise((r) => setTimeout(r, 20));

      let receivedData: any = null;
      webSocketService.subscribe('ROOM_STATE', (data) => {
        receivedData = data;
      });

      const socketInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      socketInstance.simulateServerMessage({
        action: 'ROOM_STATE',
        roomId: 'ROOM-QA-999',
        payload: { opponentLore: 12, currentTurn: 'player1' },
      });

      expect(receivedData).not.toBeNull();
      expect(receivedData.roomId).toBe('ROOM-QA-999');
    });
  });
});
