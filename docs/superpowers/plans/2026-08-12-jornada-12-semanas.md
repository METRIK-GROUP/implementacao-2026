# Jornada de 12 Semanas — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar `vendas.html` para mostrar a jornada de 12 semanas (6 PDP + 6 IA), todos os entregáveis por semana e o processo de sprints, conforme spec aprovada.

**Architecture:** Página estática de HTML único com CSS inline no `<head>` e reveal animations via GSAP + IntersectionObserver (qualquer elemento com classe `.gs` é revelado automaticamente — não precisa registrar nada no JS). A seção `#sprints` é substituída por 2 blocos × 6 cards; a seção `#metodo-pdp` ganha um split espelhado com a stack IA; menções globais "6 semanas" viram "12 semanas".

**Tech Stack:** HTML estático, CSS inline (design tokens em `:root`), GSAP (já carregado), GitHub Pages (deploy manual, FORA deste plano).

**Spec:** `docs/superpowers/specs/2026-08-12-jornada-12-semanas-design.md`

## Global Constraints

- **NÃO fazer deploy/push.** Aprovação final do Rafael antes de publicar. Commits locais apenas.
- **PROIBIDO travessão (—) e meia-risca (–)** em qualquer texto visível da página. Usar vírgula, ponto ou dois-pontos.
- Português brasileiro com acentuação correta em todo texto.
- Promessa do hero: trocar SÓ o número ("6 semanas" → "12 semanas"), sem reescrever a frase.
- Design tokens existentes: `--black:#1E1E1E --graphite:#3D3D3A --g700:#5F5E5A --g500:#6B6864 --g300:#9F9D94 --g100:#D3D1C7 --offwhite:#F5F4F0 --dark:#1A1A1A`. Fontes: Inter (corpo), `.fm` Maven Pro (títulos), DM Serif Display itálico (números).
- Todo elemento novo animável recebe classe `gs` (o JS já pega sozinho).
- Ícone de check já existe no sprite: `<svg class="icon"><use href="#i-check"/></svg>`.
- Working dir: `implementacao-2026/` (repo git próprio).

---

### Task 1: CSS da jornada (classes `jw-*`)

**Files:**
- Modify: `vendas.html` — dentro do `<style>` no `<head>` (linha ~158), logo após as regras `.sp-*` existentes.

**Interfaces:**
- Produces: classes CSS `jw-block`, `jw-block-ia`, `jw-head`, `jw-tag`, `jw-name`, `jw-sub`, `jw-week`, `jw-get-label`, `jw-get` usadas nas Tasks 2 e 3.
- Consumes: classes `.sp-timeline .sp-line .sp-step .sp-num .sp-card .sp-title .sp-desc` já existentes (reaproveitadas dentro dos blocos).

- [ ] **Step 1: Localizar o fim das regras `.sp-*` no `<style>`**

Run: `grep -o "\.sp-desc{[^}]*}" vendas.html`
Expected: uma regra `.sp-desc{font-size:14px;...}` (a versão desktop). O CSS novo entra imediatamente depois da última regra `.sp-*` fora de media queries.

- [ ] **Step 2: Inserir o CSS novo**

Adicionar (uma linha só ou formatado, seguindo o padrão minificado do arquivo):

