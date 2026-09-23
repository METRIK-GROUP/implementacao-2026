/**
 * Helpers compartilhados pelos scripts que geram as variantes do site
 * a partir de vendas.html.
 *
 * Princípio: toda transformação é obrigatória. Se uma âncora não existir mais
 * (porque o vendas.html mudou), o build falha alto em vez de gerar uma página
 * silenciosamente incompleta. Página de venda errada custa mais que build quebrado.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

/** Cria um contexto de transformação para um arquivo-fonte. */
export function createTransform(sourcePath) {
  const raw = readFileSync(sourcePath, 'utf8');
  const crlf = /\r\n/.test(raw.slice(0, 4096));
  const applied = [];

  return {
    html: raw.replace(/\r\n/g, '\n'),
    crlf,
    applied,

    /** Substituição exata e obrigatória. Falha se `from` não existir ou for ambíguo. */
    replaceOnce(label, from, to) {
      const first = this.html.indexOf(from);
      if (first === -1) {
        throw new Error(`[${label}] âncora não encontrada em ${sourcePath}:\n${from.slice(0, 160)}`);
      }
      if (this.html.indexOf(from, first + 1) !== -1) {
        throw new Error(`[${label}] âncora ambígua (aparece mais de uma vez) em ${sourcePath}`);
      }
      applied.push(label);
      this.html = this.html.slice(0, first) + to + this.html.slice(first + from.length);
      return this;
    },

    /** Remove o trecho entre `start` (inclusive) e o primeiro `end` depois dele (inclusive). */
    cutBlock(label, start, end, replacement = '') {
      const a = this.html.indexOf(start);
      if (a === -1) throw new Error(`[${label}] início do bloco não encontrado: ${start.slice(0, 120)}`);
      const b = this.html.indexOf(end, a + start.length);
      if (b === -1) throw new Error(`[${label}] fim do bloco não encontrado: ${end.slice(0, 120)}`);
      applied.push(label);
      this.html = this.html.slice(0, a) + replacement + this.html.slice(b + end.length);
      return this;
    },

    /** Substituição global obrigatória: falha se não houver nenhuma ocorrência. */
    replaceAll(label, pattern, to) {
      const n = (this.html.match(pattern) || []).length;
      if (n === 0) throw new Error(`[${label}] nenhuma ocorrência de ${pattern}`);
      applied.push(`${label} (${n}x)`);
      this.html = this.html.replace(pattern, to);
      return this;
    },

    /** Substituição opcional: não falha se a âncora não existir. Use com parcimônia. */
    replaceIfPresent(label, from, to) {
      if (this.html.includes(from)) {
        applied.push(`${label} (opcional, aplicada)`);
        this.html = this.html.split(from).join(to);
      } else {
        applied.push(`${label} (opcional, ausente)`);
      }
      return this;
    },

    /** Verifica que nenhum padrão proibido sobreviveu ao build. */
    guard(rules) {
      for (const [label, re] of rules) {
        if (re.test(this.html)) {
          throw new Error(`Guarda falhou: ${label} ainda presente no HTML gerado (${re})`);
        }
      }
      return this;
    },

    /**
     * Como `guard`, mas olha só o que o visitante lê na tela: descarta
     * comentários HTML, blocos <script> e blocos <style> antes de testar.
     *
     * Use para regras sobre conteúdo (preço, oferta, chamada, urgência). O
     * vendas.html guarda seções comentadas para reuso e tem textos alternativos
     * dentro do JavaScript que só aparecem sob parâmetros de URL — nada disso
     * renderiza sozinho. Para regras sobre o que o navegador EXECUTA ou o
     * buscador LÊ (links, meta tags, caminhos de imagem), use `guard`.
     */
    guardVisible(rules) {
      const visivel = this.html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
      for (const [label, re] of rules) {
        if (re.test(visivel)) {
          throw new Error(`Guarda falhou: ${label} ainda presente no HTML visível gerado (${re})`);
        }
      }
      return this;
    },

    /** Verifica que padrões obrigatórios estão presentes no resultado. */
    require(rules) {
      for (const [label, re] of rules) {
        if (!re.test(this.html)) {
          throw new Error(`Verificação falhou: ${label} não encontrado no HTML gerado (${re})`);
        }
      }
      return this;
    },

    /**
     * Grava o resultado preservando a convenção de quebra de linha do repositório.
     * Cria a pasta de destino se ela não existir, para o build funcionar num
     * clone limpo sem depender de a pasta já estar versionada.
     */
    write(targetPath) {
      mkdirSync(dirname(targetPath), { recursive: true });
      writeFileSync(targetPath, crlf ? this.html.replace(/\n/g, '\r\n') : this.html, 'utf8');
      return this;
    },
  };
}

/**
 * Caminhos relativos -> absolutos, para a página funcionar dentro de um
 * subdiretório.
 *
 * O lookbehind de `type=` não é detalhe: sem ele, `type="video/mp4"` de um
 * <source> vira `type="/video/mp4"`, que é um tipo de mídia inválido e faz o
 * navegador descartar a fonte do vídeo. Esse bug chegou a ficar publicado na
 * lista de espera até 23/09/2026.
 */
export function absolutizeAssets(t) {
  t.replaceAll('paths img', /(?<!type=)(["'])img\//g, '$1/img/');
  t.replaceAll('paths video', /(?<!type=)(["'])video\//g, '$1/video/');
  return t;
}
