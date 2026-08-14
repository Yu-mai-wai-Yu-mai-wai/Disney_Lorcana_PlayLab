const fs = require('fs');
const file = 'D:/Tawanagent/TAWAN-OS/02_STUDY/2026-Semester/Cloud_Computing/Cloud_Project/DISNEY_LORCANA_PLAYLAB_CLOUD/src/components/LorcanaBoard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports and Types
content = content.replace(
  /interface LorcanaCard \{[\s\S]*?isWet\?: boolean;\n\}/,
  `import { fetchCardPool, STARTER_POOL, type PoolCard } from '../data/cardPool';\n\nexport type LorcanaCard = PoolCard & { isWet?: boolean };`
);

// 2. States
content = content.replace(
  /const \[turnNumber, setTurnNumber\] = useState\(4\);\n  const \[isMyTurn, setIsMyTurn\] = useState\(true\);/,
  `const [turnNumber, setTurnNumber] = useState(4);\n  const [isMyTurn, setIsMyTurn] = useState(true);\n  const [cardPool, setCardPool] = useState<LorcanaCard[]>([]);\n  const [damage, setDamage] = useState<Record<string, number>>({});\n  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);\n  const [turnPhase, setTurnPhase] = useState<'beginning' | 'main' | 'end'>('beginning');\n  \n  React.useEffect(() => {\n    fetchCardPool().then(pool => setCardPool(pool));\n  }, []);`
);

// 3. handCards
content = content.replace(
  /const \[handCards, setHandCards\] = useState<LorcanaCard\[\]>\(\[[\s\S]*?\}\,\n  \]\);/,
  `const [handCards, setHandCards] = useState<LorcanaCard[]>(STARTER_POOL);`
);

// 4. fieldCards
content = content.replace(
  /const \[fieldCards, setFieldCards\] = useState<LorcanaCard\[\]>\(\[[\s\S]*?isWet: false,\n    \},\n  \]\);/,
  `const [fieldCards, setFieldCards] = useState<LorcanaCard[]>([]);\n  \n  const [opponentFieldCards, setOpponentFieldCards] = useState<LorcanaCard[]>([\n    {\n      id: 'opp-1', name: 'Maleficent', title: 'Monstrous Dragon', cost: 9, strength: 7, willpower: 5, lore: 2, isInkable: true, type: 'character', ink: 'Ruby', img: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg',\n    } as any,\n    {\n      id: 'opp-2', name: 'Aladdin', title: 'Heroic Outlaw', cost: 7, strength: 5, willpower: 5, lore: 2, isInkable: true, type: 'character', ink: 'Ruby', img: 'https://api.lorcana.ravensburger.com/images/en/set1/69_567caacf82f67ff08587b6ded1c7ebeb1f77a196.jpg',\n    } as any\n  ]);\n  const [opponentExerted, setOpponentExerted] = useState<Record<string, boolean>>({'opp-1': true});`
);

