#!/usr/bin/env node
/**
 * Gera lista-de-espera/index.html a partir de vendas.html.
 *
 * O site da lista de espera é o MESMO site da Implementação, com um conjunto
 * pequeno e explícito de diferenças (sem checkout, com formulário de lista).
 * Manter isso como script evita a defasagem que aconteceu entre 07/2026 e 08/2026,
 * quando o vendas.html recebeu 13 commits de redesign que nunca chegaram na lista.
 *
 * Uso:  node scripts/build-lista-de-espera.mjs
 *
 * Toda transformação é obrigatória: se uma âncora não for encontrada, o script
 * falha com erro em vez de gerar um arquivo silenciosamente incompleto.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, 'vendas.html');
const TARGET = join(ROOT, 'lista-de-espera', 'index.html');

const applied = [];

/** Substituição exata e obrigatória. Falha se `from` não existir (ou aparecer mais de uma vez). */
function replaceOnce(html, label, from, to) {
  const first = html.indexOf(from);
  if (first === -1) {
    throw new Error(`[${label}] âncora não encontrada em vendas.html:\n${from.slice(0, 160)}`);
  }
  if (html.indexOf(from, first + 1) !== -1) {
    throw new Error(`[${label}] âncora ambígua (aparece mais de uma vez) em vendas.html`);
  }
  applied.push(label);
  return html.slice(0, first) + to + html.slice(first + from.length);
}

/** Remove o trecho entre `start` (inclusive) e o primeiro `end` depois dele (inclusive). */
function cutBlock(html, label, start, end, replacement = '') {
  const a = html.indexOf(start);
  if (a === -1) throw new Error(`[${label}] início do bloco não encontrado: ${start.slice(0, 120)}`);
  const b = html.indexOf(end, a + start.length);
  if (b === -1) throw new Error(`[${label}] fim do bloco não encontrado: ${end.slice(0, 120)}`);
  applied.push(label);
  return html.slice(0, a) + replacement + html.slice(b + end.length);
}

/** Substituição global obrigatória: falha se não houver nenhuma ocorrência. */
function replaceAll(html, label, pattern, to) {
  const n = (html.match(pattern) || []).length;
  if (n === 0) throw new Error(`[${label}] nenhuma ocorrência de ${pattern}`);
  applied.push(`${label} (${n}x)`);
  return html.replace(pattern, to);
}

// O repositório grava os HTML com CRLF. Normalizamos para LF durante as
// transformações (as âncoras deste script usam LF) e regravamos com CRLF.
const CRLF = /\r\n/.test(readFileSync(SOURCE, 'utf8').slice(0, 4096));
let html = readFileSync(SOURCE, 'utf8').replace(/\r\n/g, '\n');

