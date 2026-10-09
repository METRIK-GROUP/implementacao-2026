#!/usr/bin/env node
/**
 * Gera upgrade/index.html a partir de vendas.html.
 *
 * A página de upgrade é o MESMO site da Implementação. As diferenças são só
 * estas, por decisão do Rodrigo em 23/09/2026:
 *
 *   1. O preço vira R$ 1.997 (12x de R$ 197) e os três checkouts apontam para
 *      as ofertas de upgrade.
 *   2. Ao clicar em qualquer botão de compra, abre uma janela pedindo o e-mail
 *      de aluno. Só quem tem a Certificação Projeto de Primeira segue para o
 *      pagamento.
 *   3. O resto do conteúdo é idêntico — o aluno vê a mesma página que todo
 *      mundo vê.
 *
 * Em 29/09/2026 o bloco de compra ganhou, ao lado, o card da Renovação do PDP
 * (R$ 997), com a lista do que cada opção inclui. Ver a seção 5b.
 *
 * Mais dois ajustes técnicos, invisíveis para o visitante: caminhos de imagem
 * absolutos (a página vive num subdiretório) e noindex + canonical (não competir
 * com o site principal no Google).
 *
 * Existe como script porque a /alunos/ anterior era mantida à mão e ficou 77
 * commits atrás do vendas.html entre 25/06 e 23/09/2026. Variante mantida à mão
 * desatualiza — sempre.
 *
 * Uso:  node scripts/build-upgrade.mjs
 *
 * Toda transformação é obrigatória: se uma âncora sumir do vendas.html, o build
 * falha em vez de publicar uma página de venda com o preço errado.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTransform, absolutizeAssets } from './lib/html-transform.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'vendas.html');
const TARGET = join(ROOT, 'upgrade', 'index.html');

const URL_UPGRADE = 'https://implementacao.rodrigorosar.com.br/upgrade/';

const WHATSAPP_SUPORTE =
  'https://api.whatsapp.com/send?phone=5547989163007&text=' +
  encodeURIComponent('Sou aluno do PDP e quero fazer o upgrade para a Implementação, mas meu e-mail não foi reconhecido na página.');

// Checkouts da oferta de upgrade (R$ 1.997). Os três responderam em 23/09/2026,
// e o Asaas confirmou o valor de R$ 1.997 na própria página.
const CHECKOUT_PIX = 'https://www.asaas.com/c/rf09mpzqnty6wtyq';
const CHECKOUT_CARTAO = 'https://pay.hotmart.com/U104887798W?off=atem2nx9&checkoutMode=6&bid=1779451195139';
const CHECKOUT_BOLETO = 'https://pay.tmb.com.br/RodrigoRosar/B9B1915303N';

// Renovação do PDP: produto "Renovação de Primeira (Plano Anual)", oferta
// 5bgwg9qj. Conferida no ar em 29/09/2026: R$ 997 à vista ou 12x de R$ 103,11
// (juros pagos pelo aluno). É o mesmo link e o mesmo valor que a página de
// upgrade de março/2026 usava, e o valor de renovação da régua da Clint.
const CHECKOUT_RENOVACAO = 'https://pay.hotmart.com/F79474514K?off=5bgwg9qj';
const PRECO_RENOVACAO = 'R$ 997';

const ENDPOINT_VERIFICACAO = 'https://kaktarlhwpezebhercll.supabase.co/functions/v1/verificar-aluno';

const t = createTransform(SOURCE);

// ---------------------------------------------------------------------------
// 1. Caminhos absolutos: a página vive em /upgrade/, então img/ e video/
//    relativos quebrariam.
// ---------------------------------------------------------------------------
absolutizeAssets(t);

// ---------------------------------------------------------------------------
// 2. SEO: noindex e canonical próprios
// O conteúdo é o mesmo do site principal. Sem noindex, as duas páginas
// competiriam entre si no Google e a condição de aluno apareceria na busca.
// ---------------------------------------------------------------------------
t.replaceOnce(
  'seo: robots e canonical',
  `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="https://implementacao.rodrigorosar.com.br/">`,
  `<meta name="robots" content="noindex, follow">
<meta name="googlebot" content="noindex, follow">
<link rel="canonical" href="${URL_UPGRADE}">`
);

t.replaceOnce(
  'seo: title',
  `<title>Implementação Projeto de Primeira | METRIK Instituto</title>`,
  `<title>Implementação Projeto de Primeira | Upgrade aluno PDP — METRIK Instituto</title>`
);

t.replaceOnce(
  'open graph: url',
  `<meta property="og:url" content="https://implementacao.rodrigorosar.com.br/">`,
  `<meta property="og:url" content="${URL_UPGRADE}">`
);

// ---------------------------------------------------------------------------
// 3. Schema.org: o preço declarado ao buscador é o desta página
// ---------------------------------------------------------------------------
t.replaceOnce(
  'schema: preço da oferta',
  `        "price": "3997.00",`,
  `        "price": "1997.00",`
);

t.replaceOnce(
  'schema: url da oferta',
  `        "url": "https://implementacao.rodrigorosar.com.br/#preco"`,
  `        "url": "${URL_UPGRADE}#preco"`
);

t.replaceAll('schema: urls do site', /"https:\/\/implementacao\.rodrigorosar\.com\.br\/"/g, `"${URL_UPGRADE}"`);

// ---------------------------------------------------------------------------
// 4. Gatilhos de urgência: fora
//
// O site principal trabalha com prazo ("Matrículas abertas somente esta semana",
// "A turma começa segunda, 24/08", "OFERTA EXCLUSIVA DESTA TURMA"). No upgrade
// isso é falso: o aluno pode fazer a qualquer momento. Urgência inventada para
// quem já comprou de você uma vez cobra caro em confiança.
//
// O JavaScript que alimenta a barra é todo protegido por `if (stickyBar)`, então
// ele desliga sozinho quando o elemento não existe. Não precisa ser removido.
// ---------------------------------------------------------------------------
t.cutBlock(
  'barra de urgência removida',
  '<!-- STICKY URGENCY BAR -->',
  `<script>document.body.classList.add('bar-on');</script>\n`,
  '<!-- Barra de urgência removida na página de upgrade: o aluno pode fazer upgrade a qualquer momento. -->\n'
);

// O selo "OFERTA EXCLUSIVA DESTA TURMA" também é urgência de turma. Ele é
// trocado na seção 5b, junto com a montagem dos dois cards.

// ---------------------------------------------------------------------------
// 5. Comparação: o que o aluno paga x o que um não-aluno paga
//
// Sem isso a página mostra R$ 1.997 sem referência, e a vantagem de ser aluno
// fica invisível justamente na hora da decisão.
//
// O valor de referência é R$ 5.997, definido pelo Rodrigo em 23/09/2026 como o
// preço previsto para aluno novo na reabertura das inscrições.
//
// ATENÇÃO na reabertura: hoje o vendas.html ainda está em R$ 3.997. Quando a
// página principal voltar ao ar, ela precisa estar cobrando os mesmos R$ 5.997
// anunciados aqui — se as duas páginas discordarem, o aluno que comparar perde
// a confiança no número. O `precoNaoAluno` abaixo é o único lugar a mudar.
// ---------------------------------------------------------------------------
const precoNaoAluno = 'R$ 5.997';
const precoAluno = 'R$ 1.997';
const economia = 'R$ 4.000';

t.replaceOnce(
  'comparação: rótulo e preço de não-aluno',
  `    <p class="pr-intro">Tudo isso por apenas</p>
    <p class="pr-old">De <s>R$ 19.964</s></p>`,
  `    <style>
      /* O preço de não-aluno precisa ser legível para servir de comparação, mas
         não pode competir com o valor do aluno logo abaixo. */
      #preco .pr-old{font-size:20px;color:var(--g500);margin-bottom:24px}
      #preco .pr-old s{text-decoration-thickness:1.5px;text-decoration-color:var(--g300)}
      #preco .pr-voce{color:var(--black);margin-bottom:0}
      #preco .pr-economia{font-family:'Maven Pro',sans-serif;font-weight:700;font-size:13px;
        color:#15803d;margin-top:12px;padding-top:12px;border-top:1px solid #E4E2DA;letter-spacing:0.01em}
      #preco .pr-economia strong{font-weight:800}
    </style>

    <p class="pr-intro">Para quem não é aluno</p>
    <p class="pr-old"><s>${precoNaoAluno}</s></p>

    <p class="pr-intro pr-voce">Seu valor como aluno do PDP</p>`
);

t.replaceOnce(
  'comparação: quanto o aluno economiza',
  `      <p class="pr-pix-save">Valor com desconto de 15% no PIX</p>`,
  `      <p class="pr-pix-save">Valor com desconto de 15% no PIX</p>
      <p class="pr-economia">Você economiza <strong>${economia}</strong> por ser aluno do PDP</p>`
);

// `precoAluno` fica declarado junto dos outros valores para o bloco inteiro ser
// lido num lugar só; quem escreve o preço na página é a transformação de preço,
// logo abaixo.
void precoAluno;

// ---------------------------------------------------------------------------
// 5b. Renovação x Upgrade, lado a lado
//
// Pedido do Rodrigo em 29/09/2026. Muita gente que chega aqui quer só renovar o
// acesso ao PDP. Sem a renovação na página, essa pessoa sai para pedir no
// WhatsApp, e ninguém mostra a ela o que o upgrade acrescenta. Com os dois
// cards lado a lado e a MESMA lista nos dois, a diferença fica visível sem
// precisar de argumento: a renovação para nos três primeiros itens.
//
// Decisões:
//   - Desktop: renovação à esquerda, upgrade à direita com o selo.
//   - Celular: o upgrade vem primeiro. É a oferta desta página, e quem clica em
//     "Fazer upgrade" em qualquer ponto cai aqui; abrir no card mais barato
//     puxaria a escolha para baixo.
//   - No HTML a renovação vem antes, na mesma ordem do desktop. É no desktop
//     que se navega por teclado, e a ordem do Tab precisa bater com a ordem
//     visual (WCAG 2.4.3). No celular, só o CSS (`order:-1`) sobe o upgrade.
//   - O botão da renovação NÃO passa pela janela de e-mail. A janela existe
//     para proteger o preço de aluno do upgrade; a renovação é um produto
//     próprio, com o preço dela, e fricção ali só atrapalha.
// ---------------------------------------------------------------------------
const ITENS_RENOVACAO = ['Renovação do PDP', '1 ano de acesso', 'Suporte no WhatsApp'];
const ITENS_SO_NO_UPGRADE = [
  'Curso completo IA de Primeira',
  'Desafio de Implementação por 1 ano',
  'Dúvidas com o Rodrigo direto no WhatsApp',
];

const ICONE_SIM = '<span class="pr-cmp-ic sim" aria-hidden="true"><svg><use href="#i-check"/></svg></span>';
const ICONE_NAO = '<span class="pr-cmp-ic nao" aria-hidden="true"><svg><use href="#up-i-x"/></svg></span>';

const itemIncluso = (texto) => `        <li>${ICONE_SIM}<span>${texto}</span></li>`;
const itemDestaque = (texto) => `        <li class="destaque">${ICONE_SIM}<strong>${texto}</strong></li>`;
const itemAusente = (texto) =>
  `        <li class="fora">${ICONE_NAO}<span><span class="pr-vh">Não inclui: </span>${texto}</span></li>`;

const LISTA_UPGRADE = [...ITENS_RENOVACAO.map(itemIncluso), ...ITENS_SO_NO_UPGRADE.map(itemDestaque)].join('\n');
const LISTA_RENOVACAO = [...ITENS_RENOVACAO.map(itemIncluso), ...ITENS_SO_NO_UPGRADE.map(itemAusente)].join('\n');

const ESTILO_ESCOLHA = `
  <style>
    /* O .sec é flex em linha; o invólucro ocupa a largura toda. */
    #preco .pr-escolha{width:100%;max-width:1060px;margin:0 auto}
    #preco .pr-escolha-head{text-align:center;margin-bottom:52px}
    #preco .pr-escolha-title{font-family:'Maven Pro',sans-serif;font-weight:700;font-size:clamp(26px,4vw,40px);
      line-height:1.1;color:var(--black);margin-top:18px;text-wrap:balance}
    #preco .pr-escolha-sub{font-size:16px;color:var(--g500);line-height:1.55;max-width:540px;margin:12px auto 0;text-wrap:balance}

    #preco .pr-duo{display:grid;grid-template-columns:minmax(0,1fr);gap:44px;align-items:start}
    #preco .pr-duo > .pr-card{width:100%}
    #preco .pr-card-upgrade{order:-1}
    @media (min-width:960px){
      #preco .pr-duo{grid-template-columns:minmax(0,420px) minmax(0,560px);justify-content:center;gap:28px}
      #preco .pr-duo > .pr-card{max-width:none;margin:0}
      #preco .pr-card-upgrade{order:0}
    }

    /* Upgrade: o card principal. Borda escura para ser lido como a escolha
       recomendada mesmo antes de ler o selo. */
    #preco .pr-card-upgrade{border:1.5px solid var(--black);
      box-shadow:0 30px 70px rgba(0,0,0,0.09),0 4px 12px rgba(0,0,0,0.04)}

    /* Renovação: mesma estrutura, peso visual menor. */
    #preco .pr-renov{background:rgba(255,255,255,0.5);box-shadow:none}
    #preco .pr-renov-val{font-weight:800;font-size:clamp(40px,5vw,52px);color:var(--graphite);line-height:1;letter-spacing:-0.02em}
    #preco .pr-renov .pr-intro{margin-bottom:12px}
    #preco .pr-renov .pr-meta{margin-top:10px}
    #preco .pr-renov .pr-btn{margin-top:28px}

    #preco .pr-plano{font-family:'Maven Pro',sans-serif;font-weight:800;font-size:22px;line-height:1.2;color:var(--black)}
    #preco .pr-plano-sub{font-size:14px;color:var(--g500);line-height:1.5;margin-top:6px}

    #preco .pr-cmp{list-style:none;margin:24px 0 36px;padding:24px 0 0;border-top:1px solid var(--g100);
      display:flex;flex-direction:column;gap:13px;text-align:left}
    #preco .pr-cmp li{display:flex;align-items:flex-start;gap:12px;font-size:15px;line-height:1.45;color:var(--graphite)}
    #preco .pr-cmp li.destaque strong{font-weight:700;color:var(--black)}
    #preco .pr-cmp li.fora{color:var(--g300)}
    #preco .pr-cmp-ic{flex-shrink:0;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center}
    #preco .pr-cmp-ic svg{width:11px;height:11px;fill:none;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}
    #preco .pr-cmp-ic.sim{background:var(--black)}
    #preco .pr-cmp-ic.sim svg{stroke:#fff}
    #preco .pr-renov .pr-cmp-ic.sim{background:var(--g500)}
    #preco .pr-cmp-ic.nao{border:1.5px solid var(--g100)}
    #preco .pr-cmp-ic.nao svg{stroke:var(--g300);width:9px;height:9px}

    #preco .pr-vh{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

    @media (max-width:540px){
      #preco .pr-escolha-head{margin-bottom:40px}
      #preco .pr-cmp li{font-size:14.5px}
    }
  </style>`;

const CABECALHO_ESCOLHA = `
  <div class="pr-escolha">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <symbol id="up-i-x" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></symbol>
    </svg>
    <div class="pr-escolha-head gs">
      <p class="label tc">Exclusivo para aluno PDP</p>
      <h2 class="pr-escolha-title">Renovar ou fazer o upgrade?</h2>
      <p class="pr-escolha-sub">As duas opções renovam seu acesso ao PDP por mais um ano. A diferença é o que vem junto.</p>
    </div>

    <div class="pr-duo">`;

const CARD_RENOVACAO = `
    <article class="pr-card pr-renov gs" aria-labelledby="pr-renov-titulo">
      <h3 class="pr-plano" id="pr-renov-titulo">Renovação PDP</h3>
      <p class="pr-plano-sub">Mais um ano de acesso ao PDP.</p>
      <ul class="pr-cmp">
