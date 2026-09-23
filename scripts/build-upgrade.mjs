#!/usr/bin/env node
/**
 * Gera upgrade/index.html a partir de vendas.html.
 *
 * A página de upgrade é o MESMO site da Implementação. As diferenças são só
 * estas, por decisão do Rodrigo em 23/09/2026:
 *
 *   1. O preço vira R$ 1.997 (12x de R$ 197) e os três checkouts apontam para
 *      as ofertas de upgrade.
 *   2. Ao clicar em qualquer botão de compra, abre uma janela pedindo o e-mail
 *      de aluno. Só quem tem a Certificação Projeto de Primeira segue para o
 *      pagamento.
 *   3. O resto do conteúdo é idêntico — o aluno vê a mesma página que todo
 *      mundo vê.
 *
 * Mais dois ajustes técnicos, invisíveis para o visitante: caminhos de imagem
 * absolutos (a página vive num subdiretório) e noindex + canonical (não competir
 * com o site principal no Google).
 *
 * Existe como script porque a /alunos/ anterior era mantida à mão e ficou 77
 * commits atrás do vendas.html entre 25/06 e 23/09/2026. Variante mantida à mão
 * desatualiza — sempre.
 *
 * Uso:  node scripts/build-upgrade.mjs
 *
 * Toda transformação é obrigatória: se uma âncora sumir do vendas.html, o build
 * falha em vez de publicar uma página de venda com o preço errado.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createTransform, absolutizeAssets } from './lib/html-transform.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'vendas.html');
const TARGET = join(ROOT, 'upgrade', 'index.html');

const URL_UPGRADE = 'https://implementacao.rodrigorosar.com.br/upgrade/';

const WHATSAPP_SUPORTE =
  'https://api.whatsapp.com/send?phone=5547989163007&text=' +
  encodeURIComponent('Sou aluno do PDP e quero fazer o upgrade para a Implementação, mas meu e-mail não foi reconhecido na página.');

// Checkouts da oferta de upgrade (R$ 1.997). Os três responderam em 23/09/2026,
// e o Asaas confirmou o valor de R$ 1.997 na própria página.
const CHECKOUT_PIX = 'https://www.asaas.com/c/rf09mpzqnty6wtyq';
const CHECKOUT_CARTAO = 'https://pay.hotmart.com/U104887798W?off=atem2nx9&checkoutMode=6&bid=1779451195139';
const CHECKOUT_BOLETO = 'https://pay.tmb.com.br/RodrigoRosar/B9B1915303N';

const ENDPOINT_VERIFICACAO = 'https://kaktarlhwpezebhercll.supabase.co/functions/v1/verificar-aluno';

const t = createTransform(SOURCE);

// ---------------------------------------------------------------------------
// 1. Caminhos absolutos: a página vive em /upgrade/, então img/ e video/
//    relativos quebrariam.
// ---------------------------------------------------------------------------
absolutizeAssets(t);

// ---------------------------------------------------------------------------
// 2. SEO: noindex e canonical próprios
// O conteúdo é o mesmo do site principal. Sem noindex, as duas páginas
// competiriam entre si no Google e a condição de aluno apareceria na busca.
// ---------------------------------------------------------------------------
t.replaceOnce(
  'seo: robots e canonical',
  `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="https://implementacao.rodrigorosar.com.br/">`,
  `<meta name="robots" content="noindex, follow">
<meta name="googlebot" content="noindex, follow">
<link rel="canonical" href="${URL_UPGRADE}">`
);

t.replaceOnce(
  'seo: title',
  `<title>Implementação Projeto de Primeira | METRIK Instituto</title>`,
  `<title>Implementação Projeto de Primeira | Upgrade aluno PDP — METRIK Instituto</title>`
);

t.replaceOnce(
  'open graph: url',
  `<meta property="og:url" content="https://implementacao.rodrigorosar.com.br/">`,
  `<meta property="og:url" content="${URL_UPGRADE}">`
);

// ---------------------------------------------------------------------------
// 3. Schema.org: o preço declarado ao buscador é o desta página
// ---------------------------------------------------------------------------
t.replaceOnce(
  'schema: preço da oferta',
  `        "price": "3997.00",`,
  `        "price": "1997.00",`
);

t.replaceOnce(
  'schema: url da oferta',
  `        "url": "https://implementacao.rodrigorosar.com.br/#preco"`,
  `        "url": "${URL_UPGRADE}#preco"`
);

t.replaceAll('schema: urls do site', /"https:\/\/implementacao\.rodrigorosar\.com\.br\/"/g, `"${URL_UPGRADE}"`);

// ---------------------------------------------------------------------------
// 4. Gatilhos de urgência: fora
//
// O site principal trabalha com prazo ("Matrículas abertas somente esta semana",
// "A turma começa segunda, 24/08", "OFERTA EXCLUSIVA DESTA TURMA"). No upgrade
// isso é falso: o aluno pode fazer a qualquer momento. Urgência inventada para
// quem já comprou de você uma vez cobra caro em confiança.
//
// O JavaScript que alimenta a barra é todo protegido por `if (stickyBar)`, então
// ele desliga sozinho quando o elemento não existe. Não precisa ser removido.
// ---------------------------------------------------------------------------
t.cutBlock(
  'barra de urgência removida',
  '<!-- STICKY URGENCY BAR -->',
  `<script>document.body.classList.add('bar-on');</script>\n`,
  '<!-- Barra de urgência removida na página de upgrade: o aluno pode fazer upgrade a qualquer momento. -->\n'
);

t.replaceOnce(
  'selo: sem referência a turma',
  `    <div class="pr-ribbon">OFERTA EXCLUSIVA DESTA TURMA</div>`,
  `    <div class="pr-ribbon">EXCLUSIVO PARA ALUNO PDP</div>`
);

// ---------------------------------------------------------------------------
// 5. Preço: R$ 3.997 -> R$ 1.997
// 12 x 197 = 2.364, e 15% abaixo disso é 1.997 — a mesma relação que o site
// principal tem entre cartão e PIX, então os textos de desconto continuam
// verdadeiros.
// ---------------------------------------------------------------------------
t.replaceOnce(
  'preço: parcela do cartão',
  `      <span class="pr-tx">12x</span><span class="pr-rs">de R$</span><span class="pr-val">390</span>`,
  `      <span class="pr-tx">12x</span><span class="pr-rs">de R$</span><span class="pr-val">197</span>`
);

t.replaceOnce(
  'preço: valor no PIX',
  `      <p class="pr-pix-val fm">R$ 3.997</p>`,
  `      <p class="pr-pix-val fm">R$ 1.997</p>`
);

// ---------------------------------------------------------------------------
// 5. Checkouts: as três formas de pagamento apontam para a oferta de upgrade.
//    data-upgrade-checkout é o gancho que o JS usa para pedir o e-mail antes.
// ---------------------------------------------------------------------------
t.replaceOnce(
  'checkout: PIX',
  `      <a href="https://www.asaas.com/c/2x3ccx7lhp4q23up" target="_blank" class="pr-btn primary">`,
  `      <a href="${CHECKOUT_PIX}" target="_blank" class="pr-btn primary" data-upgrade-checkout>`
);

t.replaceOnce(
  'checkout: cartão',
  `        <a href="https://pay.hotmart.com/U104887798W?bid=1774198329832" target="_blank" class="pr-btn ghost">`,
  `        <a href="${CHECKOUT_CARTAO}" target="_blank" class="pr-btn ghost" data-upgrade-checkout>`
);

// O boleto parcelado sai da página.
//
// A oferta da TMB (B9B1915303N) respondia "Oferta Indisponível" em 23/09/2026,
// e a do site principal (M4E188885X5) também — o problema é da conta na TMB,
// não desta página. Um botão de compra que leva a erro custa mais do que um
// botão a menos.
//
// O aluno não fica sem boleto: o checkout da Hotmart oferece Pix, Boleto,
// Apple Pay e PayPal além do cartão. O que se perde é o boleto PARCELADO.
//
// Para trazer de volta quando a oferta for reativada: troque o cutBlock abaixo
// pelo replaceOnce que está logo acima dele, comentado.
//
// t.replaceOnce(
//   'checkout: boleto',
//   `        <a href="https://pay.tmb.com.br/RodrigoRosar/M4E188885X5" target="_blank" class="pr-btn ghost">`,
//   `        <a href="${CHECKOUT_BOLETO}" target="_blank" class="pr-btn ghost" data-upgrade-checkout>`
// );
t.cutBlock(
  'checkout: boleto removido (oferta TMB indisponível)',
  `        <a href="https://pay.tmb.com.br/RodrigoRosar/M4E188885X5" target="_blank" class="pr-btn ghost">`,
  `</a>
`,
  `        <!-- Botão de boleto parcelado removido: a oferta da TMB está indisponível desde 23/09/2026. -->
`
);

// ---------------------------------------------------------------------------
// 6. Link "Já é PDP? Aperte e faça upgrade": sai
// Ele leva ao WhatsApp para pedir o upgrade. Quem está nesta página já está na
// oferta de upgrade — o link só faria a pessoa sair do checkout.
// ---------------------------------------------------------------------------
t.cutBlock(
  'link "Já é PDP?" removido',
  `    <p class="pr-upgrade"><a href="https://api.whatsapp.com/send?phone=5547992360031&text=J%C3%A1%20sou%20PDP`,
  `</a></p>\n`,
  `    <!-- Link "Já é PDP? faça upgrade" removido: esta página já É a oferta de upgrade. -->\n`
);

// ---------------------------------------------------------------------------
// 7. A janela que confirma a matrícula antes do checkout
// ---------------------------------------------------------------------------
const MODAL = `
  <div class="up-modal" id="up-modal" role="dialog" aria-modal="true" aria-labelledby="up-modal-title" hidden>
    <div class="up-modal-card">
      <button type="button" class="up-modal-close" id="up-modal-close" aria-label="Fechar">&times;</button>
      <h2 class="up-modal-title" id="up-modal-title">Confirme seu e-mail de aluno</h2>
      <p class="up-modal-sub">Essa condição é exclusiva para aluno da Certificação Projeto de Primeira. Use o mesmo e-mail da sua compra.</p>

      <form class="up-modal-form" id="up-form" novalidate>
        <label for="up-email">E-mail</label>
        <input class="up-input" type="email" id="up-email" name="email" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" required>
        <p class="up-msg" id="up-msg" role="status" aria-live="polite"></p>
        <div class="up-modal-actions">
          <button class="pr-btn primary" type="submit" id="up-submit"><span id="up-submit-label">Confirmar e ir para o pagamento</span></button>
          <a class="pr-btn ghost" id="up-wa" href="${WHATSAPP_SUPORTE}" target="_blank" rel="noopener" hidden>Falar com o suporte no WhatsApp</a>
        </div>
      </form>
    </div>
  </div>
  <style>
    .up-modal{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;padding:20px;
      background:rgba(14,14,14,0.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
    .up-modal.is-open{display:flex}
    /* .pr-btn declara display:flex, o que venceria o atributo hidden do HTML.
       Sem esta regra o botão de suporte apareceria antes de existir erro. */
    .up-modal [hidden]{display:none !important}
    .up-modal-card{background:var(--white);border-radius:16px;padding:clamp(26px,4vw,36px);max-width:440px;width:100%;
      box-shadow:0 30px 80px rgba(0,0,0,0.35);position:relative;text-align:left}
    .up-modal-title{font-family:'Maven Pro',sans-serif;font-weight:800;font-size:clamp(20px,3vw,25px);line-height:1.15;color:var(--black);text-wrap:balance;padding-right:36px}
    .up-modal-sub{font-size:14.5px;color:var(--g500);line-height:1.55;margin-top:10px;text-wrap:pretty}
    .up-modal-form{display:flex;flex-direction:column;gap:9px;margin-top:22px}
    .up-modal-form label{font-family:'Maven Pro',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--graphite)}
    .up-input{width:100%;padding:13px 15px;font-family:'Inter',sans-serif;font-size:16px;color:var(--black);
      background:var(--offwhite);border:1px solid #E4E2DA;border-radius:11px;transition:border-color .2s,box-shadow .2s,background .2s}
    .up-input::placeholder{color:#A8A59C}
    .up-input:focus{outline:none;background:#fff;border-color:var(--black);box-shadow:0 0 0 3px rgba(30,30,30,0.1)}
    .up-input.is-invalid{border-color:#C0392B;box-shadow:0 0 0 3px rgba(192,57,43,0.12)}
    .up-msg{font-size:13px;line-height:1.5}
    .up-msg:empty{display:none}
    .up-msg.erro{color:#C0392B}
    .up-msg.ok{color:#1E7A4A}
    .up-modal-actions{display:flex;flex-direction:column;gap:9px;margin-top:6px}
    .up-modal-close{position:absolute;top:12px;right:12px;width:36px;height:36px;border:none;background:transparent;
      color:var(--g500);font-size:24px;line-height:1;border-radius:50%;transition:background .2s}
    .up-modal-close:hover{background:var(--offwhite);color:var(--black)}
    .up-spinner{display:inline-block;width:16px;height:16px;border:2.5px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:upspin .7s linear infinite;vertical-align:-3px}
    @keyframes upspin{to{transform:rotate(360deg)}}
    @media (prefers-reduced-motion: reduce){.up-spinner{animation-duration:1.4s}}
  </style>
`;

t.replaceOnce(
  'nota do bloco de preço',
  `    <p class="pr-note">Esse valor é exclusivo para quem entra nesta janela de inscrição. Depois, o preço sobe.</p>`,
  `    <p class="pr-note">Essa condição é exclusiva para aluno da Certificação Projeto de Primeira.</p>`
);

// A janela entra no fim do documento, e não dentro da seção de preço.
//
// Dois motivos. O primeiro é de robustez: amarrar a inserção ao comentário da
// seção seguinte ("18. ROI") fazia o build quebrar sempre que alguém
// acrescentava uma seção nova ali — e acrescentar seção é das coisas mais
// comuns numa reabertura de turma. `</body>` não se move.
//
// O segundo é de comportamento: um elemento `position:fixed` deixa de se
// posicionar pela tela se qualquer elemento acima dele tiver `transform`, e o
// GSAP anima com transform vários blocos dessa página. Fora de todos eles, a
// janela sempre abre centralizada.
t.replaceOnce('modal: markup', `\n</body>`, `\n${MODAL}\n</body>`);

// ---------------------------------------------------------------------------
// 8. JS: verificação antes do checkout
// ---------------------------------------------------------------------------
const JS_UPGRADE = `
// ===== UPGRADE: confirmação de matrícula antes do checkout =====
// Regra de negócio: na dúvida, vender. Se a verificação falhar por rede, timeout
// ou erro do servidor, o checkout é liberado assim mesmo — perder um aluno de
// verdade custa mais do que um não-aluno entrar pela condição de upgrade.
(function(){
  var ENDPOINT='${ENDPOINT_VERIFICACAO}';
  var TIMEOUT_MS=7000;
  var LABEL='Confirmar e ir para o pagamento';

  var modal=document.getElementById('up-modal');
  var form=document.getElementById('up-form');
  if(!modal||!form)return;

  var input=document.getElementById('up-email');
  var msg=document.getElementById('up-msg');
  var btn=document.getElementById('up-submit');
  var btnLabel=document.getElementById('up-submit-label');
  var wa=document.getElementById('up-wa');
  var fechar=document.getElementById('up-modal-close');
  var destino=null;
  var ultimoFoco=null;

  function abrir(url){
    destino=url;
    ultimoFoco=document.activeElement;
    modal.hidden=false;
    modal.classList.add('is-open');
    document.body.style.overflow='hidden';
    setTimeout(function(){input.focus();},60);
  }
  function fecharModal(){
    modal.classList.remove('is-open');
    modal.hidden=true;
    document.body.style.overflow='';
    carregando(false);
    mostrar('','');
    wa.hidden=true;
    if(ultimoFoco&&ultimoFoco.focus)ultimoFoco.focus();
  }
  function mostrar(texto,tipo){
    msg.textContent=texto||'';
    msg.className='up-msg'+(tipo?' '+tipo:'');
  }
  function carregando(on){
    btn.disabled=on;
    if(on){btnLabel.innerHTML='<span class="up-spinner" aria-hidden="true"></span>';btn.setAttribute('aria-busy','true');}
    else{btnLabel.textContent=LABEL;btn.removeAttribute('aria-busy');}
  }
  function irParaCheckout(){
    var url=destino;
    fecharModal();
    window.open(url,'_blank','noopener');
  }

  // Intercepta os botões de compra. O href continua correto: se este script não
  // rodar, o botão funciona como link normal e a venda acontece mesmo assim.
  Array.prototype.forEach.call(document.querySelectorAll('[data-upgrade-checkout]'),function(a){
    a.addEventListener('click',function(e){
      e.preventDefault();
      abrir(a.getAttribute('href'));
    });
  });

  fechar.addEventListener('click',fecharModal);
  modal.addEventListener('click',function(e){if(e.target===modal)fecharModal();});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modal.classList.contains('is-open'))fecharModal();});
  input.addEventListener('input',function(){input.classList.remove('is-invalid');mostrar('','');});

  var EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

  form.addEventListener('submit',function(e){
    e.preventDefault();
    var email=input.value.trim().toLowerCase();
    if(!EMAIL_RE.test(email)){
      input.classList.add('is-invalid');input.focus();
      return mostrar('Informe um e-mail válido.','erro');
    }
    mostrar('');carregando(true);wa.hidden=true;

    var ctrl=('AbortController' in window)?new AbortController():null;
    var timer=setTimeout(function(){if(ctrl)ctrl.abort();},TIMEOUT_MS);

    fetch(ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email}),
      signal:ctrl?ctrl.signal:undefined
    })
    .then(function(r){
      clearTimeout(timer);
      if(r.status===429){
        carregando(false);
        wa.hidden=false;
        return mostrar('Muitas tentativas seguidas. Aguarde alguns minutos ou fale com o suporte.','erro');
      }
      if(!r.ok)throw new Error('http_'+r.status);
      return r.json().then(function(dados){
        if(dados&&dados.elegivel===true){
          mostrar('Matrícula confirmada. Abrindo o pagamento…','ok');
          return setTimeout(irParaCheckout,450);
        }
        carregando(false);
        wa.hidden=false;
        mostrar('Não encontramos esse e-mail na turma do PDP. Se você comprou com outro e-mail, tente ele — ou fale com o suporte que a gente resolve na hora.','erro');
      });
    })
    .catch(function(){
      clearTimeout(timer);
      // Verificação indisponível não bloqueia a venda.
      console.warn('verificação indisponível; checkout liberado');
      mostrar('Seguindo para o pagamento…','ok');
      setTimeout(irParaCheckout,350);
    });
  });
})();

