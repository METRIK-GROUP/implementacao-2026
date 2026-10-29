#!/usr/bin/env node
/**
 * Encerra as matrículas da Implementação Ed.8 (até sex 30/10/2026 às 23h59).
 *
 * O que faz:
 *   1. index.html (a raiz do site) vira a página que leva para /lista-de-espera/,
 *      sem checkout. Mesmo modelo usado em 24/08/2026.
 *   2. vendas.html perde os dois blocos do encerramento (ENCERRAMENTO e
 *      ULTIMAS HORAS). Ele continua sendo a página de vendas, pronta para a
 *      próxima turma; só deixa de carregar um prazo que já passou.
 *
 * Quem roda: .github/workflows/encerrar-matriculas.yml, à 0h de sábado 31/10.
 * Depois dele, rode `node scripts/build.mjs` para regenerar as variantes.
 *
 * Uso:  node scripts/encerrar-matriculas.mjs            (só depois do prazo)
 *       node scripts/encerrar-matriculas.mjs --forcar   (ignora a hora; testes)
 *
 * Rodar de novo não estraga nada: se já estiver encerrado, só confirma.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { FIM_UTC, semEncerramento, paginaRedirecionamento } from './lib/encerramento.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VENDAS = join(ROOT, 'vendas.html');
const INDEX = join(ROOT, 'index.html');

const forcar = process.argv.includes('--forcar');
if (!forcar && Date.now() < FIM_UTC) {
  console.error(
    `Ainda não é hora: as matrículas vão até ${new Date(FIM_UTC - 1000).toISOString()} (30/10 23h59 em Brasília).\n` +
      'Nada foi alterado. Para testar antes da hora, use --forcar numa cópia do repositório.'
  );
  process.exit(1);
}

/** Grava com CRLF, como todos os HTML do repositório (.gitattributes). */
function gravarHtml(caminho, html) {
  writeFileSync(caminho, html.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'), 'utf8');
}

const vendas = readFileSync(VENDAS, 'utf8').replace(/\r\n/g, '\n');
const r = semEncerramento(vendas);
if (r.encerramento !== r.ultimasHoras) {
  console.error('vendas.html tem só um dos dois blocos do encerramento. Confira à mão antes de seguir.');
  process.exit(1);
}

if (r.encerramento) {
  gravarHtml(VENDAS, r.html);
  console.log('vendas.html: blocos ENCERRAMENTO e ULTIMAS HORAS removidos.');
} else {
  console.log('vendas.html: já estava sem os blocos do encerramento.');
}

gravarHtml(INDEX, paginaRedirecionamento());
console.log('index.html: a raiz agora leva para /lista-de-espera/.');
