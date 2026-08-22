// Mock AWS Responses and Mock WebSocket for Testing
import { UserProfile } from '../../types/lorcana';

export const MOCK_JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsInVzZXJuYW1lIjoiVGVzdElsbHVtaW5lZXIiLCJleHAiOjE5OTk5OTk5OTl9.mockSignature';

export const MOCK_USER_PROFILE: UserProfile = {
  username: 'TestIllumineer',
  email: 'test@playlab.lorcana',
  role: 'player',
};

export const MOCK_DECK = {
  deckId: 'deck-lorcana-qa-01',
  userId: 'user-123',
  name: 'Ruby / Amethyst Control QA',
  inks: ['Ruby', 'Amethyst'],
  cardCount: 60,
  cards: [
    { id: '1-140', name: 'Elsa - Spirit of Winter', cost: 8, ink: 'Amethyst', count: 4, isInkable: false, inkwell: false, imageUrl: 'https://images.lorcana.test/elsa.jpg' },
    { id: '1-155', name: 'Maleficent - Monstrous Dragon', cost: 9, ink: 'Ruby', count: 4, isInkable: true, inkwell: true, imageUrl: 'https://images.lorcana.test/mal.jpg' },
    { id: '1-141', name: 'Friends on the Other Side', cost: 3, ink: 'Amethyst', count: 4, isInkable: true, inkwell: true, imageUrl: 'https://images.lorcana.test/friends.jpg' },
    { id: '1-158', name: 'Be Prepared', cost: 7, ink: 'Ruby', count: 4, isInkable: true, inkwell: true, imageUrl: 'https://images.lorcana.test/beprepared.jpg' },
  ],
  createdAt: new Date().toISOString(),
};

export class MockWebSocket {
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  public static instances: MockWebSocket[] = [];
  public url: string;
  public readyState: number = 0; // 0: CONNECTING, 1: OPEN, 2: CLOSING, 3: CLOSED
  public onopen: ((event: any) => void) | null = null;
  public onclose: ((event: any) => void) | null = null;
  public onmessage: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  public sentMessages: string[] = [];

  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    this.readyState = 0;
    queueMicrotask(() => {
      this.readyState = 1; // OPEN
      if (this.onopen) this.onopen({ type: 'open' });
    });
  }

  public send(data: string) {
    this.sentMessages.push(data);
  }

  public close(code?: number, reason?: string) {
    this.readyState = 3; // CLOSED
    if (this.onclose) this.onclose({ code: code || 1000, reason: reason || 'Normal Closure' });
  }

  public simulateServerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data: typeof data === 'string' ? data : JSON.stringify(data) });
    }
  }

  public simulateError(error: any) {
    if (this.onerror) {
      this.onerror(error);
    }
  }
}
