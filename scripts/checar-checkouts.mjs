#!/usr/bin/env node
/**
 * Abre cada link de compra das páginas publicadas e diz se ele está de pé e com
 * o valor certo.
 *
 * Existe porque um teste que só checa se o endereço responde não serve aqui: uma
 * oferta desativada devolve HTTP 200 e monta "Oferta Indisponível" dentro da
 * página. Foi assim que o boleto do upgrade ficou apontando para uma oferta
 * inativa sem ninguém notar, até 23/09/2026.
 *
 * Uso:  node scripts/checar-checkouts.mjs
 *
 * Duas chaves no topo:
 *
 * INSCRICOES_ABERTAS — com as inscrições fechadas, as ofertas do site principal
 * ficam desativadas de propósito. Isso é o esperado, não um defeito. Com a chave
 * em `false`, esses checkouts aparecem como "fechada (esperado)". O robô
 * "Publicar pagina de vendas" vira para `true` em 17/10 às 23h; a partir daí o
 * script cobra que os checkouts da página de vendas estejam de pé.
 *
 * FASE — qual oferta da página de vendas está valendo: 'evento' até domingo
 * 18/10 às 19h (12x de R$ 390 ou R$ 3.997 no PIX) e 'cheia' depois (12x de
 * R$ 490 ou R$ 4.997 no PIX). O robô "Virar para o preco cheio" troca para
 * 'cheia'. Na fase cheia, um checkout do evento que continue aberto é FALHA:
 * alguém com o link antigo ainda pagaria R$ 3.997.
 *
 * A TMB só mostra o valor depois do CPF, então nela o script confere apenas se
 * a oferta está de pé; o valor é conferido à mão.
 *
 * Sai com código 1 só quando algo está realmente errado.
 */

import { OFERTA_EVENTO, OFERTA_CHEIA } from './lib/oferta.mjs';

// Vire para `true` quando as inscrições reabrirem (o robô de 17/10 faz isso).
const INSCRICOES_ABERTAS = false;

// 'evento' até 18/10 às 19h; 'cheia' depois (o robô da virada troca).
const FASE = 'evento';