${LISTA_RENOVACAO}
      </ul>
      <p class="pr-intro">Valor da renovação</p>
      <p class="pr-renov-val fm">${PRECO_RENOVACAO}</p>
      <p class="pr-meta">à vista, ou em até 12x no cartão (com juros)</p>
      <a href="${CHECKOUT_RENOVACAO}" target="_blank" rel="noopener" class="pr-btn ghost">Renovar só o PDP</a>
    </article>`;

// Abre o invólucro, põe o card da renovação, troca o selo de urgência por
// "MELHOR ESCOLHA" e coloca no topo do card do upgrade a mesma lista que a
// renovação mostra. O card do upgrade vira <article>, como o da renovação:
// dois cards comparáveis, a mesma semântica para o leitor de tela.
t.replaceOnce(
  'escolha: abertura, renovação, selo e o que o upgrade inclui',
  `  <div class="pr-card gs">
    <div class="pr-ribbon">OFERTA EXCLUSIVA DESTA TURMA</div>`,
  `${ESTILO_ESCOLHA}
${CABECALHO_ESCOLHA}
${CARD_RENOVACAO}

  <article class="pr-card pr-card-upgrade gs" aria-labelledby="pr-upgrade-titulo">
    <div class="pr-ribbon">MELHOR ESCOLHA</div>

    <h3 class="pr-plano" id="pr-upgrade-titulo">Upgrade para a Implementação</h3>
    <p class="pr-plano-sub">Tudo da renovação, mais a Implementação completa.</p>
    <ul class="pr-cmp">
