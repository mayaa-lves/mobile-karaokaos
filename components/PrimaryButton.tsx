import { Pressable, StyleSheet, Text } from "react-native";

type PrimaryButtonProps = {
    title:string;
    onPress: () => void;
};

export default function PrimaryButton({title, onPress}: PrimaryButtonProps) {
    return (
        <Pressable style={styles.button} onPress={onPress}>
            <Text style={styles.text}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
  button: {
    width: 280,
    minHeight: 58,
    backgroundColor: "#633CFF",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#633CFF",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },

  text: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
