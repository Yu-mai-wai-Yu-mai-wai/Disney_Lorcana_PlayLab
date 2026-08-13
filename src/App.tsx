import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { GameHub } from './components/GameHub';
import { LorcanaBoard } from './components/LorcanaBoard';
import { DeckBuilder } from './components/DeckBuilder';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { RulesGuide } from './components/RulesGuide';
import { UserDashboard } from './components/UserDashboard';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [activeTab, setActiveTab] = useState<'hub' | 'board' | 'deckbuilder' | 'analytics' | 'rules' | 'dashboard'>('hub');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col text-slate-100 relative">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'hub' && <GameHub setActiveTab={setActiveTab} />}
        {activeTab === 'board' && <LorcanaBoard />}
        {activeTab === 'deckbuilder' && <DeckBuilder />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'rules' && <RulesGuide />}
        {activeTab === 'dashboard' && <UserDashboard setActiveTab={setActiveTab} />}
      </main>

      {/* Auth Modal connected to AWS API Gateway */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-slate-900/60 text-center text-xs text-slate-400 font-outfit">
        <p>Disney Lorcana PlayLab &copy; 2026 — All rights reserved</p>
      </footer>
    </div>
  );
}

export default App;