${LISTA_UPGRADE}
    </ul>`
);

// ---------------------------------------------------------------------------
// 6. Preço: R$ 3.997 -> R$ 1.997
// 12 x 197 = 2.364. R$ 1.997 fica 15,5% abaixo disso, então "15% de desconto
// no PIX" é verdade com folga — a mesma relação que o site principal tem entre
// cartão e PIX.
//
// Conferido no checkout da Hotmart (oferta atem2nx9) em 29/09/2026: 12x de
// R$ 197,00 sem juros para o aluno (total R$ 2.364). Na própria Hotmart, cartão
// em 1x, PayPal e Apple Pay saem por R$ 1.997; Pix e boleto dentro da Hotmart
// saem por R$ 2.364. Por isso o botão de PIX desta página leva ao Asaas, e não
// à Hotmart.
// ---------------------------------------------------------------------------
t.replaceOnce(
  'preço: parcela do cartão',
  `      <span class="pr-tx">12x</span><span class="pr-rs">de R$</span><span class="pr-val">390</span>`,
  `      <span class="pr-tx">12x</span><span class="pr-rs">de R$</span><span class="pr-val">197</span>`
);

t.replaceOnce(
  'preço: valor no PIX',
  `      <p class="pr-pix-val fm">R$ 3.997</p>`,
  `      <p class="pr-pix-val fm">R$ 1.997</p>`
);

// ---------------------------------------------------------------------------
// 5. Checkouts: as três formas de pagamento apontam para a oferta de upgrade.
//    data-upgrade-checkout é o gancho que o JS usa para pedir o e-mail antes.
// ---------------------------------------------------------------------------
t.replaceOnce(
  'checkout: PIX',
  `      <a href="https://www.asaas.com/c/2x3ccx7lhp4q23up" target="_blank" class="pr-btn primary">`,
  `      <a href="${CHECKOUT_PIX}" target="_blank" class="pr-btn primary" data-upgrade-checkout>`
);

t.replaceOnce(
  'checkout: cartão',
  `        <a href="https://pay.hotmart.com/U104887798W?bid=1774198329832" target="_blank" class="pr-btn ghost">`,
  `        <a href="${CHECKOUT_CARTAO}" target="_blank" class="pr-btn ghost" data-upgrade-checkout>`
);

// O boleto parcelado sai da página de upgrade.
//
// Decisão do Rodrigo em 23/09/2026: para esse público não faz falta. O aluno
// segue com PIX e cartão 12x, e ainda encontra boleto (à vista) dentro do
// próprio checkout da Hotmart, que oferece Pix, Boleto, Apple Pay e PayPal.
//
// O que motivou olhar para isso: a oferta da TMB apontada aqui (B9B1915303N)
// respondia "Oferta Indisponível", então o botão levava o aluno a uma tela de
// erro. As ofertas da TMB ficam desativadas enquanto as inscrições estão
// fechadas — comportamento normal, não defeito.
//
// Para trazer o botão de volta um dia: troque o cutBlock abaixo pelo
// replaceOnce que está logo acima dele, comentado.
//
// t.replaceOnce(
//   'checkout: boleto',
//   `        <a href="https://pay.tmb.com.br/RodrigoRosar/M4E188885X5" target="_blank" class="pr-btn ghost">`,
//   `        <a href="${CHECKOUT_BOLETO}" target="_blank" class="pr-btn ghost" data-upgrade-checkout>`
// );
// Com dois meios de pagamento em vez de três, a linha de baixo precisa de
// ajuste: `.pr-btn-row` é uma grade de duas colunas, então o botão do cartão
// sozinho ficava com metade da largura, encolhido e desalinhado embaixo do botão
// preto do PIX. Uma coluna só, e o botão secundário ganha o mesmo respiro do
// principal — a hierarquia continua vindo da cor, não do tamanho.
//
// Refino de 29/09/2026: os botões de compra (PIX, cartão e renovação) passam a
// ter a mesma altura fixa de 56px, com o texto centralizado pela altura e não
// pelo padding. Assim nenhuma regra de padding herdada consegue achatar um
// deles, e os três ficam do mesmo tamanho lado a lado no desktop.
t.replaceOnce(
  'botões: duas formas de pagamento em vez de três',
  `<section class="sec bg-o" id="preco" aria-label="Preço e formas de pagamento">`,
  `<section class="sec bg-o" id="preco" aria-label="Preço e formas de pagamento">
  <style>
    #preco .pr-btn-row{grid-template-columns:1fr}
    #preco .pr-btn{min-height:56px;padding:0 24px;line-height:1.2}
    #preco .pr-btn.primary{font-size:15px;letter-spacing:0.03em;gap:12px}
    #preco .pr-btn.ghost{font-size:14px;font-weight:700}
    #preco .pr-btn-tag{line-height:1.5;padding:2px 10px}
  </style>`
);

t.cutBlock(
  'checkout: boleto removido (oferta TMB indisponível)',
  `        <a href="https://pay.tmb.com.br/RodrigoRosar/M4E188885X5" target="_blank" class="pr-btn ghost">`,
  `</a>
