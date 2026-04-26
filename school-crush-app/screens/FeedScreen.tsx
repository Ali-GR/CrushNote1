import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Text, TouchableOpacity, Dimensions, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { PostCard } from '../components/PostCard';
import { AdCard } from '../components/AdCard';
import { Plus, LogOut, Heart, User, Settings, Shield } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingHeart } from '../components/HeartAnimation';
import PremiumUpsellModal from '../components/PremiumUpsellModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, ChevronRight } from 'lucide-react-native';

// ---------------------------------------------------------------------------
// Feed-Manager: Mische normale Posts mit Werbeanzeigen.
// Regel: nach jeweils 3 Posts → 1 Anzeige  (Position % 4 === 3)
// ---------------------------------------------------------------------------
type FeedItem =
    | { kind: 'post'; data: any }
    | { kind: 'ad'; feedIndex: number };

function buildFeedItems(posts: any[], isPremium: boolean): FeedItem[] {
    const items: FeedItem[] = [];
    if (isPremium) {
        // No ads for premium users
        return posts.map(p => ({ kind: 'post', data: p }));
    }

    let postIdx = 0;

    // Wir iterieren durch die Feed-Positionen (0-basiert).
    // (feedIndex + 1) % 4 === 0  →  Anzeige  (Pos. 3, 7, 11, …)
    // Sonst                       →  normaler Post
    let feedIndex = 0;
    while (postIdx < posts.length) {
        if ((feedIndex + 1) % 4 === 0) {
            items.push({ kind: 'ad', feedIndex });
        } else {
            items.push({ kind: 'post', data: posts[postIdx] });
            postIdx++;
        }
        feedIndex++;
    }
    return items;
}

const { width } = Dimensions.get('window');

export default function FeedScreen({ navigation }: any) {
    const { signOut, user, profile } = useAuth();
    const [posts, setPosts] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);
    const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    // Animation for FAB pulse
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Check for premium upsell on session start — max. 1x pro Tag
    useEffect(() => {
        const checkSession = async () => {
            if (profile && !profile.is_premium) {
                const lastShown = await AsyncStorage.getItem('upsell_last_shown');
                const today = new Date().toDateString();
                if (lastShown !== today) {
                    setTimeout(() => {
                        setShowPremiumModal(true);
                        AsyncStorage.setItem('upsell_last_shown', today);
                    }, 2000);
                }
            }
        };
        checkSession();
    }, [profile?.id, profile?.is_premium]);

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
                .select('*, profiles(id, nickname, school_id, is_premium), schools(id, name)')
                .eq('school_id', profile.school_id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Fetch posts error:", error.message);
            } else if (data) {
                // Ranking Boost: Premium posts first, then regular posts (both sorted by date)
                const sortedData = [...data].sort((a, b) => {
                    const aIsPremium = a.profiles?.is_premium ? 1 : 0;
                    const bIsPremium = b.profiles?.is_premium ? 1 : 0;
                    if (aIsPremium !== bIsPremium) {
                        return bIsPremium - aIsPremium;
                    }
                    return 0; // Keep the 'created_at' order from the query
                });
                
                console.log("FeedScreen: Fetched posts count:", data.length);
                setPosts(sortedData);

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

    const handleDeletePost = (postId: string) => {
        Alert.alert(
            "Beitrag löschen",
            "Möchtest du diesen Beitrag wirklich löschen?",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Löschen",
                    style: "destructive",
                    onPress: async () => {
                        const { error } = await supabase
                            .from('posts')
                            .delete()
                            .eq('id', postId);

                        if (!error) {
                            setPosts(prev => prev.filter(p => p.id !== postId));
                        } else {
                            Alert.alert("Fehler", "Beitrag konnte nicht gelöscht werden.");
                        }
                    }
                }
            ]
        );
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
                    data={buildFeedItems(posts, !!profile?.is_premium)}
                    keyExtractor={(item, index) =>
                        item.kind === 'post' ? item.data.id : `ad-${index}`
                    }
                    renderItem={({ item }: { item: FeedItem }) => {
                        if (item.kind === 'ad') {
                            return <AdCard feedIndex={item.feedIndex} />;
                        }
                        return (
                            <PostCard
                                post={item.data}
                                onPress={() => navigation.navigate('Comments', { postId: item.data.id })}
                                onLike={addHeart}
                                onReport={() => navigation.navigate('Report', { targetId: item.data.id, type: 'post' })}
                                userId={user?.id}
                                commentCount={commentCounts[item.data.id] || 0}
                                onDelete={() => handleDeletePost(item.data.id)}
                            />
                        );
                    }}
                    contentContainerStyle={styles.list}
                    ListHeaderComponent={
                        (!profile?.is_premium) ? (
                            <TouchableOpacity 
                                style={styles.premiumBanner}
                                onPress={() => navigation.navigate('Premium')}
                                activeOpacity={0.9}
                            >
                                <LinearGradient
                                    colors={['#FF10F0', '#9D50BB']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.bannerGradient}
                                >
                                    <Sparkles color="#fff" size={20} />
                                    <Text style={styles.bannerText}>
                                        Hol dir Premium für werbefreies Posten & GIFs! 💎
                                    </Text>
                                    <ChevronRight color="#fff" size={18} />
                                </LinearGradient>
                            </TouchableOpacity>
                        ) : null
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF10F0" />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Noch keine Posts. Sei der Erste! 💌</Text>
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

                <PremiumUpsellModal 
                    visible={showPremiumModal} 
                    onClose={() => setShowPremiumModal(false)} 
                    onSubscribe={() => {
                        setShowPremiumModal(false);
                        navigation.navigate('Premium');
                    }}
                />
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
    premiumBanner: {
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    bannerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    bannerText: {
        flex: 1,
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        marginLeft: 10,
    },
});