```css
.jw-block{margin-top:56px}
.jw-head{text-align:center;max-width:640px;margin:0 auto 40px}
.jw-tag{display:inline-block;font-family:'Maven Pro';font-weight:600;font-size:11px;letter-spacing:0.14em;color:var(--g500);border:1px solid var(--g100);border-radius:999px;padding:7px 16px}
.jw-name{font-weight:700;font-size:clamp(22px,3.4vw,30px);color:var(--black);margin-top:14px;line-height:1.15}
.jw-sub{font-size:14px;color:var(--g700);margin-top:10px;line-height:1.6}
.jw-week{font-family:'Maven Pro';font-weight:600;font-size:10px;letter-spacing:0.14em;color:var(--g500);margin-bottom:6px}
.jw-get-label{font-family:'Maven Pro';font-weight:600;font-size:10px;letter-spacing:0.14em;color:var(--g500);margin:16px 0 8px;padding-top:14px;border-top:1px solid rgba(0,0,0,0.07)}
.jw-get{list-style:none;display:grid;grid-template-columns:1fr;gap:7px}
.jw-get li{display:flex;align-items:flex-start;gap:9px;font-size:13.5px;color:var(--graphite);line-height:1.5}
.jw-get .icon{width:15px;height:15px;flex-shrink:0;margin-top:3px;color:var(--g500)}
@media(min-width:768px){.jw-get{grid-template-columns:1fr 1fr;gap:8px 20px}}
.jw-block-ia{background:var(--dark);border-radius:28px;padding:56px 20px;margin-top:72px}
.jw-block-ia .jw-tag{color:var(--g300);border-color:rgba(255,255,255,0.18)}
.jw-block-ia .jw-name{color:#fff}
.jw-block-ia .jw-sub{color:var(--g300)}
.jw-block-ia .sp-line{background:linear-gradient(to bottom,transparent 0%,rgba(255,255,255,0.22) 8%,rgba(255,255,255,0.22) 92%,transparent 100%)}
.jw-block-ia .sp-num{background:#fff;border-color:#fff}
.jw-block-ia .sp-num span{color:var(--black)}
.jw-block-ia .sp-card{background:rgba(255,255,255,0.045);border-color:rgba(255,255,255,0.09);backdrop-filter:none;-webkit-backdrop-filter:none}
.jw-block-ia .sp-title{color:#fff}
.jw-block-ia .sp-desc{color:var(--g300)}
.jw-block-ia .jw-week{color:var(--g300)}
.jw-block-ia .jw-get-label{color:var(--g300);border-top-color:rgba(255,255,255,0.1)}
.jw-block-ia .jw-get li{color:var(--g100)}
.jw-block-ia .jw-get .icon{color:var(--g300)}
@media(min-width:768px){.jw-block-ia{padding:64px 48px}}
```

- [ ] **Step 3: Validar que o HTML continua parseável**

Run: `python -c "from html.parser import HTMLParser; HTMLParser().feed(open('vendas.html',encoding='utf-8').read()); print('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add vendas.html
git commit -m "feat: CSS da jornada de 12 semanas (classes jw-*)"
```

---

### Task 2: Bloco 1 — Semanas 1 a 6 (substitui a seção #sprints)

**Files:**
- Modify: `vendas.html` — seção `<section class="sec bg-w" id="sprints">` (linha ~446 a ~478).

**Interfaces:**
- Consumes: classes CSS da Task 1 + `.sp-*` existentes + sprite `#i-check`.
- Produces: seção `#sprints` com intro + Bloco 1. A Task 3 insere o Bloco 2 dentro desta mesma seção, antes do `</div></section>` final.

- [ ] **Step 1: Substituir a seção inteira**

Trocar todo o conteúdo entre `<section class="sec bg-w" id="sprints"...>` e seu `</section>` por:

