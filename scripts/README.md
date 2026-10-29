# Como esse site é montado

## A regra

**`vendas.html` é a única página que se edita à mão.** Todas as outras são geradas
a partir dele por script.

```
vendas.html  ──┬──►  lista-de-espera/index.html
               └──►  upgrade/index.html
```

Quem edita uma variante à mão perde a edição na próxima geração — e, pior, a
variante começa a atrasar em relação ao site principal. Foi o que aconteceu com a
antiga `/alunos/`: ela parou em 25/06/2026 e o `vendas.html` seguiu com mais 77
commits. Por três meses o aluno viu uma página três meses velha.

## O que cada variante muda

| Variante | O que muda em relação ao `vendas.html` |
|---|---|
| `lista-de-espera/` | Sem checkout e sem preço; no lugar, formulário de lista de espera |
| `upgrade/` | Preço de R$ 1.997, checkouts da oferta de upgrade, confirmação de e-mail de aluno antes do pagamento e, ao lado, o card da Renovação do PDP (R$ 997) para comparar |

Fora isso, o conteúdo é o mesmo. As duas também recebem dois ajustes técnicos:
caminhos de imagem absolutos (porque vivem em subpastas) e `noindex` (para não
competir com o site principal no Google).

## Você não precisa fazer nada além de editar o vendas.html

Edite o `vendas.html` e envie normalmente. O robô do GitHub regenera as variantes
e commita a correção sozinho, em cerca de um minuto (verificado em 23/09/2026,
com a escrita para Actions liberada na organização).

Opcional, só por conveniência: rodando o comando abaixo uma vez, as páginas são
geradas já no seu commit, e o robô não precisa criar um commit extra depois.

```bash
git config core.hooksPath .githooks
```

Isso também adianta o aviso: se uma âncora sumir do `vendas.html`, você descobre
na hora do commit, e não depois do envio.

## Rodando

```bash
node scripts/build.mjs              # gera todas as variantes
node scripts/build-upgrade.mjs      # só a de upgrade
node scripts/build-lista-de-espera.mjs
```

No GitHub isso roda sozinho: todo push que toca `vendas.html` ou `scripts/`
dispara `.github/workflows/build-variantes.yml`, que regenera as variantes e
commita o que mudou.

## “Se eu mudar X, a página de upgrade acompanha?”

```bash
node scripts/simular-edicoes.mjs
```

Aplica as edições típicas de uma reabertura de turma e mostra o que acontece com
a página de upgrade em cada uma. Não altera nada em definitivo.

A regra que sai dali:

| Você edita | A página de upgrade |
|---|---|
| Texto, imagem, seção nova, depoimento, FAQ, data da barra | acompanha sozinha |
| Preço, parcela, link de checkout, selo do bloco, contagem regressiva | o build para e avisa |

A segunda linha é de propósito: é exatamente no bloco de compra que as duas
páginas precisam ser diferentes. Se o `vendas.html` mudar ali, alguém precisa
decidir o que o upgrade passa a mostrar — e enquanto ninguém decide, o build
recusa publicar um preço adivinhado.

## A virada de preço de 18/10 às 23h59

Decisão do Rodrigo em 14/10/2026, ajustada em 18/10: o valor do evento (12x de
R$ 390 ou R$ 3.997 no PIX, R$ 1.000 a menos) vale até **domingo 18/10 às 23h59
(Brasília)**. À 0h de segunda 19/10 entra o valor cheio: **12x de R$ 490** (total R$ 5.880) ou
**R$ 4.997 no PIX**, com checkouts próprios na Asaas, Hotmart e TMB.

Os dois conjuntos de valores e links moram em `scripts/lib/oferta.mjs`. É o
único lugar a mudar se um valor ou link trocar.

Como a troca acontece, em duas camadas:

| Camada | O que faz | Quando |
|---|---|---|
| Script dentro do `vendas.html` | Troca os textos e os links do bloco de compra na tela, lendo `data-cheio` e `data-href-cheio` | Na hora exata, no relógio de quem está olhando, mesmo com a página já aberta |
| Robô `.github/workflows/virar-preco-cheio.yml` | Roda `node scripts/virar-preco-cheio.mjs`, que grava o valor cheio no HTML (inclusive no schema.org), regenera as variantes e republica o `index.html`. Depois se apaga. | Cron de 19/10 às 03:00 UTC (0h em Brasília). O GitHub costuma atrasar; não faz diferença, a página já virou sozinha |

Para ver o valor cheio antes da hora: abra a página com `?preco=cheio`.

No domingo, das 11h25 (quando os botões de compra aparecem) até 23h59, a página
mostra o prazo do desconto de R$ 1.000 com um relógio em dois lugares: na barra
do topo (bloco `<!-- DESCONTO EVENTO -->`) e logo abaixo dos botões (dentro do
bloco da virada). Para ver antes da hora: `?desconto=on`. O robô da virada
apaga os dois.

