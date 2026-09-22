import {
  UserCheck,
  Wheat,
  Building2,
  QrCode,
  Truck,
  CreditCard,
  LucideIcon
} from 'lucide-react';
import { SupportedLanguage } from '../i18n';

export interface WalkthroughStep {
  stepNumber: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  desc: string;
  icon: LucideIcon;
  badge: string;
  accentColor: string;
  badgeBg: string;
  tagColor: string;
  cropTag: string;
  image: string;
  mockVisual: {
    screenTitle: string;
    line1: string;
    line2: string;
    line3: string;
    status: string;
  };
}

export interface WalkthroughUiStrings {
  sectionBadge: string;
  sectionTitle: string;
  sectionSubtitle: string;
  fullRoadmap: string;
  stepSimulator: string;
  step: string;
  stepOf: (current: number, total: number) => string;
  allSteps: string;
  hideList: string;
  allStepsTitle: string;
  prev: string;
  nextStep: (num?: string) => string;
  bookSlot: string;
  registerNow: string;
  transparentBenefit: string;
  dbtBenefit: string;
  liveSimulation: string;
  stepDetail1: string;
  stepDetail2: string;
  statusLabel: string;
  liveOutput: string;
  verified: string;
  ready: string;
  bannerTitle: string;
  bannerSubtitle: string;
}

const UI_STRINGS: Record<SupportedLanguage, WalkthroughUiStrings> = {
  en: {
    sectionBadge: 'Kisan Procurement Guide • 6 Simple Steps',
    sectionTitle: 'How To Use SmartProcure',
    sectionSubtitle: 'A step-by-step visual roadmap showing how farmers schedule grain appointments, bypass mandi gridlocks, and receive guaranteed MSP payments.',
    fullRoadmap: 'Full 6-Step Roadmap',
    stepSimulator: 'Interactive Step Simulator',
    step: 'Step',
    stepOf: (cur, tot) => `Step ${cur} of ${tot}`,
    allSteps: 'All Steps',
    hideList: 'Hide List',
    allStepsTitle: 'Complete Process Overview (6 Steps)',
    prev: 'Prev',
    nextStep: (num) => (num ? `Next Step (${num})` : 'Next Step'),
    bookSlot: 'Book Your Slot Now',
    registerNow: 'Register Now',
    transparentBenefit: 'Transparent & Middleman-Free',
    dbtBenefit: 'Direct Benefit Transfer (DBT)',
    liveSimulation: 'LIVE SIMULATION',
    stepDetail1: 'Step Detail 01',
    stepDetail2: 'Step Detail 02',
    statusLabel: 'Status:',
    liveOutput: 'Live Output',
    verified: 'Verified',
    ready: 'Ready',
    bannerTitle: 'Ready to experience seamless mandi procurement?',
    bannerSubtitle: 'Book your reserved tractor dock window today. Zero wait time, guaranteed MSP payout.',
  },
  hi: {
    sectionBadge: 'किसान खरीद मार्गदर्शिका • 6 आसान चरण',
    sectionTitle: 'स्मार्टप्रोक्योर का उपयोग कैसे करें',
    sectionSubtitle: 'चरण-दर-चरण दृश्य मार्गदर्शिका जो दर्शाती है कि किसान कैसे अनाज अपॉइंटमेंट शेड्यूल करते हैं, मंडी की भीड़ से बचते हैं और गारंटीकृत एमएसपी भुगतान प्राप्त करते हैं।',
    fullRoadmap: 'पूरा 6-चरणीय रोडमैप',
    stepSimulator: 'इंटरएक्टिव स्टेप सिम्युलेटर',
    step: 'चरण',
    stepOf: (cur, tot) => `चरण ${cur} / ${tot}`,
    allSteps: 'सभी चरण',
    hideList: 'सूची छिपाएं',
    allStepsTitle: 'पूर्ण खरीद प्रक्रिया अवलोकन (6 चरण)',
    prev: 'पिछला',
    nextStep: (num) => (num ? `अगला चरण (${num})` : 'अगला चरण'),
    bookSlot: 'अभी अपना स्लॉट बुक करें',
    registerNow: 'अभी पंजीकरण करें',
    transparentBenefit: 'पारदर्शी एवं बिचौलियों से मुक्त',
    dbtBenefit: 'प्रत्यक्ष लाभ अंतरण (DBT)',
    liveSimulation: 'लाइव सिमुलेशन',
    stepDetail1: 'चरण विवरण 01',
    stepDetail2: 'चरण विवरण 02',
    statusLabel: 'स्थिति:',
    liveOutput: 'लाइव परिणाम',
    verified: 'सत्यापित',
    ready: 'तैयार',
    bannerTitle: 'क्या आप निर्बाध मंडी खरीद का अनुभव लेने के लिए तैयार हैं?',
    bannerSubtitle: 'आज ही अपनी आरक्षित ट्रैक्टर डॉक विंडो बुक करें। शून्य प्रतीक्षा समय, गारंटीकृत एमएसपी भुगतान।',
  },
  pa: {
    sectionBadge: 'ਕਿਸਾਨ ਖਰੀਦ ਗਾਈਡ • 6 ਆਸਾਨ ਕਦਮ',
    sectionTitle: 'ਸਮਾਰਟਪ੍ਰੋਕਿਓਰ ਦੀ ਵਰਤੋਂ ਕਿਵੇਂ ਕਰੀਏ',
    sectionSubtitle: 'ਕਦਮ-ਦਰ-ਕਦਮ ਰੋਡਮੈਪ ਜੋ ਦਿਖਾਉਂਦਾ ਹੈ ਕਿ ਕਿਸਾਨ ਅਨਾਜ ਅਪਾਇੰਟਮੈਂਟਾਂ ਕਿਵੇਂ ਤਹਿ ਕਰਦੇ ਹਨ, ਮੰਡੀ ਦੀ ਭੀੜ ਤੋਂ ਬਚਦੇ ਹਨ ਅਤੇ ਗਾਰੰਟੀਸ਼ੁਦਾ ਐਮਐਸਪੀ ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਕਰਦੇ ਹਨ।',
    fullRoadmap: 'ਪੂਰਾ 6-ਕਦਮੀ ਰੋਡਮੈਪ',
    stepSimulator: 'ਇੰਟਰਐਕਟਿਵ ਸਟੈਪ ਸਿਮੂਲੇਟਰ',
    step: 'ਕਦਮ',
    stepOf: (cur, tot) => `ਕਦਮ ${cur} / ${tot}`,
    allSteps: 'ਸਾਰੇ ਕਦਮ',
    hideList: 'ਸੂਚੀ ਲੁਕਾਓ',
    allStepsTitle: 'ਪੂਰੀ ਪ੍ਰਕਿਰਿਆ ਸੰਖੇਪ (6 ਕਦਮ)',
    prev: 'ਪਿਛਲਾ',
    nextStep: (num) => (num ? `ਅਗਲਾ ਕਦਮ (${num})` : 'ਅਗਲਾ ਕਦਮ'),
    bookSlot: 'ਹੁਣੇ ਆਪਣਾ ਸਲਾਟ ਬੁੱਕ ਕਰੋ',
    registerNow: 'ਹੁਣੇ ਰਜਿਸਟਰ ਕਰੋ',
    transparentBenefit: 'ਪਾਰਦਰਸ਼ੀ ਅਤੇ ਵਿਚੋਲਿਆਂ ਤੋਂ ਮੁਕਤ',
    dbtBenefit: 'ਸਿੱਧਾ ਲਾਭ ਟ੍ਰਾਂਸਫਰ (DBT)',
    liveSimulation: 'ਲਾਈਵ ਸਿਮੂਲੇਸ਼ਨ',
    stepDetail1: 'ਕਦਮ ਵੇਰਵਾ 01',
    stepDetail2: 'ਕਦਮ ਵੇਰਵਾ 02',
    statusLabel: 'ਸਥਿਤੀ:',
    liveOutput: 'ਲਾਈਵ ਨਤੀਜਾ',
    verified: 'ਪ੍ਰਮਾਣਿਤ',
    ready: 'ਤਿਆਰ',
    bannerTitle: 'ਕੀ ਤੁਸੀਂ ਸੁਚਾਰੂ ਮੰਡੀ ਖਰੀਦ ਦਾ ਅਨੁਭਵ ਕਰਨ ਲਈ ਤਿਆਰ ਹੋ?',
    bannerSubtitle: 'ਅੱਜ ਹੀ ਆਪਣੀ ਟਰੈਕਟਰ ਡੌਕ ਵਿੰਡੋ ਬੁੱਕ ਕਰੋ। ਜ਼ੀਰੋ ਉਡੀਕ ਸਮਾਂ, ਗਾਰੰਟੀਸ਼ੁਦਾ ਐਮਐਸਪੀ ਭੁਗਤਾਨ।',
  },
  bn: {
    sectionBadge: 'কৃষক ক্রয় নির্দেশিকা • ৬টি সহজ পদক্ষেপ',
    sectionTitle: 'স্মার্টপ্রোকিউর কীভাবে ব্যবহার করবেন',
    sectionSubtitle: 'ধাপে ধাপে নির্দেশিকা যা দেখায় কীভাবে কৃষকরা শস্য সরবরাহের সময় নির্ধারণ করেন, মান্ডির যানজট এড়ান এবং নিশ্চিত এমএসপি মূল্য পান।',
    fullRoadmap: 'সম্পূর্ণ ৬-ধাপের রোডম্যাপ',
    stepSimulator: 'ইন্টারেক্টিভ স্টেপ সিমুলেটর',
    step: 'পদক্ষেপ',
    stepOf: (cur, tot) => `পদক্ষেপ ${cur} / ${tot}`,
    allSteps: 'সকল পদক্ষেপ',
    hideList: 'তালিকা লুকান',
    allStepsTitle: 'সম্পূর্ণ ক্রয় প্রক্রিয়া বিবরণ (৬টি ধাপ)',
    prev: 'পূর্ববর্তী',
    nextStep: (num) => (num ? `পরবর্তী পদক্ষেপ (${num})` : 'পরবর্তী পদক্ষেপ'),
    bookSlot: 'এখনই আপনার স্লট বুক করুন',
    registerNow: 'এখনই নিবন্ধন করুন',
    transparentBenefit: 'স্বচ্ছ এবং মধ্যস্বত্বভোগী-মুক্ত',
    dbtBenefit: 'সরাসরি সুবিধা হস্তান্তর (DBT)',
    liveSimulation: 'লাইভ সিমুলেশন',
    stepDetail1: 'পদক্ষেপ বিবরণ ০১',
    stepDetail2: 'পদক্ষেপ বিবরণ ০২',
    statusLabel: 'অবস্থা:',
    liveOutput: 'লাইভ আউটপুট',
    verified: 'যাচাইকৃত',
    ready: 'প্রস্তুত',
    bannerTitle: 'আপনি কি ঝামেলামুক্ত মান্ডি ক্রয়ের অভিজ্ঞতা নিতে প্রস্তুত?',
    bannerSubtitle: 'আজই আপনার ট্রাক্টর ডক উইন্ডো বুক করুন। শূন্য অপেক্ষার সময়, নিশ্চিত এমএসপি মূল্য।',
  }
};

