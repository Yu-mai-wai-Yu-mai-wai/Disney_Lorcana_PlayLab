import { describe, it, expect } from 'vitest';
import { applyAction, isCardInkable, createInitialState } from '../game';
import type { GameState, LorcanaCard } from '../game';

const makeCard = (overrides: Partial<LorcanaCard> = {}): LorcanaCard => ({
  id: `card-${Math.random().toString(36).substring(2, 9)}`,
  name: 'Test Character',
  cost: 2,
  inkwell: true,
  isInkable: true,
  ink: 'Amber',
  type: 'Character',
  strength: 2,
  willpower: 3,
  lore: 1,
  imageUrl: 'https://example.com/card.png',
  ...overrides,
});

describe('Core Rule Engine QA Suite (T09)', () => {
  it('TC-ENG-01: pure module boundary has zero React or browser DOM dependencies', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const gameDir = path.resolve(__dirname, '../game');
    const files = fs.readdirSync(gameDir);

    for (const file of files) {
      if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        const content = fs.readFileSync(path.join(gameDir, file), 'utf8');
        expect(content).not.toMatch(/from\s+['"]react['"]/);
        expect(content).not.toMatch(/window\./);
        expect(content).not.toMatch(/document\./);
        expect(content).not.toMatch(/localStorage/);
      }
    }
  });

  it('TC-ENG-02: initializes game with 7 cards per player and first player skips turn 1 draw', () => {
    const deck1 = Array.from({ length: 20 }, (_, i) => makeCard({ id: `p1-c${i}`, name: `P1 Card ${i}` }));
    const deck2 = Array.from({ length: 20 }, (_, i) => makeCard({ id: `p2-c${i}`, name: `P2 Card ${i}` }));

    const res = applyAction(createInitialState(), {
      type: 'START_GAME',
      initialDecks: { player1: deck1, player2: deck2 },
      playerNames: { player1: 'Alice', player2: 'Bob' },
      firstPlayerId: 'player1',
    });

    expect(res.success).toBe(true);
    expect(res.state.players.player1.hand.length).toBe(7);
    expect(res.state.players.player2.hand.length).toBe(7);
    expect(res.state.players.player1.deck.length).toBe(13);
    expect(res.state.players.player2.deck.length).toBe(13);
    expect(res.state.activePlayerId).toBe('player1');
    expect(res.state.turnNumber).toBe(1);
  });

  it('TC-ENG-03: enforces inkwell limit of 1 per turn and rejects non-inkable cards', () => {
    const inkableCard = makeCard({ id: 'inkable-1', inkwell: true, isInkable: true });
    const nonInkableCard = makeCard({ id: 'non-inkable-1', inkwell: false, isInkable: false });
    const extraInkable = makeCard({ id: 'inkable-2', inkwell: true, isInkable: true });

    let state = createInitialState();
    state.players.player1.hand = [inkableCard, nonInkableCard, extraInkable];
    state.players.player1.hasInkedThisTurn = false;
    state.activePlayerId = 'player1';

    // 1. Rejects non-inkable card
    const resNonInkable = applyAction(state, {
      type: 'INK_CARD',
      playerId: 'player1',
      cardId: nonInkableCard.id,
    });
    expect(resNonInkable.success).toBe(false);
    expect(resNonInkable.error).toContain('not inkable');
    expect(resNonInkable.state.players.player1.inkwell.length).toBe(0);

    // 2. Accepts valid inkable card
    const resInkable = applyAction(state, {
      type: 'INK_CARD',
      playerId: 'player1',
      cardId: inkableCard.id,
    });
    expect(resInkable.success).toBe(true);
    expect(resInkable.state.players.player1.inkwell.length).toBe(1);
    expect(resInkable.state.players.player1.availableInk).toBe(1);
    expect(resInkable.state.players.player1.hasInkedThisTurn).toBe(true);

    // 3. Rejects second ink attempt in the same turn
    const resSecondInk = applyAction(resInkable.state, {
      type: 'INK_CARD',
      playerId: 'player1',
      cardId: extraInkable.id,
    });
    expect(resSecondInk.success).toBe(false);
    expect(resSecondInk.error).toContain('already inked this turn');
  });

  it('TC-ENG-04: playing character spends available ink and enters play drying', () => {
    const heroCard = makeCard({ id: 'hero-1', cost: 2 });
    let state = createInitialState();
    state.activePlayerId = 'player1';
    state.players.player1.availableInk = 2;
    state.players.player1.inkwell = [makeCard(), makeCard()];
    state.players.player1.hand = [heroCard];

    const res = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: heroCard.id,
    });

    expect(res.success).toBe(true);
    expect(res.state.players.player1.availableInk).toBe(0);
    expect(res.state.players.player1.play.length).toBe(1);
    expect(res.state.players.player1.play[0].isDrying).toBe(true);
    expect(res.state.players.player1.play[0].isExerted).toBe(false);

    // Cannot play another card with 0 available ink
    const anotherCard = makeCard({ id: 'another-1', cost: 1 });
    res.state.players.player1.hand = [anotherCard];
    const resNoInk = applyAction(res.state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: anotherCard.id,
    });
    expect(resNoInk.success).toBe(false);
    expect(resNoInk.error).toContain('insufficient ink');
  });

  it('TC-ENG-05: questing requires unexerted and undrying character; triggers instant win at 20 lore', () => {
    const heroCard = makeCard({ id: 'hero-1', lore: 2 });
    let state = createInitialState();
    state.activePlayerId = 'player1';
    state.players.player1.lore = 19;
    state.players.player1.play = [
      {
        instanceId: 'inst-hero-1',
        card: heroCard,
        isDrying: true,
        isExerted: false,
        damage: 0,
      },
    ];

    // 1. Cannot quest while drying
    const resDrying = applyAction(state, {
      type: 'QUEST',
      playerId: 'player1',
      instanceId: 'inst-hero-1',
    });
    expect(resDrying.success).toBe(false);
    expect(resDrying.error).toContain('drying');

    // 2. Undry and quest successfully -> Lore reaches 21 -> Instant Win!
    state.players.player1.play[0].isDrying = false;
    const resQuest = applyAction(state, {
      type: 'QUEST',
      playerId: 'player1',
      instanceId: 'inst-hero-1',
    });

    expect(resQuest.success).toBe(true);
    expect(resQuest.state.players.player1.lore).toBe(21);
    expect(resQuest.state.players.player1.play[0].isExerted).toBe(true);
    expect(resQuest.state.isGameOver).toBe(true);
    expect(resQuest.state.winnerId).toBe('player1');
  });

  it('TC-ENG-06: challenge requires attacker to be unexerted/undrying and defender to be exerted; deals reciprocal damage', () => {
    const attackerCard = makeCard({ id: 'att-1', name: 'Simba', strength: 3, willpower: 3 });
    const defenderCard = makeCard({ id: 'def-1', name: 'Captain Hook', strength: 2, willpower: 2 });

    let state = createInitialState();
    state.activePlayerId = 'player1';
    state.players.player1.play = [
      {
        instanceId: 'inst-att',
        card: attackerCard,
        isDrying: false,
        isExerted: true, // Already exerted!
        damage: 0,
      },
    ];
    state.players.player2.play = [
      {
        instanceId: 'inst-def',
        card: defenderCard,
        isDrying: false,
        isExerted: false, // Not exerted!
        damage: 0,
      },
    ];

    // 1. Attacker is exerted -> Should reject!
    const resAttackerExerted = applyAction(state, {
      type: 'CHALLENGE',
      playerId: 'player1',
      attackerInstanceId: 'inst-att',
      defenderInstanceId: 'inst-def',
    });
    expect(resAttackerExerted.success).toBe(false);
    expect(resAttackerExerted.error).toContain('attacker is already exerted');

    // Ready the attacker
    state.players.player1.play[0].isExerted = false;

    // 2. Defender is ready (not exerted) -> Should reject!
    const resDefenderReady = applyAction(state, {
      type: 'CHALLENGE',
      playerId: 'player1',
      attackerInstanceId: 'inst-att',
      defenderInstanceId: 'inst-def',
    });
    expect(resDefenderReady.success).toBe(false);
    expect(resDefenderReady.error).toContain('can only challenge exerted');

    // Exert the defender
    state.players.player2.play[0].isExerted = true;

    // 3. Valid challenge execution
    const resValid = applyAction(state, {
      type: 'CHALLENGE',
      playerId: 'player1',
      attackerInstanceId: 'inst-att',
      defenderInstanceId: 'inst-def',
    });

    expect(resValid.success).toBe(true);
    // Attacker deals 3 to Defender (willpower 2) -> Defender banished
    expect(resValid.state.players.player2.play.length).toBe(0);
    expect(resValid.state.players.player2.discard.length).toBe(1);

    // Defender deals 2 to Attacker (willpower 3) -> Attacker takes 2 damage, survives, exerted
    expect(resValid.state.players.player1.play.length).toBe(1);
    expect(resValid.state.players.player1.play[0].damage).toBe(2);
    expect(resValid.state.players.player1.play[0].isExerted).toBe(true);
  });

  it('TC-ENG-07: deck-out rule flags on empty draw and triggers loss at end of turn', () => {
    let state = createInitialState();
    state.activePlayerId = 'player1';
    state.turnNumber = 2;
    state.players.player1.deck = []; // Empty deck!
    state.players.player1.hasDeckedOut = false;

    // Trigger START_TURN which tries to draw
    const resStartTurn = applyAction(state, {
      type: 'START_TURN',
      playerId: 'player1',
    });

    expect(resStartTurn.success).toBe(true);
    expect(resStartTurn.state.players.player1.hasDeckedOut).toBe(true);
    // NOT game over yet! Player can still take actions during main phase.
    expect(resStartTurn.state.isGameOver).toBe(false);

    // Player ends turn -> Loss evaluated at end of turn!
    const resEndTurn = applyAction(resStartTurn.state, {
      type: 'PASS_TURN',
      playerId: 'player1',
    });

    expect(resEndTurn.success).toBe(true);
    expect(resEndTurn.state.isGameOver).toBe(true);
    expect(resEndTurn.state.loserId).toBe('player1');
    expect(resEndTurn.state.winnerId).toBe('player2');
    expect(resEndTurn.state.winReason).toContain('deck empty at end of turn');
  });

  it('TC-ENG-08: passing turn readies next player, clears drying, refreshes ink, and resets ink per turn flag', () => {
    let state = createInitialState();
    state.activePlayerId = 'player1';
    state.players.player1.hasInkedThisTurn = true;
    state.players.player2.inkwell = [makeCard(), makeCard()];
    state.players.player2.availableInk = 0;
    state.players.player2.deck = [makeCard()];
    state.players.player2.play = [
      {
        instanceId: 'inst-p2-1',
        card: makeCard(),
        isDrying: true,
        isExerted: true,
        damage: 0,
      },
    ];

    const res = applyAction(state, {
      type: 'PASS_TURN',
      playerId: 'player1',
    });

    expect(res.success).toBe(true);
    expect(res.state.activePlayerId).toBe('player2');
    const p2 = res.state.players.player2;
    expect(p2.hasInkedThisTurn).toBe(false);
    expect(p2.availableInk).toBe(2); // Refreshed to inkwell capacity
    expect(p2.play[0].isExerted).toBe(false); // Readied!
    expect(p2.play[0].isDrying).toBe(false); // Dried!
    expect(p2.hand.length).toBe(1); // Drew 1 card
  });
});
