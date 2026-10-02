# 🎤 KaraoKaos — Mobile

Aplicativo mobile do **KaraoKaos**, desenvolvido para transformar o celular do jogador em um microfone conectado ao karaokê executado no computador.

O aplicativo captura o áudio do microfone em tempo real, analisa informações do sinal e envia os dados para o servidor durante a partida. Além disso, um trecho de aproximadamente 10 segundos da apresentação é gravado aleatoriamente e pode ser reproduzido ao final.

## ✨ Principais funcionalidades

- Entrada em salas por PIN;
- Identificação do jogador;
- Solicitação de permissão para acesso ao microfone;
- Captura de áudio em tempo real;
- Análise da intensidade do áudio por RMS;
- Detecção da frequência da voz em Hz;
- Comunicação em tempo real com o servidor;
- Interface visual que reage ao áudio captado;
- Sincronização do início e fim da partida;
- Gravação aleatória de aproximadamente 10 segundos;
- Reprodução do trecho gravado ao final.

## 🛠️ Tecnologias

- React Native
- TypeScript
- Expo
- Expo Router
- `expo-audio`
- Socket.IO Client

## 🎤 Como funciona a captação de áudio?

Antes de utilizar o microfone, o aplicativo solicita autorização do usuário através de:

```ts
requestRecordingPermissionsAsync()
```

Essa operação é assíncrona porque o aplicativo precisa aguardar a decisão do usuário antes de acessar o microfone.

Após a autorização, a captura é iniciada utilizando `useAudioStream`.

O áudio é configurado com:

```text
Sample Rate: 44.100 Hz
Canais: 1 (mono)
```

O fluxo pode ser resumido em:

```text
Microfone
   ↓
useAudioStream
   ↓
onBuffer()
   ↓
Amostras de áudio
   ↓
Float32Array
   ↓
RMS + análise de frequência
   ↓
Socket.IO
   ↓
Servidor
```

## 📊 RMS

O **RMS (Root Mean Square)** é utilizado para analisar a intensidade do sinal captado pelo microfone.

De forma simplificada:

```text
RMS baixo → som fraco ou silêncio
RMS alto  → som mais intenso
```

O RMS também é utilizado para fazer as ondas da interface reagirem ao áudio.

Por isso, a detecção de áudio e a detecção de frequência são processos diferentes: o aplicativo pode identificar que existe som sendo captado mesmo quando ainda não conseguiu determinar seu tom.

## 🎵 Detecção de frequência

A função `detectarFrequencia()` analisa as amostras captadas pelo microfone e tenta encontrar a frequência fundamental da voz.

O resultado é representado em **Hertz (Hz)**.

Exemplo:

```text
220 Hz
```

Essa informação é enviada para a aplicação web e utilizada pelo sistema de análise da partida.

## 📡 Comunicação com o servidor

A comunicação em tempo real é feita utilizando **Socket.IO**.

Durante a partida, o celular envia informações como:

```text
Jogador
Volume
Frequência
Timestamp
```

O evento principal utilizado para isso é:

```text
dados_microfone
```

O servidor recebe essas informações e as encaminha para o computador.

## 🔴 Gravação de 10 segundos

Durante cada partida, o aplicativo escolhe automaticamente um momento para gravar aproximadamente **10 segundos da apresentação do jogador**.

O processo utiliza o `AudioRecorder` do `expo-audio`.

Fluxo:

```text
Partida começa
      ↓
Momento aleatório é escolhido
      ↓
Permissão do microfone é verificada
      ↓
Gravação começa
      ↓
~10 segundos
      ↓
Gravação é encerrada
      ↓
Arquivo é armazenado
      ↓
Partida termina
      ↓
Jogador pode ouvir o trecho
```

Durante a captura, a interface informa:

```text
● GRAVANDO MOMENTO
```

Ao final, o trecho pode ser reproduzido pelo próprio aplicativo.

## 📱 Fluxo do aplicativo

```text
PIN da sala
    ↓
Nome do jogador
    ↓
Permissão do microfone
    ↓
Teste de captação
    ↓
Jogador pronto
    ↓
3 • 2 • 1 • VAI!
    ↓
Partida
    ↓
Gravação de um trecho
    ↓
Resultado
    ↓
Reprodução da gravação
```

## 🚀 Como executar

### 1. Clone o repositório

```bash
git clone https://github.com/mayaa-lves/mobile-karaokaos.git
cd mobile-karaokaos
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o endereço do servidor

No código do aplicativo existe a constante responsável pelo endereço do backend:

```ts
const SERVIDOR = "http://IP_DO_COMPUTADOR:8000";
```

Substitua `IP_DO_COMPUTADOR` pelo IPv4 da máquina que está executando o servidor.

No Windows, o endereço pode ser consultado com:

```bash
ipconfig
```

### 4. Execute o projeto

```bash
npx expo start --clear
```

Caso necessário no PowerShell:

```bash
npx.cmd expo start --clear
```

Depois, abra o **Expo Go** no celular e escaneie o QR Code.

> O celular e o computador devem estar conectados à mesma rede local.

## 🔐 Permissão do microfone

No Android, o aplicativo precisa ter acesso ao microfone.

Caso apareça um erro relacionado a `RECORD_AUDIO`, verifique:

```text
Configurações
→ Aplicativos
→ Expo Go
→ Permissões
→ Microfone
→ Permitir durante o uso do app
```

## ⚠️ Expo Go

A versão do Expo Go instalada no celular precisa ser compatível com a versão do Expo utilizada pelo projeto.

Caso apareça:

```text
Project is incompatible with this version of Expo Go
```

atualize o **Expo Go** pela Play Store.

## 🔗 Outros módulos

O KaraoKaos é dividido em três aplicações:

- [💻 Web](https://github.com/mayaa-lves/web-karaokaos)
- [🐍 Server](https://github.com/mayaa-lves/server-karaokaos)

## 👩‍💻 Projeto acadêmico

Projeto desenvolvido como atividade da disciplina de **Mobile**, no Curso Técnico em Desenvolvimento de Sistemas — SENAI.

O objetivo principal foi explorar o uso do **microfone como sensor**, aplicando captura e processamento de áudio em uma experiência interativa.