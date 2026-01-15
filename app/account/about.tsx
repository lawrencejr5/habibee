import {
    Pressable,
    StyleSheet,
    Text,
    ScrollView,
    Image,
    View,
} from "react-native";
import React from "react";
import * as Haptics from "expo-haptics";
import { View as ThemedView, Text as ThemedText } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useTheme } from "@/context/ThemeContext";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";

const AboutPage = () => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();

    return (
        <ThemedView
            style={{
                flex: 1,
                paddingVertical: insets.top + 5,
                paddingHorizontal: 20,
            }}
        >
            <Pressable
                style={{ padding: 10, paddingLeft: 0 }}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }}
            >
                <FontAwesome6 name="arrow-left" color={Colors[theme].text} size={24} />
            </Pressable>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: "center", marginVertical: 20 }}>
                    <Image
                        source={
                            theme === "dark"
                                ? require("@/assets/images/icon-nobg-white.png")
                                : require("@/assets/images/icon-nobg-black.png")
                        }
                        style={{ width: 120, height: 120 }}
                        resizeMode="contain"
                    />
                </View>
                <ThemedText
                    style={{ fontFamily: "NunitoBold", fontSize: 24, marginTop: 10, marginBottom: 20 }}
                >
                    About Habibee
                </ThemedText>

                <ThemedText style={styles.text}>
                    Habibee is your ultimate companion for building better habits and achieving your goals.
                    Designed with simplicity and effectiveness in mind, Habibee helps you track your daily routines,
                    stay motivated, and visualize your progress.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    Why Habibee?
                </ThemedText>
                <ThemedText style={styles.text}>
                    We believe that small, consistent actions lead to significant changes over time.
                    Whether you want to drink more water, read daily, or exercise, Habibee provides the
                    tools you need to succeed.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    Features
                </ThemedText>
                <ThemedText style={styles.text}>
                    • Simple and intuitive habit tracking{"\n"}
                    • AI-powered insights and recommendations{"\n"}
                    • Weekly statistics and progress visualization{"\n"}
                    • Customizable themes (Dark/Light mode){"\n"}
                    • Motivational messages to keep you going
                </ThemedText>

                <ThemedText style={[styles.text, { marginTop: 30, textAlign: 'center', opacity: 0.6 }]}>
                    Version 1.0.0{"\n"}
                    Made with ❤️ by the Oputa Lawrence
                </ThemedText>

            </ScrollView>
        </ThemedView>
    );
};

export default AboutPage;

const styles = StyleSheet.create({
    text: {
        fontFamily: "NunitoMedium",
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 15,
    },
    subHeader: {
        fontFamily: "NunitoBold",
        fontSize: 18,
        marginTop: 15,
        marginBottom: 10,
    }
});
