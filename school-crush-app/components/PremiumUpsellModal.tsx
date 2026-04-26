import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface PremiumUpsellModalProps {
  visible?: boolean;
  isVisible?: boolean;
  onClose: () => void;
  onSubscribe?: (plan: 'monthly' | 'yearly') => void;
}

// Kleine Herz-Komponente für die Animation
const BouncingHeart = ({ delay }: { delay: number }) => {
  const moveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Zufällige Positionen über die ganze Höhe speichern, damit sie beim Rerender nicht springen
  const randomLeft = useRef(Math.random() * width).current;
  const randomTop = useRef(Math.random() * height).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: -30,
          duration: 2500,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 1800,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [delay, moveAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.heartContainer,
        {
          left: randomLeft,
          top: randomTop,
          transform: [{ translateY: moveAnim }, { scale: scaleAnim }],
        },
      ]}
    >
      <Ionicons name="heart" size={22} color="rgba(255, 16, 240, 0.38)" />
    </Animated.View>
  );
};

const PremiumUpsellModal: React.FC<PremiumUpsellModalProps> = ({
  visible,
  isVisible,
  onClose,
  onSubscribe = () => {},
}) => {
  const modalVisible = visible ?? isVisible ?? false;

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
           activeOpacity={1} 
           style={styles.modalContent}
           onPress={(e) => e.stopPropagation()} 
        >
          <LinearGradient
            colors={['#FFE6F4', '#FFF3FA', '#FFFFFF']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Hüpfende Herzen im Hintergrund - Mehr Herzen für mehr Leben */}
          {[...Array(20)].map((_, i) => (
            <BouncingHeart key={i} delay={i * 220} />
          ))}

          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="close" size={32} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.crownCircle}>
              <MaterialCommunityIcons name="crown" size={50} color="#FFD700" />
            </View>
            <Text style={styles.title}>Crush Plus 💖</Text>
            <Text style={styles.subtitle}>Werde Teil der Elite!</Text>
          </View>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={[styles.iconBg, { backgroundColor: '#FF10F0' }]}>
                <Ionicons name="star" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.featureTitle}>Premium Badge</Text>
                <Text style={styles.featureDesc}>Werde sichtbar als Crush Plus Member 👑</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.iconBg, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="megaphone-outline" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.featureTitle}>Keine Werbung</Text>
                <Text style={styles.featureDesc}>Genieße die App ohne störende Ads ✨</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.iconBg, { backgroundColor: '#2196F3' }]}>
                <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.featureTitle}>Unbegrenzt Posts</Text>
                <Text style={styles.featureDesc}>Poste so viele Crushes wie du willst 🚀</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={[styles.iconBg, { backgroundColor: '#9C27B0' }]}>
                <Ionicons name="images-outline" size={20} color="#FFF" />
              </View>
              <View>
                <Text style={styles.featureTitle}>Meme Power</Text>
                <Text style={styles.featureDesc}>Kommentiere mit Memes 📸</Text>
              </View>
            </View>
          </View>

          <View style={styles.pricingSection}>
            <TouchableOpacity
              style={[styles.planCard, styles.yearlyPlan]}
              onPress={() => onSubscribe('yearly')}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>BESTER PREIS</Text>
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Jahresabo</Text>
                <Text style={styles.planPriceLarge}>1,66 € <Text style={styles.perMonth}>/ Monat</Text></Text>
                <Text style={styles.planPriceSmall}>19,99 € im Jahr</Text>
                <Text style={styles.planSaving}>Nur heute: bester Deal für dich</Text>
              </View>
              <Ionicons name="checkmark-circle" size={30} color="#FF10F0" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.planCard}
              onPress={() => onSubscribe('monthly')}
            >
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Monatsabo</Text>
                <Text style={styles.planPrice}>2,99 € / Monat</Text>
              </View>
              <Ionicons name="ellipse-outline" size={24} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.mainButton} 
            onPress={() => onSubscribe('yearly')}
          >
            <LinearGradient
              colors={['#FF10F0', '#FF85E1']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.mainButtonText}>Jetzt Crush Plus sichern</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.footerNote}>Jederzeit kündbar. Keine versteckten Kosten.</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    minHeight: height * 0.88,
    overflow: 'hidden',
  },
  heartContainer: {
    position: 'absolute',
    zIndex: 0, // Auf 0 gesetzt, damit sie hinter den UI-Elementen aber im Sichtfeld sind
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 5,
  },
  crownCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 10,
    shadowColor: '#FF10F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  featuresList: {
    marginBottom: 30,
    zIndex: 5,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  featureDesc: {
    fontSize: 14,
    color: '#777',
  },
  pricingSection: {
    marginBottom: 20,
    zIndex: 5,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#F9F9F9',
    marginBottom: 12,
  },
  yearlyPlan: {
    borderColor: '#FF10F0',
    backgroundColor: '#FFF',
    borderWidth: 2,
    paddingVertical: 20,
    shadowColor: '#FF10F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: '#FF10F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  bestValueText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  planPriceLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#000',
  },
  perMonth: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  planPriceSmall: {
    fontSize: 12,
    color: '#FF10F0',
    fontWeight: '700',
    marginTop: 2,
  },
  planSaving: {
    fontSize: 11,
    color: '#A03BC2',
    fontWeight: '600',
    marginTop: 4,
  },
  mainButton: {
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 5,
    shadowColor: '#FF10F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  gradientButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
  },
  footerNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginTop: 15,
    zIndex: 5,
  },
});

export default PremiumUpsellModal;
