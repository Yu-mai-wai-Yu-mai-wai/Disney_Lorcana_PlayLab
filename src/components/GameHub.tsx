import React from 'react';
import { Gamepad2, Layers, BookOpen, Database, Sparkles, RefreshCw, Cloud } from 'lucide-react';
import { ArtworkCarousel } from './ArtworkCarousel';
import { useLanguageStore } from '../store/useLanguageStore';

interface GameHubProps {
  setActiveTab: (tab: 'board' | 'deckbuilder' | 'analytics' | 'rules') => void;
}

export const GameHub: React.FC<GameHubProps> = ({ setActiveTab }) => {
  const { t, language } = useLanguageStore();

  return (
    <div className="relative min-h-screen text-[#F1F5F9] font-outfit select-none overflow-x-hidden bg-transparent">
      {/* Magic Enrichment (Landing only, per design.md R3): gold light + parchment texture */}
      <div className="magic-glow-gold" aria-hidden="true" />
      <div className="magic-parchment" aria-hidden="true" />

      {/* Editorial Hero Section */}
      <main className="pt-20 pb-12 px-6 w-full max-w-6xl mx-auto relative z-10 flex flex-col items-center text-center min-h-[60vh] justify-center gap-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141a26]/90 border border-[#30363d] text-[#F59E0B] text-xs font-mono font-bold uppercase backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>{t.hubHeroBadge}</span>
        </div>

        <h1 className="font-cinzel text-4xl sm:text-5xl md:text-6xl max-w-4xl text-[#F1F5F9] font-bold leading-tight">
          {t.hubHeroTitle1} <span className="foil-text">{t.hubHeroTitle2}</span>
        </h1>

        <p className="text-[#94A3B8] text-base md:text-lg max-w-2xl font-normal leading-relaxed">
          {t.hubHeroDesc}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            onClick={() => setActiveTab('board')}
            className="btn-primary-magic bg-[#F59E0B] hover:bg-[#D97706] text-black px-7 py-3.5 rounded-lg font-cinzel font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Gamepad2 className="w-4 h-4 text-black" />
            <span>{t.hubStartSandbox}</span>
          </button>

          <button
            onClick={() => setActiveTab('deckbuilder')}
            className="px-7 py-3.5 rounded-lg font-cinzel font-bold text-sm text-[#F1F5F9] border border-[#30363d] hover:border-[#F59E0B] transition-colors cursor-pointer flex items-center justify-center gap-2 bg-[#141a26]/70 backdrop-blur-md"
          >
            <Layers className="w-4 h-4 text-[#F59E0B]" />
            <span>{t.hubCreateDeck}</span>
          </button>
        </div>

        {/* Magic divider — gold rule + sparkle between hero and showcase */}
        <div className="magic-divider mt-4" aria-hidden="true">
          <Sparkles />
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
            className="glass-card rounded-2xl p-6 flex flex-col gap-3 items-start group cursor-pointer"
          >
            <RefreshCw className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              {t.hubFeatureMatchTitle}
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              {t.hubFeatureMatchDesc}
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
            className="glass-card rounded-2xl p-6 flex flex-col gap-3 items-start group cursor-pointer"
          >
            <Cloud className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              {t.hubFeatureAnalyticsTitle}
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              {t.hubFeatureAnalyticsDesc}
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
            className="glass-card rounded-2xl p-6 flex flex-col gap-3 items-start group cursor-pointer"
          >
            <Database className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              {t.hubFeatureDatabaseTitle}
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              {t.hubFeatureDatabaseDesc}
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
            className="glass-card rounded-2xl p-6 flex flex-col gap-3 items-start group cursor-pointer"
          >
            <BookOpen className="w-6 h-6 text-[#F59E0B]" />
            <h3 className="font-cinzel text-lg font-bold text-[#F1F5F9] group-hover:text-[#F59E0B] transition-colors">
              {t.hubFeatureRulesTitle}
            </h3>
            <p className="text-[#94A3B8] text-xs leading-relaxed">
              {t.hubFeatureRulesDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Footer */}
      <footer className="w-full py-12 border-t border-[#30363d]/60 bg-[#0B0F19]/80 backdrop-blur-md mt-12 relative z-10">
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
