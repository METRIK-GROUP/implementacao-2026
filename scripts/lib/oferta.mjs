/**
 * As duas ofertas da Implementação Ed.8 e a hora da virada entre elas.
 *
 * Decisão do Rodrigo em 14/10/2026, ajustada em 18/10/2026: o valor do evento
 * (12x de R$ 390 ou R$ 3.997 no PIX, R$ 1.000 a menos que o cheio) vale até
 * domingo 18/10 às 23h59 (Brasília). À 0h de segunda 19/10 entra o valor cheio:
 * 12x de R$ 490 (total R$ 5.880) ou R$ 4.997 no PIX. (Antes a virada era às 19h.)
 *
 * Este arquivo é o ÚNICO lugar que conhece os dois conjuntos de valores e links.
 * Quem lê daqui:
 *   - vendas.html, pelos atributos data-cheio / data-href-cheio e pelo script
 *     entre os marcadores MARCA_INICIO e MARCA_FIM (o teste confere que estão
 *     iguais a este arquivo);
 *   - scripts/virar-preco-cheio.mjs, que grava o valor cheio no HTML na virada;
 *   - scripts/build-upgrade.mjs, que precisa achar o bloco de preço antes E
 *     depois da virada;
 *   - scripts/checar-checkouts.mjs, que confere os seis checkouts.
 *
 * Valores conferidos nos checkouts em 14/10/2026: Asaas novo mostra R$ 4.997,00;
 * Hotmart nova mostra 12x de R$ 490,00 (1x de R$ 5.880,00). A TMB só mostra o
 * valor depois do CPF, então o dela não foi conferido por script.
 */

/** Hora da virada, como está escrita no vendas.html (o teste compara o texto). */
export const VIRADA_EXPR = 'Date.UTC(2026, 9, 19, 3, 0, 0)';
export const VIRADA_UTC = Date.UTC(2026, 9, 19, 3, 0, 0); // 19/10 00:00 BRT = 03:00 UTC
export const VIRADA_LEGIVEL = 'segunda 19/10/2026, 0h00 (Brasília); o desconto vale até domingo 18/10 às 23h59';

/** Bloco da barra do topo com o prazo do desconto. O robô da virada apaga. */
export const MARCA_DESCONTO_INICIO = '<!-- DESCONTO EVENTO -->';
export const MARCA_DESCONTO_FIM = '<!-- /DESCONTO EVENTO -->';

export const OFERTA_EVENTO = Object.freeze({
  nome: 'evento',
  parcela: '390',
  pix: 'R$ 3.997',
  schema: '3997.00',
  asaas: 'https://www.asaas.com/c/2x3ccx7lhp4q23up',
  hotmart: 'https://pay.hotmart.com/U104887798W?bid=1774198329832',
  tmb: 'https://pay.tmb.com.br/RodrigoRosar/M4E188885X5',
});

export const OFERTA_CHEIA = Object.freeze({
  nome: 'cheia',
  parcela: '490',
  pix: 'R$ 4.997',
  schema: '4997.00',
  asaas: 'https://www.asaas.com/000/c/aqx4edxpcwhpble7',
  hotmart: 'https://pay.hotmart.com/U104887798W?off=i6fqs2yb&checkoutMode=6&bid=1792004316445',
  tmb: 'https://pay.tmb.com.br/RodrigoRosar/AE83033554V',
});

/** Marcadores do script de virada dentro do vendas.html. */
export const MARCA_INICIO = '<!-- VIRADA PRECO CHEIO -->';
export const MARCA_FIM = '<!-- /VIRADA PRECO CHEIO -->';

/** Comentário que fica no lugar do script depois da virada gravada. */
export const COMENTARIO_POS_VIRADA =
  '<!-- Preço cheio desde 19/10/2026 à 0h, fim do desconto de domingo (gravado por scripts/virar-preco-cheio.mjs). -->';

/**
 * Em que fase o HTML está:
 *   'evento' — valor do evento no HTML, com a virada programada em
 *              data-cheio / data-href-cheio (antes do robô gravar);
 *   'cheia'  — valor cheio já gravado no HTML.
 * Falha se não reconhecer nenhum dos dois: é sinal de que o bloco de preço
 * mudou de forma e os scripts precisam ser revistos.
 */
export function faseDoHtml(html) {
  const temVirada = html.includes('data-href-cheio=');
  // Na fase do evento o <p> carrega data-cheio, então o `>` não vem logo depois da classe.
  const temPixEvento = new RegExp(`pr-pix-val fm"[^>]*>${escapar(OFERTA_EVENTO.pix)}<`).test(html);
  const temPixCheio = new RegExp(`pr-pix-val fm"[^>]*>${escapar(OFERTA_CHEIA.pix)}<`).test(html);
  if (temVirada && temPixEvento && !temPixCheio) return 'evento';
  if (!temVirada && temPixCheio && !temPixEvento) return 'cheia';
  if (!temVirada && temPixEvento && !temPixCheio) {
    throw new Error(
      'vendas.html está no valor do evento mas SEM a virada programada (data-href-cheio). ' +
        'Ou a virada foi apagada por engano, ou o bloco de preço mudou de forma.'
    );
  }
  throw new Error('Não reconheci a fase do bloco de preço do vendas.html (nem evento, nem cheia).');
}

/** A oferta que o HTML mostra sem JavaScript, na fase em que está. */
export function ofertaAtual(html) {
  return faseDoHtml(html) === 'cheia' ? OFERTA_CHEIA : OFERTA_EVENTO;
}

/**
 * Para as variantes (upgrade): tira a virada programada do HTML, deixando só o
 * valor da fase atual. Recebe o contexto de `createTransform` e devolve a oferta
 * que ficou no HTML, para o script montar as âncoras com os valores certos.
 */
export function semVirada(t) {
  const oferta = ofertaAtual(t.html);
  if (t.html.includes(MARCA_INICIO)) {
    t.cutBlock('virada de preço removida (só a página de vendas vira)', MARCA_INICIO, `${MARCA_FIM}\n`, '');
  }
  const antes = t.html;
  t.html = t.html.replace(/ data-cheio="[^"]*"/g, '').replace(/ data-href-cheio="[^"]*"/g, '');
  if (antes !== t.html) t.applied.push('atributos data-cheio / data-href-cheio removidos');
  return oferta;
}

function escapar(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
