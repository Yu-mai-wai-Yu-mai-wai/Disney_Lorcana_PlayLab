import { describe, it, expect, beforeEach } from 'vitest';
import type { GameState, LorcanaCard } from '../game/types';
import { createInitialState, applyAction } from '../game/engine';

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

describe('Shift, Location, Song, Item Suite (T12)', () => {
  let state: GameState;

  beforeEach(() => {
    state = createInitialState(['player1', 'player2']);
    state.phase = 'main';
    state.activePlayerId = 'player1';
    state.players.player1.availableInk = 10;
  });

  // 1. Shift inherits state (drying, exerted, damage) and whole stack leaves play together
  it('TC-T12-01: Shift card inherits dry/exert/damage state from target and whole stack leaves play together on banish', () => {
    const baseElsa = makeCard({
      id: 'elsa_base',
      name: 'Elsa',
      title: 'Snow Queen',
      cost: 3,
      strength: 2,
      willpower: 3,
    });

    const shiftElsa = makeCard({
      id: 'elsa_floodborn',
      name: 'Elsa',
      title: 'Spirit of Winter',
      cost: 8,
      strength: 4,
      willpower: 6,
      abilities: [
        { name: 'Shift 6', text: 'Shift 6 (You may pay 6 ink to play this on top of one of your characters named Elsa.)' },
      ],
    });

    // Base Elsa is on board: DRY (not drying), EXERTED (exerted after quest), with 1 DAMAGE
    state.players.player1.play = [
      {
        instanceId: 'inst_elsa_base',
        card: baseElsa,
        isDrying: false,
        isExerted: true,
        damage: 1,
      },
    ];
    state.players.player1.hand = [shiftElsa];
    state.players.player1.availableInk = 6;

    // Shift Elsa onto base Elsa for Shift cost 6
    const shiftResult = applyAction(state, {
      type: 'SHIFT_CARD',
      playerId: 'player1',
      cardId: shiftElsa.id,
      targetInstanceId: 'inst_elsa_base',
    });

    expect(shiftResult.success).toBe(true);
    expect(shiftResult.state.players.player1.availableInk).toBe(0); // 6 ink paid
    expect(shiftResult.state.players.player1.play.length).toBe(1);

    const shiftedInPlay = shiftResult.state.players.player1.play[0];
    expect(shiftedInPlay.card.title).toBe('Spirit of Winter');
    // Inherited states:
    expect(shiftedInPlay.isDrying).toBe(false); // was dry
    expect(shiftedInPlay.isExerted).toBe(true); // was exerted
    expect(shiftedInPlay.damage).toBe(1); // inherited 1 damage
    expect(shiftedInPlay.shiftedOn?.length).toBe(1);
    expect(shiftedInPlay.shiftedOn?.[0].card.id).toBe('elsa_base');

    // When banished, both cards in the stack go to discard
    const banishResult = applyAction(shiftResult.state, {
      type: 'MANUAL_BANISH_CARD',
      playerId: 'player1',
      instanceId: shiftedInPlay.instanceId,
    });

    expect(banishResult.success).toBe(true);
    expect(banishResult.state.players.player1.play.length).toBe(0);
    // Discard should contain both Spirit of Winter AND base Elsa
    const discardNames = banishResult.state.players.player1.discard.map((c) => c.title || c.name);
    expect(discardNames).toContain('Spirit of Winter');
    expect(discardNames).toContain('Snow Queen');
  });

  // 2. Location: pays lore at start of turn, and character moves for moveCost
  it('TC-T12-02: Location generates passive lore at START_TURN, and characters can move for moveCost', () => {
    const prideLands = makeCard({
      id: 'loc_pridelands',
      name: 'Pride Lands',
      title: 'Pride Rock',
      type: 'Location',
      cost: 2,
      lore: 2,
      moveCost: 1,
      willpower: 7,
    });

    const simba = makeCard({
      id: 'simba_char',
      name: 'Simba',
      type: 'Character',
      cost: 2,
    });

    state.players.player1.play = [
      { instanceId: 'inst_loc', card: prideLands, isDrying: false, isExerted: false, damage: 0 },
      { instanceId: 'inst_simba', card: simba, isDrying: false, isExerted: false, damage: 0 },
    ];
    state.players.player1.deck = [makeCard({}), makeCard({})];
    state.players.player2.deck = [makeCard({}), makeCard({})];
    state.players.player1.availableInk = 3;
    state.players.player1.lore = 0;

    // Move Simba to Pride Lands (costs 1 ink)
    const moveResult = applyAction(state, {
      type: 'MOVE_TO_LOCATION',
      playerId: 'player1',
      characterInstanceId: 'inst_simba',
      locationInstanceId: 'inst_loc',
    });

    expect(moveResult.success).toBe(true);
    expect(moveResult.state.players.player1.availableInk).toBe(2);
    const movedSimba = moveResult.state.players.player1.play.find((c) => c.instanceId === 'inst_simba');
    expect(movedSimba?.atLocationId).toBe('inst_loc');

    // Passing turn to player2 and back to player1:
    // When player1 starts their turn, Pride Lands (lore 2) grants +2 lore!
    const p2Turn = applyAction(moveResult.state, { type: 'PASS_TURN', playerId: 'player1' });
    const p1Turn = applyAction(p2Turn.state, { type: 'PASS_TURN', playerId: 'player2' });

    expect(p1Turn.success).toBe(true);
    expect(p1Turn.state.players.player1.lore).toBe(2); // Pride lands generated 2 lore!
  });

  // 3. Song: Singer 5 can sing cost 5 song without paying ink
  it('TC-T12-03: Singer 5 character exerts to sing cost 5 song without paying ink', () => {
    const arielSinger = makeCard({
      id: 'ariel_singer',
      name: 'Ariel',
      title: 'Spectacular Singer',
      cost: 3,
      abilities: [
        { name: 'Singer 5', text: 'Singer 5 (This character counts as cost 5 to sing songs.)' },
      ],
    });

    const hakunaMatata = makeCard({
      id: 'song_hakuna',
      name: 'Hakuna Matata',
      type: 'Action',
      subtypes: ['Song'],
      cost: 5,
      abilities: [
        { name: 'HEAL', text: 'Remove up to 3 damage from each of your characters.' },
      ],
    });

    state.players.player1.play = [
      { instanceId: 'inst_ariel', card: arielSinger, isDrying: false, isExerted: false, damage: 0 },
    ];
    state.players.player1.hand = [hakunaMatata];
    state.players.player1.availableInk = 0; // 0 ink available!

    const singResult = applyAction(state, {
      type: 'SING_SONG',
      playerId: 'player1',
      cardId: hakunaMatata.id,
      singerInstanceIds: ['inst_ariel'],
    });

    expect(singResult.success).toBe(true);
    expect(singResult.state.players.player1.availableInk).toBe(0); // 0 ink used
    const arielInPlay = singResult.state.players.player1.play.find((c) => c.instanceId === 'inst_ariel');
    expect(arielInPlay?.isExerted).toBe(true); // Ariel exerted to sing
    expect(singResult.state.players.player1.discard.some((c) => c.name === 'Hakuna Matata')).toBe(true);
  });

  // 4. Item: Item ability is usable in the turn played (does not dry)
  it('TC-T12-04: Item ability can be activated immediately in the turn played', () => {
    const magicMirror = makeCard({
      id: 'item_mirror',
      name: 'Magic Mirror',
      type: 'Item',
      cost: 2,
      abilities: [
        { name: 'REFLECTION', text: '⟳, 4 ⬡ — Draw a card.' },
      ],
    });

    const deckCard = makeCard({ id: 'top_deck_card', name: 'Drawn Card' });
    state.players.player1.deck = [deckCard];
    state.players.player1.hand = [magicMirror];
    state.players.player1.availableInk = 6; // 2 to play + 4 to activate

    // 1. Play Item
    const playResult = applyAction(state, {
      type: 'PLAY_CARD',
      playerId: 'player1',
      cardId: magicMirror.id,
    });

    expect(playResult.success).toBe(true);
    const itemInPlay = playResult.state.players.player1.play.find((c) => c.card.name === 'Magic Mirror')!;
    expect(itemInPlay.isDrying).toBe(false); // Items do not dry!
    expect(playResult.state.players.player1.availableInk).toBe(4);

    // 2. Activate Item Ability in the same turn
    const activateResult = applyAction(playResult.state, {
      type: 'USE_ITEM_ABILITY',
      playerId: 'player1',
      itemInstanceId: itemInPlay.instanceId,
    });

    expect(activateResult.success).toBe(true);
    expect(activateResult.state.players.player1.availableInk).toBe(0); // 4 ink paid
    const updatedItem = activateResult.state.players.player1.play.find((c) => c.instanceId === itemInPlay.instanceId)!;
    expect(updatedItem.isExerted).toBe(true); // Exerted to activate
    // Card was drawn!
    expect(activateResult.state.players.player1.hand.some((c) => c.name === 'Drawn Card')).toBe(true);
  });
});
