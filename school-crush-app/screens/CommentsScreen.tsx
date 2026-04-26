import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Text, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Send, ArrowLeft, Flag, User, Trash2, X } from 'lucide-react-native';
import { PostCard } from '../components/PostCard';
import { checkWordFilter } from '../lib/wordFilter';
import { Alert } from 'react-native';

export default function CommentsScreen({ route, navigation }: any) {
    const { postId } = route.params;
    const { user, profile } = useAuth();
    const [post, setPost] = useState<any>(null);
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [gifUrl, setGifUrl] = useState<string | null>(null);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [giphySearch, setGiphySearch] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPost();
        fetchComments();
    }, []);

    const fetchPost = async () => {
        // Fetch original post details
        const { data } = await supabase
            .from('posts')
            .select('*, profiles(nickname), schools(name)')
            .eq('id', postId)
            .single();
        if (data) setPost(data);
    };

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, profiles(nickname)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (data) setComments(data);
    };

    const handleSend = async () => {
        // Erlauben, wenn Text ODER GIF vorhanden ist
        if (!newComment.trim() && !gifUrl) return;

        // Wortfilter nur prüfen, wenn Text vorhanden ist
        if (newComment.trim() && checkWordFilter(newComment.trim())) {
            Alert.alert("Moderation", "Dein Kommentar enthält unangemessene Wörter und wurde blockiert.");
            return;
        }

        setLoading(true);
        console.log("Versuche Kommentar zu senden. GIF:", gifUrl, "Text:", newComment);

        const { error } = await supabase.from('comments').insert({
            post_id: postId,
            user_id: user?.id,
            content: newComment.trim() || null,
            gif_url: gifUrl,
        });

        if (!error) {
            setNewComment('');
            setGifUrl(null);
            fetchComments();
        } else {
            console.error("Supabase Kommentar-Fehler:", error.message);
            Alert.alert("Fehler", "Kommentar konnte nicht gesendet werden: " + error.message);
        }
        setLoading(false);
    };

    const searchGiphy = async (q: string) => {
        setGiphySearch(q);
        if (q.length < 2) return;
        const apiKey = process.env.EXPO_PUBLIC_GIPHY_KEY;
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(q)}&limit=9&rating=g`);
            const json = await res.json();
            setGiphyResults(json.data || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeletePost = () => {
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
                            navigation.goBack();
                        } else {
                            Alert.alert("Fehler", "Beitrag konnte nicht gelöscht werden.");
                        }
                    }
                }
            ]
        );
    };

    const timeAgo = (dateIdx: string) => {
        const date = new Date(dateIdx);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'Gerade eben';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)} Tg.`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
                    <ArrowLeft color="#999" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kommentare</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    data={comments}
                    keyExtractor={(item) => item.id}
                    ListHeaderComponent={
                        <View style={styles.postContainer}>
                            {post && (
                                <View style={styles.originalPost}>
                                    <View style={styles.postHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.postNickname}>{post.profiles?.nickname}</Text>
                                            <Text style={styles.postTime}>{timeAgo(post.created_at)}</Text>
                                        </View>
                                        {user?.id === post.user_id && (
                                            <TouchableOpacity onPress={handleDeletePost} style={{ padding: 8 }}>
                                                <Trash2 color="#FF4444" size={20} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={styles.postContent}>{post.content}</Text>
                                </View>
                            )}
                            <View style={styles.divider} />
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={[
                            styles.commentItem,
                            item.profiles?.is_premium && styles.premiumComment
                        ]}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.nickname}>
                                    {item.profiles?.nickname || 'Anonymous'}
                                    {item.profiles?.is_premium && " 👑"}
                                     • <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
                                </Text>
                            </View>
                            {item.content ? <Text style={styles.content}>{item.content}</Text> : null}
                            {item.gif_url && (
                                <Image 
                                    source={{ uri: item.gif_url }} 
                                    style={styles.commentGif} 
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                    )}
                    contentContainerStyle={styles.list}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Schreib was Nettes..."
                        placeholderTextColor="#999"
                        value={newComment}
                        onChangeText={setNewComment}
                        maxLength={300}
                        multiline
                    />
                    {profile?.is_premium && (
                        <TouchableOpacity onPress={() => setShowGifPicker(!showGifPicker)} style={styles.gifToggle}>
                            <Text style={{ fontSize: 20 }}>😂</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={loading || (!newComment.trim() && !gifUrl)}
                        style={styles.sendButton}
                    >
                        <Send color={newComment.trim() || gifUrl ? '#FF10F0' : '#666'} size={20} />
                    </TouchableOpacity>
                </View>

                {showGifPicker && (
                    <View style={styles.gifPicker}>
                        <TextInput
                            style={styles.gifSearch}
                            placeholder="GIFs suchen..."
                            placeholderTextColor="#666"
                            value={giphySearch}
                            onChangeText={searchGiphy}
                        />
                        <FlatList
                            data={giphyResults}
                            horizontal
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => {
                                    setGifUrl(item.images.fixed_height.url);
                                    setShowGifPicker(false);
                                }}>
                                    <Image source={{ uri: item.images.fixed_height_small.url }} style={styles.gifThumb} />
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}
                
                {gifUrl && (
                    <View style={styles.selectedGifPreview}>
                        <Image source={{ uri: gifUrl }} style={styles.previewGif} />
                        <TouchableOpacity onPress={() => setGifUrl(null)} style={styles.removeGif}>
                            <X size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )}
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#cc2952', // wie FeedScreen
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 10,
        backgroundColor: '#1A1A2E', // wie Header-Bar im Feed
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 16, 240, 0.2)',
    },
    headerTitle: {
        color: '#FF10F0',
        fontSize: 18,
        fontWeight: 'bold',
        textShadowColor: 'rgba(255, 16, 240, 0.3)',
        textShadowRadius: 5,
    },
    list: {
        padding: 16,
        paddingBottom: 20,
    },
    postContainer: {
        marginBottom: 20,
    },
    originalPost: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#FF10F0',
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    postNickname: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    postTime: {
        color: '#888',
        fontSize: 12,
    },
    postContent: {
        color: '#ddd',
        fontSize: 14,
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginTop: 16,
    },
    commentItem: {
        marginBottom: 16,
        backgroundColor: '#1A1A2E',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    premiumComment: {
        borderColor: '#FF10F0',
        borderWidth: 1.5,
        shadowColor: '#FF10F0',
        elevation: 5,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    nickname: {
        color: '#999', // wie Platzhalter "Schreib was Nettes..."
        fontSize: 13,
        fontWeight: 'bold',
    },
    time: {
        color: '#666',
        fontSize: 12,
        fontWeight: 'normal',
    },
    content: {
        color: '#fff',
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12, // Handle safe area manually if needed or rely on avoids
        backgroundColor: '#151525',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        color: '#fff',
        marginRight: 10,
        maxHeight: 100,
        fontSize: 15,
    },
    sendButton: {
        padding: 8,
    },
    gifToggle: {
        marginRight: 10,
    },
    gifPicker: {
        height: 180,
        backgroundColor: '#1A1A2E',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    gifSearch: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10,
        paddingHorizontal: 15,
        paddingVertical: 8,
        color: '#fff',
        marginBottom: 10,
    },
    gifThumb: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 8,
    },
    selectedGifPreview: {
        padding: 10,
        backgroundColor: '#151525',
        alignItems: 'center',
    },
    previewGif: {
        width: 100,
        height: 100,
        borderRadius: 8,
    },
    removeGif: {
        position: 'absolute',
        top: 5,
        right: '40%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 10,
        padding: 2,
    },
    commentGif: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 8,
    },
});
