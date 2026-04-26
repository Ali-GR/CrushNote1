import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
    ArrowLeft, User, Bell, Globe, Download, FileText,
    Trash2, ChevronRight, MessageSquare, School,
    ShieldCheck, LogOut, Sparkles, HelpCircle, Heart
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function SettingsScreen({ navigation }: any) {
    const { user, profile: contextProfile, signOut, deleteAccount } = useAuth();
    const [stats, setStats] = useState({ posts: 0, likes: 0, strikes: 0 });
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchStats();
            }
        }, [user])
    );

    const fetchStats = async () => {
        const { count: postCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id);

        const { count: likeCount } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user?.id);

        setStats({
            posts: postCount || 0,
            likes: likeCount || 0,
            strikes: contextProfile?.strikes || 0
        });
    };

    const handleLogout = () => {
        Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
            { text: "Abbrechen", style: "cancel" },
            { text: "Abmelden", onPress: signOut }
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Account löschen",
            "Bist du sicher? Alle deine Posts, Likes und dein Profil werden unwiderruflich gelöscht.",
            [
                { text: "Abbrechen", style: "cancel" },
                {
                    text: "Unwiderruflich löschen",
                    style: "destructive",
                    onPress: async () => {
                        const success = await deleteAccount();
                        if (success) {
                            Alert.alert("Account gelöscht", "Dein Account wurde erfolgreich entfernt.");
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon: Icon, label, value, onPress, isDestructive, isNew }: any) => (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.settingIconContainer, isDestructive && styles.destructiveIconBg]}>
                <Icon size={20} color={isDestructive ? '#FF4444' : '#ff69b4'} />
            </View>
            <View style={styles.settingTextContainer}>
                <Text style={[styles.settingLabel, isDestructive && styles.destructiveText]}>{label}</Text>
                {value && <Text style={styles.settingValue}>{value}</Text>}
            </View>
            {isNew && (
                <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>Neu</Text>
                </View>
            )}
            <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#2d0a1f', '#1a0a1f']} style={StyleSheet.absoluteFillObject} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Einstellungen</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                        <LogOut color="#FF4444" size={20} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* User Profile Info Card */}
                    <View style={styles.profileCardWrapper}>
                        <BlurView intensity={40} tint="dark" style={styles.profileCard}>
                            <View style={styles.profileHeader}>
                                <View style={styles.avatarContainer}>
                                    <LinearGradient colors={['#ff69b4', '#ff1493']} style={StyleSheet.absoluteFillObject} />
                                    <User color="#fff" size={40} fill="#fff" />
                                    {contextProfile?.is_premium && (
                                        <View style={styles.premiumBadgeIcon}>
                                            <Sparkles color="#FFD700" size={12} fill="#FFD700" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.profileInfo}>
                                    <Text style={styles.nickname}>{contextProfile?.nickname || 'Anonym'}</Text>
                                    <View style={styles.schoolRow}>
                                        <School size={14} color="rgba(255,255,255,0.5)" />
                                        <Text style={styles.schoolName}>{contextProfile?.schools?.name || 'Keine Schule'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{stats.posts}</Text>
                                    <Text style={styles.statLabel}>Beiträge</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{stats.likes}</Text>
                                    <Text style={styles.statLabel}>Likes</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, stats.strikes > 0 && { color: '#FF4444' }]}>{stats.strikes}/3</Text>
                                    <Text style={styles.statLabel}>Verwarnungen</Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>

                    {/* Premium Card */}
                    {!contextProfile?.is_premium && (
                        <TouchableOpacity
                            style={styles.premiumPromoWrapper}
                            onPress={() => navigation.navigate('Premium')}
                        >
                            <LinearGradient
                                colors={['#FF10F0', '#7800FF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.premiumPromo}
                            >
                                <View>
                                    <Text style={styles.premiumPromoTitle}>Crush Plus freischalten</Text>
                                    <Text style={styles.premiumPromoSubtitle}>Keine Werbung & goldener Badge</Text>
                                </View>
                                <Sparkles color="#fff" size={24} fill="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.sectionHeader}>Konto & Sicherheit</Text>
                    <View style={styles.groupWrapper}>
                        <BlurView intensity={30} tint="dark" style={styles.groupContainer}>
                            <View style={styles.settingItem}>
                                <View style={styles.settingIconContainer}>
                                    <Bell size={20} color="#ff69b4" />
                                </View>
                                <View style={styles.settingTextContainer}>
                                    <Text style={styles.settingLabel}>Benachrichtigungen</Text>
                                    <Text style={styles.settingValue}>{notificationsEnabled ? "An" : "Aus"}</Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#ff1493' }}
                                    thumbColor="#fff"
                                    ios_backgroundColor="rgba(255,255,255,0.1)"
                                />
                            </View>
                            <SettingItem icon={Globe} label="Sprache" value="Deutsch" />
                        </BlurView>
                    </View>

                    <Text style={styles.sectionHeader}>Support & Feedback</Text>
                    <View style={styles.groupWrapper}>
                        <BlurView intensity={30} tint="dark" style={styles.groupContainer}>
                            <SettingItem
                                icon={HelpCircle}
                                label="Hilfe & Support"
                                isNew
                                onPress={() => navigation.navigate('Support')}
                            />
                            <SettingItem
                                icon={MessageSquare}
                                label="Schule vorschlagen"
                                onPress={() => navigation.navigate('Support', { initialType: 'school_request' })}
                            />
                        </BlurView>
                    </View>

                    <Text style={styles.sectionHeader}>Rechtliches</Text>
                    <View style={styles.groupWrapper}>
                        <BlurView intensity={30} tint="dark" style={styles.groupContainer}>
                            <SettingItem icon={FileText} label="Datenschutzerklärung" onPress={() => navigation.navigate('PrivacyPolicy')} />
                            <SettingItem icon={FileText} label="Impressum & AGB" onPress={() => navigation.navigate('AGB')} />
                            <SettingItem
                                icon={Trash2}
                                label="Account löschen"
                                isDestructive
                                onPress={handleDeleteAccount}
                            />
                        </BlurView>
                    </View>

                    <View style={styles.footer}>
                        <View style={styles.footerIconContainer}>
                            <Heart size={20} color="rgba(255,255,255,0.1)" fill="rgba(255,255,255,0.1)" />
                        </View>
                        <Text style={styles.footerText}>Crush Note 2026</Text>
                        <Text style={styles.versionText}>Version 1.0.0 (Gold)</Text>
                    </View>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a0a1f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(255,68,68,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    profileCardWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    profileCard: {
        padding: 24,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    premiumBadgeIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#1a0a1f',
        padding: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    profileInfo: {
        flex: 1,
    },
    nickname: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    schoolRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    schoolName: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 16,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    premiumPromoWrapper: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 24,
        elevation: 10,
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
    },
    premiumPromo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    premiumPromoTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 2,
    },
    premiumPromoSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 4,
    },
    groupWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    groupContainer: {
        paddingVertical: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    settingIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255,105,180,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    destructiveIconBg: {
        backgroundColor: 'rgba(255,68,68,0.1)',
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 2,
    },
    settingValue: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    destructiveText: {
        color: '#FF4444',
    },
    newBadge: {
        backgroundColor: '#ff1493',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 12,
    },
    newBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    footer: {
        alignItems: 'center',
        marginTop: 20,
    },
    footerIconContainer: {
        marginBottom: 12,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'rgba(255,255,255,0.1)',
        letterSpacing: 1,
        marginBottom: 4,
    },
    versionText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.05)',
        fontWeight: '600',
    }
});
