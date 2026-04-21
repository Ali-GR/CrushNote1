import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Heart } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

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

        if (error) Alert.alert('Login fehlgeschlagen', error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        if (!ageConfirmed) {
            Alert.alert('Altersbeschränkung', 'Du musst mindestens 12 Jahre alt sein, um beizutreten.');
            return;
        }

        setLoading(true);

        // Zuerst den Benutzer registrieren
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
            // Navigation handles the logic: session exists but profile doesn't -> Onboarding starts automatically
            setLoading(false);
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
                        <Text style={styles.header}>Crush Note</Text>
                        <Text style={styles.subheader}>
                            {isLogin ? 'Willkommen zurück' : 'Wähle deine Schule'}
                        </Text>
                    </View>

                    {/* Form Container */}
                    <View style={styles.formContainer}>
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            placeholder="your@email.com"
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
                                    Ich bestätige, dass ich mindestens 14 Jahre alt bin
                                </Text>
                            </TouchableOpacity>
                        )}

                        <Button
                            title={isLogin ? 'Anmelden' : 'Registrieren'}
                            loading={loading}
                            onPress={isLogin ? signInWithEmail : signUpWithEmail}
                            style={styles.mainButton}
                        />

                        <Button
                            title={isLogin ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Anmelden'}
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
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 105, 180, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    header: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffb6c1',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subheader: {
        fontSize: 18,
        color: '#d88cae',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'rgba(74, 26, 47, 0.9)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#b34180',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#b3668c',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#ff69b4',
        borderColor: '#ff69b4',
    },
    checkboxLabel: {
        color: '#e6b3cc',
        fontSize: 14,
        flex: 1,
    },
    mainButton: {
        marginBottom: 16,
        backgroundColor: '#ff1493',
        borderRadius: 12,
    },
    switchButton: {
        backgroundColor: 'rgba(179, 65, 128, 0.3)',
        borderWidth: 1,
        borderColor: '#ff69b4',
        borderRadius: 12,
    },
});