`,
  `        <!-- Botão de boleto parcelado removido: a oferta da TMB está indisponível desde 23/09/2026. -->
`
);

// O selo "Garantia 97 dias" sai da linha de selos do bloco de compra. Pedido do
// Rodrigo em 29/09/2026: quem chega aqui já é aluno e conhece o PDP, e o selo é
// argumento para quem compra pela primeira vez. "Pagamento seguro" e
// "Certificado MEC" ficam. A seção de garantia e o FAQ não foram tocados.
t.replaceOnce(
  'selo de garantia removido do bloco de compra',
  `      <span><svg class="icon" style="width:14px;height:14px"><use href="#i-shield"/></svg> Garantia 97 dias</span>
      <span class="pr-dot"></span>
`,
  ''
);

// ---------------------------------------------------------------------------
// 6. Link "Já é PDP? Aperte e faça upgrade": sai
// Ele leva ao WhatsApp para pedir o upgrade. Quem está nesta página já está na
// oferta de upgrade — o link só faria a pessoa sair do checkout.
// ---------------------------------------------------------------------------
t.cutBlock(
  'link "Já é PDP?" removido',
  `    <p class="pr-upgrade"><a href="https://api.whatsapp.com/send?phone=5547992360031&text=J%C3%A1%20sou%20PDP`,
  `</a></p>\n`,
  `    <!-- Link "Já é PDP? faça upgrade" removido: esta página já É a oferta de upgrade. -->\n`
);

