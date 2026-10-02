'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { STATIONS_DATA } from '@/lib/constants/stations';
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

    // Registra voto de quiosque anônimo
    const kioskResponse = {
      visitor_id: `kiosk-${slug}-${Date.now()}`,
      station_id: station.slug,
      question_id: `q-${station.slug}`,
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

  return (
    <div className="fixed inset-0 bg-archive-950 text-archive-paper bg-military-grid flex flex-col justify-between p-4 sm:p-8 select-none overflow-y-auto">
      {/* 1. TOPO: IDENTIFICADOR DO TERMINAL */}
      <div className="flex items-center justify-between border-b border-archive-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-turing-green animate-pulse" />
          <span className="font-mono text-xs sm:text-sm font-bold text-turing-amber tracking-wider uppercase">
            TERMINAL FÍSICO // BANCADA {String(station.order).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] text-archive-muted hidden sm:inline">
            MODO TOTEM LIVRE
          </span>

          {/* Botão de reset manual se alguém largar o totem pela metade */}
          {!hasVoted && (
            <button
              onClick={handleSkipToExplanation}
              className="text-[11px] font-mono text-archive-muted hover:text-turing-amber flex items-center gap-1 border border-archive-700 px-2.5 py-1 rounded-xs"
            >
              <FastForward className="w-3 h-3" />
              <span>Apenas Ver Explicação</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CENTRO: EXPERIÊNCIA DE VOTO OU RESULTADO */}
      <div className="max-w-2xl w-full mx-auto my-auto py-6 space-y-6">
        {!hasVoted ? (
          /* TELA A: PERGUNTA E BOTÕES DE TOQUE */
          <div className="space-y-6">
            <div className="space-y-2 text-center sm:text-left">
              <div className="text-xs font-mono text-turing-amber uppercase tracking-wider">
                {station.subtitle}
              </div>
              <h1 className="text-2xl sm:text-3xl font-mono font-bold text-archive-paper">
                {station.title}
              </h1>
              <p className="text-xs sm:text-sm text-archive-muted font-sans leading-relaxed pt-1">
                {station.context}
              </p>
            </div>

            <div className="p-4 bg-archive-900 border border-archive-700 rounded-sm space-y-4">
              <div className="text-xs sm:text-sm font-mono font-bold text-turing-amber flex items-center gap-2">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>{station.prompt}</span>
              </div>

              {/* Botões grandes de votação com touch ágil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {station.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleVote(opt.value)}
                    className="p-4 sm:p-5 rounded-sm border bg-archive-850 border-archive-700 text-archive-paper hover:bg-turing-amber/15 hover:border-turing-amber active:scale-[0.98] font-mono text-sm sm:text-base font-semibold text-left transition-all duration-150 flex items-center justify-between gap-3 shadow-md"
                  >
                    <span>{opt.label}</span>
                    <div className="w-3 h-3 rounded-full border border-archive-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center text-[11px] font-mono text-archive-500">
              * Toque em uma opção para votar instantaneamente. Nenhum dado pessoal é exigido.
            </div>
          </div>
        ) : (
          /* TELA B: RESULTADO, INSIGHT E BARRA DE CONTROLE */
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <ClassifiedCard
              title="OPINIÃO REGISTRADA NO LAB"
              badge="CONFIRMADO"
              badgeVariant="complete"
              className="space-y-4 bg-archive-900 border-turing-green/40 p-6"
            >
              <div className="flex items-center gap-2 text-turing-green font-mono text-sm font-bold uppercase">
                <CheckCircle2 className="w-5 h-5" />
                <span>Voto Contabilizado no Telão Coletivo!</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-mono font-bold text-archive-paper">
                  {station.explanation.title}
                </h2>
                <p className="text-xs sm:text-sm text-archive-paper/90 leading-relaxed font-sans pt-1">
                  {station.explanation.description}
                </p>
              </div>

              <div className="p-3 bg-archive-950 border border-archive-800 rounded-sm">
                <div className="text-[10px] font-mono text-turing-amber uppercase tracking-wider font-bold">
                  REFLEXÃO DA BANCADA
                </div>
                <p className="text-xs sm:text-sm font-mono text-archive-paper mt-1 italic">
                  "{station.explanation.insight}"
                </p>
              </div>
            </ClassifiedCard>

            {/* Painel de Reset Automático e Aceleração */}
            <div className="bg-archive-900 border border-archive-700 p-4 rounded-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-archive-muted flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparando para o próximo visitante em:</span>
                </span>
                <span className="text-turing-amber font-bold text-sm bg-archive-950 px-2 py-0.5 border border-archive-700 rounded-xs">
                  {countdown}s
                </span>
              </div>

              {/* Barra de Progresso do Countdown */}
              <div className="w-full bg-archive-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-turing-amber h-full transition-all duration-1000 rounded-full"
                  style={{ width: `${(countdown / AUTO_RESET_SECONDS) * 100}%` }}
                />
              </div>

              {/* Botão de Pular a Espera (Acelera a fila) */}
              <TerminalButton
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={handleReset}
              >
                <FastForward className="w-4 h-4" />
                <span>PULAR ESPERA / PRÓXIMO VISITANTE</span>
              </TerminalButton>
            </div>
          </div>
        )}
      </div>

      {/* 3. RODAPÉ DO QUIOSQUE */}
      <div className="border-t border-archive-800 pt-3 flex items-center justify-between text-[11px] font-mono text-archive-500">
        <span>TURING LAB 2026 // FEIRA ESCOLAR</span>
        <span>MODO BANCADA TOUCH</span>
      </div>
    </div>
  );
}
