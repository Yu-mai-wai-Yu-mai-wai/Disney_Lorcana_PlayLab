import re

with open('src/components/LorcanaBoard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

original_len = len(content.splitlines())
print(f"Original lines: {original_len}")

# 1. Remove WebSocket useEffects (from "// Sync service params on mount / changes" to end of duplicate showNotice)
ws_pattern = re.compile(
    r'[ \t]*// Sync service params on mount / changes\s+React\.useEffect\(\(\) => \{.+?'
    r'const showNotice = \(msg: string, type: \'success\' \| \'warning\' \| \'error\'\) => \{\s+setNotice\(\{ msg, type \}\);\s+setTimeout\(\(\) => setNotice\(null\), 3500\);\s+\};\n',
    re.DOTALL
)
m = ws_pattern.search(content)
if not m:
    print("ERROR: ws_pattern not found!")
    exit(1)
content = ws_pattern.sub('', content, count=1)
print(f"After removing WebSocket useEffects: {len(content.splitlines())} lines")

# 2. Add useLorcanaWebSocket call right before "return ("
target_before_return = "    // === MAIN PHASE ===\n    setTurnPhase('main');\n  };"
replacement_before_return = """    // === MAIN PHASE ===
    setTurnPhase('main');
  };

  // Synchronized WebSocket event listeners, auto-sync, and reconnect handling
  useLorcanaWebSocket({
    matchMode,
    roomId,
    playerRole,
    myUsername,
    opponentName,
    isRejoin,
    token,
    savedBoard,
    boardStateRef,
    turnNumberRef,
    playerRoleRef,
    awaitingSyncRef,
    disconnectTimerRef,
    undoTimerRef,
    matchReportedRef,
    playerLore,
    opponentLore,
    fieldCards,
    setPlayerLore,
    setOpponentLore,
    setAvailableInk,
    setInkwellCapacity,
    setOpponentInk,
    setOpponentInkCapacity,
    setTurnNumber,
    setIsMyTurn,
    setOpponentFieldCards,
    setFieldCards,
    setDamage,
    setOpponentExerted,
    setOpponentDeckCount,
    setOpponentDiscardCount,
    setDiscardCount,
    setAbilityAlerts,
    setLogMessages,
    setGameOverData,
    setOpponentName,
    setIsOpponentDisconnected,
    setDisconnectCountdown,
    setOpponentLeftName,
    setIncomingUndoRequest,
    setUndoVoteTimer,
    setIsUndoPending,
    setPreviousSnapshot,
    setUndoCountRemaining,
    setChatMessages,
    setUnreadChatCount,
    showNotice,
    resetGameBoard,
    handleStartTurn,
    applySnapshot,
    handleRespondUndoVote,
  });"""

if target_before_return not in content:
    print("ERROR: target_before_return not found!")
    exit(1)
content = content.replace(target_before_return, replacement_before_return, 1)

# 3. Replace Left Sidebar
left_sidebar_pattern = re.compile(
    r'[ \t]*\{/\* LEFT SIDEBAR: DEDICATED INKWELL, DECK & DISCARD ZONES.+?</aside>',
    re.DOTALL
)
sidebar_replacement = """      {/* LEFT SIDEBAR: DEDICATED INKWELL, DECK & DISCARD ZONES */}
      <InkwellSidebar
        isDraggingOverInkwell={isDraggingOverInkwell}
        opponentDeckCount={opponentDeckCount}
        opponentDiscardCount={opponentDiscardCount}
        availableInk={availableInk}
        inkwellCapacity={inkwellCapacity}
        hasInkedThisTurn={hasInkedThisTurn}
        deckCount={deckCount}
        discardCount={discardCount}
        onDeckClick={handleDeckClick}
      />"""
if not left_sidebar_pattern.search(content):
    print("ERROR: left_sidebar_pattern not found!")
    exit(1)
content = left_sidebar_pattern.sub(sidebar_replacement, content, count=1)
print(f"After Left Sidebar replacement: {len(content.splitlines())} lines")

# 4. Replace Top Status Bar
top_bar_pattern = re.compile(
    r'[ \t]*\{/\* TOP STATUS HEADER BAR \*/\}[ \t]*\n[ \t]*<div className="flex flex-wrap justify-between items-center.+?\{/\* BATTLEFIELD CONTAINERS',
    re.DOTALL
)
top_bar_replacement = """        {/* TOP STATUS HEADER BAR */}
        <BoardTopBar
          inkwellCapacity={inkwellCapacity}
          deckCount={deckCount}
          discardCount={discardCount}
          opponentLore={opponentLore}
          opponentInk={opponentInk}
          opponentInkCapacity={opponentInkCapacity}
          turnNumber={turnNumber}
          turnPhase={turnPhase}
          onExitMatch={onExitMatch}
          language={language}
          toggleLanguage={toggleLanguage}
          onOpenPlaymat={() => setIsPlaymatModalOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* BATTLEFIELD CONTAINERS"""
if not top_bar_pattern.search(content):
    print("ERROR: top_bar_pattern not found!")
    exit(1)
content = top_bar_pattern.sub(top_bar_replacement, content, count=1)
print(f"After Top Bar replacement: {len(content.splitlines())} lines")

# 5. Replace Opponent Battlefield
opp_field_pattern = re.compile(
    r'[ \t]*\{/\* 1\. OPPONENT BATTLEFIELD ZONE \*/\}[ \t]*\n[ \t]*<div className="flex-1 flex flex-col justify-center items-center py-1 border-b border-\[#30363d\]/40 min-h-0">.+?\{/\* 2\. PLAYER BATTLEFIELD ZONE \*/\}',
    re.DOTALL
)
opp_field_replacement = """          {/* 1. OPPONENT BATTLEFIELD ZONE */}
          <OpponentBattlefield
            opponentFieldCards={opponentFieldCards}
            matchMode={matchMode}
            opponentExerted={opponentExerted}
            damage={damage}
            selectedAttacker={selectedAttacker}
            onAttackTarget={handleAttackTarget}
            onInspectCard={(c) => setPinnedCard(c)}
            onHoverCard={(c) => setHoveredCard(c)}
          />

          {/* 2. PLAYER BATTLEFIELD ZONE */}"""
if not opp_field_pattern.search(content):
    print("ERROR: opp_field_pattern not found!")
    exit(1)
content = opp_field_pattern.sub(opp_field_replacement, content, count=1)
print(f"After Opponent Battlefield replacement: {len(content.splitlines())} lines")

# 6. Replace Player Battlefield
player_field_pattern = re.compile(
    r'[ \t]*\{/\* 2\. PLAYER BATTLEFIELD ZONE \*/\}[ \t]*\n[ \t]*<div className="flex-1 flex flex-col justify-center items-center py-1 relative min-h-0">.+?\{/\* PLAYER LORE & PASS TURN CONTROLS BAR',
    re.DOTALL
)
player_field_replacement = """          {/* 2. PLAYER BATTLEFIELD ZONE */}
          <PlayerBattlefield
            isDraggingCard={isDraggingCard}
            fieldCards={fieldCards}
            opponentFieldCards={opponentFieldCards}
            exertedCards={exertedCards}
            damage={damage}
            selectedAttacker={selectedAttacker}
            onCardInteraction={(card) => {
              if (card.isWet) {
                showNotice(`"${card.name}" is drying ink (wet). It cannot Quest or Challenge until your next turn.`, 'warning');
                return;
              }
              if (exertedCards[card.id]) {
                showNotice(`"${card.name}" is already exerted (exhausted). It will ready at the start of your turn.`, 'warning');
                return;
              }
              if (selectedAttacker === card.id) {
                setSelectedAttacker(null);
              } else {
                setSelectedAttacker(card.id);
                showNotice(`"${card.name}" selected! Click an exerted opponent character to Challenge, or click ⚡ to Quest.`, 'success');
              }
            }}
            onQuest={handleQuest}
            onSelectAttackerToggle={(cardId) => {
              if (selectedAttacker === cardId) {
                setSelectedAttacker(null);
              } else {
                setSelectedAttacker(cardId);
                showNotice(`Select an exerted opponent's character to challenge!`, 'warning');
              }
            }}
            onInspectCard={(c) => setPinnedCard(c)}
            onHoverCard={(c) => setHoveredCard(c)}
          />
        </div>

        {/* PLAYER LORE & PASS TURN CONTROLS BAR"""
if not player_field_pattern.search(content):
    print("ERROR: player_field_pattern not found!")
    exit(1)
content = player_field_pattern.sub(player_field_replacement, content, count=1)
print(f"After Player Battlefield replacement: {len(content.splitlines())} lines")

# 7. Replace Player Controls Bar
controls_pattern = re.compile(
    r'[ \t]*\{/\* PLAYER LORE & PASS TURN CONTROLS BAR \(IN-FLOW\) \*/\}[ \t]*\n[ \t]*<div className=\{`w-full flex justify-between items-center z-20 py-2 px-4 border rounded-xl shrink-0 transition-all duration-300 bg-\[#141a26\].+?\{/\* MULLIGAN OVERLAY MODAL \*/\}',
    re.DOTALL
)
controls_replacement = """        {/* PLAYER LORE & PASS TURN CONTROLS BAR */}
        <PlayerControlsBar
          playerLore={playerLore}
          isMyTurn={isMyTurn}
          previousSnapshot={previousSnapshot}
          undoCountRemaining={undoCountRemaining}
          isUndoPending={isUndoPending}
          onRequestUndo={handleRequestUndo}
          turnNumber={turnNumber}
          hasMulliganed={hasMulliganed}
          onOpenMulligan={() => setIsMulliganPhase(true)}
          matchMode={matchMode}
          onEndTurn={handleEndTurn}
          onStartTurn={() => handleStartTurn()}
          language={language}
          passTurnText={t.passTurn}
          opponentTurnText={t.opponentTurn}
        />

      </div>

      {/* MULLIGAN OVERLAY MODAL */}"""
if not controls_pattern.search(content):
    print("ERROR: controls_pattern not found!")
    exit(1)
content = controls_pattern.sub(controls_replacement, content, count=1)
print(f"After Controls replacement: {len(content.splitlines())} lines")

# 8. Replace Hand Dock
hand_dock_pattern = re.compile(
    r'[ \t]*\{/\* SPEC 3 — HAND DOCK: HOVER TAB AT BOTTOM.+?\{/\* CARD INSPECTOR MODAL & HOVER GLANCE \*/\}',
    re.DOTALL
)
hand_dock_replacement = """      {/* HAND DOCK */}
      <HandTrayDock
        isHandOpen={isHandOpen}
        onToggleHand={() => setIsHandOpen((prev) => !prev)}
        onMouseEnter={handleHandMouseEnter}
        onMouseLeave={handleHandMouseLeave}
        handCards={handCards}
        language={language}
        onDragStart={() => setIsDraggingCard(true)}
        onDragEnd={handleDragEnd}
        onSelectHandCard={(c) => setSelectedHandCard(c)}
        onInspectCard={(c) => setPinnedCard(c)}
        onHoverCard={(c) => setHoveredCard(c)}
      />

      {/* CARD INSPECTOR MODAL & HOVER GLANCE */}"""
if not hand_dock_pattern.search(content):
    print("ERROR: hand_dock_pattern not found!")
    exit(1)
content = hand_dock_pattern.sub(hand_dock_replacement, content, count=1)
print(f"After Hand Dock replacement: {len(content.splitlines())} lines")

# 9. Replace Action Log Sidebar
log_sidebar_pattern = re.compile(
    r'[ \t]*\{/\* RIGHT SIDEBAR: ACTION LOG \*/\}[ \t]*\n[ \t]*<AnimatePresence>.+?\{/\* CHAT IN-GAME \*/\}',
    re.DOTALL
)
log_sidebar_replacement = """      {/* RIGHT SIDEBAR: ACTION LOG */}
      <ActionLogSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        logMessages={logMessages}
      />

      {/* CHAT IN-GAME */}"""
if not log_sidebar_pattern.search(content):
    print("ERROR: log_sidebar_pattern not found!")
    exit(1)
content = log_sidebar_pattern.sub(log_sidebar_replacement, content, count=1)
print(f"After Action Log Sidebar replacement: {len(content.splitlines())} lines")

# 10. Replace Undo & Disconnect Overlays
overlays_pattern = re.compile(
    r'[ \t]*\{/\* UNDO / RETURN VOTE PROMPT MODAL \(FOR OPPONENT\) \*/\}[ \t]*\n[ \t]*<AnimatePresence>.+?\{/\* GAME OVER / VICTORY / DEFEAT POPUP MODAL \*/\}',
    re.DOTALL
)
overlays_replacement = """      {/* UNDO VOTE MODAL */}
      <UndoVoteModal
        incomingUndoRequest={incomingUndoRequest}
        undoVoteTimer={undoVoteTimer}
        language={language}
        onRespond={handleRespondUndoVote}
      />

      {/* OPPONENT DISCONNECTED & LEFT OVERLAYS */}
      <OpponentDisconnectOverlay
        isOpponentDisconnected={isOpponentDisconnected}
        disconnectCountdown={disconnectCountdown}
        opponentLeftName={opponentLeftName}
        language={language}
        onExitMatch={onExitMatch}
        onReturnToLobby={onReturnToLobby}
      />

      {/* GAME OVER / VICTORY / DEFEAT POPUP MODAL */}"""
if not overlays_pattern.search(content):
    print("ERROR: overlays_pattern not found!")
    exit(1)
content = overlays_pattern.sub(overlays_replacement, content, count=1)
print(f"After Overlays replacement: {len(content.splitlines())} lines")

final_len = len(content.splitlines())
print(f"FINAL line count: {final_len}")

with open('src/components/LorcanaBoard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully wrote updated src/components/LorcanaBoard.tsx!")
