# Time-Sense

Um site em Next.js com mini jogos de percepcao:

- **Jogo de memoria de cores**: memorize uma cor por vez e tente recria-la com controles HSB.
- **Pare no tempo certo**: veja um tempo alvo, inicie um cronometro oculto e tente parar no instante exato.
- **Memory Dots**: memorize a ordem em que as bolinhas aparecem e clique nelas na sequencia correta.
- **Motion Prediction**: observe uma bola em movimento, acompanhe a fase invisivel e clique onde ela terminou.

O projeto foi feito com foco em codigo simples, interface responsiva e componentes faceis de estudar.

## Tecnologias

- Next.js com App Router
- React
- JavaScript
- Tailwind CSS
- Sem backend

## Como Rodar

Instale as dependencias:

```bash
npm install
```

Inicie o servidor local:

```bash
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

Para gerar uma build de producao:

```bash
npm run build
```

## Tela Inicial

Ao abrir o site, o usuario escolhe entre os jogos:

1. **Jogo de memoria de cores**
2. **Pare no tempo certo**
3. **Memory Dots**
4. **Motion Prediction**

O botao **Trocar jogo** permite voltar para essa escolha sem remover nenhum jogo.

## Jogo de Memoria de Cores

Neste jogo, o sistema gera 5 cores aleatorias. O jogador ve uma cor por vez, tenta memorizar e depois recria usando sliders.

### Fluxo

1. Escolha a dificuldade.
2. O jogo mostra a cor 1.
3. A cor fica visivel pelo tempo da dificuldade.
4. A cor some.
5. O jogador ajusta:
   - Matiz
   - Saturacao
   - Brilho
6. O jogador confirma a tentativa.
7. O jogo mostra o feedback daquela cor.
8. O jogador avanca para a proxima cor.
9. Depois da quinta cor, o resultado final mostra a soma total.

### Dificuldades

- **Facil**: 5 segundos para memorizar cada cor.
- **Medio**: 3 segundos para memorizar cada cor.
- **Dificil**: 1.5 segundos para memorizar cada cor.

### Sliders Coloridos

Os controles mostram visualmente o efeito de cada ajuste:

- **Matiz**: gradiente completo do circulo cromatico.
- **Saturacao**: vai da cor apagada ate a cor viva.
- **Brilho**: vai do escuro ao claro.

A previa grande da cor escolhida atualiza em tempo real.

### Pontuacao

Cada cor vale de **0 a 10 pontos**.

A comparacao usa distancia RGB entre:

- cor original;
- cor escolhida pelo jogador.

O total maximo e **50 pontos**.

### Resultado Por Cor

Depois de cada tentativa, o jogo mostra:

- pontuacao daquela cor;
- cor original;
- cor escolhida;
- diferenca visual entre as duas;
- botao para ir para a proxima cor ou ver o resultado final.

## Pare no Tempo Certo

Neste jogo, o sistema gera um tempo alvo aleatorio entre **0 e 10 segundos**. O jogador ve o tempo antes de comecar, mas nao ve o cronometro correndo.

### Fluxo

1. O jogo gera um tempo alvo, por exemplo `6.42s`.
2. O usuario clica em **Iniciar**.
3. O cronometro comeca a correr escondido.
4. O usuario clica em **Parar** quando achar que chegou ao tempo alvo.
5. O jogo mostra o resultado da rodada.

### Medicao

O tempo e medido com:

```js
performance.now()
```

Isso evita depender de `Date.now()` e melhora a precisao da rodada.

### Pontuacao

A pontuacao vai de **0 a 100 pontos**.

Formula:

```js
score = Math.max(0, Math.round(100 - diferenca * 20));
```

Exemplos:

| Alvo | Parou em | Diferenca | Pontuacao |
| --- | --- | --- | --- |
| 5.00s | 5.10s | 0.10s | 98 |
| 5.00s | 5.80s | 0.80s | 84 |
| 5.00s | 8.00s | 3.00s | 40 |
| 5.00s | 10.00s | 5.00s | 0 |

### Resultado

Depois de parar, o jogo mostra cards com:

- tempo alvo;
- tempo parado;
- diferenca;
- pontuacao.

O botao **Jogar novamente** gera um novo tempo alvo.

## Motion Prediction

Neste jogo, uma bola azul se move continuamente pela arena e rebate nas paredes. Depois ela desaparece, continua se movendo invisivelmente por mais um tempo e finalmente para sem revelar a posicao. O jogador clica onde acredita que ela terminou, e so entao o jogo mostra o resultado.

### Fluxo

1. O usuario escolhe a dificuldade.
2. A bola azul aparece e se move suavemente.
3. A bola rebate nas paredes sem sair da arena.
4. Depois de um tempo aleatorio, ela desaparece.
5. Enquanto invisivel, ela continua se movendo e rebatendo.
6. Depois da fase invisivel, ela para sem aparecer.
7. O jogador clica onde acredita que a bola terminou.
8. So depois do clique, a rodada revela distancia, precisao, posicao real, clique do usuario e pontuacao.
9. Depois de 12 rodadas, o jogo mostra a pontuacao final.

### Dificuldades

- **Easy**: movimento mais lento e janela mais confortavel.
- **Medium**: velocidade media e tempo variavel.
- **Hard**: movimento rapido e menos tempo para ler a trajetoria.
- **Extreme**: muito rapido e com angulos mais agressivos.

### Medicao e Movimento

O jogo usa:

```js
performance.now()
requestAnimationFrame()
```

Enquanto a bola esta visivel ou invisivel, a animacao e atualizada com `requestAnimationFrame` e delta time. A posicao e a velocidade ficam dentro da arena com bounce nas bordas, e o momento de parada e calculado com `performance.now()`.

### Pontuacao

Cada rodada vale de **0 a 100 pontos**.

Formula:

```js
precision = Math.max(0, 100 - distance / 5);
score = Math.round(precision);
```

Quanto menor a distancia entre o clique e a posicao real, maior a pontuacao.

### Resultado

Ao final da rodada, o jogo mostra:

- posicao real;
- clique do jogador;
- diferenca em pixels;
- precisao percentual;
- pontuacao da rodada;
- linha ligando a posicao real ao clique.

## Memory Dots

Neste jogo, o sistema adiciona uma nova bolinha a cada rodada. As bolinhas antigas continuam exatamente nas mesmas posicoes durante toda a partida, mas o desafio principal e lembrar a ordem em que elas apareceram.

### Fluxo

1. O usuario inicia a partida.
2. A rodada 1 mostra uma bolinha.
3. A bolinha continua visivel.
4. O usuario clica nela.
5. Se acertar, a rodada 2 mostra a bolinha antiga e uma nova bolinha.
6. O usuario precisa clicar todas as bolinhas na ordem em que foram adicionadas.
7. A sequencia cresce ate o usuario errar.

### Regras

- Cada rodada adiciona apenas uma nova posicao.
- As posicoes antigas nunca mudam durante a partida.
- O usuario deve clicar na ordem correta.
- As bolinhas permanecem visiveis durante a resposta.
- Um clique fora da bolinha esperada encerra a partida.
- A margem de acerto e de 40px ao redor da bolinha.

### Modos

- **Normal**: mostra numeros dentro das bolinhas para ajudar a acompanhar a ordem.
- **Hard**: remove os numeros; todas as bolinhas ficam iguais.

### Medicao e Recorde

O tempo total de sobrevivencia e medido com:

```js
performance.now()
```

O jogo tambem salva um recorde local simples no navegador usando `localStorage`.

### Tela Final

Quando o usuario erra, o jogo mostra:

- rodadas completadas;
- tempo total sobrevivido;
- maior sequencia alcancada;
- botao para jogar novamente.

## Estrutura Principal

```text
src/
  app/
    globals.css
    layout.jsx
    page.jsx
  components/
    MemoryDotsGame.jsx
    MotionPredictionGame.jsx
  lib/
    colors.js
```

### Arquivos Importantes

- `src/app/page.jsx`: tela inicial, jogo de cores e jogo de tempo.
- `src/components/MemoryDotsGame.jsx`: jogo Memory Dots.
- `src/components/MotionPredictionGame.jsx`: jogo Motion Prediction.
- `src/app/globals.css`: estilos globais e sliders coloridos.
- `src/lib/colors.js`: geracao de cores, conversao HSB/RGB e calculo de pontuacao.

## Scripts

```bash
npm run dev
npm run build
```

## Observacoes

- O jogo nao usa backend.
- O cronometro real do jogo de tempo fica oculto durante a rodada.
- O jogo de cores memoriza uma cor por vez.
- O Memory Dots mantem as posicoes antigas fixas durante a partida.
- O Motion Prediction mantem a fisica ativa durante a fase invisivel e calcula a posicao final de parada.
- O botao **Jogar novamente** reseta o estado do jogo atual.
