import { StyleSheet, Text, View } from "react-native";

export default function Logo() {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.karaoke}>
          KARAOKE
        </Text>

        <Text style={styles.chaos}>
          CHAOS
        </Text>
      </View>

      <View style={styles.wave}>
        <View style={[styles.waveBar, { height: 14 }]} />
        <View style={[styles.waveBar, { height: 24 }]} />
        <View style={[styles.waveBar, { height: 34 }]} />
        <View style={[styles.waveBar, { height: 22 }]} />
        <View style={[styles.waveBar, { height: 42 }]} />
        <View style={[styles.waveBar, { height: 28 }]} />
        <View style={[styles.waveBar, { height: 18 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },

  karaoke: {
    color: "#111111",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
    lineHeight: 36,
  },

  chaos: {
    color: "#633CFF",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1,
    lineHeight: 38,
  },

  wave: {
    height: 46,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  waveBar: {
    width: 5,
    borderRadius: 10,
    backgroundColor: "#7157FF",
  },
});