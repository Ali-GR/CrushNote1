import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Animated,
    Easing,
    Dimensions,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { X, RefreshCw } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const FEATURES = [
    { emoji: '🚫', title: 'Keine Werbung', desc: 'Genieße die App ohne störende Ads' },
    { emoji: '🚀', title: 'Mehr Posts', desc: 'Poste so viele Crushes, wie du möchtest' },
    { emoji: '🔥', title: 'Top Post', desc: 'Deine Posts werden mehr gesehen' },
    { emoji: '😂', title: 'Meme Power', desc: 'Reagiere mit Memes' },
    { emoji: '⭐', title: 'Premium Badge', desc: 'Werde sichtbar als Crush Plus Member' },
];

const BouncingHeart = ({ left, top, delay }: { left: number; top: number; delay: number }) => {
    const floatY = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatY, {
                    toValue: -22,
                    duration: 1700,
                    delay,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(floatY, {
                    toValue: 0,
                    duration: 1700,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.12,
                    duration: 1400,
                    delay,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 1400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [delay, floatY, scale]);

    return (
        <Animated.Text
            style={[
                styles.bgHeart,
                {
                    left,
                    top,
                    transform: [{ translateY: floatY }, { scale }],
                },
            ]}
        >
            ❤
        </Animated.Text>
    );
};

export default function PremiumScreen({ navigation }: any) {
    const { activatePremium, purchasePremium, restorePurchases, offerings, profile } = useAuth();
    const [selectedPackage, setSelectedPackage] = useState<any>(null);
    const [promoCode, setPromoCode] = useState('');
    const [isActivating, setIsActivating] = useState(false);
    const [isPurchasing, setIsPurchasing] = useState(false);

    // Animations
    const titleAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;
    const featureAnims = useRef(FEATURES.map(() => new Animated.Value(0))).current;

    useEffect(() => {
        // Default to yearly if available
        if (offerings && offerings.availablePackages && offerings.availablePackages.length > 0) {
            const yearly = offerings.availablePackages.find((p: any) => p.packageType === 'ANNUAL');
            setSelectedPackage(yearly || offerings.availablePackages[0]);
        }
    }, [offerings]);

    useEffect(() => {
        // Title fade-in
        Animated.timing(titleAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // Glow pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                Animated.timing(glowAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
            ])
        ).start();

        // Staggered feature list
        Animated.stagger(80, featureAnims.map(anim =>
            Animated.timing(anim, {
                toValue: 1,
                duration: 400,
                delay: 300,
                easing: Easing.out(Easing.back(1.5)),
                useNativeDriver: true,
            })
        )).start();
    }, []);

    const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        setIsPurchasing(true);
        const success = await purchasePremium(selectedPackage);
        setIsPurchasing(false);
        if (success) {
            Alert.alert("🔥 Willkommen!", "Du bist jetzt Crush Plus Member!", [
                { text: "Los geht's!", onPress: () => navigation.goBack() }
            ]);
        }
    };

    const handleRestore = async () => {
        await restorePurchases();
    };

    const handlePromoCode = async () => {
        if (promoCode.trim().toLowerCase() === 'entenpastete') {
            setIsActivating(true);
            const success = await activatePremium();
            setIsActivating(false);
            if (success) {
                Alert.alert("🔥 BOOM!", "Gutschein 'Entenpastete' akzeptiert! Du hast jetzt Premium. Viel Spaß! ⭐", [
                    { text: "Geil!", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Fehler", "Da ging was schief beim Aktivieren.");
            }
        } else if (promoCode.trim() !== "") {
            Alert.alert("Hä?", "Der Code ist leider falsch. 🦆");
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Glow */}
            <Animated.View style={[styles.bgGlow, { opacity: glowOpacity }]} />
            {[...Array(14)].map((_, i) => (
                <BouncingHeart
                    key={i}
                    left={(i * 71) % (width - 24)}
                    top={80 + ((i * 97) % 620)}
                    delay={i * 120}
                />
            ))}

            <SafeAreaView style={styles.safeArea}>
                {/* Header Row with Close Button */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} activeOpacity={0.7}>
                        <RefreshCw color="rgba(56,22,77,0.5)" size={16} />
                        <Text style={styles.restoreTxt}>Wiederherstellen</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
                        <X color="#fff" size={20} />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* HOOK */}
                    <Animated.View style={[styles.hookContainer, { opacity: titleAnim, transform: [{ translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                        <Text style={styles.hookEmoji}>👑</Text>
                        <Text style={styles.hookTitle}>Crush Plus</Text>
                        <Text style={styles.hookSubtitle}>Mehr aus deinen Schulposts rausholen 🔥</Text>
                    </Animated.View>

                    {/* FEATURES */}
                    <View style={styles.featuresContainer}>
                        {FEATURES.map((f, i) => (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.featureRow,
                                    {
                                        opacity: featureAnims[i],
                                        transform: [{
                                            translateX: featureAnims[i].interpolate({ inputRange: [0, 1], outputRange: [-20, 0] })
                                        }]
                                    }
                                ]}
                            >
                                <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
                                <View style={styles.featureLeft}>
                                    <Text style={styles.featureEmoji}>{f.emoji}</Text>
                                    <View style={styles.featureTextWrap}>
                                        <Text style={styles.featureTitle}>{f.title}</Text>
                                        <Text style={styles.featureDesc}>{f.desc}</Text>
                                    </View>
                                </View>
                                <View style={styles.checkmark}>
                                    <Text style={styles.checkmarkText}>✓</Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>

                    {/* PRICING */}
                    <Text style={styles.pricingLabel}>WÄHLE DEINEN PLAN</Text>

                    {!offerings ? (
                        <ActivityIndicator color="#FF10F0" style={{ marginVertical: 20 }} />
                    ) : offerings.availablePackages && offerings.availablePackages.length > 0 ? (
                        offerings.availablePackages.map((pkg: any) => {
                            const isSelected = selectedPackage?.identifier === pkg.identifier;
                            const isYearly = pkg.packageType === 'ANNUAL';

                            return (
                                <TouchableOpacity
                                    key={pkg.identifier}
                                    style={[styles.planCard, isSelected && styles.planCardActive]}
                                    onPress={() => setSelectedPackage(pkg)}
                                    activeOpacity={0.85}
                                >
                                    {isSelected && (
                                        <LinearGradient
                                            colors={['rgba(255,16,240,0.15)', 'rgba(120,0,255,0.15)']}
                                            style={StyleSheet.absoluteFill}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        />
                                    )}
                                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                                    
                                    {isYearly && (
                                        <View style={styles.planBadge}>
                                            <LinearGradient colors={['#FF10F0', '#7800FF']} style={styles.planBadgeGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                                <Text style={styles.planBadgeText}>🔥 BESTER DEAL</Text>
                                            </LinearGradient>
                                        </View>
                                    )}

                                    <View style={styles.planContent}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.planName}>
                                                {isYearly ? 'Jahres-Abo' : 'Monats-Abo'}
                                            </Text>
                                            <Text style={styles.planSavings}>
                                                {isYearly ? 'Du sparst 44% vs. Monatsabo 🎉' : 'Jederzeit'}
                                            </Text>
                                            {isYearly && (
                                                <Text style={styles.planTotalSubtext}>
                                                    Nur 19,99 € im Jahr — jederzeit kündbar
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.planPriceBox}>
                                            <Text style={styles.planPrice}>
                                                {isYearly ? '1,66€' : '2,99€'}
                                            </Text>
                                            <Text style={styles.planPeriod}>/Monat</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.planRadio, isSelected && styles.planRadioActive]}>
                                        {isSelected && <View style={styles.planRadioDot} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#38164D', textAlign: 'center' }}>
                                Aktuell können keine Pakete geladen werden. Bitte überprüfe deine Internetverbindung.
                            </Text>
                        </View>
                    )}

                    {/* CTA Button */}
                    <TouchableOpacity 
                        onPress={handlePurchase} 
                        activeOpacity={0.8} 
                        style={styles.ctaContainer}
                        disabled={isPurchasing || !selectedPackage}
                    >
                        <LinearGradient
                            colors={['#FF10F0', '#7800FF']}
                            style={styles.ctaButton}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {isPurchasing ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.ctaText}>Werde Crush Plus Member</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* PROMO CODE */}
                    {!profile?.is_premium ? (
                        <View style={styles.promoContainer}>
                            <TextInput
                                style={styles.promoInput}
                                placeholder="Gutscheincode..."
                                placeholderTextColor="rgba(56,22,77,0.3)"
                                value={promoCode}
                                onChangeText={setPromoCode}
                                autoCapitalize="none"
                            />
                            <TouchableOpacity 
                                style={styles.promoBtn} 
                                onPress={handlePromoCode}
                                disabled={isActivating || !promoCode.trim()}
                            >
                                {isActivating ? (
                                    <ActivityIndicator size="small" color="#FF10F0" />
                                ) : (
                                    <Text style={styles.promoBtnText}>Aktivieren</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.activeLabel}>
                            <Text style={styles.activeLabelText}>👑 PREMIUM AKTIV</Text>
                        </View>
                    )}

                    {/* Trust */}
                    <Text style={styles.trustText}>
                        Jederzeit kündbar · Sicher bezahlen über Google &amp; Apple Pay · Kein Risiko
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8EEFF',
    },
    bgHeart: {
        position: 'absolute',
        fontSize: 16,
        color: 'rgba(255, 16, 240, 0.22)',
    },
    bgGlow: {
        position: 'absolute',
        top: -100,
        left: width / 2 - 150,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: '#FFD3F6',
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 120,
        elevation: 30,
    },
    safeArea: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
    },
    restoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 8,
    },
    restoreTxt: {
        color: 'rgba(56,22,77,0.5)',
        fontSize: 12,
        fontWeight: '600',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(90,40,110,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    scrollContent: {
        padding: 24,
        paddingTop: 40,
        paddingBottom: 40,
    },
    hookContainer: {
        alignItems: 'center',
        marginBottom: 36,
    },
    hookEmoji: {
        fontSize: 56,
        marginBottom: 12,
    },
    hookTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: '#38164D',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    hookSubtitle: {
        fontSize: 17,
        color: 'rgba(56,22,77,0.68)',
        marginTop: 8,
        textAlign: 'center',
    },
    featuresContainer: {
        marginBottom: 32,
        gap: 10,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 14,
        padding: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(143,92,170,0.15)',
        backgroundColor: 'rgba(255,255,255,0.7)',
    },
    featureLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    featureEmoji: {
        fontSize: 26,
    },
    featureTextWrap: {
        flex: 1,
        flexShrink: 1,
        paddingRight: 8,
    },
    featureTitle: {
        color: '#38164D',
        fontSize: 15,
        fontWeight: '700',
    },
    featureDesc: {
        color: 'rgba(56,22,77,0.65)',
        fontSize: 12,
        marginTop: 2,
        lineHeight: 17,
    },
    checkmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,16,240,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkText: {
        color: '#FF10F0',
        fontSize: 13,
        fontWeight: 'bold',
    },
    pricingLabel: {
        color: '#7C4A9A',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    planCard: {
        borderRadius: 18,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(143,92,170,0.25)',
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 18,
    },
    planCardActive: {
        borderColor: '#FF10F0',
    },
    planBadge: {
        alignSelf: 'flex-start',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
    },
    planBadgeGradient: {
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    planBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    planContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    planName: {
        color: '#38164D',
        fontSize: 17,
        fontWeight: '700',
    },
    planSavings: {
        color: '#ff10f0',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 4,
    },
    planTotalSubtext: {
        color: '#38164D',
        fontSize: 14,
        marginTop: 6,
        fontWeight: '600',
    },
    planPriceBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 2,
        marginRight: 32,
    },
    planPrice: {
        color: '#38164D',
        fontSize: 26,
        fontWeight: '900',
    },
    planPeriod: {
        color: 'rgba(56,22,77,0.6)',
        fontSize: 13,
        marginBottom: 3,
    },
    planRadio: {
        position: 'absolute',
        right: 16,
        bottom: 18,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    planRadioActive: {
        borderColor: '#FF10F0',
    },
    planRadioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF10F0',
    },
    ctaContainer: {
        marginTop: 8,
        marginBottom: 16,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 12,
    },
    ctaButton: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 64,
    },
    ctaText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    promoContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(56,22,77,0.05)',
        borderRadius: 12,
        marginBottom: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: 'rgba(56,22,77,0.1)',
        marginTop: 10,
    },
    promoInput: {
        flex: 1,
        paddingHorizontal: 12,
        color: '#38164D',
        fontSize: 14,
    },
    promoBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,16,240,0.1)',
        borderRadius: 8,
    },
    promoBtnText: {
        color: '#FF10F0',
        fontWeight: 'bold',
        fontSize: 14,
    },
    activeLabel: {
        backgroundColor: 'rgba(255,16,240,0.1)',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    activeLabelText: {
        color: '#FF10F0',
        fontWeight: 'bold',
    },
    trustText: {
        color: 'rgba(56,22,77,0.5)',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
});
