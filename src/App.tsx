import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { GameHub } from './components/GameHub';
import { LorcanaBoard } from './components/LorcanaBoard';
import { DeckBuilder } from './components/DeckBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RulesGuide } from './components/RulesGuide';
import { UserDashboard } from './components/UserDashboard';
import { AuthModal } from './components/AuthModal';
import { PatchNotesModal } from './components/PatchNotesModal';
import { MatchLobby } from './pages/MatchLobby';
import { webSocketService } from './services/websocket';
import { APP_VERSION } from './data/patchNotes';
import { Tag } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'match' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard'>('hub');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{deck: any, roomId: string, role: 'player1'|'player2'} | null>(null);

  const handleStartMatch = (deckId: string, deckName: string, roomId?: string, role?: string, deckObject?: any) => {
    if (roomId && role) {
      const fallbackDeck = deckObject || {
        deckId: deckId || 'starter-pool',
        name: deckName || 'Starter Deck',
        cards: [],
      };
      setMatchInfo({ deck: fallbackDeck, roomId, role: role as 'player1' | 'player2' });
    } else {
      setMatchInfo(null);
    }
    setActiveTab('board');
  };

  const handleExitMatch = () => {
    if (confirm('Are you sure you want to exit the match?')) {
      webSocketService.disconnect();
      setMatchInfo(null);
      setActiveTab('match');
    }
  };

  const isFullscreenMatch = activeTab === 'board' && matchInfo;

  return (
    <div className={`${activeTab === 'board' ? 'h-screen' : 'min-h-screen'} flex flex-col text-[#F1F5F9] bg-[#0B0F19] relative`}>
      {/* Top Navbar */}
      {!isFullscreenMatch && (
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenPatchNotes={() => setIsPatchNotesOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {/* Main Content Area — board tab fills the viewport exactly (no scroll) */}
      <main className={activeTab === 'board' ? 'flex-1 overflow-hidden pb-0 min-h-0' : 'flex-1 pb-12'}>
        {activeTab === 'hub' && <GameHub setActiveTab={setActiveTab} />}
        {activeTab === 'match' && <MatchLobby onStartMatch={handleStartMatch} />}
        {activeTab === 'board' && (
          <LorcanaBoard 
            key={matchInfo?.roomId || 'sandbox'}
            matchMode={!!matchInfo} 
            initialDeck={matchInfo?.deck} 
            roomId={matchInfo?.roomId} 
            playerRole={matchInfo?.role} 
            onExitMatch={matchInfo ? handleExitMatch : undefined}
          />
        )}
        {activeTab === 'deckbuilder' && <DeckBuilder />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'rules' && <RulesGuide />}
        {activeTab === 'dashboard' && <UserDashboard setActiveTab={setActiveTab} />}
      </main>

      {/* Auth Modal connected to AWS API Gateway */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Patch Notes Modal */}
      <PatchNotesModal isOpen={isPatchNotesOpen} onClose={() => setIsPatchNotesOpen(false)} />

      {/* Footer — hidden on board tab so the playmat fills the viewport exactly */}
      {activeTab !== 'board' && (
        <footer className="py-4 px-6 border-t border-[#30363d] flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8] font-outfit bg-[#0B0F19]">
          <p>Disney Lorcana PlayLab &copy; 2026 — Digital Simulation Lab</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPatchNotesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141a26] border border-[#30363d] text-[#F59E0B] hover:border-[#F59E0B] transition-colors cursor-pointer"
            >
              <Tag className="w-3 h-3" />
              <span className="font-mono font-bold">{APP_VERSION} Patch Notes</span>
            </button>
            <span className="text-[#64748B]">AWS Serverless Powered</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
