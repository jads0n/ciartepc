# 🏛️ TURING LAB — Passaporte de Investigação Digital

> Aplicação web progressiva para a Feira Escolar de Ciências e Tecnologia sobre **Alan Turing, Inteligência Artificial, Ética e Futuro**.  
> **Hospedagem:** Vercel  
> **Banco de Dados & Realtime:** Supabase  
> **Pergunta Central:** *"Máquinas podem pensar?"* ➔ *"O que devemos deixar as máquinas decidirem?"*

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Pré-requisitos
* Node.js v18+ ou superior
* Gerenciador de pacotes `npm`

### 2. Instalação e Execução
```bash
# Instalar dependências (caso ainda não tenha instalado)
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver a aplicação.

---

## 📱 Ambientes e Rotas da Aplicação

| Rota | Destino | Descrição |
|---|---|---|
| `/` | **Entrada / Boas-vindas** | Atribui a credencial anônima (`AGENTE #XXXX`), codinome opcional e pergunta preliminar. |
| `/passaporte` | **Passaporte Turing** | Hub central com o status e progresso das 9 estações da feira. |
| `/estacao/[slug]` | **Estação Interativa** | Rotas acessadas pelos QR Codes das bancadas físicas (ex: `/estacao/turing`, `/estacao/carrinhos`). |
| `/quiosque/[slug]` | **Totem / Tablet Fixo** | Modo quiosque autônomo para terminais abertos nas bancadas, com voto rápido, auto-reset de 6s e botão de pular. |
| `/projetos` | **Projetos do 9º Ano** | Mural de projetos dos alunos com votação (*Mais Inovador*, *Maior Impacto*, *Eu Usaria*). |
| `/arquivo-secreto` | **Bletchley Park** | Terminal para digitar códigos físicos da sala e puzzle da Cifra de César (+XP). |
| `/conclusao` | **Relatório Final** | Revelação do Teste de Turing, Pergunta Posterior e a Pergunta Ética Final. |
| `/live` | **Telão em Tempo Real** | Dashboard para TV/projetor com rotação contínua de 6 telas e conexão Supabase Realtime. |
| `/admin` | **Painel dos Professores** | Central de controle protegida por PIN Mestre para controle da feira, moderação e exportação CSV. |

---

## 🔑 Acesso Administrativo (Professores)

* **URL:** `/admin`
* **PIN Mestre Padrão:** `195026` (Ano de Turing na revista Mind + 2026)

---

## 🗄️ Configuração do Banco de Dados (Supabase)

1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. No painel do Supabase, acesse **SQL Editor**.
3. Copie e cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e clique em **Run**.
4. Acesse **Project Settings ➔ API** e copie a `URL` e a `anon key`.
5. No arquivo `.env.local` (ou nas variáveis de ambiente da Vercel), preencha:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
   ADMIN_MASTER_PIN=195026
   ```

---

## 🌐 Deploy na Vercel

```bash
# Deploy direto via Vercel CLI
npx vercel

# Ou conecte o repositório GitHub diretamente no painel da Vercel
```
Configure as variáveis de ambiente no dashboard da Vercel:
* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `ADMIN_MASTER_PIN` (opcional, padrão `195026`)