```html
<section class="sec bg-w" id="sprints" aria-label="Sua jornada em 12 semanas">
  <div class="si">
    <p class="gs label tc" style="margin-bottom:12px">SUA JORNADA EM 12 SEMANAS</p>
    <p class="gs fm tc" style="font-weight:700;font-size:clamp(24px,4vw,34px);margin-bottom:16px">Como será a sua transformação.</p>
    <p class="gs tc" style="font-size:15px;color:var(--g500);max-width:620px;margin:0 auto 8px;line-height:1.6">Dois blocos de 6 sprints semanais, com encontro ao vivo toda semana e grupo no WhatsApp. Cada semana termina com soluções prontas rodando no seu escritório, não com mais aulas para assistir.</p>

    <!-- BLOCO 1 · PDP -->
    <div class="jw-block gs">
      <div class="jw-head">
        <span class="jw-tag">BLOCO 1 · SEMANAS 1 A 6</span>
        <p class="jw-name fm">Implementação Projeto de Primeira</p>
        <p class="jw-sub">O método que coloca a casa em ordem: controle do tempo, processos e documentação profissional. Com a Certificação PDP completa, reconhecida pelo MEC.</p>
      </div>
      <div class="sp-timeline">
        <div class="sp-line"></div>

        <div class="sp-step gs">
          <div class="sp-num"><span>01</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 1</p>
            <p class="fm sp-title">Você no controle do seu tempo</p>
            <p class="sp-desc">Sair do modo apagando incêndio e assumir o controle da agenda, com prioridades claras desde o primeiro dia.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Agenda De Primeira: método e modelo</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Atividade guiada O Seu Dia Perfeito</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Faxina Operacional: o que sai do seu prato</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Playlist De Primeira: ritual de foco de 60 min</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Dupla de implementação no grupo</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>02</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 2</p>
            <p class="fm sp-title">Pré-Projeto profissional</p>
            <p class="sp-desc">Padronizar tudo que acontece antes da primeira linha do projeto: contrato, briefing e orçamento.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Modelo de contrato PDP, duplicável por serviço</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Checklist Mestre do projeto</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Questionário de briefing completo</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Planejador de Orçamento de Obras</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Pasta modelo de Processo de Projeto</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>03</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 3</p>
            <p class="fm sp-title">Seu processo em um lugar só</p>
            <p class="sp-desc">Todo o passo a passo do método PDP virando backlog no seu app de gestão: bater o olho e saber o que está acontecendo em cada projeto.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Template Notion com todas as etapas, do briefing aos executivos</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Passo a passo de implantação</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Versão em PDF para usar em qualquer app</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>04</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 4</p>
            <p class="fm sp-title">Um processo para cada serviço</p>
            <p class="sp-desc">Multiplicar o backlog para os seus tipos de serviço e migrar os projetos em andamento para o novo processo.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Variações do template: arquitetura, arquitetura + interiores, interiores e consultoria</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Projetos em andamento migrados para o novo processo</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>05</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 5</p>
            <p class="fm sp-title">Templates de projeto</p>
            <p class="sp-desc">Seu arquivo modelo adequado ao processo mapeado. Nunca mais começar do zero.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Templates de Primeira para AutoCAD, SketchUp, Revit e Archicad</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Fases, disciplinas e pranchas nomeadas no seu padrão</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>06</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 6</p>
            <p class="fm sp-title">Criação e executivos</p>
            <p class="sp-desc">Fechar o ciclo com a documentação de criação e detalhamento no seu padrão, com a sua marca.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Canvas Criativo do processo de criação</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Workbooks de Detalhamento F1 e F2, com centenas de itens de checklist</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Planilhas de detalhamento personalizadas com a sua marca</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>

  </div>
</section>
```

- [ ] **Step 2: Verificar substituição**

Run: `grep -c "VOCÊ RECEBE PRONTO" vendas.html && grep -c "sp-desc\">Você no controle" vendas.html && grep -c "Três etapas em ordem cronológica" vendas.html; true`
Expected: `6` (labels do bloco 1), depois `0` (card antigo "Sair do caos" não usa esse texto; conferir visualmente), e `0` para o texto da intro antiga.

Run: `python -c "from html.parser import HTMLParser; HTMLParser().feed(open('vendas.html',encoding='utf-8').read()); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add vendas.html
git commit -m "feat: bloco 1 da jornada, semanas 1 a 6 do PDP com entregaveis por semana"
```

---

### Task 3: Bloco 2 — Semanas 7 a 12 (IA de Primeira, dentro da mesma seção)

**Files:**
- Modify: `vendas.html` — dentro de `#sprints`, inserir após o `</div>` que fecha o Bloco 1 (`.jw-block`) e antes do `</div></section>` final.

**Interfaces:**
- Consumes: classes da Task 1 (`jw-block-ia` inverte as cores) e estrutura da Task 2.

- [ ] **Step 1: Inserir o Bloco 2**

