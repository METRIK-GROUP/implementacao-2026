#!/usr/bin/env node
/**
 * Abre cada link de compra das páginas publicadas e diz se ele está de pé e com
 * o valor certo.
 *
 * Existe porque em 23/09/2026 o botão "Boleto parcelado" levava a uma tela de
 * "Oferta Indisponível" — nas duas páginas — e ninguém tinha percebido. Um teste
 * que só checa se o endereço responde não pega isso: a página responde com
 * sucesso e mostra o erro dentro dela.
 *
 * Uso:  node scripts/checar-checkouts.mjs
 *
 * Sai com código 1 se algum checkout estiver fora do ar ou com valor diferente
 * do esperado, para poder ser usado em automação depois, se você quiser.
 */

const CHECKOUTS = [
  {
    pagina: '/upgrade/',
    forma: 'PIX (Asaas)',
    url: 'https://www.asaas.com/c/rf09mpzqnty6wtyq',
    esperado: /1\.997/,
    descricaoEsperada: 'R$ 1.997',
  },
  {
    pagina: '/upgrade/',
    forma: 'Cartão (Hotmart)',
    url: 'https://pay.hotmart.com/U104887798W?off=atem2nx9&checkoutMode=6&bid=1779451195139',
    esperado: /1\.997|197,00/,
    descricaoEsperada: 'R$ 1.997 ou 12x de R$ 197',
  },
  // Reative esta linha quando a oferta voltar na TMB.
  // {
  //   pagina: '/upgrade/',
  //   forma: 'Boleto parcelado (TMB)',
  //   url: 'https://pay.tmb.com.br/RodrigoRosar/B9B1915303N',
  //   esperado: /1\.997/,
  //   descricaoEsperada: 'R$ 1.997',
  // },
  {
    pagina: 'vendas.html (volta ao ar na reabertura)',
    forma: 'PIX (Asaas)',
    url: 'https://www.asaas.com/c/2x3ccx7lhp4q23up',
    esperado: /3\.997/,
    descricaoEsperada: 'R$ 3.997',
  },
  {
    pagina: 'vendas.html (volta ao ar na reabertura)',
    forma: 'Cartão (Hotmart)',
    url: 'https://pay.hotmart.com/U104887798W?bid=1774198329832',
    esperado: /3\.997|390,00/,
    descricaoEsperada: 'R$ 3.997 ou 12x de R$ 390',
  },
  {
    pagina: 'vendas.html (volta ao ar na reabertura)',
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

  for (const sinal of SINAIS_DE_OFERTA_MORTA) {
    if (sinal.test(html)) {
      return { ...c, ok: false, motivo: 'a página abre, mas diz que a oferta está indisponível' };
    }
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
  const marca = r.ok ? 'OK  ' : 'FALHA';
  const detalhe = r.ok ? r.descricaoEsperada : r.motivo;
  console.log(`  ${marca}  ${r.forma.padEnd(24)} ${detalhe}`);
}

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length} de ${resultados.length} checkouts de pé.`);

if (falhas.length) {
  console.log('\nO que resolver:');
  for (const f of falhas) {
    console.log(`  - ${f.pagina} · ${f.forma}: ${f.motivo}`);
    console.log(`    ${f.url}`);
  }
  process.exit(1);
}
