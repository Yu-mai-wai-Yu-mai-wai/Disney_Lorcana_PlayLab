import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Zap, Shield, Sword, Award, RotateCw, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  content: React.ReactNode;
}

export const RulesGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);

  const steps: Step[] = [
    {
      id: 1,
      title: '1. เป้าหมายของเกม (Victory Goal)',
      subtitle: 'สะสมแต้ม Lore ให้ครบ 20 แต้มแรกเพื่อชนะ!',
      icon: Sparkles,
      color: 'from-amber-500 to-yellow-400',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <p>
            ในเกม <strong className="text-amber-300 font-cinzel">Disney Lorcana</strong> คุณจะรับบทเป็น <strong className="text-purple-300">Illumineer (นักวาดภาพเวทมนตร์)</strong> ที่ใช้หมึกเวทมนตร์อัญเชิญตัวละครดิสนีย์ (Glimmers) ออกมาทำเควสต์เพื่อรวบรวม <strong className="text-amber-300">Lore (แต้มตำนาน)</strong>
          </p>
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xl">20</div>
            <div>
              <h4 className="font-bold text-amber-300 text-base">เงื่อนไขการชนะ (Win Condition)</h4>
              <p className="text-xs text-slate-300">ผู้เล่นคนแรกที่สะสมแต้ม Lore ได้ครบ <strong>20 แต้ม</strong> จะเป็นผู้ชนะในแมตช์นั้นทันที!</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 2,
      title: '2. อ่านหน้าการ์ด (Card Anatomy)',
      subtitle: 'ทำความเข้าใจสัญลักษณ์สำคัญบนการ์ด',
      icon: Award,
      color: 'from-purple-500 to-indigo-400',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 text-xs">① Cost (ค่าร่าย)</span>
              <p className="text-xs">ตัวเลขมุมซ้ายบน ต้องจ่ายพลังงานหมึก Ink ใน Inkwell ให้ครบเพื่อร่ายลงสนาม</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-purple-400 text-xs">② Inkwell Icon (สัญลักษณ์หมึก)</span>
              <p className="text-xs">หากมีวงกลมทองรอบค่าร่าย สามารถนำการ์ดใบนี้คว่ำลง Inkwell เพื่อเปลี่ยนเป็นพลังงานได้</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400 text-xs">③ Strength ⚔️ / Willpower 🛡️</span>
              <p className="text-xs">พลังโจมตี (Strength) และพลังชีวิต (Willpower) เมื่อต่อสู้ (Challenge)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="font-bold text-amber-300 text-xs">④ Lore Value ✨</span>
              <p className="text-xs">จำนวนแต้ม Lore ที่ได้รับเมื่อสั่งตัวละครออกไปทำเควสต์ (Quest)</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: '3. ขั้นตอนการเล่นในแต่ละรอบ (Turn Structure)',
      subtitle: 'ท่องจำง่ายๆ: READY ➔ SET ➔ DRAW!',
      icon: RotateCw,
      color: 'from-sky-500 to-blue-600',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 flex items-start gap-3">
              <span className="px-2.5 py-1 rounded bg-purple-600 font-black text-white text-xs">READY</span>
              <p className="text-xs">ตั้งการ์ดทุกใบที่เอียงอยู่ (Exert 90°) กลับมาตั้งตรง (Ready 0°)</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 flex items-start gap-3">
              <span className="px-2.5 py-1 rounded bg-indigo-600 font-black text-white text-xs">SET</span>
              <p className="text-xs">ตรวจสอบเอฟเฟกต์การ์ดที่ทำงานตอนเริ่มรอบ</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 flex items-start gap-3">
              <span className="px-2.5 py-1 rounded bg-sky-600 font-black text-white text-xs">DRAW</span>
              <p className="text-xs">จั่วการ์ด 1 ใบจากกองเข้ามือ (ยกเว้นผู้เล่นที่เริ่มก่อนในรอบแรกสุด)</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: '4. การกระทำใน Main Phase (Action Options)',
      subtitle: 'เลือกทำกี่อย่างก็ได้ตามทรัพยากรที่มี',
      icon: Zap,
      color: 'from-emerald-500 to-teal-400',
      content: (
        <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
          <ul className="space-y-2.5 list-disc list-inside text-xs">
            <li><strong className="text-amber-300">ใส่การ์ดลง Inkwell:</strong> นำการ์ด 1 ใบจากมือ (ที่มีสัญลักษณ์ Inkwell) คว่ำลงบอร์ด 1 ใบต่อรอบ เพื่อเพิ่มพลังงานร่าย</li>
            <li><strong className="text-purple-300">ร่ายการ์ดลงสนาม:</strong> จ่าย Ink ตามค่าร่ายเพื่อลงตัวละคร หรือร่ายการ์ดเวทมนตร์ Action</li>
            <li><strong className="text-amber-400">สั่งทำเควสต์ (Quest):</strong> เอียงตัวละคร (Exert 90°) ➔ ได้รับแต้ม Lore ตามจำนวนบนการ์ด</li>
            <li><strong className="text-rose-400">สั่งต่อสู้ (Challenge):</strong> เอียงตัวละครตัวเอง ➔ ไปโจมตีตัวละครฝั่งตรงข้ามที่กำลัง Exert อยู่</li>
          </ul>
        </div>
      ),
    },
    {
      id: 5,
      title: '5. กฎการจัดเด็ค (Deck Building Rules)',
      subtitle: 'ข้อกำหนดในการสร้างกองการ์ด 60 ใบ',
      icon: BookOpen,
      color: 'from-rose-500 to-amber-500',
      content: (
        <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="font-bold text-amber-300 text-base">อย่างน้อย 60 ใบ</h5>
              <p className="text-[11px] text-slate-400 mt-1">กองการ์ดต้องมีความยาวไม่ต่ำกว่า 60 ใบ</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="font-bold text-purple-300 text-base">ไม่เกิน 4 ใบ</h5>
              <p className="text-[11px] text-slate-400 mt-1">ใส่การ์ดชื่อและฉายาเดียวกันได้ไม่เกิน 4 ใบในเด็ค</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h5 className="font-bold text-sky-300 text-base">ไม่เกิน 2 สีหมึก</h5>
              <p className="text-[11px] text-slate-400 mt-1">เลือกสีหมึกผสมกันได้ไม่เกิน 2 สีใน 1 เด็ค</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="glass-panel-heavy p-8 rounded-3xl border border-purple-500/30 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -z-10" />
        <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-amber-500/30 mb-4">
          <BookOpen className="w-8 h-8 text-amber-400 animate-pulse" />
        </div>
        <h1 className="font-cinzel font-black text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-purple-200 to-amber-400">
          คู่มือสอนเล่น DISNEY LORCANA (กติกาแบบจับมือทำ)
        </h1>
        <p className="text-xs md:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          ทำความเข้าใจกติกาพื้นฐาน 5 สเต็ปง่ายๆ พร้อมลุยเล่นบนกระดานซ้อม Playground Board ได้ทันที!
        </p>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = activeStep === step.id;

          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-br from-purple-950 to-slate-900 border-amber-400/60 shadow-xl scale-105'
                  : 'bg-slate-950/80 border-slate-800 hover:border-purple-500/40 text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-r ${step.color} text-slate-950 font-bold`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase text-purple-300">Step {step.id}</span>
              </div>
              <p className="font-bold text-xs text-white line-clamp-1">{step.title.split('. ')[1]}</p>
            </button>
          );
        })}
      </div>

      {/* Active Step Content Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="glass-panel-heavy p-8 rounded-3xl border border-purple-500/30 shadow-2xl space-y-6"
        >
          {(() => {
            const current = steps.find((s) => s.id === activeStep)!;
            const Icon = current.icon;

            return (
              <>
                <div className="flex items-center gap-4 pb-4 border-b border-slate-800">
                  <div className={`p-3 rounded-2xl bg-gradient-to-r ${current.color} text-slate-950 font-black shadow-lg`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-cinzel font-bold text-xl text-amber-200">{current.title}</h2>
                    <p className="text-xs text-purple-300/80">{current.subtitle}</p>
                  </div>
                </div>

                {current.content}

                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold disabled:opacity-40"
                  >
                    ย้อนกลับ
                  </button>

                  <button
                    onClick={() => setActiveStep((prev) => Math.min(5, prev + 1))}
                    disabled={activeStep === 5}
                    className="px-5 py-2 bg-gradient-to-r from-amber-400 to-purple-600 text-slate-950 font-black text-xs rounded-xl shadow flex items-center gap-1 disabled:opacity-40"
                  >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            );
          })()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