// 5. handlePlayCard & abilities
content = content.replace(
  /const handlePlayCard = \(card: LorcanaCard\) => \{[\s\S]*?return true;\n  \};/,
  `const resolveAbilities = (card: LorcanaCard) => {\n    if (!card.abilities) return;\n    card.abilities.forEach(ability => {\n      const text = ability.text.toLowerCase();\n      if (/draw a card/.test(text)) {\n        handleDrawCard();\n      }\n      const loreMatch = text.match(/gain (\\d+) lore/);\n      if (loreMatch) {\n        setPlayerLore(prev => Math.min(20, prev + parseInt(loreMatch[1])));\n      }\n      if (/banish chosen (opposing )?character/.test(text)) {\n        setOpponentFieldCards(prev => {\n          if (prev.length > 0) {\n            setLogMessages(logs => [\`\${card.name} banished \${prev[0].name}!\`, ...logs]);\n            return prev.slice(1);\n          }\n          return prev;\n        });\n      }\n      const dmgMatch = text.match(/deal (\\d+) damage to each opposing character/);\n      if (dmgMatch) {\n        const dmg = parseInt(dmgMatch[1]);\n        setOpponentFieldCards(prev => {\n          const next: LorcanaCard[] = [];\n          setDamage(d => {\n            const nd = { ...d };\n            prev.forEach(op => {\n              nd[op.id] = (nd[op.id] || 0) + dmg;\n              if (nd[op.id] >= (op.willpower || 0)) {\n                setLogMessages(logs => [\`Opponent's \${op.name} was banished by \${card.name}!\`, ...logs]);\n              } else {\n                next.push(op);\n              }\n            });\n            return nd;\n          });\n          return next;\n        });\n      }\n      const exertMatch = text.match(/exert up to (\\d+) chosen characters/);\n      if (exertMatch) {\n        setOpponentExerted(prev => {\n          const next = { ...prev };\n          opponentFieldCards.slice(0, parseInt(exertMatch[1])).forEach(op => {\n            next[op.id] = true;\n          });\n          return next;\n        });\n      }\n    });\n  };\n\n  const handlePlayCard = (card: LorcanaCard) => {\n    if (availableInk < card.cost) {\n      showNotice(\`Not enough Inkwell! Requires \${card.cost} Ink, but you have \${availableInk} ready.\`, 'warning');\n      return false;\n    }\n\n    setAvailableInk((prev) => prev - card.cost);\n    setHandCards((prev) => prev.filter((c) => c.id !== card.id));\n    setSelectedHandCard(null);\n\n    if (card.type === 'action' || card.type === 'song' || card.type === 'item') {\n      setDiscardCount((prev) => prev + 1);\n      setLogMessages((prev) => [\`You played \${card.type.toUpperCase()}: \${card.name}! (Sent to Discard Pile)\`, ...prev]);\n      showNotice(\`Cast Action "\${card.name}"! (\${card.cost} Ink used, sent to Discard)\`, 'success');\n      resolveAbilities(card);\n    } else {\n      const newFieldCard = { ...card, isWet: true };\n      setFieldCards((prev) => [...prev, newFieldCard]);\n      setLogMessages((prev) => [\`You cast Character: \${card.name} (\${card.title}) onto the battlefield!\`, ...prev]);\n      showNotice(\`Played \${card.name} onto field! (\${card.cost} Ink used)\`, 'success');\n      webSocketService.sendAction('CARD_MOVED', { cardId: card.id, position: { x: 50, y: 50, zone: 'field' } });\n      resolveAbilities(card);\n    }\n    return true;\n  };`
);

