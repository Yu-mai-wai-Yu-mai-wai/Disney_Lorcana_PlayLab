import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';

type GuideTab = 'objective' | 'anatomy' | 'turn' | 'keywords';

const TABS: { id: GuideTab; label: string }[] = [
  { id: 'objective', label: 'Game Objective' },
  { id: 'anatomy', label: 'Card Anatomy' },
  { id: 'turn', label: 'Turn Structure' },
  { id: 'keywords', label: 'Keywords & Mechanics' },
];

export const RulesGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GuideTab>('objective');
  const [tooltipText, setTooltipText] = useState('Click or hover over any marker on the card to reveal its stat details.');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tabIds: GuideTab[] = ['objective', 'anatomy', 'turn', 'keywords'];
      const currentIndex = tabIds.indexOf(activeTab);
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setActiveTab(tabIds[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < tabIds.length - 1) {
          setActiveTab(tabIds[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="relative z-10 pt-8 pb-16 px-6 max-w-6xl mx-auto flex flex-col items-center font-outfit select-none bg-[#0B0F19]">
      {/* Header */}
      <header className="text-center mb-10 max-w-3xl space-y-3 bg-[#141a26] p-8 rounded-xl border border-[#30363d] w-full">
        <h1 className="font-cinzel font-bold text-3xl md:text-4xl text-[#F1F5F9] tracking-wider">
          Disney Lorcana Masterclass
        </h1>
        <p className="font-cinzel font-bold text-lg text-[#F59E0B]">Learn to Play in 5 Minutes</p>
        <p className="text-sm text-[#94A3B8] max-w-2xl mx-auto">
          Master the arcane arts, gather Lore, and command powerful glimmers in the Great Illuminary.
        </p>
      </header>

      {/* Navigation Tabs for Masterclass */}
      <div className="flex flex-wrap justify-center gap-2.5 mb-8 w-full max-w-3xl">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#242b3d] border-[#F59E0B] text-[#F59E0B]'
                : 'border-[#30363d] bg-[#0B0F19] text-[#94A3B8] hover:border-[#F59E0B] hover:text-[#F1F5F9]'
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
          <div className="bg-[#141a26] rounded-xl p-8 md:p-12 text-center border border-[#30363d] space-y-6">
            <BookOpen className="w-12 h-12 text-[#F59E0B] mx-auto" />
            <h2 className="font-cinzel font-bold text-2xl text-[#F1F5F9]">The Race to 20 Lore</h2>
            <p className="text-sm text-[#94A3B8] max-w-xl mx-auto">
              Your ultimate goal as an Illumineer is to gather Lore before your opponent. The first player to reach 20 Lore wins the game instantly!
            </p>

            {/* Lore Progress Meter */}
            <div className="relative w-full max-w-2xl mx-auto h-12 bg-[#0B0F19] rounded-lg overflow-hidden border border-[#30363d] p-1 flex items-center">
              <div className="h-full bg-[#F59E0B] rounded flex items-center justify-end px-4 relative" style={{ width: '75%' }}>
                <span className="font-cinzel font-bold text-black text-xs">15 / 20 Lore</span>
              </div>
              <div className="absolute w-full flex justify-between px-6 pointer-events-none font-mono text-xs font-bold">
                <span className="text-[#94A3B8]">0</span>
                <span className="text-[#F59E0B]">20 GOAL</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Card Anatomy */}
        {activeTab === 'anatomy' && (
          <div className="bg-[#141a26] rounded-xl p-8 border border-[#30363d] flex flex-col md:flex-row items-center justify-center gap-10 relative overflow-hidden">
            <div className="relative w-64 h-96 flex-shrink-0 group">
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-[#0B0F19] border border-[#30363d] rounded-xl flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                  <span className="font-cinzel text-sm font-bold text-[#F59E0B]">Mickey Mouse</span>
                  <span className="text-[10px] text-[#94A3B8] font-mono mt-1">Image unavailable</span>
                </div>
                <img
                  src="https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg"
                  alt="Mickey Mouse Card Anatomy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover rounded-xl border border-[#30363d] relative z-10"
                />
              </div>

              {/* Hotspots */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setTooltipText('Ink Cost (Top-Left): The amount of Ink required from your Inkwell reserve to play this card into the play area.')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTooltipText('Ink Cost (Top-Left): The amount of Ink required from your Inkwell reserve to play this card into the play area.');
                  }
                }}
                className="absolute top-3 left-3 w-6 h-6 rounded-full bg-[#F59E0B] border-2 border-black cursor-pointer flex items-center justify-center text-black font-bold text-xs z-20"
                title="Ink Cost"
              >
                1
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setTooltipText('Inkwell Symbol: Gold swirl border around cost indicates this card can be placed face-down into your Inkwell to serve as permanent ink resources.')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTooltipText('Inkwell Symbol: Gold swirl border around cost indicates this card can be placed face-down into your Inkwell to serve as permanent ink resources.');
                  }
                }}
                className="absolute top-12 left-3 w-6 h-6 rounded-full bg-purple-500 border-2 border-black cursor-pointer flex items-center justify-center text-white font-bold text-xs z-20"
                title="Inkwell Icon"
              >
                2
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setTooltipText('Strength & Willpower (Bottom-Right): Red circle = Attack Power when challenging. Blue circle = Health points.')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTooltipText('Strength & Willpower (Bottom-Right): Red circle = Attack Power when challenging. Blue circle = Health points.');
                  }
                }}
                className="absolute bottom-12 right-3 w-6 h-6 rounded-full bg-rose-500 border-2 border-black cursor-pointer flex items-center justify-center text-white font-bold text-xs z-20"
                title="Strength & Willpower"
              >
                3
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => setTooltipText('Lore Value (Bottom-Right): The number of Lore points gained when this character quests.')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTooltipText('Lore Value (Bottom-Right): The number of Lore points gained when this character quests.');
                  }
                }}
                className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-[#F59E0B] border-2 border-black cursor-pointer flex items-center justify-center text-black font-bold text-xs z-20"
                title="Lore Value"
              >
                4
              </div>
            </div>

            <div className="max-w-md space-y-4 text-left">
              <h2 className="font-cinzel font-bold text-xl text-[#F59E0B] border-b border-[#30363d] pb-2">Anatomy of a Glimmer</h2>
              <p className="text-xs text-[#94A3B8]">
                Click the numbered markers on the card to reveal essential stat details needed to command your characters.
              </p>
              <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#30363d] min-h-[80px] flex items-center justify-center text-center text-xs font-semibold text-[#F1F5F9]">
                {tooltipText}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Turn Structure */}
        {activeTab === 'turn' && (
          <div className="bg-[#141a26] rounded-xl p-8 border border-[#30363d] space-y-6">
            <h2 className="font-cinzel font-bold text-xl text-[#F59E0B] border-b border-[#30363d] pb-3">Turn Structure Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-xs">
              <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#30363d] space-y-2">
                <div className="font-cinzel font-bold text-[#F59E0B] text-sm">1. Beginning Phase (Ready, Set, Draw)</div>
                <ul className="list-disc list-inside space-y-1 text-[#94A3B8]">
                  <li><strong>Ready:</strong> Turn all your exerted cards upright to Ready status.</li>
                  <li><strong>Set:</strong> Check start-of-turn effects and abilities.</li>
                  <li><strong>Draw:</strong> Draw 1 card from your deck (except Turn 1 Player 1).</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-[#0B0F19] border border-[#30363d] space-y-2">
                <div className="font-cinzel font-bold text-[#F59E0B] text-sm">2. Main Phase (Actions &amp; Questing)</div>
                <ul className="list-disc list-inside space-y-1 text-[#94A3B8]">
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
          <div className="bg-[#141a26] rounded-xl p-8 border border-[#30363d] space-y-4 text-left text-xs">
            <h2 className="font-cinzel font-bold text-xl text-[#F59E0B] border-b border-[#30363d] pb-3">Key Mechanics &amp; Keywords</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#30363d]">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Bodyguard</h3>
                <p className="text-[#94A3B8] mt-1">An opponent must challenge Bodyguard characters first if able.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#30363d]">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Evasive</h3>
                <p className="text-[#94A3B8] mt-1">Only other Evasive characters can challenge this card.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#30363d]">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Rush</h3>
                <p className="text-[#94A3B8] mt-1">This character can challenge the same turn it is played.</p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0B0F19] border border-[#30363d]">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Shift</h3>
                <p className="text-[#94A3B8] mt-1">Play this card on top of one of your existing named characters for a lower ink cost.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
