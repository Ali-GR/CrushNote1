import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    FlatList,
    NativeSyntheticEvent,
    NativeScrollEvent,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        emoji: '💌',
        title: 'Dein Crush.\nDein Geheimnis.',
        subtitle: 'Teile anonym, was du fühlst – nur für deine Schule sichtbar. 🤫',
        gradient: ['#2d0a1f', '#5c1040'] as [string, string],
        accentColor: '#ff69b4',
    },
    {
        id: '2',
        emoji: '🏫',
        title: 'Exklusiv für\ndeine Schule.',
        subtitle: 'Keine Fremden. Keine Fake-Profile. Nur deine Mitschüler und du. 🤝',
        gradient: ['#1a0a35', '#3d1a6e'] as [string, string],
        accentColor: '#c084fc',
    },
    {
        id: '3',
        emoji: '👑',
        title: 'Werde zur\nLegende.',
        subtitle: 'Mit Crush Plus: Keine Ads, unbegrenzt Posts und der goldene Badge. ✨',
        gradient: ['#1a0a1f', '#4a0a40'] as [string, string],
        accentColor: '#FF10F0',
    },
];

interface Props {
    navigation: any;
}

export default function OnboardingSlidesScreen({ navigation }: Props) {
    const { setSlidesSeen } = useAuth();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(index);
    };

    const goNext = async () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        setSlidesSeen(true);
    };

    const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
        <LinearGradient colors={item.gradient} style={styles.slide}>
            {/* Floating hearts background */}
            {[...Array(8)].map((_, i) => (
                <Text
                    key={i}
                    style={[
                        styles.bgHeart,
                        {
                            left: (i * 67) % (width - 30),
                            top: 60 + ((i * 113) % (height * 0.6)),
                            fontSize: 12 + (i % 3) * 6,
                            opacity: 0.12 + (i % 3) * 0.06,
                            color: item.accentColor,
                        },
                    ]}
                >
                    ❤
                </Text>
            ))}

            <View style={styles.slideContent}>
                {/* Emoji Circle */}
                <View style={[styles.emojiCircle, { borderColor: item.accentColor + '40', backgroundColor: item.accentColor + '15' }]}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                </View>

                {/* Title */}
                <Text style={[styles.slideTitle, { color: '#fff' }]}>{item.title}</Text>

                {/* Accent line */}
                <View style={[styles.accentLine, { backgroundColor: item.accentColor }]} />

                {/* Subtitle */}
                <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
            </View>
        </LinearGradient>
    );

    const currentSlide = SLIDES[currentIndex];
    const isLast = currentIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Slides */}
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={handleScroll}
                scrollEventThrottle={16}
            />

            {/* Bottom Controls */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.bottomOverlay}
                pointerEvents="box-none"
            >
                <SafeAreaView edges={['bottom']} style={styles.bottomControls}>
                    {/* Dots */}
                    <View style={styles.dotsRow}>
                        {SLIDES.map((_, i) => {
                            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                            const dotWidth = scrollX.interpolate({
                                inputRange,
                                outputRange: [8, 28, 8],
                                extrapolate: 'clamp',
                            });
                            const opacity = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.4, 1, 0.4],
                                extrapolate: 'clamp',
                            });
                            return (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        { width: dotWidth, opacity, backgroundColor: currentSlide.accentColor },
                                    ]}
                                />
                            );
                        })}
                    </View>

                    {/* Next / Start Button */}
                    <TouchableOpacity
                        style={styles.nextButtonWrapper}
                        onPress={goNext}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#FF10F0', '#7800FF']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.nextButton}
                        >
                            <Text style={styles.nextButtonText}>
                                {isLast ? 'Jetzt loslegen 🚀' : 'Weiter →'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Skip */}
                    {!isLast && (
                        <TouchableOpacity onPress={finishOnboarding} style={styles.skipButton}>
                            <Text style={styles.skipText}>Überspringen</Text>
                        </TouchableOpacity>
                    )}
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2d0a1f',
    },
    slide: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgHeart: {
        position: 'absolute',
        fontWeight: 'bold',
    },
    slideContent: {
        alignItems: 'center',
        paddingHorizontal: 36,
        marginTop: -80,
    },
    emojiCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    emoji: {
        fontSize: 56,
    },
    slideTitle: {
        fontSize: 38,
        fontWeight: '900',
        textAlign: 'center',
        lineHeight: 46,
        letterSpacing: -0.5,
        marginBottom: 16,
    },
    accentLine: {
        width: 48,
        height: 4,
        borderRadius: 2,
        marginBottom: 20,
    },
    slideSubtitle: {
        fontSize: 17,
        color: 'rgba(255,255,255,0.72)',
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 8,
    },
    bottomOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingTop: 60,
    },
    bottomControls: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 12,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 28,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    nextButtonWrapper: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 12,
        marginBottom: 14,
    },
    nextButton: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    skipButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 4,
    },
    skipText: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 14,
        fontWeight: '600',
    },
});