// Fecha o card do upgrade (aberto como <article> na seção 5b) e o invólucro dos
// dois cards. A âncora é o fim da seção de preço logo depois do link removido
// acima, então esta transformação precisa vir depois daquela.
t.replaceOnce(
  'escolha: fechamento dos dois cards',
  `    <!-- Link "Já é PDP? faça upgrade" removido: esta página já É a oferta de upgrade. -->
  </div>
</section>`,
  `    <!-- Link "Já é PDP? faça upgrade" removido: esta página já É a oferta de upgrade. -->
  </article>
    </div>
  </div>
</section>`
);

// ---------------------------------------------------------------------------
// 7. A janela que confirma a matrícula antes do checkout
// ---------------------------------------------------------------------------
const MODAL = `
  <div class="up-modal" id="up-modal" role="dialog" aria-modal="true" aria-labelledby="up-modal-title" hidden>
    <div class="up-modal-card">
      <button type="button" class="up-modal-close" id="up-modal-close" aria-label="Fechar">&times;</button>
      <h2 class="up-modal-title" id="up-modal-title">Confirme seu e-mail de aluno</h2>
      <p class="up-modal-sub">Essa condição é exclusiva para aluno da Certificação Projeto de Primeira. Use o mesmo e-mail da sua compra.</p>

      <form class="up-modal-form" id="up-form" novalidate>
        <label for="up-email">E-mail</label>
        <input class="up-input" type="email" id="up-email" name="email" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" required>
        <p class="up-msg" id="up-msg" role="status" aria-live="polite"></p>
        <div class="up-modal-actions">
          <button class="pr-btn primary" type="submit" id="up-submit"><span id="up-submit-label">Confirmar e ir para o pagamento</span></button>
          <a class="pr-btn ghost" id="up-wa" href="${WHATSAPP_SUPORTE}" target="_blank" rel="noopener" hidden>Falar com o suporte no WhatsApp</a>
        </div>
      </form>
    </div>
  </div>
  <style>
    .up-modal{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;padding:20px;
      background:rgba(14,14,14,0.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
    .up-modal.is-open{display:flex}
    /* .pr-btn declara display:flex, o que venceria o atributo hidden do HTML.
       Sem esta regra o botão de suporte apareceria antes de existir erro. */
    .up-modal [hidden]{display:none !important}
    .up-modal-card{background:var(--white);border-radius:16px;padding:clamp(26px,4vw,36px);max-width:440px;width:100%;
      box-shadow:0 30px 80px rgba(0,0,0,0.35);position:relative;text-align:left}
    .up-modal-title{font-family:'Maven Pro',sans-serif;font-weight:800;font-size:clamp(20px,3vw,25px);line-height:1.15;color:var(--black);text-wrap:balance;padding-right:36px}
    .up-modal-sub{font-size:14.5px;color:var(--g500);line-height:1.55;margin-top:10px;text-wrap:pretty}
    .up-modal-form{display:flex;flex-direction:column;gap:9px;margin-top:22px}
    .up-modal-form label{font-family:'Maven Pro',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--graphite)}
    .up-input{width:100%;padding:13px 15px;font-family:'Inter',sans-serif;font-size:16px;color:var(--black);
      background:var(--offwhite);border:1px solid #E4E2DA;border-radius:11px;transition:border-color .2s,box-shadow .2s,background .2s}
    .up-input::placeholder{color:#A8A59C}
    .up-input:focus{outline:none;background:#fff;border-color:var(--black);box-shadow:0 0 0 3px rgba(30,30,30,0.1)}
    .up-input.is-invalid{border-color:#C0392B;box-shadow:0 0 0 3px rgba(192,57,43,0.12)}
    .up-msg{font-size:13px;line-height:1.5}
    .up-msg:empty{display:none}
    .up-msg.erro{color:#C0392B}
    .up-msg.ok{color:#1E7A4A}
    .up-modal-actions{display:flex;flex-direction:column;gap:9px;margin-top:6px}
    .up-modal-close{position:absolute;top:12px;right:12px;width:36px;height:36px;border:none;background:transparent;
      color:var(--g500);font-size:24px;line-height:1;border-radius:50%;transition:background .2s}
    .up-modal-close:hover{background:var(--offwhite);color:var(--black)}
    .up-spinner{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:upspin .7s linear infinite;vertical-align:-3px}
    @keyframes upspin{to{transform:rotate(360deg)}}
    @media (prefers-reduced-motion: reduce){.up-spinner{animation-duration:1.4s}}
  </style>
`;

