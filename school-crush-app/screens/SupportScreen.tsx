import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Send, MessageSquare, AlertCircle, School, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function SupportScreen({ route, navigation }: any) {
    const { initialType = 'other' } = route.params || {};
    const { user } = useAuth();
    const [type, setType] = useState<'bug' | 'school_request' | 'other'>(initialType);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (message.trim().length < 10) {
            Alert.alert("Nachricht zu kurz", "Bitte beschreibe dein Anliegen etwas ausführlicher.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('support_tickets').insert({
                user_id: user?.id,
                type: type,
                message: message.trim(),
                status: 'open'
            });

            if (error) throw error;
            setSuccess(true);
        } catch (error: any) {
            Alert.alert("Fehler", "Deine Nachricht konnte nicht gesendet werden. Bitte versuch es später erneut.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={['#2d0a1f', '#1a0a1f']} style={StyleSheet.absoluteFillObject} />
                <SafeAreaView style={styles.successContent}>
                    <View style={styles.successIconContainer}>
                        <CheckCircle2 color="#ff69b4" size={80} />
                    </View>
                    <Text style={styles.successTitle}>Nachricht gesendet!</Text>
                    <Text style={styles.successSubtitle}>
                        Danke für dein Feedback. Wir schauen uns das so schnell wie möglich an.
                    </Text>
                    <TouchableOpacity 
                        style={styles.backButtonFull}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Zurück</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#2d0a1f', '#1a0a1f']} style={StyleSheet.absoluteFillObject} />
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <ArrowLeft color="#fff" size={24} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Support & Feedback</Text>
                    <View style={{ width: 40 }} />
                </View>

                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        <Text style={styles.sectionTitle}>Wie können wir helfen?</Text>
                        
                        <View style={styles.typeContainer}>
                            <TypeButton 
                                active={type === 'bug'} 
                                icon={<AlertCircle size={20} color={type === 'bug' ? '#fff' : '#999'} />} 
                                label="Bug melden" 
                                onPress={() => setType('bug')} 
                            />
                            <TypeButton 
                                active={type === 'school_request'} 
                                icon={<School size={20} color={type === 'school_request' ? '#fff' : '#999'} />} 
                                label="Schule fehlt" 
                                onPress={() => setType('school_request')} 
                            />
                            <TypeButton 
                                active={type === 'other'} 
                                icon={<MessageSquare size={20} color={type === 'other' ? '#fff' : '#999'} />} 
                                label="Sonstiges" 
                                onPress={() => setType('other')} 
                            />
                        </View>

                        <View style={styles.glassWrapper}>
                            <BlurView intensity={30} tint="dark" style={styles.formContainer}>
                                <Text style={styles.label}>
                                    {type === 'school_request' ? 'Name und Stadt der Schule' : 'Deine Nachricht'}
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder={type === 'school_request' ? "Z.B. Goethe Gymnasium, Berlin" : "Beschreibe hier dein Problem oder Feedback..."}
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    multiline
                                    numberOfLines={6}
                                    value={message}
                                    onChangeText={setMessage}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity 
                                    style={[styles.submitButton, !message.trim() && styles.disabledBtn]} 
                                    onPress={handleSubmit}
                                    disabled={loading || !message.trim()}
                                >
                                    <LinearGradient
                                        colors={['#ff1493', '#ff69b4']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.submitGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <>
                                                <Text style={styles.submitText}>Absenden</Text>
                                                <Send color="#fff" size={18} style={{marginLeft: 8}} />
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </BlurView>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

function TypeButton({ active, icon, label, onPress }: any) {
    return (
        <TouchableOpacity 
            style={[styles.typeBtn, active && styles.typeBtnActive]} 
            onPress={onPress}
        >
            {icon}
            <Text style={[styles.typeBtnLabel, active && styles.typeBtnLabelActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#2d0a1f',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollContent: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 20,
    },
    typeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 30,
    },
    typeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    typeBtnActive: {
        backgroundColor: '#ff1493',
        borderColor: '#ff69b4',
    },
    typeBtnLabel: {
        color: '#999',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    typeBtnLabelActive: {
        color: '#fff',
    },
    glassWrapper: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    formContainer: {
        padding: 20,
    },
    label: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 16,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        minHeight: 150,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    submitButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.5,
    },
    successContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    successIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 105, 180, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    successTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    successSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    backButtonFull: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
