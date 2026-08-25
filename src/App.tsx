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
import { GoldInkShaderCanvas } from './components/GoldInkShaderCanvas';
import { webSocketService } from './services/websocket';
import { APP_VERSION } from './data/patchNotes';
import { Tag } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'match' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard'>(() => {
    const urlParam = new URLSearchParams(window.location.search).get('tab');
    if (urlParam && ['hub', 'match', 'board', 'deckbuilder', 'analytics', 'rules', 'dashboard'].includes(urlParam)) {
      return urlParam as any;
    }
    return 'hub';
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isPatchNotesOpen, setIsPatchNotesOpen] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{deck: any, roomId: string, role: 'player1'|'player2', isRejoin?: boolean} | null>(null);

  const handleStartMatch = (deckId: string, deckName: string, roomId?: string, role?: string, deckObject?: any, isRejoin?: boolean) => {
    if (roomId && role) {
      const fallbackDeck = deckObject || {
        deckId: deckId || 'starter-pool',
        name: deckName || 'Starter Deck',
        cards: [],
      };
      setMatchInfo({ deck: fallbackDeck, roomId, role: role as 'player1' | 'player2', isRejoin: !!isRejoin });
    } else {
      setMatchInfo(null);
    }
    setActiveTab('board');
  };

  const handleExitMatch = () => {
    if (confirm('Are you sure you want to leave to Lobby? (You can rejoin as long as your opponent is still in the room)')) {
      // We deliberately PRESERVE lorcana_active_session and lorcana_board_state_[roomId]
      // so the player can see the "Rejoin Match" banner in the Match Lobby and jump right back in!
      localStorage.removeItem('lorcana_active_session');
      webSocketService.leaveRoom();
      setMatchInfo(null);
      setActiveTab('match');
    }
  };

  const isFullscreenMatch = activeTab === 'board' && matchInfo;

  return (
    <div className={`${activeTab === 'board' ? 'h-screen' : 'min-h-screen'} flex flex-col text-[#F1F5F9] bg-[#0B0F19]/60 relative selection:bg-[#F59E0B]/30 selection:text-white overflow-x-hidden`}>
      {/* Luxury WebGL Gold & Lore Ink Background Shader */}
      <GoldInkShaderCanvas opacity={0.88} speed={1.0} interactive={true} paused={activeTab === 'board'} />

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
      <main className={activeTab === 'board' ? 'flex-1 overflow-hidden pb-0 min-h-0 relative z-10' : 'flex-1 pb-12 relative z-10'}>
        {activeTab === 'hub' && <GameHub setActiveTab={setActiveTab} />}
        {activeTab === 'match' && <MatchLobby onStartMatch={handleStartMatch} />}
        {activeTab === 'board' && (
          <LorcanaBoard 
            key={matchInfo?.roomId || 'sandbox'}
            matchMode={!!matchInfo} 
            isRejoin={matchInfo?.isRejoin}
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
        <footer className="py-4 px-6 border-t border-[#30363d]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[#94A3B8] font-outfit bg-[#0B0F19]/80 backdrop-blur-md relative z-10">
          <p>Disney Lorcana PlayLab &copy; 2026 — Digital Simulation Lab</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPatchNotesOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141a26]/90 border border-[#30363d] text-[#F59E0B] hover:border-[#F59E0B] transition-colors cursor-pointer backdrop-blur-sm"
            >
              <Tag className="w-3 h-3" />
              <span className="font-mono font-bold">{APP_VERSION} Patch Notes</span>
            </button>
            <span className="text-[#64748B]">Illuminary Cloud Network</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
