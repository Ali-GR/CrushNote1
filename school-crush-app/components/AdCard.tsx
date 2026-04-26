import React, { useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { BlurView } from 'expo-blur';

/**
 * AdCard - Jetzt mit Google AdMob Integration.
 * Verbessert: Passt sich dem Design der PostCards an.
 */

const AD_UNIT_ID = Platform.select({
    android: process.env.EXPO_PUBLIC_AD_UNIT_ID_ANDROID || "ca-app-pub-2229065647862844/6151576691",
    ios: process.env.EXPO_PUBLIC_AD_UNIT_ID_IOS || "ca-app-pub-2229065647862844/9617280037",
    default: process.env.EXPO_PUBLIC_AD_UNIT_ID_IOS || "ca-app-pub-2229065647862844/9617280037",
});

const adUnitId = __DEV__ ? TestIds.ADAPTIVE_BANNER : AD_UNIT_ID;

import { useAuth } from '../context/AuthContext';

export const AdCard: React.FC<{ feedIndex: number }> = () => {
    const { profile } = useAuth();
    const [hasError, setHasError] = useState(false);

    // Wenn Nutzer Premium hat, niemals Werbung anzeigen
    if (profile?.is_premium) return null;

    // Falls die Werbung nicht geladen werden kann oder das Modul fehlt (z.B. in Expo Go), 
    // zeigen wir die Karte gar nicht erst an
    if (hasError || !BannerAd) return null;

    return (
        <View style={styles.cardContainer}>
            <View style={styles.glassBackground} />
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            <View style={styles.cardInner}>
                <View style={styles.header}>
                    <Text style={styles.sponsoredText}>Gesponsert</Text>
                </View>

                <View style={styles.adWrapper}>
                    <BannerAd
                        unitId={adUnitId}
                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: true,
                        }}
                        onAdFailedToLoad={(error) => {
                            console.log('AdMob Error:', error.message);
                            setHasError(true);
                        }}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        borderRadius: 16,
        marginBottom: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 16, 240, 0.2)',
        backgroundColor: 'rgba(26, 26, 46, 0.8)',
    },
    glassBackground: {
        ...StyleSheet.absoluteFillObject,
    },
    cardInner: {
        padding: 16,
    },
    header: {
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        paddingBottom: 8,
    },
    sponsoredText: {
        color: '#FF10F0',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    adWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50, // Reserviert Platz für den Banner
    }
});

