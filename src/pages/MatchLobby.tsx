import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { webSocketService } from '../services/websocket';
import { MatchDeckSelect } from '../components/MatchDeckSelect';
import { apiService } from '../services/api';
import { STARTER_POOL } from '../data/cardPool';
import { Swords, LogIn, Plus, Loader2, X, AlertCircle, Palette, Sparkles, Copy, Check } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { usePlaymatStore } from '../store/usePlaymatStore';
import { PlaymatSelectorModal } from '../components/PlaymatSelectorModal';

interface MatchLobbyProps {
  onStartMatch: (deckId: string, deckName: string, roomId?: string, role?: string, deckObject?: any, isRejoin?: boolean) => void;
}

export const MatchLobby: React.FC<MatchLobbyProps> = ({ onStartMatch }) => {
  const { user, token, isAuthenticated } = useAuthStore();
  const { t, language } = useLanguageStore();
  const { getCurrentPlaymat } = usePlaymatStore();
  const currentPlaymat = getCurrentPlaymat();
  const [isPlaymatModalOpen, setIsPlaymatModalOpen] = useState(false);
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDeckName, setSelectedDeckName] = useState<string>('');
  const [selectedDeckObj, setSelectedDeckObj] = useState<any | null>(null);
  
  const [joinCode, setJoinCode] = useState('');
  const [roomState, setRoomState] = useState<'IDLE' | 'CREATED' | 'WAITING' | 'MATCH_FOUND'>('IDLE');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSession, setSavedSession] = useState<{ roomId: string; role: 'player1' | 'player2'; deckId: string; deckName: string; timestamp: number } | null>(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);

  // Load active session from localStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lorcana_active_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only consider session valid if within last 1 hour
        if (parsed && parsed.roomId && Date.now() - (parsed.timestamp || 0) < 3600000) {
          setSavedSession(parsed);
        } else {
          localStorage.removeItem('lorcana_active_session');
        }
      }
    } catch (e) {
      console.error('Failed to read saved session', e);
    }
  }, []);

  const handleRejoinSession = async () => {
    if (!savedSession) return;
    await webSocketService.connect(user?.username);
    webSocketService.setRole(savedSession.role);
    webSocketService.setRoomId(savedSession.roomId);
    webSocketService.rejoinRoom(savedSession.roomId, savedSession.deckId, savedSession.deckName);

    const deckObj = decks.find(d => d.deckId === savedSession.deckId) || {
      deckId: savedSession.deckId,
      name: savedSession.deckName,
      cards: [],
    };
    onStartMatch(savedSession.deckId, savedSession.deckName, savedSession.roomId, savedSession.role, deckObj, true);
  };

  const handleDismissSession = () => {
    localStorage.removeItem('lorcana_active_session');
    setSavedSession(null);
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      loadDecks();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const unsubRoomCreated = webSocketService.subscribe('ROOM_CREATED', (data) => {
      setRoomState('CREATED');
      setCurrentRoomId(data.roomId || null);
      if (data.roomId) {
        webSocketService.setRoomId(data.roomId);
        try {
          localStorage.setItem('lorcana_active_session', JSON.stringify({
            roomId: data.roomId,
            role: 'player1',
            deckId: selectedDeckId,
            deckName: selectedDeckName,
            timestamp: Date.now(),
          }));
        } catch (e) {}
      }
      webSocketService.setRole('player1');
    });

    const unsubWaiting = webSocketService.subscribe('WAITING', () => {
      setRoomState('WAITING');
    });

    const unsubMatchFound = webSocketService.subscribe('MATCH_FOUND', (data) => {
      setRoomState('MATCH_FOUND');
      const effectiveRoomId = data.roomId || null;
      setCurrentRoomId(effectiveRoomId);
      if (selectedDeckId) {
        setTimeout(() => {
          let myRole: 'player1' | 'player2' = (data.role as any) || webSocketService.getCurrentRole();
          const playersList = (data as any).players || (data as any).payload?.players;
          if (!data.role && Array.isArray(playersList) && playersList.length > 0) {
            const myName = user?.username || webSocketService.getUsername();
            const me = playersList.find((p: any) => p.username === myName);
            if (me && me.role) myRole = me.role;
          }
          if (effectiveRoomId) {
            webSocketService.setRoomId(effectiveRoomId);
            try {
              localStorage.setItem('lorcana_active_session', JSON.stringify({
                roomId: effectiveRoomId,
                role: myRole,
                deckId: selectedDeckId,
                deckName: selectedDeckName,
                timestamp: Date.now(),
              }));
            } catch (e) {}
          }
          webSocketService.setRole(myRole);
          const deckObj = selectedDeckObj || decks.find(d => d.deckId === selectedDeckId) || {
            deckId: selectedDeckId,
            name: selectedDeckName,
            cards: [],
          };
          onStartMatch(selectedDeckId, selectedDeckName, effectiveRoomId || undefined, myRole, deckObj);
        }, 1500);
      }
    });

    const unsubGameStart = webSocketService.subscribe('GAME_START', (data) => {
      if (selectedDeckId) {
        const effectiveRoomId = data.roomId || currentRoomId || webSocketService.getCurrentRoomId() || undefined;
        let myRole: 'player1' | 'player2' = (data.role as any) || webSocketService.getCurrentRole();
        const playersList = (data as any).players || (data as any).payload?.players;
        if (!data.role && Array.isArray(playersList) && playersList.length > 0) {
          const myName = user?.username || webSocketService.getUsername();
          const me = playersList.find((p: any) => p.username === myName);
          if (me && me.role) myRole = me.role;
        }
        if (effectiveRoomId) {
          webSocketService.setRoomId(effectiveRoomId);
          try {
            localStorage.setItem('lorcana_active_session', JSON.stringify({
              roomId: effectiveRoomId,
              role: myRole,
              deckId: selectedDeckId,
              deckName: selectedDeckName,
              timestamp: Date.now(),
            }));
          } catch (e) {}
        }
        webSocketService.setRole(myRole);
        const deckObj = selectedDeckObj || decks.find(d => d.deckId === selectedDeckId) || {
          deckId: selectedDeckId,
          name: selectedDeckName,
          cards: [],
        };
        onStartMatch(selectedDeckId, selectedDeckName, effectiveRoomId, myRole, deckObj);
      }
    });

    const unsubRoomState = webSocketService.subscribe('ROOM_STATE', (data) => {
      const playersList = (data as any).players || data.payload?.players || [];
      if (Array.isArray(playersList) && playersList.length > 0) {
        const myName = user?.username || webSocketService.getUsername();
        const opp = playersList.find((p: any) => p.username !== myName);
        if (opp) setOpponent(opp);
      }
    });

    const unsubReconnected = webSocketService.subscribe('PLAYER_RECONNECTED', (data: any) => {
      if (data.isSelf) {
        const effectiveRoomId = data.roomId || currentRoomId;
        const myRole = data.role || 'player1';
        const deckObj = selectedDeckObj || decks.find(d => d.deckId === (data.deckId || selectedDeckId)) || { deckId: data.deckId || selectedDeckId, name: data.deckName || selectedDeckName, cards: [] };
        onStartMatch(data.deckId || selectedDeckId || 'starter-pool', data.deckName || selectedDeckName || 'Deck', effectiveRoomId, myRole, deckObj, true);
      }
    });

    const unsubError = webSocketService.subscribe('ERROR', (data: any) => {
      setErrorMessage(data.message || 'An error occurred with the room or match.');
      setRoomState('IDLE');
    });

    return () => {
      unsubRoomCreated();
      unsubWaiting();
      unsubMatchFound();
      unsubGameStart();
      unsubRoomState();
      unsubReconnected();
      unsubError();
    };
  }, [selectedDeckId, selectedDeckName, selectedDeckObj, onStartMatch, user, currentRoomId, decks, savedSession]);

  const loadDecks = async () => {
    try {
      const res = await apiService.getUserDecks(token || undefined);
      const cloudDecks = res.decks || [];
      if (cloudDecks.length > 0) {
        setDecks(cloudDecks);
      } else {
        setDecks([
          {
            deckId: 'starter-pool',
            name: 'Starter Deck (Default)',
            totalCards: STARTER_POOL.length,
            cards: STARTER_POOL.map((c) => ({ card: c, count: 1 })),
          },
        ]);
      }
    } catch (err: any) {
      setDecks([
        {
          deckId: 'starter-pool',
          name: 'Starter Deck (Default)',
          totalCards: STARTER_POOL.length,
          cards: STARTER_POOL.map((c) => ({ card: c, count: 1 })),
        },
      ]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (token) loadDecks();
      webSocketService.connect(user?.username);
    }
  }, [isAuthenticated, token, user?.username]);

  const handleDeckSelect = (id: string, name: string, deckObj?: any) => {
    setSelectedDeckId(id);
    setSelectedDeckName(name);
    if (deckObj) setSelectedDeckObj(deckObj);
  };

  // Auto-select the first deck (cloud or starter) so buttons are never deadlocked
  useEffect(() => {
    if (!selectedDeckId && decks.length > 0) {
      setSelectedDeckId(decks[0].deckId);
      setSelectedDeckName(decks[0].name);
    }
  }, [decks, selectedDeckId]);

  const handleCreateRoom = async () => {
    if (!selectedDeckId) return;
    try {
      localStorage.removeItem('lorcana_active_session');
    } catch (e) {}
    setSavedSession(null);
    await webSocketService.connect(user?.username);
    webSocketService.createRoom(selectedDeckId, selectedDeckName);
  };

  const handleJoinRoom = async () => {
    if (!selectedDeckId || !joinCode) return;
    try {
      localStorage.removeItem('lorcana_active_session');
    } catch (e) {}
    setSavedSession(null);
    await webSocketService.connect(user?.username);
    webSocketService.joinRoomWithDeck(joinCode.toUpperCase(), selectedDeckId, selectedDeckName);
  };

  const handleFindMatch = async () => {
    if (!selectedDeckId) return;
    try {
      localStorage.removeItem('lorcana_active_session');
    } catch (e) {}
    setSavedSession(null);
    setRoomState('WAITING');
    await webSocketService.connect(user?.username);
    webSocketService.findMatch(selectedDeckId, selectedDeckName);
  };

  const handleCancelMatch = () => {
    webSocketService.cancelMatchmaking();
    setRoomState('IDLE');
    setCurrentRoomId(null);
    setOpponent(null);
  };

  const handleCopyRoomCode = () => {
    if (currentRoomId) {
      navigator.clipboard.writeText(currentRoomId);
      setCopiedRoomCode(true);
      setTimeout(() => setCopiedRoomCode(false), 2000);
    }
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="glass-panel p-10 rounded-3xl border border-white/10 flex flex-col items-center max-w-lg shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Swords className="w-10 h-10 text-[#F59E0B]" />
          </div>
          <h1 className="font-cinzel text-3xl font-bold text-[#F1F5F9] mb-3">Lorcana Match Lobby</h1>
          <p className="text-[#94A3B8] font-outfit text-sm leading-relaxed">
            {language === 'th' 
              ? 'กรุณาเข้าสู่ระบบเพื่อเข้าสู่ล็อบบี้แข่งขันแบบเรียลไทม์ และประลองฝีมือกับ Illumineers ท่านอื่น' 
              : 'Please sign in to access the real-time match lobby and play against other Illumineers.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar with Glassmorphic Navigation */}
      <div className="glass-nav-header flex justify-between items-center px-6 md:px-8 py-4 z-20">
        <h1 className="font-cinzel text-xl md:text-2xl font-bold text-[#F1F5F9] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.25)]">
            <Swords className="w-4.5 h-4.5 text-[#F59E0B]" />
          </div>
          <span>{t.lobbyTitle}</span>
        </h1>

        <div className="flex items-center gap-3">
          {/* Quick Playmat Skin Button */}
          <button
            onClick={() => setIsPlaymatModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#141a26]/90 border border-[#F59E0B]/40 hover:border-[#F59E0B] text-[#F59E0B] text-xs font-cinzel font-bold transition-all shadow-md cursor-pointer group hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:scale-105 active:scale-95 backdrop-blur-md"
          >
            <Palette className="w-4 h-4 text-[#F59E0B] group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">
              {language === 'th' ? 'ลายสนาม:' : 'Playmat:'} {language === 'th' ? currentPlaymat.nameTh : currentPlaymat.name}
            </span>
            <span className="sm:hidden">{language === 'th' ? 'ลายสนาม' : 'Playmat'}</span>
          </button>

          {/* Server Online Status Shimmer Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-full backdrop-blur-md shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            <span className="text-xs font-mono font-bold text-emerald-400">{t.navServerOnline}</span>
          </div>
        </div>
      </div>

      {/* Rejoin Match Alert Banner with Amber Glassmorphism */}
      {savedSession && (
        <div className="mx-6 md:mx-10 mt-5 p-5 bg-gradient-to-r from-amber-950/70 via-[#141a26]/90 to-amber-950/70 border border-[#F59E0B]/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.25)] backdrop-blur-xl relative overflow-hidden animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/15 border border-[#F59E0B]/50 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Sparkles className="w-6 h-6 text-[#F59E0B] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-cinzel font-bold text-base text-[#F59E0B] tracking-wide">
                  {language === 'th' ? 'ตรวจพบแมตช์ที่เล่นค้างอยู่!' : 'Active Match Detected!'}
                </h3>
                <span className="shimmer-badge badge-shimmer-gold text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                  Room #{savedSession.roomId}
                </span>
                <span className="shimmer-badge badge-shimmer-emerald text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {language === 'th' ? 'กู้คืนได้ทันที' : 'Ready to Resume'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-outfit mt-1 max-w-2xl">
                {language === 'th'
                  ? `คุณมีเกมค้างอยู่ในห้อง #${savedSession.roomId} (${savedSession.deckName || 'Deck'}) สามารถกด Rejoin เพื่อกลับไปเล่นต่อได้ทันที`
                  : `You have an active match in Room #${savedSession.roomId} (${savedSession.deckName || 'Deck'}). Rejoin now to resume gameplay.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto relative z-10 shrink-0">
            <button
              onClick={handleRejoinSession}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-sm transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'th' ? 'กลับเข้าห้องเดิม (Rejoin)' : 'Rejoin Match'}</span>
            </button>
            <button
              onClick={handleDismissSession}
              className="px-3 py-2.5 rounded-xl bg-[#0B0F19]/80 hover:bg-rose-950/60 border border-white/10 hover:border-rose-500 text-slate-400 hover:text-rose-300 text-xs font-cinzel transition-all cursor-pointer shadow-sm backdrop-blur-sm"
              title={language === 'th' ? 'ยกเลิก / ไม่กลับเข้าห้อง' : 'Dismiss'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mx-6 md:mx-10 mt-4 p-4 bg-rose-950/50 border border-rose-500/50 rounded-2xl flex items-center justify-between gap-3 text-rose-200 backdrop-blur-md shadow-[0_8px_32px_rgba(244,63,94,0.2)] animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-900/50 rounded-lg text-rose-400 hover:text-rose-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-5 md:py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 xl:gap-7 items-start">
        {/* LEFT: Deck Selection & Playmat Customization */}
        <div className="md:col-span-2 lg:col-span-7 xl:col-span-6 2xl:col-span-6 flex flex-col gap-4">
          <div className="glass-panel p-4 sm:p-5 lg:p-6 rounded-2xl flex flex-col shadow-2xl border border-white/10 bg-[#141a26]/85 backdrop-blur-xl">
            <MatchDeckSelect decks={decks} selectedDeckId={selectedDeckId} onSelect={handleDeckSelect} />
          </div>

          {/* Equipped Playmat Preview Card with Spotlight Effect */}
          <div 
            onMouseMove={handleCardMouseMove}
            className="spotlight-card spotlight-card-amber p-3.5 sm:p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 relative overflow-hidden border border-white/10 bg-[#141a26]/85 backdrop-blur-xl"
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300"
              style={{
                backgroundImage: `url(${currentPlaymat.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative z-10 flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#F59E0B]/60 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                <img src={currentPlaymat.previewImage} alt={currentPlaymat.name} className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <span className="shimmer-badge badge-shimmer-gold text-[8px] font-cinzel font-bold uppercase tracking-wider mb-0.5">
                  {language === 'th' ? 'ลายสนามที่ติดตั้งอยู่' : 'EQUIPPED PLAYMAT'}
                </span>
                <h4 className="font-cinzel text-xs sm:text-sm font-bold text-white truncate">
                  {language === 'th' ? currentPlaymat.nameTh : currentPlaymat.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-outfit truncate">
                  {language === 'th' ? currentPlaymat.characterTh : currentPlaymat.character}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPlaymatModalOpen(true)}
              className="relative z-10 px-3 py-1.5 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-black text-xs font-cinzel font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer shrink-0 flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{language === 'th' ? 'เปลี่ยนลาย' : 'Change'}</span>
            </button>
          </div>
        </div>

        {/* MIDDLE: Private Room Controls with Glassmorphism */}
        <div className="md:col-span-1 lg:col-span-5 xl:col-span-3 2xl:col-span-3 flex flex-col">
          <div 
            onMouseMove={handleCardMouseMove}
            className="spotlight-card spotlight-card-amber p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col justify-between border border-white/10 bg-[#141a26]/85 backdrop-blur-xl min-h-[440px]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent pointer-events-none"></div>
            
            <div className="relative z-10">
              <h2 className="font-cinzel text-xl md:text-2xl font-bold text-[#F1F5F9] mb-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Plus className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <span>{language === 'th' ? 'ห้องเล่นส่วนตัว (Private Match)' : 'Private Match'}</span>
              </h2>
              
              <div className="flex flex-col gap-6">
                <button
                  onClick={handleCreateRoom}
                  disabled={!selectedDeckId || roomState !== 'IDLE'}
                  className="w-full bg-[#F59E0B] text-black font-cinzel font-bold py-4 text-lg rounded-xl hover:bg-[#D97706] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_4px_24px_rgba(245,158,11,0.35)] cursor-pointer flex items-center justify-center gap-2.5"
                >
                  <Plus className="w-5 h-5" /> {t.createRoom}
                </button>

                <div className="flex items-center gap-4 my-1">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest">{language === 'th' ? 'หรือเข้าร่วมห้อง' : 'OR JOIN ROOM'}</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-[#F1F5F9] font-cinzel flex items-center justify-between">
                    <span>{t.enterRoomCode}</span>
                    <span className="shimmer-badge badge-shimmer-amber text-[10px] font-mono px-2 py-0.5 rounded-full">{language === 'th' ? 'รหัส 6 หลัก' : '6 digits'}</span>
                  </label>
                  <div className="flex flex-col gap-3 w-full">
                    <input
                      type="text"
                      placeholder={language === 'th' ? 'กรอกรหัสห้อง 6 หลัก (เช่น ABC123)' : 'Enter 6-digit Room Code'}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      maxLength={6}
                      disabled={!selectedDeckId || roomState !== 'IDLE'}
                      className="w-full bg-[#0B0F19]/90 border-2 border-white/15 focus:border-[#F59E0B] text-[#F59E0B] rounded-xl px-4 py-3.5 text-center text-xl font-mono font-bold tracking-[0.25em] uppercase focus:ring-4 focus:ring-[#F59E0B]/20 focus:outline-none disabled:opacity-50 h-14 shadow-inner placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-[#64748B] backdrop-blur-md transition-all"
                    />
                    <button
                      onClick={handleJoinRoom}
                      disabled={!selectedDeckId || joinCode.length < 6 || roomState !== 'IDLE'}
                      className="w-full py-3.5 px-6 bg-[#F59E0B] hover:bg-[#D97706] text-black font-cinzel font-bold text-base rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 h-14 shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <LogIn className="w-5 h-5 shrink-0" />
                      <span>{t.joinRoom}</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#94A3B8] text-center font-outfit">{language === 'th' ? 'ขอรหัส 6 หลักจากเพื่อนของคุณเพื่อเข้าร่วมห้อง' : 'Ask your friend for a 6-digit code'}</p>
                </div>
              </div>
            </div>

            {roomState === 'CREATED' && currentRoomId && (
              <div className="mt-8 p-6 bg-[#0B0F19]/90 border-2 border-[#F59E0B] rounded-2xl text-center animate-in fade-in slide-in-from-top-4 duration-500 shadow-[0_0_35px_rgba(245,158,11,0.25)] relative z-10 backdrop-blur-md">
                <p className="text-xs text-[#94A3B8] mb-3 font-mono uppercase tracking-widest">{t.shareRoomCode}</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-5xl md:text-6xl font-mono font-bold text-[#F59E0B] tracking-widest">{currentRoomId}</p>
                  <button 
                    onClick={handleCopyRoomCode}
                    className="p-3 bg-[#141a26]/90 text-[#94A3B8] hover:text-[#F59E0B] border border-white/15 hover:border-[#F59E0B] rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
                    title={copiedRoomCode ? 'Copied!' : t.copyCode}
                  >
                    {copiedRoomCode ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-[#F59E0B]" />
                    )}
                  </button>
                </div>
                {copiedRoomCode && (
                  <p className="text-xs text-emerald-400 font-mono mt-2 animate-in fade-in">
                    {language === 'th' ? 'คัดลอกรหัสห้องแล้ว!' : 'Room code copied to clipboard!'}
                  </p>
                )}
                <div className="mt-6 flex items-center justify-center gap-2 text-[#F1F5F9] text-sm bg-[#141a26]/90 py-2.5 px-6 rounded-full inline-flex border border-white/10 shadow-inner">
                  <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                  <span className="font-outfit">{t.waitingForOpponent}</span>
                </div>
              </div>
            )}

            {opponent && (
              <div className="mt-8 p-5 bg-[#0B0F19]/90 border border-white/15 rounded-2xl animate-in fade-in slide-in-from-bottom-4 relative z-10 backdrop-blur-md shadow-lg">
                <p className="text-xs text-[#94A3B8] mb-2 uppercase font-mono tracking-wider">{language === 'th' ? 'คู่แข่งเข้าร่วมห้องแล้ว' : 'Opponent Joined'}</p>
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-rose-900/50 border border-rose-500/60 flex items-center justify-center text-rose-300 font-bold text-xl shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    {opponent.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-bold text-[#F1F5F9] text-xl font-cinzel block">{opponent.username}</span>
                    <span className="shimmer-badge badge-shimmer-ruby text-[9px] font-mono px-2 py-0.5 rounded-full">
                      {language === 'th' ? 'พร้อมประลอง' : 'READY TO DUEL'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Ranked Matchmaking with Glassmorphic Ambient Radar */}
        <div className="md:col-span-1 lg:col-span-12 xl:col-span-3 2xl:col-span-3 flex flex-col">
          <div 
            onMouseMove={handleCardMouseMove}
            className="spotlight-card spotlight-card-amber p-6 md:p-8 rounded-2xl flex flex-col justify-between shadow-2xl border border-white/10 bg-[#141a26]/85 backdrop-blur-xl relative overflow-hidden min-h-[480px]"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent pointer-events-none"></div>

            <div className="relative z-10">
              <h2 className="font-cinzel text-xl md:text-2xl font-bold text-[#F1F5F9] mb-6 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Swords className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <span>{language === 'th' ? 'ค้นหาคู่แข่ง (Matchmaking)' : 'Ranked Matchmaking'}</span>
              </h2>
            </div>
            
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[340px]">
              {roomState === 'IDLE' || roomState === 'CREATED' ? (
                <div className="animate-in fade-in duration-500 flex flex-col items-center w-full max-w-sm mx-auto">
                  <div className="w-24 h-24 rounded-3xl bg-[#0B0F19]/80 border border-white/15 flex items-center justify-center mb-6 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] relative group">
                    <div className="absolute inset-0 bg-[#F59E0B]/10 rounded-3xl blur-md pointer-events-none" />
                    <Swords className="w-12 h-12 text-[#F59E0B] relative z-10" />
                  </div>
                  <p className="text-[#94A3B8] text-sm mb-8 max-w-xs font-outfit">{language === 'th' ? 'ค้นหาผู้เล่นระดับฝีมือใกล้เคียงกันแบบอัตโนมัติ และเข้าสู่สนามดวลทันที' : 'Find a worthy opponent automatically based on your skill level.'}</p>
                  <button
                    onClick={handleFindMatch}
                    disabled={!selectedDeckId || roomState === 'CREATED'}
                    className="w-full py-4 border-2 border-[#F59E0B] text-[#F59E0B] font-cinzel font-bold text-lg rounded-xl hover:bg-[#F59E0B] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    {language === 'th' ? 'ค้นหาห้องดวล' : 'FIND MATCH'}
                  </button>
                </div>
              ) : roomState === 'WAITING' ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
                  <div className="relative mb-8 mt-4">
                    <div className="absolute inset-0 bg-[#F59E0B] rounded-full blur-2xl opacity-30 animate-pulse"></div>
                    <div className="w-24 h-24 rounded-full border-4 border-[#F59E0B]/30 border-t-[#F59E0B] animate-spin flex items-center justify-center">
                      <Loader2 className="w-12 h-12 text-[#F59E0B] animate-spin" />
                    </div>
                  </div>
                  <h3 className="font-cinzel text-2xl text-[#F1F5F9] font-bold mb-2">{language === 'th' ? 'กำลังค้นหาคู่แข่ง...' : 'Searching...'}</h3>
                  <span className="shimmer-badge badge-shimmer-amber text-xs font-mono mb-8 px-3 py-1 rounded-full">
                    {language === 'th' ? 'ระยะเวลารอโดยประมาณ: 0:15' : 'Estimated wait: 0:15'}
                  </span>
                  <button
                    onClick={handleCancelMatch}
                    className="flex items-center gap-2 px-8 py-3 bg-[#0B0F19]/80 border border-white/15 rounded-xl text-[#94A3B8] hover:text-rose-400 hover:border-rose-500 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-md backdrop-blur-sm"
                  >
                    <X className="w-4 h-4" /> {language === 'th' ? 'ยกเลิกการค้นหา' : 'Cancel Search'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in duration-500 w-full">
                  <div className="w-24 h-24 bg-[#F59E0B] rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-bounce">
                    <Swords className="w-12 h-12 text-black" />
                  </div>
                  <h3 className="font-cinzel text-3xl font-bold text-[#F1F5F9] mb-3">{t.matchFound}</h3>
                  <p className="text-[#F59E0B] font-mono mb-4 text-lg bg-[#0B0F19]/90 px-6 py-2.5 rounded-2xl border border-[#F59E0B]/40 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    {language === 'th' ? 'ห้อง:' : 'Room:'} {currentRoomId}
                  </p>
                  <div className="flex items-center gap-2 text-[#94A3B8] bg-[#0B0F19]/60 px-4 py-2 rounded-full border border-white/10">
                    <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                    <span className="text-sm font-mono">{language === 'th' ? 'กำลังเข้าสู่สนามดวล...' : 'Entering game...'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Playmat Selector Modal */}
      <PlaymatSelectorModal
        isOpen={isPlaymatModalOpen}
        onClose={() => setIsPlaymatModalOpen(false)}
      />
    </div>
  );
};

