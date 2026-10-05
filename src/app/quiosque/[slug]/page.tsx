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
    <div className="min-h-screen bg-archive-950 text-archive-paper flex flex-col justify-between p-4 sm:p-6 md:p-8 select-none overflow-x-hidden">
      {/* 1. CABEÇALHO LIMPO E AMIGÁVEL */}
      <header className="flex items-center justify-between border-b border-archive-800 pb-3 max-w-5xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 rounded-full bg-turing-green animate-pulse shadow-[0_0_10px_#10b981]" />
          <div>
            <span className="text-xs sm:text-sm font-mono font-bold text-turing-amber uppercase tracking-wider block">
              ESTAÇÃO {String(station.order).padStart(2, '0')} DE 08
            </span>
            <h1 className="text-base sm:text-xl font-bold text-archive-paper leading-tight">
              {station.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botão de Tela Cheia */}
          <button
            onClick={toggleFullscreen}
            className="text-xs font-mono text-archive-muted hover:text-archive-paper border border-archive-700 hover:border-archive-500 px-3 py-1.5 rounded-sm transition-colors cursor-pointer"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? '⤢ Sair da Tela Cheia' : '⛶ Tela Cheia'}
          </button>
        </div>
      </header>

      {/* 2. CENTRO: PERGUNTA OBJETIVA E OPÇÕES GRANDES */}
      <main className="max-w-4xl lg:max-w-5xl w-full mx-auto my-auto py-4 sm:py-6">
        {!hasVoted ? (
          /* TELA DE VOTAÇÃO: 2 PASSOS CLAROS E DIRETOS */
          <div className="space-y-6">
            {/* Bloco da Pergunta Principal */}
            <div className="bg-archive-900 border-2 border-turing-amber/70 rounded-md p-5 sm:p-7 shadow-xl space-y-4">
              {/* Passo 1 - Instrução Direta */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-turing-amber/15 border border-turing-amber/40 rounded-full text-xs sm:text-sm font-bold text-turing-amber">
                <span>Passo 1</span>
                <span className="text-archive-paper font-normal">•</span>
                <span>Leia a pergunta da bancada</span>
              </div>

              {/* Texto da Pergunta Gigante e Acessível */}
              <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-archive-paper leading-snug tracking-normal">
                {station.prompt}
              </h2>

              {/* Explicação contextual em português simples */}
              {station.context && (
                <p className="text-sm sm:text-base text-archive-muted leading-relaxed pt-1 border-t border-archive-800">
                  💡 <strong>Entenda o cenário:</strong> {station.context}
                </p>
              )}
            </div>

            {/* Bloco das Opções de Resposta */}
            <div className="space-y-3">
              {/* Passo 2 - Instrução Direta */}
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-archive-paper px-1">
                <span className="text-turing-amber flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-turing-amber text-archive-950 flex items-center justify-center font-black text-xs">
                    2
                  </span>
                  <span>Toque ou clique na sua resposta:</span>
                </span>
                <span className="text-archive-muted text-xs font-normal hidden sm:inline">
                  (Basta um toque na tela)
                </span>
              </div>

              {/* Botões Grandes e Espaçados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {station.options.map((opt, idx) => {
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  const letterBadge = letters[idx] || String(idx + 1);

                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleVote(opt.value)}
                      className="p-4 sm:p-5 md:p-6 rounded-md border-2 bg-archive-850 border-archive-700 hover:border-turing-amber hover:bg-turing-amber/10 active:scale-[0.98] text-archive-paper text-left transition-all duration-150 flex items-center gap-4 shadow-lg cursor-pointer group"
                    >
                      {/* Letra da opção em destaque */}
                      <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-sm bg-archive-950 border border-archive-600 group-hover:border-turing-amber group-hover:bg-turing-amber group-hover:text-archive-950 text-turing-amber font-mono text-base sm:text-lg font-black flex items-center justify-center shrink-0 transition-colors">
                        {letterBadge}
                      </span>

                      {/* Texto da Opção com Letra Grande */}
                      <span className="text-base sm:text-lg md:text-xl font-bold leading-snug group-hover:text-turing-amber transition-colors flex-1">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* TELA DE AGRADECIMENTO E INSIGHT PÓS-VOTO */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Cartão de Sucesso Gigante */}
            <div className="bg-archive-900 border-2 border-turing-green/60 rounded-md p-6 sm:p-8 shadow-2xl space-y-5 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-archive-800 pb-4">
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                  <div className="w-12 h-12 rounded-full bg-turing-green/20 border-2 border-turing-green flex items-center justify-center text-turing-green shrink-0">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-turing-green">
                      Resposta Registrada!
                    </h3>
                    <p className="text-xs sm:text-sm text-archive-muted">
                      Seu voto já foi computado no telão geral da feira.
                    </p>
                  </div>
                </div>

                <div className="text-xs font-mono text-archive-muted bg-archive-950 px-3 py-1.5 rounded-sm border border-archive-800 self-center">
                  Obrigado por participar!
                </div>
              </div>

              {/* Explicação Didática Simples */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-turing-amber uppercase tracking-wider font-bold">
                  O que aprendemos nesta bancada:
                </div>
                <h4 className="text-lg sm:text-2xl font-bold text-archive-paper leading-snug">
                  {station.explanation.title}
                </h4>
                <p className="text-sm sm:text-base md:text-lg text-archive-paper/90 leading-relaxed font-sans">
                  {station.explanation.description}
                </p>
              </div>

              {/* Frase de Reflexão Central */}
              {station.explanation.insight && (
                <div className="p-4 bg-archive-950 border-l-4 border-turing-amber rounded-r-md">
                  <p className="text-base sm:text-lg font-medium text-turing-paper italic text-archive-paper">
                    "{station.explanation.insight}"
                  </p>
                </div>
              )}
            </div>

            {/* Barra de Próximo Visitante em Destaque */}
            <div className="bg-archive-900 border border-archive-700 p-4 sm:p-5 rounded-md space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-archive-muted flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 animate-spin text-turing-amber" />
                  <span>Próximo visitante em <strong>{countdown} segundos</strong>...</span>
                </span>
                <span className="text-turing-amber font-mono font-black text-lg bg-archive-950 px-3 py-0.5 border border-archive-700 rounded-sm">
                  {countdown}s
                </span>
              </div>

              {/* Barra de Progresso do Tempo */}
              <div className="w-full bg-archive-950 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-turing-green h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${(countdown / AUTO_RESET_SECONDS) * 100}%` }}
                />
              </div>

              {/* Botão Gigante de Liberação Imediata */}
              <button
                type="button"
                onClick={handleReset}
                className="w-full py-4 px-6 bg-turing-amber hover:bg-amber-400 active:scale-[0.99] text-archive-950 font-extrabold text-base sm:text-lg rounded-sm transition-all duration-150 flex items-center justify-center gap-3 cursor-pointer shadow-lg uppercase tracking-wider"
              >
                <FastForward className="w-5 h-5" />
                <span>Próximo Visitante (Liberar Agora)</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* 3. RODAPÉ DISCRETO */}
      <footer className="border-t border-archive-800 pt-3 max-w-5xl w-full mx-auto flex items-center justify-between text-xs text-archive-muted">
        <span>CIARTE 2026 • Turing Lab</span>
        <span>Bancada Interativa</span>
      </footer>
    </div>
  );
}