Se na segunda 19/10 de manhã o `vendas.html` da main ainda tiver
`data-href-cheio`, o robô não rodou: Actions → "Virar para o preco cheio" →
Run workflow. Ou rode localmente `node scripts/virar-preco-cheio.mjs` e envie.

O teste `node --test scripts/testar-virada.mjs` confere que o `vendas.html`,
o script de gravação e os builds das variantes concordam entre si, antes e
depois da virada. Rodava no GitHub a cada push até a virada de 19/10; depois
dela o `vendas.html` já não tem o script da virada e o teste falha por
construção, então saiu do workflow. Para reaproveitar numa próxima turma,
volte o passo em `.github/workflows/build-variantes.yml`.

A página de upgrade não participa: ela tem preço próprio (R$ 1.997) e
`build-upgrade.mjs` tira a virada antes de montar as âncoras.

## O encerramento das matrículas de 30/10 às 23h59

Decisão do Rodrigo em 29/10/2026: as matrículas da Ed.8 vão até **sexta 30/10 às
23h59 (Brasília)**.

| Quando | O que a página faz |
|---|---|
| Sexta 30/10, o dia todo | A barra do topo fica vermelha: "Últimas horas: as matrículas encerram hoje, às 23h59", com relógio. O botão continua levando ao bloco de compra |
| Sábado 31/10, 0h | Quem abrir a raiz vai para `/lista-de-espera/` (sem checkout, com o formulário), levando UTMs e âncora. Quem estiver com a página aberta sai sozinho na virada; se estiver preenchendo a janela de pré-checkout, sai quando ela fechar |

As datas moram em `scripts/lib/encerramento.mjs`. Na página, são dois blocos
marcados no `vendas.html`: `<!-- ENCERRAMENTO -->` (no `<head>`, faz o
redirecionamento) e `<!-- ULTIMAS HORAS -->` (dentro da barra). Os builds da lista
de espera e do upgrade tiram os dois: na lista o redirecionamento seria loop, e o
upgrade não tem prazo.

Como no preço cheio, a troca acontece em duas camadas: o script da página faz na
hora exata, e o robô `.github/workflows/encerrar-matriculas.yml` (cron de 31/10 às
03:00 UTC) grava de vez: roda `node scripts/encerrar-matriculas.mjs`, que troca o
`index.html` pela página de redirecionamento (o mesmo modelo de 24/08) e apaga os
dois blocos do `vendas.html`, regenera as variantes e se apaga. Antes da hora o
script se recusa a rodar.

Para ver antes da hora: `?ultimas=on` mostra a barra de Últimas horas.

Se no sábado de manhã o `index.html` da main ainda tiver `<!-- ENCERRAMENTO -->`,
o robô não rodou: Actions → "Encerrar matriculas" → Run workflow.

O teste `node --test scripts/testar-encerramento.mjs` roda a cada push e sabe em
que fase está: antes do robô, simula o relógio (quinta, sexta, 23h59:59, sábado,
janela aberta) e o próprio robô numa cópia; depois, confere que a raiz ficou
como redirecionamento.

**Reabrir a próxima turma:** `cp vendas.html index.html` (depois de atualizar
datas e textos) volta a página de vendas para a raiz.

## Conferir se os botões de compra estão de pé

```bash
node scripts/checar-checkouts.mjs
```

Abre cada link de compra e confere se ele responde **e** se o valor é o esperado.

Vale rodar antes de divulgar a página para alguém e depois de mexer em oferta na
Hotmart, Asaas ou TMB. Uma oferta desativada não dá erro de rede: a página abre
normalmente e mostra "Oferta Indisponível" dentro dela, então só olhar se o
endereço responde não pega o problema. Foi assim que o boleto parcelado ficou
quebrado sem ninguém notar, até 23/09/2026.

### Ofertas fechadas não são defeito

Com as inscrições encerradas, as ofertas do site principal ficam desativadas de
propósito e respondem "Oferta Indisponível". O script sabe disso: enquanto
`INSCRICOES_ABERTAS` estiver `false` no topo dele, esses checkouts aparecem como
`.... oferta fechada (esperado)` em vez de falha.

**Na reabertura, vire essa chave para `true`.** Aí o script passa a cobrar que os
três checkouts do site principal estejam de pé — serve como checklist do dia.
(O robô de 17/10 às 23h faz isso sozinho ao publicar a página de vendas.)