export const getWalkthroughUi = (lang: SupportedLanguage): WalkthroughUiStrings => {
  return UI_STRINGS[lang] || UI_STRINGS.en;
};

export const getWalkthroughSteps = (lang: SupportedLanguage): WalkthroughStep[] => {
  switch (lang) {
    case 'hi':
      return [
        {
          stepNumber: '01',
          title: 'स्टेप 1: मोबाइल नंबर व बैंक खाता जोड़ें',
          shortTitle: 'पंजीकरण',
          subtitle: 'मोबाइल व बैंक खाता लिंक',
          desc: 'अपना 10 अंकों का मोबाइल नंबर और नाम दर्ज करके खाता बनाएं। बैंक खाता नंबर और IFSC कोड एक बार जोड़ें ताकि फसल का पूरा पैसा बिना किसी बिचौलिए के सीधे आपके खाते में आए।',
          icon: UserCheck,
          badge: 'स्टेप 1: पंजीकरण',
          accentColor: 'from-red-600 to-rose-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-500 text-red-600 dark:text-red-400',
          cropTag: 'किसान मोबाइल व बैंक लिंक',
          image: '/walkthrough/step1_registration.jpg',
          mockVisual: {
            screenTitle: 'नया किसान पंजीकरण डैशबोर्ड',
            line1: 'किसान: बलविंदर सिंह • मोबाइल: 98765-43210',
            line2: 'बैंक खाता: SBI •••• 9814 (सीधे DBT हेतु लिंक)',
            line3: 'पंजीकरण प्रकार: प्रत्यक्ष किसान पोर्टल',
            status: 'खाता सत्यापित व बुकिंग हेतु तैयार'
          }
        },
        {
          stepNumber: '02',
          title: 'स्टेप 2: फसल और वजन चुनें (एमएसपी गारंटी)',
          shortTitle: 'फसल और वजन',
          subtitle: 'फसल व वजन (एमएसपी गारंटी)',
          desc: 'अपनी फसल (जैसे गेहूं, धान, सरसों) चुनें और बताएं कि कितने क्विंटल बेचना चाहते हैं। वेबसाइट पर सरकारी एमएसपी भाव (₹2,425/क्विंटल) और कुल मिलने वाली रकम तुरंत देखें।',
          icon: Wheat,
          badge: 'स्टेप 2: फसल और एमएसपी',
          accentColor: 'from-orange-500 to-amber-500',
          badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/40',
          tagColor: 'border-orange-500 text-orange-600 dark:text-orange-400',
          cropTag: 'गेहूं • एमएसपी ₹2,425/क्विंटल',
          image: '/walkthrough/step2_crop_selection.jpg',
          mockVisual: {
            screenTitle: 'फसल एवं मात्रा चयन डैशबोर्ड',
            line1: 'फसल: गेहूं (ग्रेड ए रबी 2026)',
            line2: 'सरकारी एमएसपी: ₹2,425 / क्विंटल (सरकारी दर)',
            line3: 'मात्रा: 60 क्विंटल (6,000 किग्रा)',
            status: 'एमएसपी भाव सुरक्षित: ₹1,45,500'
          }
        },
        {
          stepNumber: '03',
          title: 'स्टेप 3: नजदीकी मंडी और तारीख चुनें',
          shortTitle: 'मंडी और तारीख',
          subtitle: 'निकटतम मंडी एवं समय स्लॉट',
          desc: 'अपनी नजदीकी सरकारी मंडी और ट्रैक्टर लाने की तारीख व 1 घंटे का समय चुनें। आपका गेट प्रवेश पक्का रहता है, हाईवे पर ट्रैक्टर की लंबी कतार में नहीं लगना पड़ेगा।',
          icon: Building2,
          badge: 'स्टेप 3: मंडी स्लॉट',
          accentColor: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40',
          tagColor: 'border-amber-500 text-amber-700 dark:text-amber-300',
          cropTag: 'खन्ना मुख्य अनाज मंडी',
          image: '/walkthrough/step3_mandi_slot.jpg',
          mockVisual: {
            screenTitle: 'मंडी एवं समय स्लॉट डैशबोर्ड',
            line1: 'केंद्र: खन्ना मुख्य अनाज मंडी (गेट #2)',
            line2: 'आरक्षित तिथि: 22 मार्च 2026 (10:30 - 11:30 AM)',
            line3: 'डॉक स्थिति: फास्ट-ट्रैक अनलोडिंग बे आवंटित',
            status: 'हाईवे पर शून्य कतार की गारंटी'
          }
        },
        {
          stepNumber: '04',
          title: 'स्टेप 4: टोकन नंबर और QR गेट पास पाएं',
          shortTitle: 'QR गेट पास',
          subtitle: 'टोकन नंबर और QR गेट पास',
          desc: 'बुकिंग होते ही टोकन नंबर और QR कोड वाला डिजिटल गेट पास स्क्रीन पर आ जाएगा और आपके मोबाइल पर एसएमएस से पहुंच जाएगा। इसे गेट पर दिखाएं।',
          icon: QrCode,
          badge: 'स्टेप 4: QR गेट पास',
          accentColor: 'from-yellow-500 to-orange-500',
          badgeBg: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-400/40',
          tagColor: 'border-yellow-500 text-yellow-700 dark:text-yellow-300',
          cropTag: 'टोकन #SP-7892 • QR पास',
          image: '/walkthrough/step4_qr_token.jpg',
          mockVisual: {
            screenTitle: 'डिजिटल मंडी गेट पास डैशबोर्ड',
            line1: 'टोकन नंबर: #SP-7892 (एन्क्रिप्टेड QR पास)',
            line2: 'वाहन: PB-10-CZ-4412 (ट्रैक्टर + ट्रॉली)',
            line3: 'पास वितरण: फोन में सुरक्षित एवं एसएमएस प्रेषित',
            status: 'मंडी गेट पर स्कैन हेतु तैयार'
          }
        },
        {
          stepNumber: '05',
          title: 'स्टेप 5: 5 सेकंड में गेट प्रवेश और सही तौल',
          shortTitle: 'गेट व तौल',
          subtitle: '5 सेकंड में प्रवेश और स्वचालित वेईब्रिज',
          desc: 'तय समय पर मंडी पहुंचें। गेट पर आपका QR कोड 5 सेकंड में स्कैन होगा। फिर कंप्यूटर कांटे (इलेक्ट्रॉनिक वे-ब्रिज) पर बिना किसी धांधली के पारदर्शी तौल होगी।',
          icon: Truck,
          badge: 'स्टेप 5: मंडी वजन जांच',
          accentColor: 'from-red-600 to-orange-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-600 text-red-600 dark:text-red-400',
          cropTag: '60.00 क्विंटल शुद्ध वजन',
          image: '/walkthrough/step5_weighbridge.jpg',
          mockVisual: {
            screenTitle: 'एक्सप्रेस गेट एवं वेईब्रिज डैशबोर्ड',
            line1: 'गेट कतार: 0 मिनट प्रतीक्षा (फास्ट ट्रैक एक्सप्रेस)',
            line2: 'सकल वजन: 8,420 किग्रा • खाली वजन: 2,420 किग्रा',
            line3: 'डिजिटल कांटा: स्वचालित पारदर्शी सेंसर',
            status: 'शुद्ध फसल: 6,000 किग्रा (60.00 क्विंटल सत्यापित)'
          }
        },
        {
          stepNumber: '06',
          title: 'स्टेप 6: सरकारी जे-फॉर्म रसीद व खाते में पैसे',
          shortTitle: 'जे-फॉर्म व भुगतान',
          subtitle: 'सरकारी जे-फॉर्म रसीद एवं सीधा बैंक ट्रांसफर',
          desc: 'तौल पूरी होते ही सरकारी जे-फॉर्म रसीद आपके फोन पर आ जाएगी। आपकी फसल का पूरा एमएसपी पैसा 24 से 48 घंटे के अंदर सीधे आपके बैंक खाते में जमा हो जाएगा।',
          icon: CreditCard,
          badge: 'स्टेप 6: सीधा बैंक भुगतान',
          accentColor: 'from-emerald-600 to-amber-500',
          badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40',
          tagColor: 'border-emerald-600 text-emerald-600 dark:text-emerald-400',
          cropTag: '₹1,45,500 डीबीटी क्रेडिट',
          image: '/walkthrough/step6_jform_payout.jpg',
          mockVisual: {
            screenTitle: 'डिजिटल जे-फॉर्म एवं बैंक भुगतान डैशबोर्ड',
            line1: 'खरीद पर्ची: J-FORM-2026-9901 (सत्यापित)',
            line2: 'कुल एमएसपी राशि: ₹1,45,500 (100% भुगतान)',
            line3: 'बैंक निपटान: सरकारी डीबीटी द्वारा प्रेषित',
            status: 'सीधे किसान के बैंक खाते में जमा'
          }
        }
      ];

    case 'pa':
      return [
        {
          stepNumber: '01',
          title: 'ਕਦਮ 1: ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ ਬੈਂਕ ਖਾਤਾ ਜੋੜੋ',
          shortTitle: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
          subtitle: 'ਮੋਬਾਈਲ ਅਤੇ ਬੈਂਕ ਖਾਤਾ ਲਿੰਕ',
          desc: 'ਆਪਣਾ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ ਨਾਮ ਦਰਜ ਕਰਕੇ ਖਾਤਾ ਬਣਾਓ। ਬੈਂਕ ਖਾਤਾ ਨੰਬਰ ਅਤੇ IFSC ਕੋਡ ਇੱਕ ਵਾਰ ਜੋੜੋ ਤਾਂ ਜੋ ਫਸਲ ਦਾ ਪੂਰਾ ਪੈਸਾ ਬਿਨਾਂ ਕਿਸੇ ਵਿਚੋਲੇ ਦੇ ਸਿੱਧਾ ਤੁਹਾਡੇ ਖਾਤੇ ਵਿੱਚ ਆਵੇ।',
          icon: UserCheck,
          badge: 'ਕਦਮ 1: ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
          accentColor: 'from-red-600 to-rose-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-500 text-red-600 dark:text-red-400',
          cropTag: 'ਕਿਸਾਨ ਮੋਬਾਈਲ ਅਤੇ ਬੈਂਕ ਲਿੰਕ',
          image: '/walkthrough/step1_registration.jpg',
          mockVisual: {
            screenTitle: 'ਨਵਾਂ ਕਿਸਾਨ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਡੈਸ਼ਬੋਰਡ',
            line1: 'ਕਿਸਾਨ: ਬਲਵਿੰਦਰ ਸਿੰਘ • ਮੋਬਾਈਲ: 98765-43210',
            line2: 'ਬੈਂਕ ਖਾਤਾ: SBI •••• 9814 (ਸਿੱਧੇ DBT ਲਈ ਲਿੰਕ)',
            line3: 'ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਕਿਸਮ: ਸਿੱਧਾ ਕਿਸਾਨ ਪੋਰਟਲ',
            status: 'ਖਾਤਾ ਪ੍ਰਮਾਣਿਤ ਅਤੇ ਬੁਕਿੰਗ ਲਈ ਤਿਆਰ'
          }
        },
        {
          stepNumber: '02',
          title: 'ਕਦਮ 2: ਆਪਣੀ ਫਸਲ ਅਤੇ ਮਾਤਰਾ ਚੁਣੋ',
          shortTitle: 'ਫਸਲ ਅਤੇ ਮਾਤਰਾ',
          subtitle: 'ਫਸਲ ਅਤੇ ਮਾਤਰਾ (ਐਮਐਸਪੀ ਗਾਰੰਟੀ)',
          desc: 'ਆਪਣੀ ਫਸਲ (ਜਿਵੇਂ ਕਣਕ, ਝੋਨਾ, ਸਰ੍ਹੋਂ) ਚੁਣੋ ਅਤੇ ਦੱਸੋ ਕਿ ਕਿੰਨੇ ਕੁਇੰਟਲ ਵੇਚਣਾ ਚਾਹੁੰਦੇ ਹੋ। ਵੈੱਬਸਾਈਟ \'ਤੇ ਸਰਕਾਰੀ ਐਮਐਸਪੀ ਭਾਅ (₹2,425/ਕੁਇੰਟਲ) ਅਤੇ ਕੁੱਲ ਮਿਲਣ ਵਾਲੀ ਰਕਮ ਤੁਰੰਤ ਦੇਖੋ।',
          icon: Wheat,
          badge: 'ਕਦਮ 2: ਫਸਲ ਅਤੇ ਐਮਐਸਪੀ',
          accentColor: 'from-orange-500 to-amber-500',
          badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/40',
          tagColor: 'border-orange-500 text-orange-600 dark:text-orange-400',
          cropTag: 'ਕਣਕ • ਐਮਐਸਪੀ ₹2,425/ਕੁਇੰਟਲ',
          image: '/walkthrough/step2_crop_selection.jpg',
          mockVisual: {
            screenTitle: 'ਫਸਲ ਅਤੇ ਮਾਤਰਾ ਚੋਣ ਡੈਸ਼ਬੋਰਡ',
            line1: 'ਵਸਤੂ: ਕਣਕ (ਗ੍ਰੇਡ ਏ ਹਾੜੀ 2026)',
            line2: 'ਸਰਕਾਰੀ ਐਮਐਸਪੀ: ₹2,425 / ਕੁਇੰਟਲ',
            line3: 'ਮਾਤਰਾ: 60 ਕੁਇੰਟਲ (6,000 ਕਿਲੋਗ੍ਰਾਮ)',
            status: 'ਐਮਐਸਪੀ ਦਰ ਲੌਕ: ₹1,45,500'
          }
        },
        {
          stepNumber: '03',
          title: 'ਕਦਮ 3: ਨਜ਼ਦੀਕੀ ਮੰਡੀ ਅਤੇ ਮਿਤੀ ਚੁਣੋ',
          shortTitle: 'ਮੰਡੀ ਅਤੇ ਮਿਤੀ',
          subtitle: 'ਨੇੜਲੀ ਮੰਡੀ ਅਤੇ ਸਮਾਂ ਸਲਾਟ ਚੁਣੋ',
          desc: 'ਆਪਣੀ ਨਜ਼ਦੀਕੀ ਸਰਕਾਰੀ ਮੰਡੀ ਅਤੇ ਟਰੈਕਟਰ ਲਿਆਉਣ ਦੀ ਮਿਤੀ ਤੇ 1 ਘੰਟੇ ਦਾ ਸਮਾਂ ਚੁਣੋ। ਤੁਹਾਡਾ ਗੇਟ ਦਾਖਲਾ ਪੱਕਾ ਰਹਿੰਦਾ ਹੈ, ਹਾਈਵੇ \'ਤੇ ਟਰੈਕਟਰ ਦੀ ਲੰਬੀ ਲਾਈਨ ਵਿੱਚ ਨਹੀਂ ਲੱਗਣਾ ਪਵੇਗਾ।',
          icon: Building2,
          badge: 'ਕਦਮ 3: ਮੰਡੀ ਸਲਾਟ',
          accentColor: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40',
          tagColor: 'border-amber-500 text-amber-700 dark:text-amber-300',
          cropTag: 'ਖੰਨਾ ਮੁੱਖ ਅਨਾਜ ਮੰਡੀ',
          image: '/walkthrough/step3_mandi_slot.jpg',
          mockVisual: {
            screenTitle: 'ਮੰਡੀ ਅਤੇ ਸਮਾਂ ਸਲਾਟ ਡੈਸ਼ਬੋਰਡ',
            line1: 'ਕੇਂਦਰ: ਖੰਨਾ ਮੁੱਖ ਅਨਾਜ ਮੰਡੀ (ਗੇਟ #2)',
            line2: 'ਰਾਖਵੀਂ ਮਿਤੀ: 22 ਮਾਰਚ 2026 (10:30 - 11:30 AM)',
            line3: 'ਡੌਕ ਸਥਿਤੀ: ਫਾਸਟ-ਟਰੈਕ ਅਨਲੋਡਿੰਗ ਬੇ ਨਿਰਧਾਰਤ',
            status: 'ਹਾਈਵੇ \'ਤੇ ਜ਼ੀਰੋ ਉਡੀਕ ਗਾਰੰਟੀ'
          }
        },
        {
          stepNumber: '04',
          title: 'ਕਦਮ 4: ਡਿਜੀਟਲ ਟੋਕਨ ਅਤੇ QR ਗੇਟ ਪਾਸ ਪ੍ਰਾਪਤ ਕਰੋ',
          shortTitle: 'QR ਗੇਟ ਪਾਸ',
          subtitle: 'ਡਿਜੀਟਲ ਟੋਕਨ ਅਤੇ QR ਪਾਸ',
          desc: 'ਬੁਕਿੰਗ ਹੁੰਦੇ ਹੀ ਟੋਕਨ ਨੰਬਰ ਅਤੇ QR ਕੋਡ ਵਾਲਾ ਡਿਜੀਟਲ ਗੇਟ ਪਾਸ ਸਕ੍ਰੀਨ \'ਤੇ ਆ ਜਾਵੇਗਾ ਅਤੇ ਤੁਹਾਡੇ ਮੋਬਾਈਲ \'ਤੇ ਐਸਐਮਐਸ ਰਾਹੀਂ ਪਹੁੰਚ ਜਾਵੇਗਾ। ਇਸਨੂੰ ਗੇਟ \'ਤੇ ਦਿਖਾਓ।',
          icon: QrCode,
          badge: 'ਕਦਮ 4: QR ਗੇਟ ਪਾਸ',
          accentColor: 'from-yellow-500 to-orange-500',
          badgeBg: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-400/40',
          tagColor: 'border-yellow-500 text-yellow-700 dark:text-yellow-300',
          cropTag: 'ਟੋਕਨ #SP-7892 • QR ਪਾਸ',
          image: '/walkthrough/step4_qr_token.jpg',
          mockVisual: {
            screenTitle: 'ਡਿਜੀਟਲ ਮੰਡੀ ਗੇਟ ਪਾਸ ਡੈਸ਼ਬੋਰਡ',
            line1: 'ਟੋਕਨ ਨੰਬਰ: #SP-7892 (ਇਨਕ੍ਰਿਪਟਡ QR ਪਾਸ)',
            line2: 'ਵਾਹਨ: PB-10-CZ-4412 (ਟਰੈਕਟਰ + ਟਰਾਲੀ)',
            line3: 'ਪਾਸ ਡਿਲੀਵਰੀ: ਫੋਨ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਅਤੇ ਐਸਐਮਐਸ ਭੇਜਿਆ',
            status: 'ਮੰਡੀ ਗੇਟ \'ਤੇ ਸਕੈਨ ਲਈ ਤਿਆਰ'
          }
        },
        {
          stepNumber: '05',
          title: 'ਕਦਮ 5: 5 ਸਕਿੰਟਾਂ ਵਿੱਚ ਗੇਟ ਐਂਟਰੀ ਅਤੇ ਸਹੀ ਤੋਲ',
          shortTitle: 'ਗੇਟ ਅਤੇ ਤੋਲ',
          subtitle: 'ਤੇਜ਼ ਗੇਟ ਐਂਟਰੀ ਅਤੇ ਕੰਪਿਊਟਰਾਈਜ਼ਡ ਕੰਡਾ',
          desc: 'ਮਿਥੇ ਸਮੇਂ \'ਤੇ ਮੰਡੀ ਪਹੁੰਚੋ। ਗੇਟ \'ਤੇ ਤੁਹਾਡਾ QR ਕੋਡ 5 ਸਕਿੰਟਾਂ ਵਿੱਚ ਸਕੈਨ ਹੋਵੇਗਾ। ਫਿਰ ਕੰਪਿਊਟਰ ਕੰਡੇ (ਇਲੈਕਟ੍ਰਾਨਿਕ ਵੇਅ-ਬ੍ਰਿਜ) \'ਤੇ ਪਾਰਦਰਸ਼ੀ ਤੋਲ ਹੋਵੇਗੀ।',
          icon: Truck,
          badge: 'ਕਦਮ 5: ਮੰਡੀ ਤੋਲ',
          accentColor: 'from-red-600 to-orange-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-600 text-red-600 dark:text-red-400',
          cropTag: '60.00 ਕੁਇੰਟਲ ਸ਼ੁੱਧ ਵਜ਼ਨ',
          image: '/walkthrough/step5_weighbridge.jpg',
          mockVisual: {
            screenTitle: 'ਐਕਸਪ੍ਰੈਸ ਗੇਟ ਅਤੇ ਵੇਅਬ੍ਰਿਜ ਡੈਸ਼ਬੋਰਡ',
            line1: 'ਗੇਟ ਲਾਈਨ: 0 ਮਿੰਟ ਉਡੀਕ (ਫਾਸਟ ਟਰੈਕ ਐਕਸਪ੍ਰੈਸ)',
            line2: 'ਕੁੱਲ ਵਜ਼ਨ: 8,420 ਕਿਲੋਗ੍ਰਾਮ • ਖਾਲੀ: 2,420 ਕਿਲੋਗ੍ਰਾਮ',
            line3: 'ਡਿਜੀਟਲ ਕੰਡਾ: ਆਟੋਮੇਟਿਡ ਪਾਰਦਰਸ਼ੀ ਸੈਂਸਰ',
            status: 'ਸ਼ੁੱਧ ਫਸਲ: 6,000 ਕਿਲੋਗ੍ਰਾਮ (60.00 ਕੁਇੰਟਲ ਪ੍ਰਮਾਣਿਤ)'
          }
        },
        {
          stepNumber: '06',
          title: 'ਕਦਮ 6: ਸਰਕਾਰੀ ਜੇ-ਫਾਰਮ ਰਸੀਦ ਅਤੇ ਖਾਤੇ ਵਿੱਚ ਪੈਸੇ',
          shortTitle: 'ਜੇ-ਫਾਰਮ ਅਤੇ ਭੁਗਤਾਨ',
          subtitle: 'ਸਰਕਾਰੀ ਜੇ-ਫਾਰਮ ਅਤੇ ਸਿੱਧਾ ਡੀਬੀਟੀ ਟ੍ਰਾਂਸਫਰ',
          desc: 'ਤੋਲ ਪੂਰੀ ਹੁੰਦੇ ਹੀ ਸਰਕਾਰੀ ਜੇ-ਫਾਰਮ ਰਸੀਦ ਤੁਹਾਡੇ ਫੋਨ \'ਤੇ ਆ ਜਾਵੇਗੀ। ਤੁਹਾਡੀ ਫਸਲ ਦਾ ਪੂਰਾ ਐਮਐਸਪੀ ਪੈਸਾ 24 ਤੋਂ 48 ਘੰਟਿਆਂ ਵਿੱਚ ਸਿੱਧਾ ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾਂ ਹੋ ਜਾਵੇਗਾ।',
          icon: CreditCard,
          badge: 'ਕਦਮ 6: ਸਿੱਧਾ ਬੈਂਕ ਭੁਗਤਾਨ',
          accentColor: 'from-emerald-600 to-amber-500',
          badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40',
          tagColor: 'border-emerald-600 text-emerald-600 dark:text-emerald-400',
          cropTag: '₹1,45,500 ਡੀਬੀਟੀ ਕ੍ਰੈਡਿਟ',
          image: '/walkthrough/step6_jform_payout.jpg',
          mockVisual: {
            screenTitle: 'ਡਿਜੀਟਲ ਜੇ-ਫਾਰਮ ਅਤੇ ਬੈਂਕ ਭੁਗਤਾਨ ਡੈਸ਼ਬੋਰਡ',
            line1: 'ਖਰੀਦ ਪਰਚੀ: J-FORM-2026-9901 (ਪ੍ਰਮਾਣਿਤ)',
            line2: 'ਕੁੱਲ ਐਮਐਸਪੀ ਰਕਮ: ₹1,45,500 (100% ਭੁਗਤਾਨ)',
            line3: 'ਬੈਂਕ ਨਿਪਟਾਰਾ: ਸਰਕਾਰੀ ਡੀਬੀਟੀ ਰਾਹੀਂ ਭੇਜਿਆ ਗਿਆ',
            status: 'ਸਿੱਧਾ ਕਿਸਾਨ ਦੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਜਮ੍ਹਾ'
          }
        }
      ];

    case 'bn':
      return [
        {
          stepNumber: '01',
          title: 'পদক্ষেপ ১: মোবাইল নম্বর ও ব্যাঙ্ক অ্যাকাউন্ট যুক্ত করুন',
          shortTitle: 'নিবন্ধন',
          subtitle: 'মোবাইল ও ব্যাঙ্ক অ্যাকাউন্ট লিংক',
          desc: 'আপনার ১০ সংখ্যার মোবাইল নম্বর ও নাম প্রবেশ করিয়ে অ্যাকাউন্ট তৈরি করুন। ব্যাঙ্ক অ্যাকাউন্ট নম্বর এবং IFSC কোড একবার যুক্ত করুন যাতে ফসলের সম্পূর্ণ অর্থ কোনো মধ্যস্বত্বভোগী ছাড়াই সরাসরি আপনার অ্যাকাউন্টে জমা হয়।',
          icon: UserCheck,
          badge: 'পদক্ষেপ ১: নিবন্ধন',
          accentColor: 'from-red-600 to-rose-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-500 text-red-600 dark:text-red-400',
          cropTag: 'কৃষক মোবাইল ও ব্যাঙ্ক লিংক',
          image: '/walkthrough/step1_registration.jpg',
          mockVisual: {
            screenTitle: 'নতুন কৃষক নিবন্ধন ড্যাশবোর্ড',
            line1: 'কৃষক: বলবিন্দর সিং • মোবাইল: ৯৮৭৬৫-৪৩২১০',
            line2: 'ব্যাঙ্ক অ্যাকাউন্ট: SBI •••• ৯৮১৪ (সরাসরি DBT এর জন্য যুক্ত)',
            line3: 'নিবন্ধনের ধরন: সরাসরি কৃষক পোর্টাল',
            status: 'অ্যাকাউন্ট যাচাইকৃত এবং বুকিংয়ের জন্য প্রস্তুত'
          }
        },
        {
          stepNumber: '02',
          title: 'পদক্ষেপ ২: আপনার ফসল এবং পরিমাণ নির্বাচন করুন',
          shortTitle: 'ফসল ও পরিমাণ',
          subtitle: 'ফসল ও পরিমাণ (এমএসপি নিশ্চিত)',
          desc: 'আপনার ফসল (যেমন গম, ধান, সরিষা) নির্বাচন করুন এবং কত কুইন্টাল বিক্রি করতে চান তা লিখুন। অফিসিয়াল সরকারি এমএসপি দর (₹২,৪২৫/কুইন্টাল) এবং নিশ্চিত মোট মূল্য তাৎক্ষণিকভাবে দেখুন।',
          icon: Wheat,
          badge: 'পদক্ষেপ ২: ফসল ও এমএসপি',
          accentColor: 'from-orange-500 to-amber-500',
          badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/40',
          tagColor: 'border-orange-500 text-orange-600 dark:text-orange-400',
          cropTag: 'গম • এমএসপি ₹২,৪২৫/কুইন্টাল',
          image: '/walkthrough/step2_crop_selection.jpg',
          mockVisual: {
            screenTitle: 'ফসল ও পরিমাণ নির্বাচন ড্যাশবোর্ড',
            line1: 'ফসল: গম (গ্রেড এ রবি ২০২৬)',
            line2: 'সরকারি এমএসপি: ₹২,৪২৫ / কুইন্টাল',
            line3: 'পরিমাণ: ৬০ কুইন্টাল (৬,০০০ কেজি)',
            status: 'এমএসপি হার নিশ্চিত: ₹১,৪৫,৫০০'
          }
        },
        {
          stepNumber: '03',
          title: 'পদক্ষেপ ৩: নিকটতম মান্ডি ও তারিখ নির্বাচন করুন',
          shortTitle: 'মান্ডি ও তারিখ',
          subtitle: 'নিকটতম মান্ডি ও সময় স্লট',
          desc: 'আপনার নিকটবর্তী সরকারি ক্রয় কেন্দ্র (মান্ডি), সুবিধাজনক তারিখ এবং ১ ঘণ্টার আগমন সময় বেছে নিন। গেট প্রবেশ নিশ্চিত থাকবে, মহাসড়কে দীর্ঘ লাইনে অপেক্ষা করতে হবে না।',
          icon: Building2,
          badge: 'পদক্ষেপ ৩: মান্ডি স্লট',
          accentColor: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40',
          tagColor: 'border-amber-500 text-amber-700 dark:text-amber-300',
          cropTag: 'খান্না প্রধান শস্য মান্ডি',
          image: '/walkthrough/step3_mandi_slot.jpg',
          mockVisual: {
            screenTitle: 'মান্ডি ও সময় স্লট ড্যাশবোর্ড',
            line1: 'কেন্দ্র: খান্না প্রধান শস্য মান্ডি (গেট #২)',
            line2: 'সংরক্ষিত তারিখ: ২২ মার্চ ২০২৬ (১০:৩০ - ১১:৩০ AM)',
            line3: 'ডক স্ট্যাটাস: ফাস্ট-ট্র্যাক আনলোডিং বে বরাদ্দ',
            status: 'মহাসড়কে শূন্য অপেক্ষার গ্যারান্টি'
          }
        },
        {
          stepNumber: '04',
          title: 'পদক্ষেপ ৪: ডিজিটাল টোকেন ও QR গেট পাস পান',
          shortTitle: 'QR গেট পাস',
          subtitle: 'ডিজিটাল টোকেন ও এনক্রিপ্ট করা QR পাস',
          desc: 'বুকিং সম্পন্ন হতেই টোকেন নম্বর এবং QR কোডযুক্ত ডিজিটাল গেট পাস স্ক্রিনে আসবে এবং আপনার মোবাইলে এসএমএসে পাঠানো হবে। গেটে এটি দেখান।',
          icon: QrCode,
          badge: 'পদক্ষেপ ৪: QR গেট পাস',
          accentColor: 'from-yellow-500 to-orange-500',
          badgeBg: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-400/40',
          tagColor: 'border-yellow-500 text-yellow-700 dark:text-yellow-300',
          cropTag: 'টোকেন #SP-7892 • QR পাস',
          image: '/walkthrough/step4_qr_token.jpg',
          mockVisual: {
            screenTitle: 'ডিজিটাল মান্ডি গেট পাস ড্যাশবোর্ড',
            line1: 'টোকেন নম্বর: #SP-7892 (এনক্রিপ্ট করা QR পাস)',
            line2: 'যানবাহন: PB-10-CZ-4412 (ট্রাক্টর + ট্রলি)',
            line3: 'পাস প্রদান: ফোনে সংরক্ষিত ও এসএমএস পাঠানো হয়েছে',
            status: 'মান্ডি গেটে স্ক্যানের জন্য প্রস্তুত'
          }
        },
        {
          stepNumber: '05',
          title: 'পদক্ষেপ ৫: দ্রুত গেট প্রবেশ এবং স্বয়ংক্রিয় ওজন পরিমাপ',
          shortTitle: 'গেট ও ওজন',
          subtitle: '৫ সেকেন্ডে গেট এন্ট্রি এবং সঠিক ওজন',
          desc: 'নির্ধারিত সময়ে মান্ডিতে পৌঁছান। গেটে আপনার QR কোড ৫ সেকেন্ডে স্ক্যান হবে। এরপর কম্পিউটারাইজড ইলেকট্রনিক স্কেলে স্বচ্ছ ও নিখুঁত ওজন সম্পন্ন হবে।',
          icon: Truck,
          badge: 'পদক্ষেপ ৫: মান্ডি ওজন পরীক্ষা',
          accentColor: 'from-red-600 to-orange-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-600 text-red-600 dark:text-red-400',
          cropTag: '৬০.০০ কুইন্টাল নেট ওজন',
          image: '/walkthrough/step5_weighbridge.jpg',
          mockVisual: {
            screenTitle: 'এক্সপ্রেস গেট ও ওয়েব্রিজ ড্যাশবোর্ড',
            line1: 'গেট কিউ: ০ মিনিট অপেক্ষা (ফাস্ট ট্র্যাক এক্সপ্রেস)',
            line2: 'মোট ওজন: ৮,৪২০ কেজি • খালি ওজন: ২,৪২০ কেজি',
            line3: 'ডিজিটাল স্কেল: স্বয়ংক্রিয় নির্ভরযোগ্য সেন্সর',
            status: 'নেট শস্য: ৬,০০০ কেজি (৬০.০০ কুইন্টাল যাচাইকৃত)'
          }
        },
        {
          stepNumber: '06',
          title: 'পদক্ষেপ ৬: ডিজিটাল জে-ফর্ম রসিদ ও অ্যাকাউন্টে টাকা',
          shortTitle: 'জে-ফর্ম ও পেমেন্ট',
          subtitle: 'সরকারি জে-ফর্ম রসিদ ও সরাসরি ব্যাঙ্ক ট্রান্সফার',
          desc: 'ওজন সম্পন্ন হতেই সরকারি জে-ফর্ম রসিদ আপনার ফোনে চলে আসবে। আপনার ফসলের সম্পূর্ণ এমএসপি মূল্য ২৪ থেকে ৪৮ ঘণ্টার মধ্যে সরাসরি আপনার লিঙ্কযুক্ত ব্যাঙ্ক অ্যাকাউন্টে জমা হবে।',
          icon: CreditCard,
          badge: 'পদক্ষেপ ৬: সরাসরি ব্যাঙ্ক পেমেন্ট',
          accentColor: 'from-emerald-600 to-amber-500',
          badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40',
          tagColor: 'border-emerald-600 text-emerald-600 dark:text-emerald-400',
          cropTag: '₹১,৪৫,৫০০ ডিবিটি ক্রেডিট',
          image: '/walkthrough/step6_jform_payout.jpg',
          mockVisual: {
            screenTitle: 'ডিজিটাল জে-ফর্ম ও ব্যাঙ্ক পেমেন্ট ড্যাশবোর্ড',
            line1: 'ক্রয় রসিদ: J-FORM-2026-9901 (যাচাইকৃত)',
            line2: 'মোট এমএসপি মূল্য: ₹১,৪৫,৫০০ (১০০% প্রদান)',
            line3: 'ব্যাঙ্ক নিষ্পত্তি: সরকারি ডিবিটি মারফত প্রেরিত',
            status: 'সরাসরি কৃষকের ব্যাঙ্ক অ্যাকাউন্টে জমা'
          }
        }
      ];

    case 'en':
    default:
      return [
        {
          stepNumber: '01',
          title: 'Step 1: Register Mobile & Link Bank Account',
          shortTitle: 'Registration',
          subtitle: 'Link Mobile & Bank Account',
          desc: 'Create your account by entering your 10-digit mobile number and name. Link your bank account number and IFSC code once so that full crop payments are deposited directly via DBT with zero middlemen.',
          icon: UserCheck,
          badge: 'Step 1: Registration',
          accentColor: 'from-red-600 to-rose-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-500 text-red-600 dark:text-red-400',
          cropTag: 'Farmer Mobile & Bank Link',
          image: '/walkthrough/step1_registration.jpg',
          mockVisual: {
            screenTitle: 'Register New Farmer Dashboard',
            line1: 'Farmer: Balwinder Singh • Mobile: 98765-43210',
            line2: 'Bank Account: SBI •••• 9814 (Linked for Direct DBT)',
            line3: 'Registration Type: Direct Farmer Portal',
            status: 'Account Verified & Ready to Book'
          }
        },
        {
          stepNumber: '02',
          title: 'Step 2: Select Your Crop & Quantity',
          shortTitle: 'Crop & Quantity',
          subtitle: 'Crop & Quantity (MSP Guaranteed)',
          desc: 'Select your crop (such as Wheat, Paddy, Mustard) and enter the estimated quintals you wish to sell. Instantly see the official government MSP rate (₹2,425/quintal) and your guaranteed total payout.',
          icon: Wheat,
          badge: 'Step 2: Crop & MSP',
          accentColor: 'from-orange-500 to-amber-500',
          badgeBg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/40',
          tagColor: 'border-orange-500 text-orange-600 dark:text-orange-400',
          cropTag: 'Wheat • MSP ₹2,425/Qtl',
          image: '/walkthrough/step2_crop_selection.jpg',
          mockVisual: {
            screenTitle: 'Select Crop & Quantity Dashboard',
            line1: 'Commodity: Wheat (Grade A Rabi 2026)',
            line2: 'Official MSP: ₹2,425 / Quintal (Government Rate)',
            line3: 'Quantity: 60 Quintals (6,000 kg)',
            status: 'MSP Rate Locked: ₹1,45,500'
          }
        },
        {
          stepNumber: '03',
          title: 'Step 3: Choose Mandi & Arrival Date',
          shortTitle: 'Mandi & Date',
          subtitle: 'Select Nearest Mandi & Time Slot',
          desc: 'Select your nearest government procurement mandi, preferred date, and a 1-hour arrival window. Your entry dock is reserved in advance, eliminating overnight highway queues.',
          icon: Building2,
          badge: 'Step 3: Mandi Slot',
          accentColor: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40',
          tagColor: 'border-amber-500 text-amber-700 dark:text-amber-300',
          cropTag: 'Khanna Main Grain Mandi',
          image: '/walkthrough/step3_mandi_slot.jpg',
          mockVisual: {
            screenTitle: 'Mandi & Time Slot Dashboard',
            line1: 'Centre: Khanna Main Grain Mandi (Gate #2)',
            line2: 'Reserved Date: 22 March 2026 (10:30 - 11:30 AM)',
            line3: 'Dock Status: Fast-Track Unloading Bay Assigned',
            status: 'Zero Highway Waiting Queue Guaranteed'
          }
        },
        {
          stepNumber: '04',
          title: 'Step 4: Get Digital Token & QR Gate Pass',
          shortTitle: 'QR Gate Pass',
          subtitle: 'Token Number & QR Gate Pass',
          desc: 'Upon booking, a digital token and encrypted QR gate pass are generated on your screen and dispatched via SMS. Present this pass at the mandi gate for fast verification.',
          icon: QrCode,
          badge: 'Step 4: QR Gate Pass',
          accentColor: 'from-yellow-500 to-orange-500',
          badgeBg: 'bg-yellow-500/15 text-yellow-800 dark:text-yellow-300 border-yellow-400/40',
          tagColor: 'border-yellow-500 text-yellow-700 dark:text-yellow-300',
          cropTag: 'Token #SP-7892 • QR Pass',
          image: '/walkthrough/step4_qr_token.jpg',
          mockVisual: {
            screenTitle: 'Digital Mandi Gate Pass Dashboard',
            line1: 'Token Number: #SP-7892 (Encrypted QR Pass)',
            line2: 'Vehicle: PB-10-CZ-4412 (Tractor + Trolley)',
            line3: 'Pass Delivery: Saved on Phone & Sent via SMS',
            status: 'Ready to Scan at Mandi Gate'
          }
        },
        {
          stepNumber: '05',
          title: 'Step 5: Fast Gate Entry & Computerized Weighing',
          shortTitle: 'Gate & Weighing',
          subtitle: '5-Second Entry & Automated Weighbridge',
          desc: 'Arrive at your scheduled time. Your QR code scans in 5 seconds at the express gate. Computerized electronic scales ensure accurate, tamper-proof weight verification.',
          icon: Truck,
          badge: 'Step 5: Mandi Weigh-in',
          accentColor: 'from-red-600 to-orange-600',
          badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/40',
          tagColor: 'border-red-600 text-red-600 dark:text-red-400',
          cropTag: '60.00 Quintals Net Weight',
          image: '/walkthrough/step5_weighbridge.jpg',
          mockVisual: {
            screenTitle: 'Express Gate & Weighbridge Dashboard',
            line1: 'Gate Queue: 0 Minutes Wait (Fast Track Express)',
            line2: 'Gross Weight: 8,420 kg • Tare: 2,420 kg',
            line3: 'Digital Scale: Automated Tamper-Proof Sensor',
            status: 'Net Crop: 6,000 kg (60.00 Quintals Verified)'
          }
        },
        {
          stepNumber: '06',
          title: 'Step 6: Digital J-Form & Direct Bank Payment',
          shortTitle: 'J-Form & Payment',
          subtitle: 'Official J-Form Receipt & Direct DBT',
          desc: 'Upon weighing completion, official government J-Form slips arrive directly on your phone. Full MSP payment is credited directly to your linked bank account within 24 to 48 hours.',
          icon: CreditCard,
          badge: 'Step 6: Direct Bank Payment',
          accentColor: 'from-emerald-600 to-amber-500',
          badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/40',
          tagColor: 'border-emerald-600 text-emerald-600 dark:text-emerald-400',
          cropTag: '₹1,45,500 DBT Credit',
          image: '/walkthrough/step6_jform_payout.jpg',
          mockVisual: {
            screenTitle: 'Digital J-Form & Bank Payout Dashboard',
            line1: 'Procurement Slip: J-FORM-2026-9901 (Verified)',
            line2: 'Total MSP Amount: ₹1,45,500 (100% Payout)',
            line3: 'Bank Settlement: Dispatched via Government DBT',
            status: 'Credited Directly to Farmer Bank Account'
          }
        }
      ];
  }
};