t.replaceOnce(
  'nota do bloco de preço',
  `    <p class="pr-note">Esse valor é exclusivo para quem entra nesta janela de inscrição. Depois, o preço sobe.</p>`,
  `    <p class="pr-note">Essa condição é exclusiva para aluno da Certificação Projeto de Primeira.</p>`
);

// A janela entra no fim do documento, e não dentro da seção de preço.
//
// Dois motivos. O primeiro é de robustez: amarrar a inserção ao comentário da
// seção seguinte ("18. ROI") fazia o build quebrar sempre que alguém
// acrescentava uma seção nova ali — e acrescentar seção é das coisas mais
// comuns numa reabertura de turma. `</body>` não se move.
//
// O segundo é de comportamento: um elemento `position:fixed` deixa de se
// posicionar pela tela se qualquer elemento acima dele tiver `transform`, e o
// GSAP anima com transform vários blocos dessa página. Fora de todos eles, a
// janela sempre abre centralizada.
t.replaceOnce('modal: markup', `\n</body>`, `\n${MODAL}\n</body>`);

// ---------------------------------------------------------------------------
// 8. JS: verificação antes do checkout
// ---------------------------------------------------------------------------
const JS_UPGRADE = `
// ===== UPGRADE: confirmação de matrícula antes do checkout =====
// Regra de negócio: na dúvida, vender. Se a verificação falhar por rede, timeout
// ou erro do servidor, o checkout é liberado assim mesmo — perder um aluno de
// verdade custa mais do que um não-aluno entrar pela condição de upgrade.
(function(){
  var ENDPOINT='${ENDPOINT_VERIFICACAO}';
  var TIMEOUT_MS=7000;
  var LABEL='Confirmar e ir para o pagamento';

  var modal=document.getElementById('up-modal');
  var form=document.getElementById('up-form');
  if(!modal||!form)return;

  var input=document.getElementById('up-email');
  var msg=document.getElementById('up-msg');
  var btn=document.getElementById('up-submit');
  var btnLabel=document.getElementById('up-submit-label');
  var wa=document.getElementById('up-wa');
  var fechar=document.getElementById('up-modal-close');
  var destino=null;
  var ultimoFoco=null;

  function abrir(url){
    destino=url;
    ultimoFoco=document.activeElement;
    modal.hidden=false;
    modal.classList.add('is-open');
    document.body.style.overflow='hidden';
    setTimeout(function(){input.focus();},60);
  }
  function fecharModal(){
    modal.classList.remove('is-open');
    modal.hidden=true;
    document.body.style.overflow='';
    carregando(false);
    mostrar('','');
    wa.hidden=true;
    if(ultimoFoco&&ultimoFoco.focus)ultimoFoco.focus();
  }
  function mostrar(texto,tipo){
    msg.textContent=texto||'';
    msg.className='up-msg'+(tipo?' '+tipo:'');
  }
  function carregando(on){
    btn.disabled=on;
    if(on){btnLabel.innerHTML='<span class="up-spinner" aria-hidden="true"></span>';btn.setAttribute('aria-busy','true');}
    else{btnLabel.textContent=LABEL;btn.removeAttribute('aria-busy');}
  }
  function irParaCheckout(){
    var url=destino;
    fecharModal();
    window.open(url,'_blank','noopener');
  }

  // Intercepta os botões de compra. O href continua correto: se este script não
  // rodar, o botão funciona como link normal e a venda acontece mesmo assim.
  Array.prototype.forEach.call(document.querySelectorAll('[data-upgrade-checkout]'),function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      abrir(a.getAttribute('href'));
    });
  });

  fechar.addEventListener('click',fecharModal);
  modal.addEventListener('click',function(e){if(e.target===modal)fecharModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('is-open'))fecharModal();});
  input.addEventListener('input',function(){input.classList.remove('is-invalid');mostrar('','');});

  var EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var email=input.value.trim().toLowerCase();
    if(!EMAIL_RE.test(email)){
      input.classList.add('is-invalid');input.focus();
      return mostrar('Informe um e-mail válido.','erro');
    }
    mostrar('');carregando(true);wa.hidden=true;

    var ctrl=('AbortController' in window)?new AbortController():null;
    var timer=setTimeout(function(){if(ctrl)ctrl.abort();},TIMEOUT_MS);

    fetch(ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email}),
      signal:ctrl?ctrl.signal:undefined
    })
    .then(function(r){
      clearTimeout(timer);
      if(r.status===429){
        carregando(false);
        wa.hidden=false;
        return mostrar('Muitas tentativas seguidas. Aguarde alguns minutos ou fale com o suporte.','erro');
      }
      if(!r.ok)throw new Error('http_'+r.status);
      return r.json().then(function(dados){
        if(dados&&dados.elegivel===true){
          mostrar('Matrícula confirmada. Abrindo o pagamento…','ok');
          return setTimeout(irParaCheckout,450);
        }
        carregando(false);
        wa.hidden=false;
        mostrar('Não encontramos esse e-mail na turma do PDP. Se você comprou com outro e-mail, tente ele — ou fale com o suporte que a gente resolve na hora.','erro');
      });
    })
    .catch(function(){
      clearTimeout(timer);
      // Verificação indisponível não bloqueia a venda.
      console.warn('verificação indisponível; checkout liberado');
      mostrar('Seguindo para o pagamento…','ok');
      setTimeout(irParaCheckout,350);
    });
  });
})();

`;

