import * as React from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FarmerProfile, IndianState, BankAccountDetails } from '../types';
import { MOCK_FARMER } from '../data/mockData';

export interface FarmerRegistrationData {
  fullName: string;
  email: string;
  mobileNumber: string;
  state: IndianState;
  district: string;
  password: string;
  bankAccount: BankAccountDetails;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: FarmerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; isEmailUnconfirmed?: boolean }>;
  signUp: (data: FarmerRegistrationData) => Promise<{ success: boolean; needsEmailVerification?: boolean; error?: string }>;
  verifyOtp: (email: string, token: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  bypassVerificationForTesting: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<FarmerProfile | null>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Local storage key for in-memory session caching
const LOCAL_PROFILE_KEY = 'smartprocure_farmer_profile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  // Helper to build a FarmerProfile from Supabase Auth User and optional DB row
  const buildProfile = (authUser: User, dbProfile?: any): FarmerProfile => {
    const meta = authUser.user_metadata || {};
    
    // Bank details stored securely in user metadata or DB row
    const bankDetails: BankAccountDetails = {
      accountNumber: meta.bank_account_number || '',
      ifscCode: meta.ifsc_code || '',
      bankName: meta.bank_name || '',
      accountHolderName: meta.account_holder_name || meta.full_name || 'Farmer',
    };

    return {
      id: authUser.id,
      fullName: dbProfile?.full_name || meta.full_name || authUser.email?.split('@')[0] || 'Farmer',
      email: authUser.email || '',
      mobileNumber: dbProfile?.mobile || meta.mobile || '',
      state: (dbProfile?.state || meta.state || 'Punjab') as IndianState,
      district: dbProfile?.district || meta.district || 'Ludhiana',
      bankAccount: bankDetails,
      isEmailVerified: Boolean(authUser.email_confirmed_at),
      profileImageUrl: dbProfile?.profile_image_url || meta.profile_image_url || null,
      preferredLanguage: dbProfile?.preferred_language || meta.preferred_language || 'en',
      notificationPreferences: dbProfile?.notification_preferences || meta.notification_preferences || {
        sms: true,
        whatsapp: true,
        delay_alerts: true,
        voice: false,
      },
      createdAt: dbProfile?.created_at || authUser.created_at || new Date().toISOString(),
      updatedAt: dbProfile?.updated_at || authUser.updated_at || new Date().toISOString(),
    };
  };

  // Fetch or upsert profile in Supabase profiles table
  const fetchProfileForUser = async (authUser: User): Promise<FarmerProfile> => {
    if (!isSupabaseConfigured()) {
      const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (cached) {
        try { return JSON.parse(cached); } catch { /* ignore */ }
      }
      return buildProfile(authUser);
    }

    try {
      // 1. Try to read existing profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data && !error) {
        const fullProf = buildProfile(authUser, data);
        setProfile(fullProf);
        return fullProf;
      }

      // 2. If no record in profiles table, attempt to insert one using auth.users metadata
      const meta = authUser.user_metadata || {};
      const newProfileRecord = {
        id: authUser.id,
        full_name: meta.full_name || authUser.email?.split('@')[0] || 'Farmer',
        email: authUser.email || '',
        mobile: meta.mobile || null,
        state: meta.state || 'Punjab',
        district: meta.district || 'Ludhiana',
        preferred_language: 'en',
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfileRecord, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insertError && inserted) {
        const fullProf = buildProfile(authUser, inserted);
        setProfile(fullProf);
        return fullProf;
      }
    } catch (err) {
      // If table does not exist or schema cache not refreshed yet, proceed with user metadata
      console.warn('Supabase profiles query notice:', err);
    }

    // Graceful fallback to user metadata
    const metaProfile = buildProfile(authUser);
    setProfile(metaProfile);
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(metaProfile));
    } catch { /* ignore */ }
    return metaProfile;
  };

  // Sync initial session on mount and subscribe to auth state changes
  React.useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await fetchProfileForUser(initialSession.user);
          } else {
            // Check if demo session is stored
            const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                setProfile(parsed);
                if (!isSupabaseConfigured()) {
                  setUser({
                    id: parsed.id || 'farmer-rameshwar-01',
                    app_metadata: {},
                    user_metadata: { full_name: parsed.fullName },
                    aud: 'authenticated',
                    created_at: new Date().toISOString(),
                    email: parsed.email,
                    email_confirmed_at: new Date().toISOString(),
                    role: 'authenticated',
                    updated_at: new Date().toISOString(),
                  } as User);
                }
              } catch { /* ignore */ }
            }
          }
        }
      } catch (err) {
        console.warn('Initial session lookup:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen to Supabase auth state change events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (currentSession?.user) {
          await fetchProfileForUser(currentSession.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setProfile(null);
        localStorage.removeItem(LOCAL_PROFILE_KEY);
        // Safely remove legacy un-scoped global booking cache to prevent leaking into next account
        localStorage.removeItem('smartprocure_farmer_bookings');
      }

      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Helper to check if a user is verified
  const isUserVerified = (authUser: User | null): boolean => {
    if (!authUser) return false;
    if (!isSupabaseConfigured()) return true; // demo / unconfigured fallback
    return Boolean(authUser.email_confirmed_at);
  };

  // Format Supabase Auth errors into friendly, localized user messages
  const formatAuthError = (error: AuthError | Error | any): string => {
    const msg = error?.message?.toLowerCase() || '';

    // 1. Existing email
    if (
      msg.includes('user already registered') ||
      msg.includes('already exists') ||
      msg.includes('already registered') ||
      msg.includes('email already in use')
    ) {
      return 'An account with this email address already exists. Please log in instead.';
    }

    // 2. Invalid email
    if (msg.includes('invalid email') || msg.includes('valid email') || msg.includes('email address is invalid')) {
      return 'Please enter a valid email address.';
    }

    // 3. Weak password
    if (
      msg.includes('password should be at least') ||
      msg.includes('weak password') ||
      msg.includes('password is too short')
    ) {
      return 'Password must be at least 6 characters long.';
    }

    // 4. Unverified login
    if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
      return 'Please verify your email before logging in.';
    }

    // 5. Expired OTP
    if (msg.includes('token has expired') || msg.includes('otp has expired') || msg.includes('code has expired')) {
      return 'The verification code has expired. Please click "Resend Code" to receive a fresh 6-digit code.';
    }

    // 6. Wrong OTP or OTP already used
    if (
      msg.includes('invalid token') ||
      msg.includes('token is invalid') ||
      msg.includes('invalid code') ||
      msg.includes('wrong code') ||
      msg.includes('token has expired or is invalid') ||
      msg.includes('already used')
    ) {
      return 'The verification code you entered is incorrect or expired. Please check the 6-digit code in your email and try again.';
    }

    // 7. OTP resend too soon / rate limit
    if (
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('once every') ||
      msg.includes('security purposes') ||
      error?.status === 429
    ) {
      return 'For security purposes, you can only request a verification code once every 60 seconds. Please wait a moment.';
    }

    // 8. Invalid login credentials
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Incorrect email address or password. Please check your credentials and try again.';
    }

    // 9. HTTP 500 / 504 SMTP Gateway Failures (Supabase GoTrue backend SMTP socket timeout or auth error)
    if (
      error?.status === 500 ||
      error?.status === 504 ||
      msg.includes('error sending confirmation email') ||
      msg.includes('error sending magic link') ||
      msg.includes('error sending') ||
      msg.includes('504') ||
      msg.includes('gateway timeout')
    ) {
      return 'Supabase Email Gateway Issue (HTTP 500/504): The server was unable to dispatch the verification email. This occurs when Supabase custom SMTP credentials (e.g., Gmail App Password) are invalid or project email limits are reached. Please check Spam/Promotions or use Instant Verification.';
    }

    // 10. General network / Supabase server errors
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('connection')) {
      return 'Unable to connect to the authentication server. Please check your internet connection.';
    }

    return error?.message || 'Authentication error occurred. Please try again.';
  };

  const resolveEmailOrMobile = async (emailOrMobile: string): Promise<string> => {
    const raw = emailOrMobile.trim();
    if (raw.includes('@')) {
      return raw;
    }
    const cleanDigits = raw.replace(/\D/g, '');
    const cleanMobile = cleanDigits.slice(-10);
    if (!cleanMobile) return raw;

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('email')
          .eq('mobile', cleanMobile)
          .maybeSingle();
        if (data?.email) {
          return data.email;
        }
      } catch (err) {
        console.warn('Mobile resolution error:', err);
      }
    } else {
      const mockPhone = ((MOCK_FARMER as any).mobileNumber || (MOCK_FARMER as any).mobile || '')?.replace(/\D/g, '').slice(-10);
      if (cleanMobile === mockPhone) {
        return MOCK_FARMER.email;
      }
      return `${cleanMobile}@farmer.smartprocure.gov.in`;
    }
    return raw;
  };

  const signIn = async (emailOrMobile: string, password: string): Promise<{ success: boolean; error?: string; isEmailUnconfirmed?: boolean }> => {
    setIsLoading(true);
    const cleanEmail = await resolveEmailOrMobile(emailOrMobile);

    if (!isSupabaseConfigured()) {
      const demoProfile: FarmerProfile = cleanEmail.toLowerCase() === MOCK_FARMER.email.toLowerCase()
        ? MOCK_FARMER
        : {
            ...MOCK_FARMER,
            id: `farmer-${Date.now()}`,
            email: cleanEmail,
            fullName: cleanEmail.split('@')[0] || MOCK_FARMER.fullName,
          };
      const mockUser = {
        id: demoProfile.id,
        app_metadata: {},
        user_metadata: { full_name: demoProfile.fullName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: demoProfile.email,
        email_confirmed_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      setUser(mockUser);
      setProfile(demoProfile);
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(demoProfile));
      setIsLoading(false);
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setIsLoading(false);
        const rawMsg = error.message?.toLowerCase() || '';
        const isEmailUnconfirmed = rawMsg.includes('email not confirmed') || rawMsg.includes('not confirmed');
        return {
          success: false,
          error: isEmailUnconfirmed ? 'Please verify your email before logging in.' : formatAuthError(error),
          isEmailUnconfirmed,
        };
      }

      if (data.user) {
        if (!isUserVerified(data.user)) {
          setIsLoading(false);
          return {
            success: false,
            error: 'Please verify your email before logging in.',
            isEmailUnconfirmed: true,
          };
        }
        setUser(data.user);
        setSession(data.session);
        await fetchProfileForUser(data.user);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      const rawMsg = err?.message?.toLowerCase() || '';
      const isEmailUnconfirmed = rawMsg.includes('email not confirmed') || rawMsg.includes('not confirmed');
      return {
        success: false,
        error: isEmailUnconfirmed ? 'Please verify your email before logging in.' : formatAuthError(err),
        isEmailUnconfirmed,
      };
    }
  };

  const signUp = async (data: FarmerRegistrationData): Promise<{ success: boolean; needsEmailVerification?: boolean; error?: string }> => {
    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      const newProfile: FarmerProfile = {
        id: `farmer-${Date.now()}`,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        mobileNumber: data.mobileNumber.trim(),
        state: data.state,
        district: data.district,
        bankAccount: data.bankAccount,
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const mockUser = {
        id: newProfile.id,
        app_metadata: {},
        user_metadata: { full_name: newProfile.fullName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: newProfile.email,
        email_confirmed_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      setUser(mockUser);
      setProfile(newProfile);
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(newProfile));
      setIsLoading(false);
      return { success: true, needsEmailVerification: false };
    }

    try {
      if (import.meta.env.DEV) {
        console.log('[Auth Debug] signUp: Farmer registration request initiated');
      }

      const cleanEmail = data.email.trim().toLowerCase();
      // Cache pending registration info locally so farmer data is preserved if SMTP fails
      const pendingProfile: FarmerProfile = {
        id: `farmer-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-')}`,
        fullName: data.fullName.trim(),
        email: cleanEmail,
        mobileNumber: data.mobileNumber.trim(),
        state: data.state,
        district: data.district,
        bankAccount: {
          accountNumber: data.bankAccount.accountNumber.trim(),
          ifscCode: data.bankAccount.ifscCode.trim(),
          bankName: data.bankAccount.bankName.trim(),
          accountHolderName: data.bankAccount.accountHolderName.trim(),
        },
        isEmailVerified: false,
        preferredLanguage: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(`pending_registration_${cleanEmail}`, JSON.stringify(pendingProfile));
      } catch { /* ignore */ }

      const { data: authData, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            phone: data.mobileNumber.trim(),
            mobile: data.mobileNumber.trim(),
            state: data.state,
            district: data.district,
            bank_account_number: data.bankAccount.accountNumber,
            ifsc_code: data.bankAccount.ifscCode,
            bank_name: data.bankAccount.bankName,
            account_holder_name: data.bankAccount.accountHolderName,
            bank_account_details: {
              accountNumber: data.bankAccount.accountNumber,
              ifscCode: data.bankAccount.ifscCode,
              bankName: data.bankAccount.bankName,
              accountHolderName: data.bankAccount.accountHolderName,
            },
          },
        },
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.warn('[Auth Debug] signUp: Registration failed', error);
        }
        setIsLoading(false);
        return { success: false, error: formatAuthError(error) };
      }

      // Check if user already exists (Supabase returns empty identities array to avoid email enumeration)
      if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
        setIsLoading(false);
        return {
          success: false,
          error: 'An account with this email address already exists. Please sign in with your password or use Forgot Password.',
        };
      }

      if (import.meta.env.DEV) {
        console.log('[Auth Debug] signUp: Registration succeeded, waiting for OTP verification');
      }

      const createdUser = authData.user;
      const createdSession = authData.session;

      // If auto-confirm is enabled and email is already confirmed
      if (createdSession && createdUser && createdUser.email_confirmed_at) {
        setUser(createdUser);
        setSession(createdSession);
        await fetchProfileForUser(createdUser);
        setIsLoading(false);
        return { success: true, needsEmailVerification: false };
      }

      // Supabase email confirmation is enabled:
      // Farmer must verify 6-digit OTP received via email before accessing dashboard
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsLoading(false);
      return { success: true, needsEmailVerification: true };
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[Auth Debug] signUp: Registration failed with error', err);
      }
      setIsLoading(false);
      return { success: false, error: formatAuthError(err) };
    }
  };

  const verifyOtp = async (email: string, token: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return { success: true };
    }

    try {
      const cleanEmail = email.trim();
      const cleanToken = token.trim().replace(/\s+/g, '');

      // Safe development logging: success/failure only. Never log OTP or secrets.
      if (import.meta.env.DEV) {
        console.log('[Auth Debug] verifyOtp: OTP verification request initiated');
      }

      // 1. Try 'signup' verification type first (for email confirmation codes)
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      // 2. If 'signup' fails, fallback to 'email' (for magic links / signInWithOtp)
      if (error) {
        const fallback = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!fallback.error) {
          data = fallback.data;
          error = null;
        }
      }

      if (error) {
        if (import.meta.env.DEV) {
          console.warn('[Auth Debug] verifyOtp: OTP verification failed');
        }
        setIsLoading(false);
        return { success: false, error: formatAuthError(error) };
      }

      if (import.meta.env.DEV) {
        console.log('[Auth Debug] verifyOtp: OTP verification succeeded');
      }

      // Refresh / retrieve the authenticated Supabase session
      const { data: sessionData } = await supabase.auth.getSession();
      const verifiedUser = data?.user || sessionData?.session?.user;
      const verifiedSession = data?.session || sessionData?.session;

      if (verifiedUser) {
        setUser(verifiedUser);
        setSession(verifiedSession ?? null);
        await fetchProfileForUser(verifiedUser);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[Auth Debug] verifyOtp: OTP verification failed with error');
      }
      setIsLoading(false);
      return { success: false, error: formatAuthError(err) };
    }
  };

  /**
   * Provides immediate verified portal access when Supabase SMTP server is offline,
   * experiencing HTTP 500 delivery errors, or rate limited.
   */
  const bypassVerificationForTesting = async (emailToVerify: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = emailToVerify.trim().toLowerCase();

      let farmerProf: FarmerProfile | null = null;
      try {
        const stored = localStorage.getItem(`pending_registration_${cleanEmail}`);
        if (stored) {
          farmerProf = JSON.parse(stored);
        }
      } catch { /* ignore */ }

      if (!farmerProf) {
        farmerProf = {
          id: `farmer-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '-') || 'verified'}`,
          fullName: cleanEmail.split('@')[0] || 'Registered Farmer',
          email: cleanEmail,
          mobileNumber: '9876543210',
          state: 'Punjab',
          district: 'Ludhiana',
          bankAccount: {
            accountNumber: '123456789012',
            ifscCode: 'SBIN0001234',
            bankName: 'State Bank of India',
            accountHolderName: cleanEmail.split('@')[0] || 'Registered Farmer',
          },
          isEmailVerified: true,
          preferredLanguage: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      farmerProf.isEmailVerified = true;

      const mockUser: User = {
        id: farmerProf.id,
        app_metadata: {},
        user_metadata: { full_name: farmerProf.fullName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: farmerProf.email,
        email_confirmed_at: new Date().toISOString(),
        role: 'authenticated',
        updated_at: new Date().toISOString(),
      } as User;

      setUser(mockUser);
      setProfile(farmerProf);
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(farmerProf));

      // Attempt to upsert record in Supabase profiles table if accessible
      if (isSupabaseConfigured()) {
        try {
          await supabase.from('profiles').upsert({
            id: mockUser.id,
            full_name: farmerProf.fullName,
            email: farmerProf.email,
            mobile: farmerProf.mobileNumber,
            state: farmerProf.state,
            district: farmerProf.district,
            preferred_language: 'en',
          }, { onConflict: 'id' });
        } catch { /* ignore */ }
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'Failed to complete instant verification.' };
    }
  };

  const resendOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const cleanEmail = email.trim();

      // Safe development logging: success/failure only. Never log secrets.
      if (import.meta.env.DEV) {
        console.log('[Auth Debug] resendOtp: Resend OTP request initiated');
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.warn('[Auth Debug] resendOtp: Resend OTP failed');
        }
        const msg = error.message?.toLowerCase() || '';
        if (
          msg.includes('rate limit') ||
          msg.includes('too many requests') ||
          msg.includes('once every') ||
          msg.includes('security purposes') ||
          (error as any).status === 429
        ) {
          return {
            success: false,
            error: 'For security purposes, you can only request a verification code once every 60 seconds. Please wait a moment before trying again.',
          };
        }
        if (msg.includes('user not found') || msg.includes('not found')) {
          return {
            success: false,
            error: 'No unverified account found with this email. Please check your email or register again.',
          };
        }
        if (msg.includes('already confirmed') || msg.includes('already verified')) {
          return {
            success: false,
            error: 'This account has already been verified. You can log in directly.',
          };
        }
        return { success: false, error: formatAuthError(error) };
      }

      if (import.meta.env.DEV) {
        console.log('[Auth Debug] resendOtp: Resend OTP succeeded');
      }

      return { success: true };
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error('[Auth Debug] resendOtp: Resend OTP failed with error');
      }
      return { success: false, error: formatAuthError(err) };
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      localStorage.removeItem(LOCAL_PROFILE_KEY);
      // Safely remove legacy un-scoped global booking cache to prevent leaking into next account
      localStorage.removeItem('smartprocure_farmer_bookings');
      setIsLoading(false);
    }
  };

  const resetPassword = async (emailOrMobile: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      const cleanEmail = await resolveEmailOrMobile(emailOrMobile);
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);
      if (error) {
        return { success: false, error: formatAuthError(error) };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  };

  const refreshProfile = async (): Promise<FarmerProfile | null> => {
    if (user) {
      return await fetchProfileForUser(user);
    }
    return profile;
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: Boolean(user && isUserVerified(user) && (session || !isSupabaseConfigured())),
    signIn,
    signUp,
    verifyOtp,
    resendOtp,
    bypassVerificationForTesting,
    signOut,
    resetPassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
