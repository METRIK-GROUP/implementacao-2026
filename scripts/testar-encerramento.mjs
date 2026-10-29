/**
 * Testes do encerramento das matrículas (Últimas horas na sexta 30/10; à 0h de
 * sábado 31/10 a raiz vai para a lista de espera).
 *
 * Uso:  node --test scripts/testar-encerramento.mjs
 *
 * Os testes sabem em que fase o repositório está. Enquanto o vendas.html tem os
 * dois blocos do encerramento, eles conferem os blocos, rodam os scripts da
 * página contra um DOM de mentira e simulam o robô numa cópia. Depois que o
 * robô roda, conferem que a raiz ficou como página de redirecionamento.
 *
 * Os builds e o robô rodam numa cópia do repositório em pasta temporária: nada
 * aqui escreve nos arquivos de verdade.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import {
  ULTIMAS_HORAS_EXPR,
  ULTIMAS_HORAS_UTC,
  FIM_EXPR,
  FIM_UTC,
  MARCA_ENCERRAMENTO_INICIO,
  MARCA_ENCERRAMENTO_FIM,
  MARCA_ULTIMAS_INICIO,
  MARCA_ULTIMAS_FIM,
  DESTINO,
  faseDoHtml,
  paginaRedirecionamento,
} from './lib/encerramento.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (rel, raiz = ROOT) => readFileSync(join(raiz, rel), 'utf8').replace(/\r\n/g, '\n');

const vendas = ler('vendas.html');
const FASE = faseDoHtml(vendas);
const HORA = 3600 * 1000;

/** Conteúdo do <script> que fica entre as duas marcas. */
function scriptDoBloco(html, inicio, fim) {
  const a = html.indexOf(inicio);
  const b = html.indexOf(fim, a);
  assert.ok(a > 0 && b > a, `bloco ${inicio} não encontrado`);
  const trecho = html.slice(a, b);
  const s = trecho.indexOf('<script>');
  return trecho.slice(s + '<script>'.length, trecho.indexOf('</script>', s));
}

/** Copia o repositório (sem .git) para uma pasta temporária. */
function copiaDoRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'encerramento-'));
  cpSync(ROOT, dir, { recursive: true, filter: (src) => basename(src) !== '.git' && basename(src) !== 'node_modules' });
  return dir;
}

function rodar(dir, ...args) {
  return spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8' });
}

