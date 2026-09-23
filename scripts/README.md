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
| `upgrade/` | Preço de R$ 1.997, checkouts da oferta de upgrade e confirmação de e-mail de aluno antes do pagamento |

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
