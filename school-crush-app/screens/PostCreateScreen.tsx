import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { checkWordFilter } from '../lib/wordFilter';
import PremiumUpsellModal from '../components/PremiumUpsellModal';
import { Crown, Sparkles, AlertCircle, ShoppingBag, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Rate Limiting Logic
const checkRateLimitLocal = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const key = `posts_count_${today}`;
        const count = await AsyncStorage.getItem(key);
        return count ? parseInt(count, 10) : 0;
    } catch (e) {
        return 0;
    }
};

const incrementRateLimitLocal = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const key = `posts_count_${today}`;
        const current = await checkRateLimitLocal();
        await AsyncStorage.setItem(key, (current + 1).toString());
    } catch (e) {
        console.error(e);
    }
};

export default function PostCreateScreen({ navigation }: any) {
    const { user, profile, checkProfile } = useAuth();
    
    // Refresh profile state and check limit
    useEffect(() => {
        const checkStatus = async () => {
            if (user?.id) {
                // Falls noch nicht geladen oder Premium-Status nicht aktuell, prüfen
                await checkProfile(user.id);
            }
        };
        checkStatus();
    }, [user?.id]);

    // Separater Effekt für das Limit-Check, der auf Profile-Änderungen reagiert
    useEffect(() => {
        const verifyLimit = async () => {
            if (profile?.is_premium === true || profile?.is_premium === 'true') {
                setIsLimitReached(false);
            } else {
                const count = await checkRateLimit();
                setIsLimitReached(count >= 3);
            }
        };
        verifyLimit();
    }, [profile]);

    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isLimitReached, setIsLimitReached] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Rate Limiting Logic
    const checkRateLimit = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `posts_count_${today}`;
            const count = await AsyncStorage.getItem(key);
            return count ? parseInt(count, 10) : 0;
        } catch (e) {
            return 0;
        }
    };

    const incrementRateLimit = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const key = `posts_count_${today}`;
            const current = await checkRateLimit();
            await AsyncStorage.setItem(key, (current + 1).toString());
        } catch (e) {
            console.error(e);
        }
    };

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handlePost = async () => {
        if (!content.trim()) return;

        // 1. Validate Content Length
        if (content.length > 500) return;

        setLoading(true);

        // Debug: Log status
        console.log("Post-Erstellung: Nutzer Premium-Status ist:", !!profile?.is_premium);

        // 2. Rate Limiting Check
        if (profile?.is_premium === true || profile?.is_premium === 'true') {
            console.log("Post-Erstellung: Limit wird übersprungen (Premium erkannt)");
        } else {
            console.log("Post-Erstellung: Prüfe Limit (Nutzer ist kein Premium)");
            const dailyCount = await checkRateLimit();
            if (dailyCount >= 3) {
                showToast("Tageslimit erreicht! 🛑");
                setIsLimitReached(true);
                setLoading(false);
                return;
            }
        }

        // 3. Lokaler Wortfilter
        if (checkWordFilter(content.trim())) {
            showToast("Dein Beitrag enthält unangemessene Wörter und wurde nicht veröffentlicht.");
            setLoading(false);
            return;
        }

        // 4. Post to Supabase
        const userSchoolId = profile?.school_id;

        if (!userSchoolId) {
            showToast("Fehler: Keine Schule zugewiesen.");
            setLoading(false);
            return;
        }

        const { error } = await supabase.from('posts').insert({
            content: content.trim(),
            user_id: user?.id,
            school_id: userSchoolId,
        });

        if (error) {
            showToast(error.message);
            setLoading(false);
        } else {
            // Increment rate limit on success
            await incrementRateLimit();
            
            // Invoke the push notification edge function directly
            try {
                await supabase.functions.invoke('send-post-notification', {
                    body: {
                        school_id: userSchoolId,
                        post_content: content.trim(),
                        author_id: user?.id
                    }
                });
            } catch (invokeErr) {
                console.error("Fehler beim Senden der Push-Benachrichtigung:", invokeErr);
            }
            
            showToast("Erfolg! Herz ausgeschüttet ❤️");
            setTimeout(() => {
                setLoading(false);
                navigation.goBack();
            }, 1000);
        }
    };

    const getCounterColor = () => {
        if (content.length >= 500) return '#FF4444';
        if (content.length > 400) return '#FFA500';
        return '#666';
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Custom Toast */}
                {toastMessage && (
                    <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.toast}>
                        <Text style={styles.toastText}>{toastMessage}</Text>
                    </Animated.View>
                )}

                <LinearGradient
                    colors={['#1A1A2E', '#2D0A1F']}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.modalHeader}>
                    <View style={styles.headerTitleContainer}>
                        <View style={styles.headerIconBox}>
                            <Heart color="#FF10F0" size={18} fill="#FF10F0" />
                        </View>
                        <View>
                            <Text style={styles.modalTitle}>Neuer Crush</Text>
                            {profile?.is_premium && (
                                <View style={styles.premiumBadge}>
                                    <Sparkles color="#FFD700" size={10} style={{ marginRight: 4 }} />
                                    <Text style={styles.premiumBadgeText}>PREMIUM AKTIV</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={styles.closeButtonCircle}
                    >
                        <X color="#fff" size={20} />
                    </TouchableOpacity>
                </View>

                {isLimitReached ? (
                    <View style={styles.limitContainer}>
                        <View style={styles.limitCard}>
                            <View style={styles.limitIconBox}>
                                <LinearGradient
                                    colors={['#FFD700', '#B8860B']}
                                    style={styles.iconGradient}
                                >
                                    <Crown color="#fff" size={32} fill="#fff" />
                                </LinearGradient>
                            </View>
                            
                            <Text style={styles.limitTitle}>Tageslimit erreicht! 🛑</Text>
                            <Text style={styles.limitText}>
                                Du hast deine <Text style={styles.limitHighlight}>3 kostenlosen Posts</Text> für heute verbraucht. Möchtest du unbegrenzt posten?
                            </Text>
                            
                            <TouchableOpacity 
                                style={styles.limitUpgradeButtonContainer}
                                onPress={() => setShowModal(true)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={['#FF10F0', '#E100CC']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.limitUpgradeButton}
                                >
                                    <ShoppingBag color="#fff" size={20} style={{ marginRight: 10 }} />
                                    <Text style={styles.limitUpgradeText}>Krone aufsetzen & Unbegrenzt posten</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.tipBox}>
                            <Sparkles color="#FFD700" size={16} style={{ marginRight: 8 }} />
                            <Text style={styles.tipText}>
                                Wusstest du? Premium-Posts werden im Feed <Text style={styles.tipHighlight}>priorisiert</Text> angezeigt!
                            </Text>
                        </View>
                    </View>
                ) : (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Was liegt dir auf dem Herzen? 💭"
                            placeholderTextColor="rgba(255, 255, 255, 0.4)"
                            multiline
                            value={content}
                            onChangeText={setContent}
                            maxLength={500}
                            autoFocus
                        />

                        <View style={styles.footer}>
                            <View style={styles.counterContainer}>
                                <View style={[styles.counterDot, { backgroundColor: getCounterColor() }]} />
                                <Text style={[styles.counter, { color: getCounterColor() }]}>
                                    {content.length}/500 Zeichen
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.postButtonContainer}
                                onPress={handlePost}
                                disabled={!content.trim() || loading}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={!content.trim() ? ['#333', '#222'] : ['#FF10F0', '#E100CC']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.postButton}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <>
                                            <Text style={styles.postButtonText}>Herz ausschütten</Text>
                                            <Heart color="#fff" size={18} fill="#fff" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <PremiumUpsellModal 
                    visible={showModal} 
                    onClose={() => setShowModal(false)} 
                    onSubscribe={() => {
                        setShowModal(false);
                        navigation.navigate('Premium');
                    }}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E', // Dark Violet-Blue
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 16, 240, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    closeButtonCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 2,
    },
    premiumBadgeText: {
        color: '#FFD700',
        fontSize: 9,
        fontWeight: '900',
    },
    input: {
        flex: 1,
        padding: 20,
        fontSize: 18,
        color: '#fff',
        textAlignVertical: 'top',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.08)',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: 16,
    },
    counterDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    counter: {
        fontSize: 12,
        fontWeight: '700',
    },
    postButtonContainer: {
        width: '100%',
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    postButton: {
        borderRadius: 20,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    postButtonText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    toast: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        backgroundColor: '#FF10F0',
        padding: 12,
        borderRadius: 8,
        zIndex: 100,
        alignItems: 'center',
    },
    toastText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    premiumBadgeText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
        marginTop: 2,
    },
    limitContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    limitCard: {
        backgroundColor: 'rgba(74, 26, 47, 0.4)',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 215, 0, 0.25)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    limitIconBox: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
        elevation: 8,
    },
    limitTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    limitText: {
        color: '#E6B3CC',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    limitHighlight: {
        color: '#FFB6C1',
        fontWeight: 'bold',
    },
    limitUpgradeButtonContainer: {
        width: '100%',
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    limitUpgradeButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    limitUpgradeText: {
        color: '#fff',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.2,
    },
    tipBox: {
        flexDirection: 'row',
        marginTop: 30,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.15)',
    },
    tipText: {
        color: '#E6CCB3',
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    tipHighlight: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
});
