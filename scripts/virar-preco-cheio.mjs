#!/usr/bin/env node
/**
 * Grava o valor cheio no vendas.html: o que o script da página faz no navegador
 * a partir de segunda 19/10 à 0h (fim do desconto de domingo), este script faz
 * no arquivo, de uma vez.
 *
 * Por que os dois existem:
 *   - o script da página vira na hora certa, no relógio de quem está olhando,
 *     mesmo que o robô do GitHub atrase (em agosto atrasou 56 min);
 *   - este script deixa o repositório verdadeiro depois da virada: sem ele, o
 *     HTML continuaria dizendo R$ 3.997 para quem não roda JavaScript, para o
 *     Google (schema.org) e para a próxima pessoa que editar o vendas.html.
 *
 * O que muda no vendas.html (tudo obrigatório, falha se uma âncora sumir):
 *   1. parcela 390 -> 490 e PIX R$ 3.997 -> R$ 4.997, tirando o data-cheio;
 *   2. os três checkouts passam a apontar para a oferta cheia, tirando o
 *      data-href-cheio;
 *   3. o preço do schema.org (3997.00 -> 4997.00);
 *   4. o script da virada (e o aviso do prazo do desconto) sai, e no lugar fica
 *      um comentário dizendo quando virou;
 *   5. sai o bloco da barra do topo com o relógio do desconto.
 * E no scripts/checar-checkouts.mjs: FASE 'evento' -> 'cheia'.
 *
 * Roda de novo sem estrago: se o HTML já está no valor cheio, não faz nada.
 *
 * Uso:  node scripts/virar-preco-cheio.mjs
 * Quem roda de verdade é .github/workflows/virar-preco-cheio.yml, no horário.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTransform } from './lib/html-transform.mjs';
import {
  OFERTA_EVENTO,
  OFERTA_CHEIA,
  MARCA_INICIO,
  MARCA_FIM,
  MARCA_DESCONTO_INICIO,
  MARCA_DESCONTO_FIM,
  COMENTARIO_POS_VIRADA,
  faseDoHtml,
} from './lib/oferta.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENDAS = join(ROOT, 'vendas.html');
const CHECAR = join(ROOT, 'scripts', 'checar-checkouts.mjs');

const t = createTransform(VENDAS);

if (faseDoHtml(t.html) === 'cheia') {
  console.log('vendas.html já está no valor cheio. Nada a fazer.');
  process.exit(0);
}

const E = OFERTA_EVENTO;
const C = OFERTA_CHEIA;

t.replaceOnce(
  'preço: parcela do cartão',
  `<span class="pr-val" data-cheio="${C.parcela}">${E.parcela}</span>`,
  `<span class="pr-val">${C.parcela}</span>`
);

t.replaceOnce(
  'preço: valor no PIX',
  `<p class="pr-pix-val fm" data-cheio="${C.pix}">${E.pix}</p>`,
  `<p class="pr-pix-val fm">${C.pix}</p>`
);

t.replaceOnce('checkout: PIX (Asaas)', `<a href="${E.asaas}" data-href-cheio="${C.asaas}"`, `<a href="${C.asaas}"`);
t.replaceOnce('checkout: cartão (Hotmart)', `<a href="${E.hotmart}" data-href-cheio="${C.hotmart}"`, `<a href="${C.hotmart}"`);
t.replaceOnce('checkout: boleto (TMB)', `<a href="${E.tmb}" data-href-cheio="${C.tmb}"`, `<a href="${C.tmb}"`);

t.replaceOnce('schema.org: preço da oferta', `"price": "${E.schema}",`, `"price": "${C.schema}",`);

// Seção 20 (inscrições + bônus) está comentada no vendas.html, mas guarda o
// preço em texto. Se um dia for reativada, precisa já estar com o valor cheio.
t.replaceIfPresent(
  'seção comentada de inscrições: preço',
  `12x de R$ ${E.parcela} sem juros · ou ${E.pix} no PIX`,
  `12x de R$ ${C.parcela} sem juros · ou ${C.pix} no PIX`
);

t.cutBlock('script da virada removido', MARCA_INICIO, `${MARCA_FIM}\n`, `${COMENTARIO_POS_VIRADA}\n`);
t.cutBlock('barra do prazo do desconto removida', MARCA_DESCONTO_INICIO, `${MARCA_DESCONTO_FIM}\n`, '');

t.guard([
  ['virada ainda programada (data-cheio)', /data-cheio=/],
  ['virada ainda programada (data-href-cheio)', /data-href-cheio=/],
  ['script da virada', /VIRADA PRECO CHEIO/],
  ['checkout do evento (Asaas)', new RegExp(escapar(E.asaas))],
  ['checkout do evento (Hotmart)', new RegExp(escapar(E.hotmart))],
  ['checkout do evento (TMB)', new RegExp(escapar(E.tmb))],
  ['preço do evento no schema', /"price": "3997\.00"/],
]);

// Só o bloco de compra: "R$ 3.997" também aparece na ancoragem de valor (é o
// preço do PDP sozinho, não a oferta) e continua lá de propósito.
t.guardVisible([
  ['parcela do evento no bloco de compra', /pr-val">390</],
  ['PIX do evento no bloco de compra', /pr-pix-val fm">R\$ 3\.997</],
]);

t.require([
  ['parcela cheia', /pr-val">490</],
  ['PIX cheio', /pr-pix-val fm">R\$ 4\.997</],
  ['checkout cheio (Asaas)', new RegExp(escapar(C.asaas))],
  ['checkout cheio (Hotmart)', new RegExp(escapar(C.hotmart))],
  ['checkout cheio (TMB)', new RegExp(escapar(C.tmb))],
  ['preço cheio no schema', /"price": "4997\.00"/],
  ['comentário da virada', new RegExp(escapar(COMENTARIO_POS_VIRADA))],
  // Nada mais do bloco de compra pode ter mudado de forma.
  ['botões de compra', /id="pr-actions"/],
  ['desconto do PIX continua verdadeiro (4.997 / 5.880 = 15%)', /Valor com desconto de 15% no PIX/],
]);

t.write(VENDAS);

// O verificador de checkouts passa a cobrar a oferta cheia (e a avisar se a do
// evento continuar aberta).
const checar = readFileSync(CHECAR, 'utf8');
const checarNovo = checar.replace(/^const FASE = 'evento';/m, "const FASE = 'cheia';");
if (checarNovo === checar && !/^const FASE = 'cheia';/m.test(checar)) {
  throw new Error("scripts/checar-checkouts.mjs: não achei a linha `const FASE = 'evento';` para virar.");
}
writeFileSync(CHECAR, checarNovo, 'utf8');

console.log(`vendas.html gravado no valor cheio (${t.applied.length} transformações):`);
for (const item of t.applied) console.log(`  - ${item}`);
console.log("scripts/checar-checkouts.mjs: FASE = 'cheia'.");

function escapar(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
