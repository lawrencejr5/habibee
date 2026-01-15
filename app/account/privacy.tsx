import { Pressable, StyleSheet, Text, ScrollView } from "react-native";
import React from "react";
import * as Haptics from "expo-haptics";
import { View as ThemedView, Text as ThemedText } from "@/components/Themed";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { FontAwesome6 } from "@expo/vector-icons";
import { router } from "expo-router";

const PrivacyPage = () => {
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
                    Privacy Policy
                </ThemedText>

                <ThemedText style={styles.text}>
                    Your privacy is important to us. It is Habibee policy to respect your privacy regarding any information we may collect from you across our application.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    1. Information We Collect
                </ThemedText>
                <ThemedText style={styles.text}>
                    We only collect information about you if we have a reason to do so – for example, to provide our Services, to communicate with you, or to make our Services better.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    2. How We Use Information
                </ThemedText>
                <ThemedText style={styles.text}>
                    We use the information we collect in various ways, including to:
                    {"\n"}• Provide, operate, and maintain our App
                    {"\n"}• Improve, personalize, and expand our App
                    {"\n"}• Understand and analyze how you use our App
                    {"\n"}• Develop new products, services, features, and functionality
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    3. Security
                </ThemedText>
                <ThemedText style={styles.text}>
                    We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. But remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security.
                </ThemedText>

                <ThemedText style={styles.subHeader}>
                    4. Contact Us
                </ThemedText>
                <ThemedText style={styles.text}>
                    If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us.
                </ThemedText>

                <ThemedText style={[styles.text, { marginTop: 20, marginBottom: 40 }]}>
                    Last updated: January 2026
                </ThemedText>

            </ScrollView>
        </ThemedView>
    );
};

export default PrivacyPage;

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
