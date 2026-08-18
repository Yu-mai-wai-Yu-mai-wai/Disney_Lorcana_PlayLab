import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { webSocketService } from '../services/websocket';
import { MatchDeckSelect } from '../components/MatchDeckSelect';
import { apiService } from '../services/api';
import { STARTER_POOL } from '../data/cardPool';
import { Swords, LogIn, Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';

interface MatchLobbyProps {
  onStartMatch: (deckId: string, deckName: string, roomId?: string, role?: string, deckObject?: any) => void;
}

export const MatchLobby: React.FC<MatchLobbyProps> = ({ onStartMatch }) => {
  const { user, token, isAuthenticated } = useAuthStore();
  const { t, language } = useLanguageStore();
  const [decks, setDecks] = useState<any[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [selectedDeckName, setSelectedDeckName] = useState<string>('');
  
  const [joinCode, setJoinCode] = useState('');
  const [roomState, setRoomState] = useState<'IDLE' | 'CREATED' | 'WAITING' | 'MATCH_FOUND'>('IDLE');
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadDecks();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const unsubRoomCreated = webSocketService.subscribe('ROOM_CREATED', (data) => {
      setRoomState('CREATED');
      setCurrentRoomId(data.roomId || null);
      if (data.roomId) webSocketService.setRoomId(data.roomId);
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
          if (effectiveRoomId) webSocketService.setRoomId(effectiveRoomId);
          webSocketService.setRole(myRole);
          const deckObj = decks.find(d => d.deckId === selectedDeckId);
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
        if (effectiveRoomId) webSocketService.setRoomId(effectiveRoomId);
        webSocketService.setRole(myRole);
        const deckObj = decks.find(d => d.deckId === selectedDeckId);
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
      unsubError();
    };
  }, [selectedDeckId, selectedDeckName, onStartMatch, user, currentRoomId, decks]);

  const loadDecks = async () => {
    try {
      const res = await apiService.getUserDecks(token || undefined);
      const cloudDecks = res.decks || [];
      if (cloudDecks.length > 0) {
        setDecks(cloudDecks);
      } else {
        // No cloud decks → offer a default starter deck so the lobby is playable
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

  const handleDeckSelect = (id: string, name: string) => {
    setSelectedDeckId(id);
    setSelectedDeckName(name);
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
    await webSocketService.connect(user?.username);
    webSocketService.createRoom(selectedDeckId, selectedDeckName);
  };

  const handleJoinRoom = async () => {
    if (!selectedDeckId || !joinCode) return;
    await webSocketService.connect(user?.username);
    webSocketService.joinRoomWithDeck(joinCode.toUpperCase(), selectedDeckId, selectedDeckName);
  };

  const handleFindMatch = async () => {
    if (!selectedDeckId) return;
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

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Swords className="w-16 h-16 text-[#F59E0B] mb-6" />
        <h1 className="font-cinzel text-3xl font-bold text-[#F1F5F9] mb-4">Lorcana Match Lobby</h1>
        <p className="text-[#94A3B8] font-outfit max-w-md">Please sign in to access the real-time match lobby and play against other Illumineers.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Bar */}
      <div className="flex justify-between items-center px-8 py-4 bg-[#0B0F19] border-b border-[#30363d]">
        <h1 className="font-cinzel text-2xl font-bold text-[#F1F5F9] flex items-center gap-3">
          <Swords className="w-6 h-6 text-[#F59E0B]" /> {t.lobbyTitle}
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-900/50 rounded-full">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-mono text-emerald-400">{t.navServerOnline}</span>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mx-8 mt-4 p-4 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center justify-between gap-3 text-rose-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-900/50 rounded text-rose-400 hover:text-rose-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT: Deck Selection */}
        <div className="md:col-span-4 lg:col-span-4 xl:col-span-3 h-full">
          <MatchDeckSelect decks={decks} selectedDeckId={selectedDeckId} onSelect={handleDeckSelect} />
        </div>

        {/* MIDDLE: Private Room */}
        <div className="md:col-span-4 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#141a26] border border-[#30363d] p-6 rounded-xl relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#F59E0B]"></div>
            <h2 className="font-cinzel text-xl text-[#F1F5F9] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#F59E0B]" /> {language === 'th' ? 'ห้องเล่นส่วนตัว (Private Match)' : 'Private Match'}
            </h2>
            
            <div className="flex flex-col gap-5">
              <button
                onClick={handleCreateRoom}
                disabled={!selectedDeckId || roomState !== 'IDLE'}
                className="w-full bg-[#F59E0B] text-black font-cinzel font-bold py-4 text-lg rounded-lg hover:bg-[#D97706] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_4px_14px_rgba(245,158,11,0.3)]"
              >
                {t.createRoom}
              </button>

              <div className="flex items-center gap-4 my-1">
                <div className="flex-1 h-px bg-[#30363d]"></div>
                <span className="text-xs text-[#94A3B8] font-mono">{language === 'th' ? 'หรือ' : 'OR'}</span>
                <div className="flex-1 h-px bg-[#30363d]"></div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-[#F1F5F9] font-cinzel">{t.enterRoomCode}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={language === 'th' ? 'ใส่รหัส 6 หลัก' : 'Enter 6-digit code'}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={6}
                    disabled={!selectedDeckId || roomState !== 'IDLE'}
                    className="flex-1 bg-[#0B0F19] border border-[#30363d] text-[#F1F5F9] rounded-lg px-4 py-3 text-base font-mono uppercase focus:border-[#F59E0B] focus:ring-2 focus:ring-[#F59E0B]/50 focus:outline-none disabled:opacity-50 h-12"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!selectedDeckId || joinCode.length < 6 || roomState !== 'IDLE'}
                    className="px-6 bg-[#F59E0B] text-black font-bold rounded-lg hover:bg-[#D97706] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-12 font-cinzel"
                  >
                    <LogIn className="w-5 h-5" /> {t.joinRoom}
                  </button>
                </div>
                <p className="text-xs text-[#94A3B8]">{language === 'th' ? 'ขอรหัส 6 หลักจากเพื่อนของคุณเพื่อเข้าร่วมห้อง' : 'Ask your friend for a 6-digit code'}</p>
              </div>
            </div>

            {roomState === 'CREATED' && currentRoomId && (
              <div className="mt-6 p-5 bg-[#0B0F19] border border-[#F59E0B] rounded-lg text-center animate-in fade-in slide-in-from-top-4 duration-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <p className="text-sm text-[#94A3B8] mb-2 font-mono uppercase tracking-wider">{t.shareRoomCode}</p>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-5xl font-mono font-bold text-[#F59E0B] tracking-widest">{currentRoomId}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(currentRoomId);
                    }}
                    className="p-2 bg-[#141a26] text-[#94A3B8] hover:text-[#F59E0B] border border-[#30363d] hover:border-[#F59E0B] rounded transition-colors"
                    title={t.copyCode}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  </button>
                </div>
                <div className="mt-5 flex items-center justify-center gap-2 text-[#F1F5F9] text-sm bg-[#141a26] py-2 px-4 rounded-full inline-flex">
                  <Loader2 className="w-4 h-4 animate-spin text-[#F59E0B]" />
                  {t.waitingForOpponent}
                </div>
              </div>
            )}

            {opponent && (
              <div className="mt-6 p-4 bg-[#0B0F19] border border-[#30363d] rounded-lg animate-in fade-in slide-in-from-bottom-4">
                <p className="text-sm text-[#94A3B8] mb-2">{language === 'th' ? 'คู่แข่งเข้าร่วมห้องแล้ว' : 'Opponent Joined'}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-rose-900 flex items-center justify-center text-rose-300 font-bold text-lg">
                    {opponent.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-[#F1F5F9] text-lg">{opponent.username}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Matchmaking */}
        <div className="md:col-span-4 lg:col-span-4 h-full">
          <div className="bg-[#141a26] border border-[#30363d] p-6 rounded-xl h-full flex flex-col shadow-lg">
            <h2 className="font-cinzel text-xl text-[#F1F5F9] mb-4 flex items-center gap-2">
              <Swords className="w-5 h-5 text-[#F59E0B]" /> {language === 'th' ? 'ค้นหาคู่แข่ง (Matchmaking)' : 'Ranked Matchmaking'}
            </h2>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[300px]">
              {roomState === 'IDLE' || roomState === 'CREATED' ? (
                <div className="animate-in fade-in duration-500 flex flex-col items-center w-full">
                  <Swords className="w-20 h-20 text-[#30363d] mb-4" />
                  <p className="text-[#94A3B8] text-sm mb-8">{language === 'th' ? 'ค้นหาผู้เล่นระดับฝีมือใกล้เคียงกันแบบอัตโนมัติ' : 'Find a worthy opponent automatically based on your skill level.'}</p>
                  <button
                    onClick={handleFindMatch}
                    disabled={!selectedDeckId || roomState === 'CREATED'}
                    className="w-full py-4 border-2 border-[#F59E0B] text-[#F59E0B] font-cinzel font-bold text-lg rounded-lg hover:bg-[#F59E0B] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02]"
                  >
                    {language === 'th' ? 'ค้นหาห้องดวล' : 'FIND MATCH'}
                  </button>
                </div>
              ) : roomState === 'WAITING' ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 w-full">
                  <div className="relative mb-8 mt-4">
                    <div className="absolute inset-0 bg-[#F59E0B] rounded-full blur-xl opacity-30 animate-pulse"></div>
                    <div className="absolute inset-0 border-4 border-[#F59E0B] rounded-full border-t-transparent animate-spin opacity-50 w-20 h-20 -left-2 -top-2"></div>
                    <Loader2 className="w-16 h-16 text-[#F59E0B] animate-spin relative z-10" />
                  </div>
                  <h3 className="font-cinzel text-2xl text-[#F1F5F9] mb-2">{language === 'th' ? 'กำลังค้นหาคู่แข่ง...' : 'Searching...'}</h3>
                  <p className="text-[#F59E0B] text-sm mb-8 font-mono animate-pulse">{language === 'th' ? 'ระยะเวลารอโดยประมาณ: 0:15' : 'Estimated wait: 0:15'}</p>
                  <button
                    onClick={handleCancelMatch}
                    className="flex items-center gap-2 px-8 py-3 bg-[#0B0F19] border border-[#30363d] rounded-lg text-[#94A3B8] hover:text-rose-400 hover:border-rose-500 transition-colors"
                  >
                    <X className="w-4 h-4" /> {language === 'th' ? 'ยกเลิกการค้นหา' : 'Cancel Search'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center animate-in zoom-in duration-500 w-full">
                  <div className="w-24 h-24 bg-[#F59E0B] rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-bounce">
                    <Swords className="w-12 h-12 text-black" />
                  </div>
                  <h3 className="font-cinzel text-3xl font-bold text-[#F1F5F9] mb-3">{t.matchFound}</h3>
                  <p className="text-[#F59E0B] font-mono mb-4 text-lg bg-[#0B0F19] px-4 py-2 rounded-lg border border-[#F59E0B]/30">{language === 'th' ? 'ห้อง:' : 'Room:'} {currentRoomId}</p>
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{language === 'th' ? 'กำลังเข้าสู่สนามดวล...' : 'Entering game...'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
