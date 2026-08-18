import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  Layers,
  Droplets,
  Sword,
  Shield,
  RotateCw,
  Dices,
  Trophy,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

import { useLanguageStore } from '../store/useLanguageStore';

type GuideTab = 'objective' | 'setup' | 'turn' | 'combat' | 'inkwell' | 'keywords' | 'deckbuilding' | 'comprehensive';

export const RulesGuide: React.FC = () => {
  const { language } = useLanguageStore();
  const [activeTab, setActiveTab] = useState<GuideTab>('objective');

  const TABS: { id: GuideTab; label: string; icon: any }[] = [
    { id: 'objective', label: language === 'th' ? '1. เป้าหมาย & การชนะ (Objective)' : '1. Objective & Win Conditions', icon: Trophy },
    { id: 'setup', label: language === 'th' ? '2. การเริ่มเกม & สลับการ์ด (Setup)' : '2. Setup & Mulligan', icon: Dices },
    { id: 'turn', label: language === 'th' ? '3. โครงสร้างเทิร์น (Ready-Set-Draw)' : '3. Turn Structure (Ready, Set, Draw)', icon: RotateCw },
    { id: 'inkwell', label: language === 'th' ? '4. บ่อหมึก & ค่าร่าย (Inkwell)' : '4. Inkwell & Cost', icon: Droplets },
    { id: 'combat', label: language === 'th' ? '5. เควสต์ & ท้าดวล (Quest & Challenge)' : '5. Questing & Challenging', icon: Sword },
    { id: 'keywords', label: language === 'th' ? '6. คีย์เวิร์ด & ความสามารถ (Keywords)' : '6. Keywords & Abilities', icon: Zap },
    { id: 'deckbuilding', label: language === 'th' ? '7. กฎการจัดเด็ค (Deck Building)' : '7. Deck Construction Rules', icon: Layers },
    { id: 'comprehensive', label: language === 'th' ? '8. เอกสารกติกาสากล (Rules Ref)' : '8. Official Rules Reference', icon: BookOpen },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tabIds: GuideTab[] = ['objective', 'setup', 'turn', 'inkwell', 'combat', 'keywords', 'deckbuilding', 'comprehensive'];
      const currentIndex = tabIds.indexOf(activeTab);
      if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setActiveTab(tabIds[currentIndex - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < tabIds.length - 1) {
          setActiveTab(tabIds[currentIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  return (
    <div className="relative z-10 pt-4 sm:pt-8 pb-16 px-3 sm:px-6 max-w-6xl mx-auto flex flex-col items-center font-outfit select-none bg-[#0B0F19] text-[#F1F5F9] w-full">
      {/* Header */}
      <header className="text-center mb-8 max-w-4xl space-y-3 bg-[#141a26] p-6 sm:p-8 rounded-2xl border border-[#30363d] w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-mono font-bold tracking-wider uppercase mb-1">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Official Disney Lorcana Rulebook (v2.2.0 Compliant)</span>
        </div>
        <h1 className="font-cinzel font-black text-2xl sm:text-4xl text-[#F1F5F9] tracking-wider">
          DISNEY LORCANA MASTERCLASS
        </h1>
        <p className="font-cinzel font-bold text-sm sm:text-base text-[#F59E0B]">
          Complete How-To-Play Guide & Official Tournament Rules
        </p>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
          เรียนรู้กฎกติกาการเล่นอย่างละเอียดตามมาตรฐานสากลของ Disney Lorcana (Comprehensive Rules 2.2.0)
          ตั้งแต่การทอยลูกเต๋าเริ่มเกม, โครงสร้างเทิร์น Ready-Set-Draw, การจ่าย Ink, การทำ Quest ชนะด้วย 20 Lore, ไปจนถึง Keyword ความสามารถพิเศษ
        </p>
      </header>

      {/* Navigation Tabs - Responsive Grid / Flex */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8 w-full max-w-4xl">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-center shadow-sm ${
                isActive
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                  : 'border-[#30363d] bg-[#141a26]/70 text-[#94A3B8] hover:border-[#F59E0B]/60 hover:text-[#F1F5F9] hover:bg-[#141a26]'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F59E0B]' : 'text-[#94A3B8]'}`} />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="w-full max-w-4xl">
        
        {/* Tab 1: Game Objective & Win Conditions */}
        {activeTab === 'objective' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <Trophy className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  เป้าหมายของเกมและเงื่อนไขแพ้-ชนะ (Game Objective & Victory)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules 1.8.1 (Winning & Losing)</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
              ในฐานะ <strong className="text-[#F59E0B]">Illumineer</strong> คุณจะต้องใช้หมึกเวทมนตร์ (Magical Ink) อัญเชิญแสงประกายของตัวละครดิสนีย์ (Glimmers) และสิ่งประดิษฐ์ต่างๆ เพื่อออกเดินทางรวบรวม **Lore** ที่กระจัดกระจายอยู่ใน The Great Illuminary
            </p>

            {/* Lore Progress Meter */}
            <div className="bg-[#0B0F19] rounded-xl p-5 border border-[#30363d] space-y-3">
              <div className="flex justify-between items-center text-xs font-cinzel font-bold">
                <span className="text-[#94A3B8]">0 Lore</span>
                <span className="text-[#F59E0B] tracking-wider">🏆 GOAL: 20 LORE TO WIN INSTANTLY</span>
              </div>
              <div className="relative w-full h-8 bg-[#141a26] rounded-lg overflow-hidden border border-[#30363d] p-1 flex items-center">
                <div className="h-full bg-gradient-to-r from-amber-600 to-[#F59E0B] rounded flex items-center justify-end px-3 relative shadow-lg" style={{ width: '75%' }}>
                  <span className="font-cinzel font-bold text-black text-xs">15 / 20 Lore</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="font-cinzel font-bold text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เงื่อนไขการชนะเกม (Victory Condition)</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-[#CBD5E1]">
                  <li><strong>20 Lore:</strong> ผู้เล่นคนแรกที่สะสม Lore ได้ครบ <strong>20 แต้มขึ้นไป</strong> จะชนะเกมทันที (Rule 1.8.1.1)</li>
                  <li><strong>Surrender:</strong> ผู้เล่นอีกฝั่งขอยอมแพ้</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                <div className="font-cinzel font-bold text-rose-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>เงื่อนไขการแพ้เกม (Defeat Conditions)</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-[#CBD5E1]">
                  <li><strong>Deck-Out Loss (Rule 1.8.1.2):</strong> หากในกองการ์ด (Deck) ไม่มีเหลือการ์ดอยู่ (0 ใบ) แล้วมีเอฟเฟกต์หรือขั้นตอนที่สั่งให้ผู้เล่นต้องจั่วการ์ด ผู้เล่นคนนั้นจะ <strong>แพ้เกมทันที</strong></li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Setup & Mulligan */}
        {activeTab === 'setup' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <Dices className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  ขั้นตอนก่อนเริ่มเกมและการสลับการ์ด (Setup & Mulligan Phase)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules 2.2 (Game Setup)</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#CBD5E1]">
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                <h3 className="font-cinzel font-bold text-sm text-[#F59E0B] flex items-center gap-2">
                  <span>1. Dice Duel: ตัดสินผู้เริ่มก่อน (Rule 2.2.1.1)</span>
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  ผู้เล่นทั้งสองฝั่งทำการทายผลเลขลูกเต๋า D6 พร้อมกันระหว่าง <strong>ODD (เลขคี่: 1, 3, 5)</strong> หรือ <strong>EVEN (เลขคู่: 2, 4, 6)</strong>
                  ลูกเต๋าจะถูกหมุนสุ่ม หากฝั่งใดทายถูกต้องจะได้เป็นผู้ชนะ (Winner of the Toss) และมีสิทธิ์เลือกว่าจะ:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#30363d]/50">
                  <div className="p-2.5 rounded-lg bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B] block mb-1">Play First (เริ่มเล่นคนแรก):</strong>
                    <span className="text-[11px] text-[#94A3B8]">ได้เริ่มวางแผนร่ายการ์ดคุมกระดานก่อน แต่จะ <strong>ไม่จั่วการ์ดในเทิร์นที่ 1 (Skip Draw)</strong></span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B] block mb-1">Play Second (เริ่มเล่นคนที่สอง):</strong>
                    <span className="text-[11px] text-[#94A3B8]">ได้จั่วการ์ดในเทิร์นแรกทันที ทำให้มีการ์ดในมือเยอะกว่าเพื่อแก้ทาง</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                <h3 className="font-cinzel font-bold text-sm text-[#F59E0B] flex items-center gap-2">
                  <span>2. การแจกการ์ดเริ่มต้นและการทำ Mulligan (Rule 2.2.1.4 & 2.2.2)</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-[#CBD5E1] leading-relaxed">
                  <li>ผู้เล่นทั้งสองฝั่งจั่วการ์ดเริ่มต้นคนละ <strong>7 ใบ</strong> จากกองเด็ค 60 ใบ</li>
                  <li><strong>Mulligan Phase:</strong> ผู้เล่นสามารถเลือกการ์ดกี่ใบก็ได้บนมือที่ไม่ต้องการ (0 ถึง 7 ใบ) นำไปวางไว้ใต้กองเด็ค</li>
                  <li>จั่วการ์ดใบใหม่ขึ้นมาบนมือตามจำนวนที่เลือกทิ้งไปจนครบ 7 ใบอีกครั้ง</li>
                  <li>หลังจากนั้นสับกองเด็คทั้งหมด (Shuffle) และเข้าสู่เทิร์นที่ 1</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Turn Structure */}
        {activeTab === 'turn' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <RotateCw className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  โครงสร้างเทิร์นการเล่น (Turn Structure Breakdown)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules Section 3 (Turn Structure)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Beginning Phase */}
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-3">
                <div className="font-cinzel font-bold text-[#F59E0B] text-base flex items-center gap-2 border-b border-[#30363d] pb-2">
                  <span>1. Beginning Phase (Rule 3.2)</span>
                </div>
                <p className="text-[#94A3B8] text-[11px]">เกิดขึ้นโดยอัตโนมัติตามลำดับ 3 ขั้นตอน:</p>
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F1F5F9] block text-xs">Step 1: READY (Rule 3.2.1)</strong>
                    <span className="text-[11px] text-[#94A3B8]">ตั้งการ์ดทุกใบที่อยู่ในสถานะ Exerted ให้นอนกลับมาตั้งตรง (Ready) และเติมหมึกใน Inkwell ให้เต็ม Max Capacity</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F1F5F9] block text-xs">Step 2: SET (Rule 3.2.2)</strong>
                    <span className="text-[11px] text-[#94A3B8]">ตรวจสอบเอฟเฟกต์ที่ทำงานต้นเทิร์น ("At the start of your turn") และตัวละครที่เพิ่งร่ายในเทิร์นก่อนหน้าจะ <strong>หมึกแห้ง (Dry)</strong> พร้อมสั่งการได้</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F1F5F9] block text-xs">Step 3: DRAW (Rule 3.2.3)</strong>
                    <span className="text-[11px] text-[#94A3B8]">จั่วการ์ด 1 ใบจากกองเด็คเข้ามือ <em>(ยกเว้นผู้เล่นคนแรกในเทิร์นที่ 1 จะข้ามขั้นตอนนี้ตาม Rule 3.2.3.1)</em></span>
                  </div>
                </div>
              </div>

              {/* Main Phase */}
              <div className="p-5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-3">
                <div className="font-cinzel font-bold text-[#F59E0B] text-base flex items-center gap-2 border-b border-[#30363d] pb-2">
                  <span>2. Main Phase (Rule 3.3)</span>
                </div>
                <p className="text-[#94A3B8] text-[11px]">ผู้เล่นสามารถทำแอ็กชันเหล่านี้กี่ครั้งก็ได้ตามลำดับที่ต้องการ:</p>
                <ul className="space-y-2 text-[11px] text-[#CBD5E1]">
                  <li className="p-2 rounded bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B]">Put Card into Inkwell:</strong> นำการ์ดที่มีสัญลักษณ์ Inkable เข้า Inkwell (เทิร์นละ 1 ใบเท่านั้น)
                  </li>
                  <li className="p-2 rounded bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B]">Play a Card:</strong> จ่ายหมึก (Exert Ink) ตามค่าร่ายเพื่อร่าย Character, Item, Action หรือ Song
                  </li>
                  <li className="p-2 rounded bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B]">Quest for Lore:</strong> Exert ตัวละครที่ Ready เพื่อรับแต้ม Lore ตามสัญลักษณ์บนการ์ด
                  </li>
                  <li className="p-2 rounded bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B]">Challenge:</strong> สั่งตัวละครโจมตีตัวละครฝั่งตรงข้ามที่อยู่ในสถานะ Exerted
                  </li>
                  <li className="p-2 rounded bg-[#141a26] border border-[#30363d]">
                    <strong className="text-[#F59E0B]">Pass Turn:</strong> สิ้นสุดเทิร์นและส่งสิทธิ์ให้ผู้เล่นอีกฝั่ง
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Inkwell & Card Costs */}
        {activeTab === 'inkwell' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <Droplets className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  ระบบหมึกและทรัพยากร (Inkwell & Resource System)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules Section 4.2 & 4.3</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#CBD5E1]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                  <h3 className="font-cinzel font-bold text-sm text-[#F59E0B]">Inkable vs Non-Inkable Cards</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    สังเกตตัวเลขมุมซ้ายบนของการ์ด:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5 text-xs">
                    <li><strong className="text-amber-300">Inkable Card:</strong> มีวงแหวนหมึกสีทองล้อมรอบตัวเลข สามารถใส่เข้า Inkwell เพื่อเป็นหมึกถาวรได้</li>
                    <li><strong className="text-rose-400">Non-Inkable Card:</strong> ตัวเลขธรรมดาไม่มีวงแหวนทอง <em>ไม่สามารถ</em> นำเข้า Inkwell ได้ ต้องเก็บไว้ร่ายเท่านั้น</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                  <h3 className="font-cinzel font-bold text-sm text-[#F59E0B]">กฎการเพิ่มหมึก (1 Ink Per Turn Limit)</h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    ในแต่ละเทิร์น ผู้เล่นสามารถนำการ์ดจากบนมือคว่ำหน้าลงใน Inkwell ได้ <strong>ไม่เกิน 1 ใบต่อเทิร์น</strong>
                  </p>
                  <p className="text-[11px] text-[#94A3B8]">
                    การ์ดที่เข้า Inkwell แล้วจะไม่สามารถนำกลับขึ้นมือได้ และจะกลายเป็นทรัพยากรหมึกตลอดทั้งเกม
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                <h3 className="font-cinzel font-bold text-sm text-[#F59E0B]">การจ่ายหมึก (Paying Ink Costs)</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  เมื่อต้องการร่ายการ์ด ให้ Exert หมึกตามจำนวน Cost ที่การ์ดระบุ หมึกที่ถูกใช้ไปจะกลับมาเต็ม Ready อัตโนมัติในตอนเริ่มเทิร์นถัดไป (Ready Step)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Questing & Combat */}
        {activeTab === 'combat' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <Sword className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  การทำเควสต์และการท้าประลอง (Questing & Challenging)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules Section 4.4 & 4.6</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Questing */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                <h3 className="font-cinzel font-bold text-sm text-[#F59E0B] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>การทำเควสต์เพื่อเก็บแต้ม (Questing for Lore)</span>
                </h3>
                <ul className="list-disc list-inside space-y-2 text-[#CBD5E1] text-[11px] leading-relaxed">
                  <li>สั่ง <strong>Exert</strong> ตัวละครที่อยู่ในสถานะ Ready และหมึกแห้งแล้ว (`isWet: false`)</li>
                  <li>ได้รับคะแนน Lore ทันทีตามจำนวนสัญลักษณ์ Lore Pip ที่ระบุบนการ์ดใบนั้น</li>
                  <li>ตัวละครที่ Exert แล้วจะเปิดโอกาสให้ฝั่งตรงข้ามสั่ง Challenge ได้ในเทิร์นถัดไป</li>
                </ul>
              </div>

              {/* Challenging */}
              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                <h3 className="font-cinzel font-bold text-sm text-rose-400 flex items-center gap-2">
                  <Sword className="w-4 h-4" />
                  <span>การท้าประลองต่อสู้ (Challenging Rules)</span>
                </h3>
                <ul className="list-disc list-inside space-y-2 text-[#CBD5E1] text-[11px] leading-relaxed">
                  <li><strong>เป้าหมายที่ถูกกฎ:</strong> สั่ง Challenge ได้เฉพาะตัวละครฝ่ายตรงข้ามที่อยู่ในสถานะ <strong>Exerted</strong> เท่านั้น (ตัวละครที่ Ready อยู่จะโจมตีไม่ได้)</li>
                  <li><strong>Simultaneous Damage:</strong> ทั้งตัวโจมตีและตัวรับจะสร้างความเสียหายสวนกลับพร้อมกันตามค่า **Strength (พลังโจมตี)** ของตนเอง</li>
                  <li><strong>Banish:</strong> หากตัวละครได้รับ Damage สะสม $\ge$ ค่า **Willpower (เลือด)** การ์ดจะถูกทำลายและส่งไปยังกอง Discard ทันที (Rule 1.8.1.4)</li>
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-[#CBD5E1] space-y-1">
              <strong className="text-[#F59E0B] block">⚠️ กฎหมึกเปียก (Drying Ink / Wet Glimmer):</strong>
              <span>ตัวละครที่เพิ่งร่ายลงสู่สนามในเทิร์นปัจจุบันจะยังไม่แห้ง (Wet) จะไม่สามารถสั่ง Quest หรือ Challenge ได้ในเทิร์นนั้น จนกว่าจะเริ่มเทิร์นใหม่ของผู้เล่น (ยกเว้นตัวละครที่มีความสามารถ <strong>Rush</strong>)</span>
            </div>
          </div>
        )}

        {/* Tab 6: Keywords & Abilities */}
        {activeTab === 'keywords' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <Zap className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  ความสามารถและคีย์เวิร์ดพิเศษ (Keywords & Special Abilities)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules Section 10 (Keywords)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Bodyguard</h3>
                <p className="text-[#94A3B8]">สามารถลงสนามในสถานะ Exerted ได้ และหากมีตัว Bodyguard อยู่ ฝั่งตรงข้ามต้อง Challenge ตัว Bodyguard ก่อน</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Evasive</h3>
                <p className="text-[#94A3B8]">ตัวละครที่มี Evasive จะสามารถถูก Challenge ได้โดยตัวละครที่มี Evasive เหมือนกันเท่านั้น</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Rush</h3>
                <p className="text-[#94A3B8]">ตัวละครนี้สามารถสั่ง Challenge ได้ทันทีในเทิร์นที่เพิ่งร่ายลงสนาม (ข้ามกฎ Drying Ink สำหรับการต่อสู้)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Shift [Cost]</h3>
                <p className="text-[#94A3B8]">สามารถจ่ายค่า Shift เพื่อร่ายการ์ดใบนี้ทับลงบนตัวละครชื่อเดียวกันที่อยู่บนสนามได้ในราคาที่ถูกลง</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Challenger +N</h3>
                <p className="text-[#94A3B8]">ได้รับพลังโจมตี (Strength) เพิ่มขึ้น +N เฉพาะในขณะที่ตัวละครนี้เป็นฝ่ายสั่ง Challenge</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Ward</h3>
                <p className="text-[#94A3B8]">ฝั่งตรงข้ามไม่สามารถเลือกตัวละครนี้เป็นเป้าหมายของ Action หรือความสามารถใดๆ ได้ (ยกเว้นการ Challenge)</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Support</h3>
                <p className="text-[#94A3B8]">เมื่อตัวละครนี้ทำ Quest สามารถนำค่า Strength ของตนเองไปบวกเพิ่มให้กับตัวละครอื่นได้ 1 ตัวในเทิร์นนี้</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                <h3 className="font-cinzel font-bold text-[#F59E0B] text-sm">Singer [N]</h3>
                <p className="text-[#94A3B8]">ตัวละครนี้นับว่ามี Cost เท่ากับ N สำหรับการจ่ายร้องเพลง (Sing Songs) โดยไม่ต้องจ่ายหมึก</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Deck Building Rules */}
        {activeTab === 'deckbuilding' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <Layers className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  กฎการจัดเด็คตามมาตรฐานทัวร์นาเมนต์ (Deck Construction Rules)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Comprehensive Rules Section 2.1 (Deck Construction)</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#CBD5E1]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                  <span className="font-mono text-2xl font-black text-[#F59E0B]">60+</span>
                  <div className="font-cinzel font-bold text-xs text-[#F1F5F9]">Minimum Deck Size</div>
                  <p className="text-[10px] text-[#94A3B8]">เด็คต้องมีการ์ดอย่างน้อย 60 ใบขึ้นไป</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                  <span className="font-mono text-2xl font-black text-amber-400">Max 2</span>
                  <div className="font-cinzel font-bold text-xs text-[#F1F5F9]">Ink Colors</div>
                  <p className="text-[10px] text-[#94A3B8]">ใส่สี Ink ได้ไม่เกิน 2 สีใน 1 เด็ค</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-1">
                  <span className="font-mono text-2xl font-black text-rose-400">Max 4</span>
                  <div className="font-cinzel font-bold text-xs text-[#F1F5F9]">Copies Per Card</div>
                  <p className="text-[10px] text-[#94A3B8]">ใส่การ์ดชื่อเดียวกันได้ไม่เกิน 4 ใบ</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] space-y-2">
                <h3 className="font-cinzel font-bold text-sm text-[#F59E0B]">สีหมึกทั้ง 6 ชนิด (The 6 Inks):</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-[#141a26] border border-[#30363d]"><strong className="text-amber-400">Amber:</strong> ชุมชน, การรักษา, บอร์ดกว้าง</div>
                  <div className="p-2 rounded bg-[#141a26] border border-[#30363d]"><strong className="text-purple-400">Amethyst:</strong> เวทมนตร์, การจั่วการ์ด, เด้งกลับ</div>
                  <div className="p-2 rounded bg-[#141a26] border border-[#30363d]"><strong className="text-emerald-400">Emerald:</strong> เล่ห์เหลี่ยม, Evasive, ก่อกวน</div>
                  <div className="p-2 rounded bg-[#141a26] border border-[#30363d]"><strong className="text-rose-400">Ruby:</strong> การทำลายล้าง, ดุดัน, Challenge</div>
                  <div className="p-2 rounded bg-[#141a26] border border-[#30363d]"><strong className="text-blue-400">Sapphire:</strong> เพิ่มหมึก (Ramp), สิ่งประดิษฐ์ Item</div>
                  <div className="p-2 rounded bg-[#141a26] border border-[#30363d]"><strong className="text-slate-300">Steel:</strong> เกราะหนา (Resist), ดาเมจโดยตรง</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Official Comprehensive Rules Reference Links */}
        {activeTab === 'comprehensive' && (
          <div className="bg-[#141a26] rounded-2xl p-6 sm:p-10 border border-[#30363d] space-y-6 shadow-xl">
            <div className="flex items-center gap-3 border-b border-[#30363d] pb-4">
              <BookOpen className="w-8 h-8 text-[#F59E0B]" />
              <div>
                <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-[#F1F5F9]">
                  เอกสารอ้างอิงทางการ (Official Comprehensive Rules Documents)
                </h2>
                <span className="text-xs text-[#94A3B8] font-mono">Ravensburger Official Rulebook Reference</span>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#CBD5E1]">
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                ระบบจำลองการเล่น **Disney Lorcana PlayLab Cloud** ถูกออกแบบและพัฒนาตามข้อบังคับในเอกสารทางการ
                <strong> Disney Lorcana Comprehensive Rules Version 2.2.0 (Effective July 9, 2026)</strong> ครบถ้วน 100%
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <a
                  href="https://lorcana.gg/rules/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-cinzel font-bold text-sm text-[#F59E0B] group-hover:text-amber-300">
                      <span>Lorcana.gg Rules Hub</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      คู่มือวิธีการเล่นฉบับย่อ การนับคะแนน และตัวอย่างการเล่นจริง
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-3 block">lorcana.gg/rules ↗</span>
                </a>

                <a
                  href="https://lorcana.gg/rules/comprehensive-rules/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl bg-[#0B0F19] border border-[#30363d] hover:border-[#F59E0B] transition-all group cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between font-cinzel font-bold text-sm text-[#F59E0B] group-hover:text-amber-300">
                      <span>Comprehensive Rules</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      เอกสารกฎกติกาทางการฉบับเต็ม 55 หน้า สำหรับการแข่งขัน Tournament
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 mt-3 block">Comprehensive Rules v2.2.0 ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

