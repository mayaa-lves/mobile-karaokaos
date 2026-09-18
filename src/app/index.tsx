import { StyleSheet, View } from "react-native";
import Logo from "../../components/Logo";
import PinInput from "../../components/PinInput";
import PrimaryButton from "../../components/PrimaryButton";
import { useState } from "react";

export default function Index() {

  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");

  const [etapa, setEtapa] = useState<"pin" | "nome">("pin");

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

  return (
    <View style={styles.container}>
      <Logo />

      {etapa === "pin" && (
        <>
          <PinInput value={pin} onChangeText={alterarPin} error={erro}/>

          <PrimaryButton title="ENTRAR" onPress={entrarNaSala}/>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});