#!/usr/bin/env node
/**
 * Responde a pergunta "se eu editar isso no vendas.html, a página de upgrade
 * acompanha sozinha ou vai quebrar?".
 *
 * Aplica uma série de edições típicas de reabertura de turma numa cópia da
 * fonte, roda o build depois de cada uma e mostra o resultado. Não altera nada
 * em definitivo: o vendas.html é restaurado no fim.
 *
 * Uso:  node scripts/simular-edicoes.mjs
 *
 * Regra que sai daqui: mexer em CONTEÚDO (texto, imagem, seção, depoimento, FAQ,
 * data da barra) se propaga sozinho. Mexer no BLOCO DE COMPRA (preço, parcela,
 * link de checkout, selo, contagem regressiva) faz o build parar e avisar, porque
 * é exatamente ali que as duas páginas precisam ser diferentes.
 */

import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));

const FONTE = 'vendas.html';
copyFileSync(FONTE, '_vendas.bak');

const cenarios = [
  ['Trocar a headline principal',            s => s.replace('Do caos à ordem no seu escritório', 'Do caos à ordem no seu ateliê')],
  ['Trocar texto de qualquer seção',         s => s.replace('O que levava horas, leva minutos.', 'O que levava dias, leva minutos.')],
  ['Trocar a data da barra de urgência',     s => s.replace('A turma começa segunda, 24/08', 'A turma começa segunda, 27/10')],
  ['Trocar uma imagem',                      s => s.replace('img/hero-video-thumb.webp', 'img/hero-novo-2026.webp')],
  ['Acrescentar seção nova antes do preço',  s => s.replace('<!-- 17. PREÇO', '<section id="novo-bonus"><p>Bônus da turma</p></section>\n<!-- 17. PREÇO')],
  ['Acrescentar seção nova depois do preço', s => s.replace('<!-- 18. ROI', '<section id="novo-extra"><p>Extra</p></section>\n<!-- 18. ROI')],
  ['Acrescentar um depoimento',              s => s.replace('</footer>', '<section id="dep-novo"><p>Novo depoimento</p></section>\n</footer>')],
  ['Trocar uma pergunta do FAQ',             s => s.replace('Perguntas frequentes', 'Dúvidas frequentes')],
  ['MUDAR O PREÇO (3.997 -> 4.497)',         s => s.replace('<p class="pr-pix-val fm">R$ 3.997</p>', '<p class="pr-pix-val fm">R$ 4.497</p>')],
  ['MUDAR A PARCELA (390 -> 440)',           s => s.replace('<span class="pr-val">390</span>', '<span class="pr-val">440</span>')],
  ['TROCAR link de checkout',                s => s.replace('https://pay.hotmart.com/U104887798W?bid=1774198329832', 'https://pay.hotmart.com/U104887798W?bid=9999999999999')],
  ['REESCREVER o bloco de preço',            s => s.replace('<div class="pr-ribbon">OFERTA EXCLUSIVA DESTA TURMA</div>', '<div class="pr-selo">NOVA TURMA</div>')],
  ['Reativar contagem regressiva',           s => s.replace('<div class="pr-actions" id="pr-actions">', '<div id="pr-countdown">Faltam 3 dias</div>\n    <div class="pr-actions" id="pr-actions">')],
];

const L = 42;
let passam = 0, param = 0;
console.log('O QUE VOCÊ EDITA NO VENDAS.HTML'.padEnd(L) + '  A PÁGINA DE UPGRADE');
console.log('-'.repeat(L) + '  ' + '-'.repeat(34));

for (const [nome, editar] of cenarios) {
  const original = readFileSync('_vendas.bak', 'utf8');
  const editado = editar(original);
  if (editado === original) { console.log(nome.padEnd(L) + '  (simulação não aplicou)'); continue; }
  writeFileSync(FONTE, editado);

  const r = spawnSync(process.execPath, [join('scripts', 'build-upgrade.mjs')], { encoding: 'utf8' });
  if (r.status === 0) { passam++; console.log(nome.padEnd(L) + '  se atualiza sozinha'); }
  else {
    param++;
    const m = (r.stderr.match(/Error: \[([^\]]+)\]/) || r.stderr.match(/Error: (Guarda falhou: [^(]+)/) || [])[1] || '?';
    console.log(nome.padEnd(L) + '  PARA E AVISA: ' + m.trim());
  }
}

copyFileSync('_vendas.bak', FONTE);
spawnSync(process.execPath, [join('scripts', 'build-upgrade.mjs')]);
console.log(`\n${passam} se atualizam sozinhas, ${param} param e avisam.`);
