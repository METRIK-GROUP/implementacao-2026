// ===== PRÉ-CHECKOUT: nome e WhatsApp antes do pagamento =====
// Só nome e WhatsApp, para facilitar (sugestão do Rodrigo, 09/10/2026): o
// painel identifica a pessoa e acha a compra pelo WhatsApp.
// Clique em qualquer botão que leva ao Asaas (PIX), à Hotmart (cartão) ou à
// TMB (boleto) abre esta janela. Os dados vão para o painel (launch-dashboard,
// /api/public/pre-checkout) e a pessoa segue para o pagamento. Quem passar
// 30 min sem pagar vira "Carrinho abandonado" na Clint.
//
// Três decisões que valem entender:
// 1. A venda nunca espera o painel. O envio sai por sendBeacon (ou fetch com
//    keepalive), sem aguardar resposta, e o checkout abre na hora. Painel fora
//    do ar = lead perdido, nunca venda perdida.
// 2. Só a Hotmart aceita dados pelo link (name, phoneac, phonenumber;
//    conferido em 09/10/2026). Asaas e TMB ignoram: a pessoa digita de novo lá.
// 3. Sem JavaScript o botão é um link comum para o checkout, como sempre foi.
//    Link com data-sem-pre-checkout não abre a janela.
var PreCheckout=(function(){
  var ENDPOINT='https://dashboard.rodrigorosar.com.br/api/public/pre-checkout';
  var CHAVE_LOCAL='pck-dados';
  var MEIOS={'www.asaas.com':'pix','pay.hotmart.com':'cartao','pay.tmb.com.br':'boleto'};
  var ROTULOS={pix:'Pagamento no PIX',cartao:'Cartão de crédito',boleto:'Boleto parcelado'};
  // Rastreio da página que segue para o checkout (a Hotmart lê src, sck e utm_*).
  var REPASSAR=/^(utm_[a-z]+|src|sck)$/;

  /** 'pix' | 'cartao' | 'boleto' para os três checkouts; null para qualquer outro link. */
  function meioDoLink(href){
    try{var u=new URL(href);return u.protocol==='https:'&&MEIOS[u.hostname]||null;}catch(e){return null;}
  }

  /** Link do checkout com o rastreio da página e, na Hotmart, os dados já preenchidos. */
  function linkFinal(href,dados,busca){
    var u=new URL(href);
    new URLSearchParams(busca||'').forEach(function(v,k){if(REPASSAR.test(k)&&!u.searchParams.has(k))u.searchParams.set(k,v);});
    if(u.hostname==='pay.hotmart.com'){
      u.searchParams.set('name',dados.nome);
      if(dados.email)u.searchParams.set('email',dados.email);
      var d=String(dados.whatsapp||'').replace(/\D/g,'');
      if(dados.pais==='BR'&&(d.length===10||d.length===11)){
        u.searchParams.set('phoneac',d.slice(0,2));
        u.searchParams.set('phonenumber',d.slice(2));
      }
    }
    return u.toString();
  }

  /** Só as utm_* da página (o painel recusa o resto). */
  function utmDa(busca){
    var utm={};
    new URLSearchParams(busca||'').forEach(function(v,k){if(/^utm_[a-z]{1,20}$/.test(k))utm[k]=v.slice(0,200);});
    return utm;
  }

  function enviar(corpo){
    // text/plain é pedido "simples": sai sem pré-verificação de CORS e sobrevive à troca de página.
    var txt=JSON.stringify(corpo);
    try{
      if(navigator.sendBeacon&&navigator.sendBeacon(ENDPOINT,new Blob([txt],{type:'text/plain;charset=UTF-8'})))return;
    }catch(e){}
    try{
      fetch(ENDPOINT,{method:'POST',body:txt,keepalive:true,mode:'cors',headers:{'Content-Type':'text/plain;charset=UTF-8'}}).catch(function(){});
    }catch(e){}
  }

  function lerLocal(){try{return JSON.parse(localStorage.getItem(CHAVE_LOCAL)||'null')||{};}catch(e){return {};}}
  function gravarLocal(d){try{localStorage.setItem(CHAVE_LOCAL,JSON.stringify({nome:d.nome}));}catch(e){}}

  var CSS=''+
    // margin:auto e inset:0 de volta: o reset do site (*{margin:0}) tira a centralização nativa do <dialog>.
    '.pck{position:fixed;inset:0;margin:auto;height:fit-content;width:min(440px,calc(100vw - 32px));max-height:calc(100dvh - 32px);overflow:auto;padding:0;border:0;border-radius:20px;'+
      'background:var(--white,#fff);color:var(--black,#1E1E1E);box-shadow:0 30px 80px rgba(0,0,0,.45);font-family:Inter,system-ui,sans-serif}'+
    '.pck::backdrop{background:rgba(10,10,10,.72);backdrop-filter:blur(3px)}'+
    '.pck-in{position:relative;padding:30px 26px 24px}'+
    '.pck-x{position:absolute;top:12px;right:12px;width:40px;height:40px;border:0;border-radius:50%;background:transparent;'+
      'color:var(--g500,#77756E);font-size:26px;line-height:1;cursor:pointer}'+
    '.pck-x:hover,.pck-x:focus-visible{background:var(--offwhite,#F4F3EF);color:var(--black,#1E1E1E)}'+
    '.pck-eyebrow{font-family:"Maven Pro",system-ui,sans-serif;font-size:11px;font-weight:800;letter-spacing:.14em;'+
      'text-transform:uppercase;color:var(--g500,#77756E);margin:0 0 8px}'+
    '.pck-title{font-family:"Maven Pro",system-ui,sans-serif;font-weight:800;font-size:26px;line-height:1.15;margin:0 0 8px;padding-right:32px}'+
    '.pck-sub{font-size:14.5px;line-height:1.55;color:var(--g500,#5E5C56);margin:0 0 20px}'+
    '.pck form{display:flex;flex-direction:column;gap:12px}'+
    '.pck-f{display:flex;flex-direction:column;gap:6px}'+
    '.pck-f label{font-family:"Maven Pro",system-ui,sans-serif;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--graphite,#3D3D3A)}'+
    '.pck-i{width:100%;box-sizing:border-box;padding:13px 15px;font:inherit;font-size:16px;color:var(--black,#1E1E1E);'+
      'background:var(--offwhite,#F4F3EF);border:1px solid #E4E2DA;border-radius:12px}'+
    '.pck-i:focus{outline:none;background:#fff;border-color:var(--black,#1E1E1E);box-shadow:0 0 0 3px rgba(30,30,30,.1)}'+
    '.pck-i[aria-invalid="true"]{border-color:#C0392B;box-shadow:0 0 0 3px rgba(192,57,43,.12)}'+
    '.pck-tel{display:flex;gap:8px}.pck-tel .pck-i{flex:1;min-width:0}'+
    '.pck-ddi{position:relative;flex:0 0 auto;display:flex;align-items:center;min-width:92px;padding:0 28px 0 12px;box-sizing:border-box;'+
      'background:var(--offwhite,#F4F3EF);border:1px solid #E4E2DA;border-radius:12px;font-size:15px}'+
    '.pck-ddi::after{content:"";position:absolute;right:12px;top:50%;width:7px;height:7px;margin-top:-5px;'+
      'border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);opacity:.55}'+
    '.pck-ddi select{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;font-size:16px}'+
    '.pck-ddi:focus-within{background:#fff;border-color:var(--black,#1E1E1E);box-shadow:0 0 0 3px rgba(30,30,30,.1)}'+
    '.pck-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none}'+
    '.pck-err{min-height:0;font-size:13px;line-height:1.4;color:#C0392B}.pck-err:empty{display:none}'+
    '.pck-go{width:100%;margin-top:4px;justify-content:center}'+
    '.pck-note{margin:14px 0 0;font-size:12px;line-height:1.5;color:var(--g500,#77756E);text-align:center}'+
    '@media (max-width:480px){.pck-in{padding:26px 18px 20px}.pck-title{font-size:23px}}';

  var HTML=''+
    '<div class="pck-in">'+
      '<button type="button" class="pck-x" data-pck-fechar aria-label="Fechar e voltar para a página">&times;</button>'+
      '<p class="pck-eyebrow" id="pck-meio"></p>'+
      '<h2 class="pck-title" id="pck-titulo">Falta só um passo</h2>'+
      '<p class="pck-sub" id="pck-sub"></p>'+
      '<form id="pck-form" novalidate>'+
        '<div class="pck-f"><label for="pck-nome">Nome completo</label>'+
          '<input class="pck-i" id="pck-nome" name="nome" type="text" autocomplete="name" placeholder="Seu nome" maxlength="120" required></div>'+
        '<div class="pck-f"><label for="pck-whatsapp">WhatsApp</label>'+
          '<div class="pck-tel"><div class="pck-ddi"><span id="pck-ddi-view" aria-hidden="true">🇧🇷 +55</span>'+
            '<select id="pck-pais" name="pais" autocomplete="country" aria-label="País do seu WhatsApp"><option value="BR" selected>🇧🇷 Brasil (+55)</option></select></div>'+
          '<input class="pck-i" id="pck-whatsapp" name="whatsapp" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="(11) 99999-9999" required></div></div>'+
        '<div class="pck-hp" aria-hidden="true"><label for="pck-website">Não preencha</label>'+
          '<input id="pck-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>'+
        '<p class="pck-err" id="pck-err" role="alert" aria-live="assertive"></p>'+
        '<button class="pr-btn primary pck-go" type="submit">Continuar para o pagamento</button>'+
      '</form>'+
      '<p class="pck-note">Seus dados são usados só para falar com você sobre a sua inscrição, pelo WhatsApp.</p>'+
    '</div>';

  function iniciar(doc){
    var links=[].slice.call(doc.querySelectorAll('a[href]')).filter(function(a){
      return meioDoLink(a.href)&&!a.hasAttribute('data-sem-pre-checkout');
    });
    if(!links.length)return;
    // quebrado: a janela falhou ao montar; dali em diante os botões são links comuns.
    var dlg=null,campos=null,telefone=null,atual=null,origemFoco=null,quebrado=false;

    // Só devolve true com a janela inteira de pé (dlg só é preenchido no fim).
    function montar(){
      if(dlg)return true;
      if(quebrado||typeof doc.createElement('dialog').showModal!=='function')return false; // navegador antigo: segue direto
      var caixa=null;
      try{
        var st=doc.createElement('style');st.textContent=CSS;doc.head.appendChild(st);
        caixa=doc.createElement('dialog');caixa.className='pck';caixa.setAttribute('aria-labelledby','pck-titulo');caixa.setAttribute('aria-describedby','pck-sub');
        caixa.innerHTML=HTML;doc.body.appendChild(caixa);
        // Cinto de segurança: o form nunca envia sozinho (sem isso, um erro no
        // script mandaria os dados na URL da própria página).
        doc.getElementById('pck-form').setAttribute('onsubmit','return false');
        prepararCampos(caixa);
        dlg=caixa;
        return true;
      }catch(e){
        quebrado=true;
        if(caixa&&caixa.parentNode)caixa.parentNode.removeChild(caixa);
        return false;
      }
    }

    function prepararCampos(caixa){
      campos={nome:doc.getElementById('pck-nome'),wa:doc.getElementById('pck-whatsapp'),
        hp:doc.getElementById('pck-website'),err:doc.getElementById('pck-err')};
      telefone=wlWhatsappPais(doc.getElementById('pck-pais'),doc.getElementById('pck-ddi-view'),campos.wa);
      caixa.querySelector('[data-pck-fechar]').addEventListener('click',function(){caixa.close();});
      // Clique fora da caixa (no fundo escuro) fecha.
      caixa.addEventListener('click',function(e){if(e.target===caixa)caixa.close();});
      caixa.addEventListener('close',function(){if(origemFoco&&origemFoco.focus)origemFoco.focus();});
      [campos.nome,campos.wa].forEach(function(c){c.addEventListener('input',function(){c.removeAttribute('aria-invalid');});});
      doc.getElementById('pck-form').addEventListener('submit',aoEnviar);
    }

    function irPara(destino){
      // Ainda dentro do clique: o navegador deixa abrir a aba nova. Bloqueou? Vai na mesma aba.
      var aba=window.open(destino,'_blank');
      if(aba){try{aba.opener=null;}catch(x){}}else{location.href=destino;}
    }

    function erro(msg,campo){
      campos.err.textContent=msg||'';
      [campos.nome,campos.wa].forEach(function(c){c.removeAttribute('aria-invalid');});
      if(campo){campo.setAttribute('aria-invalid','true');campo.focus();}
    }

    function abrir(link){
      atual={href:link.href,meio:meioDoLink(link.href)};
      origemFoco=link;
      doc.getElementById('pck-meio').textContent=ROTULOS[atual.meio];
      doc.getElementById('pck-sub').textContent=atual.meio==='cartao'
        ?'Preencha para seguir ao pagamento seguro na Hotmart. Seu nome e celular já chegam preenchidos lá.'
        :'Preencha para seguir ao pagamento seguro. Se algo travar no caminho, nossa equipe te chama no WhatsApp para ajudar.';
      var salvo=lerLocal();
      if(!campos.nome.value&&salvo.nome)campos.nome.value=salvo.nome;
      erro('');
      dlg.showModal();
      var vazio=[campos.nome,campos.wa].filter(function(c){return !c.value.trim();})[0];
      (vazio||campos.nome).focus();
    }

    function aoEnviar(e){
      e.preventDefault();
      try{processar();}
      catch(x){
        // Qualquer erro aqui não pode custar a venda: segue para o checkout sem os dados.
        try{dlg.close();}catch(y){}
        irPara(atual.href);
      }
    }

    function processar(){
      var nome=campos.nome.value.trim().replace(/\s+/g,' '),erroWa=telefone.validar();
      if(!nome)return erro('Informe seu nome.',campos.nome);
      if(erroWa)return erro(erroWa,campos.wa);
      erro('');
      var dados={nome:nome,whatsapp:telefone.valor(),pais:telefone.pais()};
      var destino=linkFinal(atual.href,dados,location.search);
      if(!campos.hp.value){
        enviar({nome:nome,whatsapp:dados.whatsapp,pais:dados.pais,meio:atual.meio,checkout:atual.href,
          website:'',utm:utmDa(location.search)});
        gravarLocal(dados);
        // Sem dado pessoal no GTM: só o evento e a forma de pagamento.
        try{(window.dataLayer=window.dataLayer||[]).push({event:'pre_checkout_lead',forma_pagamento:atual.meio});}catch(x){}
      }
      dlg.close();
      irPara(destino);
    }

    links.forEach(function(a){
      a.addEventListener('click',function(e){
        // Ctrl/Cmd/Shift/botão do meio: a pessoa quer abrir do jeito dela; não atrapalha.
        if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
        if(!montar())return;
        e.preventDefault();
        try{abrir(a);}catch(x){irPara(a.href);}
      });
    });
  }

  return {meioDoLink:meioDoLink,linkFinal:linkFinal,utmDa:utmDa,iniciar:iniciar};
})();
if(typeof document!=='undefined')PreCheckout.iniciar(document);
