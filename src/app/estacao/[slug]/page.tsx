'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { STATIONS_DATA } from '@/lib/constants/stations';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import { DecryptionText } from '@/components/ui/DecryptionText';
import { enqueueOfflineResponse } from '@/lib/storage/offline-sync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Award,
  Sparkles,
  HelpCircle,
  Share2,
} from 'lucide-react';

export default function StationPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const station = STATIONS_DATA.find((s) => s.slug === slug);
  const { agent, completedStations, completeStation } = useAgent();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [influenceFactor, setInfluenceFactor] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(() => completedStations.includes(slug));

  if (!station) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-xl font-mono text-turing-red">ESTAÇÃO NÃO ENCONTRADA</h1>
        <p className="text-xs text-archive-muted">O QR Code escaneado não corresponde a uma bancada ativa.</p>
        <Link href="/passaporte" className="inline-block text-xs font-mono text-turing-amber underline">
          ← Voltar ao Passaporte
        </Link>
      </div>
    );
  }

  const handleConfirmAnswer = async () => {
    if (!selectedOption || !agent) return;

    setIsSubmitting(true);
    const chosenOptionObj = station.options.find((o) => o.value === selectedOption);
    const isCorrect = chosenOptionObj?.isCorrect ?? true;

    // Enviar ou enfileirar resposta
    const responsePayload = {
      visitor_id: agent.id,
      station_id: station.slug,
      question_id: `q-${station.slug}`,
      selected_option: selectedOption,
      is_correct: isCorrect,
      is_kiosk_vote: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('responses').insert([responsePayload]);
      } catch (err) {
        console.warn('Persistindo na fila offline devido a timeout:', err);
        enqueueOfflineResponse(responsePayload);
      }
    } else {
      enqueueOfflineResponse(responsePayload);
    }

    // Atualizar estado do agente localmente
    completeStation(station.slug, station.xp);
    setHasAnswered(true);
    setIsSubmitting(false);
  };

  const nextStationIndex = STATIONS_DATA.findIndex((s) => s.slug === slug) + 1;
  const nextStation = STATIONS_DATA[nextStationIndex];

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Botão de Retorno */}
      <div className="flex items-center justify-between text-xs font-mono">
        <Link
          href="/passaporte"
          className="text-archive-muted hover:text-archive-paper flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ PASSAPORTE ]</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-archive-900 border border-turing-amber/40 text-turing-amber text-[10px] font-mono font-bold rounded-xs tracking-wider">
            CÓDIGO: {station.code}
          </span>
          <span className="text-turing-amber font-semibold">
            ESTAÇÃO {String(station.order).padStart(2, '0')} DE 08
          </span>
        </div>
      </div>

      {/* Cartão de Dossiê da Estação */}
      <ClassifiedCard
        title={`ARQUIVO CONFIDENCIAL // ESTAÇÃO ${station.order}`}
        badge={hasAnswered ? 'INVESTIGADA' : 'EM ANDAMENTO'}
        badgeVariant={hasAnswered ? 'complete' : 'amber'}
        className="space-y-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-mono font-bold text-archive-paper">
            {station.title}
          </h1>
          <div className="text-xs font-mono text-turing-amber font-semibold mt-0.5">
            {station.subtitle}
          </div>
        </div>

        {/* Contexto da Bancada Física */}
        <div className="p-3 bg-archive-950/80 border-l-2 border-turing-amber rounded-r-sm text-xs sm:text-sm text-archive-paper/90 leading-relaxed font-sans">
          {station.context}
        </div>

        {/* Pergunta da Estação */}
        <div className="pt-2 space-y-3">
          <label className="block text-xs sm:text-sm font-mono font-bold text-archive-paper">
            DESAFIO: {station.prompt}
          </label>

          {/* Opções de Resposta */}
          <div className="space-y-2 pt-1">
            {station.options.map((opt) => {
              const isSelected = selectedOption === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  disabled={hasAnswered}
                  onClick={() => setSelectedOption(opt.value)}
                  className={`w-full text-left p-3.5 rounded-sm border font-mono text-xs sm:text-sm transition-all duration-150 flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-turing-amber/20 border-turing-amber text-archive-paper font-semibold shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                      : 'bg-archive-900 border-archive-700 text-archive-paper/90 hover:border-archive-500 hover:bg-archive-800'
                  } ${hasAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span>{opt.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-turing-amber bg-turing-amber text-archive-950'
                        : 'border-archive-600'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-archive-950" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pergunta extra opcional para Detetive Real x IA */}
          {slug === 'real-ou-ia' && !hasAnswered && (
            <div className="pt-2 space-y-1.5">
              <label className="text-[11px] font-mono text-archive-muted block">
                O que mais chamou sua atenção para decidir?
              </label>
              <select
                value={influenceFactor}
                onChange={(e) => setInfluenceFactor(e.target.value)}
                className="w-full bg-archive-950 border border-archive-700 text-xs font-mono text-archive-paper p-2 rounded-xs outline-none focus:border-turing-amber"
              >
                <option value="">Selecione um fator (opcional)...</option>
                <option value="maos">Mãos ou dedos</option>
                <option value="olhos">Olhos e reflexos</option>
                <option value="iluminacao">Iluminação ou sombras</option>
                <option value="pele">Textura de pele muito lisa</option>
                <option value="intuiçao">Pura intuição</option>
                <option value="outro">Outro detalhe</option>
              </select>
            </div>
          )}
        </div>

        {/* Botão de Confirmação */}
        {!hasAnswered && (
          <div className="pt-3">
            <TerminalButton
              type="button"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selectedOption || isSubmitting}
              onClick={handleConfirmAnswer}
            >
              <span>{isSubmitting ? 'REGISTRANDO...' : 'CONFIRMAR RESPOSTA'}</span>
              <Award className="w-4 h-4" />
            </TerminalButton>
          </div>
        )}
      </ClassifiedCard>

      {/* Explicação Pedagógica Pós-Resposta */}
      {hasAnswered && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <ClassifiedCard
            title="INSIGHT INVESTIGATIVO // ANÁLISE"
            badge={`+${station.xp} XP`}
            badgeVariant="complete"
            className="space-y-3 bg-archive-850/90 border-turing-green/40"
          >
            <div className="flex items-center gap-2 text-turing-green font-mono text-xs font-bold uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resposta Registrada com Sucesso</span>
            </div>

            <h3 className="text-base font-mono font-bold text-archive-paper">
              {station.explanation.title}
            </h3>

            <p className="text-xs sm:text-sm text-archive-paper/90 leading-relaxed font-sans">
              {station.explanation.description}
            </p>

            <div className="p-3 bg-archive-950 border border-archive-800 rounded-sm">
              <div className="text-[10px] font-mono text-turing-amber uppercase tracking-wider font-bold">
                REFLEXÃO CENTRAL
              </div>
              <p className="text-xs font-mono text-archive-paper mt-1 italic">
                "{station.explanation.insight}"
              </p>
            </div>
          </ClassifiedCard>

          {/* Navegação Entre Estações */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link href="/passaporte" className="w-full sm:w-1/2">
              <TerminalButton variant="secondary" size="md" fullWidth>
                <ArrowLeft className="w-4 h-4" />
                <span>VER PASSAPORTE</span>
              </TerminalButton>
            </Link>

            {nextStation ? (
              <Link href={`/estacao/${nextStation.slug}`} className="w-full sm:w-1/2">
                <TerminalButton variant="primary" size="md" fullWidth>
                  <span>PRÓXIMA ESTAÇÃO</span>
                  <ArrowRight className="w-4 h-4" />
                </TerminalButton>
              </Link>
            ) : (
              <Link href="/conclusao" className="w-full sm:w-1/2">
                <TerminalButton variant="primary" size="md" fullWidth>
                  <span>IR PARA A CONCLUSÃO</span>
                  <Sparkles className="w-4 h-4" />
                </TerminalButton>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
