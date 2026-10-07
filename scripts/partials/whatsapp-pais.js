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