const CHECKOUTS = [
  {
    pagina: '/upgrade/ (no ar agora)',
    sempreAtivo: true,
    forma: 'PIX (Asaas)',
    url: 'https://www.asaas.com/c/rf09mpzqnty6wtyq',
    esperado: /1\.997/,
    descricaoEsperada: 'R$ 1.997',
  },
  {
    pagina: '/upgrade/ (no ar agora)',
    sempreAtivo: true,
    forma: 'Cartão (Hotmart)',
    url: 'https://pay.hotmart.com/U104887798W?off=atem2nx9&checkoutMode=6&bid=1779451195139',
    // A página promete "12x de R$ 197 sem juros"; é isso que a Hotmart tem que
    // mostrar. Em 29/09/2026: 12x de R$ 197,00 (total R$ 2.364) e R$ 1.997 em
    // 1x no cartão. Pix e boleto DENTRO da Hotmart saem por R$ 2.364.
    // `\s` e não espaço: a Hotmart separa "R$" do valor com espaço não
    // separável (U+00A0), que um espaço comum no padrão não reconhece.
    esperado: /12\s*x\s+de\s+R\$\s*197,00/,
    descricaoEsperada: '12x de R$ 197',
  },
  {
    pagina: '/upgrade/ (no ar agora)',
    sempreAtivo: true,
    forma: 'Renovação PDP (Hotmart)',
    url: 'https://pay.hotmart.com/F79474514K?off=5bgwg9qj',
    esperado: /R\$\s*997,00/,
    descricaoEsperada: 'R$ 997',
  },
  // A página de upgrade não tem boleto, por decisão do Rodrigo em 23/09/2026:
  // para esse público não faz falta. Se um dia voltar, é só reativar isto aqui
  // e o botão no build-upgrade.mjs.
  // {
  //   pagina: '/upgrade/ (no ar agora)',
  //   sempreAtivo: true,
  //   forma: 'Boleto parcelado (TMB)',
  //   url: 'https://pay.tmb.com.br/RodrigoRosar/B9B1915303N',
  //   esperado: /1\.997/,
  //   descricaoEsperada: 'R$ 1.997',
  // },

  // --- Página de vendas, oferta do evento (até 18/10 às 19h) ---------------
  {
    pagina: 'vendas.html · oferta do evento (até 18/10 às 19h)',
    sempreAtivo: false,
    fase: 'evento',
    forma: 'PIX (Asaas)',
    url: OFERTA_EVENTO.asaas,
    esperado: /3\.997/,
    descricaoEsperada: 'R$ 3.997',
  },
  {
    pagina: 'vendas.html · oferta do evento (até 18/10 às 19h)',
    sempreAtivo: false,
    fase: 'evento',
    forma: 'Cartão (Hotmart)',
    url: OFERTA_EVENTO.hotmart,
    esperado: /12\s*x\s+de\s+R\$\s*390,00/,
    descricaoEsperada: '12x de R$ 390',
  },
  {
    pagina: 'vendas.html · oferta do evento (até 18/10 às 19h)',
    sempreAtivo: false,
    fase: 'evento',
    forma: 'Boleto parcelado (TMB)',
    url: OFERTA_EVENTO.tmb,
    esperado: null, // a TMB só mostra o valor depois do CPF
    descricaoEsperada: 'de pé (valor só aparece depois do CPF; conferir à mão: R$ 3.997)',
  },

  // --- Página de vendas, oferta cheia (a partir de 18/10 às 19h) -----------
  // Conferidos em 14/10/2026: Asaas R$ 4.997,00; Hotmart 12x de R$ 490,00
  // (1x de R$ 5.880,00).
  {
    pagina: 'vendas.html · oferta cheia (a partir de 18/10 às 19h)',
    sempreAtivo: false,
    fase: 'cheia',
    forma: 'PIX (Asaas)',
    url: OFERTA_CHEIA.asaas,
    esperado: /4\.997/,
    descricaoEsperada: 'R$ 4.997',
  },
  {
    pagina: 'vendas.html · oferta cheia (a partir de 18/10 às 19h)',
    sempreAtivo: false,
    fase: 'cheia',
    forma: 'Cartão (Hotmart)',
    url: OFERTA_CHEIA.hotmart,
    esperado: /12\s*x\s+de\s+R\$\s*490,00/,
    descricaoEsperada: '12x de R$ 490',
  },
  {
    pagina: 'vendas.html · oferta cheia (a partir de 18/10 às 19h)',
    sempreAtivo: false,
    fase: 'cheia',
    forma: 'Boleto parcelado (TMB)',
    url: OFERTA_CHEIA.tmb,
    esperado: null, // a TMB só mostra o valor depois do CPF
    descricaoEsperada: 'de pé (valor só aparece depois do CPF; conferir à mão: R$ 4.997)',
  },
];

// Frases que significam "esta oferta morreu", mesmo com a página respondendo bem.
const SINAIS_DE_OFERTA_MORTA = [
  /oferta\s+indispon[ií]vel/i,
  /produto\s+(est[áa]\s+)?indispon[ií]vel/i,
  /n[ãa]o\s+est[áa]\s+dispon[ií]vel/i,
  /oferta\s+(expirada|encerrada|cancelada)/i,
  /p[áa]gina\s+n[ãa]o\s+encontrada/i,
];

/**
 * O que se espera de cada checkout, dado o momento:
 *   'de-pe'          precisa responder com o valor certo;
 *   'fechado'        precisa estar desativado (oferta do evento depois da virada);
 *   'tanto-faz'      pode estar aberto ou fechado (oferta cheia antes da virada,
 *                    ou qualquer oferta da página de vendas com as inscrições
 *                    fechadas).
 */