```html
    <!-- BLOCO 2 · IA -->
    <div class="jw-block jw-block-ia gs">
      <div class="jw-head">
        <span class="jw-tag">BLOCO 2 · SEMANAS 7 A 12</span>
        <p class="jw-name fm">IA de Primeira</p>
        <p class="jw-sub">Com o processo em ordem, a IA entra para trabalhar no seu padrão: curso completo com 40 aulas em 6 módulos e 21 skills prontas para usar.</p>
      </div>
      <div class="sp-timeline">
        <div class="sp-line"></div>

        <div class="sp-step gs">
          <div class="sp-num"><span>07</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 7</p>
            <p class="fm sp-title">Stack IA instalada e Claude rodando</p>
            <p class="sp-desc">Montar a stack enxuta, poucas ferramentas e tudo conectado, e terminar a semana com a IA trabalhando de verdade.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Guia da Stack IA: qual ferramenta, qual plano, quanto investir</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Apostilas em PDF: Fundamentos e Claude</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Seu primeiro Project configurado com os arquivos do escritório</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Sua primeira Skill personalizada</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Cowork testado num projeto real</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>08</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 8</p>
            <p class="fm sp-title">Segundo Cérebro do escritório</p>
            <p class="sp-desc">Documentar o seu conhecimento num formato que a IA entende, para ela responder no SEU padrão, não no genérico.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Workspace IA: estrutura de pastas modelo do escritório</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de fichamento de conhecimento</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de documentação de processos: POPs e checklists</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de revisão do cérebro</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>09</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 9</p>
            <p class="fm sp-title">Projetos organizados e dirigidos por IA</p>
            <p class="sp-desc">Cada projeto novo nasce estruturado com um comando e se mantém atualizado sozinho.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill Projeto Novo com 1 comando</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Log automático de projeto: status sempre em dia</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Preenchimento automático de documentos</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Reunião que vira documento: a transcrição preenche contrato e briefing</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de direcionamento criativo com template</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>10</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 10</p>
            <p class="fm sp-title">Render, tour 360 e apresentação</p>
            <p class="sp-desc">A camada visual do projeto com IA: do render realista à apresentação que impressiona cliente.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Estrutura de prompt para render realista</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Fluxos de imagem e vídeo no Flora</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Render e vídeo direto pelo Claude</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Template completo de site de Tour 360</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Template da Apresentação De Primeira navegável</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de moodboard do projeto</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>11</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 11</p>
            <p class="fm sp-title">Executivos com IA</p>
            <p class="sp-desc">A IA revisando, compatibilizando e documentando o seu projeto executivo, com você no comando.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Biblioteca Técnica modelo: fonte de verdade das especificações</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de análise preditiva de interferências e riscos</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de revisão de executivo por prancha</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de memorial descritivo</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Skill de lista de aquisições com valores</span></li>
            </ul>
          </div>
        </div>

        <div class="sp-step gs">
          <div class="sp-num"><span>12</span></div>
          <div class="sp-card">
            <p class="jw-week">SEMANA 12</p>
            <p class="fm sp-title">Sprint final: tudo integrado</p>
            <p class="sp-desc">Rodar o processo completo de ponta a ponta, método e IA juntos, e fechar com o seu case de conclusão.</p>
            <p class="jw-get-label">VOCÊ RECEBE PRONTO</p>
            <ul class="jw-get">
              <li><svg class="icon"><use href="#i-check"/></svg><span>Seu escritório rodando o método com as 19 skills ativas</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Revisão final ao vivo com o Rodrigo</span></li>
              <li><svg class="icon"><use href="#i-check"/></svg><span>Case de conclusão e premiações para quem termina</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
```

- [ ] **Step 2: Verificar**

Run: `grep -c "VOCÊ RECEBE PRONTO" vendas.html`
Expected: `12`

Run: `python -c "from html.parser import HTMLParser; HTMLParser().feed(open('vendas.html',encoding='utf-8').read()); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add vendas.html
git commit -m "feat: bloco 2 da jornada, semanas 7 a 12 do IA de Primeira"
```

---

### Task 4: Stack IA na seção "O que você recebe"

**Files:**
- Modify: `vendas.html` — seção `<section class="sec bg-o" id="metodo-pdp">` (linha ~482): inserir um segundo `.split` logo após o `</div>` que fecha o primeiro `.split`, dentro do mesmo `.si`.

