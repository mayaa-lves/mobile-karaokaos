import {
  requestRecordingPermissionsAsync,
  useAudioStream,
} from "expo-audio";

import { useEffect, useRef, useState } from "react";

import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { io } from "socket.io-client";

import Logo from "../../components/Logo";
import NameInput from "../../components/NameInput";
import PinInput from "../../components/PinInput";
import PrimaryButton from "../../components/PrimaryButton";


// ======================================================
// CONFIGURAÇÃO
// ======================================================

const SERVIDOR = "http://10.142.227.93:8000";

const socket = io(SERVIDOR, {
  autoConnect: false,
});

type Etapa =
  | "pin"
  | "nome"
  | "microfone"
  | "pronto";

type RespostaEntrada = {
  sucesso: boolean;
  erro?: string;
  jogador?: number;
};


// ======================================================
// DETECÇÃO DE FREQUÊNCIA
// ======================================================

function detectarFrequencia(
  amostras: Float32Array,
  sampleRate: number
): number | null {
  if (amostras.length < 2) {
    return null;
  }

  let somaQuadrados = 0;

  for (
    let i = 0;
    i < amostras.length;
    i++
  ) {
    somaQuadrados +=
      amostras[i] *
      amostras[i];
  }

  const rms = Math.sqrt(
    somaQuadrados /
      amostras.length
  );

  // Ignora silêncio e ruído baixo
  if (rms < 0.015) {
    return null;
  }

  const menorLag =
    Math.floor(
      sampleRate / 1000
    );

  const maiorLag =
    Math.min(
      Math.floor(
        sampleRate / 80
      ),
      amostras.length - 1
    );

  let melhorLag = -1;
  let melhorCorrelacao = 0;

  for (
    let lag = menorLag;
    lag <= maiorLag;
    lag++
  ) {
    let correlacao = 0;
    let energiaA = 0;
    let energiaB = 0;

    const limite =
      amostras.length - lag;

    for (
      let i = 0;
      i < limite;
      i++
    ) {
      const a = amostras[i];
      const b =
        amostras[i + lag];

      correlacao += a * b;
      energiaA += a * a;
      energiaB += b * b;
    }

    const denominador =
      Math.sqrt(
        energiaA * energiaB
      );

    if (
      denominador === 0
    ) {
      continue;
    }

    const correlacaoNormalizada =
      correlacao /
      denominador;

    if (
      correlacaoNormalizada >
      melhorCorrelacao
    ) {
      melhorCorrelacao =
        correlacaoNormalizada;

      melhorLag = lag;
    }
  }

  /*
    Se o sinal não tem periodicidade
    suficiente, provavelmente é ruído,
    fala muito irregular ou detecção ruim.
  */

  if (
    melhorLag <= 0 ||
    melhorCorrelacao < 0.72
  ) {
    return null;
  }

  const frequencia =
    sampleRate /
    melhorLag;

  if (
    frequencia < 80 ||
    frequencia > 1000
  ) {
    return null;
  }

  return frequencia;
}


// ======================================================
// APP
// ======================================================

