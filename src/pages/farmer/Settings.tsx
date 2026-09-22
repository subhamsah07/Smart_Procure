import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Globe,
  Bell,
  Lock,
  LogOut,
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, SupportedLanguage } from '../../i18n';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../contexts/AuthContext';
import { IndianState, FarmerProfile } from '../../types';
import { farmerService } from '../../services/farmerService';

const INDIAN_STATES: IndianState[] = [
  'Punjab',
  'Haryana',
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Rajasthan',
  'Bihar',
  'Maharashtra',
  'Gujarat',
  'Odisha',
  'Telangana',
];

const AVATAR_OPTIONS = [
  { id: 'av-1', label: 'Farmer Blue Turban', emoji: '👨‍🌾' },
  { id: 'av-2', label: 'Farmer Green Turban', emoji: '👳‍♂️' },
  { id: 'av-3', label: 'Farmer Woman Leader', emoji: '👩‍🌾' },
  { id: 'av-4', label: 'Senior Agronomist', emoji: '👴' },
  { id: 'av-5', label: 'Kisan Mitra', emoji: '🌾' },
];

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { profile, user, signOut } = useAuth();

  // Loading & Saving states
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = React.useState('');
  const [mobileNumber, setMobileNumber] = React.useState('');
  const [state, setState] = React.useState<IndianState>('Punjab');
  const [district, setDistrict] = React.useState('Ludhiana');
  const [email, setEmail] = React.useState('');
  const [selectedAvatar, setSelectedAvatar] = React.useState<string>('🌾');
  const [preferredLang, setPreferredLang] = React.useState<SupportedLanguage>('en');

  // Notifications
  const [smsAlerts, setSmsAlerts] = React.useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = React.useState(true);
  const [delayNotices, setDelayNotices] = React.useState(true);
  const [voiceAlerts, setVoiceAlerts] = React.useState(false);

  // Bank details for display
  const [bankAccount, setBankAccount] = React.useState({
    accountNumber: '••••••••8912',
    ifscCode: 'PUNB0123400',
    bankName: 'Punjab National Bank',
    accountHolderName: 'Farmer',
  });

  // Populate data on mount or when profile changes
  React.useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const fetched = await farmerService.getProfile();
        if (active && fetched) {
          setFullName(fetched.fullName || '');
          setMobileNumber(fetched.mobileNumber || '');
          setState(fetched.state || 'Punjab');
          setDistrict(fetched.district || 'Ludhiana');
          setEmail(fetched.email || user?.email || '');
          if (fetched.profileImageUrl) {
            setSelectedAvatar(fetched.profileImageUrl);
          }
          if (fetched.preferredLanguage) {
            setPreferredLang(fetched.preferredLanguage as SupportedLanguage);
          }
          if (fetched.notificationPreferences) {
            setSmsAlerts(fetched.notificationPreferences.sms ?? true);
            setWhatsappAlerts(fetched.notificationPreferences.whatsapp ?? true);
            setDelayNotices(fetched.notificationPreferences.delay_alerts ?? true);
            setVoiceAlerts(fetched.notificationPreferences.voice ?? false);
          }
          if (fetched.bankAccount) {
            setBankAccount(fetched.bankAccount);
          }
        }
      } catch (err) {
        console.warn('Failed to load profile in Settings:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [profile, user]);

  const handleLanguageChange = (code: SupportedLanguage) => {
    setPreferredLang(code);
    i18n.changeLanguage(code);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updates: Partial<FarmerProfile> = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        state,
        district: district.trim(),
        profileImageUrl: selectedAvatar,
        preferredLanguage: preferredLang,
        notificationPreferences: {
          sms: smsAlerts,
          whatsapp: whatsappAlerts,
          delay_alerts: delayNotices,
          voice: voiceAlerts,
        },
      };

      await farmerService.updateProfile(updates);
      setSuccessMessage('Profile updated successfully in Supabase.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setErrorMessage(err.message || 'Unable to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } finally {
      navigate('/login', { replace: true, state: { message: 'You have been signed out securely.' } });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Farmer Account & Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your verified farmer identity, state jurisdiction, regional language preferences, and mandi alert channels.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" title="Profile Saved">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive" title="Update Failed">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        </Alert>
      )}

      {/* SECTION 1: PROFILE IDENTIFICATION */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <User className="h-4 w-4" />
            <span>Profile & Identification</span>
          </div>
          <CardTitle className="text-lg">Registered Farmer Details</CardTitle>
          <CardDescription>
            Official details matching your state agricultural revenue record, registered mobile, and Aadhaar linkage.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="text-sm">Loading farmer profile from Supabase...</span>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Header preview & avatar selector */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-emerald-700 text-white text-3xl flex items-center justify-center border-4 border-emerald-100 shadow-xs">
                  {selectedAvatar || (fullName ? fullName.slice(0, 2).toUpperCase() : '🌾')}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                    <span>{fullName || 'Registered Farmer'}</span>
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  </h3>
                  <p className="text-xs text-slate-500">
                    {district || 'District'}, State of {state}
                  </p>
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block font-semibold">
                    Aadhaar Linked &bull; Real-Time Supabase Synced
                  </span>
                </div>

                {/* Avatar quick picker */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Profile Badge
                  </label>
                  <div className="flex items-center gap-1.5">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setSelectedAvatar(av.emoji)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg border transition-all ${
                          selectedAvatar === av.emoji
                            ? 'border-2 border-emerald-600 bg-emerald-50 scale-105 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                        title={av.label}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Legal Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rameshwar Singh"
                  required
                />
                <Input
                  label="Registered Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  required
                />

                {/* State Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">
                    State Jurisdiction (Determines Active MSP Rate)
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value as IndianState)}
                    className="flex h-11 w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3.5 py-2 text-sm text-slate-900 dark:text-neutral-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st} className="bg-white dark:bg-neutral-800 text-slate-900 dark:text-neutral-100">
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                {/* District Input */}
                <Input
                  label="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Ludhiana, Karnal, Patna"
                  required
                />

                {/* Email (Read-only managed via Supabase Auth) */}
                <div className="sm:col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-slate-700 dark:text-neutral-300">Email Address</label>
                    <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Managed via Supabase Auth</span>
                  </div>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="flex h-11 w-full rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-900 px-3.5 py-2 text-sm text-slate-600 dark:text-neutral-400 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Bank Details Display */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-900/80 border border-slate-200 dark:border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-neutral-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    Verified Direct Benefit Transfer (DBT) Bank Account
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Active</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 dark:text-neutral-500 block text-[11px]">Bank Name</span>
                    <span className="font-semibold text-slate-900 dark:text-neutral-100">{bankAccount.bankName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-neutral-500 block text-[11px]">Account Number</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-neutral-100">{bankAccount.accountNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-neutral-500 block text-[11px]">IFSC Code</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-neutral-100">{bankAccount.ifscCode}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSaving}
                  className="gap-2 shadow-xs min-w-[170px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: PREFERENCES (LANGUAGE & NOTIFICATIONS) */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Globe className="h-4 w-4" />
            <span>Portal Preferences</span>
          </div>
          <CardTitle className="text-lg">Language & Alert Channels</CardTitle>
          <CardDescription>
            Choose your preferred regional dialect for automated voice alerts and SMS arrival reminders.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Languages selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Regional Language (भाषा / ਬੋਲੀ)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LANGUAGES.map((lang) => {
                const isSelected = preferredLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <span className="font-bold text-sm">{lang.nativeName}</span>
                    <span className="text-[11px] text-slate-400 mt-1">{lang.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification toggles */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Automated Arrival & Delay Alerts
            </label>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">
                    SMS Text Alerts on Registered Mobile
                  </span>
                  <span className="text-xs text-slate-500">
                    Receive token dispatch and arrival countdown reminders via cellular network.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">
                    WhatsApp Digital QR & Slot Updates
                  </span>
                  <span className="text-xs text-slate-500">
                    Receive high-resolution gate pass QR codes directly on WhatsApp.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">
                    Urgent Mandi Delay & Lunch Hour Alerts
                  </span>
                  <span className="text-xs text-slate-500">
                    Instant alerts if weighbridge pace changes or lunch recess shifts scheduled intake.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={delayNotices}
                  onChange={(e) => setDelayNotices(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="text-sm font-semibold text-slate-900 block">
                    Automated Voice Call (IVR) for Critical Bay Callouts
                  </span>
                  <span className="text-xs text-slate-500">
                    Automated call in your regional dialect when your trolley is called to the bay.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={voiceAlerts}
                  onChange={(e) => setVoiceAlerts(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: SECURITY & SESSION */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider">
            <Lock className="h-4 w-4" />
            <span>Security & Session</span>
          </div>
          <CardTitle className="text-lg">Password & Session Management</CardTitle>
          <CardDescription>
            Manage your session security or log out of this device.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Account Status</span>
              <span className="text-[11px] text-slate-500">Authenticated via Supabase Session</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200">
              Active &amp; Secure
            </span>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Session secured with 256-bit SSL encryption.
            </span>
            <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out of Account</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

