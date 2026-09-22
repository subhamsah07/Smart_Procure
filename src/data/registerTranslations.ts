import { SupportedLanguage } from '../i18n';

export interface RegisterTextContent {
  brandSubtagline: string;
  portalTitle: string;
  portalSubtitle: string;
  stepOf: (current: number, total: number) => string;
  authConnected: string;
  selectLanguage: string;
  selectLanguagePrompt: string;

  steps: {
    step1Title: string;
    step1Heading: string;
    step1Desc: string;
    step2Title: string;
    step2Heading: string;
    step2Desc: string;
    step3Title: string;
    step3Heading: string;
    step3Desc: string;
    step4Title: string;
    step4Heading: string;
    step4Desc: string;
  };

  fields: {
    fullNameLabel: string;
    fullNamePlaceholder: string;
    fullNameHelper: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailHelper: string;
    mobileLabel: string;
    mobilePlaceholder: string;
    mobileHelper: string;
    stateLabel: string;
    districtLabel: string;
    stateNotice: (state: string) => string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    accountHolderLabel: string;
    accountHolderPlaceholder: string;
    bankNameLabel: string;
    bankNamePlaceholder: string;
    accountNumberLabel: string;
    accountNumberPlaceholder: string;
    ifscLabel: string;
    ifscPlaceholder: string;
    bankSecurityNotice: string;
  };

  buttons: {
    back: string;
    existingUser: string;
    continue: string;
    complete: string;
    registering: string;
  };

  errors: {
    basicDetailsRequired: string;
    validEmailRequired: string;
    locationRequired: string;
    passwordMinLength: string;
    passwordsMismatch: string;
    bankDetailsRequired: string;
    registrationFailed: string;
  };

  theme: {
    toggleDark: string;
    toggleLight: string;
  };
}

