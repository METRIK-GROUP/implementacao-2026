# Fix Depoimentos — Aspect Ratio Diferentes (Vertical + Horizontal)

**Data:** 2026-05-07
**Branch:** feat/repaginada-rafael
**Escopo:** Section `#depoimentos` — 4 cards de vídeo YouTube

## Problema

3 vídeos são 16:9 (horizontais), 1 (Priscilla `KhV2II9aKBU`) é 9:16 (vertical, gravado em selfie/portrait). Container atual era 16:9 fixo. Quando Priscilla carrega, o player do YouTube exibe vídeo vertical com letterbox preto lateral grande — visual quebrado.

## Solução (abordagem A aprovada)

Card visual permanece 16:9 (grid uniforme 2x2). Iframe interno da Priscilla respeita seu aspect ratio real via CSS, ficando vertical centralizado dentro do card horizontal. Fundo do card preto (`#000`) cobre o letterbox lateral sem destacar.

### Mudanças concretas

**HTML** — manter `data-aspect="9/16"` apenas no card da Priscilla (já aplicado).

**CSS:**
```css
.tc-video {
  aspect-ratio: 16/9;        /* fixo, grid uniforme */
  background-color: #000;    /* letterbox invisível */
}

/* Vídeos não-padrão: thumb usa contain pra não distorcer */
.tc-video[data-aspect] {
  background-size: contain;
  background-repeat: no-repeat;
}

/* Iframe interno respeita aspect real do vídeo via CSS var */
.tc-video[data-aspect="9/16"] iframe {
  width: auto;
  height: 100%;
  aspect-ratio: 9/16;
  left: 50%;
  transform: translateX(-50%);
}
```

**JS** — reverter complexidade adicionada (auto-detect via `maxresdefault.jpg`). Voltar pra versão simples que apenas adiciona `playsinline=1` ao URL do iframe.

## Não-objetivos (YAGNI)

- Não detectar aspect-ratio automaticamente (`maxresdefault.jpg` não retorna dims do vídeo real, retorna do thumb 16:9 com letterbox embutido — inútil)
- Não testar via Chrome DevTools MCP (lento, frágil)
- Não mexer em outros vídeos

## Validação determinística (sem browser)

1. Card mantém aspect-ratio 16/9 fixo → grid 2x2 uniforme garantido
2. Priscilla iframe com `aspect-ratio: 9/16` + `height:100%` + `width:auto` + centralização horizontal → vídeo vertical visível, letterbox preto laterais misturado com fundo
3. Outros 3 vídeos: iframe `inset:0; width:100%; height:100%` (regra existente em `.tc-video iframe`)

## Mobile

Mesmas regras aplicam. Em mobile o grid colapsa para 1 coluna (já existente em `.tg`). Cards mantêm 16/9 em qualquer largura. Iframe vertical da Priscilla ocupa altura total do card centralizado horizontal.

## Riscos

- `aspect-ratio` em `iframe` é Chrome 88+/Firefox 89+/Safari 15+ — coberto.
- Centralização via `left: 50%; transform: translateX(-50%)` precisa `position: absolute` (já presente em `.tc-video iframe { position: absolute; inset: 0 }` — vou substituir `inset:0` por `top:0; bottom:0` na regra geral pra manter `left` overridable).
