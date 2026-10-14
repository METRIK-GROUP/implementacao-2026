/**
 * Testes da virada de preço (dom 18/10 às 19h): vendas.html, o script que grava
 * o valor cheio e os builds das variantes precisam concordar entre si, antes e
 * depois da virada.
 *
 * Uso:  node --test scripts/testar-virada.mjs
 *
 * Os builds rodam numa cópia do repositório em pasta temporária: nada aqui
 * escreve nos arquivos de verdade.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, cpSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  OFERTA_EVENTO as E,
  OFERTA_CHEIA as C,
  VIRADA_EXPR,
  VIRADA_UTC,
  MARCA_INICIO,
  MARCA_FIM,
  COMENTARIO_POS_VIRADA,
  faseDoHtml,
} from './lib/oferta.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendas = readFileSync(join(ROOT, 'vendas.html'), 'utf8').replace(/\r\n/g, '\n');

const BLOCO_PRECO = (() => {
  const a = vendas.indexOf('<section class="sec bg-o" id="preco"');
  const b = vendas.indexOf('</section>', a);
  assert.ok(a > 0 && b > a, 'seção #preco não encontrada no vendas.html');
  return vendas.slice(a, b);
})();

const SCRIPT_VIRADA = (() => {
  const a = vendas.indexOf(MARCA_INICIO);
  const b = vendas.indexOf(MARCA_FIM, a);
  assert.ok(a > 0 && b > a, 'script da virada não encontrado no vendas.html');
  const trecho = vendas.slice(a, b);
  return trecho.slice(trecho.indexOf('<script>') + '<script>'.length, trecho.indexOf('</script>'));
})();

// ---------------------------------------------------------------------------
// 1. vendas.html está com a virada programada e consistente com oferta.mjs
// ---------------------------------------------------------------------------
test('vendas.html está na fase do evento, com a virada programada', () => {
  assert.equal(faseDoHtml(vendas), 'evento');
});

test('a hora da virada no vendas.html é a mesma de oferta.mjs (18/10 19h BRT)', () => {
  assert.ok(SCRIPT_VIRADA.includes(`var VIRADA = ${VIRADA_EXPR};`), 'VIRADA diferente no script da página');
  assert.equal(new Date(VIRADA_UTC).toISOString(), '2026-10-18T22:00:00.000Z');
});

test('o bloco de compra mostra o valor do evento e guarda o valor cheio', () => {
  assert.ok(BLOCO_PRECO.includes(`<span class="pr-val" data-cheio="${C.parcela}">${E.parcela}</span>`));
  assert.ok(BLOCO_PRECO.includes(`<p class="pr-pix-val fm" data-cheio="${C.pix}">${E.pix}</p>`));
  assert.equal((BLOCO_PRECO.match(/data-cheio=/g) || []).length, 2, 'só parcela e PIX trocam de texto');
});

test('os três botões apontam para o evento e guardam o link da oferta cheia', () => {
  for (const meio of ['asaas', 'hotmart', 'tmb']) {
    assert.ok(BLOCO_PRECO.includes(`<a href="${E[meio]}" data-href-cheio="${C[meio]}"`), `botão ${meio}`);
  }
  assert.equal((BLOCO_PRECO.match(/data-href-cheio=/g) || []).length, 3);
});

test('os links da oferta cheia são checkouts válidos (https, hosts conhecidos)', () => {
  const hosts = { asaas: 'www.asaas.com', hotmart: 'pay.hotmart.com', tmb: 'pay.tmb.com.br' };
  for (const [meio, host] of Object.entries(hosts)) {
    const u = new URL(C[meio]);
    assert.equal(u.protocol, 'https:');
    assert.equal(u.hostname, host, `host do ${meio}`);
    assert.notEqual(C[meio], E[meio], `${meio}: link cheio igual ao do evento`);
  }
  // O painel (launch-dashboard) só guarda `off` e `checkoutMode` do link da
  // Hotmart: a oferta precisa estar no `off`, não só no `bid`.
  assert.equal(new URL(C.hotmart).searchParams.get('off'), 'i6fqs2yb');
});

test('o robô "Publicar pagina de vendas" continua reconhecendo o vendas.html', () => {
  assert.ok(vendas.includes('Date.UTC(2026, 9, 18, 18, 0, 0)'));
  assert.ok(vendas.includes('id="pr-countdown"'));
  assert.ok(vendas.includes('id="pr-actions" hidden'));
});

test('o desconto anunciado no PIX continua verdadeiro com o valor cheio', () => {
  // 12 x 490 = 5.880; 4.997 / 5.880 = 0,85 → 15% de desconto.
  const total = 12 * Number(C.parcela);
  const pix = Number(C.pix.replace(/\D/g, ''));
  const desconto = 1 - pix / total;
  assert.ok(desconto >= 0.149 && desconto <= 0.16, `desconto de ${(desconto * 100).toFixed(1)}%`);
  assert.ok(BLOCO_PRECO.includes('Valor com desconto de 15% no PIX'));
});

// ---------------------------------------------------------------------------
// 2. O script da página, rodando contra um DOM de mentira
// ---------------------------------------------------------------------------
function paginaFalsa(agoraMs, busca = '') {
  const relogio = { agora: agoraMs };
  const el = (texto, attrs) => ({
    textContent: texto,
    attrs: { ...attrs },
    getAttribute(k) { return this.attrs[k] ?? null; },
    setAttribute(k, v) { this.attrs[k] = v; },
    // Como no navegador: `.href` devolve o link absoluto que está no atributo.
    get href() { return this.attrs.href; },
  });
  const textos = [el(E.parcela, { 'data-cheio': C.parcela }), el(E.pix, { 'data-cheio': C.pix })];
  const links = ['asaas', 'hotmart', 'tmb'].map((m) => el('', { href: E[m], 'data-href-cheio': C[m] }));
  const timeouts = [];
  const intervalos = [];
  const ctx = {
    Date: { UTC: Date.UTC, now: () => relogio.agora },
    URL,
    Math,
    document: {
      querySelectorAll(sel) {
        if (sel.includes('data-href-cheio')) return links;
        if (sel.includes('data-cheio')) return textos;
        return [];
      },
    },
    location: { search: busca },
    setTimeout(fn, ms) { timeouts.push({ fn, ms }); return timeouts.length; },
    setInterval(fn, ms) { intervalos.push({ fn, ms }); return intervalos.length; },
  };
  vm.runInNewContext(SCRIPT_VIRADA, ctx);
  return { textos, links, timeouts, intervalos, relogio };
}

test('antes da hora: mantém o valor do evento e agenda a troca', () => {
  const umaHoraAntes = VIRADA_UTC - 3600 * 1000;
  const p = paginaFalsa(umaHoraAntes);
  assert.deepEqual(p.textos.map((t) => t.textContent), [E.parcela, E.pix]);
  assert.deepEqual(p.links.map((l) => l.attrs.href), [E.asaas, E.hotmart, E.tmb]);
  assert.equal(p.timeouts.length, 1);
  assert.equal(p.timeouts[0].ms, 3600 * 1000 + 500);
  assert.equal(p.intervalos.length, 1);
  // O timeout dispara → vira.
  p.timeouts[0].fn();
  assert.deepEqual(p.textos.map((t) => t.textContent), [C.parcela, C.pix]);
  assert.deepEqual(p.links.map((l) => l.attrs.href), [C.asaas, C.hotmart, C.tmb]);
});

test('na hora (e depois): mostra o valor cheio na primeira pintura', () => {
  for (const agora of [VIRADA_UTC, VIRADA_UTC + 1, VIRADA_UTC + 30 * 24 * 3600 * 1000]) {
    const p = paginaFalsa(agora);
    assert.deepEqual(p.textos.map((t) => t.textContent), [C.parcela, C.pix], `agora=${agora}`);
    assert.deepEqual(p.links.map((l) => l.attrs.href), [C.asaas, C.hotmart, C.tmb]);
    assert.equal(p.timeouts.length, 0, 'nada a agendar depois da virada');
  }
});

test('um segundo antes: ainda é o valor do evento', () => {
  const p = paginaFalsa(VIRADA_UTC - 1000);
  assert.deepEqual(p.textos.map((t) => t.textContent), [E.parcela, E.pix]);
  assert.equal(p.timeouts[0].ms, 1500);
});

test('?preco=cheio mostra o valor cheio antes da hora', () => {
  const p = paginaFalsa(VIRADA_UTC - 24 * 3600 * 1000, '?utm_source=x&preco=cheio');
  assert.deepEqual(p.textos.map((t) => t.textContent), [C.parcela, C.pix]);
  assert.deepEqual(p.links.map((l) => l.attrs.href), [C.asaas, C.hotmart, C.tmb]);
});

test('rastreio já aplicado ao link (utm, sck, xcod) sobrevive à virada', () => {
  // O script de rastreio da Hotmart decora os links na carga da página. Se a
  // virada acontecer com a página aberta, o link novo precisa manter isso.
  const p = paginaFalsa(VIRADA_UTC - 1000);
  p.links[0].attrs.href = E.asaas + '?utm_source=ig&sck=abc&xcod=123';
  p.links[1].attrs.href = E.hotmart + '&utm_source=ig&sck=abc';
  p.timeouts[0].fn();
  const asaas = new URL(p.links[0].attrs.href);
  assert.equal(asaas.origin + asaas.pathname, C.asaas);
  assert.equal(asaas.searchParams.get('utm_source'), 'ig');
  assert.equal(asaas.searchParams.get('sck'), 'abc');
  assert.equal(asaas.searchParams.get('xcod'), '123');
  const hot = new URL(p.links[1].attrs.href);
  assert.equal(hot.searchParams.get('off'), 'i6fqs2yb', 'a oferta cheia manda');
  assert.equal(hot.searchParams.get('bid'), '1792004316445', 'o bid do evento não volta');
  assert.equal(hot.searchParams.get('utm_source'), 'ig');
  assert.equal(p.links[2].attrs.href, C.tmb, 'sem rastreio, link limpo');
});

test('o intervalo de reserva também vira, e só uma vez', () => {
  const p = paginaFalsa(VIRADA_UTC - 10 * 1000);
  assert.equal(p.intervalos.length, 1);
  p.intervalos[0].fn(); // ainda antes da hora: nada
  assert.deepEqual(p.textos.map((t) => t.textContent), [E.parcela, E.pix]);
  p.relogio.agora = VIRADA_UTC + 1000;
  p.intervalos[0].fn(); // passou da hora: vira
  assert.deepEqual(p.textos.map((t) => t.textContent), [C.parcela, C.pix]);
  assert.deepEqual(p.links.map((l) => l.attrs.href), [C.asaas, C.hotmart, C.tmb]);
  // O timeout chega depois e não desfaz nem repete nada.
  p.textos[0].textContent = 'marcado';
  p.timeouts[0].fn();
  assert.equal(p.textos[0].textContent, 'marcado');
});

// ---------------------------------------------------------------------------
// 3. O script que grava a virada, e os builds antes e depois
// ---------------------------------------------------------------------------
function copiaDoRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'implementacao-virada-'));
  cpSync(join(ROOT, 'vendas.html'), join(dir, 'vendas.html'));
  cpSync(join(ROOT, 'scripts'), join(dir, 'scripts'), { recursive: true });
  cpSync(join(ROOT, 'assets'), join(dir, 'assets'), { recursive: true });
  // build-lista-de-espera grava direto na pasta; no repositório ela já existe.
  mkdirSync(join(dir, 'lista-de-espera'));
  mkdirSync(join(dir, 'upgrade'));
  return dir;
}

function rodar(dir, script) {
  const r = spawnSync(process.execPath, [join(dir, 'scripts', script)], { encoding: 'utf8' });
  return { codigo: r.status, saida: `${r.stdout}\n${r.stderr}` };
}

test('build das variantes passa ANTES da virada, e o upgrade não leva a virada', () => {
  const dir = copiaDoRepo();
  try {
    const r = rodar(dir, 'build.mjs');
    assert.equal(r.codigo, 0, r.saida);
    const upgrade = readFileSync(join(dir, 'upgrade', 'index.html'), 'utf8');
    assert.ok(!/data-cheio=|data-href-cheio=|VIRADA PRECO CHEIO/.test(upgrade));
    assert.ok(upgrade.includes('pr-pix-val fm">R$ 1.997<'));
    assert.ok(!upgrade.includes(E.asaas) && !upgrade.includes(C.asaas));
    assert.ok(!upgrade.includes(E.hotmart) && !upgrade.includes(C.hotmart));
    const lista = readFileSync(join(dir, 'lista-de-espera', 'index.html'), 'utf8');
    assert.ok(!/data-cheio=|data-href-cheio=|asaas\.com|pay\.hotmart|pay\.tmb/.test(lista));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('virar-preco-cheio.mjs grava o valor cheio, é idempotente, e o build passa DEPOIS', () => {
  const dir = copiaDoRepo();
  try {
    const v1 = rodar(dir, 'virar-preco-cheio.mjs');
    assert.equal(v1.codigo, 0, v1.saida);

    const depois = readFileSync(join(dir, 'vendas.html'), 'utf8').replace(/\r\n/g, '\n');
    assert.equal(faseDoHtml(depois), 'cheia');
    assert.ok(depois.includes(`<span class="pr-val">${C.parcela}</span>`));
    assert.ok(depois.includes(`<p class="pr-pix-val fm">${C.pix}</p>`));
    for (const meio of ['asaas', 'hotmart', 'tmb']) {
      assert.ok(depois.includes(`<a href="${C[meio]}" target="_blank"`), `link cheio ${meio}`);
      assert.ok(!depois.includes(E[meio]), `link do evento ${meio} ainda presente`);
    }
    assert.ok(depois.includes(`"price": "${C.schema}",`));
    assert.ok(!depois.includes('"price": "3997.00"'));
    assert.ok(!/data-cheio=|data-href-cheio=|VIRADA PRECO CHEIO/.test(depois));
    assert.ok(depois.includes(COMENTARIO_POS_VIRADA));
    assert.ok(depois.includes('id="pr-actions" hidden'), 'contador da abertura intacto');
    // Preserva CRLF do repositório.
    const bruto = readFileSync(join(dir, 'vendas.html'), 'utf8');
    assert.equal(/\r\n/.test(bruto), /\r\n/.test(readFileSync(join(ROOT, 'vendas.html'), 'utf8')));

    const checar = readFileSync(join(dir, 'scripts', 'checar-checkouts.mjs'), 'utf8');
    assert.ok(/^const FASE = 'cheia';/m.test(checar));

    // Segunda rodada: nada muda.
    const v2 = rodar(dir, 'virar-preco-cheio.mjs');
    assert.equal(v2.codigo, 0, v2.saida);
    assert.ok(v2.saida.includes('já está no valor cheio'));
    assert.equal(readFileSync(join(dir, 'vendas.html'), 'utf8'), bruto);

    // Os builds continuam passando com o vendas.html no valor cheio.
    const b = rodar(dir, 'build.mjs');
    assert.equal(b.codigo, 0, b.saida);
    const upgrade = readFileSync(join(dir, 'upgrade', 'index.html'), 'utf8');
    assert.ok(upgrade.includes('pr-pix-val fm">R$ 1.997<'));
    assert.ok(upgrade.includes('pr-val">197<'));
    // "R$ 4.997" pode sobrar na seção 20, que está comentada; o que vale é o visível.
    const visivel = upgrade.replace(/<!--[\s\S]*?-->/g, '');
    assert.ok(!visivel.includes('4.997') && !upgrade.includes(C.asaas) && !upgrade.includes(C.hotmart));
    assert.ok(existsSync(join(dir, 'lista-de-espera', 'index.html')));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