// 6. handleDrawCard
content = content.replace(
  /const handleDrawCard = \(\) => \{[\s\S]*?showNotice\(\`Drew "\$\{drawn\.name\}" from Deck!\`, 'success'\);\n  \};/,
  `const handleDrawCard = () => {\n    if (deckCount <= 0) {\n      showNotice(\`Deck is empty! Cannot draw more cards.\`, 'error');\n      return;\n    }\n    if (handCards.length >= 7) {\n      showNotice(\`Hand is full (Max 7 cards)!\`, 'warning');\n      return;\n    }\n\n    const available = cardPool.filter(c => !handCards.some(hc => hc.id === c.id) && !fieldCards.some(fc => fc.id === c.id));\n    if (available.length === 0) {\n       showNotice('No more unique cards in pool!', 'error');\n       return;\n    }\n    const drawn = available[Math.floor(Math.random() * available.length)];\n    \n    setDeckCount((prev) => prev - 1);\n    setHandCards((prev) => [...prev, drawn]);\n    setLogMessages((prev) => [\`You drew \${drawn.name} from your deck.\`, ...prev]);\n    showNotice(\`Drew "\${drawn.name}" from Deck!\`, 'success');\n  };`
);

// 7. handleEndTurn & handleStartTurn
content = content.replace(
  /const handleEndTurn = \(\) => \{[\s\S]*?\}, 1000\);\n  \};/,
  `const handleEndTurn = () => {\n    setIsMyTurn(false);\n    showNotice(\`Ending Turn \${turnNumber}... Opponent is playing.\`, 'warning');\n\n    setTimeout(() => {\n      setOpponentLore((prev) => Math.min(20, prev + 1));\n      setLogMessages((prev) => [\`Opponent completed their turn and gained 1 Lore.\`, ...prev]);\n      \n      setTimeout(() => {\n        handleStartTurn();\n      }, 1200);\n    }, 1000);\n  };\n\n  const handleStartTurn = () => {\n    setTurnPhase('beginning');\n    setExertedCards({});\n    setFieldCards(prev => prev.map(c => ({ ...c, isWet: false })));\n    setHasInkedThisTurn(false);\n    setAvailableInk(inkwellCapacity);\n    setTurnNumber(prev => prev + 1);\n    setIsMyTurn(true);\n    setLogMessages(prev => [\`Turn \${turnNumber + 1} started!\`, ...prev]);\n    showNotice(\`Turn \${turnNumber + 1} Started!\`, 'success');\n    handleDrawCard();\n    setTurnPhase('main');\n  };`
);

// 8. Challenge handler and render mechanics
content = content.replace(
  /const toggleExert = \(id: string\) => \{/,
  `const handleAttackTarget = (target: LorcanaCard) => {\n    if (!selectedAttacker) return;\n    const attacker = fieldCards.find(c => c.id === selectedAttacker);\n    if (!attacker) return;\n    \n    const attackerDmg = target.strength || 0;\n    const targetDmg = attacker.strength || 0;\n    \n    let newAttackerDamage = (damage[attacker.id] || 0) + attackerDmg;\n    let newTargetDamage = (damage[target.id] || 0) + targetDmg;\n    \n    const newDamage = { ...damage, [attacker.id]: newAttackerDamage, [target.id]: newTargetDamage };\n    \n    const attackerBanished = newAttackerDamage >= (attacker.willpower || 0);\n    const targetBanished = newTargetDamage >= (target.willpower || 0);\n    \n    if (attackerBanished) {\n       setFieldCards(prev => prev.filter(c => c.id !== attacker.id));\n       setDiscardCount(prev => prev + 1);\n       setLogMessages(prev => [\`\${attacker.name} was banished in challenge!\`, ...prev]);\n    } else {\n       setDamage(prev => ({ ...prev, [attacker.id]: newAttackerDamage }));\n       setExertedCards(prev => ({ ...prev, [attacker.id]: true }));\n    }\n    \n    if (targetBanished) {\n       setOpponentFieldCards(prev => prev.filter(c => c.id !== target.id));\n       setLogMessages(prev => [\`Opponent's \${target.name} was banished in challenge!\`, ...prev]);\n    } else {\n       setDamage(prev => ({ ...prev, [target.id]: newTargetDamage }));\n    }\n    setSelectedAttacker(null);\n  };\n\n  const toggleExert = (id: string) => {`
);

// 9. Opponent Battlefield Render
content = content.replace(
  /\{\/\* 1\. OPPONENT BATTLEFIELD ZONE \*\/\}([\s\S]*?)<div className="flex items-center justify-center gap-12 w-full h-full max-h-56">[\s\S]*?<\/div>\n          <\/div>/,
  `{/* 1. OPPONENT BATTLEFIELD ZONE */}\n          <div className="flex-1 flex flex-col justify-center items-center py-1 border-b border-[#30363d]/40 min-h-0">\n            <div className="text-[9px] font-cinzel font-bold text-[#F59E0B]/70 mb-1 uppercase tracking-widest">\n              Opponent Battlefield\n            </div>\n            <div className="flex items-center justify-center gap-12 w-full h-full max-h-56">\n              {opponentFieldCards.map(op => {\n                const isExerted = opponentExerted[op.id] || false;\n                const dmg = damage[op.id] || 0;\n                return (\n                  <motion.div\n                    key={op.id}\n                    layout\n                    animate={{ rotate: isExerted ? 90 : 0 }}\n                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}\n                    onClick={() => selectedAttacker && handleAttackTarget(op)}\n                    className={\`w-36 h-50 bg-[#141a26] rounded-xl flex items-center justify-center relative overflow-hidden border \${selectedAttacker ? 'border-rose-500 cursor-crosshair shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'border-[#30363d]'}\`}\n                  >\n                    <img\n                      src={op.img}\n                      alt={op.name}\n                      referrerPolicy="no-referrer"\n                      className="w-full h-full object-cover opacity-60"\n                    />\n                    <span className={\`absolute bottom-1 bg-[#0B0F19]/90 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border \${isExerted ? 'text-[#F59E0B] border-[#30363d]' : 'text-emerald-400 border-emerald-500/40'}\`}>\n                      {isExerted ? 'Exerted' : 'Ready'}\n                    </span>\n                    {dmg > 0 && (\n                      <span className="absolute top-1 right-1 bg-rose-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-rose-800 z-30">\n                        {dmg} Dmg\n                      </span>\n                    )}\n                  </motion.div>\n                );\n              })}\n            </div>\n          </div>`
);

// 10. Player Battlefield Render - Challenge Button & Damage
content = content.replace(
  /\{\!card\.isWet && \([\s\S]*?\}\)/,
  `{!card.isWet && (\n                      <div className="absolute top-1 right-1 flex flex-col gap-1 z-20">\n                        <button\n                          onClick={(e) => {\n                            e.stopPropagation();\n                            handleQuest(card);\n                          }}\n                          disabled={isExerted}\n                          aria-label="Quest"\n                          className="bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-black p-1 rounded-full transition-colors cursor-pointer font-bold text-[9px] flex items-center justify-center"\n                          title={\`Quest for +\${card.lore || 1} Lore\`}\n                        >\n                          <Zap className="w-3 h-3 fill-black" />\n                        </button>\n                        {opponentFieldCards.length > 0 && (\n                          <button\n                            onClick={(e) => {\n                              e.stopPropagation();\n                              setSelectedAttacker(card.id);\n                            }}\n                            className={\`p-1 rounded-full transition-colors cursor-pointer flex items-center justify-center \${selectedAttacker === card.id ? 'bg-rose-500 text-white' : 'bg-rose-900/80 hover:bg-rose-600 text-rose-200'}\`}\n                            title="Challenge Opponent"\n                          >\n                            <Sword className="w-3 h-3" />\n                          </button>\n                        )}\n                      </div>\n                    )}`
);

content = content.replace(
  /<\/div>\n                  <\/motion\.div>/,
  `</div>\n                    {(damage[card.id] || 0) > 0 && (\n                      <span className="absolute top-1 left-1 bg-rose-600/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-rose-800 z-30">\n                        {(damage[card.id] || 0)} Dmg\n                      </span>\n                    )}\n                  </motion.div>`
);

// 11. Start Turn Button
content = content.replace(
  /<motion\.button\n            whileHover=\{\{ scale: 1\.02 \}\}\n            whileTap=\{\{ scale: 0\.98 \}\}\n            transition=\{\{ type: 'spring', stiffness: 350, damping: 25 \}\}\n            onClick=\{handleEndTurn\}/,
  `<motion.button\n            whileHover={{ scale: 1.02 }}\n            whileTap={{ scale: 0.98 }}\n            transition={{ type: 'spring', stiffness: 350, damping: 25 }}\n            onClick={handleStartTurn}\n            disabled={!isMyTurn}\n            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"\n          >\n            <Play className="w-3.5 h-3.5 fill-white" />\n            <span>Start Turn</span>\n          </motion.button>\n          <motion.button\n            whileHover={{ scale: 1.02 }}\n            whileTap={{ scale: 0.98 }}\n            transition={{ type: 'spring', stiffness: 350, damping: 25 }}\n            onClick={handleEndTurn}`
);

// 12. Non-inkable missing add to inkwell button (Already there disabled=!selectedHandCard.isInkable || hasInkedThisTurn)

fs.writeFileSync(file, content);
console.log('Update script executed.');
