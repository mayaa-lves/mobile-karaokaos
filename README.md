# 🎤 Karaokaos

**Karaokaos** é um jogo de karaokê multiplayer desenvolvido como projeto da disciplina de **Dispositivos Móveis**, com o objetivo de demonstrar o uso do **microfone como sensor em dispositivos móveis**.

A proposta é transformar dois celulares em microfones/controladores enquanto uma interface principal, exibida no computador, conduz a partida com letras sincronizadas, pontuação, análise de afinação e desafios especiais.

> 🚧 Projeto em desenvolvimento.

---

## 🎮 Como funciona

O Karaokaos será composto por três partes principais:

### 📱 Aplicativo Mobile

Cada jogador utiliza seu próprio celular para:

- entrar em uma sala;
- identificar-se como jogador;
- conceder acesso ao microfone;
- capturar informações da voz;
- enviar os dados para a partida em tempo real.

O aplicativo mobile está sendo desenvolvido com **React Native + Expo**.

### 💻 Interface principal

O computador funciona como a tela compartilhada da partida.

Nele serão exibidos:

- música selecionada;
- letra sincronizada;
- jogador responsável por cada trecho;
- pontuação;
- feedback de afinação;
- combos;
- desafios Chaos;
- resultado final.

### 🌐 Comunicação

Os celulares e o computador serão conectados por um servidor responsável pela comunicação em tempo real entre os jogadores e a partida.

A arquitetura planejada é:

```text
📱 Jogador 1 ───┐
                │
                ▼
             🌐 Servidor ───── 💻 Karaokaos
                ▲
                │
📱 Jogador 2 ───┘
```

---

## 🎵 Mecânica da partida

A música é reproduzida integralmente durante a partida utilizando sua versão instrumental.

Os trechos da música são distribuídos entre os jogadores:

```text
🟣 Jogador 1 → canta um trecho
🟠 Jogador 2 → canta o próximo
🟣🟠 Dueto   → ambos cantam
```

Durante o trecho de um jogador, somente sua entrada de áudio é considerada para aquela parte da pontuação. Isso ajuda a reduzir interferências entre os dois microfones.

A partida continua do início ao fim da música, sem divisão em rodadas.

---

## ⚡ Chaos Challenges

Durante a música, desafios especiais aparecem temporariamente sem interromper a letra ou o instrumental.

Alguns exemplos planejados:

- cantar mais baixo;
- sustentar uma nota;
- substituir uma palavra;
- cantar determinado trecho em dueto.

Os desafios possuem duração limitada e podem conceder pontos extras.

---

## 🛠️ Tecnologias

Tecnologias planejadas para o projeto:

- **React Native**
- **Expo**
- **TypeScript**
- **React**
- **Node.js**
- **Socket.IO**
- **Expo Audio**

A arquitetura e as tecnologias podem sofrer alterações durante o desenvolvimento do MVP.

---

## 📂 Estrutura planejada

```text
Karaokaos/
│
├── mobile-karaokaos/    # Aplicativo dos jogadores
├── server-karaokaos/    # Servidor e comunicação em tempo real
└── web-karaokaos/       # Interface principal do computador
```

Atualmente, o desenvolvimento está concentrado no aplicativo mobile.

---

## 🚧 Status

### Em desenvolvimento

Primeira etapa:

- [x] Criar projeto Expo
- [ ] Criar interface inicial do aplicativo
- [ ] Solicitar permissão do microfone
- [ ] Capturar áudio pelo dispositivo
- [ ] Analisar dados do microfone
- [ ] Criar sistema de salas
- [ ] Conectar dois jogadores
- [ ] Integrar aplicativo e interface do computador
- [ ] Implementar música e letras sincronizadas
- [ ] Implementar sistema de pontuação
- [ ] Implementar Chaos Challenges
- [ ] Criar tela de resultado final

---

## 🎯 Objetivo acadêmico

O projeto foi desenvolvido para demonstrar, de maneira prática e interativa, como o **microfone de um dispositivo móvel pode funcionar como sensor**, transformando ondas sonoras em dados digitais que podem ser processados por uma aplicação.

Além da captura de áudio, o projeto explora conceitos como análise de frequência, comunicação em tempo real e integração entre dispositivos.

---

## 👥 Desenvolvedores

Projeto desenvolvido por:

- **[Nome]**
- **[Nome]**

Curso Técnico em Desenvolvimento de Sistemas  
Disciplina de Dispositivos Móveis

---

## 📄 Licença

Projeto desenvolvido para fins educacionais.