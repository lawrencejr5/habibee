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

type Props = {
  visible: boolean;
  icons: any[]; // array of image sources
  selectedColor?: string;
  onClose: () => void;
  onSelect: (icon: any, color: string) => void;
};

const DEFAULT_COLORS = [
  "#c5c9cc",
  "#FF6B6B",
  "#FFB86B",
  "#FFD36B",
  "#6BFFB8",
  "#6BCBFF",
  "#8C6BFF",
  "#FF6BE0",
  "#6BFFDF",
];

export default function IconColorPicker({
  visible,
  icons,
  selectedColor,
  onClose,
  onSelect,
}: Props) {
  const theme = useColorScheme();
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
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={[
          styles.backdrop,
          { backgroundColor: Colors[theme].background + "CC" },
        ]}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: Colors[theme].surface,
              borderColor: Colors[theme].border,
            },
          ]}
        >
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, { color: Colors[theme].text }]}>
              Choose icon
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: Colors[theme].text_secondary }}>Close</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.iconGrid}>
            {icons.map((src, idx) => (
              <Pressable
                key={idx}
                onPress={() => setSelectedIconIndex(idx)}
                style={[
                  styles.iconWrap,
                  selectedIconIndex === idx && {
                    borderColor: color,
                    borderWidth: 2,
                  },
                ]}
              >
                <Image
                  source={src}
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
              style={[styles.actionBtn, { borderColor: Colors[theme].border }]}
            >
              <Text style={{ color: Colors[theme].text_secondary }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={pick}
              style={[
                styles.actionBtn,
                { backgroundColor: Colors[theme].primary },
              ]}
            >
              <Text style={{ color: "#fff", fontFamily: "NunitoBold" }}>
                Select
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    height: "60%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerText: {
    fontFamily: "NunitoExtraBold",
    fontSize: 18,
  },
  closeBtn: {
    padding: 6,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    margin: 6,
    borderWidth: 0,
    borderColor: "transparent",
  },
  iconImage: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  colorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 6,
    borderWidth: 1,
  },
});
