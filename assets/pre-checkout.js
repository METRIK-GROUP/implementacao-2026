/* GERADO por scripts/build-pre-checkout.mjs a partir de scripts/partials/. Não edite à mão. */
(function(){
// ===== WhatsApp com seletor de país (Brasil é o padrão) =====
// DADOS: código ISO | DDI | nome em pt-BR, gerado da libphonenumber-js, a mesma
// biblioteca que valida no servidor (launch-dashboard: src/lib/waitlist/telefone.ts).
// Brasil: máscara (11) 99999-9999 e envio de DDD + número, como sempre.
// Outro país: número livre, enviado como digitado junto com o código do país.
// Digitar "+351…" com Brasil selecionado troca o país sozinho (DDIs não são
// prefixo um do outro, então o primeiro que casar é o certo).
function wlWhatsappPais(sel,view,wa){
  var DADOS='AF|93|Afeganistão;ZA|27|África do Sul;AL|355|Albânia;DE|49|Alemanha;AD|376|Andorra;AO|244|Angola;AI|1|Anguila;AG|1|Antígua e Barbuda;SA|966|Arábia Saudita;DZ|213|Argélia;AR|54|Argentina;AM|374|Armênia;AW|297|Aruba;AU|61|Austrália;AT|43|Áustria;AZ|994|Azerbaijão;BS|1|Bahamas;BD|880|Bangladesh;BB|1|Barbados;BH|973|Barein;BE|32|Bélgica;BZ|501|Belize;BJ|229|Benin;BM|1|Bermudas;BY|375|Bielorrússia;BO|591|Bolívia;BA|387|Bósnia e Herzegovina;BW|267|Botsuana;BR|55|Brasil;BN|673|Brunei;BG|359|Bulgária;BF|226|Burquina Faso;BI|257|Burundi;BT|975|Butão;CV|238|Cabo Verde;CM|237|Camarões;KH|855|Camboja;CA|1|Canadá;QA|974|Catar;KZ|7|Cazaquistão;TD|235|Chade;CL|56|Chile;CN|86|China;CY|357|Chipre;VA|39|Cidade do Vaticano;CO|57|Colômbia;KM|269|Comores;CD|243|Congo - Kinshasa;KP|850|Coreia do Norte;KR|82|Coreia do Sul;CI|225|Costa do Marfim;CR|506|Costa Rica;HR|385|Croácia;CU|53|Cuba;CW|599|Curaçao;DK|45|Dinamarca;DJ|253|Djibuti;DM|1|Dominica;EG|20|Egito;SV|503|El Salvador;AE|971|Emirados Árabes Unidos;EC|593|Equador;ER|291|Eritreia;SK|421|Eslováquia;SI|386|Eslovênia;ES|34|Espanha;SZ|268|Essuatíni;US|1|Estados Unidos;EE|372|Estônia;ET|251|Etiópia;FJ|679|Fiji;PH|63|Filipinas;FI|358|Finlândia;FR|33|França;GA|241|Gabão;GM|220|Gâmbia;GH|233|Gana;GE|995|Geórgia;GI|350|Gibraltar;GD|1|Granada;GR|30|Grécia;GL|299|Groenlândia;GP|590|Guadalupe;GU|1|Guam;GT|502|Guatemala;GG|44|Guernsey;GY|592|Guiana;GF|594|Guiana Francesa;GN|224|Guiné;GQ|240|Guiné Equatorial;GW|245|Guiné-Bissau;HT|509|Haiti;HN|504|Honduras;HK|852|Hong Kong, RAE da China;HU|36|Hungria;YE|967|Iêmen;CX|61|Ilha Christmas;AC|247|Ilha de Ascensão;IM|44|Ilha de Man;NF|672|Ilha Norfolk;AX|358|Ilhas Aland;KY|1|Ilhas Cayman;CC|61|Ilhas Cocos (Keeling);CK|682|Ilhas Cook;FO|298|Ilhas Faroé;FK|500|Ilhas Malvinas;MP|1|Ilhas Marianas do Norte;MH|692|Ilhas Marshall;SB|677|Ilhas Salomão;TC|1|Ilhas Turcas e Caicos;VI|1|Ilhas Virgens Americanas;VG|1|Ilhas Virgens Britânicas;IN|91|Índia;ID|62|Indonésia;IR|98|Irã;IQ|964|Iraque;IE|353|Irlanda;IS|354|Islândia;IL|972|Israel;IT|39|Itália;JM|1|Jamaica;JP|81|Japão;JE|44|Jersey;JO|962|Jordânia;XK|383|Kosovo;KW|965|Kuwait;LA|856|Laos;LS|266|Lesoto;LV|371|Letônia;LB|961|Líbano;LR|231|Libéria;LY|218|Líbia;LI|423|Liechtenstein;LT|370|Lituânia;LU|352|Luxemburgo;MO|853|Macau, RAE da China;MK|389|Macedônia do Norte;MG|261|Madagascar;MY|60|Malásia;MW|265|Malaui;MV|960|Maldivas;ML|223|Mali;MT|356|Malta;MA|212|Marrocos;MQ|596|Martinica;MU|230|Maurício;MR|222|Mauritânia;YT|262|Mayotte;MX|52|México;MM|95|Mianmar (Birmânia);FM|691|Micronésia;MZ|258|Moçambique;MD|373|Moldávia;MC|377|Mônaco;MN|976|Mongólia;ME|382|Montenegro;MS|1|Montserrat;NA|264|Namíbia;NR|674|Nauru;NP|977|Nepal;NI|505|Nicarágua;NE|227|Níger;NG|234|Nigéria;NU|683|Niue;NO|47|Noruega;NC|687|Nova Caledônia;NZ|64|Nova Zelândia;OM|968|Omã;NL|31|Países Baixos;BQ|599|Países Baixos Caribenhos;PW|680|Palau;PA|507|Panamá;PG|675|Papua-Nova Guiné;PK|92|Paquistão;PY|595|Paraguai;PE|51|Peru;PF|689|Polinésia Francesa;PL|48|Polônia;PR|1|Porto Rico;PT|351|Portugal;KE|254|Quênia;KG|996|Quirguistão;KI|686|Quiribati;GB|44|Reino Unido;CF|236|República Centro-Africana;CG|242|República do Congo;DO|1|República Dominicana;RE|262|Reunião;RO|40|Romênia;RW|250|Ruanda;RU|7|Rússia;EH|212|Saara Ocidental;WS|685|Samoa;AS|1|Samoa Americana;SM|378|San Marino;SH|290|Santa Helena;LC|1|Santa Lúcia;BL|590|São Bartolomeu;KN|1|São Cristóvão e Névis;MF|590|São Martinho;PM|508|São Pedro e Miquelão;ST|239|São Tomé e Príncipe;VC|1|São Vicente e Granadinas;SC|248|Seicheles;SN|221|Senegal;SL|232|Serra Leoa;RS|381|Sérvia;SG|65|Singapura;SX|1|Sint Maarten;SY|963|Síria;SO|252|Somália;LK|94|Sri Lanka;SD|249|Sudão;SS|211|Sudão do Sul;SE|46|Suécia;CH|41|Suíça;SR|597|Suriname;SJ|47|Svalbard e Jan Mayen;TJ|992|Tadjiquistão;TH|66|Tailândia;TW|886|Taiwan;TZ|255|Tanzânia;CZ|420|Tchéquia;IO|246|Território Britânico do Oceano Índico;PS|970|Territórios palestinos;TL|670|Timor-Leste;TG|228|Togo;TK|690|Tokelau;TO|676|Tonga;TT|1|Trinidad e Tobago;TA|290|Tristão da Cunha;TN|216|Tunísia;TM|993|Turcomenistão;TR|90|Turquia;TV|688|Tuvalu;UA|380|Ucrânia;UG|256|Uganda;UY|598|Uruguai;UZ|998|Uzbequistão;VU|678|Vanuatu;VE|58|Venezuela;VN|84|Vietnã;WF|681|Wallis e Futuna;ZM|260|Zâmbia;ZW|263|Zimbábue';
  var TOPO=['BR','PT','US'];
  // DDI compartilhado por vários países: o mais provável quando a pessoa digita "+1…".
  var PREFERIDO={'1':'US','7':'RU','39':'IT','44':'GB','47':'NO','61':'AU','212':'MA','262':'RE','290':'SH','358':'FI','590':'GP','599':'CW'};
  var paises=DADOS.split(';').map(function(s){var p=s.split('|');return{c:p[0],d:p[1],n:p[2]};});
  var porCodigo={},porDdi={};
  paises.forEach(function(p){porCodigo[p.c]=p;if(!porDdi[p.d])porDdi[p.d]=p.c;});
  Object.keys(PREFERIDO).forEach(function(d){porDdi[d]=PREFERIDO[d];});
  function bandeira(c){return String.fromCodePoint(127397+c.charCodeAt(0),127397+c.charCodeAt(1));}
  function opcao(p){var o=document.createElement('option');o.value=p.c;o.textContent=bandeira(p.c)+' '+p.n+' (+'+p.d+')';return o;}
  function grupo(rotulo,lista){var g=document.createElement('optgroup');g.label=rotulo;lista.forEach(function(p){g.appendChild(opcao(p));});return g;}
  sel.textContent='';
  sel.appendChild(grupo('Mais comuns',TOPO.map(function(c){return porCodigo[c];})));
  sel.appendChild(grupo('Todos os países',paises));
  sel.value='BR';
  function ehBrasil(){return sel.value==='BR';}
  function digitos(){return wa.value.replace(/\D/g,'');}
  // Quem cola "+55 11 9…" ou "011 9…" não pode ter o número cortado: tira o
  // zero de discagem e o 55 ANTES de limitar a 11 dígitos.
  function semDdiBrasil(d){d=d.replace(/^0+/,'');return (d.length===12||d.length===13)&&d.indexOf('55')===0?d.slice(2):d;}
  function mascaraBrasil(d){
    d=d.replace(/^0+/,'');
    d=(d.length>11&&d.indexOf('55')===0?d.slice(2):d).slice(0,11);
    if(d.length===10)return '('+d.slice(0,2)+') '+d.slice(2,6)+'-'+d.slice(6);
    if(d.length>6)return '('+d.slice(0,2)+') '+d.slice(2,7)+'-'+d.slice(7);
    if(d.length>2)return '('+d.slice(0,2)+') '+d.slice(2);
    return d.length?'('+d:'';
  }
  function atualizar(){
    var p=porCodigo[sel.value]||porCodigo.BR;
    view.textContent=bandeira(p.c)+' +'+p.d;
    wa.placeholder=ehBrasil()?'(11) 99999-9999':'Número com código de área';
  }
  function aoDigitar(){
    var d=digitos();
    if(ehBrasil()&&wa.value.trim().charAt(0)==='+'){
      if(d.indexOf('55')===0){wa.value=mascaraBrasil(d.slice(2));return;}
      for(var n=1;n<=3&&n<=d.length;n++){
        var c=porDdi[d.slice(0,n)];
        if(c){sel.value=c;anterior=c;atualizar();wa.value=d.slice(n);return;}
      }
      wa.value='+'+d; // ainda digitando o DDI: só "+" e números
      return;
    }
    if(ehBrasil())wa.value=mascaraBrasil(d);
    else wa.value=wa.value.replace(/[^\d\s()+.-]/g,'').replace(/^\s+/,'').slice(0,24);
  }
  wa.addEventListener('input',aoDigitar);
  var anterior=sel.value;
  sel.addEventListener('change',function(){
    atualizar();
    // Número de outro país não vira número brasileiro: ao voltar para o Brasil, limpa.
    // Indo para outro país, tira a máscara brasileira e deixa só os dígitos.
    if(ehBrasil())wa.value=anterior==='BR'?mascaraBrasil(digitos()):'';
    else if(anterior==='BR')wa.value=digitos();
    anterior=sel.value;
    wa.focus();
  });
  atualizar();
  return {
    pais:function(){return sel.value;},
    // Mensagem de erro, ou '' quando o número serve (o servidor valida de novo, por país).
    validar:function(){
      var d=digitos();
      if(!d)return 'Informe seu WhatsApp.';
      if(ehBrasil()){d=semDdiBrasil(d);return d.length===10||d.length===11?'':'Informe um WhatsApp válido com DDD.';}
      return d.length>=6&&d.length<=15?'':'Informe um WhatsApp válido para o país escolhido.';
    },
    valor:function(){return ehBrasil()?semDdiBrasil(digitos()):wa.value.trim();}
  };
}

// ===== PRÉ-CHECKOUT: nome, e-mail e WhatsApp antes do pagamento =====
// Clique em qualquer botão que leva ao Asaas (PIX), à Hotmart (cartão) ou à
// TMB (boleto) abre esta janela. Os dados vão para o painel (launch-dashboard,
// /api/public/pre-checkout) e a pessoa segue para o pagamento. Quem passar
// 30 min sem pagar vira "Carrinho abandonado" na Clint.
//
// Três decisões que valem entender:
// 1. A venda nunca espera o painel. O envio sai por sendBeacon (ou fetch com
//    keepalive), sem aguardar resposta, e o checkout abre na hora. Painel fora
//    do ar = lead perdido, nunca venda perdida.
// 2. Só a Hotmart aceita dados pelo link (name, email, phoneac, phonenumber;
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
  var EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      u.searchParams.set('email',dados.email);
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
  function gravarLocal(d){try{localStorage.setItem(CHAVE_LOCAL,JSON.stringify({nome:d.nome,email:d.email}));}catch(e){}}

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
        '<div class="pck-f"><label for="pck-email">E-mail</label>'+
          '<input class="pck-i" id="pck-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="voce@exemplo.com" maxlength="254" required></div>'+
        '<div class="pck-f"><label for="pck-whatsapp">WhatsApp</label>'+
          '<div class="pck-tel"><div class="pck-ddi"><span id="pck-ddi-view" aria-hidden="true">🇧🇷 +55</span>'+
            '<select id="pck-pais" name="pais" autocomplete="country" aria-label="País do seu WhatsApp"><option value="BR" selected>🇧🇷 Brasil (+55)</option></select></div>'+
          '<input class="pck-i" id="pck-whatsapp" name="whatsapp" type="tel" autocomplete="tel-national" inputmode="tel" placeholder="(11) 99999-9999" required></div></div>'+
        '<div class="pck-hp" aria-hidden="true"><label for="pck-website">Não preencha</label>'+
          '<input id="pck-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>'+
        '<p class="pck-err" id="pck-err" role="alert" aria-live="assertive"></p>'+
        '<button class="pr-btn primary pck-go" type="submit">Continuar para o pagamento</button>'+
      '</form>'+
      '<p class="pck-note">Seus dados são usados só para falar com você sobre a sua inscrição, por e-mail e WhatsApp.</p>'+
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
      campos={nome:doc.getElementById('pck-nome'),email:doc.getElementById('pck-email'),wa:doc.getElementById('pck-whatsapp'),
        hp:doc.getElementById('pck-website'),err:doc.getElementById('pck-err')};
      telefone=wlWhatsappPais(doc.getElementById('pck-pais'),doc.getElementById('pck-ddi-view'),campos.wa);
      caixa.querySelector('[data-pck-fechar]').addEventListener('click',function(){caixa.close();});
      // Clique fora da caixa (no fundo escuro) fecha.
      caixa.addEventListener('click',function(e){if(e.target===caixa)caixa.close();});
      caixa.addEventListener('close',function(){if(origemFoco&&origemFoco.focus)origemFoco.focus();});
      [campos.nome,campos.email,campos.wa].forEach(function(c){c.addEventListener('input',function(){c.removeAttribute('aria-invalid');});});
      doc.getElementById('pck-form').addEventListener('submit',aoEnviar);
    }

    function irPara(destino){
      // Ainda dentro do clique: o navegador deixa abrir a aba nova. Bloqueou? Vai na mesma aba.
      var aba=window.open(destino,'_blank');
      if(aba){try{aba.opener=null;}catch(x){}}else{location.href=destino;}
    }

    function erro(msg,campo){
      campos.err.textContent=msg||'';
      [campos.nome,campos.email,campos.wa].forEach(function(c){c.removeAttribute('aria-invalid');});
      if(campo){campo.setAttribute('aria-invalid','true');campo.focus();}
    }

    function abrir(link){
      atual={href:link.href,meio:meioDoLink(link.href)};
      origemFoco=link;
      doc.getElementById('pck-meio').textContent=ROTULOS[atual.meio];
      doc.getElementById('pck-sub').textContent=atual.meio==='cartao'
        ?'Preencha para seguir ao pagamento seguro na Hotmart. Seus dados já chegam preenchidos lá.'
        :'Preencha para seguir ao pagamento seguro. Se algo travar no caminho, nossa equipe te chama no WhatsApp para ajudar.';
      var salvo=lerLocal();
      if(!campos.nome.value&&salvo.nome)campos.nome.value=salvo.nome;
      if(!campos.email.value&&salvo.email)campos.email.value=salvo.email;
      erro('');
      dlg.showModal();
      var vazio=[campos.nome,campos.email,campos.wa].filter(function(c){return !c.value.trim();})[0];
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
      var nome=campos.nome.value.trim().replace(/\s+/g,' '),email=campos.email.value.trim().toLowerCase(),erroWa=telefone.validar();
      if(!nome)return erro('Informe seu nome.',campos.nome);
      if(!EMAIL_RE.test(email))return erro('Informe um e-mail válido.',campos.email);
      if(erroWa)return erro(erroWa,campos.wa);
      erro('');
      var dados={nome:nome,email:email,whatsapp:telefone.valor(),pais:telefone.pais()};
      var destino=linkFinal(atual.href,dados,location.search);
      if(!campos.hp.value){
        enviar({nome:nome,email:email,whatsapp:dados.whatsapp,pais:dados.pais,meio:atual.meio,checkout:atual.href,
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
})();
