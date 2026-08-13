import React from 'react';
import { Gamepad2, Layers, BookOpen, BarChart3, RefreshCw, Cloud, Database, Sparkles } from 'lucide-react';
import { GoldInkShaderCanvas } from './GoldInkShaderCanvas';
import { ArtworkCarousel } from './ArtworkCarousel';

interface GameHubProps {
  setActiveTab: (tab: 'board' | 'deckbuilder' | 'analytics' | 'rules') => void;
}

export const GameHub: React.FC<GameHubProps> = ({ setActiveTab }) => {
  return (
    <div className="relative min-h-screen text-[#d4e4fa] font-outfit select-none overflow-x-hidden">
      {/* FEATHERED AMBIENT BACKGROUND LAYER 1: landingPageBackground1 (Top Hero Section) */}
      <div
        className="fixed inset-0 -z-20 opacity-15 filter blur-[90px] scale-125 pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/artworkdisey/landingPageBackground1.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          maskImage: 'radial-gradient(circle at 50% 30%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, black 20%, transparent 80%)',
        }}
      />

      {/* FEATHERED AMBIENT BACKGROUND LAYER 2: landingPageBackground2 (Bottom Section) */}
      <div
        className="fixed inset-0 -z-20 opacity-12 filter blur-[100px] scale-125 pointer-events-none transition-opacity duration-1000"
        style={{
          backgroundImage: "url('/artworkdisey/landingPageBackground2.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          maskImage: 'radial-gradient(circle at 50% 80%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 80%, black 20%, transparent 80%)',
        }}
      />

      {/* ULTRA-SMOOTH DARK OVERLAY */}
      <div className="fixed inset-0 -z-10 bg-slate-950/80 backdrop-blur-2xl pointer-events-none" />

      {/* STITCH WEBGL SHADER BACKGROUND */}
      <GoldInkShaderCanvas />

      {/* Hero Section */}
      <main className="pt-24 pb-12 px-6 w-full max-w-7xl mx-auto relative z-10 flex flex-col items-center text-center min-h-[65vh] justify-center gap-7">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase shadow-2xl backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-400" /> Lorcana PlayLab Cloud Platform
        </div>

        <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-5xl bg-gradient-to-r from-[#ffb95f] via-white to-[#ddb7ff] bg-clip-text text-transparent pb-2 font-black leading-tight drop-shadow-2xl">
          Master the Inkwell. Play, Build &amp; Master Lorcana Decks.
        </h1>

        <p className="text-[#c6c6cc] text-base md:text-xl max-w-3xl font-normal leading-relaxed">
          Simulate 2-player matches in real-time, craft custom 60-card decks, and analyze your inkwell curve with instant card statistics.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 mt-2">
          <button
            onClick={() => setActiveTab('board')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl font-cinzel font-black text-base uppercase tracking-wider transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] cursor-pointer flex items-center justify-center gap-2 hover:scale-105"
          >
            <Gamepad2 className="w-5 h-5 text-slate-950" />
            Start Playing Sandbox
          </button>

          <button
            onClick={() => setActiveTab('deckbuilder')}
            className="px-8 py-4 rounded-xl font-cinzel font-bold text-base text-amber-300 border border-amber-400/40 hover:bg-amber-500/10 transition-colors backdrop-blur-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Layers className="w-5 h-5 text-amber-400" />
            Create Custom Deck
          </button>
        </div>
      </main>

      {/* FULL-WIDTH 3D DISNEY ARTWORK SHOWCASE CAROUSEL SLIDER */}
      <ArtworkCarousel />

      {/* Feature Grid Section */}
      <section className="py-16 px-6 w-full max-w-7xl mx-auto relative z-10">
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
            className="bg-[#0f172a]/70 backdrop-blur-[20px] rounded-2xl p-8 gold-border amethyst-glow transition-all duration-300 flex flex-col gap-4 items-start relative overflow-hidden group cursor-pointer border border-[#ffb95f]/20 hover:border-[#ffb95f]/80"
          >
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-400/40 text-amber-400 group-hover:scale-110 transition-transform">
              <RefreshCw className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-white group-hover:text-[#ffb95f] transition-colors">
              Real-Time Match Arena
            </h3>
            <p className="text-[#c6c6cc] text-xs leading-relaxed">
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
            className="bg-[#0f172a]/70 backdrop-blur-[20px] rounded-2xl p-8 gold-border amethyst-glow transition-all duration-300 flex flex-col gap-4 items-start relative overflow-hidden group cursor-pointer border border-[#ffb95f]/20 hover:border-[#ffb95f]/80"
          >
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-400/40 text-amber-400 group-hover:scale-110 transition-transform">
              <Cloud className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-white group-hover:text-[#ffb95f] transition-colors">
              Smart Deck Analyzer
            </h3>
            <p className="text-[#c6c6cc] text-xs leading-relaxed">
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
            className="bg-[#0f172a]/70 backdrop-blur-[20px] rounded-2xl p-8 gold-border amethyst-glow transition-all duration-300 flex flex-col gap-4 items-start relative overflow-hidden group cursor-pointer border border-[#ffb95f]/20 hover:border-[#ffb95f]/80"
          >
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-400/40 text-amber-400 group-hover:scale-110 transition-transform">
              <Database className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-white group-hover:text-[#ffb95f] transition-colors">
              Complete Card Database
            </h3>
            <p className="text-[#c6c6cc] text-xs leading-relaxed">
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
            className="bg-[#0f172a]/70 backdrop-blur-[20px] rounded-2xl p-8 gold-border amethyst-glow transition-all duration-300 flex flex-col gap-4 items-start relative overflow-hidden group cursor-pointer border border-[#ffb95f]/20 hover:border-[#ffb95f]/80"
          >
            <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-400/40 text-amber-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="font-cinzel text-xl font-bold text-white group-hover:text-[#ffb95f] transition-colors">
              Interactive Rulebook
            </h3>
            <p className="text-[#c6c6cc] text-xs leading-relaxed">
              Learn Lorcana rules in minutes with interactive card anatomy tooltips and mechanics.
            </p>
          </div>
        </div>
      </section>

      {/* Stitch Footer */}
      <footer className="w-full py-14 border-t border-[#ffb95f]/15 bg-[#010f1f] mt-16 relative z-10">
        <div className="flex flex-col items-center gap-6 px-6 w-full max-w-7xl mx-auto text-center">
          <div className="flex items-center gap-3">
            <img
              src="/Logo_cloudgame.png"
              alt="Lorcana PlayLab Cloud Logo"
              className="h-10 w-auto object-contain"
            />
            <span className="font-cinzel text-xl font-bold text-[#ffb95f] tracking-wider">
              Lorcana PlayLab
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-[#c6c6cc]">
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
              className="hover:text-[#ffb95f] transition-colors"
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
              className="hover:text-[#ffb95f] transition-colors"
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
              className="hover:text-[#ffb95f] transition-colors"
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
              className="hover:text-[#ffb95f] transition-colors"
            >
              Rulebook
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-2">
            <span className="text-[11px] font-mono text-[#c6c6cc]/70 border border-[#c6c6cc]/20 px-3 py-1 rounded-lg">Match Sandbox</span>
            <span className="text-[11px] font-mono text-[#c6c6cc]/70 border border-[#c6c6cc]/20 px-3 py-1 rounded-lg">Deck Builder</span>
            <span className="text-[11px] font-mono text-[#c6c6cc]/70 border border-[#c6c6cc]/20 px-3 py-1 rounded-lg">Smart Analytics</span>
            <span className="text-[11px] font-mono text-[#c6c6cc]/70 border border-[#c6c6cc]/20 px-3 py-1 rounded-lg">Rules Guide</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
