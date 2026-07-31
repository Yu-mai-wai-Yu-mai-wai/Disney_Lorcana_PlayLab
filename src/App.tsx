import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LorcanaBoard } from './components/LorcanaBoard';
import { DeckBuilder } from './components/DeckBuilder';
import { AuthModal } from './components/AuthModal';

export function App() {
  const [activeTab, setActiveTab] = useState<'board' | 'deckbuilder'>('board');
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12">
        {activeTab === 'board' ? <LorcanaBoard /> : <DeckBuilder />}
      </main>

      {/* Auth Modal connected to AWS API Gateway */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>Disney Lorcana PlayLab Cloud &copy; 2026 — Built with React 19, TypeScript 5, Vite 6, Tailwind v4, Zustand & 100% AWS Serverless</p>
      </footer>
    </div>
  );
}

export default App;
