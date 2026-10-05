'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { STATIONS_DATA, getStationUuid } from '@/lib/constants/stations';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import { enqueueOfflineResponse } from '@/lib/storage/offline-sync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  RotateCcw,
  FastForward,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

const AUTO_RESET_SECONDS = 6;

export default function KioskStationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const station = STATIONS_DATA.find((s) => s.slug === slug);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_RESET_SECONDS);

  // Auto-reset timer após votar
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (hasVoted) {
      setCountdown(AUTO_RESET_SECONDS);
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleReset();
            return AUTO_RESET_SECONDS;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasVoted]);

  const handleReset = () => {
    setSelectedOption(null);
    setHasVoted(false);
    setCountdown(AUTO_RESET_SECONDS);
  };

  if (!station) {
    return (
      <div className="min-h-screen bg-archive-950 flex flex-col items-center justify-center p-6 text-center text-archive-paper">
        <h1 className="text-xl font-mono text-turing-red">ESTAÇÃO DE QUIOSQUE NÃO ENCONTRADA</h1>
        <p className="text-xs text-archive-muted mt-2">Slug inválido: {slug}</p>
      </div>
    );
  }

  const handleVote = async (optionValue: string) => {
    setSelectedOption(optionValue);
    setHasVoted(true);

    const chosenOptionObj = station.options.find((o) => o.value === optionValue);
    const isCorrect = chosenOptionObj?.isCorrect ?? true;

    // Registra voto de quiosque anônimo com UUID da estação
    const kioskResponse = {
      visitor_id: null,
      station_id: getStationUuid(station.slug),
      question_id: null,
      selected_option: optionValue,
      is_correct: isCorrect,
      is_kiosk_vote: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('responses').insert([kioskResponse]);
      } catch (err) {
        enqueueOfflineResponse(kioskResponse);
      }
    } else {
      enqueueOfflineResponse(kioskResponse);
    }
  };

  const handleSkipToExplanation = () => {
    // Permite que o visitante pule o voto e veja diretamente o insight pedagógico
    setSelectedOption('PULOU');
    setHasVoted(true);
  };

  // Toggle tela cheia para facilitar no notebook
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="min-h-screen bg-archive-950 text-archive-paper bg-military-grid flex flex-col justify-between p-3 sm:p-5 md:p-6 select-none overflow-x-hidden">
      {/* 1. TOPO: IDENTIFICADOR DO TERMINAL */}
      <div className="flex items-center justify-between border-b border-archive-800 pb-2.5 max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-turing-green animate-pulse shadow-[0_0_8px_#10b981]" />
          <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-turing-amber tracking-wider uppercase">
            TERMINAL // BANCADA {String(station.order).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Botão de Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="text-[11px] sm:text-xs font-mono text-archive-muted hover:text-archive-paper border border-archive-700 hover:border-archive-500 px-2.5 py-1 rounded-xs transition-colors"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? '⤢ Janela' : '⛶ Tela Cheia'}
          </button>

          {/* Botão de reset manual se alguém largar o totem pela metade */}
          {!hasVoted && (
            <button
              onClick={handleSkipToExplanation}
              className="text-[11px] sm:text-xs font-mono text-archive-muted hover:text-turing-amber flex items-center gap-1 border border-archive-700 px-2.5 py-1 rounded-xs transition-colors"
            >
              <FastForward className="w-3 h-3" />
              <span>Ver Explicação</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CENTRO: EXPERIÊNCIA DE VOTO OU RESULTADO */}
      <div className="max-w-4xl lg:max-w-5xl w-full mx-auto my-auto py-3 sm:py-5">
        {!hasVoted ? (
          /* TELA A: PERGUNTA E BOTÕES DE TOQUE */
          <div className="space-y-4 sm:space-y-5">
            {/* Cabeçalho da Bancada */}
            <div className="space-y-1 text-center sm:text-left border-l-4 border-turing-amber pl-3 sm:pl-4 py-0.5">
              <div className="text-xs sm:text-sm font-mono text-turing-amber uppercase tracking-widest font-bold">
                ESTAÇÃO {String(station.order).padStart(2, '0')} • {station.subtitle}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-archive-paper">
                {station.title}
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-archive-muted font-sans leading-snug">
                {station.context}
              </p>
            </div>

            {/* CAIXA PRINCIPAL DA PERGUNTA EM DESTAQUE GIGANTE */}
            <div className="p-4 sm:p-6 bg-archive-900 border-2 border-turing-amber/60 rounded-sm space-y-4 shadow-2xl">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-turing-amber uppercase tracking-wider font-bold">
                  <HelpCircle className="w-4 h-4 text-turing-amber shrink-0" />
                  <span>PERGUNTA PARA VOTAR NA BANCADA:</span>
                </div>
                {/* TEXTO DA PERGUNTA BEM GRANDE PARA PAIS E VISITANTES */}
                <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-[2rem] font-mono font-black text-archive-paper leading-tight tracking-tight">
                  {station.prompt}
                </h2>
              </div>

              {/* Botões grandes de votação com touch ágil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                {station.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleVote(opt.value)}
                    className="p-4 sm:p-5 md:p-6 rounded-sm border-2 bg-archive-850 border-archive-700 hover:border-turing-amber hover:bg-turing-amber/15 active:scale-[0.98] text-archive-paper font-mono text-sm sm:text-base md:text-lg font-bold text-left transition-all duration-150 flex items-center justify-between gap-3 shadow-lg cursor-pointer group"
                  >
                    <span className="leading-snug group-hover:text-amber-300 transition-colors">
                      {opt.label}
                    </span>
                    <div className="w-4 h-4 rounded-full border-2 border-archive-600 group-hover:border-turing-amber group-hover:bg-turing-amber shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-xs font-mono text-archive-muted">
              👆 Toque ou clique em uma das opções acima para votar. Seu voto vai direto para o telão!
            </div>
          </div>
        ) : (
          /* TELA B: RESULTADO, INSIGHT E BARRA DE CONTROLE */
          <div className="space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <ClassifiedCard
              title="OPINIÃO REGISTRADA NO LAB"
              badge="CONFIRMADO"
              badgeVariant="complete"
              className="space-y-4 bg-archive-900 border-2 border-turing-green/50 p-5 sm:p-7 shadow-2xl"
            >
              <div className="flex items-center gap-2.5 text-turing-green font-mono text-base sm:text-lg font-bold uppercase">
                <CheckCircle2 className="w-6 h-6 text-turing-green shrink-0" />
                <span>Voto Contabilizado no Telão Coletivo da Feira!</span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-mono font-black text-archive-paper">
                  {station.explanation.title}
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-archive-paper/90 leading-relaxed font-sans">
                  {station.explanation.description}
                </p>
              </div>

              <div className="p-4 bg-archive-950 border border-turing-amber/40 rounded-sm">
                <div className="text-xs font-mono text-turing-amber uppercase tracking-wider font-bold">
                  REFLEXÃO DA BANCADA // TURING LAB
                </div>
                <p className="text-sm sm:text-base md:text-lg font-mono text-turing-paper mt-1 italic font-semibold text-archive-paper">
                  "{station.explanation.insight}"
                </p>
              </div>
            </ClassifiedCard>

            {/* Painel de Reset Automático e Aceleração */}
            <div className="bg-archive-900 border border-archive-700 p-4 sm:p-5 rounded-sm space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                <span className="text-archive-muted flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 animate-spin text-turing-amber" />
                  <span>Preparando para o próximo visitante em:</span>
                </span>
                <span className="text-turing-amber font-mono font-bold text-base sm:text-lg bg-archive-950 px-3 py-1 border border-archive-700 rounded-xs">
                  {countdown}s
                </span>
              </div>

              {/* Barra de Progresso do Countdown */}
              <div className="w-full bg-archive-950 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-turing-amber h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${(countdown / AUTO_RESET_SECONDS) * 100}%` }}
                />
              </div>

              {/* Botão de Pular a Espera (Acelera a fila) */}
              <TerminalButton
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleReset}
              >
                <FastForward className="w-5 h-5" />
                <span>PRÓXIMO VISITANTE (LIBERAR TELA AGORA)</span>
              </TerminalButton>
            </div>
          </div>
        )}
      </div>

      {/* 3. RODAPÉ DO QUIOSQUE */}
      <div className="border-t border-archive-800 pt-2 max-w-5xl w-full mx-auto flex items-center justify-between text-[11px] sm:text-xs font-mono text-archive-500">
        <span>TURING LAB 2026 // CIARTE</span>
        <span>MODO BANCADA TOUCH / NOTEBOOK</span>
      </div>
    </div>
  );
}
