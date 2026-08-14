import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { GameHub } from './components/GameHub';
import { LorcanaBoard } from './components/LorcanaBoard';
import { DeckBuilder } from './components/DeckBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RulesGuide } from './components/RulesGuide';
import { UserDashboard } from './components/UserDashboard';
import { AuthModal } from './components/AuthModal';
import { MatchLobby } from './pages/MatchLobby';

export function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'match' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard'>('hub');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{deck: any, roomId: string, role: 'player1'|'player2'} | null>(null);

  const handleStartMatch = (deckId: string, deckName: string, roomId?: string, role?: string, deckObject?: any) => {
    if (roomId && role && deckObject) {
      setMatchInfo({ deck: deckObject, roomId, role: role as 'player1'|'player2' });
    } else {
      setMatchInfo(null);
    }
    setActiveTab('board');
  };

  return (
    <div className={`${activeTab === 'board' ? 'h-screen' : 'min-h-screen'} flex flex-col text-[#F1F5F9] bg-[#0B0F19] relative`}>
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area — board tab fills the viewport exactly (no scroll) */}
      <main className={activeTab === 'board' ? 'flex-1 overflow-hidden pb-0 min-h-0' : 'flex-1 pb-12'}>
        {activeTab === 'hub' && <GameHub setActiveTab={setActiveTab} />}
        {activeTab === 'match' && <MatchLobby onStartMatch={handleStartMatch} />}
        {activeTab === 'board' && (
          <LorcanaBoard 
            matchMode={!!matchInfo} 
            initialDeck={matchInfo?.deck} 
            roomId={matchInfo?.roomId} 
            playerRole={matchInfo?.role} 
          />
        )}
        {activeTab === 'deckbuilder' && <DeckBuilder />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'rules' && <RulesGuide />}
        {activeTab === 'dashboard' && <UserDashboard setActiveTab={setActiveTab} />}
      </main>

      {/* Auth Modal connected to AWS API Gateway */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer — hidden on board tab so the playmat fills the viewport exactly */}
      {activeTab !== 'board' && (
        <footer className="py-4 px-6 border-t border-[#30363d] text-center text-xs text-[#94A3B8] font-outfit bg-[#0B0F19]">
          <p>Disney Lorcana PlayLab &copy; 2026 — All rights reserved</p>
        </footer>
      )}
    </div>
  );
}

export default App;
