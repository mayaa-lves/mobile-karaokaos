import {
  requestRecordingPermissionsAsync,
  useAudioRecorder,
  useAudioPlayer,
  useAudioStream,
  RecordingPresets,
  setAudioModeAsync,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { io } from "socket.io-client";

import Logo from "../../components/Logo";
import NameInput from "../../components/NameInput";
import PinInput from "../../components/PinInput";
import PrimaryButton from "../../components/PrimaryButton";

const SERVIDOR = "http://10.142.227.93:8000";
const socket = io(SERVIDOR, { autoConnect: false });

type Etapa = "pin" | "nome" | "microfone" | "pronto" | "contagem" | "jogo" | "resultado";
type RespostaEntrada = { sucesso: boolean; erro?: string; jogador?: number };

function detectarFrequencia(amostras: Float32Array, sampleRate: number): number | null {
  if (amostras.length < 2) return null;

  // Analisa no máximo ~2048 amostras para reduzir travamentos.
  const passo = Math.max(1, Math.floor(amostras.length / 2048));
  const reduzidas: number[] = [];
  for (let i = 0; i < amostras.length; i += passo) reduzidas.push(amostras[i]);

  let soma = 0;
  for (const a of reduzidas) soma += a * a;
  const rms = Math.sqrt(soma / reduzidas.length);
  if (rms < 0.012) return null;

  const menorLag = Math.max(1, Math.floor(sampleRate / passo / 1000));
  const maiorLag = Math.min(Math.floor(sampleRate / passo / 80), reduzidas.length - 1);

  let melhorLag = -1;
  let melhor = 0;

  for (let lag = menorLag; lag <= maiorLag; lag++) {
    let correlacao = 0, energiaA = 0, energiaB = 0;
    const limite = reduzidas.length - lag;
    for (let i = 0; i < limite; i++) {
      const a = reduzidas[i];
      const b = reduzidas[i + lag];
      correlacao += a * b;
      energiaA += a * a;
      energiaB += b * b;
    }
    const den = Math.sqrt(energiaA * energiaB);
    if (!den) continue;
    const c = correlacao / den;
    if (c > melhor) { melhor = c; melhorLag = lag; }
  }

  if (melhorLag <= 0 || melhor < 0.60) return null;
  const hz = (sampleRate / passo) / melhorLag;
  return hz >= 80 && hz <= 1000 ? hz : null;
}

export default function Index() {
  const [etapa, setEtapa] = useState<Etapa>("pin");
  const [pin, setPin] = useState("");
  const [nome, setNome] = useState("");
  const [erroPin, setErroPin] = useState("");
  const [erroNome, setErroNome] = useState("");
  const [conectado, setConectado] = useState(false);
  const [jogador, setJogador] = useState<number | null>(null);
  const [microfoneAtivo, setMicrofoneAtivo] = useState(false);
  const [volume, setVolume] = useState(0);
  const [frequencia, setFrequencia] = useState<number | null>(null);
  const [contagem, setContagem] = useState(3);
  const [gravandoMomento, setGravandoMomento] = useState(false);
  const [gravacaoUri, setGravacaoUri] = useState<string | null>(null);

  const pinRef = useRef("");
  const jogadorRef = useRef<number | null>(null);
  const ultimoEnvioRef = useRef(0);
  const timerInicioRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerFimRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(gravacaoUri);

  useEffect(() => { pinRef.current = pin; }, [pin]);
  useEffect(() => { jogadorRef.current = jogador; }, [jogador]);

  async function iniciarTrechoGravado() {
    try {
      setGravacaoUri(null);
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record({ forDuration: 10 });
      setGravandoMomento(true);

      timerFimRef.current = setTimeout(async () => {
        try {
          if (recorder.isRecording) await recorder.stop();
          setGravandoMomento(false);
          if (recorder.uri) setGravacaoUri(recorder.uri);
        } catch (e) {
          console.log("Erro ao finalizar gravação:", e);
        }
      }, 10200);
    } catch (e) {
      console.log("Erro ao gravar momento:", e);
      setGravandoMomento(false);
    }
  }

  function prepararGravacaoAleatoria() {
    // Entre 20s e 155s da música, evitando intro/final.
    const atraso = 20000 + Math.floor(Math.random() * 135000);
    if (timerInicioRef.current) clearTimeout(timerInicioRef.current);
    timerInicioRef.current = setTimeout(iniciarTrechoGravado, atraso);
  }

  useEffect(() => {
    function aoConectar() { setConectado(true); }
    function aoDesconectar() { setConectado(false); }
    function erroConexao() { setConectado(false); }

    function partidaIniciada() {
      setContagem(3);
      setEtapa("contagem");
      prepararGravacaoAleatoria();

      setTimeout(() => setContagem(2), 850);
      setTimeout(() => setContagem(1), 1700);
      setTimeout(() => setContagem(0), 2550);
      setTimeout(() => setEtapa("jogo"), 3200);
    }

    function partidaFinalizada() {
      if (timerInicioRef.current) clearTimeout(timerInicioRef.current);
      if (timerFimRef.current) clearTimeout(timerFimRef.current);
      (async () => {
        try {
          if (recorder.isRecording) {
            await recorder.stop();
            if (recorder.uri) setGravacaoUri(recorder.uri);
          }
        } catch {}
        setGravandoMomento(false);
        setEtapa("resultado");
      })();
    }

    socket.on("connect", aoConectar);
    socket.on("disconnect", aoDesconectar);
    socket.on("connect_error", erroConexao);
    socket.on("partida_iniciada", partidaIniciada);
    socket.on("partida_finalizada", partidaFinalizada);
    socket.connect();

    return () => {
      socket.off("connect", aoConectar);
      socket.off("disconnect", aoDesconectar);
      socket.off("connect_error", erroConexao);
      socket.off("partida_iniciada", partidaIniciada);
      socket.off("partida_finalizada", partidaFinalizada);
      if (timerInicioRef.current) clearTimeout(timerInicioRef.current);
      if (timerFimRef.current) clearTimeout(timerFimRef.current);
      socket.disconnect();
    };
  }, []);

  const stream = useAudioStream({
    sampleRate: 44100,
    channels: 1,
    onBuffer: (buffer) => {
      const amostras = new Float32Array(buffer.data);
      if (!amostras.length) return;

      let soma = 0;
      for (let i = 0; i < amostras.length; i++) soma += amostras[i] * amostras[i];
      const rms = Math.sqrt(soma / amostras.length);

      const agora = Date.now();
      // UI reage ao RMS mesmo se o pitch não for reconhecido.
      setVolume(rms);

      // Pitch só é calculado/enviado ~6x/s para aliviar o celular.
      if (agora - ultimoEnvioRef.current < 160) return;
      const hz = detectarFrequencia(amostras, 44100);
      setFrequencia(hz);

      if (!pinRef.current || jogadorRef.current === null) return;
      ultimoEnvioRef.current = agora;
      socket.emit("dados_microfone", {
        pin: pinRef.current,
        jogador: jogadorRef.current,
        volume: rms,
        frequencia: hz,
        timestamp: agora,
      });
    },
  });

  function alterarPin(texto: string) {
    setPin(texto.replace(/\D/g, "").slice(0, 4));
    setErroPin("");
  }

  function continuarPin() {
    if (pin.length !== 4) return setErroPin("Digite o PIN de 4 dígitos.");
    if (!conectado) return setErroPin("O servidor ainda não está conectado.");
    setEtapa("nome");
  }

  function entrarNaSala() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErroNome("Digite seu nome.");

    socket.emit("entrar_sala", { pin, nome: nomeLimpo }, (resposta: RespostaEntrada) => {
      if (!resposta.sucesso) {
        setErroPin(resposta.erro ?? "Não foi possível entrar na sala.");
        setEtapa("pin");
        return;
      }
      setNome(nomeLimpo);
      setJogador(resposta.jogador ?? null);
      setEtapa("microfone");
    });
  }

  async function ativarMicrofone() {
    try {
      const permissao = await requestRecordingPermissionsAsync();
      if (!permissao.granted) return;
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await stream.stream.start();
      setMicrofoneAtivo(true);
    } catch (e) {
      console.log("Erro ao ativar microfone:", e);
    }
  }

  const audioCaptado = volume > 0.008;
  const intensidade = Math.min(1, Math.max(0.08, volume * 18));
  const barras = [0.45, 0.75, 1, 0.6, 0.9, 1.15, 0.7, 1, 0.55, 0.85, 0.5];

  function Onda() {
    return (
      <View style={styles.wave}>
        {barras.map((m, i) => (
          <View key={i} style={[styles.waveBar, { height: Math.max(8, Math.min(82, 70 * intensidade * m)) }]} />
        ))}
      </View>
    );
  }

  if (etapa === "contagem") {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.miniBrand}>KARAOKE <Text style={styles.purple}>CHAOS</Text></Text>
        <Text style={styles.countdown}>{contagem > 0 ? contagem : "VAI!"}</Text>
        <Text style={styles.gameHint}>Prepare o microfone 🎤</Text>
      </View>
    );
  }

  if (etapa === "jogo") {
    return (
      <View style={styles.gameContainer}>
        <View style={styles.hzCorner}>
          <Text style={styles.hzSmall}>{frequencia ? `${Math.round(frequencia)} Hz` : "— Hz"}</Text>
        </View>

        {gravandoMomento && (
          <View style={styles.recordingBadge}>
            <Text style={styles.recordingText}>● GRAVANDO MOMENTO</Text>
          </View>
        )}

        <View style={[styles.bigMic, audioCaptado && styles.bigMicActive]}>
          <Text style={styles.bigMicEmoji}>🎤</Text>
        </View>
        <Onda />
        <Text style={[styles.captureText, audioCaptado && styles.captureTextActive]}>
          {audioCaptado ? "ÁUDIO CAPTADO" : "OUVINDO..."}
        </Text>
        <Text style={styles.gameHint}>Acompanhe a letra no computador</Text>
      </View>
    );
  }

  if (etapa === "resultado") {
    return (
      <View style={styles.gameContainer}>
        <Text style={styles.miniBrand}>KARAOKE <Text style={styles.purple}>CHAOS</Text></Text>
        <Text style={styles.resultTitle}>Seu momento 🎙️</Text>
        <Text style={styles.resultSubtitle}>
          {gravacaoUri ? "O celular gravou um trecho da sua apresentação." : "Não foi possível salvar o trecho desta vez."}
        </Text>
        {gravacaoUri && (
          <Pressable style={styles.playButton} onPress={() => { player.seekTo(0); player.play(); }}>
            <Text style={styles.playButtonText}>▶ OUVIR GRAVAÇÃO</Text>
          </Pressable>
        )}
        <Text style={styles.gameHint}>Resultado e pontuação estão no computador.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topDecoration} />
      <View style={styles.bottomDecoration} />
      <View style={styles.content}>
        <Logo />

        {etapa === "pin" && (
          <View style={styles.section}>
            <Text style={styles.step}>PASSO 1 DE 4</Text>
            <Text style={styles.title}>Entre na sala</Text>
            <Text style={styles.subtitle}>Digite o PIN que aparece no computador.</Text>
            <PinInput value={pin} onChangeText={alterarPin} error={erroPin} />
            <PrimaryButton title="ENTRAR  →" onPress={continuarPin} />
            <Text style={styles.statusText}>{conectado ? "● Servidor conectado" : "○ Conectando ao servidor..."}</Text>
          </View>
        )}

        {etapa === "nome" && (
          <View style={styles.section}>
            <Text style={styles.step}>PASSO 2 DE 4</Text>
            <Text style={styles.title}>Quem vai cantar?</Text>
            <Text style={styles.subtitle}>Seu nome aparecerá no placar da partida.</Text>
            <NameInput value={nome} onChangeText={(t) => { setNome(t); setErroNome(""); }} error={erroNome} />
            <PrimaryButton title="CONTINUAR  →" onPress={entrarNaSala} />
          </View>
        )}

        {etapa === "microfone" && (
          <View style={styles.section}>
            <Text style={styles.step}>PASSO 3 DE 4</Text>
            <View style={styles.playerPill}><Text style={styles.playerPillText}>JOGADOR {jogador}</Text></View>
            {!microfoneAtivo ? (
              <>
                <Text style={styles.title}>Ative seu microfone</Text>
                <Text style={styles.subtitle}>O áudio será analisado em tempo real.</Text>
                <View style={styles.permissionMic}><Text style={styles.permissionEmoji}>🎤</Text></View>
                <PrimaryButton title="ATIVAR MICROFONE" onPress={ativarMicrofone} />
              </>
            ) : (
              <>
                <Text style={styles.title}>Funcionando! 🎤</Text>
                <Text style={styles.subtitle}>Fale ou cante. As ondas reagem ao áudio captado.</Text>
                <View style={styles.testCard}>
                  <Text style={styles.testStatus}>{audioCaptado ? "● ÁUDIO CAPTADO" : "○ OUVINDO..."}</Text>
                  <Onda />
                  <Text style={styles.testHz}>{frequencia ? `${Math.round(frequencia)} Hz` : "tom ainda não identificado"}</Text>
                </View>
                <PrimaryButton title="ESTOU PRONTO  →" onPress={() => setEtapa("pronto")} />
              </>
            )}
          </View>
        )}

        {etapa === "pronto" && (
          <View style={styles.section}>
            <Text style={styles.step}>PASSO 4 DE 4</Text>
            <View style={styles.playerPill}><Text style={styles.playerPillText}>JOGADOR {jogador}</Text></View>
            <Text style={styles.title}>Tudo pronto, {nome}! 🔥</Text>
            <Text style={styles.subtitle}>Quando a partida começar no computador, esta tela muda automaticamente.</Text>
            <View style={styles.testCard}><Text style={styles.testStatus}>{audioCaptado ? "● MICROFONE CAPTANDO" : "○ MICROFONE ATIVO"}</Text><Onda /></View>
            <Text style={styles.waiting}>Aguardando o jogo começar...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF9F6", overflow: "hidden" },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 55, paddingBottom: 28, alignItems: "center", justifyContent: "center", zIndex: 2 },
  section: { width: "100%", maxWidth: 360, alignItems: "center", gap: 14, marginTop: 24 },
  step: { fontSize: 11, fontWeight: "900", letterSpacing: 1.5, color: "#7157FF" },
  title: { color: "#111", fontSize: 28, lineHeight: 34, fontWeight: "900", textAlign: "center" },
  subtitle: { maxWidth: 320, color: "#777078", fontSize: 14, lineHeight: 21, textAlign: "center" },
  statusText: { color: "#7157FF", fontSize: 11, fontWeight: "800" },
  playerPill: { backgroundColor: "#EEE9FF", paddingHorizontal: 15, paddingVertical: 7, borderRadius: 50 },
  playerPillText: { color: "#633CFF", fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  permissionMic: { width: 120, height: 120, borderRadius: 60, backgroundColor: "#EEE9FF", alignItems: "center", justifyContent: "center" },
  permissionEmoji: { fontSize: 48 },
  testCard: { width: "100%", backgroundColor: "#fff", borderRadius: 26, padding: 20, alignItems: "center", elevation: 3 },
  testStatus: { color: "#633CFF", fontSize: 12, fontWeight: "900", letterSpacing: 0.8 },
  testHz: { color: "#8A838B", fontSize: 11, fontWeight: "700" },
  wave: { height: 100, width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  waveBar: { width: 7, backgroundColor: "#7157FF", borderRadius: 10 },
  waiting: { color: "#8A838B", fontSize: 12, textAlign: "center" },
  topDecoration: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "#E9DEFF", top: -175, right: -90 },
  bottomDecoration: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#F0E5FF", bottom: -210, left: -120 },

  gameContainer: { flex: 1, backgroundColor: "#FFF9F6", alignItems: "center", justifyContent: "center", padding: 28 },
  miniBrand: { position: "absolute", top: 60, fontSize: 17, fontWeight: "900", letterSpacing: -0.5, color: "#111" },
  purple: { color: "#7157FF" },
  countdown: { fontSize: 120, fontWeight: "900", color: "#7157FF" },
  hzCorner: { position: "absolute", top: 55, right: 24, backgroundColor: "#EEE9FF", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  hzSmall: { color: "#633CFF", fontSize: 11, fontWeight: "800" },
  recordingBadge: { position: "absolute", top: 55, left: 24, backgroundColor: "#FFE8E8", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 6 },
  recordingText: { color: "#C73D3D", fontSize: 9, fontWeight: "900" },
  bigMic: { width: 190, height: 190, borderRadius: 95, backgroundColor: "#EEE9FF", alignItems: "center", justifyContent: "center", transform: [{ scale: 1 }] },
  bigMicActive: { transform: [{ scale: 1.06 }], backgroundColor: "#E4DBFF" },
  bigMicEmoji: { fontSize: 86 },
  captureText: { marginTop: 5, color: "#A19AA3", fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  captureTextActive: { color: "#633CFF" },
  gameHint: { marginTop: 16, color: "#8A838B", fontSize: 12, textAlign: "center" },
  resultTitle: { fontSize: 34, fontWeight: "900", color: "#111", textAlign: "center" },
  resultSubtitle: { marginTop: 10, maxWidth: 300, color: "#777078", fontSize: 14, lineHeight: 21, textAlign: "center" },
  playButton: { marginTop: 28, backgroundColor: "#7157FF", paddingHorizontal: 28, paddingVertical: 17, borderRadius: 18 },
  playButtonText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
