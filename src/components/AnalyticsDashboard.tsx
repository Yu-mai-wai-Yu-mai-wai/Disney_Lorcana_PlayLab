import React from 'react';
import { Flame, TrendingDown, Sparkles, BarChart3, PieChart, Lightbulb, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';

export const AnalyticsDashboard: React.FC = () => {
  const { t, language } = useLanguageStore();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 mt-4 font-outfit select-none bg-transparent">
      {/* Top Banner Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 gap-4 bg-[#141a26]/85 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h1 className="font-cinzel font-bold text-2xl md:text-3xl text-[#F1F5F9] mb-2">
            {t.analyticsTitle}
          </h1>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <Zap className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{t.analyticsSubtitle}</span>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 px-4 py-2.5 rounded-xl flex items-center gap-3 border border-[#30363d] backdrop-blur-sm">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center text-[10px] font-bold text-[#F59E0B]">
              Am
            </div>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center text-[10px] font-bold text-purple-300">
              Am
            </div>
          </div>
          <div>
            <div className="text-xs font-bold text-[#F59E0B] font-cinzel">Amber/Amethyst Tempo</div>
            <div className="text-[10px] text-[#94A3B8] font-semibold">{language === 'th' ? 'เลือกการ์ด 60 ใบ' : '60 Cards Selected'}</div>
          </div>
        </div>
      </header>

      {/* KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Ink Efficiency */}
        <div className="glass-card rounded-2xl p-6">
          <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest mb-4">
            {t.analyticsEfficiencyScore}
          </div>
          <div className="flex items-center justify-between">
            <div className="font-cinzel text-4xl font-bold text-[#F1F5F9]">
              88<span className="text-sm font-normal text-[#94A3B8]">/100</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-[#F59E0B] flex items-center justify-center bg-[#0B0F19]/80 shadow-md">
              <TrendingDown className="w-5 h-5 text-[#F59E0B] rotate-180" />
            </div>
          </div>
        </div>

        {/* Metric 2: Avg Ink Cost */}
        <div className="glass-card rounded-2xl p-6">
          <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest mb-4">
            {t.analyticsAvgCost}
          </div>
          <div className="flex items-baseline space-x-2">
            <div className="font-cinzel text-4xl font-bold text-[#F1F5F9]">3.4</div>
            <div className="text-xs font-bold text-[#94A3B8]">Ink</div>
          </div>
          <div className="mt-3 text-xs flex items-center text-[#F59E0B] font-bold gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.analyticsFasterThanMeta}</span>
          </div>
        </div>

        {/* Metric 3: Inkable Ratio */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest">
              {t.analyticsInkableRatio}
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
              {t.analyticsOptimal}
            </span>
          </div>
          <div className="font-cinzel text-4xl font-bold text-[#F1F5F9]">85%</div>
          <div className="mt-3 text-xs text-[#94A3B8] font-mono">
            51 {t.inkable} <span className="mx-1 font-bold text-[#F59E0B]">/</span> 9 {language === 'th' ? 'ใส่หมึกไม่ได้' : 'Non-inkable'}
          </div>
        </div>

        {/* Metric 4: Lore Potential */}
        <div className="glass-card rounded-2xl p-6">
          <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest mb-4">
            {t.analyticsLorePotential}
          </div>
          <div className="flex justify-between items-end">
            <div className="font-cinzel text-4xl font-bold text-[#F1F5F9]">
              14 <span className="text-xs font-normal text-[#94A3B8]">Lore Max</span>
            </div>
            <Flame className="w-7 h-7 text-[#F59E0B]" />
          </div>
        </div>
      </section>

      {/* Main Charts Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Area */}
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col h-[400px]">
          <h3 className="font-cinzel font-bold text-lg text-[#F1F5F9] mb-6 border-b border-[#30363d] pb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
            <span>{t.analyticsCurveDist}</span>
          </h3>
          <div className="flex-grow flex items-end justify-between space-x-2 pt-4 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
              <div className="border-t border-[#30363d] w-full h-0"></div>
              <div className="border-t border-[#30363d] w-full h-0"></div>
              <div className="border-t border-[#30363d] w-full h-0"></div>
              <div className="border-t border-[#30363d] w-full h-0"></div>
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
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0B0F19] border border-[#F59E0B] text-[10px] font-bold py-1 px-2 rounded text-[#F59E0B] whitespace-nowrap z-20">
                    {language === 'th' ? 'สูงสุด 15 ใบ' : '15 Cards Peak'}
                  </div>
                )}
                <div className="w-full max-w-[36px] flex flex-col justify-end rounded overflow-hidden border border-[#30363d]" style={{ height: bar.height }}>
                  <div className="w-full bg-purple-500/60 transition-colors hover:bg-purple-400" style={{ height: bar.act }}></div>
                  <div className="w-full bg-[#F59E0B] transition-colors hover:bg-[#D97706]" style={{ height: bar.char }}></div>
                </div>
                <div className={`mt-3 text-xs font-mono font-bold ${bar.active ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`}>
                  {bar.cost}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center space-x-6 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#F59E0B]"></div>
              <span className="text-[#F1F5F9]">{t.analyticsCharacters}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-[#F1F5F9]">{t.analyticsActions}</span>
            </div>
          </div>
        </div>

        {/* Donut Chart Area */}
        <div className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] flex flex-col h-[400px]">
          <h3 className="font-cinzel font-bold text-lg text-[#F1F5F9] mb-6 border-b border-[#30363d] pb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#F59E0B]" />
            <span>{t.analyticsTypeBreakdown}</span>
          </h3>
          <div className="flex-grow flex items-center justify-center relative">
            <div
              className="w-44 h-44 rounded-full border-[14px] border-[#0B0F19] relative flex items-center justify-center"
              style={{
                background: 'conic-gradient(#f59e0b 0% 65%, #a855f7 65% 85%, #94a3b8 85% 95%, #475569 95% 100%)',
                borderRadius: '50%',
              }}
            >
              <div className="absolute inset-0 m-auto w-28 h-28 bg-[#0B0F19] rounded-full flex flex-col items-center justify-center border border-[#30363d]">
                <span className="font-cinzel text-2xl font-bold text-[#F59E0B]">60</span>
                <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold">{t.totalCards}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#F1F5F9]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></div>
              <span>{t.analyticsCharacters} (65%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
              <span>{t.analyticsActions} (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
              <span>{t.analyticsItems} (10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
              <span>{t.analyticsLocations} (5%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Deck Optimization Insights */}
      <section className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] space-y-4">
        <h2 className="font-cinzel font-bold text-xl text-[#F1F5F9] flex items-center gap-2 border-b border-[#30363d] pb-3">
          <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
          <span>{t.analyticsOptimizationTitle}</span>
        </h2>
        <div className="space-y-3">
          <div className="flex items-start p-4 rounded-lg bg-[#0B0F19] border border-emerald-500/30 gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-emerald-300 text-sm mb-0.5">
                {language === 'th' ? 'กราฟค่าร่ายช่วงกลางเกมมีความเสถียรสูง' : 'Optimal Mid-Game Curve'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {language === 'th' 
                  ? 'เด็คของคุณมีจุดพีคของค่าร่ายอยู่ที่การ์ด Cost 3 อย่างลงตัว ช่วยให้ทำเกมเร็วช่วงต้นถึงกลางเกม (Early-Mid Game Tempo) ได้อย่างยอดเยี่ยม เหมาะกับกลยุทธ์ Amber/Amethyst Aggro Lore'
                  : 'Your deck peaks efficiently at 3-cost cards, providing a strong early-mid game tempo ideal for Amber/Amethyst aggressive lore strategy.'}
              </p>
            </div>
          </div>

          <div className="flex items-start p-4 rounded-lg bg-[#0B0F19] border border-rose-500/30 gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-rose-300 text-sm mb-0.5">
                {language === 'th' ? 'คำเตือน: สัดส่วนการ์ดไม่สามารถใส่ Inkwell ได้ค่อนข้างสูง' : 'High Non-Inkable Count Warning'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {language === 'th'
                  ? 'มีจำนวนการ์ด Non-inkable 9 ใบ (สัดส่วน 18%) ซึ่งอาจมีความเสี่ยงเปิดมือแรกแล้วติดขัดได้ แนะนำให้ปรับลดเหลือ 6-8 ใบเพื่อความลื่นไหลสูงสุด'
                  : 'With 9 non-inkable cards (18% ratio), you have a non-trivial risk of drawing bricked opening hands. Consider trimming down to 6–8 non-inkables for better consistency.'}
              </p>
            </div>
          </div>

          <div className="flex items-start p-4 rounded-lg bg-[#0B0F19] border border-[#F59E0B]/30 gap-3">
            <Sparkles className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-[#F59E0B] text-sm mb-0.5">
                {language === 'th' ? 'ตรวจพบคอมโบ Synergy ที่ทรงพลัง' : 'Synergy Combo Engine Detected'}
              </h3>
              <p className="text-xs text-[#94A3B8]">
                {language === 'th'
                  ? 'พบคอมโบหลัก: \'Mickey Mouse - Wayward Sorcerer\' ร่วมกับ \'6 Magic Broom Cards\' คอมโบนี้สร้างแต้ม Lore ในช่วงท้ายเกมได้มากกว่า 30% ของทั้งเด็ค'
                  : "Strong synergy found: 'Mickey Mouse - Wayward Sorcerer' + 6 Magic Broom Cards. This combination represents over 30% of your late-game lore generation."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
