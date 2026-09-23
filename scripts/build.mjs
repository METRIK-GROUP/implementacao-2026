#!/usr/bin/env node
/**
 * Gera todas as variantes do site a partir de vendas.html.
 *
 * vendas.html é a única fonte. Nenhuma variante é editada à mão: quem edita à
 * mão esquece, e em 2026 isso já custou três meses de defasagem na página de
 * alunos. Para mudar qualquer variante, mude o vendas.html ou o script dela.
 *
 * Uso:  node scripts/build.mjs
 *
 * Roda sozinho no GitHub Actions a cada push que toca vendas.html ou scripts/.
 */

import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SCRIPTS = dirname(fileURLToPath(import.meta.url));

const VARIANTES = [
  { nome: 'lista-de-espera', arquivo: 'build-lista-de-espera.mjs' },
  { nome: 'upgrade', arquivo: 'build-upgrade.mjs' },
];

let falhou = false;

for (const { nome, arquivo } of VARIANTES) {
  console.log(`\n=== ${nome} ===`);
  const r = spawnSync(process.execPath, [join(SCRIPTS, arquivo)], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\n!! build de "${nome}" falhou (código ${r.status}).`);
    falhou = true;
  }
}

if (falhou) {
  console.error(
    '\nUma variante não foi gerada. Normalmente isso significa que o vendas.html mudou\n' +
      'e uma âncora do script não existe mais. Ajuste o script da variante — não edite\n' +
      'o HTML gerado à mão, ou a defasagem volta.'
  );
  process.exit(1);
}

console.log('\nTodas as variantes foram geradas a partir de vendas.html.');
