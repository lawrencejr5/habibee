import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  Text,
} from "react-native";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Feather } from "@expo/vector-icons";
import { useHapitcs } from "@/context/HapticsContext";
import { habitIcons } from "@/data/habits";

type Props = {
  visible: boolean;
  icons: any[]; // array of image sources
  selectedColor?: string;
  onClose: () => void;
  onSelect: (icon: any, color: string) => void;
};

const DEFAULT_COLORS = [
  "#c5c9cc",
  "#9b59b6",
  "#e74c3c",
  "#3498db",
  "#1abc9c",
  "#e67e22",
];

export default function IconColorPicker({
  visible,
  icons,
  selectedColor,
  onClose,
  onSelect,
}: Props) {
  const theme = useColorScheme();
  const haptics = useHapitcs();

  const [color, setColor] = React.useState<string>(
    selectedColor || DEFAULT_COLORS[0]
  );
  const [selectedIconIndex, setSelectedIconIndex] = React.useState<number>(0);

  React.useEffect(() => {
    if (!visible) return;
    setColor(selectedColor || DEFAULT_COLORS[0]);
    setSelectedIconIndex(0);
  }, [visible, selectedColor]);

  const pick = () => {
    const icon = icons[selectedIconIndex] || icons[0];
    onSelect(icon, color);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          { backgroundColor: Colors[theme].background + "cc" },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.centered,
            {
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
            },
          ]}
          onPress={() => {}}
        >
          <View style={styles.headerRow}>
            <Text
              style={{
                fontFamily: "NunitoExtraBold",
                fontSize: 20,
                color: Colors[theme].text,
              }}
            >
              Choose icon...
            </Text>
            <Pressable
              style={{ padding: 10 }}
              onPress={() => {
                haptics.impact();

                onClose();
              }}
            >
              <Feather name="x" color={Colors[theme].text} size={24} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.iconGrid}>
            {icons.map((src, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedIconIndex(i)}
                style={[
                  styles.iconWrap,
                  selectedIconIndex === i && {
                    borderColor: color,
                    borderWidth: 2,
                  },
                ]}
              >
                <Image
                  source={habitIcons[src]}
                  style={[styles.iconImage, { tintColor: color }]}
                />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.colorRow}>
            {DEFAULT_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c, borderWidth: color === c ? 3 : 0 },
                ]}
              />
            ))}
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={onClose}
              style={[
                styles.actionBtn,
                {
                  borderColor: Colors[theme].border,
                  backgroundColor: Colors[theme].surface,
                  paddingHorizontal: 15,
                },
              ]}
            >
              <Text
                style={{
                  color: Colors[theme].text_secondary,
                  fontFamily: "NunitoBold",
                }}
              >
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={pick}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: Colors[theme].primary,
                  flex: 1,
                },
              ]}
            >
              <Text style={{ color: "#fff", fontFamily: "NunitoBold" }}>
                Select
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  closeBtn: {
    padding: 6,
  },
  iconGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 6,
    paddingBottom: 12,
  },
  iconWrap: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
    borderWidth: 0,
    borderColor: "transparent",
  },
  iconImage: {
    width: 25,
    height: 25,
    resizeMode: "contain",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  swatch: {
    width: 35,
    height: 35,
    borderRadius: 18,
    borderColor: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 20,
    paddingBottom: 20,
  },
  actionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
  },
});