// ---------------------------------------------------------------------------
// 1. Caminhos absolutos
// A lista de espera vive em /lista-de-espera/, então img/ e video/ relativos
// quebrariam. Inclui ocorrências dentro de strings JS (src:"img/...").
// ---------------------------------------------------------------------------
// O lookbehind de `type=` não é detalhe: sem ele, type="video/mp4" de um
// <source> vira type="/video/mp4", que é um tipo de mídia inválido e faz o
// navegador descartar a fonte do vídeo. Esse bug ficou publicado até 23/09/2026.
html = replaceAll(html, 'paths img', /(?<!type=)(["'])img\//g, '$1/img/');
html = replaceAll(html, 'paths video', /(?<!type=)(["'])video\//g, '$1/video/');

// ---------------------------------------------------------------------------
// 2. SEO: noindex, canonical e copy próprios da lista de espera
// ---------------------------------------------------------------------------
html = replaceOnce(
  html,
  'seo core',
  `<title>Implementação Projeto de Primeira | METRIK Instituto</title>
<meta name="description" content="Do caos à ordem no seu escritório de arquitetura e interiores em 6 semanas. Método PDP com chancela MEC + IA aplicada à documentação, desenvolvimento, representação e gestão.">
<meta name="keywords" content="implementação projeto de primeira, PDP, curso arquitetura, IA arquitetura, escritório de arquitetura, projeto de interiores, MEC, Rodrigo Rosar, METRIK">
<meta name="author" content="Rodrigo Rosar — METRIK Instituto">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
<meta name="googlebot" content="index, follow">
<link rel="canonical" href="https://implementacao.rodrigorosar.com.br/">`,
  `<title>Lista de espera | Implementação Projeto de Primeira — METRIK Instituto</title>
<meta name="description" content="Entre na lista de espera da Implementação Projeto de Primeira. Seja avisado em primeira mão quando a próxima turma abrir e entre com prioridade.">
<meta name="author" content="Rodrigo Rosar — METRIK Instituto">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="https://implementacao.rodrigorosar.com.br/lista-de-espera/">`
);

html = replaceOnce(
  html,
  'open graph',
  `<meta property="og:title" content="Implementação Projeto de Primeira | Do caos à ordem em 6 semanas">
<meta property="og:description" content="Método PDP + IA aplicada ao escritório de arquitetura e interiores. Acompanhamento semanal com o Rodrigo, chancela MEC, 7.000+ alunos em 12 países.">
<meta property="og:url" content="https://implementacao.rodrigorosar.com.br/">`,
  `<meta property="og:title" content="Lista de espera — Implementação Projeto de Primeira">
<meta property="og:description" content="Entre na lista e seja avisado em primeira mão quando a próxima turma abrir, com prioridade na inscrição.">
<meta property="og:url" content="https://implementacao.rodrigorosar.com.br/lista-de-espera/">`
);

html = replaceOnce(
  html,
  'twitter card',
  `<meta name="twitter:title" content="Implementação Projeto de Primeira | Do caos à ordem em 6 semanas">
<meta name="twitter:description" content="Método PDP + IA aplicada ao escritório de arquitetura e interiores. 7.000+ alunos em 12 países.">`,
  `<meta name="twitter:title" content="Lista de espera — Implementação Projeto de Primeira">
<meta name="twitter:description" content="Entre na lista e seja avisado em primeira mão quando a próxima turma abrir, com prioridade na inscrição.">`
);

// ---------------------------------------------------------------------------
// 3. Barra fixa de urgência: fora
// Ela anuncia matrículas abertas e prazo de turma — não existe na lista de espera.
// ---------------------------------------------------------------------------
html = cutBlock(
  html,
  'sticky bar',
  '<!-- STICKY URGENCY BAR -->',
  `<script>document.body.classList.add('bar-on');</script>\n`,
  '<!-- Barra fixa de urgência removida na lista de espera: não há matrícula aberta. -->\n'
);

// ---------------------------------------------------------------------------
// 4. Hero: CTA para o formulário
// Sem pill de aviso acima do título: o botão logo abaixo já diz "Entrar na
// lista de espera", então a pill só repetia a mesma frase na mesma dobra.
// ---------------------------------------------------------------------------
// id="h-cta" é o alvo que a timeline GSAP do hero já espera (em vendas.html ele
// ficou órfão quando o CTA do hero saiu).
const HERO_CTA = `      <a href="#preco" class="hero-wl-cta gs" id="h-cta">
        Entrar na lista de espera
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </a>
      <style>
        .hero-wl-cta{display:inline-flex;align-items:center;gap:10px;margin-top:28px;padding:15px 30px;
          background:#fff;color:#1E1E1E;font-family:'Maven Pro',sans-serif;font-weight:700;font-size:14.5px;
          letter-spacing:0.03em;border-radius:999px;text-decoration:none;box-shadow:0 10px 30px rgba(0,0,0,0.35);
          transition:transform .25s ease,box-shadow .25s ease}
        .hero-wl-cta:hover{transform:translateY(-2px);box-shadow:0 16px 40px rgba(0,0,0,0.45)}
        .hero-wl-cta svg{width:18px;height:18px;transition:transform .25s ease}
        .hero-wl-cta:hover svg{transform:translateX(4px)}
      </style>
`;

html = replaceOnce(
  html,
  'hero: cta',
  `      </div>
    </div>
    <button class="hero-video gs hero-video-facade"`,
  `      </div>
${HERO_CTA}    </div>
    <button class="hero-video gs hero-video-facade"`
);

// ---------------------------------------------------------------------------
// 5. Ancoragem de valor: oculta (decisão do Rodrigo, 25/08/2026)
// Não revelar os números antes da abertura da próxima turma.
// ---------------------------------------------------------------------------
html = replaceOnce(
  html,
  'ancoragem oculta',
  `<section class="sec-short bg-w" style="padding:120px 24px" id="ancoragem" aria-label="Valor real da implementação">`,
  `<section class="sec-short bg-w" style="padding:120px 24px;display:none" id="ancoragem" aria-label="Valor real da implementação" hidden>`
);

// ---------------------------------------------------------------------------
// 6. Seção de preço -> formulário da lista de espera
// ---------------------------------------------------------------------------
const WAITLIST_SECTION = `<section class="sec bg-o" id="preco" aria-label="Lista de espera">
  <style>
    #preco .wl-card{max-width:480px;margin:0 auto;background:var(--white);border-radius:22px;
      padding:clamp(30px,4vw,44px);box-shadow:0 24px 70px rgba(30,30,30,0.12);border:1px solid #ECEAE2;text-align:center}
    #preco .wl-ribbon{display:inline-block;font-family:'Maven Pro',sans-serif;font-size:11px;font-weight:800;
      letter-spacing:0.14em;text-transform:uppercase;color:var(--graphite);
      background:rgba(0,0,0,0.06);padding:7px 16px;border-radius:999px;margin-bottom:18px}
    #preco .wl-title{font-family:'Maven Pro',sans-serif;font-weight:800;font-size:clamp(24px,4vw,34px);
      line-height:1.12;letter-spacing:-0.02em;color:var(--black);margin-bottom:12px;text-wrap:balance}
    #preco .wl-title .fs{font-family:'DM Serif Display',Georgia,serif;font-weight:400;font-style:italic;letter-spacing:0}
    #preco .wl-sub{font-size:15px;color:var(--g500);line-height:1.55;max-width:400px;margin:0 auto 26px}
    #preco .wl-count{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;max-width:380px;margin:0 auto 28px}
    #preco .wl-cell{padding:14px 4px;border-radius:12px;background:var(--offwhite);border:1px solid #E4E2DA}
    #preco .wl-num{font-family:'Maven Pro',sans-serif;font-weight:800;font-size:clamp(22px,4.5vw,30px);line-height:1;color:var(--black);font-variant-numeric:tabular-nums}
    #preco .wl-lab{font-family:'Maven Pro',sans-serif;font-size:9px;font-weight:700;letter-spacing:0.12em;color:var(--g500);text-transform:uppercase;margin-top:7px}
    #preco .wl-form{display:flex;flex-direction:column;gap:12px;text-align:left}
    #preco .wl-field{display:flex;flex-direction:column;gap:6px}
    #preco .wl-field label{font-family:'Maven Pro',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--graphite)}
    #preco .wl-input{width:100%;padding:13px 15px;font-family:'Inter',sans-serif;font-size:15px;color:var(--black);
      background:var(--offwhite);border:1px solid #E4E2DA;border-radius:11px;transition:border-color .2s,box-shadow .2s,background .2s}
    #preco .wl-input::placeholder{color:#A8A59C}
    #preco .wl-input:focus{outline:none;background:#fff;border-color:var(--black);box-shadow:0 0 0 3px rgba(30,30,30,0.1)}
    #preco .wl-input.is-invalid{border-color:#C0392B;box-shadow:0 0 0 3px rgba(192,57,43,0.12)}
    #preco .wl-error{font-size:12.5px;color:#C0392B;line-height:1.4}
    #preco .wl-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none}
    #preco .wl-submit{width:100%;margin-top:4px}
    #preco .wl-spinner{width:18px;height:18px;border:2.5px solid rgba(255,255,255,0.35);border-top-color:#fff;border-radius:50%;animation:wlspin .7s linear infinite}
    @keyframes wlspin{to{transform:rotate(360deg)}}
    #preco .wl-foot{margin-top:14px;font-size:12px;color:var(--g500)}
    #preco .wl-trust{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:7px 12px;margin-top:22px;
      font-family:'Maven Pro',sans-serif;font-size:10.5px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;color:var(--g500)}
    #preco .wl-trust strong{color:var(--black);font-weight:800}
    @media (prefers-reduced-motion: reduce){#preco .wl-spinner{animation-duration:1.4s}}
  </style>

  <div class="wl-card gs">
    <div class="wl-ribbon">Lista de espera · vagas limitadas</div>
    <h2 class="wl-title">Garanta prioridade na <span class="fs">próxima turma.</span></h2>
    <p class="wl-sub">Entre na lista e seja avisado em primeira mão. Quem está na lista entra com prioridade na inscrição e uma condição especial na abertura.</p>

    <!-- Countdown oculto: sem data definida para a próxima turma. Ao definir, mostrar o bloco wl-count e reativar o JS de contagem. -->
    <div class="wl-count" id="wl-count" hidden style="display:none" aria-label="Contagem regressiva para a abertura das vagas">
      <div class="wl-cell"><div class="wl-num" id="wl-d">00</div><div class="wl-lab">dias</div></div>
      <div class="wl-cell"><div class="wl-num" id="wl-h">00</div><div class="wl-lab">horas</div></div>
      <div class="wl-cell"><div class="wl-num" id="wl-m">00</div><div class="wl-lab">min</div></div>
      <div class="wl-cell"><div class="wl-num" id="wl-s">00</div><div class="wl-lab">seg</div></div>
    </div>

    <form class="wl-form" id="wl-form" novalidate>
      <div class="wl-field">
        <label for="wl-nome">Nome</label>
        <input class="wl-input" type="text" id="wl-nome" name="nome" autocomplete="given-name" placeholder="Seu nome" required>
      </div>
      <div class="wl-field">
        <label for="wl-email">E-mail</label>
        <input class="wl-input" type="email" id="wl-email" name="email" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" required>
      </div>
      <div class="wl-field">
        <label for="wl-whatsapp">WhatsApp</label>
        <input class="wl-input" type="tel" id="wl-whatsapp" name="whatsapp" autocomplete="tel" inputmode="tel" placeholder="(11) 99999-9999" required>
      </div>

      <div class="wl-hp" aria-hidden="true">
        <label for="wl-website">Não preencha</label>
        <input type="text" id="wl-website" name="website" tabindex="-1" autocomplete="off">
      </div>

      <div class="wl-error" id="wl-error" role="alert" aria-live="assertive"></div>

      <button class="pr-btn primary wl-submit" type="submit" id="wl-submit">
        <span class="wl-submit-label">Entrar na lista de espera</span>
      </button>
    </form>

    <p class="wl-foot">Sem spam.</p>

    <div class="wl-trust">
      <span><strong>26</strong> turmas</span>
      <span class="pr-dot"></span>
      <span><strong>7.000+</strong> alunos em 12 países</span>
      <span class="pr-dot"></span>
      <span>Certificado MEC</span>
    </div>
  </div>
</section>`;

html = cutBlock(
  html,
  'preço -> formulário',
  `<section class="sec bg-o" id="preco" aria-label="Preço e formas de pagamento">`,
  `</section>\n<!-- ============================== -->\n<!-- 18. ROI`,
  `${WAITLIST_SECTION}\n<!-- ============================== -->\n<!-- 18. ROI`
);

// ---------------------------------------------------------------------------
// 7. JS do formulário
// ---------------------------------------------------------------------------
const WAITLIST_JS = `
// ===== LISTA DE ESPERA: formulário (countdown desativado — sem data da próxima turma) =====
(function(){
  var ENDPOINT='https://dashboard.rodrigorosar.com.br/api/public/waitlist';
  var SUBMIT_LABEL='Entrar na lista de espera';
  var form=document.getElementById('wl-form');
  if(!form)return;
  var btn=document.getElementById('wl-submit');
  var lblEl=form.querySelector('.wl-submit-label');
  var errEl=document.getElementById('wl-error');
  var nome=document.getElementById('wl-nome');
  var email=document.getElementById('wl-email');
  var wa=document.getElementById('wl-whatsapp');
  var hp=document.getElementById('wl-website');

  function showError(msg,field){
    errEl.textContent=msg||'';
    [nome,email,wa].forEach(function(f){f.classList.remove('is-invalid');});
    if(field){field.classList.add('is-invalid');field.focus();}
  }
  [nome,email,wa].forEach(function(f){f.addEventListener('input',function(){this.classList.remove('is-invalid');});});
  function loading(on){
    btn.disabled=on;
    if(on){lblEl.innerHTML='<span class="wl-spinner" aria-hidden="true"></span>';btn.setAttribute('aria-busy','true');}
    else{lblEl.textContent=SUBMIT_LABEL;btn.removeAttribute('aria-busy');}
  }
  wa.addEventListener('input',function(){
    var v=wa.value.replace(/\\D/g,'').slice(0,11);
    if(v.length>6)v='('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7);
    else if(v.length>2)v='('+v.slice(0,2)+') '+v.slice(2);
    else if(v.length>0)v='('+v;
    wa.value=v;
  });
  var EMAIL_RE=/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var vNome=nome.value.trim(),vEmail=email.value.trim().toLowerCase(),vWa=wa.value.replace(/\\D/g,'');
    if(!vNome){return showError('Informe seu nome.',nome);}
    if(!EMAIL_RE.test(vEmail)){return showError('Informe um e-mail válido.',email);}
    if(vWa.length<10){return showError('Informe um WhatsApp válido com DDD.',wa);}
    showError('');loading(true);
    var utm={};
    new URLSearchParams(location.search).forEach(function(val,key){if(key.indexOf('utm_')===0)utm[key]=val;});
    fetch(ENDPOINT,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nome:vNome,email:vEmail,whatsapp:vWa,consent:true,campanha:'implementacao',website:hp?hp.value:'',utm:utm})
    })
    .then(function(r){
      if(r.ok){
        try{sessionStorage.setItem('wl_nome',vNome.split(/\\s+/)[0]);}catch(_){}
        window.location.href='obrigado.html';return;
      }
      return r.json().catch(function(){return{};}).then(function(data){
        loading(false);showError(data.error||'Não foi possível enviar agora. Tente novamente.');
      });
    })
    .catch(function(){
      loading(false);showError('Conexão instável. Tente novamente em instantes.');
    });
  });
})();

`;

html = replaceOnce(
  html,
  'js do formulário',
  `\n}); // end DOMContentLoaded`,
  `${WAITLIST_JS}}); // end DOMContentLoaded`
);

// Sem #big-price na página, a animação do preço vira código morto (e o
// ScrollTrigger reclama de trigger inexistente no console).
html = replaceOnce(
  html,
  'gsap: remove animação do preço',
  `// BIG PRICE
ScrollTrigger.create({
  trigger: '#big-price', start: 'top 85%', once: true,
  onEnter: () => gsap.fromTo('#big-price', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.4)' })
});
// Fallback: garantir visibilidade após 3s
setTimeout(() => { const el = document.getElementById('big-price'); if (el) el.style.opacity = '1'; }, 3000);
`,
  `// BIG PRICE: sem preço na lista de espera, nada a animar.
`
);

// ---------------------------------------------------------------------------
// 8. Botão flutuante de WhatsApp: fora (é suporte a matrícula, não existe aqui)
// ---------------------------------------------------------------------------
html = cutBlock(
  html,
  'wa-float',
  '<!-- WhatsApp floating button -->',
  '\n</a>\n',
  '<!-- Botão flutuante de suporte WhatsApp removido na lista de espera (não usamos suporte aqui) -->\n'
);

// ---------------------------------------------------------------------------
// Guarda final: nada de checkout pode sobreviver na lista de espera.
// ---------------------------------------------------------------------------
const FORBIDDEN = [
  ['link de checkout Asaas', /asaas\.com\/c\//],
  ['link de checkout Hotmart', /pay\.hotmart\.com/],
  ['link de checkout TMB', /pay\.tmb\.com\.br/],
  ['botão de compra', /class="pr-btn (primary|ghost)"/],
  // Só o markup: as classes continuam definidas no CSS compartilhado, o que é inofensivo.
  ['preço de venda no markup', /class="[^"]*\b(pr-pix-val|big-price|pr-old|pr-ribbon|pr-actions)\b/],
  ['id de preço no markup', /id="(big-price|pr-actions|pr-countdown)"/],
  ['caminho relativo de imagem', /(?<!\/)(["'])img\//],
  ['pill de aviso no hero (removida: repetia o botão)', /hero-date-note|h-date-note/],
];
for (const [label, re] of FORBIDDEN) {
  if (re.test(html)) throw new Error(`Guarda falhou: ${label} ainda presente no HTML gerado (${re})`);
}

writeFileSync(TARGET, CRLF ? html.replace(/\n/g, '\r\n') : html, 'utf8');

console.log('lista-de-espera/index.html gerado a partir de vendas.html');
console.log(`${applied.length} transformações aplicadas:`);
for (const a of applied) console.log(`  · ${a}`);
console.log('Guardas de checkout: OK');
