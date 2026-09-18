import { Text, View, StyleSheet } from "react-native";

export default function Logo() {
    return (
        <View style={styles.container}>
            <Text style={styles.karaoke}>KARAOKE</Text>
            <Text style={styles.chaos}>CHAOS</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
    },
    karaoke: {
        fontSize: 28,
        fontWeight: "900",
        color: "#111111",
        letterSpacing: 2,
    },
    chaos: {
        fontSize: 28,
        fontWeight: "900",
        color: "#7157FF",
        letterSpacing: 2,
    },
});