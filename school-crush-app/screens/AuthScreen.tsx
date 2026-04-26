import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Heart, Mail, Lock, UserPlus, LogIn } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function AuthScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [ageConfirmed, setAgeConfirmed] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
        });

        if (error) Alert.alert('Login fehlgeschlagen', 'E-Mail oder Passwort ist falsch.');
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!ageConfirmed) {
            Alert.alert('Altersbeschränkung', 'Du musst mindestens 12 Jahre alt sein, um beizutreten.');
            return;
        }

        setLoading(true);

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
        });

        if (signUpError) {
            Alert.alert('Registrierung fehlgeschlagen', signUpError.message);
            setLoading(false);
            return;
        }

        if (authData.user) {
            Alert.alert(
                'Fast geschafft! 📧',
                'Wir haben dir eine Bestätigungs-E-Mail gesendet. Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren. Danach kannst du dich einloggen!',
                [
                    {
                        text: 'Verstanden',
                        onPress: () => {
                            setLoading(false);
                            setIsLogin(true); // Switch to login tab
                        }
                    }
                ]
            );
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#2d0a1f' }]} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header mit Herz-Icon */}
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <Heart color="#ff69b4" size={40} fill="#ff69b4" />
                        </View>
                        <Text style={styles.headerTitle}>Crush Note</Text>
                        <Text style={styles.subheader}>
                            {isLogin ? 'Willkommen zurück' : 'Deiner Schule beitreten'}
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                        <Input
                            label="E-Mail"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholder="deine@email.de"
                        />
                        <Input
                            label="Passwort"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            placeholder="••••••••"
                        />

                        {!isLogin && (
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setAgeConfirmed(!ageConfirmed)}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.checkbox,
                                    ageConfirmed && styles.checkboxChecked
                                ]}>
                                    {ageConfirmed && <Check color="#fff" size={16} />}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                    Ich bestätige, dass ich mindestens 12 Jahre alt bin
                                </Text>
                            </TouchableOpacity>
                        )}

                        <Button
                            title={isLogin ? 'Einloggen' : 'Registrieren'}
                            loading={loading}
                            onPress={isLogin ? signInWithEmail : signUpWithEmail}
                            style={styles.mainButton}
                        />

                        <Button
                            title={isLogin ? 'Noch kein Account? Hier registrieren' : 'Bereits einen Account? Hier einloggen'}
                            variant="secondary"
                            onPress={() => setIsLogin(!isLogin)}
                            style={styles.switchButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    headerTitle: {
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
    inputSection: {
        marginBottom: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 8,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#ff69b4',
        borderColor: '#ff69b4',
    },
    checkboxLabel: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
        flex: 1,
    },
    mainButtonContainer: {
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
    switchButton: {
        marginTop: 20,
        padding: 10,
        alignItems: 'center',
    },
    switchButtonText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 14,
        fontWeight: '600',
    },
    footerText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 30,
    },
});