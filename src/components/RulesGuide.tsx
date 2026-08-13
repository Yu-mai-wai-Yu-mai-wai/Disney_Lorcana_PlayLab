import React, { useState } from 'react';
import { Sparkles, BookOpen, Shield, Sword, Flame, HelpCircle, Layers, CheckCircle2, RotateCw } from 'lucide-react';

export const RulesGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'objective' | 'anatomy' | 'turn' | 'keywords'>('objective');
  const [tooltipText, setTooltipText] = useState('Click or hover over any glowing marker on the card to reveal its stat details.');

  return (
    <div className="relative z-10 pt-8 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center font-outfit select-none">
      {/* Header */}
      <header className="text-center mb-12 max-w-3xl space-y-3">
        <h1 className="font-cinzel font-black text-4xl md:text-5xl text-amber-300 tracking-wider drop-shadow-lg">
          Disney Lorcana Masterclass
        </h1>
        <p className="font-cinzel font-bold text-xl text-purple-300">Learn to Play in 5 Minutes</p>
        <p className="text-sm text-slate-300 max-w-2xl mx-auto">
          Master the arcane arts, gather Lore, and command powerful glimmers in the Great Illuminary.
        </p>
      </header>

      {/* Navigation Tabs for Masterclass */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 w-full max-w-3xl">
        {[
          { id: 'objective', label: 'Game Objective' },
          { id: 'anatomy', label: 'Card Anatomy' },
          { id: 'turn', label: 'Turn Structure' },
          { id: 'keywords', label: 'Keywords & Mechanics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-full border text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-lg shadow-amber-500/10 scale-105'
                : 'border-purple-500/20 bg-slate-950/60 text-slate-400 hover:border-purple-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="w-full max-w-4xl">
        {/* Tab 1: Game Objective */}
        {activeTab === 'objective' && (
          <div className="ether-panel rounded-2xl p-8 md:p-12 text-center border border-amber-400/30 shadow-2xl space-y-6">
            <BookOpen className="w-16 h-16 text-amber-400 mx-auto" />
            <h2 className="font-cinzel font-black text-2xl text-slate-100">The Race to 20 Lore</h2>
            <p className="text-sm text-slate-300 max-w-xl mx-auto">
              Your ultimate goal as an Illumineer is to gather Lore before your opponent. The first player to reach 20 Lore wins the game instantly!
            </p>

            {/* Lore Progress Meter */}
            <div className="relative w-full max-w-2xl mx-auto h-16 bg-slate-900 rounded-full overflow-hidden border border-purple-500/30 p-1.5 flex items-center shadow-inner">
              <div className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 rounded-full flex items-center justify-end px-5 relative lore-glow-bar" style={{ width: '75%' }}>
                <span className="font-cinzel font-black text-slate-950 text-sm z-10">15 / 20 Lore</span>
                <div className="absolute right-2 w-8 h-8 bg-white/40 rounded-full blur-md animate-pulse" />
              </div>
              <div className="absolute w-full flex justify-between px-6 pointer-events-none font-mono text-xs font-bold">
                <span className="text-slate-500">0</span>
                <span className="text-amber-300">20 GOAL</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Card Anatomy */}
        {activeTab === 'anatomy' && (
          <div className="glass-panel rounded-2xl p-8 border border-amber-400/30 shadow-2xl flex flex-col md:flex-row items-center justify-center gap-10 relative overflow-hidden">
            <div className="relative w-64 h-96 flex-shrink-0 group">
              <img
                src="https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg"
                alt="Mickey Mouse Card Anatomy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl border-2 border-amber-400 shadow-2xl"
              />

              {/* Hotspots */}
              <div
                onClick={() => setTooltipText('Ink Cost (Top-Left): The amount of Ink required from your Inkwell reserve to play this card into the play area.')}
                className="absolute top-3 left-3 w-6 h-6 rounded-full bg-amber-500 border-2 border-slate-950 shadow-lg animate-pulse cursor-pointer flex items-center justify-center text-slate-950 font-bold text-xs"
                title="Ink Cost"
              >
                1
              </div>

              <div
                onClick={() => setTooltipText('Inkwell Symbol: Gold swirl border around cost indicates this card can be placed face-down into your Inkwell to serve as permanent ink resources.')}
                className="absolute top-12 left-3 w-6 h-6 rounded-full bg-purple-500 border-2 border-slate-950 shadow-lg animate-pulse cursor-pointer flex items-center justify-center text-white font-bold text-xs"
                title="Inkwell Icon"
              >
                2
              </div>

              <div
                onClick={() => setTooltipText('Strength & Willpower (Bottom-Right): Red circle = Attack Power when challenging. Blue circle = Health points.')}
                className="absolute bottom-12 right-3 w-6 h-6 rounded-full bg-rose-500 border-2 border-slate-950 shadow-lg animate-pulse cursor-pointer flex items-center justify-center text-white font-bold text-xs"
                title="Strength & Willpower"
              >
                3
              </div>

              <div
                onClick={() => setTooltipText('Lore Diamonds (Bottom-Right): The number of Lore points gained when this character quests.')}
                className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg animate-pulse cursor-pointer flex items-center justify-center text-slate-950 font-bold text-xs"
                title="Lore Value"
              >
                4
              </div>
            </div>

            <div className="max-w-md space-y-4 text-left">
              <h2 className="font-cinzel font-black text-xl text-amber-300 border-b border-purple-500/20 pb-2">Anatomy of a Glimmer</h2>
              <p className="text-xs text-slate-300">
                Click the numbered glowing markers on the card to reveal essential stat details needed to command your characters.
              </p>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30 min-h-[90px] flex items-center justify-center text-center text-xs font-semibold text-purple-200">
                {tooltipText}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Turn Structure */}
        {activeTab === 'turn' && (
          <div className="glass-panel rounded-2xl p-8 border border-purple-500/20 shadow-2xl space-y-6">
            <h2 className="font-cinzel font-black text-xl text-amber-300 border-b border-purple-500/20 pb-3">Turn Structure Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-cinzel font-extrabold text-amber-400 text-sm">1. Beginning Phase (Ready, Set, Draw)</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Ready:</strong> Turn all your exerted cards upright to Ready status.</li>
                  <li><strong>Set:</strong> Check start-of-turn effects and abilities.</li>
                  <li><strong>Draw:</strong> Draw 1 card from your deck (except Turn 1 Player 1).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="font-cinzel font-extrabold text-amber-400 text-sm">2. Main Phase (Actions & Questing)</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Put 1 card into your Inkwell (once per turn).</li>
                  <li>Play cards from your hand by paying Ink cost.</li>
                  <li>Quest with ready characters to earn Lore!</li>
                  <li>Challenge opponent's exerted characters.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Keywords */}
        {activeTab === 'keywords' && (
          <div className="glass-panel rounded-2xl p-8 border border-purple-500/20 shadow-2xl space-y-4 text-left text-xs">
            <h2 className="font-cinzel font-black text-xl text-amber-300 border-b border-purple-500/20 pb-3">Key Mechanics & Keywords</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/20">
                <h4 className="font-cinzel font-bold text-amber-300 text-sm">Bodyguard</h4>
                <p className="text-slate-400 mt-1">An opponent must challenge Bodyguard characters first if able.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/20">
                <h4 className="font-cinzel font-bold text-amber-300 text-sm">Evasive</h4>
                <p className="text-slate-400 mt-1">Only other Evasive characters can challenge this card.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/20">
                <h4 className="font-cinzel font-bold text-amber-300 text-sm">Rush</h4>
                <p className="text-slate-400 mt-1">This character can challenge the same turn it is played.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-purple-500/20">
                <h4 className="font-cinzel font-bold text-amber-300 text-sm">Shift</h4>
                <p className="text-slate-400 mt-1">Play this card on top of one of your existing named characters for a lower ink cost.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
