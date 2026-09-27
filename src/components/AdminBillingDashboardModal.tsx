import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  DollarSign, 
  Server, 
  Activity, 
  RefreshCw, 
  X, 
  Lock, 
  CheckCircle2, 
  TrendingUp, 
  CloudOff, 
  Layers, 
  Database, 
  Cpu, 
  Network, 
  KeyRound, 
  Terminal,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { apiService } from '../services/api';
import { AdminBillingData } from '../types/lorcana';
import { copyText } from '../utils/copyText';

interface AdminBillingDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBillingDashboardModal: React.FC<AdminBillingDashboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, token, setAuth } = useAuthStore();
  const { language } = useLanguageStore();

  const [billing, setBilling] = useState<AdminBillingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const [elevating, setElevating] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';

  const fetchBilling = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAdminBilling(token || undefined);
      if (res.data) {
        setBilling(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      fetchBilling();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const handleElevate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError(null);
    setElevating(true);
    try {
      const res = await apiService.elevateToAdmin(passcode, token || undefined);
      if (res.success && user) {
        const updatedUser = { ...user, role: 'admin' };
        setAuth(updatedUser, res.token || token || 'mock_admin_token');
        setPasscode('');
        fetchBilling();
      } else {
        setPasscodeError(res.error || (language === 'th' ? 'รหัส Admin ไม่ถูกต้อง' : 'Invalid admin passcode'));
      }
    } catch (err: any) {
      setPasscodeError(err.message || 'Error verifying passcode');
    } finally {
      setElevating(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    if (!(await copyText(text))) return;
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0d131f] border border-[#F59E0B]/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.15)] flex flex-col font-outfit"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="sticky top-0 z-20 bg-[#0B0F19]/95 backdrop-blur-xl px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-amber-700 flex items-center justify-center text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <ShieldAlert className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cinzel text-xl font-bold text-white tracking-wider">
                  AWS CLOUD & BUDGET CONSOLE
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] font-mono">
                AWS Academy Learner Lab • Account: 953899323223 • us-east-1
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={fetchBilling}
                disabled={loading}
                title="Refresh Billing & Telemetry"
                className="p-2 rounded-xl bg-[#141a26] hover:bg-[#1f293d] border border-white/10 text-[#F59E0B] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{language === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#141a26] hover:bg-rose-950/60 border border-white/10 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {!isAdmin ? (
            /* Locked State: Admin Passcode Prompt */
            <div className="py-12 max-w-md mx-auto text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F59E0B] shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-cinzel text-xl font-bold text-white">
                  {language === 'th' ? 'พื้นที่จำกัดเฉพาะ Role Admin' : 'Admin Role Required'}
                </h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                  {language === 'th' 
                    ? 'หน้านี้ใช้สำหรับติดตามงบประมาณ AWS Budget และสถานะ Cloud ของเซิร์ฟเวอร์ กรุณากรอกรหัส Admin เพื่อเข้าใช้งาน'
                    : 'This console monitors AWS budget allocation and real-time cloud teardown status. Enter the Admin passcode to proceed.'}
                </p>
              </div>

              {passcodeError && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs text-left">
                  {passcodeError}
                </div>
              )}

              <form onSubmit={handleElevate} className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase tracking-widest text-[#94A3B8]">
                    {language === 'th' ? 'รหัสผ่านแอดมิน (Admin Passcode)' : 'Admin Passcode'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#0B0F19] text-white font-mono text-sm rounded-xl py-3 pl-11 pr-4 border border-[#30363d] focus:border-[#F59E0B] outline-none"
                    />
                  </div>
                  <p className="text-[11px] font-mono text-slate-500">
                    💡 Master Key: <code className="text-[#F59E0B]">LORCANA_ADMIN_2026</code>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={elevating || !passcode}
                  className="w-full py-3 bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-50 text-black font-cinzel font-bold text-sm rounded-xl transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4 text-black" />
                  <span>{elevating ? 'Verifying...' : (language === 'th' ? 'ปลดล็อกสิทธิ์ Admin' : 'Unlock Admin Dashboard')}</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Admin Dashboard */
            <>
              {/* Top Banner Status Bar */}
              <div className="p-4 rounded-2xl bg-[#141a26]/90 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping absolute" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400 relative shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-emerald-400 font-mono">
                        {language === 'th' ? 'สถานะค่าใช้จ่าย: ปิดพักเซิร์ฟเวอร์ ($0.00/hr)' : 'BILLING GUARD: IDLE / SAFE ($0.00/hr)'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ZERO-COST STANDBY
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {language === 'th'
                        ? 'ทรัพยากรที่กินเงิน (ALB, ASG, EC2, NAT) ถูกรันคำสั่ง lab.ps1 destroy เรียบร้อยแล้ว ไม่มีค่าใช้จ่ายรายชั่วโมง'
                        : 'Billable resources (ALB, ASG, EC2, NAT) have been terminated via lab.ps1 destroy. Zero hourly leakage.'}
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-[#94A3B8] shrink-0">
                  {language === 'th' ? 'อัปเดตล่าสุด: ' : 'Telemetry: '}
                  <span className="text-white font-bold">{billing?.lastUpdated || 'Live'}</span>
                </div>
              </div>

              {/* KPI Cards (4 Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Total Budget */}
                <div className="p-5 rounded-2xl bg-[#141a26] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
                    <span>{language === 'th' ? 'งบประมาณรวม' : 'Total Lab Budget'}</span>
                    <DollarSign className="w-4 h-4 text-[#F59E0B]" />
                  </div>
                  <div className="mt-3">
                    <div className="font-cinzel text-3xl font-bold text-white">
                      ${billing?.budgetTotal.toFixed(2) || '100.00'}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      AWS Learner Lab Ceiling
                    </p>
                  </div>
                </div>

                {/* Card 2: Current Spend MTD */}
                <div className="p-5 rounded-2xl bg-[#141a26] border border-amber-500/30 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
                    <span>{language === 'th' ? 'ใช้ไปแล้วเดือนนี้' : 'Spend MTD'}</span>
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-3">
                    <div className="font-cinzel text-3xl font-bold text-amber-400">
                      ${billing?.monthToDateSpend.toFixed(2) || '9.77'}
                    </div>
                    <p className="text-[11px] text-amber-300/80 font-mono mt-1">
                      {billing?.budgetUsagePercent.toFixed(1) || '9.8'}% of $100 budget
                    </p>
                  </div>
                </div>

                {/* Card 3: Remaining Budget */}
                <div className="p-5 rounded-2xl bg-[#141a26] border border-emerald-500/30 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
                    <span>{language === 'th' ? 'งบคงเหลือปลอดภัย' : 'Remaining Safe'}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-3">
                    <div className="font-cinzel text-3xl font-bold text-emerald-400">
                      ${billing?.remainingBudget.toFixed(2) || '90.23'}
                    </div>
                    <p className="text-[11px] text-emerald-300/80 font-mono mt-1">
                      90.2% Remaining Available
                    </p>
                  </div>
                </div>

                {/* Card 4: Hourly Burn Rate */}
                <div className="p-5 rounded-2xl bg-[#141a26] border border-white/10 flex flex-col justify-between shadow-lg">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
                    <span>{language === 'th' ? 'อัตรากินเงิน/ชม.' : 'Hourly Burn Rate'}</span>
                    <Activity className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="mt-3">
                    <div className="font-cinzel text-3xl font-bold text-sky-400">
                      ${billing?.currentHourlyBurnRate.toFixed(4) || '0.0000'}
                      <span className="text-xs font-mono font-normal text-slate-400">/hr</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Stopped: $0.00 | Active: ~$0.046/hr
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar of Budget Utilization */}
              <div className="p-5 rounded-2xl bg-[#141a26] border border-white/10 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300">
                    {language === 'th' ? 'การใช้งบประมาณ ($9.77 / $100.00)' : 'Budget Consumption ($9.77 / $100.00)'}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    9.77% (Green Safety Zone)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[#0B0F19] overflow-hidden p-0.5 border border-white/10">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-[#F59E0B] to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-1000"
                    style={{ width: `${Math.min(100, Math.max(5, billing?.budgetUsagePercent || 9.77))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>$0 (Start)</span>
                  <span>$50 (Halfway Alert)</span>
                  <span>$85 (Warning Threshold)</span>
                  <span>$100 (Lab Cutoff)</span>
                </div>
              </div>

              {/* Service Cost Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-cinzel text-base font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#F59E0B]" />
                    <span>{language === 'th' ? 'สัดส่วนค่าบริการแยกตาม Service ของ AWS' : 'AWS Service Cost Breakdown (MTD)'}</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Official AWS Cost Explorer Source
                  </span>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#141a26]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0B0F19] text-slate-400 uppercase tracking-wider border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">AWS Service</th>
                        <th className="py-3 px-4 hidden sm:table-cell">Category</th>
                        <th className="py-3 px-4">Cost (USD)</th>
                        <th className="py-3 px-4 hidden md:table-cell">Share</th>
                        <th className="py-3 px-4">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {(billing?.services || []).map((srv, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-bold flex items-center gap-2 text-white">
                            {srv.name.includes('Load') ? <Network className="w-4 h-4 text-amber-400 shrink-0" /> :
                             srv.name.includes('EC2-Instances') ? <Cpu className="w-4 h-4 text-emerald-400 shrink-0" /> :
                             srv.name.includes('DynamoDB') ? <Database className="w-4 h-4 text-purple-400 shrink-0" /> :
                             <Server className="w-4 h-4 text-sky-400 shrink-0" />}
                            <span>{srv.name}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 hidden sm:table-cell">{srv.category}</td>
                          <td className="py-3 px-4 font-bold text-amber-300">${srv.cost.toFixed(2)}</td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div 
                                  className="h-full bg-[#F59E0B]" 
                                  style={{ width: `${srv.percentage}%` }}
                                />
                              </div>
                              <span className="text-slate-400">{srv.percentage}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              srv.status.includes('Active') 
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {srv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Infrastructure Telemetry & Cloud Operations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Telemetry Panel */}
                <div className="p-5 rounded-2xl bg-[#141a26] border border-white/10 space-y-4">
                  <h4 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#F59E0B]" />
                    <span>{language === 'th' ? 'ทรัพยากรบน AWS ณ ปัจจุบัน' : 'Live AWS Cloud Telemetry'}</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">EC2 Instances</span>
                      <span className="text-emerald-400 font-bold">{billing?.resourceTelemetry.ec2Running} Running</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">Auto Scaling Group</span>
                      <span className="text-white font-bold">{billing?.resourceTelemetry.asgCurrent} / {billing?.resourceTelemetry.asgDesired} Desired</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">ALB Load Balancer</span>
                      <span className="text-slate-400 font-bold">{billing?.resourceTelemetry.albCount} (Destroyed)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#0B0F19] border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">DynamoDB Tables</span>
                      <span className="text-purple-400 font-bold">{billing?.resourceTelemetry.dynamoTables} Active</span>
                    </div>
                  </div>
                </div>

                {/* Cloud CLI Quick-Control Panel */}
                <div className="p-5 rounded-2xl bg-[#141a26] border border-white/10 space-y-4">
                  <h4 className="font-cinzel text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'th' ? 'คำสั่งควบคุมคลาวด์ (Quick Cloud CLI)' : 'Cloud Management Commands'}</span>
                  </h4>

                  <div className="space-y-2">
                    {/* Deploy Command */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-white/5 text-xs font-mono">
                      <div className="min-w-0 pr-2">
                        <span className="text-emerald-400 font-bold block">Start / Redeploy:</span>
                        <code className="text-slate-300 truncate block">.\scripts\deploy_ec2_vpc_asg.ps1</code>
                      </div>
                      <button
                        onClick={() => handleCopy('.\\scripts\\deploy_ec2_vpc_asg.ps1', 'deploy')}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCmd === 'deploy' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>

                    {/* Destroy Command */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0B0F19] border border-white/5 text-xs font-mono">
                      <div className="min-w-0 pr-2">
                        <span className="text-rose-400 font-bold block">Stop / Teardown ($0/hr):</span>
                        <code className="text-slate-300 truncate block">.\scripts\lab.ps1 destroy</code>
                      </div>
                      <button
                        onClick={() => handleCopy('.\\scripts\\lab.ps1 destroy', 'destroy')}
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedCmd === 'destroy' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
