import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react-native';

export default function BannedScreen() {
    const { signOut } = useAuth();

    return (
        <View style={styles.container}>
            <View style={styles.modal}>
                <ShieldAlert color="#FF10F0" size={60} style={{ marginBottom: 20 }} />
                <Text style={styles.title}>⚠️ ACCOUNT GESPERRT</Text>
                <View style={styles.divider} />
                <Text style={styles.text}>
                    Dein Account wurde aufgrund von wiederholten Regelverstößen (Beleidigungen, Belästigungen, etc.) gesperrt.
                </Text>
                <Text style={styles.subtext}>
                    Unsere Community-Richtlinien sorgen für ein sicheres Umfeld für alle Schüler.
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => signOut()}>
                    <Text style={styles.buttonText}>AUSLOGGEN</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a1a',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#1A1A2E',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FF10F0',
        width: '100%',
        maxWidth: 350,
        alignItems: 'center',
        padding: 30,
        shadowColor: '#FF10F0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    divider: {
        height: 2,
        backgroundColor: '#FF10F0',
        width: 80,
        marginBottom: 20,
    },
    text: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 15,
        lineHeight: 24,
    },
    subtext: {
        color: '#888',
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 18,
    },
    button: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: '#FF10F0',
        paddingHorizontal: 40,
        paddingVertical: 12,
        borderRadius: 25,
    },
    buttonText: {
        color: '#FF10F0',
        fontWeight: 'bold',
        fontSize: 14,
    }
});
