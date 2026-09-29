import React from 'react';
import { Flame, TrendingDown, Sparkles, BarChart3, PieChart, Lightbulb, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useDeckStore } from '../store/useDeckStore';
import { apiService } from '../services/api';
import { analyzeDeck, DeckAnalysis } from '../../backend/shared/deckAnalysis';

type DeckOption = { id: string; name: string; cards: any[] };
type Insight = { tone: 'good' | 'warn'; title: string; body: string };

const BUILDER_ID = '__builder__';
const INK_COLORS: Record<string, string> = {
  Amber: '#F59E0B',
  Amethyst: '#A855F7',
  Emerald: '#10B981',
  Ruby: '#F43F5E',
  Sapphire: '#3B82F6',
  Steel: '#94A3B8',
};

// Insights use the same thresholds as the synergy score in deckAnalysis.ts, so text and score never disagree.
function buildInsights(a: DeckAnalysis, th: boolean): Insight[] {
  const out: Insight[] = [];
  const inks = Object.keys(a.inkDistribution).length;
  const peak = a.costHistogram.indexOf(Math.max(...a.costHistogram));
  const peakLabel = peak === 10 ? '10+' : String(peak);

  if (a.totalCards < 60) {
    out.push({
      tone: 'warn',
      title: th ? `เด็คมี ${a.totalCards} ใบ ยังไม่ครบ 60 ใบ` : `Deck has ${a.totalCards} cards, below the 60-card minimum`,
      body: th ? 'เด็คที่ใช้แข่งต้องมีอย่างน้อย 60 ใบ' : 'A legal deck needs at least 60 cards.',
    });
  }
  if (inks > 2) {
    out.push({
      tone: 'warn',
      title: th ? `ใช้ ${inks} สีหมึก` : `${inks} ink colors in one deck`,
      body: th ? 'เด็คมาตรฐานใช้ได้ไม่เกิน 2 สี การใช้เกินทำให้คะแนน Synergy ลดลง 30' : 'Standard decks use at most 2 inks. More than 2 costs 30 synergy points.',
    });
  }
  if (a.characterRatio < 0.6 || a.characterRatio > 0.8) {
    const pct = Math.round(a.characterRatio * 100);
    out.push({
      tone: 'warn',
      title: th ? `สัดส่วนตัวละคร ${pct}%` : `Characters are ${pct}% of the deck`,
      body: th ? 'ช่วงที่เหมาะคือ 60-80% ต่ำกว่านั้นเควสต์ไม่พอ สูงกว่านั้นขาดการ์ดสนับสนุน' : 'Aim for 60-80%. Lower gives too few questers, higher leaves little support.',
    });
  }
  if (a.costCurve['0-2'] < 10) {
    out.push({
      tone: 'warn',
      title: th ? `การ์ด Cost 0-2 มีแค่ ${a.costCurve['0-2']} ใบ` : `Only ${a.costCurve['0-2']} cards at cost 0-2`,
      body: th ? 'ต่ำกว่า 10 ใบ เทิร์นต้นเกมอาจไม่มีอะไรลง' : 'Fewer than 10 means early turns may have nothing to play.',
    });
  }
  if (a.costCurve['3-4'] < 10) {
    out.push({
      tone: 'warn',
      title: th ? `การ์ด Cost 3-4 มีแค่ ${a.costCurve['3-4']} ใบ` : `Only ${a.costCurve['3-4']} cards at cost 3-4`,
      body: th ? 'ต่ำกว่า 10 ใบ ช่วงกลางเกมจะขาดตัวเล่นหลัก' : 'Fewer than 10 leaves the mid game thin.',
    });
  }
  if (a.totalCards > 0 && a.inkableRatio < 0.85) {
    out.push({
      tone: 'warn',
      title: th ? `การ์ดใส่ Inkwell ไม่ได้ ${a.nonInkableCount} ใบ (${Math.round((1 - a.inkableRatio) * 100)}%)` : `${a.nonInkableCount} non-inkable cards (${Math.round((1 - a.inkableRatio) * 100)}%)`,
      body: th ? 'ถ้ามือแรกมีแต่ใบที่ใส่ไม่ได้ จะเติม Ink ไม่ทัน ลองลดให้เหลือไม่เกิน 15%' : 'Opening hands full of non-inkables stall your ink. Try to stay under 15%.',
    });
  }
  if (a.totalCards > 0) {
    out.push({
      tone: 'good',
      title: th ? `จุดพีคของค่าร่ายอยู่ที่ Cost ${peakLabel}` : `Cost curve peaks at ${peakLabel}`,
      body: th ? `มี ${a.costHistogram[peak]} ใบที่ค่าร่ายนี้ จาก ${a.totalCards} ใบ` : `${a.costHistogram[peak]} of ${a.totalCards} cards sit at this cost.`,
    });
  }
  return out;
}

