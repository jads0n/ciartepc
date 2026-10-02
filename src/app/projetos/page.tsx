'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAgent } from '@/hooks/useAgent';
import { ClassifiedCard } from '@/components/ui/ClassifiedCard';
import { ArrowLeft, Rocket, Heart, Lightbulb, Globe, Check } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  authors: string;
  problem: string;
  solution: string;
  aiRole: string;
  humanDecision: string;
}

const PROJECTS_9ANO: ProjectItem[] = [
  {
    id: 'p1',
    title: 'EcoVision: Coleta Inteligente',
    subtitle: 'Sustentabilidade & Meio Ambiente',
    authors: 'Turma 9º A — Clara, Pedro e Lucas',
    problem: 'Grande quantidade de resíduos recicláveis é descartada incorretamente nas lixeiras comuns da escola.',
    solution: 'Câmera com modelo de visão computacional acoplada à lixeira que identifica o material (plástico, metal, papel ou orgânico) e abre o compartimento correto.',
    aiRole: 'Classifica os objetos em milissegundos usando visão computacional treinada com mais de 2.000 fotos de embalagens.',
    humanDecision: 'A triagem final e a manutenção das lixeiras continuam dependendo da conscientização e do trabalho dos alunos e equipe de limpeza.',
  },
  {
    id: 'p2',
    title: 'LibrasIA: Ponte de Comunicação',
    subtitle: 'Acessibilidade & Inclusão',
    authors: 'Turma 9º B — Beatriz, Gabriel e Mariana',
    problem: 'Dificuldade de comunicação entre alunos surdos e ouvintes em momentos cotidianos da escola e do recreio.',
    solution: 'Aplicação web que captura os sinais de Libras pela câmera do celular e converte em legendas e áudio falado instantaneamente.',
    aiRole: 'Reconhece os pontos nodais das mãos e do rosto (MediaPipe) e prevê a palavra ou expressão correspondente.',
    humanDecision: 'A máquina não substitui o aprendizado e a valorização cultural da Língua Brasileira de Sinais entre os colegas.',
  },
  {
    id: 'p3',
    title: 'AgroSense: Horta Escolar Sustentável',
    subtitle: 'Alimentação & Tecnologia',
    authors: 'Turma 9º C — Rafael, Sofia e Enzo',
    problem: 'Perda frequente de mudas na horta comunitária por variações bruscas de umidade do solo e surgimento de pragas.',
    solution: 'Sensores de umidade do solo acoplados a um modelo de previsão que antecipa o momento ideal de irrigação e analisa fotos de folhas com pragas.',
    aiRole: 'Cruza temperatura, umidade e previsão do tempo para prever a saúde das hortaliças.',
    humanDecision: 'Os alunos decidem quais espécies plantar e cuidam fisicamente da terra.',
  },
  {
    id: 'p4',
    title: 'TutorVox: Leitura Acessível',
    subtitle: 'Educação & Inclusão',
    authors: 'Turma 9º D — Thiago, Alice e Mateus',
    problem: 'Estudantes com baixa visão ou dislexia encontram dificuldades para acompanhar livros didáticos sem versão em áudio.',
    solution: 'Dispositivo portátil que fotografa páginas de livros físicos, resume os tópicos principais e lê em voz alta sintetizada com entonação amigável.',
    aiRole: 'OCR (reconhecimento de caracteres) e modelo de linguagem para transformar texto estático em áudio fluido.',
    humanDecision: 'A interpretação crítica do conteúdo continua sendo responsabilidade do leitor.',
  },
];

