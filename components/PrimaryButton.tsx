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
    width: 260,
    height: 56,
    backgroundColor: "#7157FF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  text: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
