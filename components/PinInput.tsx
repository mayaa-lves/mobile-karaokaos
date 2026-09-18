import { StyleSheet, TextInput, Text, View } from "react-native";

type PinInputProps = {
        value: string;
        onChangeText: (text: string) => void;
        error: string;
    };
    
export default function PinInput({value, onChangeText, error,}: PinInputProps) {
    
    return (
        <View>
            <TextInput
            style={styles.input}
            placeholder="PIN DA SALA"
            keyboardType="number-pad"
            maxLength={4}
            value={value}
            onChangeText={onChangeText}
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
})