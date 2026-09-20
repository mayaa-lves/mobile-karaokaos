import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { requestRecordingPermissionsAsync, useAudioStream } from "expo-audio";

import Logo from "../../components/Logo";
import PinInput from "../../components/PinInput";
import PrimaryButton from "../../components/PrimaryButton";
import NameInput from "../../components/NameInput";

export default function Index() {
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");

  const [etapa, setEtapa] =
    useState<"pin" | "nome" | "microfone" | "pronto">("pin");

  const [nome, setNome] = useState("");
  const [errorNome, setErroNome] = useState("");

  const [microfoneAutorizado, setMicrofoneAutorizado] =
    useState(false);

  const [volume, setVolume] = useState(0);
  const stream = useAudioStream({
    sampleRate: 44100,
    channels: 1,

    onBuffer: (buffer) => {
      const amostras = new Float32Array(buffer.data);

      let somaQuadrados = 0;

      for (let i = 0; i < amostras.length; i++) {
        somaQuadrados += amostras[i] * amostras[i];
      }

      const rms = Math.sqrt(
        somaQuadrados / amostras.length
      );

      setVolume(rms);
    },
  });

  function alterarPin(text: string) {
    setPin(text);

    if (erro !== "") {
      setErro("");
    }
  }

  function entrarNaSala() {
    if (pin.length !== 4) {
      setErro("Digite um PIN de 4 dígitos");
      return;
    }

    setErro("");

    console.log("Tentando entrar na sala:", pin);

    setEtapa("nome");
  }

  function alterarNome(text: string) {
    setNome(text);

    if (errorNome !== "") {
      setErroNome("");
    }
  }

  function continuarComNome() {
    const nomeLimpo = nome.trim();

    if (nomeLimpo === "") {
      setErroNome("Digite seu nome.");
      return;
    }

    setErroNome("");
    setNome(nomeLimpo);

    console.log(`Nome do jogador: >${nomeLimpo}<`);

    setEtapa("microfone");
  }

  async function permitirMicrofone() {
    const permissao =
      await requestRecordingPermissionsAsync();

    if (permissao.granted) {
      setMicrofoneAutorizado(true);

      await stream.stream.start();

      console.log("Microfone autorizado!");
    } else {
      console.log("Permissão do microfone negada.");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.decoracaoSuperior} />

      <View style={styles.content}>
        <Logo />

        {etapa === "pin" && (
          <View style={styles.step}>
            <Text style={styles.progress}>1 / 4</Text>

            <Text style={styles.title}>
              Entrar na sala
            </Text>

            <Text style={styles.description}>
              Digite o PIN da sala para participar.
            </Text>

            <PinInput
              value={pin}
              onChangeText={alterarPin}
              error={erro}
            />

            <PrimaryButton
              title="ENTRAR  →"
              onPress={entrarNaSala}
            />

            <Text style={styles.helper}>
              ● MODO MULTIJOGADOR · 2 JOGADORES
            </Text>
          </View>
        )}

        {etapa === "nome" && (
          <View style={styles.step}>
            <Text style={styles.progress}>2 / 4</Text>

            <Text style={styles.title}>
              Qual é o seu nome?
            </Text>

            <Text style={styles.description}>
              Esse será o seu nome na partida.
            </Text>

            <NameInput
              value={nome}
              onChangeText={alterarNome}
              error={errorNome}
            />

            <PrimaryButton
              title="CONTINUAR  →"
              onPress={continuarComNome}
            />

            <Text style={styles.smallText}>
              Máx. 16 caracteres
            </Text>
          </View>
        )}

        {etapa === "microfone" && (
          <View style={styles.step}>
            <Text style={styles.progress}>3 / 4</Text>

            {!microfoneAutorizado ? (
              <>
                <Text style={styles.title}>
                  Vamos usar o seu microfone?
                </Text>

                <Text style={styles.description}>
                  Precisamos do seu microfone para analisar
                  sua voz durante a música.
                </Text>

                <View style={styles.microphoneCircle}>
                  <Text style={styles.microphone}>
                    🎤
                  </Text>
                </View>

                <PrimaryButton
                  title="ATIVAR MICROFONE"
                  onPress={permitirMicrofone}
                />

                <Text style={styles.smallText}>
                  🔒 O áudio é usado durante a partida.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title}>
                  Microfone ativo!
                </Text>

                <Text style={styles.description}>
                  O microfone está funcionando.
                </Text>

                <View style={styles.microphoneCircleActive}>
                  <Text style={styles.microphone}>
                    🎤
                  </Text>
                </View>

                <View style={styles.audioArea}>
                  <View style={styles.audioBars}>
                    {[0.45, 0.7, 1, 0.65, 0.85, 1.15, 0.8, 1, 0.6, 0.75, 0.5].map(
                      (multiplicador, index) => {
                        const altura = Math.max(
                          8,
                          Math.min(volume * 300 * multiplicador, 60)
                        );

                        return (
                          <View
                            key={index}
                            style={[
                              styles.bar,
                              {
                                height: altura,
                              },
                            ]}
                          />
                        );
                      }
                    )}
                  </View>

                  <Text style={styles.detecting}>
                    ● Detectando som...
                  </Text>
                </View>

                <PrimaryButton
                  title="ESTOU PRONTO  →"
                  onPress={() => setEtapa("pronto")}
                />
              </>
            )}
          </View>
        )}

        {etapa === "pronto" && (
          <View style={styles.step}>
            <Text style={styles.progress}>4 / 4</Text>

            <Text style={styles.title}>
              Tudo pronto, {nome}!
            </Text>

            <Text style={styles.description}>
              Aguarde o host iniciar a partida.
            </Text>

            <View style={styles.microphoneCircle}>
              <Text style={styles.microphone}>
                🎤
              </Text>

              <View style={styles.check}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>

            <Text style={styles.connected}>
              ● Microfone conectado
            </Text>

            <View style={styles.waitingCard}>
              <Text style={styles.waitingEmoji}>
                🎵
              </Text>

              <Text style={styles.waitingText}>
                Boa música,{"\n"}
                boas companhias,{"\n"}
                grande caos.
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.decoracaoInferior} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF9F7",
    overflow: "hidden",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 2,
  },

  step: {
    width: "100%",
    alignItems: "center",
    gap: 18,
    marginTop: 32,
  },

  progress: {
    color: "#7157FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    maxWidth: 330,
    color: "#111111",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },

  description: {
    maxWidth: 310,
    color: "#68616A",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  helper: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: "#EEE9FF",
    color: "#6246EA",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  smallText: {
    color: "#777078",
    fontSize: 12,
    textAlign: "center",
  },

  microphoneCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#EEE9FF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  microphoneCircleActive: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#7157FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 12,
    borderColor: "#E8E0FF",
  },

  microphone: {
    fontSize: 45,
  },

  audioArea: {
    width: 280,
    alignItems: "center",
    gap: 10,
  },

  audioBars: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  bar: {
    width: 5,
    borderRadius: 10,
    backgroundColor: "#7157FF",
  },

  detecting: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F3EEFF",
    color: "#4F4851",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  connected: {
    color: "#7157FF",
    fontSize: 14,
    fontWeight: "700",
  },

  check: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7157FF",
    alignItems: "center",
    justifyContent: "center",
  },

  checkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  waitingCard: {
    width: 280,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  waitingEmoji: {
    fontSize: 30,
  },

  waitingText: {
    color: "#555057",
    fontSize: 15,
    lineHeight: 21,
  },

  decoracaoSuperior: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#E9DEFF",
    top: -130,
    right: -90,
  },

  decoracaoInferior: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#F0E5FF",
    bottom: -160,
    left: -100,
  },
});