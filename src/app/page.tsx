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
      {/* Cabeçalho de Dossiê */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-archive-800 border border-archive-700 rounded-sm text-xs font-mono text-turing-amber uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-turing-amber" />
          <span>Feira de Ciências 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-mono font-extrabold tracking-tight text-archive-paper">
          TURING LAB
        </h1>
        <p className="text-xs sm:text-sm font-mono text-archive-muted uppercase tracking-wider">
          <DecryptionText text="DOCUMENTO DE ACESSO // CLASSIFICADO" speed={20} />
        </p>
      </div>

      {/* Cartão de Identificação do Agente */}
      <ClassifiedCard
        title="CREDENCIAL DE ACESSO"
        badge="ATIVO"
        badgeVariant="complete"
        className="w-full text-center space-y-3"
      >
        <div className="py-2">
          <div className="text-xs font-mono text-archive-muted uppercase">Sua Identificação Oficial</div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-turing-amber tracking-wider mt-1">
            {agent?.nickname || 'AGENTE #0101'}
          </div>
          <p className="text-xs text-archive-muted mt-2 max-w-md mx-auto">
            Sua identidade é 100% anônima. Você foi convocado para investigar uma das perguntas mais
            cruciais da história da computação:
          </p>
          <div className="mt-3 py-2 px-4 bg-archive-950/80 border border-archive-700 rounded-sm inline-block">
            <span className="font-mono text-sm sm:text-base font-bold text-turing-green">
              "MÁQUINAS PODEM PENSAR?"
            </span>
          </div>
        </div>
      </ClassifiedCard>

      {/* Formulário Inicial: Pergunta Prévia */}
      <form onSubmit={handleStartInvestigation} className="w-full space-y-5">
        <ClassifiedCard
          title="ETAPA 00 // REGISTRO PRELIMINAR"
          badge="OBRIGATÓRIO"
          badgeVariant="amber"
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-mono font-semibold text-archive-paper">
              1. Antes de iniciar sua jornada pelas bancadas da exposição: você acredita que máquinas podem pensar?
            </label>

            <div className="grid grid-cols-3 gap-2 pt-1">
              {(['SIM', 'NAO', 'NAO_SEI'] as OpinionOption[]).map((option) => (
                <button
                  type="button"
                  key={option}
                  onClick={() => setSelectedOpinion(option)}
                  className={`py-3 px-2 rounded-sm border font-mono text-xs sm:text-sm font-bold uppercase transition-all duration-150 ${
                    selectedOpinion === option
                      ? 'bg-turing-amber text-archive-950 border-turing-amber shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-archive-900 text-archive-paper border-archive-700 hover:border-archive-500'
                  }`}
                >
                  {option === 'NAO_SEI' ? 'NÃO SEI' : option}
                </button>
              ))}
            </div>
          </div>

          {/* Slider de Nível de Confiança */}
          <div className="pt-3 border-t border-archive-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-archive-muted">2. Quanto você confia em informações geradas por IA?</span>
              <span className="font-bold text-turing-amber bg-archive-900 px-2 py-0.5 border border-archive-700 rounded-xs">
                {trustLevel} / 10
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              value={trustLevel}
              onChange={(e) => setTrustLevel(Number(e.target.value))}
              className="w-full accent-turing-amber cursor-pointer bg-archive-950 h-2 rounded-lg"
            />

            <div className="flex justify-between text-[10px] font-mono text-archive-500">
              <span>0 — Não confio</span>
              <span>5 — Neutro</span>
              <span>10 — Confio totalmente</span>
            </div>
          </div>
        </ClassifiedCard>

        {/* Botão de Iniciar */}
        <TerminalButton
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedOpinion || hasStarted}
        >
          <span>INICIAR INVESTIGAÇÃO NO LAB</span>
          <ArrowRight className="w-5 h-5" />
        </TerminalButton>

        <p className="text-center text-[11px] font-mono text-archive-500">
          * Nenhum dado pessoal é coletado. Suas respostas ajudarão a construir o telão coletivo da feira.
        </p>
      </form>
    </div>
  );
}
