'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAgent } from '@/hooks/useAgent';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import { DecryptionText } from '@/components/ui/DecryptionText';
import { OpinionOption } from '@/types';
import { ArrowRight, ShieldCheck, HelpCircle, Sparkles } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { agent, recordPreOpinion } = useAgent();
  const [selectedOpinion, setSelectedOpinion] = useState<OpinionOption | null>(null);
  const [trustLevel, setTrustLevel] = useState<number>(5);
  const [hasStarted, setHasStarted] = useState(false);

  const handleStartInvestigation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpinion) return;

    recordPreOpinion(selectedOpinion, trustLevel);
    setHasStarted(true);

    setTimeout(() => {
      router.push('/passaporte');
    }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 sm:py-8 max-w-xl mx-auto space-y-6">
      {/* Cabeçalho Amigável com Convite para o Espaço Maker */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-archive-850 border border-turing-amber/50 rounded-full text-xs sm:text-sm font-bold text-turing-amber shadow-sm">
          <Sparkles className="w-4 h-4 text-turing-amber" />
          <span>Feira de Ciências CIARTE 2026</span>
        </div>

        <div>
          <h1 className="text-3xl sm:text-5xl font-black text-archive-paper tracking-tight">
            Turing<span className="text-turing-amber">LAB</span>
          </h1>
          <p className="text-base sm:text-lg font-bold text-turing-amber mt-2">
            📍 Visite-nos no <span className="underline decoration-turing-amber/60 underline-offset-4 text-archive-paper font-black">Espaço Maker</span> e investigue a IA!
          </p>
        </div>

        <p className="text-xs sm:text-sm text-archive-muted max-w-md mx-auto leading-relaxed">
          Participe dos experimentos práticos nas 8 bancadas da sala, responda pelo celular e acompanhe os votos ao vivo no telão!
        </p>
      </div>

      {/* Cartão de Identificação Simples */}
      <div className="w-full bg-archive-900 border-2 border-archive-700 rounded-md p-5 text-center space-y-2 shadow-lg">
        <span className="text-xs font-mono text-archive-muted uppercase tracking-wider block">
          Seu Crachá de Visitante
        </span>
        <div className="text-2xl sm:text-3xl font-mono font-black text-turing-amber">
          {agent?.nickname || 'AGENTE #0101'}
        </div>
        <p className="text-xs text-archive-muted">
          Participação anônima e gratuita. Seus votos vão direto para o telão da feira!
        </p>
      </div>

      {/* Pergunta Rápida Antes de Começar */}
      <form onSubmit={handleStartInvestigation} className="w-full space-y-5">
        <div className="bg-archive-900 border-2 border-turing-amber/60 rounded-md p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-turing-amber/15 border border-turing-amber/40 rounded-full text-xs font-bold text-turing-amber">
              <span>Pergunta rápida</span>
            </div>

            <label className="block text-base sm:text-lg font-bold text-archive-paper leading-snug">
              Antes de visitar as bancadas: você acha que as máquinas podem pensar?
            </label>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {(['SIM', 'NAO', 'NAO_SEI'] as OpinionOption[]).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setSelectedOpinion(option)}
                  className={`py-3.5 px-3 rounded-md border-2 font-bold text-sm sm:text-base uppercase transition-all duration-150 cursor-pointer ${
                    selectedOpinion === option
                      ? 'bg-turing-amber text-archive-950 border-turing-amber shadow-lg scale-[1.02]'
                      : 'bg-archive-950 text-archive-paper border-archive-700 hover:border-archive-500 hover:bg-archive-850'
                  }`}
                >
                  {option === 'NAO_SEI' ? 'NÃO SEI' : option}
                </button>
              ))}
            </div>
          </div>

          {/* Slider de Nível de Confiança */}
          <div className="pt-4 border-t border-archive-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs sm:text-sm font-medium">
              <span className="text-archive-paper">Quanto você confia no que uma IA responde?</span>
              <span className="font-mono font-bold text-turing-amber bg-archive-950 px-2.5 py-1 border border-archive-700 rounded-sm">
                Nota: {trustLevel} / 10
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              value={trustLevel}
              onChange={(e) => setTrustLevel(Number(e.target.value))}
              className="w-full accent-turing-amber cursor-pointer bg-archive-950 h-3 rounded-lg"
            />

            <div className="flex justify-between text-xs text-archive-muted">
              <span>0 (Pouco)</span>
              <span>5 (Médio)</span>
              <span>10 (Total)</span>
            </div>
          </div>
        </div>

        {/* Botão de Iniciar Bem Grande */}
        <button
          type="submit"
          disabled={!selectedOpinion || hasStarted}
          className="w-full py-4 px-6 bg-turing-amber hover:bg-amber-400 disabled:opacity-40 text-archive-950 font-black text-base sm:text-lg rounded-md transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl uppercase tracking-wider"
        >
          <span>Começar Visita no Laboratório</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-center text-xs text-archive-muted">
          🔒 Nenhum dado pessoal é exigido. Bom passeio pela feira!
        </p>
      </form>
    </div>
  );
}