function expectativa(c) {
  if (c.sempreAtivo) return 'de-pe';
  if (c.fase && c.fase !== FASE) return c.fase === 'evento' ? 'fechado' : 'tanto-faz';
  return INSCRICOES_ABERTAS ? 'de-pe' : 'tanto-faz';
}

async function checar(c) {
  const espera = expectativa(c);
  let resposta;
  try {
    resposta = await fetch(c.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'Mozilla/5.0 (verificacao-interna-metrik)' },
    });
  } catch (e) {
    if (espera === 'fechado') return { ...c, ok: true, estado: 'fechada (esperado: oferta do evento já virou)' };
    return { ...c, ok: false, motivo: `não respondeu (${e.message})` };
  }

  if (!resposta.ok) {
    if (espera === 'fechado') return { ...c, ok: true, estado: 'fechada (esperado: oferta do evento já virou)' };
    return { ...c, ok: false, motivo: `HTTP ${resposta.status}` };
  }

  const html = await resposta.text();
  const ofertaFechada = SINAIS_DE_OFERTA_MORTA.some((sinal) => sinal.test(html));

  if (ofertaFechada) {
    if (espera === 'fechado') return { ...c, ok: true, estado: 'fechada (esperado: oferta do evento já virou)' };
    if (espera === 'tanto-faz') return { ...c, ok: true, estado: 'fechada (esperado neste momento)' };
    return { ...c, ok: false, motivo: 'a página abre, mas diz que a oferta está indisponível' };
  }

  if (espera === 'fechado') {
    return {
      ...c,
      ok: false,
      motivo: 'oferta do EVENTO ainda aberta depois da virada: quem tiver o link antigo paga o valor antigo. Desative na plataforma.',
    };
  }

  if (!c.esperado) return { ...c, ok: true, estado: c.descricaoEsperada };

  // O valor é procurado no HTML bruto e também no texto sem as tags: se a
  // Hotmart passar a quebrar "12x de R$ 197,00" em <span>s diferentes, o preço
  // continua certo na tela e o script não pode dar falso alarme.
  const texto = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');

  if (!c.esperado.test(html) && !c.esperado.test(texto)) {
    return { ...c, ok: false, motivo: `não encontrei ${c.descricaoEsperada} na página` };
  }

  let nota = '';
  if (espera === 'tanto-faz') {
    nota = c.fase && c.fase !== FASE ? ' (aberta antes da virada; tudo bem)' : ' (aberta com as inscrições fechadas; tudo bem)';
  }
  return { ...c, ok: true, estado: c.descricaoEsperada + nota };
}

const resultados = await Promise.all(CHECKOUTS.map(checar));

console.log(`Chaves: INSCRICOES_ABERTAS=${INSCRICOES_ABERTAS}, FASE=${FASE}`);

let paginaAtual = '';
for (const r of resultados) {
  if (r.pagina !== paginaAtual) {
    paginaAtual = r.pagina;
    console.log(`\n${paginaAtual}`);
  }
  const marca = !r.ok ? 'FALHA' : /^fechada/.test(r.estado) ? '....' : 'OK  ';
  console.log(`  ${marca}  ${r.forma.padEnd(24)} ${r.ok ? r.estado : r.motivo}`);
}

const falhas = resultados.filter((r) => !r.ok);
const fechados = resultados.filter((r) => r.ok && /^fechada/.test(r.estado));
const dePe = resultados.length - falhas.length - fechados.length;

console.log(
  `\n${dePe} de pé` +
    (fechados.length ? `, ${fechados.length} fechado(s) como esperado` : '') +
    (falhas.length ? `, ${falhas.length} com problema` : '') +
    '.'
);

if (!INSCRICOES_ABERTAS) {
  console.log('Com INSCRICOES_ABERTAS = false, os checkouts da página de vendas podem estar fechados sem ser erro.');
}

if (falhas.length) {
  console.log('\nO que resolver:');
  for (const f of falhas) {
    console.log(`  - ${f.pagina} · ${f.forma}: ${f.motivo}`);
    console.log(`    ${f.url}`);
  }
  process.exit(1);
}