`;

t.replaceOnce('js do upgrade', `\n}); // end DOMContentLoaded`, `${JS_UPGRADE}}); // end DOMContentLoaded`);

// ---------------------------------------------------------------------------
// Guardas: o que não pode sobreviver nesta página
// ---------------------------------------------------------------------------

// O vendas.html mantém a seção "INSCRIÇÕES ABREM ÀS 15H" comentada para reuso,
// e ela cita o preço cheio. Comentário não renderiza, então a regra de preço
// olha só o HTML visível. A ancoragem de valor (R$ 3.997 como preço de tabela
// do curso) continua na página de propósito: é a mesma informação do site.
t.guardVisible([
  ['preço de venda de R$ 3.997 no bloco de compra', /pr-pix-val fm">R\$ 3\.997/],
  ['parcela de R$ 390', /pr-val">390/],

  // Urgência de prazo não existe no upgrade: o aluno pode fazer quando quiser.
  // Se o vendas.html ganhar um gatilho novo, o build para aqui e avisa, em vez
  // de publicar um prazo falso para quem já é seu aluno.
  ['barra fixa de urgência', /class="sticky-bar/],
  ['aviso de prazo de matrículas', /Matr[íi]culas (abertas|encerram|s[óo])/i],
  ['data de início de turma', /turma come[çc]a|Come[çc]a segunda/i],
  ['aviso de que o preço sobe', /o pre[çc]o sobe/i],
  ['chamada de garantir vaga', /Garantir minha vaga|Quero minha vaga/i],
  ['oferta amarrada a uma turma', /DESTA TURMA|desta janela|janela de inscri[çc][ãa]o/i],
  ['contagem regressiva', /id="pr-countdown"/],
]);

t.guard([
  ['checkout da oferta cheia (Asaas)', /asaas\.com\/c\/2x3ccx7lhp4q23up/],
  ['checkout da oferta cheia (Hotmart)', /pay\.hotmart\.com\/U104887798W\?bid=/],
  ['checkout da oferta cheia (TMB)', /pay\.tmb\.com\.br\/RodrigoRosar\/M4E188885X5/],
  ['checkout na TMB (oferta indisponível desde 23/09/2026)', /pay\.tmb\.com\.br/],
  ['link "Já é PDP?" (o visitante já está na oferta de upgrade)', /J%C3%A1%20sou%20PDP/],
  ['caminho relativo de imagem', /(?<!\/)(["'])img\//],
  ['indexação no Google', /<meta name="robots" content="index/],
  ['preço de 3997 no schema', /"price": "3997\.00"/],
]);

// Guardas positivas: o que precisa existir.
t.require([
  ['preço do upgrade no PIX', /pr-pix-val fm">R\$ 1\.997/],
  ['parcela do upgrade', /pr-val">197/],
  ['checkout PIX do upgrade', /asaas\.com\/c\/rf09mpzqnty6wtyq/],
  ['checkout cartão do upgrade', /off=atem2nx9/],
  ['os dois botões de compra com o gancho de verificação', /data-upgrade-checkout[\s\S]*data-upgrade-checkout/],
  ['janela de confirmação', /id="up-modal"/],
  ['endpoint de verificação', /functions\/v1\/verificar-aluno/],
  ['canonical do upgrade', /rel="canonical" href="https:\/\/implementacao\.rodrigorosar\.com\.br\/upgrade\/"/],
  ['ancoragem de valor preservada', /id="ancoragem"/],
]);

t.write(TARGET);

console.log(`upgrade/index.html gerado a partir de vendas.html (${t.applied.length} transformações):`);
for (const item of t.applied) console.log(`  - ${item}`);