export default function ProjectsPage() {
  const { agent, addScore } = useAgent();
  const [reactedProjects, setReactedProjects] = useState<Record<string, string>>({});

  const handleReact = async (projectId: string, reactionType: string) => {
    if (reactedProjects[projectId] || !agent) return;

    setReactedProjects((prev) => ({ ...prev, [projectId]: reactionType }));
    addScore(25); // +25 XP por votar/apoiar um projeto

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('project_reactions').insert([
          {
            project_id: projectId,
            visitor_id: agent.id,
            reaction_type: reactionType,
          },
        ]);
      } catch (err) {
        console.warn('Erro ao salvar voto no projeto:', err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between pb-3 border-b border-archive-700">
        <Link
          href="/passaporte"
          className="text-xs font-mono text-archive-muted hover:text-archive-paper flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ PASSAPORTE ]</span>
        </Link>
        <span className="text-xs font-mono text-turing-amber font-semibold uppercase">
          PROJETOS DO 9º ANO
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-mono font-bold text-archive-paper">
          IA PARA QUÊ? — PROJETOS REAIS
        </h1>
        <p className="text-xs text-archive-muted mt-1">
          Veja como os alunos do 9º ano aplicaram IA para tentar resolver desafios concretos e reaja aos projetos que mais gostou:
        </p>
      </div>

      {/* Lista de Projetos */}
      <div className="space-y-5">
        {PROJECTS_9ANO.map((project) => {
          const userReaction = reactedProjects[project.id];

          return (
            <ClassifiedCard
              key={project.id}
              title={project.subtitle}
              badge={userReaction ? 'VOTADO' : 'AVALIE'}
              badgeVariant={userReaction ? 'complete' : 'amber'}
              className="space-y-3"
            >
              <div>
                <h2 className="text-base sm:text-lg font-mono font-bold text-archive-paper">
                  {project.title}
                </h2>
                <div className="text-xs font-mono text-turing-amber">{project.authors}</div>
              </div>

              {/* Informações Estruturadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1 font-sans">
                <div className="p-2.5 bg-archive-950 border border-archive-800 rounded-sm">
                  <div className="font-mono text-[10px] text-archive-muted uppercase font-bold">
                    O Problema
                  </div>
                  <p className="text-archive-paper/90 mt-0.5">{project.problem}</p>
                </div>

                <div className="p-2.5 bg-archive-950 border border-archive-800 rounded-sm">
                  <div className="font-mono text-[10px] text-archive-muted uppercase font-bold">
                    A Solução Criada
                  </div>
                  <p className="text-archive-paper/90 mt-0.5">{project.solution}</p>
                </div>

                <div className="p-2.5 bg-archive-950 border border-archive-800 rounded-sm">
                  <div className="font-mono text-[10px] text-turing-amber uppercase font-bold">
                    Onde entra a IA?
                  </div>
                  <p className="text-archive-paper/90 mt-0.5">{project.aiRole}</p>
                </div>

                <div className="p-2.5 bg-archive-950 border border-archive-800 rounded-sm">
                  <div className="font-mono text-[10px] text-turing-green uppercase font-bold">
                    Decisão Humana Inegociável
                  </div>
                  <p className="text-archive-paper/90 mt-0.5">{project.humanDecision}</p>
                </div>
              </div>

              {/* Reações / Votação */}
              <div className="pt-3 border-t border-archive-800">
                <div className="text-[11px] font-mono text-archive-muted mb-2">
                  Qual foi o destaque deste projeto para você?
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <button
                    type="button"
                    disabled={!!userReaction}
                    onClick={() => handleReact(project.id, 'inovador')}
                    className={`px-3 py-1.5 rounded-sm border flex items-center gap-1.5 transition-colors ${
                      userReaction === 'inovador'
                        ? 'bg-turing-amber text-archive-950 border-turing-amber font-bold'
                        : 'bg-archive-900 border-archive-700 text-archive-paper hover:border-archive-500'
                    }`}
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Mais Inovador</span>
                    {userReaction === 'inovador' && <Check className="w-3.5 h-3.5 ml-1" />}
                  </button>

                  <button
                    type="button"
                    disabled={!!userReaction}
                    onClick={() => handleReact(project.id, 'impacto')}
                    className={`px-3 py-1.5 rounded-sm border flex items-center gap-1.5 transition-colors ${
                      userReaction === 'impacto'
                        ? 'bg-turing-green text-archive-950 border-turing-green font-bold'
                        : 'bg-archive-900 border-archive-700 text-archive-paper hover:border-archive-500'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Maior Impacto</span>
                    {userReaction === 'impacto' && <Check className="w-3.5 h-3.5 ml-1" />}
                  </button>

                  <button
                    type="button"
                    disabled={!!userReaction}
                    onClick={() => handleReact(project.id, 'usaria')}
                    className={`px-3 py-1.5 rounded-sm border flex items-center gap-1.5 transition-colors ${
                      userReaction === 'usaria'
                        ? 'bg-turing-cyan text-archive-950 border-turing-cyan font-bold'
                        : 'bg-archive-900 border-archive-700 text-archive-paper hover:border-archive-500'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Eu Usaria</span>
                    {userReaction === 'usaria' && <Check className="w-3.5 h-3.5 ml-1" />}
                  </button>
                </div>
              </div>
            </ClassifiedCard>
          );
        })}
      </div>
    </div>
  );
}
