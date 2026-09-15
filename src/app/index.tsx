import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  function ativarMicrofone() {
    console.log("Botão pressionado!");
  }

  return (
    <View style={styles.container}>
      <Text>KARAOKAOS</Text>
      <Text>Teste do microfone</Text>
      <Pressable onPress={ativarMicrofone}>
        <Text>ATIVAR MICROFONE</Text>
      </Pressable>
      <Text>Microfone ainda não iniciado</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