export const REGISTER_TRANSLATIONS: Record<SupportedLanguage, RegisterTextContent> = {
  en: {
    brandSubtagline: 'National Agricultural Digital Procurement',
    portalTitle: 'Farmer Portal Registration',
    portalSubtitle: 'Set up your farmer account for direct procurement slot assignment and DBT fund clearances',
    stepOf: (current, total) => `Step ${current} of ${total}`,
    authConnected: 'Supabase Auth Protected',
    selectLanguage: 'Select Language',
    selectLanguagePrompt: 'Choose your preferred language',

    steps: {
      step1Title: 'Basic Info',
      step1Heading: 'Basic Farmer Identification',
      step1Desc: 'Used for official SMS and email arrival updates.',
      step2Title: 'Location',
      step2Heading: 'Farming Location & District',
      step2Desc: 'Ensures procurement slot routing to your authorized state mandi.',
      step3Title: 'Security',
      step3Heading: 'Account Security Credentials',
      step3Desc: 'Create a password to access your live token queue and slips.',
      step4Title: 'Bank Account',
      step4Heading: 'Direct Benefit Transfer (DBT) Bank Details',
      step4Desc: 'Direct bank transfer will credit MSP payments to this account.',
    },

    fields: {
      fullNameLabel: 'Full Legal Name',
      fullNamePlaceholder: 'e.g. Rameshwar Singh',
      fullNameHelper: 'Must match your Aadhaar / Bank Passbook name exactly.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'rameshwar.farmer@example.com',
      emailHelper: 'A verification OTP will be dispatched here.',
      mobileLabel: 'Mobile Number (Linked with Aadhaar)',
      mobilePlaceholder: '9876543210',
      mobileHelper: 'Used for automated queue delay and slot alerts.',
      stateLabel: 'State',
      districtLabel: 'District',
      stateNotice: (state) => `Procurement slots and mandi discovery will be restricted to authorized centres within ${state}.`,
      passwordLabel: 'Create Password',
      passwordPlaceholder: 'Minimum 6 characters',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: 'Re-enter password',
      accountHolderLabel: 'Account Holder Name',
      accountHolderPlaceholder: 'As per bank passbook',
      bankNameLabel: 'Bank Name',
      bankNamePlaceholder: 'e.g. State Bank of India / PNB',
      accountNumberLabel: 'Bank Account Number',
      accountNumberPlaceholder: 'Enter account number',
      ifscLabel: 'Bank IFSC Code',
      ifscPlaceholder: 'e.g. PUNB0123400 / SBIN0001234',
      bankSecurityNotice: 'Bank details are encrypted and securely mapped to your verified profile for DBT payment transfers.',
    },

    buttons: {
      back: 'Back',
      existingUser: 'Existing User? Login',
      continue: 'Continue',
      complete: 'Complete Registration',
      registering: 'Registering...',
    },

    errors: {
      basicDetailsRequired: 'Please fill in all basic details.',
      validEmailRequired: 'Please enter a valid email address.',
      locationRequired: 'Please select both state and district.',
      passwordMinLength: 'Password must be at least 6 characters.',
      passwordsMismatch: 'Passwords do not match.',
      bankDetailsRequired: 'Please provide all bank account details for direct benefit transfer.',
      registrationFailed: 'Registration failed. Please check your details and try again.',
    },

    theme: {
      toggleDark: 'Switch to Dark Mode',
      toggleLight: 'Switch to Light Mode',
    },
  },

  hi: {
    brandSubtagline: 'राष्ट्रीय कृषि डिजिटल खरीद प्रणाली',
    portalTitle: 'किसान पोर्टल पंजीकरण',
    portalSubtitle: 'सीधे खरीद स्लॉट आवंटन और डीबीटी भुगतान के लिए अपना किसान खाता बनाएं',
    stepOf: (current, total) => `चरण ${current} / ${total}`,
    authConnected: 'सुपाबेस ऑथ सुरक्षित',
    selectLanguage: 'भाषा चुनें',
    selectLanguagePrompt: 'अपनी पसंदीदा भाषा चुनें',

    steps: {
      step1Title: 'बुनियादी जानकारी',
      step1Heading: 'किसान की बुनियादी पहचान',
      step1Desc: 'आधिकारिक एसएमएस और ईमेल आगमन अपडेट के लिए उपयोग किया जाता है।',
      step2Title: 'स्थान',
      step2Heading: 'खेती का स्थान व ज़िला',
      step2Desc: 'आपकी अधिकृत राज्य मंडी में खरीद स्लॉट आवंटन सुनिश्चित करता है।',
      step3Title: 'सुरक्षा',
      step3Heading: 'खाता सुरक्षा क्रेडेंशियल',
      step3Desc: 'अपने लाइव टोकन, कतार और रसीद देखने के लिए पासवर्ड बनाएं।',
      step4Title: 'बैंक खाता',
      step4Heading: 'प्रत्यक्ष लाभ अंतरण (DBT) बैंक विवरण',
      step4Desc: 'सीधे बैंक खाते में आपकी फसल का सरकारी एमएसपी भुगतान जमा होगा।',
    },

    fields: {
      fullNameLabel: 'पूरा कानूनी नाम',
      fullNamePlaceholder: 'उदा. रामेश्वर सिंह',
      fullNameHelper: 'आधार कार्ड / बैंक पासबुक के नाम से बिल्कुल मेल खाना चाहिए।',
      emailLabel: 'ईमेल पता',
      emailPlaceholder: 'rameshwar.farmer@example.com',
      emailHelper: 'सत्यापन ओटीपी यहाँ भेजा जाएगा।',
      mobileLabel: 'मोबाइल नंबर (आधार से जुड़ा हुआ)',
      mobilePlaceholder: '9876543210',
      mobileHelper: 'मंडी कतार में देरी और स्लॉट अलर्ट के लिए उपयोग किया जाता है।',
      stateLabel: 'राज्य',
      districtLabel: 'ज़िला',
      stateNotice: (state) => `खरीद स्लॉट और मंडी खोज ${state} के अधिकृत केंद्रों तक सीमित होगी।`,
      passwordLabel: 'पासवर्ड बनाएं',
      passwordPlaceholder: 'न्यूनतम 6 अक्षर',
      confirmPasswordLabel: 'पासवर्ड की पुष्टि करें',
      confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
      accountHolderLabel: 'खाताधारक का नाम',
      accountHolderPlaceholder: 'बैंक पासबुक के अनुसार',
      bankNameLabel: 'बैंक का नाम',
      bankNamePlaceholder: 'उदा. भारतीय स्टेट बैंक / पीएनबी',
      accountNumberLabel: 'बैंक खाता संख्या',
      accountNumberPlaceholder: 'खाता संख्या दर्ज करें',
      ifscLabel: 'बैंक IFSC कोड',
      ifscPlaceholder: 'उदा. PUNB0123400 / SBIN0001234',
      bankSecurityNotice: 'बैंक विवरण एन्क्रिप्टेड हैं और डीबीटी भुगतान हस्तांतरण के लिए आपकी प्रोफ़ाइल से सुरक्षित जुड़े हैं।',
    },

    buttons: {
      back: 'पीछे',
      existingUser: 'पहले से पंजीकृत हैं? लॉगिन',
      continue: 'आगे बढ़ें',
      complete: 'पंजीकरण पूरा करें',
      registering: 'पंजीकरण हो रहा है...',
    },

    errors: {
      basicDetailsRequired: 'कृपया सभी बुनियादी विवरण भरें।',
      validEmailRequired: 'कृपया एक मान्य ईमेल पता दर्ज करें।',
      locationRequired: 'कृपया राज्य और ज़िला दोनों चुनें।',
      passwordMinLength: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
      passwordsMismatch: 'पासवर्ड मेल नहीं खाते।',
      bankDetailsRequired: 'कृपया डीबीटी हस्तांतरण के लिए सभी बैंक खाता विवरण प्रदान करें।',
      registrationFailed: 'पंजीकरण विफल रहा। कृपया अपने विवरण जांचें और पुनः प्रयास करें।',
    },

    theme: {
      toggleDark: 'डार्क मोड पर स्विच करें',
      toggleLight: 'लाइट मोड पर स्विच करें',
    },
  },

  pa: {
    brandSubtagline: 'ਰਾਸ਼ਟਰੀ ਖੇਤੀਬਾੜੀ ਡਿਜੀਟਲ ਖਰੀਦ ਪ੍ਰਣਾਲੀ',
    portalTitle: 'ਕਿਸਾਨ ਪੋਰਟਲ ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
    portalSubtitle: 'ਸਿੱਧੇ ਖਰੀਦ ਸਲਾਟ ਨਿਰਧਾਰਨ ਅਤੇ ਡੀਬੀਟੀ ਫੰਡ ਕਲੀਅਰੈਂਸ ਲਈ ਆਪਣਾ ਕਿਸਾਨ ਖਾਤਾ ਬਣਾਓ',
    stepOf: (current, total) => `ਕਦਮ ${current} / ${total}`,
    authConnected: 'ਸੁਪਾਬੇਸ ਔਥ ਸੁਰੱਖਿਅਤ',
    selectLanguage: 'ਭਾਸ਼ਾ ਚੁਣੋ',
    selectLanguagePrompt: 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਚੁਣੋ',

    steps: {
      step1Title: 'ਮੁੱਢਲੀ ਜਾਣਕਾਰੀ',
      step1Heading: 'ਕਿਸਾਨ ਦੀ ਮੁੱਢਲੀ ਪਛਾਣ',
      step1Desc: 'ਅਧਿਕਾਰਤ ਐਸਐਮਐਸ ਅਤੇ ਈਮੇਲ ਆਗਮਨ ਅੱਪਡੇਟ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
      step2Title: 'ਸਥਾਨ',
      step2Heading: 'ਖੇਤੀ ਦਾ ਸਥਾਨ ਅਤੇ ਜ਼ਿਲ੍ਹਾ',
      step2Desc: 'ਤੁਹਾਡੀ ਅਧਿਕਾਰਤ ਰਾਜ ਮੰਡੀ ਵਿੱਚ ਖਰੀਦ ਸਲਾਟ ਨਿਰਧਾਰਿਤ ਕਰਦਾ ਹੈ।',
      step3Title: 'ਸੁਰੱਖਿਆ',
      step3Heading: 'ਖਾਤਾ ਸੁਰੱਖਿਆ ਪ੍ਰਮਾਣ ਪੱਤਰ',
      step3Desc: 'ਆਪਣੇ ਲਾਈਵ ਟੋਕਨ, ਕਤਾਰ ਅਤੇ ਪਰਚੀਆਂ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ਪਾਸਵਰਡ ਬਣਾਓ।',
      step4Title: 'ਬੈਂਕ ਖਾਤਾ',
      step4Heading: 'ਡਾਇਰੈਕਟ ਬੈਨੀਫਿਟ ਟ੍ਰਾਂਸਫਰ (DBT) ਬੈਂਕ ਵੇਰਵੇ',
      step4Desc: 'ਸਿੱਧਾ ਬੈਂਕ ਟ੍ਰਾਂਸਫਰ ਤੁਹਾਡੀ ਫਸਲ ਦਾ ਐਮਐਸਪੀ ਭੁਗਤਾਨ ਇਸ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾ ਕਰੇਗਾ।',
    },

    fields: {
      fullNameLabel: 'ਪੂਰਾ ਕਾਨੂੰਨੀ ਨਾਮ',
      fullNamePlaceholder: 'ਉਦਾ. ਬਲਵਿੰਦਰ ਸਿੰਘ',
      fullNameHelper: 'ਆਧਾਰ / ਬੈਂਕ ਪਾਸਬੁੱਕ ਦੇ ਨਾਮ ਨਾਲ ਬਿਲਕੁਲ ਮੇਲ ਖਾਂਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।',
      emailLabel: 'ਈਮੇਲ ਪਤਾ',
      emailPlaceholder: 'balwinder.farmer@example.com',
      emailHelper: 'ਪੁਸ਼ਟੀਕਰਨ ਓਟੀਪੀ ਇੱਥੇ ਭੇਜਿਆ ਜਾਵੇਗਾ।',
      mobileLabel: 'ਮੋਬਾਈਲ ਨੰਬਰ (ਆਧਾਰ ਨਾਲ ਲਿੰਕ)',
      mobilePlaceholder: '9876543210',
      mobileHelper: 'ਕਤਾਰ ਦੇਰੀ ਅਤੇ ਸਲਾਟ ਅਲਰਟ ਲਈ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
      stateLabel: 'ਰਾਜ',
      districtLabel: 'ਜ਼ਿਲ੍ਹਾ',
      stateNotice: (state) => `ਖਰੀਦ ਸਲਾਟ ਅਤੇ ਮੰਡੀ ਖੋਜ ${state} ਦੇ ਅਧਿਕਾਰਤ ਕੇਂਦਰਾਂ ਤੱਕ ਸੀਮਤ ਹੋਵੇਗੀ।`,
      passwordLabel: 'ਪਾਸਵਰਡ ਬਣਾਓ',
      passwordPlaceholder: 'ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰ',
      confirmPasswordLabel: 'ਪਾਸਵਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ',
      confirmPasswordPlaceholder: 'ਪਾਸਵਰਡ ਦੁਬਾਰਾ ਦਰਜ ਕਰੋ',
      accountHolderLabel: 'ਖਾਤਾ ਧਾਰਕ ਦਾ ਨਾਮ',
      accountHolderPlaceholder: 'ਬੈਂਕ ਪਾਸਬੁੱਕ ਅਨੁਸਾਰ',
      bankNameLabel: 'ਬੈਂਕ ਦਾ ਨਾਮ',
      bankNamePlaceholder: 'ਉਦਾ. ਪੰਜਾਬ ਨੈਸ਼ਨਲ ਬੈਂਕ / ਐਸ.ਬੀ.ਆਈ.',
      accountNumberLabel: 'ਬੈਂਕ ਖਾਤਾ ਨੰਬਰ',
      accountNumberPlaceholder: 'ਖਾਤਾ ਨੰਬਰ ਦਰਜ ਕਰੋ',
      ifscLabel: 'ਬੈਂਕ IFSC ਕੋਡ',
      ifscPlaceholder: 'ਉਦਾ. PUNB0123400 / SBIN0001234',
      bankSecurityNotice: 'ਬੈਂਕ ਵੇਰਵੇ ਐਨਕ੍ਰਿਪਟਡ ਹਨ ਅਤੇ ਡੀਬੀਟੀ ਭੁਗਤਾਨ ਲਈ ਤੁਹਾਡੀ ਪ੍ਰੋਫਾਈਲ ਨਾਲ ਸੁਰੱਖਿਅਤ ਜੁੜੇ ਹਨ।',
    },

    buttons: {
      back: 'ਪਿੱਛੇ',
      existingUser: 'ਪਹਿਲਾਂ ਹੀ ਖਾਤਾ ਹੈ? ਲੌਗਇਨ',
      continue: 'ਅੱਗੇ ਵਧੋ',
      complete: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਕਰੋ',
      registering: 'ਰਜਿਸਟਰ ਹੋ ਰਿਹਾ ਹੈ...',
    },

    errors: {
      basicDetailsRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਮੁੱਢਲੇ ਵੇਰਵੇ ਭਰੋ।',
      validEmailRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵੈਧ ਈਮੇਲ ਪਤਾ ਦਾਖਲ ਕਰੋ।',
      locationRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਰਾਜ ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਦੋਵੇਂ ਚੁਣੋ।',
      passwordMinLength: 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ।',
      passwordsMismatch: 'ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ।',
      bankDetailsRequired: 'ਕਿਰਪਾ ਕਰਕੇ ਡੀਬੀਟੀ ਲਈ ਸਾਰੇ ਬੈਂਕ ਖਾਤੇ ਦੇ ਵੇਰਵੇ ਪ੍ਰਦਾਨ ਕਰੋ।',
      registrationFailed: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਅਸਫਲ ਰਹੀ। ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਵੇਰਵੇ ਚੈੱਕ ਕਰੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    },

    theme: {
      toggleDark: 'ਡਾਰਕ ਮੋਡ ਵਿੱਚ ਬਦਲੋ',
      toggleLight: 'ਲਾਈਟ ਮੋਡ ਵਿੱਚ ਬਦਲੋ',
    },
  },

  bn: {
    brandSubtagline: 'জাতীয় কৃষি ডিজিটাল সংগ্রহ প্ল্যাটফর্ম',
    portalTitle: 'কৃষক পোর্টাল নিবন্ধন',
    portalSubtitle: 'সরাসরি সংগ্রহ স্লট বরাদ্দ এবং ডিবিটি তহবিল ছাড়ের জন্য আপনার কৃষক অ্যাকাউন্ট সেট আপ করুন',
    stepOf: (current, total) => `ধাপ ${current} / ${total}`,
    authConnected: 'সুপাবেস অ্যাথ সুরক্ষিত',
    selectLanguage: 'ভাষা নির্বাচন করুন',
    selectLanguagePrompt: 'আপনার পছন্দের ভাষা নির্বাচন করুন',

    steps: {
      step1Title: 'প্রাথমিক তথ্য',
      step1Heading: 'কৃষকের প্রাথমিক পরিচয়',
      step1Desc: 'অফিসিয়াল এসএমএস এবং ইমেল আগমনের আপডেটের জন্য ব্যবহৃত হয়।',
      step2Title: 'অবস্থান',
      step2Heading: 'কৃষি অবস্থান ও জেলা',
      step2Desc: 'আপনার অনুমোদিত রাজ্য মণ্ডিতে সংগ্রহের স্লট বরাদ্দ নিশ্চিত করে।',
      step3Title: 'নিরাপত্তা',
      step3Heading: 'অ্যাকাউন্ট নিরাপত্তা শংসাপত্র',
      step3Desc: 'আপনার লাইভ টোকেন কিউ এবং রসিদ অ্যাক্সেস করতে পাসওয়ার্ড তৈরি করুন।',
      step4Title: 'ব্যাঙ্ক অ্যাকাউন্ট',
      step4Heading: 'ডাইরেক্ট বেনিফিট ট্রান্সফার (DBT) ব্যাঙ্ক বিবরণ',
      step4Desc: 'সরাসরি ব্যাঙ্ক ট্রান্সফার এই অ্যাকাউন্টে ফসলের এমএসপি অর্থ জমা করবে।',
    },

    fields: {
      fullNameLabel: 'সম্পূর্ণ আইনি নাম',
      fullNamePlaceholder: 'যেমন রামেশ্বর সিংহ',
      fullNameHelper: 'আধার / ব্যাঙ্ক পাসবুকের নামের সাথে হুবহু মিল থাকতে হবে।',
      emailLabel: 'ইমেল ঠিকানা',
      emailPlaceholder: 'rameshwar.farmer@example.com',
      emailHelper: 'এখানে যাচাইকরণ ওটিপি পাঠানো হবে।',
      mobileLabel: 'মোবাইল নম্বর (আধার সংযুক্ত)',
      mobilePlaceholder: '9876543210',
      mobileHelper: 'স্বয়ংক্রিয় কিউ বিলম্ব এবং স্লট সতর্কতার জন্য ব্যবহৃত হয়।',
      stateLabel: 'রাজ্য',
      districtLabel: 'জেলা',
      stateNotice: (state) => `সংগ্রহের স্লট এবং মন্ডি অনুসন্ধান ${state}-এর অনুমোদিত কেন্দ্রের মধ্যে সীমাবদ্ধ থাকবে।`,
      passwordLabel: 'পাসওয়ার্ড তৈরি করুন',
      passwordPlaceholder: 'ন্যূনতম ৬টি অক্ষর',
      confirmPasswordLabel: 'পাসওয়ার্ড নিশ্চিত করুন',
      confirmPasswordPlaceholder: 'পাসওয়ার্ড পুনরায় লিখুন',
      accountHolderLabel: 'অ্যাকাউন্টধারীর নাম',
      accountHolderPlaceholder: 'ব্যাঙ্ক পাসবুক অনুযায়ী',
      bankNameLabel: 'ব্যাঙ্কের নাম',
      bankNamePlaceholder: 'যেমন স্টেট ব্যাঙ্ক অফ ইন্ডিয়া / পিএনবি',
      accountNumberLabel: 'ব্যাঙ্ক অ্যাকাউন্ট নম্বর',
      accountNumberPlaceholder: 'অ্যাকাউন্ট নম্বর লিখুন',
      ifscLabel: 'ব্যাঙ্ক IFSC কোড',
      ifscPlaceholder: 'যেমন PUNB0123400 / SBIN0001234',
      bankSecurityNotice: 'ব্যাঙ্কের বিবরণ এনক্রিপ্ট করা হয়েছে এবং ডিবিটি স্থানান্তরের জন্য আপনার প্রোফাইলের সাথে সুরক্ষিতভাবে যুক্ত।',
    },

    buttons: {
      back: 'পেছনে',
      existingUser: 'ইতিমধ্যে নিবন্ধিত? লগইন',
      continue: 'এগিয়ে যান',
      complete: 'নিবন্ধন সম্পূর্ণ করুন',
      registering: 'নিবন্ধন করা হচ্ছে...',
    },

    errors: {
      basicDetailsRequired: 'অনুগ্রহ করে সমস্ত প্রাথমিক বিবরণ পূরণ করুন।',
      validEmailRequired: 'অনুগ্রহ করে একটি বৈধ ইমেল ঠিকানা লিখুন।',
      locationRequired: 'অনুগ্রহ করে রাজ্য এবং জেলা উভয়ই নির্বাচন করুন।',
      passwordMinLength: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      passwordsMismatch: 'পাসওয়ার্ড দুটি মিলছে না।',
      bankDetailsRequired: 'সরাসরি স্থানান্তরের জন্য সমস্ত ব্যাঙ্কের বিবরণ প্রদান করুন।',
      registrationFailed: 'নিবন্ধন ব্যর্থ হয়েছে। আপনার বিবরণ পরীক্ষা করে আবার চেষ্টা করুন।',
    },

    theme: {
      toggleDark: 'ডার্ক মোডে স্যুইচ করুন',
      toggleLight: 'লাইট মোডে স্যুইচ করুন',
    },
  },
};

export const getRegisterTranslations = (lang: SupportedLanguage): RegisterTextContent => {
  return REGISTER_TRANSLATIONS[lang] || REGISTER_TRANSLATIONS.en;
};
