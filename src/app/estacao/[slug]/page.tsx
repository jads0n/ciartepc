'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { STATIONS_DATA, findStationByCode, getStationUuid } from '@/lib/constants/stations';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import { enqueueOfflineResponse, isStationUnlocked } from '@/lib/storage/offline-sync';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Award,
  Sparkles,
  Lock,
  Zap,
  QrCode,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';

function StationContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const codeParam = searchParams.get('code');

  const station = STATIONS_DATA.find((s) => s.slug === slug);
  const { agent, completedStations, unlockedStations, unlockStation, completeStation } = useAgent();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [influenceFactor, setInfluenceFactor] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(() => completedStations.includes(slug));

  // Estados de Desbloqueio da Bancada
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [unlockedJustNow, setUnlockedJustNow] = useState(false);

  // Se veio por QR Code com ?code=XXXX, desbloqueia automaticamente
  useEffect(() => {
    if (codeParam && station && codeParam.toUpperCase() === station.code.toUpperCase()) {
      unlockStation(station.slug);
      setUnlockedJustNow(true);
    }
  }, [codeParam, station, unlockStation]);

  useEffect(() => {
    if (completedStations.includes(slug)) {
      setHasAnswered(true);
    }
  }, [completedStations, slug]);

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

  // A estação 8 (pergunta final) desbloqueia após pelo menos 3 estações concluídas
  const isPrerequisiteLocked = slug === 'pergunta-final' && completedStations.length < 3;
  if (isPrerequisiteLocked) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6">
        <div className="flex items-center justify-between text-xs font-mono">
          <Link
            href="/passaporte"
            className="text-archive-muted hover:text-archive-paper flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ VOLTAR AO PASSAPORTE ]</span>
          </Link>
        </div>
        <ClassifiedCard
          title="ACESSO BLOQUEADO // PRÉ-REQUISITO"
          badge="BLOQUEADA"
          badgeVariant="neutral"
          className="text-center space-y-4 py-6"
        >
          <div className="w-14 h-14 rounded-full bg-archive-800 border border-archive-700 mx-auto flex items-center justify-center text-archive-500">
            <Lock className="w-7 h-7 text-turing-amber" />
          </div>
          <h1 className="text-xl font-mono font-bold text-archive-paper">
            ESTAÇÃO 08: {station.title}
          </h1>
          <p className="text-xs sm:text-sm text-archive-muted max-w-md mx-auto">
            A Pergunta Final consolida toda a sua experiência no laboratório. Conclua pelo menos 3 outras estações para desbloquear esta bancada.
          </p>
          <div className="py-2 px-4 bg-archive-950 border border-archive-800 rounded-sm inline-block font-mono text-xs text-turing-amber">
            Progresso Atual: {completedStations.length} / 3 concluídas
          </div>
          <div className="pt-2">
            <Link href="/passaporte">
              <TerminalButton variant="primary" size="md">
                <span>VER ESTAÇÕES NO PASSAPORTE</span>
                <ArrowRight className="w-4 h-4" />
              </TerminalButton>
            </Link>
          </div>
        </ClassifiedCard>
      </div>
    );
  }

  // Verifica se a estação está desbloqueada
  const isUnlocked =
    hasAnswered ||
    completedStations.includes(slug) ||
    unlockedStations.includes(slug) ||
    unlockedJustNow ||
    (typeof window !== 'undefined' && isStationUnlocked(slug)) ||
    (codeParam && codeParam.toUpperCase() === station.code.toUpperCase());

  const handleGateUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = gateInput.trim().toUpperCase();
    if (!clean) return;

    if (clean === station.code.toUpperCase()) {
      unlockStation(station.slug);
      setUnlockedJustNow(true);
      setGateError(null);
    } else {
      const otherStation = findStationByCode(clean);
      if (otherStation) {
        setGateError(`Este código pertence à Estação ${otherStation.order} (${otherStation.title}). Procure a placa na mesa da Estação ${station.order}!`);
      } else {
        setGateError(`Código "${clean}" incorreto. Verifique a placa de 4 dígitos na mesa desta estação.`);
      }
    }
  };

  const handleGateInputChange = (val: string) => {
    const formatted = val.toUpperCase().trim();
    setGateInput(formatted);
    setGateError(null);

    // Validação automática ao digitar 4 dígitos
    if (formatted.length === 4) {
      if (formatted === station.code.toUpperCase()) {
        unlockStation(station.slug);
        setUnlockedJustNow(true);
      } else {
        const otherStation = findStationByCode(formatted);
        if (otherStation) {
          setGateError(`Este código é da Estação ${otherStation.order} (${otherStation.title}). Procure a placa da Estação ${station.order}!`);
        } else {
          setGateError(`Código incorreto. Olhe a placa na mesa da Estação ${station.order}.`);
        }
      }
    }
  };

  // TELA DE BLOQUEIO DE BANCADA (Requer QR Code ou Código de 4 dígitos)
  if (!isUnlocked) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between text-xs font-mono">
          <Link
            href="/passaporte"
            className="text-archive-muted hover:text-archive-paper flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ VOLTAR AO PASSAPORTE ]</span>
          </Link>
          <span className="text-turing-amber font-mono text-xs">
            ESTAÇÃO {String(station.order).padStart(2, '0')} DE 08
          </span>
        </div>

        <ClassifiedCard
          title="ACESSO RESTRITO // BANCADA BLOQUEADA"
          badge="REQUER BANCADA"
          badgeVariant="amber"
          className="space-y-5 text-center py-4"
        >
          <div className="w-16 h-16 rounded-full bg-archive-950 border-2 border-turing-amber/60 mx-auto flex items-center justify-center text-turing-amber shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-mono font-black text-archive-paper">
              {station.title}
            </h1>
            <p className="text-xs font-mono text-turing-amber">
              {station.subtitle}
            </p>
          </div>

          <div className="p-3 bg-archive-950/80 border-l-2 border-turing-amber rounded-r-sm text-xs text-archive-paper/90 leading-relaxed font-sans text-left">
            Esta estação requer que você esteja presencialmente na bancada de experimentos.
            Para liberar os desafios e responder, escaneie a placa QR Code na mesa ou digite abaixo o código de 4 dígitos:
          </div>

          <form onSubmit={handleGateUnlock} className="space-y-4 max-w-sm mx-auto pt-2">
            <div className="space-y-1 text-left">
              <label className="text-[11px] font-mono text-archive-muted block">
                CÓDIGO DE 4 DÍGITOS DA BANCADA:
              </label>
              <input
                type="text"
                maxLength={4}
                value={gateInput}
                onChange={(e) => handleGateInputChange(e.target.value)}
                placeholder="____"
                autoFocus
                className="w-full text-center tracking-[0.35em] text-2xl font-mono font-bold bg-archive-950 border-2 border-turing-amber/70 focus:border-turing-amber text-turing-amber rounded-sm py-3 px-4 uppercase outline-none shadow-inner transition-colors"
              />
            </div>

            {gateError && (
              <div className="p-2.5 bg-turing-red/15 border border-turing-red/40 text-turing-red font-mono text-xs rounded-xs flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gateError}</span>
              </div>
            )}

            <TerminalButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={gateInput.trim().length === 0}
            >
              <Zap className="w-4 h-4" />
              <span>DESBLOQUEAR BANCADA</span>
            </TerminalButton>

            <div className="pt-2 border-t border-archive-800 space-y-2">
              <Link
                href="/escanear"
                className="w-full py-2.5 px-4 bg-archive-850 hover:bg-archive-800 border border-turing-amber/40 text-turing-amber hover:text-amber-300 font-mono text-xs font-bold rounded-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-turing-amber" />
                <span>📷 ABRIR CÂMERA PARA ESCANEAR QR CODE</span>
              </Link>
              <p className="text-[10px] font-mono text-archive-muted">
                Aponte a câmera para a placa da bancada para liberar na hora.
              </p>
            </div>
          </form>
        </ClassifiedCard>
      </div>
    );
  }

  // TELA PRINCIPAL DA ESTAÇÃO DESBLOQUEADA
  const handleConfirmAnswer = async () => {
    if (!selectedOption || !agent) return;

    setIsSubmitting(true);
    const chosenOptionObj = station.options.find((o) => o.value === selectedOption);
    const isCorrect = chosenOptionObj?.isCorrect ?? true;

    // Enviar ou enfileirar resposta com UUID válido da estação
    const responsePayload = {
      visitor_id: agent.id,
      station_id: getStationUuid(station.slug),
      question_id: null,
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
          <span className="px-2 py-0.5 bg-turing-green/15 border border-turing-green/40 text-turing-green text-[10px] font-mono font-bold rounded-xs tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            BANCADA LIBERADA
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

export default function StationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-16 text-center font-mono text-xs text-archive-muted">
          Carregando dados da estação...
        </div>
      }
    >
      <StationContent />
    </Suspense>
  );
}