A segunda chave, `FASE`, diz qual oferta da página de vendas está valendo:
`'evento'` até 18/10 às 23h59, `'cheia'` depois (o robô da virada troca). Com
`FASE = 'cheia'`, o script cobra os três checkouts da oferta cheia e **acusa
falha se algum checkout do evento continuar aberto**, porque aí alguém com o
link antigo ainda pagaria R$ 3.997.

A TMB só mostra o valor depois de informar o CPF, então o script confere apenas
se a oferta dela está de pé; o valor é conferido à mão.

### Boleto na página de upgrade: não tem

Decisão de 23/09/2026: para o público do upgrade não faz falta. O aluno tem PIX e
cartão 12x na página, e ainda encontra boleto à vista dentro do checkout da
Hotmart.

Para trazer o botão de volta um dia: em `build-upgrade.mjs`, troque o `cutBlock`
do boleto pelo `replaceOnce` comentado logo acima dele, e reative a entrada
correspondente em `checar-checkouts.mjs`.

### Renovação ao lado do upgrade

Desde 29/09/2026 o bloco de compra da página de upgrade tem dois cards:

| | Renovação PDP (esquerda) | Upgrade (direita, "melhor escolha") |
|---|---|---|
| Renovação do PDP, 1 ano de acesso, suporte no WhatsApp | sim | sim |
| Curso completo IA de Primeira | não | sim |
| Desafio de Implementação por 1 ano | não | sim |
| Dúvidas com o Rodrigo direto no WhatsApp | não | sim |
| Valor | R$ 997 (Hotmart, oferta `5bgwg9qj`) | R$ 1.997 no PIX (Asaas) ou 12x de R$ 197 (Hotmart, `atem2nx9`) |

No celular o upgrade aparece primeiro. O botão da renovação vai direto para a
Hotmart, sem a janela de e-mail: a janela protege o preço de aluno do upgrade,
e a renovação tem preço próprio.

Os itens das duas listas moram em `ITENS_RENOVACAO` e `ITENS_SO_NO_UPGRADE`, e
o link e o valor da renovação em `CHECKOUT_RENOVACAO` e `PRECO_RENOVACAO`, no
topo do `build-upgrade.mjs`. Mudou a oferta na Hotmart? Troque ali e em
`checar-checkouts.mjs`.

### O que cada forma de pagamento cobra de verdade (conferido em 29/09/2026)

| Onde o aluno paga | Upgrade | Renovação |
|---|---|---|
| Botão "Pagar no PIX" (Asaas) | R$ 1.997 | não tem |
| Hotmart, cartão 1x | R$ 1.997 | R$ 997 |
| Hotmart, cartão 2x a 12x | R$ 2.364 no total (12x R$ 197, juros por conta do produtor) | juros por conta do aluno (12x R$ 103,11) |
| Hotmart, Pix ou boleto | **R$ 2.364** | R$ 997 |

Por isso o PIX da página aponta para o Asaas: quem escolhe Pix dentro do
checkout da Hotmart paga R$ 367 a mais.

## Quando o build falha

Toda transformação é obrigatória. Se um trecho que o script procura não existe
mais no `vendas.html`, o build **falha** em vez de gerar uma página pela metade.
O erro diz qual transformação quebrou.

```
[preço: valor no PIX] âncora não encontrada em vendas.html:
      <p class="pr-pix-val fm">R$ 3.997</p>
```

Isso quer dizer: alguém mudou esse trecho no `vendas.html`. Ajuste a âncora no
script da variante — nunca edite o HTML gerado para "resolver rápido", porque a
próxima geração desfaz e a defasagem volta.

Além das âncoras, cada script termina com duas listas de verificação:

- **guardas** — o que não pode sobrar na página (ex.: o checkout da oferta cheia
  na página de upgrade);
- **exigências** — o que tem que estar lá (ex.: o preço de R$ 1.997 e os três
  botões com a confirmação de e-mail).

Se qualquer uma falhar, o arquivo não é escrito.

## A confirmação de e-mail da página de upgrade

O botão de pagamento abre uma janela pedindo o e-mail do aluno. A página pergunta
para `supabase/functions/verificar-aluno` se aquele e-mail tem a Certificação
Projeto de Primeira (inclusive com acesso já revogado — ex-aluno também pode fazer
o upgrade). Só depois abre o checkout.

Três decisões que valem entender:

1. **Se a verificação falhar, a venda passa.** Servidor fora do ar, internet ruim
   ou demora acima de 7 segundos liberam o checkout assim mesmo. Barrar um aluno
   de verdade custa mais do que deixar um não-aluno entrar.
2. **O `href` do botão continua sendo o checkout.** Se o JavaScript não rodar, o
   botão funciona como link comum e a venda acontece.
3. **Isso não é um cofre.** A página não é segredo e o endereço pode ser repassado.
   A confirmação filtra o caso comum, não um ataque.
