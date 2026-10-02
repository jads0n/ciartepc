'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { TerminalButton } from '@/components/ui/TerminalButton';
import { DecryptionText } from '@/components/ui/DecryptionText';
import { OpinionOption } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Send,
  ArrowRight,
  Shield,
  MessageSquare,
} from 'lucide-react';

export default function ConclusionPage() {
  const { agent, completedStations, recordPostOpinion } = useAgent();
  const [postOpinion, setPostOpinion] = useState<OpinionOption | null>(null);
  const [postTrust, setPostTrust] = useState<number>(5);
  const [reflectionText, setReflectionText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [reflectionSent, setReflectionSent] = useState(false);

  // Efeito de confete ao carregar a conclusão
  useEffect(() => {
    if (completedStations.length >= 3) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#10b981', '#06b6d4'],
        });
      } catch {
        // Fallback silencioso caso canvas-confetti não esteja disponível
      }
    }
  }, [completedStations.length]);

  const handleSavePostOpinion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postOpinion) return;

    recordPostOpinion(postOpinion, postTrust);
    setIsSaved(true);
  };

  const handleSendReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim() || !agent) return;

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('open_reflections').insert([
          {
            visitor_id: agent.id,
            nickname: agent.nickname,
            reflection_text: reflectionText.trim(),
            status: 'pending',
          },
        ]);
      } catch (err) {
        console.warn('Erro ao enviar reflexão:', err);
      }
    }

    setReflectionSent(true);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Cabeçalho */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-turing-green/20 border border-turing-green/50 rounded-sm text-xs font-mono text-turing-green uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5" />
          <span>INVESTIGAÇÃO FINALIZADA</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-mono font-black text-archive-paper">
          RELATÓRIO DE CONCLUSÃO
        </h1>
        <p className="text-xs font-mono text-archive-muted uppercase tracking-wider">
          <DecryptionText text="SÍNTESE INVESTIGATIVA // AGENTE TURING" speed={20} />
        </p>
      </div>

      {/* Cartão de Resumo do Agente */}
      <ClassifiedCard
        title="CERTIFICADO DE PARTICIPAÇÃO"
        badge="AGENTE TURING"
        badgeVariant="complete"
        className="text-center space-y-3"
      >
        <div className="py-2">
          <div className="text-xs font-mono text-archive-muted uppercase">Convocado</div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-turing-amber mt-1">
            {agent?.nickname || 'AGENTE #0101'}
          </div>

          <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-archive-800">
            <div>
              <div className="text-[10px] font-mono text-archive-muted uppercase">Estações</div>
              <div className="text-lg font-mono font-bold text-turing-green">
                {completedStations.length} / 8
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-archive-muted uppercase">Pontuação Total</div>
              <div className="text-lg font-mono font-bold text-turing-amber">
                {agent?.total_score || 0} XP
              </div>
            </div>
          </div>
        </div>
      </ClassifiedCard>

      {/* REFLEXÃO DO TESTE DE TURING (ESTAÇÃO 01) */}
      <ClassifiedCard
        title="REFLEXÃO // O TESTE DE TURING HOJE"
        badge="PERSPECTIVA CRÍTICA"
        badgeVariant="amber"
        className="space-y-3 border-turing-amber/40"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-turing-amber/20 text-turing-amber border border-turing-amber/40 rounded-sm shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono text-base font-bold text-archive-paper">
              Reconhecer uma IA Ficou Mais Difícil?
            </h3>
            <p className="text-xs text-archive-muted mt-1">
              Na Estação 01 você avaliou a facilidade de distinguir humanos e computadores nos dias de hoje:
            </p>
          </div>
        </div>

        <div className="p-3 bg-archive-900 border border-archive-800 rounded-sm text-xs text-archive-paper/90 leading-relaxed font-sans mt-2">
          💡 <strong>Lição de Alan Turing:</strong> Em 1950, Turing propôs que quando não conseguíssemos mais diferenciar o texto de um computador do de uma pessoa, deveríamos parar de dizer que as máquinas não são inteligentes. Hoje, o desafio não é apenas técnico, mas social: discernir o que é genuinamente humano do que é gerado por algoritmo.
        </div>
      </ClassifiedCard>

      {/* PERGUNTA POSTERIOR: A EXPERIÊNCIA MUDOU SUA OPINIÃO? */}
      <ClassifiedCard
        title="PERGUNTA PÓS-EXPERIÊNCIA"
        badge={isSaved ? 'REGISTRADA' : 'PENDENTE'}
        badgeVariant={isSaved ? 'complete' : 'amber'}
        className="space-y-4"
      >
        <div className="space-y-2">
          <label className="block text-xs sm:text-sm font-mono font-bold text-archive-paper">
            Depois de tudo o que você viu no Turing Lab: MÁQUINAS PODEM PENSAR?
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { label: 'SIM', value: 'SIM' },
              { label: 'NÃO', value: 'NAO' },
              { label: 'DEPENDE', value: 'DEPENDE' },
              { label: 'NÃO SEI', value: 'NAO_SEI' },
            ].map((item) => (
              <button
                type="button"
                key={item.value}
                disabled={isSaved}
                onClick={() => setPostOpinion(item.value as OpinionOption)}
                className={`py-3 px-2 rounded-sm border font-mono text-xs font-bold uppercase transition-all duration-150 ${
                  postOpinion === item.value
                    ? 'bg-turing-green text-archive-950 border-turing-green shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'bg-archive-900 text-archive-paper border-archive-700 hover:border-archive-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Nível de Confiança Atual */}
        <div className="pt-3 border-t border-archive-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-archive-muted">Qual é o seu nível de confiança em IA agora?</span>
            <span className="font-bold text-turing-green bg-archive-900 px-2 py-0.5 border border-archive-700 rounded-xs">
              {postTrust} / 10
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={10}
            value={postTrust}
            disabled={isSaved}
            onChange={(e) => setPostTrust(Number(e.target.value))}
            className="w-full accent-turing-green cursor-pointer bg-archive-950 h-2 rounded-lg"
          />
        </div>

        {!isSaved && (
          <TerminalButton
            type="button"
            variant="primary"
            size="md"
            fullWidth
            disabled={!postOpinion}
            onClick={handleSavePostOpinion}
          >
            <span>REGISTRAR OPINIÃO FINAL</span>
            <CheckCircle2 className="w-4 h-4" />
          </TerminalButton>
        )}
      </ClassifiedCard>

      {/* A GRANDE PERGUNTA FINAL: O QUE DEIXAR AS MÁQUINAS DECIDIREM? */}
      <ClassifiedCard
        title="REFLEXÃO FILOSÓFICA & ÉTICA"
        badge="TELÃO COLETIVO"
        badgeVariant="classified"
        className="space-y-3"
      >
        <div className="space-y-1">
          <div className="text-xs font-mono text-turing-amber font-semibold">Turing perguntou: "Máquinas podem pensar?"</div>
          <h2 className="text-base sm:text-lg font-mono font-bold text-archive-paper">
            O QUE DEVEMOS DEIXAR AS MÁQUINAS DECIDIREM?
          </h2>
          <p className="text-xs text-archive-muted">
            Deixe sua reflexão curta (ela poderá aparecer no telão após aprovação):
          </p>
        </div>

        {reflectionSent ? (
          <div className="p-4 bg-turing-green/15 border border-turing-green/40 rounded-sm text-center space-y-1">
            <div className="font-mono text-xs font-bold text-turing-green flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>REFLEXÃO ENVIADA PARA MODERAÇÃO</span>
            </div>
            <p className="text-xs text-archive-paper/80">
              Obrigado por contribuir com a discussão coletiva da feira!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendReflection} className="space-y-3">
            <textarea
              rows={3}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Ex: Acho que a IA pode sugerir diagnósticos médicos, mas a palavra final deve ser sempre de um ser humano..."
              maxLength={200}
              className="w-full bg-archive-950 border border-archive-700 text-xs sm:text-sm font-mono text-archive-paper p-3 rounded-xs outline-none focus:border-turing-amber resize-none"
            />

            <div className="flex justify-between items-center text-[10px] font-mono text-archive-muted">
              <span>Máximo 200 caracteres</span>
              <TerminalButton
                type="submit"
                variant="primary"
                size="sm"
                disabled={!reflectionText.trim()}
              >
                <span>ENVIAR REFLEXÃO</span>
                <Send className="w-3.5 h-3.5" />
              </TerminalButton>
            </div>
          </form>
        )}
      </ClassifiedCard>

      {/* Agradecimento Final */}
      <div className="text-center pt-4 space-y-3">
        <p className="text-xs font-mono text-archive-muted">
          OBRIGADO POR PARTICIPAR DA EXPERIÊNCIA DO TURING LAB.
        </p>

        <Link href="/passaporte" className="inline-block">
          <TerminalButton variant="secondary" size="md">
            <span>VOLTAR AO PASSAPORTE</span>
            <ArrowRight className="w-4 h-4" />
          </TerminalButton>
        </Link>
      </div>
    </div>
  );
}
