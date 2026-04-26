import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { X, Check } from 'lucide-react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';

const REPORT_REASONS = [
    { id: 'insult', label: 'Beleidigung' },
    { id: 'harassment', label: 'Belästigung' },
    { id: 'inappropriate', label: 'Unangemessener Inhalt' },
    { id: 'other', label: 'Sonstiges' },
];

export default function ReportScreen({ route, navigation }: any) {
    const { targetId, type } = route.params;
    const { user } = useAuth();
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleReport = async () => {
        if (!selectedReason) {
            Alert.alert('Hinweis', 'Bitte wähle einen Grund aus.');
            return;
        }
        setLoading(true);

        const reasonLabel = REPORT_REASONS.find(r => r.id === selectedReason)?.label;

        // Insert report and GET the ID back
        const { data: reportData, error } = await supabase.from('reports').insert({
            target_id: targetId,
            target_type: type,
            reporter_id: user?.id,
            reason: reasonLabel,
        }).select().single();

        if (error) {
            Alert.alert('Fehler', error.message);
            setLoading(false);
            return;
        }

        const reportId = reportData.id;
        setToastMessage("KI bewertet den Inhalt... 🤖");

        try {
            // Call AI Moderation Edge Function
            const { data: aiResult, error: aiError } = await supabase.functions.invoke('ai-moderation', {
                body: { report_id: reportId }
            });

            if (aiError) throw aiError;

            if (aiResult?.status === 'violation') {
                setToastMessage("Verstoß erkannt! Beitrag gelöscht. 🛡️");
            } else {
                setToastMessage("Danke! KI hat keinen Verstoß gefunden. 📋");
            }
        } catch (e) {
            console.error(e);
            setToastMessage("Meldung erfolgreich eingegangnen!");
        }

        setTimeout(() => {
            setLoading(false);
            if (navigation.canGoBack()) {
                navigation.goBack();
            }
        }, 3000);
    };

    return (
        <SafeAreaView style={styles.container}>
            {toastMessage && (
                <Animated.View entering={FadeInUp} exiting={FadeOutUp} style={styles.toast}>
                    <Check color="#fff" size={20} />
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Melden</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <X color="#fff" size={24} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Warum meldest du das?</Text>

                <View style={styles.optionsContainer}>
                    {REPORT_REASONS.map((reason) => (
                        <TouchableOpacity
                            key={reason.id}
                            style={[
                                styles.optionButton,
                                selectedReason === reason.id && styles.optionButtonSelected
                            ]}
                            onPress={() => setSelectedReason(reason.id)}
                            activeOpacity={0.8}
                        >
                            <View style={[
                                styles.radioCircle,
                                selectedReason === reason.id && styles.radioCircleSelected
                            ]} />
                            <Text style={styles.optionText} numberOfLines={2} adjustsFontSizeToFit={false}>{reason.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.cancelButtonText}>Abbrechen</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.reportButton, !selectedReason && styles.disabledButton]}
                        onPress={handleReport}
                        disabled={loading || !selectedReason}
                    >
                        <Text style={styles.reportButtonText}>{loading ? 'Sende...' : 'MELDEN'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1A1A2E',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    content: {
        padding: 24,
    },
    label: {
        color: '#fff',
        marginBottom: 20,
        fontSize: 18,
        fontWeight: 'bold',
    },
    optionsContainer: {
        marginBottom: 30,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        minHeight: 50,
    },
    optionButtonSelected: {
        backgroundColor: 'rgba(255, 16, 240, 0.1)',
        borderColor: '#FF10F0',
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#666',
        marginRight: 12,
    },
    radioCircleSelected: {
        borderColor: '#FF10F0',
        backgroundColor: '#FF10F0',
    },
    optionText: {
        color: '#fff',
        fontSize: 16,
        flex: 1,
        flexWrap: 'wrap',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    cancelButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#333',
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#ccc',
        fontWeight: '600',
    },
    reportButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FF4444',
        borderRadius: 12,
        alignItems: 'center',
        // Glow
        shadowColor: '#FF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#552222',
        shadowOpacity: 0,
    },
    reportButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    toast: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        backgroundColor: '#44FF44', // Green
        padding: 14,
        borderRadius: 12,
        zIndex: 100,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'center',
        shadowColor: '#44FF44',
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    toastText: {
        color: '#000',
        fontWeight: 'bold',
    }
});
