import { StyleSheet, TextInput, Text, View } from "react-native";

type NameInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  error: string;
};

export default function NameInput({
  value,
  onChangeText, error,
}: NameInputProps) {
  return (
    <View>
        <TextInput
            style={styles.input}
            placeholder="SEU NOME"
            value={value}
            onChangeText={onChangeText}
            maxLength={16}
        />

        {error !== "" && (
            <Text style={styles.error}>{error}</Text>
        )}
    </View>
   
  );
}

const styles = StyleSheet.create({
  input: {
    width: 260,
    height: 56,
    borderWidth: 2,
    borderColor: "#111111",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: "center",
  },
    error: {
    marginTop: 8,
    fontSize: 13,
    color: "#D93025",
    textAlign: "center",
  },
});