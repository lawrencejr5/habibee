import { Pressable, StyleSheet, Text, ScrollView } from "react-native";
import React from "react";
import * as Haptics from "expo-haptics";
import { View as ThemedView, Text as ThemedText } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";

const TermsPage = () => {
    const insets = useSafeAreaInsets();
    const theme = useColorScheme();

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
                <ThemedText
                    style={{ fontFamily: "NunitoBold", fontSize: 24, marginTop: 10, marginBottom: 20 }}
                >
                    Terms & Conditions
                </ThemedText>

                <ThemedText style={styles.text}>
                    Welcome to Habibee! By creating an account and using our application, you agree to the following terms and conditions.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    1. Acceptance of Terms
                </ThemedText>
                <ThemedText style={styles.text}>
                    By accessing or using Habibee, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the App.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    2. User Accounts
                </ThemedText>
                <ThemedText style={styles.text}>
                    You are responsible for safeguarding the password that you use to access the App and for any activities or actions under your password.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    3. Use of the App
                </ThemedText>
                <ThemedText style={styles.text}>
                    You agree not to misuse the App or help anyone else do so. You must not use the App for any illegal or unauthorized purpose.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    4. Content
                </ThemedText>
                <ThemedText style={styles.text}>
                    Our App allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the App.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    5. Changes
                </ThemedText>
                <ThemedText style={styles.text}>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion.
                </ThemedText>

                <ThemedText style={[styles.text, { marginTop: 20, marginBottom: 40 }]}>
                    Last updated: January 2026
                </ThemedText>

            </ScrollView>
        </ThemedView>
    );
};

export default TermsPage;

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