// ===========================================================================
// Fase 1: matrículas abertas, encerramento programado
// ===========================================================================
if (FASE === 'aberto') {
  const SCRIPT_FIM = scriptDoBloco(vendas, MARCA_ENCERRAMENTO_INICIO, MARCA_ENCERRAMENTO_FIM);
  const SCRIPT_ULTIMAS = scriptDoBloco(vendas, MARCA_ULTIMAS_INICIO, MARCA_ULTIMAS_FIM);

  // -------------------------------------------------------------------------
  // 1. Datas e posição dos blocos
  // -------------------------------------------------------------------------
  test('as datas são 30/10 0h e 31/10 0h em Brasília', () => {
    assert.equal(new Date(ULTIMAS_HORAS_UTC).toISOString(), '2026-10-30T03:00:00.000Z');
    assert.equal(new Date(FIM_UTC).toISOString(), '2026-10-31T03:00:00.000Z');
  });

  test('os dois blocos da página usam as datas de encerramento.mjs', () => {
    assert.ok(SCRIPT_FIM.includes(`var FIM = ${FIM_EXPR};`), 'FIM do redirecionamento');
    assert.ok(SCRIPT_ULTIMAS.includes(`var INICIO = ${ULTIMAS_HORAS_EXPR};`), 'INICIO da barra');
    assert.ok(SCRIPT_ULTIMAS.includes(`var FIM = ${FIM_EXPR};`), 'FIM da barra');
  });

  test('o redirecionamento fica no <head>, antes do Google Tag Manager', () => {
    const head = vendas.slice(0, vendas.indexOf('</head>'));
    const a = head.indexOf(MARCA_ENCERRAMENTO_INICIO);
    assert.ok(a > 0, 'bloco fora do <head>');
    assert.ok(a < head.indexOf('<!-- Google Tag Manager -->'), 'precisa vir antes do GTM');
  });

  test('a barra de Últimas horas fica dentro do bloco da barra fixa (os builds cortam o bloco inteiro)', () => {
    const a = vendas.indexOf('<!-- STICKY URGENCY BAR -->');
    const b = vendas.indexOf('<!-- /STICKY URGENCY BAR -->');
    const u = vendas.indexOf(MARCA_ULTIMAS_INICIO);
    assert.ok(a < u && u < b);
  });

  test('o index.html publicado é cópia do vendas.html', () => {
    assert.equal(ler('index.html'), vendas, 'rode: cp vendas.html index.html');
  });

  // -------------------------------------------------------------------------
  // 2. Redirecionamento, rodando contra um navegador de mentira
  // -------------------------------------------------------------------------
  function abrirPagina(agora, { busca = '', hash = '', janelaAberta = false } = {}) {
    const e = { agora, destino: null, timers: [], janelaAberta };
    vm.runInNewContext(SCRIPT_FIM, {
      Date: { UTC: Date.UTC, now: () => e.agora },
      location: { search: busca, hash, replace(u) { e.destino = u; } },
      document: { querySelector: (sel) => (sel === 'dialog.pck[open]' && e.janelaAberta ? {} : null) },
      setTimeout(fn, ms) { e.timers.push({ fn, ms }); },
    });
    e.disparar = () => { const t = e.timers.shift(); e.agora += t.ms; t.fn(); };
    return e;
  }

  test('antes do prazo a página fica e agenda a saída para 0h de sábado', () => {
    const e = abrirPagina(FIM_UTC - 2 * HORA);
    assert.equal(e.destino, null);
    assert.equal(e.timers.length, 1);
    assert.ok(Math.abs(e.timers[0].ms - 2 * HORA) <= 1000, `agendou para ${e.timers[0].ms} ms`);
  });

  test('às 23h59:59 de sexta ainda não redireciona', () => {
    assert.equal(abrirPagina(FIM_UTC - 1000).destino, null);
  });

  test('a partir de 0h de sábado vai direto para a lista, levando UTMs e âncora', () => {
    const e = abrirPagina(FIM_UTC, { busca: '?utm_source=ig&utm_campaign=ed8', hash: '#preco' });
    assert.equal(e.destino, `${DESTINO}?utm_source=ig&utm_campaign=ed8#preco`);
    assert.equal(e.timers.length, 0);
  });

  test('página aberta na virada redireciona sozinha à 0h', () => {
    const e = abrirPagina(FIM_UTC - 10 * 60 * 1000, { busca: '?utm_source=wa' });
    e.disparar();
    assert.ok(e.agora >= FIM_UTC);
    assert.equal(e.destino, `${DESTINO}?utm_source=wa`);
  });

  test('com a janela de pré-checkout aberta, espera ela fechar antes de sair', () => {
    const e = abrirPagina(FIM_UTC - 60 * 1000, { janelaAberta: true });
    e.disparar();
    assert.equal(e.destino, null, 'não pode tirar a pessoa do meio do preenchimento');
    assert.equal(e.timers.length, 1);
    assert.equal(e.timers[0].ms, 1000);
    e.janelaAberta = false;
    e.disparar();
    assert.equal(e.destino, DESTINO);
  });

  // -------------------------------------------------------------------------
  // 3. Barra de Últimas horas, rodando contra um DOM de mentira
  // -------------------------------------------------------------------------
  const MSG_ORIGINAL = '<span class="sticky-bar-lg">Matrículas encerram sexta, 30/10, às 23h59</span>';
  const CTA_ORIGINAL = '<span class="sticky-bar-lg">Garantir minha vaga</span>';

  function classes() {
    const s = new Set();
    return { add: (c) => s.add(c), remove: (c) => s.delete(c), contains: (c) => s.has(c) };
  }

  function abrirBarra(agora, busca = '') {
    const e = { agora, intervalos: [], parado: false };
    const relogio = { textContent: '' };
    const msg = {
      innerHTML: MSG_ORIGINAL,
      querySelector(sel) { return sel === '.sticky-bar-relogio' && this.innerHTML.includes('sticky-bar-relogio') ? relogio : null; },
    };
    const cta = { innerHTML: CTA_ORIGINAL };
    const bar = {
      hidden: false,
      classList: classes(),
      querySelector: (sel) => ({ '.sticky-bar-msg': msg, '.sticky-bar-cta': cta })[sel] || null,
    };
    const body = { classList: classes() };
    vm.runInNewContext(SCRIPT_ULTIMAS, {
      Date: { UTC: Date.UTC, now: () => e.agora },
      location: { search: busca },
      document: { getElementById: (id) => (id === 'stickyBar' ? bar : null), body },
      setInterval(fn) { e.intervalos.push(fn); return 1; },
      clearInterval() { e.parado = true; },
    });
    e.ir = (ms) => { e.agora = ms; e.intervalos.forEach((fn) => fn()); };
    return { e, bar, msg, cta, body, relogio };
  }

  test('antes de sexta a barra continua com o texto da semana', () => {
    const { bar, msg } = abrirBarra(ULTIMAS_HORAS_UTC - HORA);
    assert.equal(msg.innerHTML, MSG_ORIGINAL);
    assert.equal(bar.classList.contains('urgente'), false);
  });

  test('sexta à 0h a barra vira Últimas horas, em vermelho, com relógio até 23h59', () => {
    const { bar, msg, body, relogio, cta } = abrirBarra(ULTIMAS_HORAS_UTC);
    assert.match(msg.innerHTML, /Últimas horas/);
    assert.match(msg.innerHTML, /encerram hoje, às 23h59/);
    assert.equal(bar.classList.contains('urgente'), true);
    assert.equal(body.classList.contains('bar-urgente'), true);
    assert.equal(body.classList.contains('bar-on'), true);
    assert.equal(bar.hidden, false);
    assert.equal(relogio.textContent, '24:00:00');
    assert.equal(cta.innerHTML, CTA_ORIGINAL, 'o botão continua levando para o bloco de compra');
  });

  test('o relógio conta até 23h59:59 e para à 0h', () => {
    const { e, relogio } = abrirBarra(ULTIMAS_HORAS_UTC + 3 * HORA);
    assert.equal(relogio.textContent, '21:00:00');
    e.ir(FIM_UTC - 5000);
    assert.equal(relogio.textContent, '00:00:05');
    e.ir(FIM_UTC);
    assert.equal(e.parado, true);
  });

  test('página aberta na quinta vira sozinha à 0h de sexta', () => {
    const { e, msg } = abrirBarra(ULTIMAS_HORAS_UTC - 30 * 1000);
    assert.equal(msg.innerHTML, MSG_ORIGINAL);
    e.ir(ULTIMAS_HORAS_UTC + 1000);
    assert.match(msg.innerHTML, /Últimas horas/);
  });

  test('?ultimas=on mostra a barra antes da hora, para conferir', () => {
    const { msg, bar } = abrirBarra(ULTIMAS_HORAS_UTC - 20 * HORA, '?ultimas=on');
    assert.match(msg.innerHTML, /Últimas horas/);
    assert.equal(bar.classList.contains('urgente'), true);
  });

  // -------------------------------------------------------------------------
  // 4. Variantes e robô, numa cópia do repositório
  // -------------------------------------------------------------------------
  test('lista de espera e upgrade saem sem os blocos do encerramento', () => {
    const dir = copiaDoRepo();
    try {
      const r = rodar(dir, 'scripts/build.mjs');
      assert.equal(r.status, 0, r.stdout + r.stderr);
      for (const pagina of ['lista-de-espera/index.html', 'upgrade/index.html']) {
        const html = ler(pagina, dir);
        assert.ok(!html.includes(MARCA_ENCERRAMENTO_INICIO), `${pagina}: redirecionamento (na lista seria loop)`);
        assert.ok(!html.includes(MARCA_ULTIMAS_INICIO), `${pagina}: barra de Últimas horas`);
        assert.ok(!html.includes("location.replace('/lista-de-espera/'"), `${pagina}: redirecionamento`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  if (Date.now() < FIM_UTC) {
    test('o robô se recusa a encerrar antes da hora', () => {
      const dir = copiaDoRepo();
      try {
        const r = rodar(dir, 'scripts/encerrar-matriculas.mjs');
        assert.notEqual(r.status, 0);
        assert.equal(ler('index.html', dir), vendas, 'não pode mexer em nada');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  test('o robô encerra: raiz vira redirecionamento, blocos saem e os builds continuam passando', () => {
    const dir = copiaDoRepo();
    try {
      const r = rodar(dir, 'scripts/encerrar-matriculas.mjs', '--forcar');
      assert.equal(r.status, 0, r.stdout + r.stderr);
      assert.equal(ler('index.html', dir), paginaRedirecionamento());
      const v = ler('vendas.html', dir);
      assert.equal(faseDoHtml(v), 'encerrado');
      assert.ok(v.includes('id="pr-actions"'), 'o vendas.html continua sendo a página de vendas, para a próxima turma');
      assert.ok(v.includes('<!-- STICKY URGENCY BAR -->'), 'só os dois blocos saem');

      const b = rodar(dir, 'scripts/build.mjs');
      assert.equal(b.status, 0, b.stdout + b.stderr);

      const r2 = rodar(dir, 'scripts/encerrar-matriculas.mjs', '--forcar');
      assert.equal(r2.status, 0, 'rodar de novo não pode quebrar');
      assert.equal(ler('index.html', dir), paginaRedirecionamento());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

// ===========================================================================
// Fase 2: matrículas encerradas (depois do robô)
// ===========================================================================
if (FASE === 'encerrado') {
  test('a raiz é a página de redirecionamento para a lista de espera', () => {
    assert.equal(ler('index.html'), paginaRedirecionamento());
  });
}

// Vale nas duas fases.
test('a página de redirecionamento não tem checkout e leva busca e âncora junto', () => {
  const html = paginaRedirecionamento();
  assert.ok(!/asaas\.com|pay\.hotmart\.com|pay\.tmb\.com\.br/.test(html));
  assert.ok(html.includes(`location.replace('${DESTINO}' + location.search + location.hash)`));
  assert.ok(html.includes('noindex'));
  assert.ok(html.includes('GTM-TMJSB79'));
});

test('lista de espera e upgrade publicados não têm os blocos do encerramento', () => {
  for (const pagina of ['lista-de-espera/index.html', 'upgrade/index.html']) {
    const html = ler(pagina);
    assert.ok(!html.includes(MARCA_ENCERRAMENTO_INICIO) && !html.includes(MARCA_ULTIMAS_INICIO), pagina);
  }
});
