import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Alert } from 'react-native';

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
};

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    hasProfile: false,
    checkProfile: async () => { },
    updateSchool: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasProfile, setHasProfile] = useState(false);

    useEffect(() => {
        // 1. Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkProfile(session?.user?.id);
            setLoading(false);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            checkProfile(session?.user?.id);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    async function checkProfile(userId: string | undefined) {
        if (!userId) {
            setHasProfile(false);
            setProfile(null);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (data) {
                setProfile(data);
                // Profile is only complete if school_id is set
                setHasProfile(!!data.school_id);
            } else {
                if (error) console.error("Profile fetch error:", error);
                else console.log("Profile missing (no data found).");

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
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
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
        resetSchool
    }), [session, user, profile, loading, hasProfile]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
