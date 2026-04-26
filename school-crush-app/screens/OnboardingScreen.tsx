import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Heart, Search, School, ArrowRight, LogOut } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function OnboardingScreen({ navigation }: any) {
    const { user, profile, checkProfile } = useAuth();
    const [schoolSearch, setSchoolSearch] = useState('');
    const [schools, setSchools] = useState<any[]>([]);
    const [selectedSchool, setSelectedSchool] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // 🔍 Schulen erst suchen, wenn getippt wird
    useEffect(() => {
        const searchSchools = async () => {
            if (schoolSearch.trim() === '') {
                setSchools([]);
                return;
            }

            setSearching(true);
            console.log("🔍 Search triggered for:", schoolSearch);

            // Try simplest possible query
            const { data, error } = await supabase
                .from('schools')
                .select('id, name')
                .ilike('name', `%${schoolSearch}%`)
                .limit(200);

            if (error) {
                console.error("DEBUG - RAW SEARCH ERROR:", JSON.stringify(error, null, 2));
                // Fallback: Just try to get anything from schools
                const { data: fallbackData } = await supabase.from('schools').select('id, name').limit(10);
                if (fallbackData) {
                    console.log("Fallback search worked, found:", fallbackData.length);
                    setSchools(fallbackData);
                }
            } else if (data) {
                console.log("Found schools:", data.length);
                setSchools(data);
            }
            setSearching(false);
        };

        const timer = setTimeout(() => {
            searchSchools();
        }, 300); // Slightly faster search

        return () => clearTimeout(timer);
    }, [schoolSearch]);

    async function completeProfile() {
        if (!selectedSchool) {
            Alert.alert('Schule fehlt', 'Bitte wähle deine Schule aus.');
            return;
        }
        setLoading(true);
        await updateProfileSchool(selectedSchool.id);
    }

    async function updateProfileSchool(schoolId: string) {
        if (!user) return;

        // Upsert nutzen: Falls das Profil (aus welchem Grund auch immer) noch nicht existiert,
        // wird es hier erstellt. Falls es existiert, wird nur die school_id aktualisiert.
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                school_id: schoolId,
                nickname: profile?.nickname || 'Anonym'
            });

        if (error) {
            console.error('Onboarding Error:', error);
            Alert.alert('Fehler', 'Profil konnte nicht aktualisiert werden.');
            setLoading(false);
        } else {
            Alert.alert('Willkommen!', 'Du bist jetzt bereit.');
            await checkProfile(user.id);
        }
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#2d0a1f', '#1a0a1f']}
                style={StyleSheet.absoluteFillObject}
            />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={['#ff69b4', '#ff1493']}
                                    style={StyleSheet.absoluteFillObject}
                                />
                                <Heart color="#fff" size={40} fill="#fff" />
                            </View>
                            <Text style={styles.header}>Fast geschafft!</Text>
                            <Text style={styles.subheader}>Tritt deiner Schule bei, um Crushes in deiner Nähe zu sehen.</Text>
                        </View>

                        {/* Form Container */}
                        <View style={styles.glassWrapper}>
                            <BlurView intensity={30} tint="dark" style={styles.formContainer}>
                                <View style={styles.inputWrapper}>
                                    <Input
                                        label="Deine Schule suchen"
                                        value={schoolSearch}
                                        onChangeText={(text) => {
                                            setSchoolSearch(text);
                                            if (selectedSchool) setSelectedSchool(null);
                                        }}
                                        placeholder="Schulnamen oder Stadt..."
                                    />
                                    <View style={styles.searchIconInside}>
                                        <Search color="rgba(255,255,255,0.4)" size={18} />
                                    </View>
                                </View>

                                {searching && (
                                    <ActivityIndicator color="#ff69b4" style={{ marginVertical: 15 }} />
                                )}

                                {/* List of schools */}
                                {schools.length > 0 && !selectedSchool && (
                                    <View style={styles.schoolListContainer}>
                                        <ScrollView
                                            style={styles.schoolList}
                                            keyboardShouldPersistTaps="handled"
                                            nestedScrollEnabled={true}
                                        >
                                            {schools.map(school => (
                                                <TouchableOpacity
                                                    key={school.id}
                                                    style={styles.schoolItem}
                                                    onPress={() => {
                                                        setSelectedSchool(school);
                                                        setSchoolSearch(school.name);
                                                    }}
                                                >
                                                    <View style={styles.schoolIconCircle}>
                                                        <School color="#ffb6c1" size={16} />
                                                    </View>
                                                    <Text style={styles.schoolName} numberOfLines={1}>{school.name}</Text>
                                                    <ArrowRight color="#ff69b4" size={16} />
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}

                                {schoolSearch && schools.length === 0 && !searching && !selectedSchool && (
                                    <View style={styles.noResultsContainer}>
                                        <Text style={styles.noResults}>Keine Schule gefunden.</Text>
                                        <TouchableOpacity 
                                            style={styles.requestSchoolBtn}
                                            onPress={() => navigation.navigate('Support', { initialType: 'school_request' })}
                                        >
                                            <Text style={styles.requestSchoolText}>Schule vorschlagen ✨</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity
                                    onPress={completeProfile}
                                    disabled={!selectedSchool || loading}
                                    style={styles.mainButtonContainer}
                                >
                                    <LinearGradient
                                        colors={!selectedSchool ? ['#444', '#333'] : ['#ff1493', '#ff69b4']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.mainButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.mainButtonText}>
                                                {selectedSchool ? `${selectedSchool.name} beitreten` : "Schule auswählen"}
                                            </Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.logoutButton}
                                    onPress={() => supabase.auth.signOut()}
                                >
                                    <LogOut color="rgba(255,255,255,0.4)" size={16} style={{marginRight: 6}} />
                                    <Text style={styles.logoutText}>Abmelden</Text>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                        
                        <TouchableOpacity onPress={() => navigation.navigate('Support', { initialType: 'school_request' })}>
                            <Text style={styles.helpText}>
                                Deine Schule fehlt? Hier vorschlagen.
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2d0a1f',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginVertical: 40,
    },
    iconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#ff69b4',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    header: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subheader: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 22,
    },
    glassWrapper: {
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.4,
        shadowRadius: 30,
        elevation: 20,
    },
    formContainer: {
        padding: 24,
    },
    inputWrapper: {
        position: 'relative',
    },
    searchIconInside: {
        position: 'absolute',
        right: 16,
        top: 42,
    },
    schoolListContainer: {
        maxHeight: 250,
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    schoolList: {
        flexGrow: 0,
    },
    schoolItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    },
    schoolIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 105, 180, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    schoolName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },
    noResultsContainer: {
        padding: 20,
        alignItems: 'center',
    },
    noResults: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    requestSchoolBtn: {
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 105, 180, 0.3)',
    },
    requestSchoolText: {
        color: '#ff69b4',
        fontSize: 14,
        fontWeight: 'bold',
    },
    noResultsHint: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
    },
    mainButtonContainer: {
        marginTop: 10,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#ff1493',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    mainButton: {
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        padding: 10,
    },
    logoutText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    helpText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 30,
        lineHeight: 18,
    },
});
