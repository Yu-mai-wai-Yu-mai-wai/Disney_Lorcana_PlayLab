import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TurnPhaseBar } from '../components/board/TurnPhaseBar';
import { TargetPromptModal } from '../components/board/TargetPromptModal';
import { FieldCard } from '../components/board/FieldCard';
import type { LorcanaCard } from '../types/lorcana';
import type { GamePrompt } from '../game/types';

function makeCard(overrides: Partial<LorcanaCard> = {}): LorcanaCard {
  return {
    id: `card_${Math.random().toString(36).substring(2, 9)}`,
    name: 'Mickey Mouse - True Friend',
    cost: 3,
    inkwell: true,
    ink: 'Amber',
    type: 'Character',
    strength: 3,
    willpower: 3,
    lore: 2,
    imageUrl: 'https://example.com/mickey.png',
    abilities: [],
    ...overrides,
  };
}

describe('Board UX & Accessibility QA Suite (T13)', () => {
  // 1. Turn Phase Stepper
  it('TC-UX-01: TurnPhaseBar displays all 5 turn phases and highlights current phase', () => {
    const handlePassTurn = vi.fn();
    render(
      <TurnPhaseBar
        currentPhase="main"
        turnNumber={3}
        isMyTurn={true}
        onPassTurn={handlePassTurn}
        canPassTurn={true}
      />
    );

    // Verify turn label
    expect(screen.getByText(/TURN 3/i)).toBeInTheDocument();
    expect(screen.getByText(/YOUR TURN/i)).toBeInTheDocument();

    // Verify 5 phases are in document
    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByText('SET')).toBeInTheDocument();
    expect(screen.getByText('DRAW')).toBeInTheDocument();
    expect(screen.getByText('MAIN')).toBeInTheDocument();
    expect(screen.getByText('END')).toBeInTheDocument();

    // MAIN phase is active step
    const mainStep = screen.getByText('MAIN').closest('div');
    expect(mainStep).toHaveAttribute('aria-current', 'step');

    // Click Pass Turn
    const passButton = screen.getByRole('button', { name: /Pass Turn/i });
    fireEvent.click(passButton);
    expect(handlePassTurn).toHaveBeenCalledTimes(1);
  });

  it('TC-UX-02: TurnPhaseBar disables Pass Turn and shows engine reason when blocked', () => {
    render(
      <TurnPhaseBar
        currentPhase="main"
        turnNumber={2}
        isMyTurn={true}
        onPassTurn={vi.fn()}
        canPassTurn={false}
        passTurnDisabledReason="Maui has Reckless and must challenge"
      />
    );

    const reasonEl = screen.getByText(/Maui has Reckless and must challenge/i);
    expect(reasonEl).toBeInTheDocument();

    const passButton = screen.getByRole('button', { name: /Pass Turn/i });
    expect(passButton).toBeDisabled();
  });

  // 2. Actionable Card Highlighting & Engine Reason
  it('TC-UX-03: FieldCard highlights actionable cards with glowing border and provides engine reason tooltip', () => {
    const card = makeCard({ name: 'Simba - Protective Cub' });
    const handleQuest = vi.fn();
    const handleSelectAttacker = vi.fn();

    const { rerender } = render(
      <FieldCard
        card={card}
        isExerted={false}
        isAttacking={false}
        damageAmount={0}
        canQuestNow={true}
        questReason="Quest for +2 Lore"
        canChallengeNow={true}
        challengeReason="Challenge Exerted Opponent Card"
        onQuest={handleQuest}
        onSelectAttacker={handleSelectAttacker}
        onInspect={vi.fn()}
        onHover={vi.fn()}
        hasOpponentTargets={true}
      />
    );

    // Glowing border present on actionable card
    const cardButton = screen.getByRole('button', { name: /Simba - Protective Cub/i });
    expect(cardButton.className).toMatch(/border-amber-400/);

    // Buttons are enabled and accessible
    const questBtn = screen.getByRole('button', { name: /Quest for 2 Lore/i });
    expect(questBtn).not.toBeDisabled();
    fireEvent.click(questBtn);
    expect(handleQuest).toHaveBeenCalledTimes(1);

    // Rerender when card is exhausted / drying
    rerender(
      <FieldCard
        card={{ ...card, isWet: true }}
        isExerted={true}
        isAttacking={false}
        damageAmount={0}
        canQuestNow={false}
        questReason="Card was played this turn (ink is drying)"
        canChallengeNow={false}
        challengeReason="Cannot challenge: attacker is already exerted"
        onQuest={handleQuest}
        onSelectAttacker={handleSelectAttacker}
        onInspect={vi.fn()}
        onHover={vi.fn()}
        hasOpponentTargets={true}
      />
    );

    const disabledQuestBtn = screen.getByRole('button', {
      name: /Cannot Quest: Card was played this turn/i,
    });
    expect(disabledQuestBtn).toBeDisabled();
  });

  // 3. Accessible Keyboard Navigation
  it('TC-UX-04: FieldCard activates quest via keyboard Enter key', () => {
    const card = makeCard({ name: 'Aladdin - Hero' });
    const handleQuest = vi.fn();

    render(
      <FieldCard
        card={card}
        isExerted={false}
        isAttacking={false}
        damageAmount={0}
        canQuestNow={true}
        questReason="Quest for +2 Lore"
        canChallengeNow={false}
        onQuest={handleQuest}
        onSelectAttacker={vi.fn()}
        onInspect={vi.fn()}
        onHover={vi.fn()}
        hasOpponentTargets={false}
      />
    );

    const cardEl = screen.getByRole('button', { name: /Aladdin - Hero/i });
    fireEvent.keyDown(cardEl, { key: 'Enter', code: 'Enter' });
    expect(handleQuest).toHaveBeenCalledTimes(1);
  });

  // 4. Target Prompt Modal
  it('TC-UX-05: TargetPromptModal allows clicking on eligible target and excludes protected targets', () => {
    const target1 = makeCard({ id: 'target_1', name: 'Gaston - Bully', strength: 2 });
    const target2 = makeCard({ id: 'target_2', name: 'Ward Beast', strength: 4 });
    const prompt: GamePrompt = {
      id: 'prompt_123',
      type: 'CHOOSE_TARGET',
      playerId: 'player1',
      message: 'Choose opposing character with 2 strength or less',
      validTargetIds: ['target_1'], // target_2 is filtered out!
      effectPayload: {
        actionType: 'TRIGGER_ABILITY',
        abilityName: 'Dragon Breath',
        effectType: 'banish_chosen',
      },
    };

    const handleSelectTarget = vi.fn();
    render(
      <TargetPromptModal
        prompt={prompt}
        fieldCards={[]}
        opponentFieldCards={[target1, target2]}
        onSelectTarget={handleSelectTarget}
      />
    );

    expect(screen.getByText(/Choose opposing character with 2 strength or less/i)).toBeInTheDocument();
    // target1 is shown as eligible
    expect(screen.getByText('Gaston - Bully')).toBeInTheDocument();
    // target2 is not in the valid options
    expect(screen.queryByText('Ward Beast')).not.toBeInTheDocument();

    // Clicking target1 invokes handler
    fireEvent.click(screen.getByText('Gaston - Bully'));
    expect(handleSelectTarget).toHaveBeenCalledWith('target_1');
  });
});
