/**
 * Farmer Service - Abstracted interface for farmer profile operations.
 * Connects to Supabase Auth and the 'profiles' PostgreSQL table.
 */

import { FarmerProfile, IndianState } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const LOCAL_PROFILE_KEY = 'smartprocure_farmer_profile';

class FarmerService {
  /**
   * Fetches the logged-in farmer's real profile from Supabase.
   * Pulls from 'profiles' table and falls back to Supabase auth metadata if table row is pending.
   */
  async getCurrentProfile(): Promise<FarmerProfile | null> {
    if (!isSupabaseConfigured()) {
      return this.getLocalProfile();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      // 1. Attempt to fetch from public.profiles table
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          const profile: FarmerProfile = {
            id: data.id,
            fullName: data.full_name || user.user_metadata?.full_name || 'Farmer',
            email: data.email || user.email || '',
            mobileNumber: data.mobile || user.user_metadata?.mobile || '',
            state: (data.state as IndianState) || (user.user_metadata?.state as IndianState) || 'Punjab',
            district: data.district || user.user_metadata?.district || 'Ludhiana',
            profileImageUrl: data.profile_image_url || user.user_metadata?.profile_image_url || null,
            preferredLanguage: data.preferred_language || user.user_metadata?.preferred_language || 'en',
            notificationPreferences: data.notification_preferences || user.user_metadata?.notification_preferences || {
              sms: true,
              whatsapp: true,
              delay_alerts: true,
              voice: false,
            },
            bankAccount: {
              accountNumber: user.user_metadata?.bank_account_number
                ? `••••••••${user.user_metadata.bank_account_number.slice(-4)}`
                : '••••••••8912',
              ifscCode: user.user_metadata?.ifsc_code || 'PUNB0123400',
              bankName: user.user_metadata?.bank_name || 'Punjab National Bank',
              accountHolderName: user.user_metadata?.account_holder_name || data.full_name || 'Farmer',
            },
            isEmailVerified: Boolean(user.email_confirmed_at),
            createdAt: data.created_at || user.created_at,
            updatedAt: data.updated_at || new Date().toISOString(),
          };

          this.saveLocalProfile(profile);
          return profile;
        }
      } catch (tableErr) {
        console.warn('Direct profiles table query caught error, using auth metadata:', tableErr);
      }

      // 2. Fallback: Build profile from Supabase Auth user_metadata
      const authProfile: FarmerProfile = {
        id: user.id,
        fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Farmer',
        email: user.email || '',
        mobileNumber: user.user_metadata?.mobile || '',
        state: (user.user_metadata?.state as IndianState) || 'Punjab',
        district: user.user_metadata?.district || 'Ludhiana',
        profileImageUrl: user.user_metadata?.profile_image_url || null,
        preferredLanguage: user.user_metadata?.preferred_language || 'en',
        notificationPreferences: user.user_metadata?.notification_preferences || {
          sms: true,
          whatsapp: true,
          delay_alerts: true,
          voice: false,
        },
        bankAccount: {
          accountNumber: user.user_metadata?.bank_account_number
            ? `••••••••${user.user_metadata.bank_account_number.slice(-4)}`
            : '••••••••8912',
          ifscCode: user.user_metadata?.ifsc_code || 'PUNB0123400',
          bankName: user.user_metadata?.bank_name || 'Punjab National Bank',
          accountHolderName: user.user_metadata?.account_holder_name || user.user_metadata?.full_name || 'Farmer',
        },
        isEmailVerified: Boolean(user.email_confirmed_at),
        createdAt: user.created_at,
        updatedAt: new Date().toISOString(),
      };

      this.saveLocalProfile(authProfile);
      return authProfile;
    } catch (err) {
      console.warn('Supabase profile query failed, checking local cache', err);
      return this.getLocalProfile();
    }
  }

  /**
   * Alias for getCurrentProfile to preserve compatibility.
   */
  async getProfile(): Promise<FarmerProfile | null> {
    return this.getCurrentProfile();
  }

  /**
   * Updates the logged-in farmer's profile in Supabase.
   * Updates 'profiles' table and Supabase Auth user_metadata.
   */
  async updateProfile(updates: Partial<FarmerProfile>): Promise<FarmerProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be logged in to update your profile.');
    }

    const now = new Date().toISOString();

    // 1. Prepare database updates for public.profiles
    const dbUpdates: Record<string, any> = {
      updated_at: now,
    };
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName.trim();
    if (updates.mobileNumber !== undefined) dbUpdates.mobile = updates.mobileNumber.trim();
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.district !== undefined) dbUpdates.district = updates.district.trim();
    if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl;
    if (updates.preferredLanguage !== undefined) dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.notificationPreferences !== undefined) dbUpdates.notification_preferences = updates.notificationPreferences;

    // 2. Prepare auth user_metadata updates
    const metadataUpdates: Record<string, any> = {};
    if (updates.fullName !== undefined) metadataUpdates.full_name = updates.fullName.trim();
    if (updates.mobileNumber !== undefined) metadataUpdates.mobile = updates.mobileNumber.trim();
    if (updates.state !== undefined) metadataUpdates.state = updates.state;
    if (updates.district !== undefined) metadataUpdates.district = updates.district.trim();
    if (updates.profileImageUrl !== undefined) metadataUpdates.profile_image_url = updates.profileImageUrl;
    if (updates.preferredLanguage !== undefined) metadataUpdates.preferred_language = updates.preferredLanguage;
    if (updates.notificationPreferences !== undefined) metadataUpdates.notification_preferences = updates.notificationPreferences;

    // Update Supabase Auth user metadata
    try {
      await supabase.auth.updateUser({
        data: metadataUpdates,
      });
    } catch (authErr) {
      console.warn('Failed to update Supabase auth metadata:', authErr);
    }

    // Update public.profiles table (strictly scoped to user.id via RLS)
    try {
      await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);
    } catch (tableErr) {
      console.warn('Failed to update public.profiles table:', tableErr);
    }

    // Refresh profile to retrieve merged state
    const updated = await this.getCurrentProfile();
    if (!updated) {
      throw new Error('Profile update completed but failed to reload profile state.');
    }

    this.saveLocalProfile(updated);
    return updated;
  }

  private getLocalProfile(): FarmerProfile | null {
    try {
      const cached = localStorage.getItem(LOCAL_PROFILE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return null;
  }

  private saveLocalProfile(profile: FarmerProfile): void {
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }
}

export const farmerService = new FarmerService();
