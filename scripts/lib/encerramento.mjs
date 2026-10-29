/**
 * Encerramento das matrículas da Implementação Ed.8 (decisão do Rodrigo, 29/10/2026).
 *
 * Sexta 30/10, o dia todo: a barra do topo vira "Últimas horas", em vermelho,
 * com relógio até 23h59. À 0h de sábado 31/10 o site sai do ar como página de
 * vendas: a raiz passa a levar para a lista de espera, sem checkout.
 *
 * A troca na tela é feita pelos dois blocos marcados abaixo, dentro do
 * vendas.html (e da cópia dele no index.html). O robô
 * .github/workflows/encerrar-matriculas.yml grava o encerramento de vez
 * (scripts/encerrar-matriculas.mjs) e apaga os dois blocos.
 *
 * Este arquivo é a fonte das datas: o teste confere que a página usa as mesmas.
 */

// 30/10 00:00 em Brasília = 03:00 UTC. A partir daqui a barra mostra "Últimas horas".
export const ULTIMAS_HORAS_EXPR = 'Date.UTC(2026, 9, 30, 3, 0, 0)';
export const ULTIMAS_HORAS_UTC = Date.UTC(2026, 9, 30, 3, 0, 0);

// 31/10 00:00 em Brasília = 03:00 UTC. Matrículas até 30/10 às 23h59.
export const FIM_EXPR = 'Date.UTC(2026, 9, 31, 3, 0, 0)';
export const FIM_UTC = Date.UTC(2026, 9, 31, 3, 0, 0);

// Bloco do <head> que manda para a lista de espera depois do prazo.
export const MARCA_ENCERRAMENTO_INICIO = '<!-- ENCERRAMENTO -->';
export const MARCA_ENCERRAMENTO_FIM = '<!-- /ENCERRAMENTO -->';

// Bloco da barra do topo que mostra "Últimas horas" com o relógio.
export const MARCA_ULTIMAS_INICIO = '<!-- ULTIMAS HORAS -->';
export const MARCA_ULTIMAS_FIM = '<!-- /ULTIMAS HORAS -->';

export const DESTINO = '/lista-de-espera/';

/** Remove o trecho entre as marcas (inclusive) e a quebra de linha que vem logo depois. */
function cortar(html, inicio, fim) {
  const a = html.indexOf(inicio);
  if (a === -1) return { html, cortou: false };
  const b = html.indexOf(fim, a + inicio.length);
  if (b === -1) throw new Error(`fim do bloco não encontrado: ${fim}`);
  let depois = b + fim.length;
  if (html[depois] === '\n') depois += 1;
  if (html.indexOf(inicio, depois) !== -1) throw new Error(`bloco ${inicio} aparece mais de uma vez`);
  return { html: html.slice(0, a) + html.slice(depois), cortou: true };
}

/**
 * Tira os dois blocos do encerramento. Idempotente: se eles já saíram (depois
 * do robô), devolve o HTML como veio. Espera HTML com LF.
 */
export function semEncerramento(html) {
  const r1 = cortar(html, MARCA_ENCERRAMENTO_INICIO, MARCA_ENCERRAMENTO_FIM);
  const r2 = cortar(r1.html, MARCA_ULTIMAS_INICIO, MARCA_ULTIMAS_FIM);
  return { html: r2.html, encerramento: r1.cortou, ultimasHoras: r2.cortou };
}

/** 'aberto' enquanto o vendas.html tem o encerramento programado; 'encerrado' depois do robô. */
export function faseDoHtml(html) {
  const enc = html.includes(MARCA_ENCERRAMENTO_INICIO);
  const ult = html.includes(MARCA_ULTIMAS_INICIO);
  if (enc && ult) return 'aberto';
  if (!enc && !ult) return 'encerrado';
  throw new Error('vendas.html com só um dos dois blocos do encerramento: estado inconsistente');
}

/**
 * Página que o robô grava no index.html depois do prazo. Mesmo modelo usado
 * em 24/08/2026 (raiz -> lista de espera), agora levando junto a busca (UTMs)
 * e a âncora, para a campanha não perder a origem do clique.
 */
export function paginaRedirecionamento() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TMJSB79');</script>
<!-- End Google Tag Manager -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, follow">
<title>Implementação Projeto de Primeira — Lista de espera</title>
<link rel="canonical" href="https://implementacao.rodrigorosar.com.br${DESTINO}">
<!-- Matrículas da Ed.8 encerradas em 30/10/2026 às 23h59. A página de vendas volta pela raiz quando a próxima turma abrir. -->
<script>location.replace('${DESTINO}' + location.search + location.hash);</script>
<noscript><meta http-equiv="refresh" content="0; url=${DESTINO}"></noscript>
<style>
  html,body{margin:0;height:100%;background:#1E1E1E;color:#EDEDED;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
  .box{display:flex;flex-direction:column;align-items:center;justify-content:center;
    height:100%;text-align:center;padding:24px;gap:14px}
  a{color:#fff;font-weight:700}
</style>
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-TMJSB79"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<main class="box">
  <p>As matrículas desta turma encerraram. Levando você para a lista de espera…</p>
  <p><a href="${DESTINO}">Clique aqui se não for redirecionado automaticamente.</a></p>
</main>
</body>
</html>
`;
}