**Interfaces:**
- Consumes: classes `.split .split-img .split-text .label .gs .icon` existentes; imagem `img/ferramenta-claude.webp` (já existe no repo).

- [ ] **Step 1: Inserir o split IA**

```html
    <div class="split" style="margin-top:96px">
      <div class="split-text">
        <p class="gs label" style="margin-bottom:16px">O QUE VOCÊ RECEBE · BLOCO IA</p>
        <p class="gs fm" style="font-weight:700;font-size:clamp(22px,3.6vw,32px);line-height:1.15;text-wrap:balance">As skills prontas que colocam a IA para trabalhar no seu padrão.</p>
        <p class="gs" style="font-size:15px;color:var(--g700);line-height:1.65;margin-top:18px">O curso <strong>IA de Primeira</strong> completo, com <strong>40 aulas em 6 módulos</strong> e <strong>21 skills prontas</strong>: em vez de aprender a programar, você instala soluções que já executam as tarefas do escritório.</p>
        <div class="gs" style="margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Curso completo: 40 aulas</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">21 skills prontas</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Apostilas em PDF</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Guia operacional do método</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Workspace IA modelo</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Template de Tour 360</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Apresentação navegável</span></div>
          <div style="display:flex;align-items:center;gap:10px"><svg class="icon" style="width:18px;height:18px;flex-shrink:0"><use href="#i-check"/></svg><span style="font-size:14px;color:var(--graphite)">Biblioteca Técnica modelo</span></div>
        </div>
        <div class="gs" style="margin-top:28px;display:flex;flex-wrap:wrap;gap:8px">
          <span style="font-size:11px;padding:5px 12px;background:var(--white);border:1px solid var(--g100);border-radius:8px;color:var(--g500)">Claude</span>
          <span style="font-size:11px;padding:5px 12px;background:var(--white);border:1px solid var(--g100);border-radius:8px;color:var(--g500)">Cowork</span>
          <span style="font-size:11px;padding:5px 12px;background:var(--white);border:1px solid var(--g100);border-radius:8px;color:var(--g500)">Claude Code</span>
          <span style="font-size:11px;padding:5px 12px;background:var(--white);border:1px solid var(--g100);border-radius:8px;color:var(--g500)">Flora</span>
          <span style="font-size:11px;padding:5px 12px;background:var(--white);border:1px solid var(--g100);border-radius:8px;color:var(--g500)">1 Click Render</span>
          <span style="font-size:11px;padding:5px 12px;background:var(--white);border:1px solid var(--g100);border-radius:8px;color:var(--g500)">Notion</span>
        </div>
      </div>
      <div class="split-img gs" data-r="right" style="background:transparent;border-radius:0;overflow:visible"><img src="img/ferramenta-claude.webp" width="962" height="868" alt="Claude aplicado ao escritório de arquitetura, curso IA de Primeira" loading="lazy" class="clip-r" style="object-fit:contain;aspect-ratio:auto;height:auto;width:100%;min-height:0;filter:none"></div>
    </div>
```

Nota: conferir no arquivo se `.split` alterna a ordem via `data-r`; se a imagem cair do lado errado no desktop, inverter a ordem dos dois filhos (imagem primeiro, texto depois), espelhando o split existente.

- [ ] **Step 2: Verificar**

Run: `grep -c "O QUE VOCÊ RECEBE · BLOCO IA" vendas.html`
Expected: `1`

Run: `python -c "from html.parser import HTMLParser; HTMLParser().feed(open('vendas.html',encoding='utf-8').read()); print('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add vendas.html
git commit -m "feat: stack de entrega do bloco IA na secao o que voce recebe"
```

---

### Task 5: Menções globais "6 semanas" → "12 semanas"

**Files:**
- Modify: `vendas.html` — linhas mapeadas abaixo (números de linha do arquivo ANTES das tasks 1 a 4; localizar pelo texto, não pela linha).

**Interfaces:**
- Nenhuma. Alterações de texto puro. A âncora de cada edit é o trecho exato listado.