t.replaceOnce('js do upgrade', `\n}); // end DOMContentLoaded`, `${JS_UPGRADE}}); // end DOMContentLoaded`);

// A janela de pré-checkout (nome, e-mail e WhatsApp) é só da página de vendas
// (decisão de 09/10/2026). Aqui os botões já abrem a confirmação de e-mail de
// aluno; as duas janelas juntas brigariam pelo mesmo clique.
t.replaceOnce('pré-checkout: fora', `<!-- Janela de pré-checkout (nome, e-mail e WhatsApp antes do pagamento). Gerado por scripts/build-pre-checkout.mjs. -->
<script defer src="/assets/pre-checkout.js"></script>
`, '');

// ---------------------------------------------------------------------------
// Guardas: o que não pode sobreviver nesta página
// ---------------------------------------------------------------------------

// O vendas.html mantém a seção "INSCRIÇÕES ABREM ÀS 15H" comentada para reuso,
// e ela cita o preço cheio. Comentário não renderiza, então a regra de preço
// olha só o HTML visível. A ancoragem de valor (R$ 3.997 como preço de tabela
// do curso) continua na página de propósito: é a mesma informação do site.
t.guardVisible([
  ['preço de venda de R$ 3.997 no bloco de compra', /pr-pix-val fm">R\$ 3\.997/],
  ['parcela de R$ 390', /pr-val">390/],

  // Urgência de prazo não existe no upgrade: o aluno pode fazer quando quiser.
  // Se o vendas.html ganhar um gatilho novo, o build para aqui e avisa, em vez
  // de publicar um prazo falso para quem já é seu aluno.
  ['barra fixa de urgência', /class="sticky-bar/],
  ['aviso de prazo de matrículas', /Matr[íi]culas (abertas|encerram|s[óo])/i],
  ['data de início de turma', /turma come[çc]a|Come[çc]a segunda/i],
  ['aviso de que o preço sobe', /o pre[çc]o sobe/i],
  ['chamada de garantir vaga', /Garantir minha vaga|Quero minha vaga/i],
  ['oferta amarrada a uma turma', /DESTA TURMA|desta janela|janela de inscri[çc][ãa]o/i],
  ['contagem regressiva', /id="pr-countdown"/],
  ['selo de garantia no bloco de compra', /class="pr-trust">(?:(?!<\/div>)[\s\S])*Garantia/],
]);

t.guard([
  ['checkout da oferta cheia (Asaas)', /asaas\.com\/c\/2x3ccx7lhp4q23up/],
  ['checkout da oferta cheia (Hotmart)', /pay\.hotmart\.com\/U104887798W\?bid=/],
  ['checkout da oferta cheia (TMB)', /pay\.tmb\.com\.br\/RodrigoRosar\/M4E188885X5/],
  ['checkout na TMB (oferta indisponível desde 23/09/2026)', /pay\.tmb\.com\.br/],
  ['link "Já é PDP?" (o visitante já está na oferta de upgrade)', /J%C3%A1%20sou%20PDP/],
  ['caminho relativo de imagem', /(?<!\/)(["'])img\//],
  ['indexação no Google', /<meta name="robots" content="index/],
  ['preço de 3997 no schema', /"price": "3997\.00"/],
  // `.pr-upgrade` é o estilo do antigo link "Já é PDP? faça upgrade" no
  // vendas.html: fonte 12,5px, 1px de respiro embaixo e sublinhado tracejado
  // em todo <a> de dentro. Em 29/09/2026 o card do upgrade foi publicado com
  // essa classe e o botão do PIX herdou tudo isso: ficou achatado, com a borda
  // de baixo pontilhada. O card agora é `.pr-card-upgrade`; isto impede a volta.
  ['classe pr-upgrade (estilo de link do vendas.html, achata os botões)', /class="[^"]*\bpr-upgrade\b/],
  ['janela de pré-checkout (só da página de vendas)', /pre-checkout\.js/],
]);

// Casa `trecho` literalmente, mas só dentro do card cujo título tem `idTitulo`
// (entre o título e o </article> que fecha aquele card). Assim uma lista trocada
// de card, ou o link da renovação caindo no card do upgrade, reprova o build.
function dentroDoCard(idTitulo, trecho) {
  const literal = trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`id="${idTitulo}"(?:(?!</article>)[\\s\\S])*?${literal}`);
}

// Guardas positivas: o que precisa existir.
t.require([
  ['selo de melhor escolha', /<article class="pr-card pr-card-upgrade gs"[^>]*>\s*<div class="pr-ribbon">MELHOR ESCOLHA<\/div>/],
  ['preço do upgrade no PIX', /pr-pix-val fm">R\$ 1\.997/],
  ['preço de referência para não-aluno', /pr-old"><s>R\$ 5\.997<\/s>/],
  ['rótulo de quem paga cada valor', /Para quem não é aluno[\s\S]*Seu valor como aluno do PDP/],
  ['quanto o aluno economiza', /Você economiza <strong>R\$ 4\.000<\/strong>/],
  ['parcela do upgrade', /pr-val">197/],
  ['checkout PIX do upgrade', /asaas\.com\/c\/rf09mpzqnty6wtyq/],
  ['checkout cartão do upgrade', /off=atem2nx9/],
  ['os dois botões de compra com o gancho de verificação', /data-upgrade-checkout[\s\S]*data-upgrade-checkout/],
  ['lista completa dentro do card do upgrade', dentroDoCard('pr-upgrade-titulo', LISTA_UPGRADE)],
  ['lista com os três itens ausentes dentro do card da renovação', dentroDoCard('pr-renov-titulo', LISTA_RENOVACAO)],
  ['preço da renovação dentro do card dela', dentroDoCard('pr-renov-titulo', `pr-renov-val fm">${PRECO_RENOVACAO}<`)],
  // A janela de e-mail é só do upgrade: o link da renovação não pode ganhar o gancho.
  ['checkout da renovação, sem a janela de e-mail',
    dentroDoCard('pr-renov-titulo', `<a href="${CHECKOUT_RENOVACAO}" target="_blank" rel="noopener" class="pr-btn ghost">`)],
  ['renovação antes do upgrade no HTML (ordem do Tab = ordem visual no desktop)', /class="pr-card pr-renov[\s\S]*class="pr-card pr-card-upgrade/],
  ['janela de confirmação', /id="up-modal"/],
  ['endpoint de verificação', /functions\/v1\/verificar-aluno/],
  ['canonical do upgrade', /rel="canonical" href="https:\/\/implementacao\.rodrigorosar\.com\.br\/upgrade\/"/],
  ['ancoragem de valor preservada', /id="ancoragem"/],
]);

t.write(TARGET);

console.log(`upgrade/index.html gerado a partir de vendas.html (${t.applied.length} transformações):`);
for (const item of t.applied) console.log(`  - ${item}`);
