#!/usr/bin/env node
/**
 * Gera assets/pre-checkout.js: a janela que pede nome, e-mail e WhatsApp antes
 * do pagamento na página de vendas (vendas.html carrega /assets/pre-checkout.js).
 *
 * Junta duas peças de scripts/partials/:
 *   whatsapp-pais.js  o seletor de país do WhatsApp, o MESMO da lista de espera
 *   pre-checkout.js   a janela, o envio ao painel e o link do checkout
 *
 * Uso:  node scripts/build-pre-checkout.mjs
 *
 * Não edite assets/pre-checkout.js à mão: a próxima geração desfaz a edição.
 * Mude a peça em scripts/partials/ e gere de novo (o build.mjs já chama este).
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = join(ROOT, 'assets', 'pre-checkout.js');

function parte(nome) {
  return readFileSync(join(ROOT, 'scripts', 'partials', nome), 'utf8').replace(/\r\n/g, '\n').trim();
}

const whatsapp = parte('whatsapp-pais.js');
const janela = parte('pre-checkout.js');

// Exigências: se uma peça mudar de nome ou perder a função que a outra usa, o
// build para em vez de publicar uma janela que quebra no clique.
const EXIGENCIAS = [
  ['seletor de país definido', whatsapp, /function wlWhatsappPais\(/],
  ['janela usa o seletor de país', janela, /wlWhatsappPais\(/],
  ['endpoint do painel', janela, /https:\/\/dashboard\.rodrigorosar\.com\.br\/api\/public\/pre-checkout/],
  ['janela inicia sozinha no navegador', janela, /PreCheckout\.iniciar\(document\)/],
];
for (const [rotulo, texto, re] of EXIGENCIAS) {
  if (!re.test(texto)) throw new Error(`Verificação falhou: ${rotulo} (${re})`);
}

const saida = `/* GERADO por scripts/build-pre-checkout.mjs a partir de scripts/partials/. Não edite à mão. */
(function(){
${whatsapp}

${janela}
})();
`;

mkdirSync(dirname(TARGET), { recursive: true });
writeFileSync(TARGET, saida, 'utf8');
console.log('assets/pre-checkout.js gerado (seletor de país + janela de pré-checkout).');
