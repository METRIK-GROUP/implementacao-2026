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
 * IMPORTANTE, antes de sair corrigindo: com as inscrições fechadas, as ofertas
 * do site principal ficam desativadas de propósito. Isso é o esperado, não um
 * defeito. Por isso o arquivo tem a chave INSCRICOES_ABERTAS logo abaixo: com
 * ela em `false`, esses checkouts aparecem como "fechada (esperado)". Vire para
 * `true` na reabertura e o script passa a cobrar que os três estejam de pé —
 * vale como checklist do dia da abertura.
 *
 * Sai com código 1 só quando algo está realmente errado.
 */

// Vire para `true` quando as inscrições reabrirem.
const INSCRICOES_ABERTAS = false;

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
    esperado: /1\.997|197,00/,
    descricaoEsperada: 'R$ 1.997 ou 12x de R$ 197',
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
  {
    pagina: 'vendas.html (só com inscrições abertas)',
    sempreAtivo: false,
    forma: 'PIX (Asaas)',
    url: 'https://www.asaas.com/c/2x3ccx7lhp4q23up',
    esperado: /3\.997/,
    descricaoEsperada: 'R$ 3.997',
  },
  {
    pagina: 'vendas.html (só com inscrições abertas)',
    sempreAtivo: false,
    forma: 'Cartão (Hotmart)',
    url: 'https://pay.hotmart.com/U104887798W?bid=1774198329832',
    esperado: /3\.997|390,00/,
    descricaoEsperada: 'R$ 3.997 ou 12x de R$ 390',
  },
  {
    pagina: 'vendas.html (só com inscrições abertas)',
    sempreAtivo: false,
    forma: 'Boleto parcelado (TMB)',
    url: 'https://pay.tmb.com.br/RodrigoRosar/M4E188885X5',
    esperado: /3\.997/,
    descricaoEsperada: 'R$ 3.997',
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

async function checar(c) {
  let resposta;
  try {
    resposta = await fetch(c.url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'Mozilla/5.0 (verificacao-interna-metrik)' },
    });
  } catch (e) {
    return { ...c, ok: false, motivo: `não respondeu (${e.message})` };
  }

  if (!resposta.ok) {
    return { ...c, ok: false, motivo: `HTTP ${resposta.status}` };
  }

  const html = await resposta.text();

  const ofertaFechada = SINAIS_DE_OFERTA_MORTA.some((sinal) => sinal.test(html));

  if (ofertaFechada) {
    // Oferta do site principal desativada com as inscrições fechadas é o esperado.
    if (!c.sempreAtivo && !INSCRICOES_ABERTAS) {
      return { ...c, ok: true, esperadoFechado: true };
    }
    return { ...c, ok: false, motivo: 'a página abre, mas diz que a oferta está indisponível' };
  }

  if (!c.esperado.test(html)) {
    return { ...c, ok: false, motivo: `não encontrei ${c.descricaoEsperada} na página` };
  }

  return { ...c, ok: true };
}

const resultados = await Promise.all(CHECKOUTS.map(checar));

let paginaAtual = '';
for (const r of resultados) {
  if (r.pagina !== paginaAtual) {
    paginaAtual = r.pagina;
    console.log(`\n${paginaAtual}`);
  }
  const marca = r.esperadoFechado ? '....' : r.ok ? 'OK  ' : 'FALHA';
  const detalhe = r.esperadoFechado
    ? 'oferta fechada (esperado, inscrições fechadas)'
    : r.ok
      ? r.descricaoEsperada
      : r.motivo;
  console.log(`  ${marca}  ${r.forma.padEnd(24)} ${detalhe}`);
}

const falhas = resultados.filter((r) => !r.ok);
const fechados = resultados.filter((r) => r.esperadoFechado);
const dePe = resultados.length - falhas.length - fechados.length;

console.log(
  `\n${dePe} de pé` +
    (fechados.length ? `, ${fechados.length} fechado(s) por inscrição encerrada` : '') +
    (falhas.length ? `, ${falhas.length} com problema` : '') +
    '.'
);

if (fechados.length && !INSCRICOES_ABERTAS) {
  console.log('Na reabertura das inscrições, vire INSCRICOES_ABERTAS para true no topo deste arquivo.');
}

if (falhas.length) {
  console.log('\nO que resolver:');
  for (const f of falhas) {
    console.log(`  - ${f.pagina} · ${f.forma}: ${f.motivo}`);
    console.log(`    ${f.url}`);
  }
  process.exit(1);
}
