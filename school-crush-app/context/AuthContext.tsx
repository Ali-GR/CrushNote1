import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert, Platform } from 'react-native';
import Purchases, { PurchasesOffering, LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../lib/notifications';

const RC_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_your_key_here';
const RC_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'appl_your_key_here';
const ENTITLEMENT_ID = 'premium'; // Dein Entitlement-Name in RevenueCat

type AuthContextType = {
    session: Session | null;
    user: User | null;
    profile: any | null;
    loading: boolean;
    hasProfile: boolean;
    signOut: () => Promise<void>;
    checkProfile: (userId: string | undefined) => Promise<void>;
    updateSchool: (schoolId: string) => Promise<void>;
    resetSchool: () => Promise<void>;
    activatePremium: () => Promise<boolean>;
    restorePurchases: () => Promise<void>;
    deleteAccount: () => Promise<boolean>;
    slidesSeen: boolean | null;
    setSlidesSeen: (seen: boolean) => void;
    offerings: PurchasesOffering | null;
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    hasProfile: false,
    signOut: async () => { },
    checkProfile: async () => { },
    updateSchool: async () => { },
    resetSchool: async () => { },
    activatePremium: async () => false,
    restorePurchases: async () => { },
    deleteAccount: async () => false,
    slidesSeen: null,
    setSlidesSeen: () => { },
    offerings: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);
    const [slidesSeen, setSlidesSeenState] = useState<boolean | null>(null);
    const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);

    // Load onboarding status
    useEffect(() => {
        const loadOnboardingStatus = async () => {
            try {
                const val = await AsyncStorage.getItem('onboarding_slides_seen');
                console.log("AuthContext: Onboarding slides seen from storage:", val);
                setSlidesSeenState(val === 'true');
            } catch (e) {
                setSlidesSeenState(false);
            }
        };
        loadOnboardingStatus();
    }, []);

    const setSlidesSeen = async (seen: boolean) => {
        try {
            await AsyncStorage.setItem('onboarding_slides_seen', seen ? 'true' : 'false');
            console.log("AuthContext: Onboarding slides set to:", seen);
            setSlidesSeenState(seen);
        } catch (e) {
            console.error("AuthContext: Error setting slidesSeen", e);
        }
    };

    // 1. Initialize RevenueCat
    useEffect(() => {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        if (Platform.OS === 'android') {
            Purchases.configure({ apiKey: RC_API_KEY_ANDROID });
        } else if (Platform.OS === 'ios') {
            Purchases.configure({ apiKey: RC_API_KEY_IOS });
        }

        // Listen for customer info changes
        const customerInfoListener = async (info: any) => {
            if (user?.id) {
                const isPremium = !!info.entitlements.active[ENTITLEMENT_ID];
                syncPremiumStatus(user.id, isPremium);
            }
        };

        Purchases.addCustomerInfoUpdateListener(customerInfoListener);
        
        return () => {
            // No direct remove listener in RC SDK usually, but check current version patterns
        };
    }, [user?.id]);

    useEffect(() => {
        // 1. Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                Purchases.logIn(session.user.id);
                fetchOfferings();
            }
            checkProfile(session?.user?.id);
            setLoading(false);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                Purchases.logIn(session.user.id);
                fetchOfferings();
            } else {
                Purchases.logOut();
            }
            checkProfile(session?.user?.id);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchOfferings = async () => {
        try {
            const currentOfferings = await Purchases.getOfferings();
            if (currentOfferings.current !== null) {
                setOfferings(currentOfferings.current);
            } else {
                // If there are no current offerings, we need to set it to an empty object or something 
                // to prevent infinite loading. RevenueCat might not be configured yet.
                console.log("RC: No current offerings found in RevenueCat.");
                setOfferings({} as any);
            }
        } catch (e) {
            console.error("RC: Error fetching offerings", e);
            setOfferings({} as any);
        }
    };

    const syncPremiumStatus = async (userId: string, isPremium: boolean) => {
        // Only update if database doesn't match
        const { data } = await supabase.from('profiles').select('is_premium').eq('id', userId).single();
        
        // Wenn RC sagt, dass kein Premium existiert, aber die DB "true" sagt,
        // downgraden wir nicht automatisch. Das erlaubt Promo-Codes.
        // (Bei echtem Release evtl. Ablaufdatum der Subscription prüfen)
        if (isPremium === false && data?.is_premium === true) {
            console.log("RC: User has premium in DB but not in RC (Promo Code). Not downgrading.");
            return;
        }

        if (data && data.is_premium !== isPremium) {
            console.log("RC: Syncing premium status to DB:", isPremium);
            await supabase.from('profiles').update({ is_premium: isPremium }).eq('id', userId);
            checkProfile(userId);
        }
    };

    async function checkProfile(userId: string | undefined) {
        if (!userId) {
            setHasProfile(false);
            setProfile(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, schools(id, name)')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                setProfile(data);
                setHasProfile(!!data.school_id);
                // Extra check: If user just logged in or profile re-fetched, check RC info too
                if (data.is_premium === false) {
                     const info = await Purchases.getCustomerInfo();
                     const isPremiumRC = !!info.entitlements.active[ENTITLEMENT_ID];
                     if (isPremiumRC) {
                         syncPremiumStatus(userId, true);
                     }
                }

                // Push-Token abrufen und speichern (nur wenn Schule ausgewählt)
                if (data.school_id) {
                    const token = await registerForPushNotificationsAsync();
                    if (token && data.push_token !== token) {
                        await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
                        console.log("Push-Token in DB gespeichert:", token);
                    }
                }
            } else {
                if (error) console.error("Profile fetch error:", error);
                setHasProfile(false);
                setProfile(null);
            }
        } catch (e) {
            console.error("Profile check exception:", e);
        }
    }


    async function updateSchool(schoolId: string) {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .update({ school_id: schoolId })
            .eq('id', user.id);

        if (!error) {
            checkProfile(user.id);
        } else {
            Alert.alert("Error", "Could not switch school.");
        }
    }

    async function resetSchool() {
        if (!user) return;
        const { error } = await supabase
            .from('profiles')
            .update({ school_id: null })
            .eq('id', user.id);

        if (!error) {
            await checkProfile(user.id);
        } else {
            Alert.alert("Fehler", "Schule konnte nicht zurückgesetzt werden.");
        }
    }

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            // Only log out from RevenueCat if we have a real user ID
            const info = await Purchases.getCustomerInfo();
            if (info && !info.originalAppUserId.startsWith('$RCAnonymousID')) {
                await Purchases.logOut();
            }
        } catch (e) {
            console.log("SignOut: RevenueCat logout skipped or failed", e);
        }
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const activatePremium = async (): Promise<boolean> => {
        // Mock function for emergency/dev bypass
        if (!user) return false;
        const { error } = await supabase.from('profiles').update({ is_premium: true }).eq('id', user.id);
        if (!error) {
            await checkProfile(user.id);
            return true;
        }
        return false;
    };

    const purchasePremium = async (pkg: any): Promise<boolean> => {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg);
            const isPurchased = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
            if (user?.id) {
                await syncPremiumStatus(user.id, isPurchased);
            }
            return isPurchased;
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert("Fehler", "Zahlung fehlgeschlagen: " + e.message);
            }
            return false;
        }
    };

    const restorePurchases = async () => {
        try {
            const info = await Purchases.restorePurchases();
            const isPremium = !!info.entitlements.active[ENTITLEMENT_ID];
            if (user?.id) {
                await syncPremiumStatus(user.id, isPremium);
                Alert.alert("Erfolg", isPremium ? "Premium wiederhergestellt!" : "Keine Käufe gefunden.");
            }
        } catch (e: any) {
            Alert.alert("Fehler", "Wiederherstellung fehlgeschlagen.");
        }
    };

    const deleteAccount = async (): Promise<boolean> => {
        if (!user) return false;

        try {
            // 1. Manual Cleanup of user data to satisfy foreign key constraints
            // Order matters: delete child records first
            
            // Delete Likes
            await supabase.from('likes').delete().eq('user_id', user.id);
            
            // Delete Comments
            await supabase.from('comments').delete().eq('user_id', user.id);
            
            // Delete Posts
            await supabase.from('posts').delete().eq('user_id', user.id);

            // 2. Delete user profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 3. Reset onboarding slides status for a fresh start
            await AsyncStorage.removeItem('onboarding_slides_seen');
            setSlidesSeenState(false);

            // 4. Sign out (This clears local session)
            await signOut();
            
            Alert.alert("Account gelöscht", "Dein Account und deine Daten wurden erfolgreich entfernt.");
            return true;
        } catch (e: any) {
            console.error("Delete account error:", e);
            Alert.alert("Fehler", "Account konnte nicht gelöscht werden. Bitte kontaktiere den Support.");
            return false;
        }
    };

    const value = useMemo(() => ({
        session,
        user,
        profile,
        loading,
        hasProfile,
        signOut,
        checkProfile,
        updateSchool,
        resetSchool,
        activatePremium,
        purchasePremium,
        restorePurchases,
        deleteAccount,
        slidesSeen,
        setSlidesSeen,
        offerings,
    }), [session, user, profile, loading, hasProfile, slidesSeen, offerings]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
