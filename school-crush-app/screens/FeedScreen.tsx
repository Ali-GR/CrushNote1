import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, Dimensions, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { PostCard } from '../components/PostCard';
import { Plus, LogOut, Heart, User, Settings, Shield } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingHeart } from '../components/HeartAnimation';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// Only require AdMob if not in Expo Go to avoid missing native module crash
let BannerAd: any, BannerAdSize: any, TestIds: any;
if (!isExpoGo) {
    try {
        const AdMob = require('react-native-google-mobile-ads');
        BannerAd = AdMob.BannerAd;
        BannerAdSize = AdMob.BannerAdSize;
        TestIds = AdMob.TestIds;
    } catch (e) {
        console.warn("AdMob module not found, skipping ads.");
    }
}

const AD_UNIT_ID = (isExpoGo || !TestIds)
  ? 'unused'
  : __DEV__ 
    ? TestIds.ADAPTIVE_BANNER 
    : (Platform.OS === 'ios' 
        ? process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID 
        : process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID) || TestIds.ADAPTIVE_BANNER;

const { width } = Dimensions.get('window');

export default function FeedScreen({ navigation }: any) {
    const { signOut, user, profile } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});

    // Animation for FAB pulse
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const fetchPosts = useCallback(async () => {
        if (!profile?.school_id) {
            console.log("FeedScreen: No school_id, skipping fetch.");
            return;
        }

        console.log("FeedScreen: Fetching posts for school:", profile.school_id);

        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles(id, nickname, school_id), schools(id, name)')
                .eq('school_id', profile.school_id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Fetch posts error:", error.message);
            } else if (data) {
                console.log("FeedScreen: Fetched posts count:", data.length);
                setPosts(data);

                // Fetch comment counts
                const postIds = data.map((p: any) => p.id);
                if (postIds.length > 0) {
                    const { data: commentsData } = await supabase
                        .from('comments')
                        .select('post_id')
                        .in('post_id', postIds);

                    if (commentsData) {
                        const counts: Record<string, number> = {};
                        commentsData.forEach((c: any) => {
                            counts[c.post_id] = (counts[c.post_id] || 0) + 1;
                        });
                        setCommentCounts(counts);
                    }
                }
            }
        } catch (err) {
            console.error("FeedScreen: Exception in fetchPosts:", err);
        } finally {
            setRefreshing(false);
        }
    }, [profile?.school_id]);

    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [fetchPosts])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const addHeart = () => {
        const id = Date.now();
        const x = Math.random() * (width - 50); // Random horizontal position
        setHearts(prev => [...prev, { id, x }]);
    };

    const removeHeart = (id: number) => {
        setHearts(prev => prev.filter(h => h.id !== id));
    };

    return (
        <View
            style={[styles.container, { backgroundColor: '#cc2952' }]}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.headerBar}>
                    <View style={styles.header}>
                        {/* Left: Heart + Title */}
                        <View style={styles.headerLeft}>
                            <Heart color="#FF10F0" fill="#FF10F0" size={32} />
                            <Text style={styles.headerTitle}>
                                <Text style={styles.headerTitleCrush}>Crush</Text>
                                <Text style={styles.headerTitleNote}> Note</Text>
                            </Text>
                        </View>

                        {/* Right: Profile/Settings */}
                        <TouchableOpacity
                            style={styles.headerProfileButton}
                            onPress={() => navigation.navigate('Settings')}
                            activeOpacity={0.8}
                        >
                            <User color="#FF10F0" size={22} />
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={(() => {
                        const dataWithAds = [];
                        posts.forEach((post, index) => {
                            dataWithAds.push(post);
                            // Insert ad every 4th post
                            if ((index + 1) % 4 === 0) {
                                dataWithAds.push({ id: `ad-${index}`, isAd: true });
                            }
                        });
                        return dataWithAds;
                    })()}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        if (item.isAd) {
                            if (isExpoGo) {
                                return (
                                    <View style={[styles.adContainer, { height: 60, justifyContent: 'center' }]}>
                                        <Text style={styles.adLabel}>Werbung Platzhalter (In Expo Go deaktiviert)</Text>
                                    </View>
                                );
                            }
                            return (
                                <View style={styles.adContainer}>
                                    <Text style={styles.adLabel}>Anzeige</Text>
                                    <BannerAd
                                        unitId={AD_UNIT_ID}
                                        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                                    />
                                </View>
                            );
                        }
                        return (
                            <PostCard
                                post={item}
                                onPress={() => navigation.navigate('Comments', { post: item })}
                                onLike={addHeart}
                                onReport={() => navigation.navigate('Report', { targetId: item.id, type: 'post' })}
                                userId={user?.id}
                                commentCount={commentCounts[item.id] || 0}
                            />
                        );
                    }}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF10F0" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No posts yet. Be the first!</Text>
                        </View>
                    }
                />

                {hearts.map(heart => (
                    <FloatingHeart
                        key={heart.id}
                        startX={heart.x}
                        onComplete={() => removeHeart(heart.id)}
                    />
                ))}

                <TouchableOpacity
                    onPress={() => navigation.navigate('CreatePost')}
                    style={styles.fabContainer}
                    activeOpacity={0.8}
                >
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        {/* Using View for solid color instead of Gradient for exact requested hex, or Gradient with same colors */}
                        <View style={[styles.fab, { backgroundColor: '#1A1A2E', shadowColor: '#FF10F0', elevation: 10 }]}>
                            <Plus color="#FF10F0" size={32} />
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    headerBar: {
        backgroundColor: '#1A1A2E', // Gleiche Farbe wie die Posts
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 16, 240, 0.2)',
        zIndex: 10,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 16, 240, 0.5)',
        textShadowRadius: 8,
    },
    headerTitleCrush: {
        color: '#FF3B3B', // Rot
    },
    headerTitleNote: {
        color: '#FF10F0', // Hell-Pink für besseren Kontrast auf dunklem Hintergrund
    },
    headerProfileButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 16, 240, 0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255, 16, 240, 0.4)',
    },
    headerSchool: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerNickname: {
        color: '#rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#FFD7D7', // Light Red-White
        fontSize: 16,
        fontStyle: 'italic',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        elevation: 10,
        shadowColor: '#FF3B3B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 15,
        zIndex: 100,
    },
    fab: {
        width: 70, // Slightly bigger
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    adContainer: {
        marginVertical: 12,
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        paddingVertical: 10,
        overflow: 'hidden',
    },
    adLabel: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 10,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});