export const AnalyticsDashboard: React.FC = () => {
  const { t, language } = useLanguageStore();
  const th = language === 'th';
  const token = useAuthStore((s) => s.token);
  const builderCards = useDeckStore((s) => s.currentDeck);
  const builderName = useDeckStore((s) => s.deckName);

  const [saved, setSaved] = React.useState<DeckOption[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!token) {
      setSaved([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiService.getUserDecks(token).then((res: any) => {
      if (cancelled) return;
      setSaved((Array.isArray(res?.decks) ? res.decks : []).map((d: any) => ({ id: d.deckId, name: d.name, cards: d.cards || [] })));
      if (res?.error) setError(String(res.error));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const options: DeckOption[] = React.useMemo(
    () => [...(builderCards.length > 0 ? [{ id: BUILDER_ID, name: builderName, cards: builderCards }] : []), ...saved],
    [builderCards, builderName, saved]
  );
  const selected = options.find((o) => o.id === selectedId) ?? options[0];
  const a = React.useMemo(() => (selected ? analyzeDeck(selected.cards) : null), [selected]);

  const shell = 'p-6 max-w-7xl mx-auto space-y-6 mt-4 font-outfit bg-transparent';

  if (!selected || !a) {
    if (loading) {
      return (
        <div className={shell} data-testid="analytics-loading" role="status">
          <p className="text-[#94A3B8]">{th ? 'กำลังโหลดเด็คของคุณ...' : 'Loading your decks...'}</p>
        </div>
      );
    }
    return (
      <div className={shell}>
        {error ? (
          <div role="alert" data-testid="analytics-error" className="p-6 rounded-2xl border border-rose-500/40 bg-[#141a26]/85 text-rose-300">
            {th ? `โหลดเด็คไม่สำเร็จ: ${error}` : `Could not load decks: ${error}`}
          </div>
        ) : (
          <div data-testid="analytics-empty" className="p-6 rounded-2xl border border-white/10 bg-[#141a26]/85 text-[#F1F5F9]">
            <h1 className="font-cinzel font-bold text-2xl mb-2">{t.analyticsTitle}</h1>
            <p className="text-[#94A3B8]">
              {th ? 'ยังไม่มีเด็คให้วิเคราะห์ ไปที่ Deck Builder เพื่อสร้างเด็คก่อน แล้วกลับมาดูหน้านี้' : 'No deck to analyse yet. Build one in the Deck Builder, then come back.'}
            </p>
          </div>
        )}
      </div>
    );
  }

  const maxCount = Math.max(1, ...a.costHistogram);
  const peak = a.costHistogram.indexOf(Math.max(...a.costHistogram));
  const CHART_PX = 220;
  const types = [
    { key: 'Character', label: t.analyticsCharacters, color: '#f59e0b', dot: 'bg-[#F59E0B]' },
    { key: 'Action', label: t.analyticsActions, color: '#a855f7', dot: 'bg-purple-500' },
    { key: 'Item', label: t.analyticsItems, color: '#94a3b8', dot: 'bg-slate-400' },
    { key: 'Location', label: t.analyticsLocations, color: '#475569', dot: 'bg-slate-600' },
  ] as const;
  let acc = 0;
  const stops = types
    .map((ty) => {
      const from = (acc / a.totalCards) * 100;
      acc += a.typeCounts[ty.key];
      return `${ty.color} ${from}% ${(acc / a.totalCards) * 100}%`;
    })
    .join(', ');
  const insights = buildInsights(a, th);

  return (
    <div className={`${shell} select-none`}>
      {error && (
        <div role="alert" data-testid="analytics-error" className="p-3 rounded-xl border border-rose-500/40 bg-[#141a26]/85 text-rose-300 text-sm">
          {th ? `โหลดเด็คที่บันทึกไว้ไม่สำเร็จ: ${error}` : `Could not load saved decks: ${error}`}
        </div>
      )}

      {/* Top Banner Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-6 gap-4 bg-[#141a26]/85 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h1 className="font-cinzel font-bold text-2xl md:text-3xl text-[#F1F5F9] mb-2">{t.analyticsTitle}</h1>
          <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B]">
            <Zap className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span>{t.analyticsSubtitle}</span>
          </div>
        </div>

        <div className="bg-[#0B0F19]/80 px-4 py-2.5 rounded-xl flex flex-col gap-2 border border-[#30363d] backdrop-blur-sm min-w-[260px]">
          <label htmlFor="deck-select" className="text-[10px] uppercase tracking-widest font-bold text-[#94A3B8]">
            {th ? 'เลือกเด็คที่จะวิเคราะห์' : 'Deck to analyse'}
          </label>
          <select
            id="deck-select"
            data-testid="deck-select"
            value={selected.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="bg-[#0B0F19] text-[#F1F5F9] text-sm font-bold rounded-lg border border-[#30363d] px-2 py-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F59E0B]"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id === BUILDER_ID ? (th ? `${o.name} (ยังไม่บันทึก)` : `${o.name} (unsaved)`) : o.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(a.inkDistribution).map(([ink, n]) => (
                <span
                  key={ink}
                  className="px-2 py-0.5 rounded-full border text-[10px] font-bold"
                  style={{ color: INK_COLORS[ink] ?? '#F1F5F9', borderColor: INK_COLORS[ink] ?? '#30363d' }}
                >
                  {ink} {n}
                </span>
              ))}
            </div>
            <div className="ml-auto text-right">
              <div data-testid="deck-name" className="text-xs font-bold text-[#F59E0B] font-cinzel">{selected.name}</div>
              <div className="text-[10px] text-[#94A3B8] font-semibold">
                <span data-testid="deck-total">{a.totalCards}</span> {th ? 'ใบ' : 'cards'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Metrics Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest mb-4">{th ? 'คะแนน Synergy' : 'Synergy score'}</div>
          <div className="flex items-center justify-between">
            <div data-testid="kpi-synergy" className="font-cinzel text-4xl font-bold text-[#F1F5F9]">
              {a.synergyScore}
              <span className="text-sm font-normal text-[#94A3B8]">/100</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-[#F59E0B] flex items-center justify-center bg-[#0B0F19]/80 shadow-md">
              <TrendingDown className="w-5 h-5 text-[#F59E0B] rotate-180" />
            </div>
          </div>
          <p className="mt-3 text-xs text-[#94A3B8]">{a.summaryText}</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest mb-4">{t.analyticsAvgCost}</div>
          <div className="flex items-baseline space-x-2">
            <div data-testid="kpi-avg-cost" className="font-cinzel text-4xl font-bold text-[#F1F5F9]">{a.avgCost}</div>
            <div className="text-xs font-bold text-[#94A3B8]">Ink</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest">{t.analyticsInkableRatio}</div>
            {a.totalCards > 0 && a.inkableRatio >= 0.85 && (
              <span className="px-2 py-0.5 rounded text-[9px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/40">
                {t.analyticsOptimal}
              </span>
            )}
          </div>
          <div data-testid="kpi-inkable-ratio" className="font-cinzel text-4xl font-bold text-[#F1F5F9]">{Math.round(a.inkableRatio * 100)}%</div>
          <div data-testid="kpi-inkable-detail" className="mt-3 text-xs text-[#94A3B8] font-mono">
            {a.inkableCount} {t.inkable} <span className="mx-1 font-bold text-[#F59E0B]">/</span> {a.nonInkableCount} {th ? 'ใส่หมึกไม่ได้' : 'Non-inkable'}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="text-[#94A3B8] font-bold text-xs uppercase tracking-widest mb-4">{th ? 'Lore รวมของตัวละครทั้งเด็ค' : 'Total character lore'}</div>
          <div className="flex justify-between items-end">
            <div data-testid="kpi-lore" className="font-cinzel text-4xl font-bold text-[#F1F5F9]">
              {a.loreTotal} <span className="text-xs font-normal text-[#94A3B8]">Lore</span>
            </div>
            <Flame className="w-7 h-7 text-[#F59E0B]" />
          </div>
        </div>
      </section>

      {/* Main Charts Area */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2 flex flex-col">
          <h3 className="font-cinzel font-bold text-lg text-[#F1F5F9] mb-6 border-b border-[#30363d] pb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
            <span>{t.analyticsCurveDist}</span>
          </h3>
          <div className="flex items-end justify-between gap-1.5 pt-4">
            {a.costHistogram.map((n, cost) => {
              const chars = a.characterHistogram[cost];
              const label = cost === 10 ? '10+' : String(cost);
              return (
                <div key={cost} className="w-full flex flex-col items-center justify-end">
                  <div className={`mb-1 text-[10px] font-mono font-bold ${cost === peak && n > 0 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`}>{n}</div>
                  <div
                    role="img"
                    aria-label={th ? `Cost ${label}: ${n} ใบ (ตัวละคร ${chars})` : `Cost ${label}: ${n} cards (${chars} characters)`}
                    className="w-full max-w-[36px] flex flex-col justify-end rounded overflow-hidden border border-[#30363d]"
                    style={{ height: Math.round((n / maxCount) * CHART_PX) }}
                  >
                    <div className="w-full bg-purple-500/60" style={{ height: n > 0 ? `${((n - chars) / n) * 100}%` : 0 }}></div>
                    <div className="w-full bg-[#F59E0B]" style={{ height: n > 0 ? `${(chars / n) * 100}%` : 0 }}></div>
                  </div>
                  <div className={`mt-3 text-xs font-mono font-bold ${cost === peak && n > 0 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`}>{label}</div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center space-x-6 text-xs font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#F59E0B]"></div>
              <span className="text-[#F1F5F9]">{t.analyticsCharacters}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-500"></div>
              <span className="text-[#F1F5F9]">{th ? 'ประเภทอื่น' : 'Other types'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] flex flex-col">
          <h3 className="font-cinzel font-bold text-lg text-[#F1F5F9] mb-6 border-b border-[#30363d] pb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#F59E0B]" />
            <span>{t.analyticsTypeBreakdown}</span>
          </h3>
          <div className="flex-grow flex items-center justify-center relative py-4">
            <div
              className="w-44 h-44 rounded-full border-[14px] border-[#0B0F19] relative flex items-center justify-center"
              style={{ background: a.totalCards > 0 ? `conic-gradient(${stops})` : '#0B0F19', borderRadius: '50%' }}
            >
              <div className="absolute inset-0 m-auto w-28 h-28 bg-[#0B0F19] rounded-full flex flex-col items-center justify-center border border-[#30363d]">
                <span className="font-cinzel text-2xl font-bold text-[#F59E0B]">{a.totalCards}</span>
                <span className="text-[10px] text-[#94A3B8] uppercase tracking-widest font-bold">{t.totalCards}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold text-[#F1F5F9]">
            {types.map((ty) => (
              <div key={ty.key} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${ty.dot}`}></div>
                <span>
                  {ty.label} ({a.typeCounts[ty.key]})
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deck Optimization Insights */}
      <section className="bg-[#141a26] rounded-xl p-6 border border-[#30363d] space-y-4">
        <h2 className="font-cinzel font-bold text-xl text-[#F1F5F9] flex items-center gap-2 border-b border-[#30363d] pb-3">
          <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
          <span>{t.analyticsOptimizationTitle}</span>
        </h2>
        <div className="space-y-3" aria-live="polite">
          {insights.map((ins, i) => (
            <div key={i} className={`flex items-start p-4 rounded-lg bg-[#0B0F19] border gap-3 ${ins.tone === 'good' ? 'border-emerald-500/30' : 'border-rose-500/30'}`}>
              {ins.tone === 'good' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className={`font-bold text-sm mb-0.5 ${ins.tone === 'good' ? 'text-emerald-300' : 'text-rose-300'}`}>{ins.title}</h3>
                <p className="text-xs text-[#94A3B8]">{ins.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p data-testid="analyzed-at" className="text-[10px] text-[#94A3B8] font-mono flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {th ? 'คำนวณจากเด็คที่เลือกเมื่อ' : 'Computed from the selected deck at'} {new Date(a.analyzedAt).toLocaleString(th ? 'th-TH' : 'en-US')}
        </p>
      </section>
    </div>
  );
};
