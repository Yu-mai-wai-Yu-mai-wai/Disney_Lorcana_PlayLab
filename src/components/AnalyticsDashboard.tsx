import React from 'react';
import { Flame, TrendingDown, Sparkles, BarChart3, PieChart, Lightbulb, AlertTriangle, Zap } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 mt-4">
      {/* Top Banner Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-purple-500/20 pb-6 gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h1 className="font-cinzel font-black text-2xl md:text-3xl text-slate-100 mb-2">
            Deck Performance &amp; Ink Curve Analytics
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>Real-Time Inkwell Curve &amp; Synergy Evaluation</span>
          </div>
        </div>

        <div className="glass-panel px-4 py-2.5 rounded-xl flex items-center gap-3 border border-amber-500/30 shadow-lg">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-[10px] font-bold text-amber-300">
              Am
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[10px] font-bold text-purple-300">
              Am
            </div>
          </div>
          <div>
            <div className="text-xs font-extrabold text-amber-400 font-cinzel">Amber/Amethyst Tempo</div>
            <div className="text-[10px] text-slate-400 font-semibold">60 Cards Selected</div>
          </div>
        </div>
      </header>

      {/* KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Ink Efficiency */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-purple-500/20 hover:border-amber-400/60 shadow-xl transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">
            Ink Efficiency Score
          </div>
          <div className="flex items-center justify-between">
            <div className="font-cinzel text-4xl font-black text-slate-100">
              88<span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 border-r-amber-500 flex items-center justify-center shadow-lg">
              <TrendingDown className="w-5 h-5 text-amber-400 rotate-180" />
            </div>
          </div>
        </div>

        {/* Metric 2: Avg Ink Cost */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-purple-500/20 hover:border-purple-400/60 shadow-xl transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">
            Average Ink Cost
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="font-cinzel text-4xl font-black text-slate-100">3.4</div>
            <div className="text-xs font-bold text-slate-400">Ink</div>
          </div>
          <div className="mt-3 text-xs flex items-center text-amber-400 font-bold gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Faster than meta avg.
          </div>
        </div>

        {/* Metric 3: Inkable Ratio */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-purple-500/20 hover:border-emerald-400/60 shadow-xl transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">
              Inkable Ratio
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Optimal
            </span>
          </div>
          <div className="font-cinzel text-4xl font-black text-slate-100">85%</div>
          <div className="mt-3 text-xs text-slate-400 font-mono">
            51 Inkable <span className="mx-1 font-bold text-purple-400">/</span> 9 Non-inkable
          </div>
        </div>

        {/* Metric 4: Lore Potential */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group border border-purple-500/20 hover:border-rose-400/60 shadow-xl transition-all">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">
            Quest Potential / Turn
          </div>
          <div className="flex justify-between items-end">
            <div className="font-cinzel text-4xl font-black text-slate-100">
              14 <span className="text-xs font-normal text-slate-400">Lore Max</span>
            </div>
            <Flame className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Main Charts Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Area */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col h-[400px]">
          <h3 className="font-cinzel font-extrabold text-lg text-slate-100 mb-6 border-b border-purple-500/20 pb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Ink Curve Distribution</span>
          </h3>
          <div className="flex-grow flex items-end justify-between space-x-2 pt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="border-t border-slate-400 w-full h-0"></div>
              <div className="border-t border-slate-400 w-full h-0"></div>
              <div className="border-t border-slate-400 w-full h-0"></div>
              <div className="border-t border-slate-400 w-full h-0"></div>
            </div>

            {/* Simulated Chart Bars */}
            {[
              { cost: 1, height: '60%', char: '80%', act: '20%' },
              { cost: 2, height: '80%', char: '60%', act: '40%' },
              { cost: 3, height: '100%', char: '50%', act: '50%', active: true },
              { cost: 4, height: '70%', char: '70%', act: '30%' },
              { cost: 5, height: '40%', char: '90%', act: '10%' },
              { cost: 6, height: '20%', char: '100%', act: '0%' },
              { cost: 7, height: '10%', char: '100%', act: '0%' },
              { cost: '8+', height: '15%', char: '100%', act: '0%' },
            ].map((bar, idx) => (
              <div key={idx} className="w-full flex flex-col items-center group cursor-pointer relative">
                {bar.active && (
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-purple-500/40 text-[10px] font-bold py-1 px-2 rounded-lg text-amber-300 shadow-xl whitespace-nowrap z-20">
                    15 Cards Peak
                  </div>
                )}
                <div className="w-full max-w-[36px] flex flex-col justify-end rounded-lg overflow-hidden border border-purple-500/30" style={{ height: bar.height }}>
                  <div className="w-full bg-purple-500/60 transition-all hover:bg-purple-400" style={{ height: bar.act }}></div>
                  <div className="w-full bg-amber-500/80 transition-all hover:bg-amber-400" style={{ height: bar.char }}></div>
                </div>
                <div className={`mt-3 text-xs font-mono font-bold ${bar.active ? 'text-amber-400 scale-125' : 'text-slate-400'}`}>
                  {bar.cost}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center space-x-6 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span className="text-slate-300">Characters</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-slate-300">Actions & Songs</span>
            </div>
          </div>
        </div>

        {/* Donut Chart Area */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col h-[400px]">
          <h3 className="font-cinzel font-extrabold text-lg text-slate-100 mb-6 border-b border-purple-500/20 pb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-400" />
            <span>Card Type Breakdown</span>
          </h3>
          <div className="flex-grow flex items-center justify-center relative">
            <div
              className="w-44 h-44 rounded-full border-[14px] border-slate-900 relative flex items-center justify-center shadow-2xl"
              style={{
                background: 'conic-gradient(#f59e0b 0% 65%, #a855f7 65% 85%, #94a3b8 85% 95%, #475569 95% 100%)',
                borderRadius: '50%',
              }}
            >
              <div className="absolute inset-0 m-auto w-28 h-28 bg-[#0b0e1e] rounded-full backdrop-blur-sm flex flex-col items-center justify-center border border-purple-500/20">
                <span className="font-cinzel text-2xl font-black text-amber-300">60</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Cards</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <span>Characters (65%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              <span>Actions (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
              <span>Items (10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
              <span>Locations (5%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deck Optimization Insights */}
      <section className="glass-panel rounded-2xl p-6 space-y-4">
        <h2 className="font-cinzel font-black text-xl text-slate-100 flex items-center gap-2 border-b border-purple-500/20 pb-3">
          <Lightbulb className="w-6 h-6 text-amber-400" />
          <span>Deck Optimization Insights (AWS AI SQS Engine)</span>
        </h2>
        <div className="space-y-3">
          <div className="flex items-start p-4 rounded-xl bg-slate-950/60 border border-emerald-500/30 gap-3">
            <span className="text-lg">🟢</span>
            <div>
              <h4 className="font-bold text-emerald-300 text-sm mb-0.5">Optimal Mid-Game Curve</h4>
              <p className="text-xs text-slate-400">
                Your deck peaks efficiently at 3-cost cards, providing a strong early-mid game tempo ideal for Amber/Amethyst aggressive lore strategy.
              </p>
            </div>
          </div>

          <div className="flex items-start p-4 rounded-xl bg-slate-950/60 border border-rose-500/30 gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-300 text-sm mb-0.5">High Non-Inkable Count Warning</h4>
              <p className="text-xs text-slate-400">
                With 9 non-inkable cards (18% ratio), you have a non-trivial risk of drawing bricked opening hands. Consider trimming down to 6–8 non-inkables for better consistency.
              </p>
            </div>
          </div>

          <div className="flex items-start p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-amber-300 text-sm mb-0.5">Synergy Combo Engine Detected</h4>
              <p className="text-xs text-slate-400">
                Strong synergy found: <strong className="text-white">'Mickey Mouse - Wayward Sorcerer'</strong> + <strong className="text-white">6 Magic Broom Cards</strong>. This combination represents over 30% of your late-game lore generation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
