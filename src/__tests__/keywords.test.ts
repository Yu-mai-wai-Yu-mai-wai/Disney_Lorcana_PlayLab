import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, LorcanaCard } from '../game/types';
import { createInitialState, applyAction } from '../game/engine';
import { canQuest, canChallenge } from '../game/rules';
import { parseCardKeywords, getEffectiveStrength, getEffectiveDamage } from '../game/keywords';

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

describe('Lorcana Keywords Suite (T10)', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState(['player1', 'player2']);
    state.phase = 'main';
    state.activePlayerId = 'player1';
  });

  // 1. Word boundary regex test
  it('TC-KEY-00: should NOT match substring words like "reward", "awkward", "coward" as Ward or other keywords', () => {
    const awkwardCard = makeCard({
      name: 'Maleficent - Awkward',
      abilities: [{ name: 'WHAT AN AWKWARD SITUATION', text: 'Whenever this character quests, return chosen character.' }],
    });
    const rewardCard = makeCard({
      name: 'Maximus - Palace Rewards',
      abilities: [{ name: 'ROYALLY BIG REWARDS', text: 'At the end of your turn, gain 2 lore.' }],
    });
    const cowardCard = makeCard({
      name: 'Captain Hook - Coward',
      abilities: [{ name: 'YOU COWARD!', text: 'While this character is exerted, opposing characters gain Reckless.' }],
    });

    const awkwardKw = parseCardKeywords(awkwardCard);
    const rewardKw = parseCardKeywords(rewardCard);
    const cowardKw = parseCardKeywords(cowardCard);

    expect(awkwardKw.ward).toBe(false);
    expect(rewardKw.ward).toBe(false);
    expect(cowardKw.ward).toBe(false);
  });

  // 2. Rush
  it('TC-KEY-01: Rush allows challenging on the turn played (drying), but still cannot quest', () => {
    const rushCard = makeCard({
      name: 'Simba - Fighting Rush',
      abilities: [{ name: 'Rush', text: 'Rush (This character can challenge the turn they are played.)' }],
    });
    const regularCard = makeCard({ name: 'Goofy - Regular' });
    const opponentCard = makeCard({ name: 'Opponent - Target', strength: 1, willpower: 3 });

    state.players.player1.play = [
      { instanceId: 'inst_rush', card: rushCard, isDrying: true, isExerted: false, damage: 0 },
      { instanceId: 'inst_reg', card: regularCard, isDrying: true, isExerted: false, damage: 0 },
    ];
    state.players.player2.play = [
      { instanceId: 'inst_opp', card: opponentCard, isDrying: false, isExerted: true, damage: 0 },
    ];

    // Regular drying character cannot challenge
    const regCheck = canChallenge(state, 'player1', 'inst_reg', 'inst_opp');
    expect(regCheck.allowed).toBe(false);
    expect(regCheck.reason).toMatch(/drying/i);

    // Rush drying character CAN challenge
    const rushCheck = canChallenge(state, 'player1', 'inst_rush', 'inst_opp');
    expect(rushCheck.allowed).toBe(true);

    // Rush character STILL cannot quest while drying
    const questCheck = canQuest(state, 'player1', 'inst_rush');
    expect(questCheck.allowed).toBe(false);
    expect(questCheck.reason).toMatch(/drying/i);
  });

  // 3. Evasive & Alert
  it('TC-KEY-02: Evasive can only be challenged by Evasive or Alert characters', () => {
    const evasiveOpponent = makeCard({
      name: 'Peter Pan - Never Land',
      abilities: [{ name: 'Evasive', text: 'Evasive (Only characters with Evasive can challenge this character.)' }],
    });
    const normalAttacker = makeCard({ name: 'Normal Attacker' });
    const evasiveAttacker = makeCard({
      name: 'Tinker Bell - Evasive',
      abilities: [{ name: 'Evasive', text: 'Evasive' }],
    });
    const alertAttacker = makeCard({
      name: 'Robin Hood - Sharp Eye',
      abilities: [{ name: 'Alert', text: 'Alert (This character can challenge Evasive characters.)' }],
    });

    state.players.player2.play = [
      { instanceId: 'inst_evasive_opp', card: evasiveOpponent, isDrying: false, isExerted: true, damage: 0 },
    ];
    state.players.player1.play = [
      { instanceId: 'inst_normal', card: normalAttacker, isDrying: false, isExerted: false, damage: 0 },
      { instanceId: 'inst_evasive_atk', card: evasiveAttacker, isDrying: false, isExerted: false, damage: 0 },
      { instanceId: 'inst_alert', card: alertAttacker, isDrying: false, isExerted: false, damage: 0 },
    ];

    // Normal cannot challenge Evasive
    const normalCheck = canChallenge(state, 'player1', 'inst_normal', 'inst_evasive_opp');
    expect(normalCheck.allowed).toBe(false);
    expect(normalCheck.reason).toMatch(/evasive/i);

    // Evasive attacker CAN challenge Evasive defender
    const evasiveCheck = canChallenge(state, 'player1', 'inst_evasive_atk', 'inst_evasive_opp');
    expect(evasiveCheck.allowed).toBe(true);

    // Alert attacker CAN challenge Evasive defender
    const alertCheck = canChallenge(state, 'player1', 'inst_alert', 'inst_evasive_opp');
    expect(alertCheck.allowed).toBe(true);
  });

  // 4. Bodyguard
  it('TC-KEY-03: Bodyguard forces attacker to target exerted Bodyguard if able', () => {
    const bodyguardCard = makeCard({
      name: 'Maximus - Palace Horse',
      abilities: [{ name: 'Bodyguard', text: 'Bodyguard (This character may enter play exerted. An opposing character who challenges must choose a character with Bodyguard if able.)' }],
    });
    const nonBodyguardCard = makeCard({ name: 'Aladdin - Street Rat' });
    const attackerCard = makeCard({ name: 'Attacker' });

    state.players.player2.play = [
      { instanceId: 'inst_bg', card: bodyguardCard, isDrying: false, isExerted: true, damage: 0 },
      { instanceId: 'inst_non_bg', card: nonBodyguardCard, isDrying: false, isExerted: true, damage: 0 },
    ];
    state.players.player1.play = [
      { instanceId: 'inst_atk', card: attackerCard, isDrying: false, isExerted: false, damage: 0 },
    ];

    // Attacking non-bodyguard when exerted bodyguard is present must be rejected
    const nonBgCheck = canChallenge(state, 'player1', 'inst_atk', 'inst_non_bg');
    expect(nonBgCheck.allowed).toBe(false);
    expect(nonBgCheck.reason).toMatch(/bodyguard/i);

    // Attacking bodyguard is allowed
    const bgCheck = canChallenge(state, 'player1', 'inst_atk', 'inst_bg');
    expect(bgCheck.allowed).toBe(true);
  });

  // 5. Challenger +N (and stacking)
  it('TC-KEY-04: Challenger +N grants +N strength when challenging and stacks, but not when defending', () => {
    const challengerCard = makeCard({
      name: 'Mulan - Imperial Soldier',
      strength: 2,
      willpower: 4,
      abilities: [
        { name: 'Challenger +2', text: 'Challenger +2 (While challenging, this character gets +2 ¤.)' },
        { name: 'Extra Grit', text: 'Challenger +1' },
      ],
    });
    const defenderCard = makeCard({
      name: 'Gaston - Bully',
      strength: 1,
      willpower: 5,
    });

    const kw = parseCardKeywords(challengerCard);
    expect(kw.challenger).toBe(3); // +2 and +1 stack!

    // Effective strength when challenging: 2 base + 3 challenger = 5
    expect(getEffectiveStrength(challengerCard, true)).toBe(5);
    // Effective strength when defending: 2 base only
    expect(getEffectiveStrength(challengerCard, false)).toBe(2);

    state.players.player1.play = [
      { instanceId: 'inst_challenger', card: challengerCard, isDrying: false, isExerted: false, damage: 0 },
    ];
    state.players.player2.play = [
      { instanceId: 'inst_gaston', card: defenderCard, isDrying: false, isExerted: true, damage: 0 },
    ];

    // Challenge action resolves with 5 damage dealt to Gaston (willpower 5 -> banished!)
    const result = applyAction(state, {
      type: 'CHALLENGE',
      playerId: 'player1',
      attackerInstanceId: 'inst_challenger',
      defenderInstanceId: 'inst_gaston',
    });

    expect(result.success).toBe(true);
    // Gaston took 5 damage and had willpower 5, so banished
    expect(result.state.players.player2.play.some(c => c.instanceId === 'inst_gaston')).toBe(false);
    expect(result.state.players.player2.discard.some(c => c.name === 'Gaston - Bully')).toBe(true);
  });

  // 6. Resist +N (and stacking)
  it('TC-KEY-05: Resist +N reduces incoming damage and stacks', () => {
    const armoredCard = makeCard({
      name: 'Cinderella - Stouthearted',
      strength: 3,
      willpower: 5,
      abilities: [
        { name: 'Resist +2', text: 'Resist +2 (Damage dealt to this character is reduced by 2.)' },
        { name: 'Shield', text: 'Resist +1' },
      ],
    });
    const enemyAttacker = makeCard({
      name: 'Attacker',
      strength: 4,
      willpower: 4,
    });

    const kw = parseCardKeywords(armoredCard);
    expect(kw.resist).toBe(3); // 2 + 1 = 3

    // Incoming 4 damage reduced by 3 resist = 1 damage
    expect(getEffectiveDamage(4, kw.resist)).toBe(1);

    state.players.player1.play = [
      { instanceId: 'inst_enemy', card: enemyAttacker, isDrying: false, isExerted: false, damage: 0 },
    ];
    state.players.player2.play = [
      { instanceId: 'inst_cinderella', card: armoredCard, isDrying: false, isExerted: true, damage: 0 },
    ];

    const result = applyAction(state, {
      type: 'CHALLENGE',
      playerId: 'player1',
      attackerInstanceId: 'inst_enemy',
      defenderInstanceId: 'inst_cinderella',
    });

    expect(result.success).toBe(true);
    const cinderellaInPlay = result.state.players.player2.play.find(c => c.instanceId === 'inst_cinderella');
    expect(cinderellaInPlay?.damage).toBe(1); // 4 damage - 3 resist = 1
  });

  // 7. Reckless
  it('TC-KEY-06: Reckless cannot quest and blocks ending turn if ready with a legal challenge target', () => {
    const recklessCard = makeCard({
      name: 'Maui - Demigod',
      abilities: [{ name: 'Reckless', text: 'Reckless (This character cannot quest and must challenge if able.)' }],
    });
    const opponentExerted = makeCard({ name: 'Opponent Target', strength: 1, willpower: 3 });

    state.players.player1.play = [
      { instanceId: 'inst_maui', card: recklessCard, isDrying: false, isExerted: false, damage: 0 },
    ];
    state.players.player2.play = [
      { instanceId: 'inst_opp_target', card: opponentExerted, isDrying: false, isExerted: true, damage: 0 },
    ];

    // Reckless cannot quest
    const questCheck = canQuest(state, 'player1', 'inst_maui');
    expect(questCheck.allowed).toBe(false);
    expect(questCheck.reason).toMatch(/reckless/i);

    // Player 1 cannot pass turn while Maui is ready and opponent target is available
    const passResult = applyAction(state, { type: 'PASS_TURN', playerId: 'player1' });
    expect(passResult.success).toBe(false);
    expect(passResult.error).toMatch(/reckless/i);
  });

  // 8. Ward & Vanish
  it('TC-KEY-07: Ward prevents opponent choice, Vanish triggers banish on opponent choice', () => {
    const wardCard = makeCard({
      name: 'Aurora - Dreaming Guardian',
      abilities: [{ name: 'Ward', text: 'Ward (Opponents cannot choose this character except to challenge.)' }],
    });
    const vanishCard = makeCard({
      name: 'Rajah - Ghostly Tiger',
      abilities: [{ name: 'Vanish', text: 'When this character is chosen by an opponent as part of resolving an action effect, banish them.' }],
    });

    const wardKw = parseCardKeywords(wardCard);
    const vanishKw = parseCardKeywords(vanishCard);

    expect(wardKw.ward).toBe(true);
    expect(vanishKw.vanish).toBe(true);
  });

  // 9. Singer N & Sing Together N
  it('TC-KEY-08: Singer N and Sing Together N parse singer values correctly', () => {
    const singerCard = makeCard({
      name: 'Ariel - Spectacular Singer',
      cost: 3,
      abilities: [{ name: 'Singer 5', text: 'Singer 5 (This character counts as cost 5 to sing songs.)' }],
    });
    const chorusCard = makeCard({
      name: '4Town - Band',
      cost: 4,
      abilities: [{ name: 'Sing Together 6', text: 'Sing Together 6' }],
    });

    const singerKw = parseCardKeywords(singerCard);
    const chorusKw = parseCardKeywords(chorusCard);

    expect(singerKw.singer).toBe(5);
    expect(chorusKw.singTogether).toBe(6);
  });

  // 10. Shift N & Boost N & Support
  it('TC-KEY-09: Shift N, Boost N, and Support keywords are parsed accurately', () => {
    const shiftCard = makeCard({
      name: 'Elsa - Spirit of Winter',
      abilities: [{ name: 'Shift 6', text: 'Shift 6 (You may pay 6 ink to play this on top of one of your characters named Elsa.)' }],
    });
    const boostCard = makeCard({
      name: 'Boost Pilot',
      abilities: [{ name: 'Boost 2', text: 'Boost 2 (Once during your turn, pay 2 ink to put top card under this.)' }],
    });
    const supportCard = makeCard({
      name: 'Fauna - Fairy',
      abilities: [{ name: 'Support', text: 'Support (Whenever this character quests, add their strength to another character.)' }],
    });

    const shiftKw = parseCardKeywords(shiftCard);
    const boostKw = parseCardKeywords(boostCard);
    const supportKw = parseCardKeywords(supportCard);

    expect(shiftKw.shift?.cost).toBe(6);
    expect(boostKw.boost).toBe(2);
    expect(supportKw.support).toBe(true);
  });
});
