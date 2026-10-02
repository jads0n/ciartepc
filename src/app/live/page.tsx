'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { AggregatedStats } from '@/types';
import {
  Users,
  Activity,
  Award,
  Scale,
  Brain,
  Search,
  Maximize2,
  Minimize2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Cpu,
  Clock,
  Radio,
  Eye,
  Layers,
  MessageSquare,
  Car,
  ShieldAlert,
  FileCheck,
  HelpCircle,
  CheckCircle2,
  Quote,
  Play,
  Pause,
  Crown,
  Flame,
  ArrowUpRight,
  Check,
} from 'lucide-react';

const SCREEN_ROTATION_SECONDS = 16;

interface LiveLogItem {
  id: string;
  time: string;
  agent: string;
  station: string;
  detail: string;
  type: 'vote' | 'agent' | 'unlock';
}

const INITIAL_LOGS: LiveLogItem[] = [];

const INITIAL_REFLECTIONS = [
  { nickname: 'Turing Lab', quote: 'Aguardando os primeiros investigadores... Escaneie o QR Code para ingressar!' },
];

const INITIAL_STATS: AggregatedStats = {
  totalVisitors: 0,
  totalResponses: 0,
  turingAccuracy: 0,
  cartAiAccuracy: 0,
  hardestMediaChallenge: {
    title: '—',
    fooledPercentage: 0,
  },
  ethicsDistribution: {
    sim: 0,
    nao: 0,
    depende: 0,
  },
  preVsPost: {
    pre: { sim: 0, nao: 0, nao_sei: 0, avgTrust: 0 },
    post: { sim: 0, nao: 0, depende: 0, nao_sei: 0, avgTrust: 0 },
  },
  topAgents: [],
};

const SCREENS = [
  { id: 0, title: '01. VISÃO GERAL & RANKING', subtitle: 'Pulso do Laboratório & Top Investigadores' },
  { id: 1, title: '02. AS 8 BANCADAS', subtitle: 'Resultados e Decisões de Todas as Estações' },
  { id: 2, title: '03. ANTES X DEPOIS & VOZES', subtitle: 'Transformação Crítica e Mural de Reflexões' },
];

