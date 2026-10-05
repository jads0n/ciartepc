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
  HelpCircle,
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
            <ArrowLeft className="w-4 h-4" />
            <span>← Voltar ao Passaporte</span>
          </Link>
          <span className="text-turing-amber font-mono text-xs font-bold">
            ESTAÇÃO {String(station.order).padStart(2, '0')} DE 08
          </span>
        </div>

        <div className="bg-archive-900 border-2 border-turing-amber/60 rounded-md p-6 sm:p-8 space-y-6 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-archive-950 border-2 border-turing-amber/60 mx-auto flex items-center justify-center text-turing-amber shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-turing-amber uppercase tracking-wider">
              Bancada {String(station.order).padStart(2, '0')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-archive-paper">
              {station.title}
            </h1>
            <p className="text-sm text-archive-muted">
              {station.subtitle}
            </p>
          </div>

          <p className="text-sm sm:text-base text-archive-paper/90 leading-relaxed font-sans bg-archive-950 p-4 rounded-sm border border-archive-800">
            📍 <strong>Como liberar esta pergunta:</strong> Você precisa estar na mesa desta bancada. Escolha uma das duas formas abaixo:
          </p>

          <form onSubmit={handleGateUnlock} className="space-y-4 max-w-sm mx-auto">
            {/* Opção 1: Código de 4 dígitos */}
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-turing-amber block">
                OPÇÃO 1: Digite o código de 4 letras/números da placa:
              </label>
              <input
                type="text"
                maxLength={4}
                value={gateInput}
                onChange={(e) => handleGateInputChange(e.target.value)}
                placeholder="Ex: 12AB"
                autoFocus
                className="w-full text-center tracking-[0.3em] text-2xl font-mono font-black bg-archive-950 border-2 border-turing-amber/70 focus:border-turing-amber text-turing-amber rounded-sm py-3 px-4 uppercase outline-none shadow-inner transition-colors"
              />
            </div>

            {gateError && (
              <div className="p-3 bg-turing-red/15 border border-turing-red/40 text-turing-red font-mono text-xs rounded-sm flex items-center gap-2 text-left">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gateError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={gateInput.trim().length === 0}
              className="w-full py-3.5 px-5 bg-turing-amber hover:bg-amber-400 disabled:opacity-50 text-archive-950 font-bold text-sm sm:text-base rounded-sm transition-all flex items-center justify-center gap-2 cursor-pointer uppercase shadow-md"
            >
              <Zap className="w-4 h-4" />
              <span>Liberar Estação Agora</span>
            </button>

            {/* Separador "OU" */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-archive-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-archive-900 px-3 text-archive-muted font-bold">OU</span>
              </div>
            </div>

            {/* Opção 2: Câmera QR Code */}
            <Link
              href="/escanear"
              className="w-full py-3.5 px-4 bg-archive-850 hover:bg-archive-800 border-2 border-turing-cyan/50 text-turing-cyan hover:text-cyan-300 font-bold text-sm sm:text-base rounded-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <QrCode className="w-5 h-5 text-turing-cyan" />
              <span>📷 Escanear QR Code com Câmera</span>
            </Link>
          </form>
        </div>
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
          <ArrowLeft className="w-4 h-4" />
          <span>← Voltar ao Passaporte</span>
        </Link>
        <span className="text-turing-amber font-mono text-xs font-bold">
          ESTAÇÃO {String(station.order).padStart(2, '0')} DE 08
        </span>
      </div>

      {/* Cartão Principal da Estação */}
      <div className="bg-archive-900 border-2 border-archive-700 rounded-md p-5 sm:p-7 space-y-5 shadow-xl">
        {/* Cabeçalho da Bancada */}
        <div className="border-b border-archive-800 pb-3">
          <span className="text-xs font-mono font-bold text-turing-amber uppercase tracking-wider block">
            Bancada {String(station.order).padStart(2, '0')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-archive-paper mt-0.5">
            {station.title}
          </h1>
          <p className="text-sm text-archive-muted mt-1 font-sans">
            {station.subtitle}
          </p>
        </div>

        {/* Pergunta da Estação em Destaque Absoluto */}
        <div className="space-y-4">
          <div className="bg-archive-950 border-2 border-turing-amber/60 rounded-md p-4 sm:p-5 space-y-2.5 shadow-md">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-turing-amber/15 border border-turing-amber/40 rounded-full text-xs font-bold text-turing-amber">
              <span>Passo 1</span>
              <span>•</span>
              <span>Leia a pergunta</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-archive-paper leading-snug">
              {station.prompt}
            </h2>

            {/* Contexto da bancada em linguagem clara */}
            {station.context && (
              <p className="text-xs sm:text-sm text-archive-muted leading-relaxed font-sans pt-2 border-t border-archive-800">
                💡 <strong>Entenda o cenário:</strong> {station.context}
              </p>
            )}
          </div>

          {/* Opções de Resposta Ampliadas */}
          <div className="space-y-3">
            <div className="text-xs sm:text-sm font-bold text-archive-paper flex items-center gap-2 px-1">
              <span className="w-5 h-5 rounded-full bg-turing-amber text-archive-950 flex items-center justify-center font-black text-xs">
                2
              </span>
              <span>Escolha sua resposta:</span>
            </div>

            <div className="space-y-2.5">
              {station.options.map((opt, idx) => {
                const letters = ['A', 'B', 'C', 'D', 'E'];
                const letterBadge = letters[idx] || String(idx + 1);
                const isSelected = selectedOption === opt.value;

                return (
                  <button
                    type="button"
                    key={opt.value}
                    disabled={hasAnswered}
                    onClick={() => setSelectedOption(opt.value)}
                    className={`w-full text-left p-4 sm:p-4.5 rounded-md border-2 font-sans text-sm sm:text-base leading-snug transition-all duration-150 flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-turing-amber/20 border-turing-amber text-archive-paper font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                        : 'bg-archive-950 border-archive-700 text-archive-paper/90 hover:border-archive-500 hover:bg-archive-800'
                    } ${hasAnswered ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'}`}
                  >
                    <span className={`w-8 h-8 rounded-sm flex items-center justify-center font-mono text-sm font-black shrink-0 ${
                      isSelected
                        ? 'bg-turing-amber text-archive-950 border border-turing-amber'
                        : 'bg-archive-900 border border-archive-600 text-turing-amber'
                    }`}>
                      {letterBadge}
                    </span>
                    <span className="flex-1 font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Pergunta extra opcional para Detetive Real x IA */}
            {slug === 'real-ou-ia' && !hasAnswered && (
              <div className="pt-2 space-y-1.5">
                <label className="text-xs font-bold text-archive-muted block">
                  O que mais chamou sua atenção para decidir? (opcional)
                </label>
                <select
                  value={influenceFactor}
                  onChange={(e) => setInfluenceFactor(e.target.value)}
                  className="w-full bg-archive-950 border-2 border-archive-700 text-xs sm:text-sm font-sans text-archive-paper p-3 rounded-md outline-none focus:border-turing-amber"
                >
                  <option value="">Selecione um fator...</option>
                  <option value="maos">Mãos ou dedos estranhos</option>
                  <option value="olhos">Olhos e reflexos</option>
                  <option value="iluminacao">Iluminação ou sombras artificiais</option>
                  <option value="pele">Textura de pele lisa demais</option>
                  <option value="intuiçao">Pura intuição</option>
                  <option value="outro">Outro detalhe</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Confirmação Grande e Visível */}
        {!hasAnswered && (
          <div className="pt-2">
            <button
              type="button"
              disabled={!selectedOption || isSubmitting}
              onClick={handleConfirmAnswer}
              className="w-full py-4 px-6 bg-turing-amber hover:bg-amber-400 disabled:opacity-40 text-archive-950 font-black text-base sm:text-lg rounded-md transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xl uppercase tracking-wider"
            >
              <span>{isSubmitting ? 'Registrando...' : 'Confirmar e Enviar Resposta'}</span>
              <Award className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Explicação Pedagógica Pós-Resposta */}
      {hasAnswered && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="bg-archive-900 border-2 border-turing-green/50 rounded-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-turing-green font-bold text-base sm:text-lg">
              <CheckCircle2 className="w-6 h-6 text-turing-green shrink-0" />
              <span>Resposta Registrada (+{station.xp} Pontos)!</span>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-bold text-archive-paper">
                {station.explanation.title}
              </h3>
              <p className="text-sm sm:text-base text-archive-paper/90 leading-relaxed font-sans">
                {station.explanation.description}
              </p>
            </div>

            {station.explanation.insight && (
              <div className="p-3.5 sm:p-4 bg-archive-950 border-l-4 border-turing-amber rounded-r-md">
                <p className="text-sm sm:text-base font-medium text-archive-paper italic">
                  "{station.explanation.insight}"
                </p>
              </div>
            )}
          </div>

          {/* Navegação Entre Estações */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link href="/passaporte" className="w-full sm:w-1/2">
              <button
                type="button"
                className="w-full py-3.5 px-4 bg-archive-800 hover:bg-archive-700 text-archive-paper font-bold text-sm rounded-md transition-colors flex items-center justify-center gap-2 border border-archive-700 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Ver Todas as Estações</span>
              </button>
            </Link>

            {nextStation ? (
              <Link href={`/estacao/${nextStation.slug}`} className="w-full sm:w-1/2">
                <button
                  type="button"
                  className="w-full py-3.5 px-4 bg-turing-amber hover:bg-amber-400 text-archive-950 font-black text-sm rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Ir para Estação {String(nextStation.order).padStart(2, '0')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            ) : (
              <Link href="/conclusao" className="w-full sm:w-1/2">
                <button
                  type="button"
                  className="w-full py-3.5 px-4 bg-turing-green hover:bg-emerald-400 text-archive-950 font-black text-sm rounded-md transition-colors flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Finalizar Participação</span>
                  <Sparkles className="w-4 h-4" />
                </button>
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
