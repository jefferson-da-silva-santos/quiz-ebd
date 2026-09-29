# Quiz EBD — Classe Débora e Baraque

Site 100% estático para sortear alunos e fazer as 200 perguntas da revista na Escola Bíblica Dominical.
Sem login, sem servidor: tudo (placar, presença, progresso e ajustes) fica no `localStorage` do navegador.

## Rodando

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:5173
npm run build      # gera a pasta dist/ pronta para publicar
npm run preview    # serve o build localmente
```

A pasta `dist/` pode ir para Netlify, Vercel, GitHub Pages ou qualquer hospedagem estática
(o `base: './'` e o roteamento por hash dispensam configuração de servidor).

## Como usar na aula

1. **Ajustes → Presença**: desligue quem faltou hoje.
2. **Palco → Sortear aluno** (ou tecla **Espaço**): a roleta de fotos gira e para no sorteado.
3. Leia a pergunta e toque na alternativa que o aluno escolheu (ou teclas **1–4 / A–D**).
4. Revelação: *"A resposta… está… Exata! / Errada"* com confete, depois a justificativa.
5. **Sortear próximo aluno**. Errou o clique? **Desfazer resposta**.

No **Placar** dá para dar ou tirar pontos extras (+/−) e ver o histórico.

## Ajustes

| Opção | O que faz |
| --- | --- |
| Alunos: Aleatório / Em ordem | Aleatório usa um "saco" embaralhado: ninguém repete até todos os presentes responderem. Em ordem segue a lista, pulando ausentes. |
| Perguntas: Aleatório / Em ordem | Nunca repete uma pergunta já respondida até o banco (ou o filtro de lições) acabar; aí o ciclo recomeça sozinho. |
| Lições no sorteio | Filtra quais das 13 lições valem hoje. |
| Efeitos sonoros | Sons sintetizados (WebAudio), sem arquivos de áudio. |
| Dados | Exportar/importar backup `.json`, reiniciar perguntas, zerar placar, restaurar padrão. |

Os nomes podem ser editados (lápis) e dá para adicionar alunos visitantes.

## Fotos

As fotos estão em `public/pessoas/*.webp` (360×360). Rayson, Richardson, Alessandro, Kayque e a
segunda Júlia ainda não têm foto e aparecem com as iniciais. Para adicionar, coloque o `.webp` na pasta
e ajuste o terceiro campo em `src/data/people.ts` (ex.: `['rayson', 'Rayson', 'rayson']`), depois use
**Ajustes → Restaurar padrão** (ou limpe o localStorage) para recarregar a turma.

## Perguntas

`scripts/perguntas.txt` é a fonte. Depois de editar, rode `npm run questions` (Python 3) para
regerar `src/data/questions.json`. O script valida que existem 200 perguntas com 4 alternativas e gabarito.

## Estrutura

```
src/
  App.tsx                  shell: cenário, navegação, rotas, toasts, diálogo
  main.tsx                 fontes, Boxicons, AOS e estilos
  components/
    Stage.tsx              máquina de estados do palco (idle → drawing → question → revealing → result)
    Hero.tsx               cartaz tipográfico + painel de comando
    Roulette.tsx           roleta de fotos em requestAnimationFrame (sem re-render por quadro)
    QuestionView.tsx       pergunta e alternativas (atalhos 1–4 / A–D)
    RevealOverlay.tsx      "A resposta… está… Exata!/Errada" + confete
    ResultView.tsx         gabarito comentado e próximo sorteio
    Scoreboard.tsx         pódio, ranking, pontos extras e histórico
    SettingsPanel.tsx      modos, presença, lições, som e dados
    Avatar, Brand, NavBar, Controls, ConfirmDialog, Toasts, PersonSpotlight
  hooks/                   useQuizStore (useReducer + persistência), useHashRoute, useToast…
  lib/
    engine.ts              regras puras de sorteio e ranking
    storage.ts             localStorage com validação estrutural (dados corrompidos não quebram a app)
    confetti.ts            motor de confete em canvas, sem dependências
    sound.ts               efeitos WebAudio
    random.ts              aleatoriedade com crypto.getRandomValues
    types.ts               modelo de domínio
  data/                    perguntas (JSON gerado) e turma padrão
  styles/global.css        CSS puro com tokens, glassmorphism e responsividade até 320px
```

Stack: React 18 + TypeScript (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`),
Vite, CSS puro, Boxicons, AOS. Fontes self-hosted via Fontsource (funciona sem internet depois do build).
Acessível: foco visível, `role="switch"`, `<dialog>` nativo, `aria-live`, e respeita `prefers-reduced-motion`.
# quiz-ebd