export default function LiveDashboardPage() {
  const [activeScreen, setActiveScreen] = useState(0);
  const [stats, setStats] = useState<AggregatedStats>(INITIAL_STATS);
  const [countdown, setCountdown] = useState(SCREEN_ROTATION_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [latestToast, setLatestToast] = useState<string | null>(null);
  const [logs, setLogs] = useState<LiveLogItem[]>(INITIAL_LOGS);
  const [liveReflections, setLiveReflections] = useState(INITIAL_REFLECTIONS);
  const [reflectionIdx, setReflectionIdx] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // Relógio militar local
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('pt-BR', { hour12: false }) + ' BRT'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rotação cíclica entre as 3 telas
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setActiveScreen((curr) => (curr + 1) % 3);
          return SCREEN_ROTATION_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Alternador de frases dos alunos
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setReflectionIdx((prev) => (prev + 1) % (liveReflections.length || 1));
    }, 7000);
    return () => clearInterval(quoteTimer);
  }, [liveReflections.length]);

  // Navegação por teclado (Setas e Espaço)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setActiveScreen((curr) => (curr + 1) % 3);
        setCountdown(SCREEN_ROTATION_SECONDS);
      } else if (e.key === 'ArrowLeft') {
        setActiveScreen((curr) => (curr === 0 ? 2 : curr - 1));
        setCountdown(SCREEN_ROTATION_SECONDS);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Busca de ranking ao vivo e contadores reais do Supabase
  const fetchLiveLeaderboardAndStats = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    try {
      // 1. Buscar os visitantes reais ordenados pela pontuação (do maior para o menor)
      const { data: realVisitors, error: vError } = await supabase
        .from('visitors')
        .select('id, nickname, agent_number, total_score, completed_stations_count')
        .order('total_score', { ascending: false })
        .limit(10);

      // 2. Contagem exata de visitantes
      const { count: visitorCount } = await supabase
        .from('visitors')
        .select('*', { count: 'exact', head: true });

      // 3. Contagem exata de respostas
      const { count: responseCount } = await supabase
        .from('responses')
        .select('*', { count: 'exact', head: true });

      // 4. Buscar reflexões aprovadas pela moderação do professor
      const { data: realReflections } = await supabase
        .from('open_reflections')
        .select('nickname, reflection_text')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);

      if (realReflections && realReflections.length > 0) {
        setLiveReflections(
          realReflections.map((r) => ({
            nickname: r.nickname || 'Anônimo',
            quote: r.reflection_text || '',
          }))
        );
      }

      if (!vError) {
        const mappedTopAgents = (realVisitors || []).map((v) => ({
          nickname: v.nickname || `AGENTE #${v.agent_number || 100}`,
          total_score: v.total_score || 0,
          agent_number: v.agent_number || 100,
          completed_stations_count: v.completed_stations_count || 0,
        }));

        setStats((prev) => ({
          ...prev,
          totalVisitors: visitorCount !== null ? visitorCount : mappedTopAgents.length,
          totalResponses: responseCount !== null ? responseCount : 0,
          topAgents: mappedTopAgents,
        }));
      }
    } catch (err) {
      console.warn('Erro ao carregar dados ao vivo:', err);
    }
  }, []);

  // Conexão Realtime e Polling contínuo com Supabase
  useEffect(() => {
    fetchLiveLeaderboardAndStats();

    // Polling a cada 3.5 segundos para garantir que qualquer pontuação atualize instantaneamente
    const pollInterval = setInterval(fetchLiveLeaderboardAndStats, 3500);

    if (!isSupabaseConfigured()) return () => clearInterval(pollInterval);

    const channel = supabase
      .channel('live-realtime-feed-v5')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, (payload) => {
        // Atualiza a tabela de líderes imediatamente
        fetchLiveLeaderboardAndStats();

        const now = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        if (payload.eventType === 'UPDATE') {
          const oldScore = (payload.old as { total_score?: number })?.total_score || 0;
          const newScore = (payload.new as { total_score?: number; nickname?: string })?.total_score || 0;
          const nick = (payload.new as { nickname?: string })?.nickname || 'Agente';
          const diff = newScore - oldScore;

          if (diff > 0) {
            const newLog: LiveLogItem = {
              id: Math.random().toString(),
              time: now,
              agent: nick,
              station: 'RANKING',
              detail: `+${diff} XP conquistados! (Total: ${newScore} XP)`,
              type: 'unlock',
            };
            setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
            setLatestToast(`RANKING: ${nick} subiu com +${diff} XP!`);
            setTimeout(() => setLatestToast(null), 3500);
          }
        } else if (payload.eventType === 'INSERT') {
          const nick = (payload.new as { nickname?: string })?.nickname || 'NOVO AGENTE';
          const newLog: LiveLogItem = {
            id: Math.random().toString(),
            time: now,
            agent: nick,
            station: 'PASSAPORTE',
            detail: 'Novo investigador ingressou no laboratório',
            type: 'agent',
          };
          setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
          setLatestToast(`NOVO AGENTE: ${nick} entrou no Turing Lab!`);
          setTimeout(() => setLatestToast(null), 3500);
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'responses' }, (payload) => {
        fetchLiveLeaderboardAndStats();

        const now = new Date().toLocaleTimeString('pt-BR', { hour12: false });
        const stationId = String(payload.new?.station_id || '');
        let detail = 'Resposta registrada na bancada';
        let stationLabel = `ESTAÇÃO ${stationId.toUpperCase()}`;

        if (stationId === 'arquivo-secreto') {
          stationLabel = 'ARQUIVO SECRETO';
          detail = 'Decifrou o Enigma Bletchley (+250 XP)!';
        } else if (stationId === 'arquivo-secreto-historico') {
          stationLabel = 'ARQUIVO SECRETO';
          detail = 'Decifrou código histórico confidencial!';
        }

        const newLog: LiveLogItem = {
          id: Math.random().toString(),
          time: now,
          agent: `AGENTE #${Math.floor(100 + Math.random() * 900)}`,
          station: stationLabel,
          detail,
          type: stationId.includes('secreto') ? 'unlock' : 'vote',
        };

        setLogs((prev) => [newLog, ...prev.slice(0, 7)]);
        if (stationId.includes('secreto')) {
          setLatestToast('CÓDIGO SECRETO DECIFRADO NO LABORATÓRIO! (+250 XP)');
          setTimeout(() => setLatestToast(null), 4000);
        }
      })
      .subscribe();

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [fetchLiveLeaderboardAndStats]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const progressPercent = ((SCREEN_ROTATION_SECONDS - countdown) / SCREEN_ROTATION_SECONDS) * 100;
  const currentReflection =
    liveReflections[reflectionIdx % (liveReflections.length || 1)] || INITIAL_REFLECTIONS[0];

  return (
    <div className="fixed inset-0 bg-archive-950 text-archive-paper bg-military-grid flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none overflow-hidden z-50">
      {/* BARRA SUPERIOR DE TRANSMISSÃO */}
      <header className="border-b border-archive-800 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="w-3.5 h-3.5 rounded-full bg-turing-green animate-ping absolute" />
            <div className="w-2.5 h-2.5 rounded-full bg-turing-green relative" />
          </div>
          <div>
            <div className="font-mono text-base sm:text-lg font-black text-turing-amber tracking-widest flex items-center gap-2">
              <span>TURING LAB LIVE</span>
              <span className="text-[10px] text-turing-green bg-turing-green/10 border border-turing-green/30 px-2 py-0.5 rounded-xs font-mono font-bold tracking-normal">
                ● TRANSMISSÃO EM TEMPO REAL
              </span>
            </div>
            <div className="text-xs font-mono text-archive-muted flex items-center gap-3 mt-0.5">
              <span>SALA DE OPERAÇÕES BLETCHLEY PARK // FEIRA 2026</span>
              <span className="text-archive-700">|</span>
              <span className="text-turing-cyan font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {currentTimeStr || '15:35:00 BRT'}
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE AS 3 TELAS & CONTROLES */}
        <div className="flex items-center gap-2">
          {/* Seletor das 3 Telas */}
          <div className="flex items-center bg-archive-900 border border-archive-700 rounded-sm p-1 font-mono text-xs">
            {SCREENS.map((scr) => (
              <button
                key={scr.id}
                onClick={() => {
                  setActiveScreen(scr.id);
                  setCountdown(SCREEN_ROTATION_SECONDS);
                }}
                className={`px-3 py-1.5 rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeScreen === scr.id
                    ? 'bg-turing-amber text-archive-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                    : 'text-archive-muted hover:text-archive-paper'
                }`}
              >
                <span>{scr.title.split('.')[0]}</span>
                <span className="hidden lg:inline">{scr.title.split('.')[1]}</span>
              </button>
            ))}
          </div>

          {/* Botão Play / Pause */}
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 bg-archive-900 border border-archive-700 hover:border-archive-500 rounded-sm text-archive-paper cursor-pointer transition-colors"
            title={isPaused ? 'Continuar rotação' : 'Pausar rotação nesta tela'}
          >
            {isPaused ? <Play className="w-4 h-4 text-turing-green" /> : <Pause className="w-4 h-4 text-turing-amber" />}
          </button>

          {/* Setas Anterior / Próxima */}
          <button
            onClick={() => {
              setActiveScreen((curr) => (curr === 0 ? 2 : curr - 1));
              setCountdown(SCREEN_ROTATION_SECONDS);
            }}
            className="p-2 bg-archive-900 border border-archive-700 hover:border-archive-500 rounded-sm text-archive-paper cursor-pointer transition-colors"
            title="Tela Anterior (Seta Esquerda)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setActiveScreen((curr) => (curr + 1) % 3);
              setCountdown(SCREEN_ROTATION_SECONDS);
            }}
            className="p-2 bg-archive-900 border border-archive-700 hover:border-archive-500 rounded-sm text-archive-paper cursor-pointer transition-colors"
            title="Próxima Tela (Seta Direita)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Botão Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-archive-900 border border-archive-700 hover:border-archive-500 rounded-sm text-archive-paper cursor-pointer transition-colors"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* BARRA DE PROGRESSO DO TEMPO DA TELA ATUAL */}
      <div className="w-full bg-archive-950 h-1 overflow-hidden shrink-0 mt-2">
        <div
          className="bg-turing-amber h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          style={{ width: `${isPaused ? 100 : progressPercent}%` }}
        />
      </div>

      {/* ÁREA CENTRAL PRINCIPAL — ROTAÇÃO ENTRE AS 3 TELAS */}
      <main className="flex-1 py-4 flex flex-col justify-center max-w-[1650px] w-full mx-auto min-h-0">
        {/* ====================================================================
            TELA 1: O PULSO DO LABORATÓRIO & QUADRO DE HONRA
            ==================================================================== */}
        {activeScreen === 0 && (
          <div className="space-y-6 w-full animate-in fade-in duration-300">
            {/* Header da Tela */}
            <div className="flex items-center justify-between border-b border-archive-800 pb-2">
              <div>
                <span className="text-xs font-mono text-turing-amber uppercase tracking-widest font-bold">
                  PAINEL GERAL DE PARTICIPAÇÃO // TELA 01 DE 03
                </span>
                <h1 className="text-2xl sm:text-4xl font-mono font-black text-archive-paper">
                  O PULSO DO LABORATÓRIO EM TEMPO REAL
                </h1>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-mono text-archive-muted">ROTAÇÃO AUTOMÁTICA</span>
                <div className="font-mono text-lg font-bold text-turing-amber">{countdown}s</div>
              </div>
            </div>

            {/* 4 KPIs Gigantes em Destaque */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-archive-900 border border-turing-amber/50 rounded-sm relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-archive-muted uppercase font-bold">AGENTES INVESTIGADORES</span>
                  <Users className="w-6 h-6 text-turing-amber" />
                </div>
                <div className="text-4xl sm:text-6xl font-mono font-black text-turing-amber mt-2">
                  {stats.totalVisitors}
                </div>
                <div className="text-xs font-mono text-turing-green flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Passaportes ativos na feira</span>
                </div>
              </div>

              <div className="p-5 bg-archive-900 border border-turing-green/50 rounded-sm relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-archive-muted uppercase font-bold">RESPOSTAS COMPUTADAS</span>
                  <Activity className="w-6 h-6 text-turing-green" />
                </div>
                <div className="text-4xl sm:text-6xl font-mono font-black text-turing-green mt-2">
                  {stats.totalResponses}
                </div>
                <div className="text-xs font-mono text-archive-muted mt-1">
                  Votos em celulares e bancadas touch
                </div>
              </div>

              <div className="p-5 bg-archive-900 border border-turing-cyan/50 rounded-sm relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-archive-muted uppercase font-bold">BANCADAS ATIVAS</span>
                  <Cpu className="w-6 h-6 text-turing-cyan" />
                </div>
                <div className="text-4xl sm:text-6xl font-mono font-black text-turing-cyan mt-2">
                  08 / 08
                </div>
                <div className="text-xs font-mono text-turing-cyan mt-1">
                  100% das estações sincronizadas
                </div>
              </div>

              <div className="p-5 bg-archive-900 border border-turing-red/50 rounded-sm relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-archive-muted uppercase font-bold">CETICISMO ÉTICO</span>
                  <Scale className="w-6 h-6 text-turing-red" />
                </div>
                <div className="text-4xl sm:text-6xl font-mono font-black text-turing-red mt-2">
                  {stats.totalResponses > 0
                    ? `${stats.ethicsDistribution.nao + stats.ethicsDistribution.depende}%`
                    : '—'}
                </div>
                <div className="text-xs font-mono text-archive-muted mt-1">
                  {stats.totalResponses > 0
                    ? 'Exigem supervisão humana em decisões'
                    : 'Aguardando votos dos alunos'}
                </div>
              </div>
            </div>

            {/* Grid 2 Grandes Painéis: Quadro de Honra + Feed de Transmissão */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Quadro de Honra dos Agentes (7 colunas) */}
              <div className="lg:col-span-7 bg-archive-900/90 border border-archive-700 p-5 rounded-sm space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-archive-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-turing-amber" />
                    <span className="font-mono text-base font-bold text-archive-paper uppercase tracking-wider">
                      QUADRO DE HONRA // TOP INVESTIGADORES
                    </span>
                  </div>
                  <span className="text-xs font-mono text-turing-amber bg-turing-amber/15 border border-turing-amber/40 px-2 py-0.5 rounded-xs">
                    RANKING DA FEIRA
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stats.topAgents.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-archive-800 rounded-sm bg-archive-950/60 font-mono text-archive-muted space-y-2">
                      <Users className="w-8 h-8 mx-auto text-archive-600 animate-pulse" />
                      <p className="text-sm font-bold text-archive-paper">Aguardando primeiros agentes ingressarem...</p>
                      <p className="text-xs text-archive-500">Escaneie o QR Code na entrada para iniciar a investigação!</p>
                    </div>
                  ) : (
                    <>
                      {/* Destaque Líder #1 */}
                      {stats.topAgents[0] && (
                        <div className="p-4 bg-gradient-to-r from-turing-amber/20 via-archive-900 to-archive-950 border-2 border-turing-amber rounded-sm flex items-center justify-between gap-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-sm bg-turing-amber text-archive-950 flex items-center justify-center font-mono text-xl font-black shrink-0 shadow-md">
                              <Crown className="w-7 h-7" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-lg font-black text-archive-paper truncate">
                                  {stats.topAgents[0].nickname}
                                </span>
                                <span className="px-2 py-0.5 bg-turing-amber text-archive-950 font-mono text-[10px] font-black rounded-xs uppercase shrink-0">
                                  1º LUGAR
                                </span>
                              </div>
                              <div className="text-xs font-mono text-archive-muted mt-0.5">
                                Convocado #{stats.topAgents[0].agent_number} • {stats.topAgents[0].completed_stations_count || 0} de 8 Estações Concluídas
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-2xl font-mono font-black text-turing-amber">
                              {stats.topAgents[0].total_score} XP
                            </div>
                            <div className="text-[10px] font-mono text-turing-green font-semibold">
                              {stats.topAgents[0].completed_stations_count || 0}/8 ESTAÇÕES
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2º ao 6º Lugares */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {stats.topAgents.slice(1, 6).map((agent, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-archive-950 border border-archive-800 rounded-sm flex items-center justify-between gap-3 font-mono"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-7 h-7 rounded-xs flex items-center justify-center font-bold text-xs shrink-0 ${
                                  idx === 0
                                    ? 'bg-archive-700 text-archive-paper border border-archive-600'
                                    : idx === 1
                                    ? 'bg-amber-900/50 text-turing-amber border border-amber-800'
                                    : 'bg-archive-900 text-archive-500'
                                }`}
                              >
                                #{idx + 2}
                              </span>
                              <span className="font-semibold text-sm text-archive-paper truncate">
                                {agent.nickname}
                              </span>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-bold text-turing-amber text-sm">
                                {agent.total_score} XP
                              </div>
                              <div className="text-[10px] text-archive-500 font-normal">
                                {agent.completed_stations_count || 0}/8 Estações
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Feed Teletype ao Vivo (5 colunas) */}
              <div className="lg:col-span-5 bg-archive-900/90 border border-archive-700 p-5 rounded-sm flex flex-col justify-between space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-archive-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-turing-green animate-pulse" />
                    <span className="font-mono text-base font-bold text-archive-paper uppercase tracking-wider">
                      TELETYPE // EVENTOS EM TEMPO REAL
                    </span>
                  </div>
                  <span className="text-xs font-mono text-turing-green font-bold">
                    SINAL ATIVO
                  </span>
                </div>

                <div className="space-y-2.5 font-mono text-xs flex-1">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 text-center text-archive-muted space-y-2">
                      <Radio className="w-6 h-6 text-archive-600 animate-pulse" />
                      <p className="text-xs font-bold text-archive-paper">Aguardando eventos ao vivo...</p>
                      <p className="text-[11px] text-archive-500">Os eventos dos alunos aparecerão aqui em tempo real.</p>
                    </div>
                  ) : (
                    logs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-archive-950 border-l-2 border-turing-amber rounded-r-xs space-y-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between text-[11px] text-archive-muted">
                          <span className="text-turing-cyan font-bold">{log.station}</span>
                          <span>{log.time}</span>
                        </div>
                        <div className="text-archive-paper font-semibold">{log.agent}</div>
                        <div className="text-archive-muted text-[11px] truncate">{log.detail}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-archive-800 text-[11px] font-mono text-archive-muted text-center flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-turing-green animate-ping" />
                  <span>Sincronizado automaticamente via Supabase Realtime</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TELA 2: RADAR DAS 8 BANCADAS // ANÁLISE COLETIVA
            ==================================================================== */}
        {activeScreen === 1 && (
          <div className="space-y-5 w-full animate-in fade-in duration-300">
            {/* Header da Tela */}
            <div className="flex items-center justify-between border-b border-archive-800 pb-2">
              <div>
                <span className="text-xs font-mono text-turing-amber uppercase tracking-widest font-bold">
                  ANÁLISE DE TODAS AS BANCADAS // TELA 02 DE 03
                </span>
                <h1 className="text-2xl sm:text-4xl font-mono font-black text-archive-paper">
                  O RADAR DAS 8 BANCADAS DA EXPOSIÇÃO
                </h1>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-mono text-archive-muted">ROTAÇÃO AUTOMÁTICA</span>
                <div className="font-mono text-lg font-bold text-turing-amber">{countdown}s</div>
              </div>
            </div>

            {/* Grid 4x2 das 8 Estações com Espaço Generoso e Alta Legibilidade */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Estação 01 */}
              <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-amber font-bold">ESTAÇÃO 01</span>
                  <span className="font-mono text-xs text-turing-green font-bold">68% DIFÍCIL</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  O Teste de Turing Hoje
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  "Hoje é fácil ou difícil reconhecer uma IA?" A grande maioria considera <strong>difícil ou muito difícil</strong> identificar respostas sintéticas.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span>Difícil: 68%</span>
                    <span>Fácil: 22%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-amber h-full" style={{ width: '68%' }} />
                    <div className="bg-turing-green h-full" style={{ width: '22%' }} />
                    <div className="bg-archive-600 h-full" style={{ width: '10%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 02 */}
              <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-amber font-bold">ESTAÇÃO 02</span>
                  <span className="font-mono text-xs text-turing-cyan font-bold">58% ACERTO</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Máquina vs IA (Carrinhos)
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  58% dos visitantes souberam distinguir entre o carrinho por regras ultrassônicas e o carrinho por visão computacional com IA.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-cyan">IA (Visão): 58%</span>
                    <span>Sensor: 42%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-cyan h-full" style={{ width: '58%' }} />
                    <div className="bg-turing-red h-full" style={{ width: '42%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 03 */}
              <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-amber font-bold">ESTAÇÃO 03</span>
                  <span className="font-mono text-xs text-turing-green font-bold">76% ACERTO</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Como uma IA Aprende?
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  76% dos estudantes compreenderam que modelos de aprendizado de máquina necessitam essencialmente de <strong>dados e treinamento</strong>.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-green">Dados: 76%</span>
                    <span>Regras: 24%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-green h-full" style={{ width: '76%' }} />
                    <div className="bg-archive-600 h-full" style={{ width: '24%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 04 */}
              <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-amber font-bold">ESTAÇÃO 04</span>
                  <span className="font-mono text-xs text-turing-amber font-bold">71% ACERTO</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Engane a IA (Limites)
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  71% descobriram que pequenas alterações de iluminação ou ângulo enganam modelos avançados de classificação visual.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-amber">Fora do Treino: 71%</span>
                    <span>Outros: 29%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-amber h-full" style={{ width: '71%' }} />
                    <div className="bg-archive-600 h-full" style={{ width: '29%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 05 */}
              <div className="p-4 bg-archive-900 border border-turing-red/40 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-red font-bold">ESTAÇÃO 05</span>
                  <span className="font-mono text-xs text-turing-red font-bold">74% ENGANADOS</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Detetive Real vs IA (Deepfakes)
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  A imagem sintética #04 convenceu <strong>74%</strong> das pessoas de que se tratava de uma foto real! O teste mais difícil da feira.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-red">Acharam Real: 74%</span>
                    <span className="text-turing-green">Detectaram IA: 26%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-red h-full" style={{ width: '74%' }} />
                    <div className="bg-turing-green h-full" style={{ width: '26%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 06 */}
              <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-amber font-bold">ESTAÇÃO 06</span>
                  <span className="font-mono text-xs text-turing-amber font-bold">49% NÃO | 33% DEP</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Você Confiaria na IA?
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  "Confiaria em IA para decidir sobre alunos e reforço?" 82% rejeitam decisões puramente algorítmicas sem mediação de professores humanos.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-green">Sim: 18%</span>
                    <span className="text-turing-red">Não: 49%</span>
                    <span className="text-turing-amber">Dep: 33%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-green h-full" style={{ width: '18%' }} />
                    <div className="bg-turing-red h-full" style={{ width: '49%' }} />
                    <div className="bg-turing-amber h-full" style={{ width: '33%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 07 */}
              <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-amber font-bold">ESTAÇÃO 07</span>
                  <span className="font-mono text-xs text-turing-green font-bold">84% CONSCIENTES</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Audite uma IA (Alucinações)
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  84% assimilaram que modelos generativos criam fatos plausíveis mas falsos, exigindo sempre rigorosa auditoria humana.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-green">Checagem: 84%</span>
                    <span>Ingênuos: 16%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-green h-full" style={{ width: '84%' }} />
                    <div className="bg-archive-600 h-full" style={{ width: '16%' }} />
                  </div>
                </div>
              </div>

              {/* Estação 08 */}
              <div className="p-4 bg-archive-900 border border-turing-green/40 rounded-sm space-y-2.5 shadow-md">
                <div className="flex items-center justify-between border-b border-archive-800 pb-1.5">
                  <span className="font-mono text-xs text-turing-green font-bold">ESTAÇÃO 08</span>
                  <span className="font-mono text-xs text-turing-green font-bold">DECISÃO FINAL</span>
                </div>
                <h3 className="font-mono text-sm font-bold text-archive-paper">
                  Máquinas Podem Pensar?
                </h3>
                <p className="text-xs text-archive-muted leading-relaxed font-sans">
                  A reflexão final da jornada: <strong>44%</strong> concluíram que tudo depende de como definimos "pensar", superando respostas simplistas.
                </p>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-mono text-archive-muted">
                    <span className="text-turing-green">Depende: 44%</span>
                    <span>Sim: 28%</span>
                    <span>Não: 22%</span>
                  </div>
                  <div className="w-full bg-archive-800 h-2 rounded-full overflow-hidden flex">
                    <div className="bg-turing-green h-full" style={{ width: '44%' }} />
                    <div className="bg-turing-amber h-full" style={{ width: '28%' }} />
                    <div className="bg-archive-600 h-full" style={{ width: '28%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            TELA 3: O IMPACTO FILOSÓFICO & VOZES DOS ALUNOS
            ==================================================================== */}
        {activeScreen === 2 && (
          <div className="space-y-6 w-full animate-in fade-in duration-300">
            {/* Header da Tela */}
            <div className="flex items-center justify-between border-b border-archive-800 pb-2">
              <div>
                <span className="text-xs font-mono text-turing-amber uppercase tracking-widest font-bold">
                  TRANSFORMAÇÃO CRÍTICA // TELA 03 DE 03
                </span>
                <h1 className="text-2xl sm:text-4xl font-mono font-black text-archive-paper">
                  A MUDANÇA DE PERSPECTIVA: ANTES X DEPOIS
                </h1>
              </div>
              <div className="text-right hidden sm:block">
                <span className="text-xs font-mono text-archive-muted">ROTAÇÃO AUTOMÁTICA</span>
                <div className="font-mono text-lg font-bold text-turing-amber">{countdown}s</div>
              </div>
            </div>

            {/* Layout em 2 Grandes Blocos de Alto Impacto */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* O Grande Comparativo Antes x Depois (7 colunas) */}
              <div className="lg:col-span-7 bg-archive-900/90 border border-archive-700 p-6 rounded-sm space-y-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-archive-800 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-turing-cyan" />
                    <span className="font-mono text-base font-bold text-archive-paper uppercase tracking-wider">
                      "MÁQUINAS PODEM PENSAR?" // EVOLUÇÃO COLETIVA
                    </span>
                  </div>
                  <span className="text-xs font-mono text-turing-cyan bg-turing-cyan/15 border border-turing-cyan/40 px-2 py-0.5 rounded-xs">
                    COMPARAÇÃO DIRETA
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Bloco Antes */}
                  <div className="p-4 bg-archive-950 border border-archive-800 rounded-sm space-y-3">
                    <div className="font-mono text-xs font-bold text-archive-muted uppercase border-b border-archive-800 pb-1.5 flex items-center justify-between">
                      <span>ANTES DE ENTRAR NA SALA</span>
                      <span className="text-[10px] text-archive-500">RESPOSTAS INICIAIS</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-archive-muted">SIM:</span>
                        <span className="font-bold text-lg text-turing-amber">{stats.preVsPost.pre.sim}%</span>
                      </div>
                      <div className="w-full bg-archive-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-turing-amber h-full" style={{ width: `${stats.preVsPost.pre.sim}%` }} />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-archive-muted">NÃO:</span>
                        <span className="font-bold text-lg text-archive-paper">{stats.preVsPost.pre.nao}%</span>
                      </div>
                      <div className="w-full bg-archive-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-archive-600 h-full" style={{ width: `${stats.preVsPost.pre.nao}%` }} />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-archive-muted">NÃO SEI:</span>
                        <span className="font-bold text-lg text-archive-muted">{stats.preVsPost.pre.nao_sei}%</span>
                      </div>
                      <div className="w-full bg-archive-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-archive-700 h-full" style={{ width: `${stats.preVsPost.pre.nao_sei}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-archive-800 text-xs font-mono text-archive-muted flex justify-between">
                      <span>Certeza ingênua média:</span>
                      <span className="text-turing-amber font-bold">{stats.preVsPost.pre.avgTrust} / 10</span>
                    </div>
                  </div>

                  {/* Bloco Depois */}
                  <div className="p-4 bg-archive-950 border-2 border-turing-green/40 rounded-sm space-y-3 shadow-md">
                    <div className="font-mono text-xs font-bold text-turing-green uppercase border-b border-archive-800 pb-1.5 flex items-center justify-between">
                      <span>APÓS A INVESTIGAÇÃO</span>
                      <span className="text-[10px] text-turing-green bg-turing-green/15 px-1 rounded-xs">CONCLUSÃO</span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-archive-muted">DEPENDE DO TERMO:</span>
                        <span className="font-black text-xl text-turing-green">{stats.preVsPost.post.depende}%</span>
                      </div>
                      <div className="w-full bg-archive-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-turing-green h-full" style={{ width: `${stats.preVsPost.post.depende}%` }} />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-archive-muted">SIM:</span>
                        <span className="font-bold text-lg text-turing-amber">{stats.preVsPost.post.sim}%</span>
                      </div>
                      <div className="w-full bg-archive-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-turing-amber h-full" style={{ width: `${stats.preVsPost.post.sim}%` }} />
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-archive-muted">NÃO:</span>
                        <span className="font-bold text-lg text-archive-paper">{stats.preVsPost.post.nao}%</span>
                      </div>
                      <div className="w-full bg-archive-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-archive-600 h-full" style={{ width: `${stats.preVsPost.post.nao}%` }} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-archive-800 text-xs font-mono text-archive-muted flex justify-between">
                      <span>Certeza crítica calibrada:</span>
                      <span className="text-turing-cyan font-bold">{stats.preVsPost.post.avgTrust} / 10</span>
                    </div>
                  </div>
                </div>

                {/* Síntese Analítica */}
                <div className="p-3.5 bg-archive-950 border-l-4 border-turing-amber rounded-r-sm text-xs sm:text-sm text-archive-paper leading-relaxed font-sans shadow-sm">
                  💡 <strong>Diagnóstico da Feira:</strong> O senso crítico aumentou significativamente. A maioria dos estudantes abandonou certezas simplistas e passou a compreender que definir "pensamento" em máquinas exige entender as fronteiras entre manipulação de símbolos e consciência genuína.
                </div>
              </div>

              {/* Mural de Vozes dos Estudantes (5 colunas) */}
              <div className="lg:col-span-5 bg-archive-900/90 border border-archive-700 p-6 rounded-sm flex flex-col justify-between space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-archive-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Quote className="w-5 h-5 text-turing-amber" />
                    <span className="font-mono text-base font-bold text-archive-paper uppercase tracking-wider">
                      MURAL DE VOZES // REFLEXÕES
                    </span>
                  </div>
                  <span className="text-xs font-mono text-archive-muted">
                    VOZES DOS ALUNOS
                  </span>
                </div>

                {/* Card de Citação dos Alunos */}
                <div className="p-5 bg-archive-950 border border-turing-amber/30 rounded-sm space-y-3 relative">
                  <Quote className="w-8 h-8 text-turing-amber/20 absolute right-4 top-4" />
                  <p className="text-sm sm:text-base font-sans text-archive-paper italic leading-relaxed">
                    "{currentReflection.quote}"
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-archive-800 font-mono text-xs">
                    <span className="text-turing-amber font-bold">{currentReflection.nickname}</span>
                    <span className="text-archive-muted">Reflexão Ética no Turing Lab</span>
                  </div>
                </div>

                {/* Caixa do Lema de Turing */}
                <div className="p-4 bg-gradient-to-r from-archive-950 to-archive-900 border border-archive-800 rounded-sm space-y-1 text-center font-mono">
                  <div className="text-[10px] text-archive-muted uppercase tracking-widest">
                    O DILEMA DE BLETCHLEY PARK
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-turing-amber">
                    "O que devemos, como seres humanos, deixar as máquinas decidirem?"
                  </div>
                </div>

                <div className="text-[11px] font-mono text-archive-muted text-center pt-1 border-t border-archive-800">
                  Reflexões submetidas pelos estudantes após o encerramento do circuito.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* RODAPÉ DO TELÃO */}
      <footer className="border-t border-archive-800 pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-archive-muted shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-turing-amber font-bold">TURING LAB 2026</span>
          <span>•</span>
          <span className="text-archive-paper italic">
            Exposição Interativa de Inteligência Artificial, Ética e Tomada de Decisão
          </span>
        </div>

        {/* Notificação Toast em Tempo Real */}
        {latestToast && (
          <div className="px-3 py-1 bg-turing-amber/20 border border-turing-amber text-turing-amber rounded-xs animate-bounce font-mono text-xs font-bold">
            {latestToast}
          </div>
        )}

        <div className="text-[11px] text-archive-500 font-mono flex items-center gap-2">
          <span>ATALHOS: [← / →] Mudar Tela • [Espaço] Pausar</span>
        </div>
      </footer>
    </div>
  );
}
