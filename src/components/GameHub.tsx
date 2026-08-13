import React from 'react';
import { Gamepad2, Layers, BookOpen, Database, Sparkles, RefreshCw, Cloud } from 'lucide-react';
import { ArtworkCarousel } from './ArtworkCarousel';

interface GameHubProps {
  setActiveTab: (tab: 'board' | 'deckbuilder' | 'analytics' | 'rules') => void;
}

export const GameHub: React.FC<GameHubProps> = ({ setActiveTab }) => {
  return (
    <div className="relative min-h-screen text-[#F1F5F9] font-outfit select-none overflow-x-hidden bg-[#0B0F19]">
      {/* Editorial Hero Section */}
      <main className="pt-20 pb-12 px-6 w-full max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center min-h-[60vh] justify-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141a26] border border-[#30363d] text-[#F59E0B] text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Lorcana PlayLab Cloud Platform</span>
        </div>

        <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl max-w-4xl text-[#F1F5F9] font-bold leading-tight">
          Master the Inkwell. Play, Build &amp; Master Lorcana Decks.
        </h1>

        <p className="text-[#94A3B8] text-base md:text-lg max-w-2xl font-normal leading-relaxed">
          Simulate 2-player matches in real-time, craft custom 60-card decks, and analyze your inkwell curve with instant card statistics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            onClick={() => setActiveTab('board')}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-black px-7 py-3.5 rounded-lg font-cinzel font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-4 h-4 text-black" />
            <span>Start Playing Sandbox</span>
          </button>

          <button
            onClick={() => setActiveTab('deckbuilder')}
            className="px-7 py-3.5 rounded-lg font-cinzel font-bold text-sm text-[#F1F5F9] border border-[#30363d] hover:border-[#F59E0B] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <Layers className="w-4 h-4 text-[#F59E0B]" />
            <span>Create Custom Deck</span>
          </button>
        </div>
      </main>

      {/* FULL-WIDTH 3D DISNEY ARTWORK SHOWCASE CAROUSEL SLIDER */}
      <ArtworkCarousel />

      {/* Feature Grid Section */}
      <section className="py-16 px-6 w-full max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('board')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('board');
              }
            }}
            className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] hover:border-[#F59E0B] transition-colors flex flex-col gap-3 items-start group cursor-pointer"
          >
            <RefreshCw className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              Real-Time Match Arena
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              Simulate match turns with card rotation, inkwell reserves, and 0–20 Lore tracking.
            </p>
          </div>

          {/* Card 2 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('analytics')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('analytics');
              }
            }}
            className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] hover:border-[#F59E0B] transition-colors flex flex-col gap-3 items-start group cursor-pointer"
          >
            <Cloud className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              Smart Deck Analyzer
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              Calculate ink cost distributions, character ratios, and deck synergy ratings.
            </p>
          </div>

          {/* Card 3 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('deckbuilder')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('deckbuilder');
              }
            }}
            className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] hover:border-[#F59E0B] transition-colors flex flex-col gap-3 items-start group cursor-pointer"
          >
            <Database className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              Complete Card Database
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              Search over 3,200 cards with ink color filters and high-resolution official artwork.
            </p>
          </div>

          {/* Card 4 */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setActiveTab('rules')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setActiveTab('rules');
              }
            }}
            className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] hover:border-[#F59E0B] transition-colors flex flex-col gap-3 items-start group cursor-pointer"
          >
            <BookOpen className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              Interactive Rulebook
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              Learn Lorcana rules in minutes with interactive card anatomy tooltips and mechanics.
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="w-full py-12 border-t border-[#30363d] bg-[#0B0F19] mt-12 relative z-10">
        <div className="flex flex-col items-center gap-6 px-6 w-full max-w-6xl mx-auto text-center">
          <div className="flex items-center gap-3">
            <img
              src="/Logo_cloudgame.png"
              alt="Lorcana PlayLab Cloud Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="font-cinzel text-lg font-bold text-[#F59E0B] tracking-wider">
              Lorcana PlayLab
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#94A3B8]">
            <a
              href="#board"
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('board')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('board');
                }
              }}
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Match Arena
            </a>
            <a
              href="#deckbuilder"
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('deckbuilder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('deckbuilder');
                }
              }}
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Deck Builder
            </a>
            <a
              href="#analytics"
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('analytics')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('analytics');
                }
              }}
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Deck Analytics
            </a>
            <a
              href="#rules"
              role="button"
              tabIndex={0}
              onClick={() => setActiveTab('rules')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab('rules');
                }
              }}
              className="hover:text-[#F1F5F9] transition-colors"
            >
              Rulebook
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-xs font-mono text-[#94A3B8]">
            <span>Match Sandbox</span>
            <span>•</span>
            <span>Deck Builder</span>
            <span>•</span>
            <span>Smart Analytics</span>
            <span>•</span>
            <span>Rules Guide</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
