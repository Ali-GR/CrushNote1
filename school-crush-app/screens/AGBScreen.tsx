import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

export default function AGBScreen({ navigation }: any) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AGB</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Allgemeine Geschäftsbedingungen</Text>
                <Text style={styles.date}>Stand: 29. März 2026</Text>

                <Section title="1. Geltungsbereich und Anbieter">
                    <Text style={styles.paragraph}>
                        Betreiber der App "Crush Note" und dein Vertragspartner ist Rafael Kamberi, Amannhof 4, 72108 Rottenburg a.N. Diese AGB gelten für alle Nutzer der App weltweit.
                    </Text>
                </Section>

                <Section title="2. Leistungsbeschreibung">
                    <Text style={styles.paragraph}>
                        Crush Note ist eine soziale Plattform für anonyme Beiträge und Kommentare innerhalb einer Schulgemeinschaft. Wir bieten kostenlose Basis-Funktionen sowie kostenpflichtige Premium-Optionen (Crush Plus) an.
                    </Text>
                </Section>

                <Section title="3. Registrierung und Mindestalter">
                    <Text style={styles.paragraph}>
                        Zur Nutzung der App ist eine Registrierung erforderlich. Das Mindestalter beträgt 12 Jahre. Mit der Anmeldung bestätigst du, dass du mindestens 12 Jahre alt bist.
                    </Text>
                </Section>

                <Section title="4. Verhaltensregeln">
                    <Text style={styles.paragraph}>
                        In Crush Note ist Respekt oberste Pflicht. Verboten sind Mobbing, Belästigung, Hassrede, pornografische Inhalte sowie die Verletzung von Rechten Dritter. Verstöße führen zur Löschung von Inhalten und/oder der Sperrung des Accounts.
                    </Text>
                </Section>

                <Section title="5. Premium-Abonnements">
                    <Text style={styles.paragraph}>
                        Käufe werden über die In-App-Systeme von Apple (App Store) oder Google (Play Store) abgewickelt. Es gelten die dort hinterlegten Bedingungen für Abonnements und Kündigungen.
                    </Text>
                </Section>

                <Section title="6. Haftung">
                    <Text style={styles.paragraph}>
                        Nutzer sind für ihre Inhalte selbst verantwortlich. Der Betreiber übernimmt keine Gewähr für die Richtigkeit von Nutzerbeiträgen und haftet nur bei grober Fahrlässigkeit oder Vorsatz.
                    </Text>
                </Section>

                <Section title="7. Schlussbestimmungen">
                    <Text style={styles.paragraph}>
                        Es gilt deutsches Recht. Sollten Bestimmungen unwirksam sein, bleibt der Rest der AGB davon unberührt.
                    </Text>
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const Section = ({ title, children }: any) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0C0C1C',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1A1A2E',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    content: {
        padding: 20,
    },
    title: {
        color: '#FF10F0',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    date: {
        color: '#666',
        fontSize: 12,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    paragraph: {
        color: '#ccc',
        fontSize: 15,
        lineHeight: 22,
    },
});