- [ ] **Step 1: Aplicar as substituições, uma a uma (usar o texto como âncora)**

| Onde | De | Para |
|---|---|---|
| meta description | `em 6 semanas. Método PDP` | `em 12 semanas. Método PDP` |
| og:title | `Do caos à ordem em 6 semanas` | `Do caos à ordem em 12 semanas` |
| twitter:title | `Do caos à ordem em 6 semanas` | `Do caos à ordem em 12 semanas` |
| JSON-LD description | `Acompanhamento semanal por 6 semanas` | `Acompanhamento semanal por 12 semanas` |
| JSON-LD FAQ | `Um programa de 6 semanas com acompanhamento` | `Um programa de 12 semanas com acompanhamento` |
| Hero h1 | `interiores em 6 semanas.` | `interiores em 12 semanas.` |
| Seção problema | `coloca a casa em ordem em 6 semanas, mesmo que` | `coloca a casa em ordem em 12 semanas, mesmo que` |
| Pilar 1 | `6 semanas de acompanhamento no WhatsApp` | `12 semanas de acompanhamento no WhatsApp` |
| Card ferramentas | `6 sprints semanais` | `12 sprints semanais` |
| Lista comunidade | `acesso direto durante as 6 semanas` | `acesso direto durante as 12 semanas` |
| Ancoragem | `Desafio de 6 semanas no WhatsApp com o Rodrigo` | `Desafio de 12 semanas no WhatsApp com o Rodrigo` |

- [ ] **Step 2: Verificar que não sobrou menção órfã**

Run: `grep -n "6 semanas\|seis semanas\|6 sprints" vendas.html; true`
Expected: nenhuma linha onde "6 semanas" seja a duração TOTAL do programa. Permitido apenas se o texto se referir explicitamente a um bloco de 6 semanas dentro das 12 (hoje não existe nenhum caso assim fora da nova seção da jornada, que usa "SEMANAS 1 A 6" e "SEMANAS 7 A 12").

- [ ] **Step 3: Commit**

```bash
git add vendas.html
git commit -m "feat: duracao do programa atualizada de 6 para 12 semanas em toda a pagina"
```

---

### Task 6: Verificação visual e revisão final (sem deploy)

**Files:**
- Test: `vendas.html` servida localmente.

- [ ] **Step 1: Servir a página localmente**

Run (na pasta `implementacao-2026/`): `python -m http.server 8722`
Abrir `http://localhost:8722/vendas.html` com o browser MCP (chrome-devtools ou playwright).

- [ ] **Step 2: Screenshots das seções alteradas**

Capturar em desktop (1440px) e mobile (390px):
1. Hero (promessa com 12 semanas)
2. Seção `#sprints` completa (Bloco 1 claro + Bloco 2 escuro, 12 cards, checks alinhados)
3. Split "BLOCO IA" em `#metodo-pdp`

Conferir: cards do bloco escuro legíveis, `.jw-get` em 2 colunas no desktop e 1 no mobile, sem estouro horizontal, números 07 a 12 dentro dos círculos brancos.

- [ ] **Step 3: Conferir animação de reveal**

Rolar a página até `#sprints` e confirmar que os cards novos aparecem (classe `.gs` revelada). Se algum elemento ficar invisível, é porque o JS roda antes do parse: confirmar que o script de reveal usa IntersectionObserver e pega os elementos novos.

- [ ] **Step 4: Checklist de aceite da spec**

- 12 cards fiéis à spec, sem entregável inventado
- 2 blocos visualmente distintos
- Zero "6 semanas" como duração total (`grep` da Task 5)
- JSON-LD, meta e OG com 12 semanas
- Nenhum travessão nos textos novos: `grep -n "—\|–" vendas.html` não retorna ocorrência NOVA (as pré-existentes fora do escopo não são tocadas)

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "chore: verificacao visual da jornada de 12 semanas"
```

- [ ] **Step 6: Apresentar prévia ao Rafael**

Mostrar screenshots. NÃO fazer push. Deploy só após aprovação explícita.