export default function Index() {
  const [etapa, setEtapa] =
    useState<Etapa>("pin");

  const [pin, setPin] =
    useState("");

  const [nome, setNome] =
    useState("");

  const [erroPin, setErroPin] =
    useState("");

  const [
    erroNome,
    setErroNome,
  ] = useState("");

  const [
    conectado,
    setConectado,
  ] = useState(false);

  const [
    jogador,
    setJogador,
  ] =
    useState<number | null>(
      null
    );

  const [
    microfoneAtivo,
    setMicrofoneAtivo,
  ] = useState(false);

  const [volume, setVolume] =
    useState(0);

  const [
    frequencia,
    setFrequencia,
  ] =
    useState<number | null>(
      null
    );

  const pinRef =
    useRef("");

  const jogadorRef =
    useRef<number | null>(
      null
    );

  const ultimoEnvioRef =
    useRef(0);


  // ====================================================
  // REFERÊNCIAS
  // ====================================================

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  useEffect(() => {
    jogadorRef.current =
      jogador;
  }, [jogador]);


  // ====================================================
  // SOCKET
  // ====================================================

  useEffect(() => {
    function aoConectar() {
      console.log(
        "Conectado ao servidor!"
      );

      setConectado(true);
    }

    function aoDesconectar() {
      console.log(
        "Servidor desconectado."
      );

      setConectado(false);
    }

    function erroConexao(
      erro: Error
    ) {
      console.log(
        "Erro Socket.IO:",
        erro.message
      );

      setConectado(false);
    }

    socket.on(
      "connect",
      aoConectar
    );

    socket.on(
      "disconnect",
      aoDesconectar
    );

    socket.on(
      "connect_error",
      erroConexao
    );

    socket.connect();

    return () => {
      socket.off(
        "connect",
        aoConectar
      );

      socket.off(
        "disconnect",
        aoDesconectar
      );

      socket.off(
        "connect_error",
        erroConexao
      );

      socket.disconnect();
    };
  }, []);


  // ====================================================
  // MICROFONE
  // ====================================================

  const stream =
    useAudioStream({
      sampleRate: 44100,
      channels: 1,

      onBuffer: (buffer) => {
        const amostras =
          new Float32Array(
            buffer.data
          );

        if (
          amostras.length === 0
        ) {
          return;
        }

        let somaQuadrados = 0;

        for (
          let i = 0;
          i <
          amostras.length;
          i++
        ) {
          somaQuadrados +=
            amostras[i] *
            amostras[i];
        }

        const rms =
          Math.sqrt(
            somaQuadrados /
              amostras.length
          );

        const hz =
          detectarFrequencia(
            amostras,
            44100
          );

        setVolume(rms);
        setFrequencia(hz);

        const agora =
          Date.now();

        /*
          Envia no máximo aproximadamente
          6 vezes por segundo.
        */

        if (
          agora -
            ultimoEnvioRef.current <
          160
        ) {
          return;
        }

        if (
          !pinRef.current ||
          jogadorRef.current ===
            null
        ) {
          return;
        }

        ultimoEnvioRef.current =
          agora;

        socket.emit(
          "dados_microfone",
          {
            pin:
              pinRef.current,

            jogador:
              jogadorRef.current,

            volume: rms,

            frequencia: hz,

            timestamp: agora,
          }
        );
      },
    });


  // ====================================================
  // PIN
  // ====================================================

  function alterarPin(
    texto: string
  ) {
    const apenasNumeros =
      texto.replace(
        /\D/g,
        ""
      );

    setPin(
      apenasNumeros.slice(
        0,
        4
      )
    );

    setErroPin("");
  }

  function continuarPin() {
    if (pin.length !== 4) {
      setErroPin(
        "Digite o PIN de 4 dígitos."
      );

      return;
    }

    if (!conectado) {
      setErroPin(
        "O servidor ainda não está conectado."
      );

      return;
    }

    setEtapa("nome");
  }


  // ====================================================
  // NOME / ENTRAR NA SALA
  // ====================================================

  function alterarNome(
    texto: string
  ) {
    setNome(texto);
    setErroNome("");
  }

  function entrarNaSala() {
    const nomeLimpo =
      nome.trim();

    if (!nomeLimpo) {
      setErroNome(
        "Digite seu nome."
      );

      return;
    }

    socket.emit(
      "entrar_sala",

      {
        pin,
        nome: nomeLimpo,
      },

      (
        resposta: RespostaEntrada
      ) => {
        if (
          !resposta.sucesso
        ) {
          setErroPin(
            resposta.erro ??
              "Não foi possível entrar na sala."
          );

          setEtapa("pin");

          return;
        }

        setNome(nomeLimpo);

        setJogador(
          resposta.jogador ??
            null
        );

        setEtapa(
          "microfone"
        );
      }
    );
  }


  // ====================================================
  // PERMISSÃO DO MICROFONE
  // ====================================================

  async function ativarMicrofone() {
    try {
      const permissao =
        await requestRecordingPermissionsAsync();

      if (
        !permissao.granted
      ) {
        return;
      }

      await stream.stream.start();

      setMicrofoneAtivo(
        true
      );
    } catch (erro) {
      console.log(
        "Erro ao ativar microfone:",
        erro
      );
    }
  }


  // ====================================================
  // VISUALIZAÇÃO DO MICROFONE
  // ====================================================

  const volumePercentual =
    Math.min(
      100,
      Math.max(
        2,
        volume * 650
      )
    );

  const vozDetectada =
    frequencia !== null;

  function PainelMicrofone() {
    return (
      <View
        style={
          styles.micCard
        }
      >
        <View
          style={
            styles.liveRow
          }
        >
          <View
            style={[
              styles.liveDot,
              vozDetectada &&
                styles.liveDotActive,
            ]}
          />

          <Text
            style={
              styles.liveText
            }
          >
            MICROFONE ATIVO
          </Text>
        </View>

        <View
          style={
            styles.microphoneCircle
          }
        >
          <Text
            style={
              styles.microphoneEmoji
            }
          >
            🎤
          </Text>
        </View>

        <Text
          style={
            styles.frequency
          }
        >
          {frequencia !== null
            ? `${Math.round(
                frequencia
              )} Hz`
            : "— Hz"}
        </Text>

        <Text
          style={
            styles.detectionText
          }
        >
          {vozDetectada
            ? "VOZ DETECTADA"
            : "Cante para testar"}
        </Text>

        <View
          style={
            styles.volumeContainer
          }
        >
          <View
            style={[
              styles.volumeBar,
              {
                width: `${volumePercentual}%`,
              },
            ]}
          />
        </View>

        <View
          style={
            styles.wave
          }
        >
          {[
            0.45,
            0.75,
            1,
            0.6,
            0.9,
            1.15,
            0.7,
            1,
            0.55,
            0.85,
            0.5,
          ].map(
            (
              multiplicador,
              index
            ) => {
              const altura =
                Math.max(
                  7,
                  Math.min(
                    52,
                    volume *
                      400 *
                      multiplicador
                  )
                );

              return (
                <View
                  key={index}
                  style={[
                    styles.waveBar,
                    {
                      height:
                        altura,
                    },
                  ]}
                />
              );
            }
          )}
        </View>

        <View
          style={
            styles.sendingBox
          }
        >
          <View
            style={
              styles.sendingDot
            }
          />

          <Text
            style={
              styles.sendingText
            }
          >
            {conectado
              ? "ENVIANDO DADOS PARA O JOGO"
              : "SERVIDOR DESCONECTADO"}
          </Text>
        </View>
      </View>
    );
  }


  // ====================================================
  // TELA
  // ====================================================

  return (
    <View
      style={
        styles.container
      }
    >
      <View
        style={
          styles.topDecoration
        }
      />

      <View
        style={
          styles.bottomDecoration
        }
      />

      <View
        style={
          styles.content
        }
      >
        <Logo />

        {/* PIN */}

        {etapa === "pin" && (
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.step
              }
            >
              PASSO 1 DE 4
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Entre na sala
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Digite o PIN que
              aparece no computador.
            </Text>

            <PinInput
              value={pin}
              onChangeText={
                alterarPin
              }
              error={erroPin}
            />

            <PrimaryButton
              title="ENTRAR  →"
              onPress={
                continuarPin
              }
            />

            <View
              style={
                styles.statusRow
              }
            >
              <View
                style={[
                  styles.statusDot,
                  conectado
                    ? styles.online
                    : styles.offline,
                ]}
              />

              <Text
                style={
                  styles.statusText
                }
              >
                {conectado
                  ? "Servidor conectado"
                  : "Conectando ao servidor..."}
              </Text>
            </View>
          </View>
        )}


        {/* NOME */}

        {etapa ===
          "nome" && (
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.step
              }
            >
              PASSO 2 DE 4
            </Text>

            <Text
              style={
                styles.title
              }
            >
              Quem vai cantar?
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Seu nome aparecerá
              no placar da partida.
            </Text>

            <NameInput
              value={nome}
              onChangeText={
                alterarNome
              }
              error={erroNome}
            />

            <PrimaryButton
              title="CONTINUAR  →"
              onPress={
                entrarNaSala
              }
            />
          </View>
        )}


        {/* MICROFONE */}

        {etapa ===
          "microfone" && (
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.step
              }
            >
              PASSO 3 DE 4
            </Text>

            {jogador !==
              null && (
              <View
                style={
                  styles.playerPill
                }
              >
                <Text
                  style={
                    styles.playerPillText
                  }
                >
                  JOGADOR{" "}
                  {jogador}
                </Text>
              </View>
            )}

            {!microfoneAtivo ? (
              <>
                <Text
                  style={
                    styles.title
                  }
                >
                  Ative seu
                  microfone
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Usamos o áudio
                  para analisar o
                  volume e a
                  frequência da sua
                  voz em tempo real.
                </Text>

                <View
                  style={
                    styles.permissionMic
                  }
                >
                  <Text
                    style={
                      styles.permissionEmoji
                    }
                  >
                    🎤
                  </Text>
                </View>

                <PrimaryButton
                  title="ATIVAR MICROFONE"
                  onPress={
                    ativarMicrofone
                  }
                />

                <Text
                  style={
                    styles.privacy
                  }
                >
                  O protótipo envia
                  apenas os dados
                  analisados para o
                  jogo.
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.title
                  }
                >
                  Funcionando! 🎤
                </Text>

                <Text
                  style={
                    styles.subtitle
                  }
                >
                  Fale ou cante e
                  veja o sensor
                  reagir.
                </Text>

                <PainelMicrofone />

                <PrimaryButton
                  title="ESTOU PRONTO  →"
                  onPress={() =>
                    setEtapa(
                      "pronto"
                    )
                  }
                />
              </>
            )}
          </View>
        )}


        {/* PRONTO */}

        {etapa ===
          "pronto" && (
          <View
            style={
              styles.section
            }
          >
            <Text
              style={
                styles.step
              }
            >
              PASSO 4 DE 4
            </Text>

            <View
              style={
                styles.playerPill
              }
            >
              <Text
                style={
                  styles.playerPillText
                }
              >
                JOGADOR{" "}
                {jogador}
              </Text>
            </View>

            <Text
              style={
                styles.title
              }
            >
              Tudo pronto,
              {" "}
              {nome}! 🔥
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Agora é só acompanhar
              a letra no computador
              e cantar quando for
              sua vez.
            </Text>

            <PainelMicrofone />

            <View
              style={
                styles.roomConnected
              }
            >
              <Text
                style={
                  styles.roomConnectedText
                }
              >
                ● CONECTADO À SALA{" "}
                {pin}
              </Text>
            </View>

            <Text
              style={
                styles.waiting
              }
            >
              Aguardando o jogo
              começar no computador...
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}


// ======================================================
// ESTILOS
// ======================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#FFF9F6",
      overflow: "hidden",
    },

    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 55,
      paddingBottom: 28,
      alignItems: "center",
      justifyContent:
        "center",
      zIndex: 2,
    },

    section: {
      width: "100%",
      maxWidth: 360,
      alignItems: "center",
      gap: 14,
      marginTop: 24,
    },

    step: {
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 1.5,
      color: "#7157FF",
    },

    title: {
      color: "#111111",
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "900",
      textAlign: "center",
    },

    subtitle: {
      maxWidth: 320,
      color: "#777078",
      fontSize: 14,
      lineHeight: 21,
      textAlign: "center",
    },

    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginTop: 2,
    },

    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 10,
    },

    online: {
      backgroundColor:
        "#7157FF",
    },

    offline: {
      backgroundColor:
        "#B6AFB6",
    },

    statusText: {
      color: "#777078",
      fontSize: 11,
      fontWeight: "700",
    },

    playerPill: {
      backgroundColor:
        "#EEE9FF",
      paddingHorizontal: 15,
      paddingVertical: 7,
      borderRadius: 50,
    },

    playerPillText: {
      color: "#633CFF",
      fontSize: 11,
      fontWeight: "900",
      letterSpacing: 0.8,
    },

    permissionMic: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor:
        "#EEE9FF",
      alignItems: "center",
      justifyContent:
        "center",
      marginVertical: 4,
    },

    permissionEmoji: {
      fontSize: 48,
    },

    privacy: {
      maxWidth: 280,
      color: "#999299",
      fontSize: 11,
      lineHeight: 16,
      textAlign: "center",
    },

    micCard: {
      width: "100%",
      backgroundColor:
        "#FFFFFF",
      borderRadius: 26,
      paddingHorizontal: 20,
      paddingVertical: 18,
      alignItems: "center",

      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 15,
      shadowOffset: {
        width: 0,
        height: 7,
      },

      elevation: 3,
    },

    liveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      marginBottom: 10,
    },

    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 8,
      backgroundColor:
        "#B9B4BC",
    },

    liveDotActive: {
      backgroundColor:
        "#7157FF",
    },

    liveText: {
      color: "#7157FF",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 1.2,
    },

    microphoneCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        "#F1EDFF",
      alignItems: "center",
      justifyContent:
        "center",
      marginBottom: 5,
    },

    microphoneEmoji: {
      fontSize: 30,
    },

    frequency: {
      color: "#111111",
      fontSize: 37,
      fontWeight: "900",
      letterSpacing: -1,
    },

    detectionText: {
      color: "#777078",
      fontSize: 11,
      fontWeight: "700",
      marginTop: -2,
      marginBottom: 12,
    },

    volumeContainer: {
      width: "100%",
      height: 9,
      backgroundColor:
        "#EEE9FF",
      borderRadius: 20,
      overflow: "hidden",
    },

    volumeBar: {
      height: "100%",
      backgroundColor:
        "#7157FF",
      borderRadius: 20,
    },

    wave: {
      height: 58,
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 5,
      marginVertical: 5,
    },

    waveBar: {
      width: 5,
      minHeight: 7,
      backgroundColor:
        "#7157FF",
      borderRadius: 10,
    },

    sendingBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 7,
      width: "100%",
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor:
        "#F0ECF2",
    },

    sendingDot: {
      width: 6,
      height: 6,
      borderRadius: 6,
      backgroundColor:
        "#7157FF",
    },

    sendingText: {
      color: "#633CFF",
      fontSize: 9,
      fontWeight: "900",
      letterSpacing: 0.7,
    },

    roomConnected: {
      backgroundColor:
        "#EEE9FF",
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 30,
    },

    roomConnectedText: {
      color: "#633CFF",
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.5,
    },

    waiting: {
      color: "#8A838B",
      fontSize: 12,
      textAlign: "center",
    },

    topDecoration: {
      position: "absolute",
      width: 260,
      height: 260,
      borderRadius: 130,
      backgroundColor:
        "#E9DEFF",
      top: -175,
      right: -90,
    },

    bottomDecoration: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor:
        "#F0E5FF",
      bottom: -210,
      left: -120,
    },
  });