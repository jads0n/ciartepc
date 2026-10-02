'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { STATIONS_DATA, findStationByCode } from '@/lib/constants/stations';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import {
  MessageSquare,
  Car,
  Brain,
  ShieldAlert,
  Search,
  Scale,
  FileCheck,
  Rocket,
  HelpCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Award,
  KeyRound,
  Zap,
  QrCode,
  ExternalLink,
  Edit3,
  Check,
  User,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  ShieldAlert: <ShieldAlert className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Scale: <Scale className="w-5 h-5" />,
  FileCheck: <FileCheck className="w-5 h-5" />,
  Rocket: <Rocket className="w-5 h-5" />,
  HelpCircle: <HelpCircle className="w-5 h-5" />,
};

export default function PassportPage() {
  const router = useRouter();
  const { agent, completedStations, unlockedStations, unlockStation, updateNickname } = useAgent();
  const completedCount = completedStations.length;
  const progressPercent = Math.min(100, Math.round((completedCount / 8) * 100));

  const [inputCode, setInputCode] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados para alteração de nome pelo usuário
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState('');
  const [nickToast, setNickToast] = useState<string | null>(null);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickDraft.trim()) {
      setIsEditingNick(false);
      return;
    }

    const clean = nickDraft.trim();
    updateNickname(clean);
    setIsEditingNick(false);
    setNickToast(`✓ Nome atualizado para "${clean}"!`);
    setTimeout(() => setNickToast(null), 3500);
  };

  const handleCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) return;

    const matched = findStationByCode(inputCode);
    if (matched) {
      unlockStation(matched.slug);
      setFeedbackMsg({
        type: 'success',
        text: `✓ Código reconhecido! Bancada ${String(matched.order).padStart(2, '0')}: ${matched.title} liberada...`,
      });
      setTimeout(() => {
        router.push(`/estacao/${matched.slug}`);
      }, 350);
    } else {
      setFeedbackMsg({
        type: 'error',
        text: `✕ Código "${inputCode.toUpperCase()}" não encontrado. Verifique a placa física na mesa (ex: 4 caracteres).`,
      });
    }
  };

  const handleInputChange = (val: string) => {
    const formatted = val.toUpperCase().trim();
    setInputCode(formatted);
    setFeedbackMsg(null);

    // Se digitou código completo (4 caracteres), valida automaticamente
    if (formatted.length === 4) {
      const matched = findStationByCode(formatted);
      if (matched) {
        unlockStation(matched.slug);
        setFeedbackMsg({
          type: 'success',
          text: `✓ Código válido! Abrindo Estação ${String(matched.order).padStart(2, '0')}...`,
        });
        setTimeout(() => {
          router.push(`/estacao/${matched.slug}`);
        }, 300);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho do Passaporte */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-archive-700">
        <div>
          <div className="text-xs font-mono text-turing-amber uppercase tracking-wider">
            PASSAPORTE DE INVESTIGAÇÃO DIGITAL
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-archive-paper">
            ESTAÇÕES DO LABORATÓRIO
          </h1>
          <p className="text-xs text-archive-muted mt-1">
            Escaneie o QR Code da bancada, digite o código de 4 dígitos ou selecione abaixo:
          </p>
        </div>

        {/* Card de Progresso */}
        <div className="bg-archive-850 border border-archive-700 p-3 rounded-sm flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-mono text-archive-muted uppercase">Progresso Geral</div>
            <div className="text-lg font-mono font-bold text-turing-green">
              {completedCount} <span className="text-xs text-archive-muted">/ 8 Concluídas</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-archive-700 flex items-center justify-center font-mono text-xs font-bold text-turing-amber bg-archive-950">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Barra de Progresso Visual */}
      <div className="w-full bg-archive-950 h-2 rounded-full overflow-hidden border border-archive-800">
        <div
          className="bg-gradient-to-r from-turing-amber to-turing-green h-full transition-all duration-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* IDENTIFICAÇÃO DO AGENTE & ALTERAÇÃO DE NOME */}
      <div className="bg-archive-900 border border-archive-700 p-3.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-sm bg-turing-amber/15 border border-turing-amber/40 flex items-center justify-center font-mono text-sm font-black text-turing-amber shrink-0">
            #{agent?.agent_number || 100}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono text-archive-muted uppercase tracking-wider">
              NOME DO AGENTE / INVESTIGADOR
            </div>
            {isEditingNick ? (
              <form onSubmit={handleSaveNickname} className="flex flex-wrap items-center gap-2 mt-1">
                <input
                  type="text"
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  maxLength={24}
                  placeholder="Seu nome ou apelido..."
                  className="bg-archive-950 border border-turing-amber text-xs font-mono text-archive-paper px-2.5 py-1 rounded-xs outline-none w-48 sm:w-60 focus:ring-1 focus:ring-turing-amber"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-turing-green text-archive-950 font-mono text-xs font-bold rounded-xs hover:bg-emerald-400 cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingNick(false)}
                  className="px-2.5 py-1 bg-archive-800 text-archive-muted font-mono text-xs rounded-xs hover:bg-archive-700 cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 mt-0.5">
                <span className="font-mono text-base font-bold text-turing-amber truncate">
                  {agent?.nickname || 'AGENTE #0101'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNickDraft(agent?.nickname || '');
                    setIsEditingNick(true);
                  }}
                  className="px-2 py-0.5 bg-archive-800 hover:bg-archive-750 text-archive-muted hover:text-turing-amber text-[11px] font-mono rounded-xs border border-archive-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Alterar seu nome"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Alterar Nome</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0 border-t sm:border-t-0 border-archive-800 pt-2 sm:pt-0">
          <div>
            <span className="text-archive-muted text-[10px] uppercase block">Pontuação</span>
            <span className="text-turing-amber font-bold text-sm">+{agent?.total_score || 0} XP</span>
          </div>
          <div className="border-l border-archive-800 pl-4">
            <span className="text-archive-muted text-[10px] uppercase block">Estações</span>
            <span className="text-turing-green font-bold text-sm">{completedCount} / 8</span>
          </div>
        </div>
      </div>

      {nickToast && (
        <div className="p-2.5 bg-turing-green/15 border border-turing-green/40 text-turing-green text-xs font-mono rounded-xs animate-in fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{nickToast}</span>
        </div>
      )}

      {/* Caixa Interativa de Desbloqueio: Botão Direto de Escanear QR Code + Digitar Código */}
      <div className="bg-archive-900 border-2 border-turing-amber/50 p-4 rounded-sm space-y-4 shadow-lg">
        {/* BOTÃO PRINCIPAL DIRETO: ESCANEAR QR CODE */}
        <Link
          href="/escanear"
          className="w-full py-3.5 px-4 bg-gradient-to-r from-turing-amber via-amber-400 to-turing-amber text-archive-950 font-mono text-sm sm:text-base font-black rounded-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-98 cursor-pointer"
        >
          <QrCode className="w-5 h-5 shrink-0" />
          <span>📷 ESCANEAR QR CODE DA BANCADA</span>
        </Link>

        {/* Divisor "OU DIGITE O CÓDIGO" */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-archive-800 w-full" />
          <span className="bg-archive-900 px-3 text-[10px] font-mono text-archive-muted uppercase tracking-wider absolute">
            OU DIGITE OS 4 DÍGITOS DA PLACA
          </span>
        </div>

        <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={6}
              value={inputCode}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Digite o código da mesa: ex: 12AB, 23BC..."
              className="w-full bg-archive-950 border border-archive-700 focus:border-turing-amber text-archive-paper font-mono text-base tracking-widest uppercase px-3 py-2.5 rounded-xs outline-none transition-colors"
            />
            {inputCode && (
              <button
                type="button"
                onClick={() => {
                  setInputCode('');
                  setFeedbackMsg(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-archive-500 hover:text-archive-paper"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-archive-800 hover:bg-archive-750 text-turing-amber font-mono text-xs font-bold rounded-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer border border-archive-700 hover:border-turing-amber"
          >
            <Zap className="w-4 h-4" />
            <span>ABRIR ESTAÇÃO</span>
          </button>
        </form>

        {feedbackMsg && (
          <div
            className={`text-xs font-mono p-2.5 rounded-xs flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-turing-green/15 text-turing-green border border-turing-green/40'
                : 'bg-turing-red/15 text-turing-red border border-turing-red/40'
            }`}
          >
            <span>{feedbackMsg.text}</span>
          </div>
        )}
      </div>

      {/* Grade das 8 Estações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STATIONS_DATA.map((station) => {
          const isCompleted = completedStations.includes(station.slug);
          const isUnlocked = isCompleted || unlockedStations.includes(station.slug);
          // A estação 8 (pergunta final) desbloqueia após pelo menos 3 estações
          const isPrerequisiteLocked = station.slug === 'pergunta-final' && completedCount < 3;

          return (
            <Link
              key={station.slug}
              href={isPrerequisiteLocked ? '#' : `/estacao/${station.slug}`}
              className={`block transition-all duration-200 ${
                isPrerequisiteLocked ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5'
              }`}
            >
              <ClassifiedCard
                title={`ESTAÇÃO ${String(station.order).padStart(2, '0')}`}
                badge={
                  isCompleted
                    ? 'CONCLUÍDA'
                    : isPrerequisiteLocked
                    ? 'BLOQUEADA'
                    : isUnlocked
                    ? 'DESBLOQUEADA'
                    : 'REQUER CÓDIGO'
                }
                badgeVariant={
                  isCompleted
                    ? 'complete'
                    : isPrerequisiteLocked
                    ? 'neutral'
                    : isUnlocked
                    ? 'amber'
                    : 'neutral'
                }
                className={`h-full flex flex-col justify-between transition-colors ${
                  isCompleted
                    ? 'border-turing-green/40 bg-archive-850/80'
                    : isUnlocked
                    ? 'border-turing-amber/50 bg-archive-850/90 hover:border-turing-amber hover:bg-archive-800'
                    : 'border-archive-800 bg-archive-900/90 hover:border-archive-600'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-sm border shrink-0 ${
                        isCompleted
                          ? 'bg-turing-green/15 text-turing-green border-turing-green/40'
                          : isPrerequisiteLocked
                          ? 'bg-archive-900 text-archive-500 border-archive-800'
                          : isUnlocked
                          ? 'bg-archive-800 text-turing-amber border-archive-700'
                          : 'bg-archive-950 text-archive-500 border-archive-800'
                      }`}
                    >
                      {ICON_MAP[station.icon] || <MessageSquare className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="font-mono text-sm sm:text-base font-bold text-archive-paper leading-snug">
                          {station.title}
                        </h2>
                      </div>
                      <div className="text-xs font-mono text-turing-amber/90 font-medium">
                        {station.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Status da Bancada Física (Sem expor o código) */}
                  <div className="pt-1">
                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-turing-green">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Investigação concluída (+{station.xp} XP)</span>
                      </div>
                    ) : isUnlocked ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-turing-amber">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span>Bancada liberada // Pronta para responder</span>
                      </div>
                    ) : isPrerequisiteLocked ? (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-archive-500">
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>Requer {3 - completedCount} estações concluídas antes</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-archive-400">
                        <Lock className="w-3.5 h-3.5 text-turing-amber/70 shrink-0" />
                        <span>Vá até a bancada para ler o QR Code ou digitar código</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-archive-muted line-clamp-2 pt-0.5">
                    {station.context}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-archive-800 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-archive-400">
                    <Award className="w-3.5 h-3.5 text-turing-amber" />
                    <span>+{station.xp} XP</span>
                  </div>

                  <div className="flex items-center gap-1 font-semibold">
                    {isCompleted ? (
                      <span className="text-turing-green flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Revisar
                      </span>
                    ) : isPrerequisiteLocked ? (
                      <span className="text-archive-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        Complete +{3 - completedCount}
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-turing-amber flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        Investigar
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-turing-amber flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" />
                        Desbloquear
                      </span>
                    )}
                  </div>
                </div>
              </ClassifiedCard>
            </Link>
          );
        })}
      </div>

      {/* Caixa de Desbloqueio do Arquivo Secreto & Desafio Criptográfico */}
      <div className="mt-8 p-4 bg-gradient-to-r from-turing-amber/15 via-archive-900 to-turing-green/15 border-2 border-turing-amber/60 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-black text-turing-amber">
              DESAFIO CRIPTOGRÁFICO ROTATIVO (A CADA 30 MIN)
            </span>
            <span className="px-2 py-0.5 bg-turing-green text-archive-950 font-mono text-[10px] font-black rounded-xs uppercase">
              +250 XP
            </span>
          </div>
          <p className="text-xs text-archive-muted">
            Uma palavra codificada com a Cifra de César (+1 letra) está no ar agora. Decifre a palavra para conquistar um super boost de pontos e subir no ranking do telão!
          </p>
        </div>

        <Link
          href="/arquivo-secreto"
          className="px-5 py-2.5 bg-turing-amber text-archive-950 font-mono text-xs font-black rounded-xs hover:bg-amber-400 shrink-0 uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <span>QUEBRAR CIFRA (+250 XP) →</span>
        </Link>
      </div>
    </div>
  );
}
