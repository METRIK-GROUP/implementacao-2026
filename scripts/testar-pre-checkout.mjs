#!/usr/bin/env node
/**
 * Testes da janela de pré-checkout (scripts/partials/pre-checkout.js): qual
 * checkout é qual forma de pagamento e como o link final é montado.
 *
 * Uso:  node --test scripts/testar-pre-checkout.mjs
 *
 * Carrega a peça num contexto isolado, sem navegador (sem `document` ela não
 * tenta montar a janela), e testa só as funções puras. A janela em si é
 * conferida no navegador (ver scripts/README.md).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const codigo = readFileSync(join(ROOT, 'scripts', 'partials', 'pre-checkout.js'), 'utf8');
const contexto = vm.createContext({ URL, URLSearchParams });
vm.runInContext(`${codigo};this.PreCheckout=PreCheckout;`, contexto);
const { meioDoLink, linkFinal, utmDa } = contexto.PreCheckout;

// A janela pede só nome e WhatsApp (09/10/2026).
const DADOS = { nome: 'Ana Paula', whatsapp: '11987654321', pais: 'BR' };

test('cada checkout vira a sua forma de pagamento', () => {
  assert.equal(meioDoLink('https://www.asaas.com/c/2x3ccx7lhp4q23up'), 'pix');
  assert.equal(meioDoLink('https://pay.hotmart.com/U104887798W?bid=1'), 'cartao');
  assert.equal(meioDoLink('https://pay.tmb.com.br/RodrigoRosar/M4E188885X5'), 'boleto');
});

test('link que não é de checkout não abre a janela', () => {
  assert.equal(meioDoLink('https://api.whatsapp.com/send?phone=5547992360031'), null);
  assert.equal(meioDoLink('http://pay.hotmart.com/U1'), null);
  assert.equal(meioDoLink('#preco'), null);
  assert.equal(meioDoLink('https://pay.hotmart.com.evil.com/U1'), null);
});

test('Hotmart: nome, DDD e número no link, sem perder a oferta (e sem e-mail)', () => {
  const u = new URL(linkFinal('https://pay.hotmart.com/U104887798W?off=abc', DADOS, ''));
  assert.equal(u.searchParams.get('off'), 'abc');
  assert.equal(u.searchParams.get('name'), 'Ana Paula');
  assert.equal(u.searchParams.has('email'), false);
  assert.equal(u.searchParams.get('phoneac'), '11');
  assert.equal(u.searchParams.get('phonenumber'), '987654321');
});

test('Hotmart com WhatsApp de fora do Brasil: sem telefone no link', () => {
  const u = new URL(linkFinal('https://pay.hotmart.com/U1', { ...DADOS, whatsapp: '+351 912 345 678', pais: 'PT' }, ''));
  assert.equal(u.searchParams.get('phoneac'), null);
  assert.equal(u.searchParams.get('name'), 'Ana Paula');
});

test('Asaas e TMB não recebem dados pessoais no link', () => {
  for (const href of ['https://www.asaas.com/c/abc', 'https://pay.tmb.com.br/R/M1']) {
    const u = new URL(linkFinal(href, DADOS, ''));
    assert.equal(u.searchParams.get('email'), null);
    assert.equal(u.searchParams.get('name'), null);
  }
});

test('rastreio da página segue para o checkout, sem sobrescrever o que o link já tem', () => {
  const u = new URL(linkFinal('https://pay.hotmart.com/U1?src=botao', DADOS, '?utm_source=ig&src=pagina&sck=x&fbclid=nao'));
  assert.equal(u.searchParams.get('utm_source'), 'ig');
  assert.equal(u.searchParams.get('src'), 'botao');
  assert.equal(u.searchParams.get('sck'), 'x');
  assert.equal(u.searchParams.get('fbclid'), null);
});

test('só utm_* vai para o painel', () => {
  assert.deepEqual({ ...utmDa('?utm_source=ig&utm_campaign=ed8&src=x') }, { utm_source: 'ig', utm_campaign: 'ed8' });
});
