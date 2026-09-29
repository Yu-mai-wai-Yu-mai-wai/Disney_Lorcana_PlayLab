import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, LorcanaCard } from '../game/types';
import { createInitialState, applyAction } from '../game/engine';
import { parseAbility, parseCardAbilities } from '../game/abilities';

function makeCard(overrides: Partial<LorcanaCard>): LorcanaCard {
  return {
    id: `card_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Sample Card',
    cost: 3,
    inkwell: true,
    ink: 'Amber',
    type: 'Character',
    strength: 2,
    willpower: 3,
    lore: 1,
    imageUrl: 'https://example.com/card.png',
    abilities: [],
    ...overrides,
  };
}

describe('Lorcana Ability Timing, Targeting & Coverage Suite (T11)', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState(['player1', 'player2']);
    state.phase = 'main';
    state.activePlayerId = 'player1';
    state.players.player1.availableInk = 10;
  });

  // 1. Ability Trigger Timing Parser
  it('TC-AB-01: parses trigger timing accurately (on_play, on_quest, on_banish, turn_start, turn_end, activated)', () => {
    const playAb = parseAbility('DEVELOP YOUR BRAIN', 'When you play this character, look at the top 2 cards of your deck.');
    expect(playAb.timing).toBe('on_play');

    const questAb = parseAbility('HEART OF TE FITI', 'Whenever this character quests, you may gain 1 lore.');
    expect(questAb.timing).toBe('on_quest');

    const banishAb = parseAbility('LAST LAUGH', 'When this character is banished in a challenge, you may banish chosen character.');
    expect(banishAb.timing).toBe('on_banish');

    const turnStartAb = parseAbility('SUNRISE', 'At the start of your turn, remove up to 1 damage from chosen character.');
    expect(turnStartAb.timing).toBe('turn_start');

    const turnEndAb = parseAbility('NIGHTFALL', 'At the end of your turn, if you have 3 characters in play, draw a card.');
    expect(turnEndAb.timing).toBe('turn_end');

    const activatedAb = parseAbility('HEALING TOUCH', '⟳, 2 ⬡ — Remove up to 2 damage from chosen character.');
    expect(activatedAb.timing).toBe('activated');
  });

  // 2. Timing execution: on_quest does NOT fire on play, fires on quest
  it('TC-AB-02: on_quest ability does not trigger when card is played, and triggers when card quests', () => {
    const questerCard = makeCard({
      id: 'quester_1',
      name: 'Minnie - Quest Leader',
      lore: 2,
      abilities: [
        {
          name: 'INSPIRING CHEER',
          text: 'Whenever this character quests, gain 1 lore.',
        },
      ],
    });

    state.players.player1.hand = [questerCard];
    state.players.player1.lore = 0;

    // 1. Play the card: lore should remain 0! (No on_play trigger)
    const playResult = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: questerCard.id,
    });

    expect(playResult.success).toBe(true);
    expect(playResult.state.players.player1.lore).toBe(0);

    // Prepare character to quest (make dry and ready)
    const inPlayCard = playResult.state.players.player1.play.find(c => c.card.id === questerCard.id)!;
    inPlayCard.isDrying = false;
    inPlayCard.isExerted = false;

    // 2. Quest with the card: gains 2 base lore + 1 lore from ability = 3 lore!
    const questResult = applyAction(playResult.state, {
      type: 'QUEST',
      playerId: 'player1',
      instanceId: inPlayCard.instanceId,
    });

    expect(questResult.success).toBe(true);
    expect(questResult.state.players.player1.lore).toBe(3);
    expect(questResult.events.some(e => e.message.includes('INSPIRING CHEER'))).toBe(true);
  });

  // 3. Target filtering: Banish chosen character with 2 strength or less
  it('TC-AB-03: "banish chosen character with 2 strength or less" excludes characters with strength 3 and creates prompt', () => {
    const dragonCard = makeCard({
      id: 'dragon_1',
      name: 'Dragon - Punisher',
      cost: 4,
      abilities: [
        {
          name: 'FIRE BREATH',
          text: 'When you play this character, banish chosen character with 2 ¤ or less.',
        },
      ],
    });

    const weakOpponent = makeCard({
      id: 'opp_weak',
      name: 'Weak Target',
      strength: 2,
      willpower: 3,
    });

    const strongOpponent = makeCard({
      id: 'opp_strong',
      name: 'Strong Target',
      strength: 3,
      willpower: 5,
    });

    state.players.player1.hand = [dragonCard];
    state.players.player2.play = [
      { instanceId: 'inst_weak', card: weakOpponent, isDrying: false, isExerted: true, damage: 0 },
      { instanceId: 'inst_strong', card: strongOpponent, isDrying: false, isExerted: true, damage: 0 },
    ];

    const playResult = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: dragonCard.id,
    });

    expect(playResult.success).toBe(true);
    // Must return a prompt for choosing a target (NO auto-selection of first card)
    expect(playResult.prompts.length).toBeGreaterThan(0);
    const targetPrompt = playResult.prompts[0];
    expect(targetPrompt.type).toBe('CHOOSE_TARGET');

    // validTargetIds MUST include inst_weak (strength 2) and MUST NOT include inst_strong (strength 3)
    expect(targetPrompt.validTargetIds).toContain('inst_weak');
    expect(targetPrompt.validTargetIds).not.toContain('inst_strong');

    // Resolving with invalid target inst_strong must be rejected
    const invalidResolve = applyAction(playResult.state, {
      type: 'RESOLVE_PROMPT',
      playerId: 'player1',
      promptId: targetPrompt.id,
      chosenTargetId: 'inst_strong',
    });
    expect(invalidResolve.success).toBe(false);
    expect(invalidResolve.error).toMatch(/invalid target/i);

    // Resolving with valid target inst_weak succeeds and banishes it
    const validResolve = applyAction(playResult.state, {
      type: 'RESOLVE_PROMPT',
      playerId: 'player1',
      promptId: targetPrompt.id,
      chosenTargetId: 'inst_weak',
    });
    expect(validResolve.success).toBe(true);
    expect(validResolve.state.players.player2.play.some(c => c.instanceId === 'inst_weak')).toBe(false);
    expect(validResolve.state.players.player2.discard.some(c => c.name === 'Weak Target')).toBe(true);
  });

  // 4. Ward prevents being in validTargetIds for opponent choices
  it('TC-AB-04: Ward prevents an opposing character from being targeted by ability prompt', () => {
    const spellCard = makeCard({
      id: 'spell_1',
      name: 'Elsa - Freeze Spell',
      cost: 3,
      abilities: [
        {
          name: 'FREEZE',
          text: 'When you play this character, exert chosen opposing character.',
        },
      ],
    });

    const wardOpponent = makeCard({
      id: 'opp_ward',
      name: 'Aurora - Ward',
      abilities: [{ name: 'Ward', text: 'Ward (Opponents cannot choose this character except to challenge.)' }],
    });

    const normalOpponent = makeCard({
      id: 'opp_normal',
      name: 'Normal Opponent',
    });

    state.players.player1.hand = [spellCard];
    state.players.player2.play = [
      { instanceId: 'inst_ward', card: wardOpponent, isDrying: false, isExerted: false, damage: 0 },
      { instanceId: 'inst_normal', card: normalOpponent, isDrying: false, isExerted: false, damage: 0 },
    ];

    const playResult = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: spellCard.id,
    });

    expect(playResult.prompts.length).toBe(1);
    const prompt = playResult.prompts[0];
    expect(prompt.validTargetIds).toContain('inst_normal');
    expect(prompt.validTargetIds).not.toContain('inst_ward'); // Ward is protected!
  });

  // 5. Vanish triggers banishment when chosen by an action/ability
  it('TC-AB-05: Vanish character is banished when chosen by opponent ability', () => {
    const vanishCard = makeCard({
      id: 'vanish_target',
      name: 'Rajah - Vanish Tiger',
      abilities: [{ name: 'Vanish', text: 'Vanish' }],
    });

    const puckerCard = makeCard({
      id: 'ping_char',
      name: 'Archer - Pinger',
      abilities: [
        {
          name: 'SNIPE',
          text: 'When you play this character, deal 1 damage to chosen character.',
        },
      ],
    });

    state.players.player1.hand = [puckerCard];
    state.players.player2.play = [
      { instanceId: 'inst_vanish', card: vanishCard, isDrying: false, isExerted: false, damage: 0 },
    ];

    const playResult = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: puckerCard.id,
    });

    const prompt = playResult.prompts[0];
    const resolveResult = applyAction(playResult.state, {
      type: 'RESOLVE_PROMPT',
      playerId: 'player1',
      promptId: prompt.id,
      chosenTargetId: 'inst_vanish',
    });

    expect(resolveResult.success).toBe(true);
    // Vanish triggers immediate banishment to discard
    expect(resolveResult.state.players.player2.play.some(c => c.instanceId === 'inst_vanish')).toBe(false);
    expect(resolveResult.state.players.player2.discard.some(c => c.name === 'Rajah - Vanish Tiger')).toBe(true);
  });
});
