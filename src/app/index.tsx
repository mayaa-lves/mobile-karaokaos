import { Pressable, StyleSheet, Text, View } from "react-native";
import {requestRecordingPermissionsAsync, useAudioStream } from 'expo-audio';
import {useState} from "react";


export default function Index() {

  const [microfoneAutorizado, setMicrofoneAutorizado] = useState(false); // permissao do microfone
  const [microfoneAtivo, setMicrofoneAtivo] = useState(false); // capturando audio
  const {stream} = useAudioStream({
    sampleRate: 44100, // o audio será representado por 44.100 amostras por segundo
    channels: 1, // mono (n precisamos de estéreo para analisar uma voz)

    onBuffer: (buffer) => {
      const amostras = new Float32Array(buffer.data); // converte para numeros da amplitude da onda sonora, que variam de -1 a 1
      let somaQuadrados = 0;

      for (let i = 0; i < amostras.length; i++) {
        somaQuadrados = somaQuadrados + (amostras[i] * amostras[i]);
      }

      const rms = Math.sqrt(somaQuadrados / amostras.length); // raiz quadrada da média dos quadrados das amostras

      console.log("RMS:", rms);
    }

  });

  function detectarPitch(amostras: Float32Array, sampleRate: number){
      let somaQuadrados = 0;
      for (let i = 0; i < amostras.length; i++) {
        somaQuadrados = somaQuadrados + (amostras[i] * amostras[i]);
      }

      const rms = Math.sqrt(somaQuadrados / amostras.length); // raiz quadrada da média dos quadrados das amostras

      console.log("RMS:", rms);

      if (rms < 0.015) {
        return null;
      }

      const frequenciaMinima = 80;
      const frequenciaMaxima = 1000;

      const deslocamentoMinimo = Math.floor(sampleRate / frequenciaMaxima);
      const deslocamentoMaximo = Math.floor(sampleRate / frequenciaMinima);
    }

  async function ativarMicrofone() {
    const permissao = await requestRecordingPermissionsAsync();

    if (permissao.granted){
      console.log("Acesso ao microfone autorizado");
      setMicrofoneAutorizado(true);

      await stream.start();
      console.log("stream:", stream);
      setMicrofoneAtivo(true);
    } else {
      console.log("acesso ao Microfone negado");
    }
  }

  return (
    <View style={styles.container}>
      <Text>KARAOKAOS</Text>
      <Text>Teste do microfone</Text>
      <Pressable style={styles.botao} onPress={ativarMicrofone}>
        <Text style={styles.textoB}>ATIVAR MICROFONE</Text>
      </Pressable>
      <Text> {microfoneAutorizado ? "Permissão do microfone concedida" : "Microfone ainda não autorizado"}</Text>
      <Text>{microfoneAtivo ? "Capturando audio" : "Microfone parado"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  botao: {
  backgroundColor: "#7157FF",
  paddingHorizontal: 24,
  paddingVertical: 14,
  borderRadius: 12,
  marginVertical: 16,
  },

  textoB: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
