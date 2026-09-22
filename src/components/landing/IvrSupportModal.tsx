import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  X,
  PhoneCall,
  CheckCircle2,
  CalendarPlus,
  Search,
  IndianRupee,
  ShieldCheck,
  UserCheck,
  Headphones,
  ArrowRight,
  Smartphone,
  PhoneForwarded,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Languages,
  Mic,
  FileText,
  HelpCircle,
  Clock,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface IvrSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

// Exactly 4 supported languages
export type IvrLanguage = 'hi' | 'en' | 'bn' | 'pa';

interface IvrLangConfig {
  code: IvrLanguage;
  name: string;
  nativeName: string;
  keypadPrompt: string;
  badge: string;
  title: string;
  tagline: string;
  registrationNotice: {
    badge: string;
    text: string;
    cta: string;
  };
  steps: {
    num: string;
    title: string;
    desc: string;
  }[];
  menuOptions: {
    key: string;
    title: string;
    action: string;
    spokenPrompt: string;
  }[];
  faqs: {
    q: string;
    a: string;
  }[];
}

const IVR_LANGUAGES: Record<IvrLanguage, IvrLangConfig> = {
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    keypadPrompt: 'हिन्दी के लिए 1 दबाएं',
    badge: 'टोल-फ्री • 24x7 • बिना इंटरनेट',
    title: 'किसान आईवीआर हेल्पलाइन 1800-180-1551',
    tagline: 'बिना स्मार्टफोन और बिना इंटरनेट — साधारण कीपैड फोन से मंडी स्लॉट बुक करें।',
    registrationNotice: {
      badge: 'अनिवार्य पहला चरण',
      text: 'आईवीआर सेवा का उपयोग करने से पहले पोर्टल पर अपना 10 अंकों का मोबाइल नंबर रजिस्टर करना अनिवार्य है। इसके बाद ही आप 1800-180-1551 पर कॉल करके सभी सेवाओं का लाभ ले सकते हैं।',
      cta: 'पोर्टल पर मोबाइल रजिस्टर करें'
    },
    steps: [
      {
        num: '1',
        title: 'पहला चरण: मोबाइल रजिस्ट्रेशन',
        desc: 'पोर्टल या सीएससी केंद्र पर अपना 10-अंकों का मोबाइल नंबर एक बार रजिस्टर करें।'
      },
      {
        num: '2',
        title: '1800-180-1551 पर कॉल करें',
        desc: 'रजिस्टर्ड मोबाइल से किसी भी साधारण कीपैड या टचस्क्रीन फोन से मुफ्त कॉल लगाएं।'
      },
      {
        num: '3',
        title: 'कीपैड से विकल्प चुनें',
        desc: 'स्लॉट (1), लाइव कतार (2), एमएसपी (3), या बैंक भुगतान (4) चुनें।'
      },
      {
        num: '4',
        title: 'तुरंत एसएमएस पाएं',
        desc: 'टोकन नंबर और समय का एसएमएस पाएं, इसे मंडी गेट पर दिखाएं।'
      }
    ],
    menuOptions: [
      {
        key: '1',
        title: 'मंडी स्लॉट व टोकन बुकिंग',
        action: 'फसल कोड + वजन',
        spokenPrompt: 'नया टोकन बुक करने के लिए 1 दबाएं। गेहूं के लिए 1, धान के लिए 2।'
      },
      {
        key: '2',
        title: 'लाइव कतार स्थिति',
        action: 'टोकन नंबर स्थिति',
        spokenPrompt: 'लाइव कतार के लिए 2 दबाएं। आपकी गाड़ी का नंबर कतार में 4 पर है।'
      },
      {
        key: '3',
        title: 'आज के सरकारी MSP भाव',
        action: 'न्यूनतम समर्थन मूल्य',
        spokenPrompt: 'आज का गेहूं एमएसपी ₹2,425 और धान ₹2,300 प्रति क्विंटल है।'
      },
      {
        key: '4',
        title: 'बैंक भुगतान स्थिति',
        action: 'e-J फॉर्म व DBT स्टेटस',
        spokenPrompt: 'आपका जे-फॉर्म स्वीकृत हो चुका है। भुगतान खाते में भेज दिया गया है।'
      },
      {
        key: '9',
        title: 'कृषि अधिकारी सहायता',
        action: 'सीधी हेल्पलाइन बात',
        spokenPrompt: 'आपकी कॉल मंडी हेल्पडेस्क अधिकारी को जोड़ी जा रही है।'
      }
    ],
    faqs: [
      {
        q: 'क्या साधारण कीपैड फोन काम करेगा?',
        a: 'हां! बिना इंटरनेट वाले किसी भी बेसिक फोन (नोकिया, सैमसंग गुरु) से कॉल कर सकते हैं।'
      },
      {
        q: 'क्या 1800-180-1551 पर कॉल का कोई चार्ज है?',
        a: 'बिल्कुल नहीं। यह सभी नेटवर्क से 100% सरकारी टोल-फ्री नंबर है।'
      },
      {
        q: 'कॉल के बाद मंडी में क्या दिखाना होगा?',
        a: 'कॉल समाप्त होते ही जो एसएमएस आएगा, बस वही गेट पर दिखाएं।'
      }
    ]
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    keypadPrompt: 'Press 2 for English',
    badge: 'Toll-Free • 24x7 • No Internet',
    title: 'Farmer IVR Helpline 1800-180-1551',
    tagline: 'No smartphone or internet needed. Book mandi tokens using any basic keypad phone.',
    registrationNotice: {
      badge: 'Mandatory First Step',
      text: 'You must first register your 10-digit mobile number on the portal before accessing IVR services. Once registered, you can dial 1800-180-1551 to book slots and check status anytime.',
      cta: 'Register Mobile on Portal'
    },
    steps: [
      {
        num: '1',
        title: 'First Step: Mobile Registration',
        desc: 'Register your 10-digit mobile number once on portal or at nearest CSC.'
      },
      {
        num: '2',
        title: 'Call 1800-180-1551',
        desc: 'Dial toll-free from your registered mobile using any keypad phone.'
      },
      {
        num: '3',
        title: 'Select Menu Option',
        desc: 'Press 1 for Slot, 2 for Queue, 3 for MSP, 4 for Bank Payment.'
      },
      {
        num: '4',
        title: 'Get Instant SMS',
        desc: 'Receive official token SMS on your phone to show at the gate.'
      }
    ],
    menuOptions: [
      {
        key: '1',
        title: 'Slot & Token Booking',
        action: 'Crop Code + Weight',
        spokenPrompt: 'Press 1 to book a new token. Press 1 for Wheat, 2 for Paddy.'
      },
      {
        key: '2',
        title: 'Live Queue Status',
        action: 'Token Rank & Weighbridge',
        spokenPrompt: 'Press 2 for queue status. Your vehicle is currently rank 4.'
      },
      {
        key: '3',
        title: 'Today\'s Official MSP',
        action: 'Govt Minimum Support Price',
        spokenPrompt: 'Current MSP: Wheat ₹2,425/qtl, Paddy ₹2,300/qtl.'
      },
      {
        key: '4',
        title: 'Bank Payment (DBT)',
        action: 'e-J Form & Payment Transfer',
        spokenPrompt: 'Your e-J Form is approved. Payment is released to your account.'
      },
      {
        key: '9',
        title: 'Mandi Officer Support',
        action: 'Direct Helpdesk Connect',
        spokenPrompt: 'Connecting your call to a mandi procurement officer.'
      }
    ],
    faqs: [
      {
        q: 'Does it work on basic keypad phones?',
        a: 'Yes, works on any standard keypad phone without mobile data or apps.'
      },
      {
        q: 'Are there any call charges on 1800-180-1551?',
        a: 'Zero charges. It is 100% government toll-free from all mobile networks.'
      },
      {
        q: 'What do I present at the mandi gate?',
        a: 'Simply show the automated SMS token received immediately after the call.'
      }
    ]
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    keypadPrompt: 'ਪੰਜਾਬੀ ਲਈ 3 ਦਬਾਓ',
    badge: 'ਟੋਲ-ਫ੍ਰੀ • 24x7 • ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ',
    title: 'ਕਿਸਾਨ ਆਈਵੀਆਰ ਹੈਲਪਲਾਈਨ 1800-180-1551',
    tagline: 'ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਕਿਸੇ ਵੀ ਸਾਧਾਰਨ ਕੀਪੈਡ ਫ਼ੋਨ ਤੋਂ ਮੰਡੀ ਟੋਕਨ ਬੁੱਕ ਕਰੋ।',
    registrationNotice: {
      badge: 'ਜ਼ਰੂਰੀ ਪਹਿਲਾ ਕਦਮ',
      text: 'ਆਈਵੀਆਰ ਸੇਵਾ ਦੀ ਵਰਤੋਂ ਕਰਨ ਤੋਂ ਪਹਿਲਾਂ ਪੋਰਟਲ ਤੇ ਆਪਣਾ 10-ਅੰਕੀ ਮੋਬਾਈਲ ਨੰਬਰ ਰਜਿਸਟਰ ਕਰਨਾ ਲਾਜ਼ਮੀ ਹੈ। ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਤੋਂ ਬਾਅਦ ਹੀ ਤੁਸੀਂ 1800-180-1551 ਤੇ ਕਾਲ ਕਰ ਸਕਦੇ ਹੋ।',
      cta: 'ਪੋਰਟਲ ਤੇ ਮੋਬਾਈਲ ਰਜਿਸਟਰ ਕਰੋ'
    },
    steps: [
      {
        num: '1',
        title: 'ਪਹਿਲਾ ਕਦਮ: ਮੋਬਾਈਲ ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
        desc: 'ਪੋਰਟਲ ਜਾਂ ਸੇਵਾ ਕੇਂਦਰ ਤੇ ਆਪਣਾ 10-ਅੰਕੀ ਮੋਬਾਈਲ ਨੰਬਰ ਇੱਕ ਵਾਰ ਦਰਜ ਕਰੋ।'
      },
      {
        num: '2',
        title: '1800-180-1551 ਤੇ ਕਾਲ ਕਰੋ',
        desc: 'ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਤੋਂ ਕਿਸੇ ਵੀ ਕੀਪੈਡ ਜਾਂ ਟੱਚ ਫ਼ੋਨ ਤੋਂ ਮੁਫ਼ਤ ਕਾਲ ਲਗਾਓ।'
      },
      {
        num: '3',
        title: 'ਕੀਪੈਡ ਤੋਂ ਚੋਣ ਕਰੋ',
        desc: 'ਸਲਾਟ ਲਈ 1, ਕਤਾਰ ਲਈ 2, ਐੱਮ.ਐੱਸ.ਪੀ. ਲਈ 3 ਅਤੇ ਭੁਗਤਾਨ ਲਈ 4 ਦਬਾਓ।'
      },
      {
        num: '4',
        title: 'ਤੁਰੰਤ SMS ਪ੍ਰਾਪਤ ਕਰੋ',
        desc: 'ਟੋਕਨ ਨੰਬਰ ਦਾ ਸੁਨੇਹਾ ਪਾਓ ਅਤੇ ਮੰਡੀ ਗੇਟ ਤੇ ਦਿਖਾਓ।'
      }
    ],
    menuOptions: [
      {
        key: '1',
        title: 'ਮੰਡੀ ਸਲਾਟ ਤੇ ਟੋਕਨ ਬੁਕਿੰਗ',
        action: 'ਫ਼ਸਲ ਕੋਡ + ਵਜ਼ਨ',
        spokenPrompt: 'ਨਵਾਂ ਟੋਕਨ ਬੁੱਕ ਕਰਨ ਲਈ 1 ਦਬਾਓ। ਕਣਕ ਲਈ 1, ਝੋਨੇ ਲਈ 2।'
      },
      {
        key: '2',
        title: 'ਲਾਈਵ ਕਤਾਰ ਦੀ ਸਥਿਤੀ',
        action: 'ਟੋਕਨ ਰੈਂਕ ਜਾਣੋ',
        spokenPrompt: 'ਲਾਈਵ ਕਤਾਰ ਲਈ 2 ਦਬਾਓ। ਤੁਹਾਡਾ ਟੋਕਨ ਕਤਾਰ ਵਿੱਚ 4ਵੇਂ ਨੰਬਰ ਤੇ ਹੈ।'
      },
      {
        key: '3',
        title: 'ਸਰਕਾਰੀ MSP ਭਾਅ',
        action: 'ਅੱਜ ਦੇ ਸਰਕਾਰੀ ਭਾਅ',
        spokenPrompt: 'ਅੱਜ ਕਣਕ ਦਾ ਸਰਕਾਰੀ ਭਾਅ ₹2,425 ਪ੍ਰਤੀ ਕੁਇੰਟਲ ਹੈ।'
      },
      {
        key: '4',
        title: 'ਬੈਂਕ ਖਾਤਾ ਭੁਗਤਾਨ ਸਥਿਤੀ',
        action: 'ਜੇ-ਫਾਰਮ ਤੇ DBT',
        spokenPrompt: 'ਤੁਹਾਡਾ ਜੇ-ਫਾਰਮ ਮਨਜ਼ੂਰ ਹੋ ਚੁੱਕਾ ਹੈ। ਪੈਸੇ ਬੈਂਕ ਵਿੱਚ ਜਮ੍ਹਾਂ ਹਨ।'
      },
      {
        key: '9',
        title: 'ਮੰਡੀ ਅਫ਼ਸਰ ਨਾਲ ਗੱਲ ਕਰੋ',
        action: 'ਸਿੱਧੀ ਹੈਲਪਲਾਈਨ',
        spokenPrompt: 'ਤੁਹਾਡੀ ਕਾਲ ਮੰਡੀ ਹੈਲਪਡੈਸਕ ਨਾਲ ਜੋੜੀ ਜਾ ਰਹੀ ਹੈ।'
      }
    ],
    faqs: [
      {
        q: 'ਕੀ ਸਾਧਾਰਨ ਕੀਪੈਡ ਫ਼ੋਨ ਤੇ ਕੰਮ ਕਰੇਗਾ?',
        a: 'ਹਾਂਜੀ, ਬਿਨਾਂ ਇੰਟਰਨੈੱਟ ਕਿਸੇ ਵੀ ਮੋਬਾਈਲ ਫ਼ੋਨ ਤੇ ਕੰਮ ਕਰਦਾ ਹੈ।'
      },
      {
        q: 'ਕੀ ਕਾਲ ਦੇ ਕੋਈ ਪੈਸੇ ਲੱਗਦੇ ਹਨ?',
        a: 'ਬਿਲਕੁਲ ਨਹੀਂ, ਇਹ 100% ਮੁਫ਼ਤ ਸਰਕਾਰੀ ਟੋਲ-ਫ੍ਰੀ ਨੰਬਰ ਹੈ।'
      },
      {
        q: 'ਮੰਡੀ ਗੇਟ ਤੇ ਕੀ ਦਿਖਾਉਣਾ ਹੈ?',
        a: 'ਕਾਲ ਖਤਮ ਹੁੰਦੇ ਹੀ ਫ਼ੋਨ ਤੇ ਆਇਆ ਸਰਕਾਰੀ SMS ਗੇਟ ਤੇ ਦਿਖਾਓ।'
      }
    ]
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    keypadPrompt: 'বাংলার জন্য 4 চাপুন',
    badge: 'টোল-ফ্রি • 24x7 • ইন্টারনেট ছাড়া',
    title: 'কৃষক আইভিআর হেল্পলাইন 1800-180-1551',
    tagline: 'ইন্টারনেট ছাড়াই সাধারণ কিপ্যাড ফোন দিয়ে সহজে মন্ডি টোকেন বুক করুন।',
    registrationNotice: {
      badge: 'বাধ্যতামূলক প্রথম ধাপ',
      text: 'আইভিআর পরিষেবা ব্যবহার করার আগে পোর্টালে আপনার ১০ সংখ্যার মোবাইল নম্বর রেজিস্টার করা আবশ্যক। এরপর আপনি 1800-180-1551 এ কল করে সহজেই সেবা নিতে পারবেন।',
      cta: 'পোর্টালে মোবাইল নম্বর রেজিস্টার করুন'
    },
    steps: [
      {
        num: '1',
        title: 'প্রথম ধাপ: মোবাইল রেজিস্ট্রেশন',
        desc: 'পোর্টালে বা পঞ্চায়েতে নিজের ১০ সংখ্যার মোবাইল নম্বর একবার নথিভুক্ত করুন।'
      },
      {
        num: '2',
        title: '1800-180-1551 এ কল করুন',
        desc: 'নথিভুক্ত মোবাইল থেকে যেকোনো কিপ্যাড ফোন দিয়ে বিনামূল্যে কল করুন।'
      },
      {
        num: '3',
        title: 'বোতাম চেপে সেবা বাছুন',
        desc: 'স্লটের জন্য 1, লাইনের জন্য 2, সহায়ক মূল্যের জন্য 3 এবং পেমেন্টের জন্য 4 চাপুন।'
      },
      {
        num: '4',
        title: 'তাৎক্ষণিক SMS পান',
        desc: 'টোকেন নম্বর সহ সরকারি এসএমএস মন্ডির প্রবেশ গেটে দেখান।'
      }
    ],
    menuOptions: [
      {
        key: '1',
        title: 'মন্ডি স্লট ও টোকেন বুকিং',
        action: 'ফসল কোড + ওজন',
        spokenPrompt: 'নতুন টোকেন বুকিংয়ের জন্য 1 চাপুন। গমের জন্য 1, ধানের জন্য 2।'
      },
      {
        key: '2',
        title: 'লাইভ লাইনের স্থিতি',
        action: 'টোকেন অবস্থান',
        spokenPrompt: 'লাইনের জন্য 2 চাপুন। আপনার গাড়ি বর্তমানে লাইনে ৪ নম্বরে রয়েছে।'
      },
      {
        key: '3',
        title: 'আজকের সরকারি MSP দর',
        action: 'নূন্যতম সহায়ক মূল্য',
        spokenPrompt: 'আজকের গমের সরকারি সহায়ক মূল্য প্রতি কুইন্টাল ₹২,৪২৫।'
      },
      {
        key: '4',
        title: 'ব্যাংক পেমেন্ট স্থিতি',
        action: 'জে-ফর্ম ও ব্যাংক টাকা',
        spokenPrompt: 'আপনার জে-ফর্ম অনুমোদিত হয়েছে এবং টাকা ব্যাংক পাঠানো হয়েছে।'
      },
      {
        key: '9',
        title: 'কৃষি কর্মকর্তার সাহায্য',
        action: 'সরাসরি কথা বলুন',
        spokenPrompt: 'আপনার কলটি মন্ডি হেল্পডেস্কে সংযোগ করা হচ্ছে।'
      }
    ],
    faqs: [
      {
        q: 'সাধারণ কিপ্যাড ফোন থেকে কাজ করবে?',
        a: 'হ্যাঁ, ইন্টারনেট ছাড়াই যেকোনো সাধারণ বোতামের মোবাইল থেকে কাজ করবে।'
      },
      {
        q: '1800-180-1551 নম্বরে কলের কোনো খরচ আছে?',
        a: 'না, এটি সম্পূর্ণ সরকারি টোল-ফ্রি নম্বর। কোনো টাকা কাটে না।'
      },
      {
        q: 'মন্ডির গেটে কী দেখাতে হবে?',
        a: 'কলের পরেই আপনার ফোনে যে এসএমএস আসবে, শুধু সেটাই গেটে দেখান।'
      }
    ]
  }
};

// Hindi Audio Transcript segments with precise second offsets in the recorded WAV
const HINDI_AUDIO_SEGMENTS = [
  { start: 0, end: 4, text: 'नमस्ते किसान भाइयों।' },
  { start: 4, end: 12, text: 'महत्वपूर्ण सूचना: आईवीआर सेवा का उपयोग करने के लिए, सबसे पहले पोर्टल पर अपना 10 अंकों का मोबाइल नंबर रजिस्टर करना अनिवार्य है।' },
  { start: 12, end: 23, text: 'एक बार मोबाइल नंबर रजिस्टर होने के बाद, आप बिना इंटरनेट और बिना स्मार्टफोन, किसी भी साधारण कीपैड फोन से हमारे टोल-फ्री नंबर 1800-180-1551 पर कभी भी मुफ्त कॉल कर सकते हैं।' },
  { start: 23, end: 28, text: 'मंडी स्लॉट और टोकन बुक करने के लिए 1 दबाएं।' },
  { start: 28, end: 32, text: 'लाइव कतार स्थिति जानने के लिए 2 दबाएं।' },
  { start: 32, end: 37, text: 'सरकारी एमएसपी भाव जानने के लिए 3 दबाएं।' },
  { start: 37, end: 41, text: 'बैंक भुगतान की स्थिति के लिए 4 दबाएं।' },
  { start: 41, end: 44, text: 'मंडी अधिकारी सहायता के लिए 9 दबाएं।' },
  { start: 44, end: 49, text: 'कॉल समाप्त होते ही टोकन का एसएमएस आपके रजिस्टर्ड मोबाइल पर आ जाएगा। धन्यवाद।' }
];

export const IvrSupportModal: React.FC<IvrSupportModalProps> = ({
  isOpen,
  onClose,
  darkMode = false,
}) => {
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = React.useState<IvrLanguage>(() => {
    const lang = (i18n.language || 'hi').slice(0, 2) as IvrLanguage;
    return ['hi', 'en', 'bn', 'pa'].includes(lang) ? lang : 'hi';
  });
  const [activeKey, setActiveKey] = React.useState<string>('1');

  React.useEffect(() => {
    if (isOpen) {
      const lang = (i18n.language || 'hi').slice(0, 2) as IvrLanguage;
      if (['hi', 'en', 'bn', 'pa'].includes(lang)) {
        setSelectedLang(lang);
      }
    }
  }, [isOpen, i18n.language]);

  // HTML5 Audio Player States
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(48.5);
  const [playbackSpeed, setPlaybackSpeed] = React.useState<number>(1.0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [showTranscript, setShowTranscript] = React.useState(false);
  const [activeSegmentIdx, setActiveSegmentIdx] = React.useState<number>(0);

  // Stop audio immediately when modal closes
  React.useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

  // Update active transcript segment based on currentTime
  React.useEffect(() => {
    const idx = HINDI_AUDIO_SEGMENTS.findIndex(
      s => currentTime >= s.start && currentTime < s.end
    );
    if (idx !== -1) {
      setActiveSegmentIdx(idx);
    } else if (currentTime >= 44) {
      setActiveSegmentIdx(HINDI_AUDIO_SEGMENTS.length - 1);
    }
  }, [currentTime]);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play request interrupted or prevented:', err);
      });
    }
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {});
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleSpeedCycle = () => {
    const speeds = [1.0, 1.2, 0.85];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen) return null;

  const currentConfig = IVR_LANGUAGES[selectedLang] || IVR_LANGUAGES.hi;
  const activeOption = currentConfig.menuOptions.find(m => m.key === activeKey) || currentConfig.menuOptions[0];

  return (
    <div 
      id="ivr-support-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
    >
      {/* Hidden native HTML5 Audio element pointing to studio-grade recorded audio */}
      <audio
        ref={audioRef}
        src="/ivr-guide-hindi.wav"
        preload="auto"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setDuration(audioRef.current.duration);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      <div
        id="ivr-support-modal-container"
        className={`relative w-full max-w-2xl rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all my-6 max-h-[90vh] overflow-y-auto ${
          darkMode
            ? 'bg-neutral-950 border-neutral-800 text-slate-100 shadow-neutral-950/80'
            : 'bg-white border-emerald-100 text-slate-900 shadow-2xl'
        }`}
      >
        {/* Close Button */}
        <button
          id="btn-close-ivr-modal"
          type="button"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
            }
            onClose();
          }}
          className={`absolute top-4 right-4 p-2 rounded-xl border transition-colors cursor-pointer ${
            darkMode
              ? 'border-neutral-800 text-slate-400 hover:text-white hover:bg-neutral-900'
              : 'border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
          aria-label="Close IVR Support Dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Minimal Header */}
        <div className="flex items-start sm:items-center gap-3 mb-4 pr-10">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-xs">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {currentConfig.badge}
              </span>
              <a 
                href="tel:18001801551"
                className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                1800-180-1551
              </a>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
              {currentConfig.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-neutral-400">
              {currentConfig.tagline}
            </p>
          </div>
        </div>

        {/* 4 Supported Languages Selector */}
        <div className="mb-4 flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-neutral-400 mr-1">
            <Languages className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Language:</span>
          </div>
          {(['hi', 'en', 'pa', 'bn'] as IvrLanguage[]).map((code) => {
            const item = IVR_LANGUAGES[code];
            const isSelected = selectedLang === code;
            return (
              <button
                key={code}
                id={`btn-ivr-lang-${code}`}
                type="button"
                onClick={() => setSelectedLang(code)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : darkMode
                    ? 'bg-neutral-900 border-neutral-800 text-slate-300 hover:border-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-400'
                }`}
              >
                {item.nativeName} ({item.name})
              </button>
            );
          })}
        </div>

        {/* Mandatory Prerequisite: Portal Mobile Registration Banner */}
        <div 
          id="ivr-registration-prerequisite-banner"
          className="mb-4 p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-linear-to-r from-amber-50 to-orange-50/50 dark:from-neutral-900 dark:to-neutral-900 shadow-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0 mt-0.5 shadow-2xs">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                  {currentConfig.registrationNotice.badge}
                </span>
                <span className="font-bold text-amber-950 dark:text-amber-200">
                  1800-180-1551
                </span>
              </div>
              <p className="text-slate-700 dark:text-neutral-300 leading-relaxed font-medium">
                {currentConfig.registrationNotice.text}
              </p>
              <div className="pt-1 flex items-center gap-3">
                <Link
                  to="/auth"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <span>{currentConfig.registrationNotice.cta}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Dedicated Hindi Voice Message Player (Clean, Modern, Rock-Solid Audio) */}
        <div 
          id="ivr-hindi-voice-player"
          className="mb-4 p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-neutral-900/90 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500 text-white shrink-0">
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-amber-950 dark:text-amber-200">
                    हिंदी वॉयस संदेश (Hindi Voice Audio Guide)
                  </span>
                  {isPlaying ? (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-emerald-500 animate-pulse h-3"></span>
                        <span className="w-0.5 bg-emerald-500 animate-pulse h-2"></span>
                        <span className="w-0.5 bg-emerald-500 animate-pulse h-3.5"></span>
                      </span>
                      <span>चल रहा है</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {formatTime(duration)} ऑडियो
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400">
                  {isPlaying 
                    ? HINDI_AUDIO_SEGMENTS[activeSegmentIdx]?.text.slice(0, 48) + '...'
                    : 'पूरी आईवीआर प्रक्रिया को सुनने के लिए प्ले दबाएं'}
                </p>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center gap-1.5 self-start sm:self-center flex-wrap">
              {/* Play / Pause */}
              <button
                id="btn-toggle-voice"
                type="button"
                onClick={handleTogglePlay}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    <span>रोकें (Pause)</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{currentTime > 0 ? 'जारी रखें' : 'सुनें (Play)'}</span>
                  </>
                )}
              </button>

              {/* Restart */}
              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="शुरू से सुनें (Restart)"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              {/* Speed Cycle */}
              <button
                type="button"
                onClick={handleSpeedCycle}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-[11px] font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                title="आवाज़ की गति बदलें"
              >
                {playbackSpeed}x
              </button>

              {/* Mute toggle */}
              <button
                type="button"
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer"
                title={isMuted ? 'अनम्यूट करें' : 'म्यूट करें'}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-500" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>

              {/* Transcript toggle */}
              <button
                type="button"
                onClick={() => setShowTranscript(!showTranscript)}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  showTranscript
                    ? 'border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    : 'border-slate-200 dark:border-neutral-800 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                }`}
                title="लिखित देखें (Transcript)"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Interactive Scrub Bar */}
          <div className="mt-2.5 pt-2 border-t border-amber-200/60 dark:border-neutral-800 flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-neutral-400 shrink-0">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 45}
              step="0.5"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-amber-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-neutral-400 shrink-0">
              {formatTime(duration)}
            </span>
          </div>

          {/* Transcript view with real-time highlighted sentence */}
          {showTranscript && (
            <div className="mt-2.5 p-3 rounded-lg bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 text-xs space-y-1 max-h-36 overflow-y-auto">
              <div className="font-bold text-slate-700 dark:text-neutral-300 pb-1 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between">
                <span>लिखित वॉयस संदेश (Voice Transcript):</span>
                <span className="text-[10px] text-slate-400 font-normal">क्लिक करके सीधे सुनें</span>
              </div>
              {HINDI_AUDIO_SEGMENTS.map((segment, i) => (
                <div
                  key={i} 
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = segment.start;
                      setCurrentTime(segment.start);
                      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
                    }
                  }}
                  className={`py-1 px-1.5 rounded cursor-pointer transition flex items-center justify-between gap-2 ${
                    activeSegmentIdx === i
                      ? 'bg-amber-100 text-amber-950 font-bold dark:bg-amber-950/80 dark:text-amber-200'
                      : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-900'
                  }`}
                >
                  <span>{i + 1}. {segment.text}</span>
                  <span className="text-[10px] font-mono opacity-60 shrink-0">{segment.start}s</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4 Simple Steps (No Long Paragraphs) */}
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            सरल 4 चरण (Simple 4 Steps):
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {currentConfig.steps.map((s) => (
              <div
                key={s.num}
                className="p-3 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/70 dark:bg-neutral-900/60 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center">
                    {s.num}
                  </span>
                  {s.num === '1' && <Smartphone className="h-3.5 w-3.5 text-emerald-500" />}
                  {s.num === '2' && <PhoneForwarded className="h-3.5 w-3.5 text-emerald-500" />}
                  {s.num === '3' && <Clock className="h-3.5 w-3.5 text-emerald-500" />}
                  {s.num === '4' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  {s.title}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-snug">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Keypad Quick Reference */}
        <div className="mb-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            कीपैड मेन्यू (Keypad Menu):
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {currentConfig.menuOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setActiveKey(opt.key)}
                className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                  activeKey === opt.key
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-white shadow-2xs'
                    : 'border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900 text-slate-700 dark:text-neutral-300 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center ${
                    activeKey === opt.key ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                  }`}>
                    {opt.key}
                  </span>
                  {opt.key === '1' && <CalendarPlus className="h-3 w-3 text-slate-400" />}
                  {opt.key === '2' && <Search className="h-3 w-3 text-slate-400" />}
                  {opt.key === '3' && <IndianRupee className="h-3 w-3 text-slate-400" />}
                  {opt.key === '4' && <ShieldCheck className="h-3 w-3 text-slate-400" />}
                  {opt.key === '9' && <Headphones className="h-3 w-3 text-slate-400" />}
                </div>
                <span className="text-[11px] font-bold leading-tight truncate">
                  {opt.title}
                </span>
              </button>
            ))}
          </div>

          {/* Active Key Brief Details */}
          <div className="p-2.5 rounded-xl border border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-neutral-900/80 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                {activeOption.key}
              </span>
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                {activeOption.title}:
              </span>
              <span className="text-slate-600 dark:text-neutral-300 italic truncate max-w-xs sm:max-w-md">
                "{activeOption.spokenPrompt}"
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 shrink-0">
              {activeOption.action}
            </span>
          </div>
        </div>

        {/* Minimal 3-Point FAQs */}
        <div className="mb-4 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <HelpCircle className="h-3 w-3 text-emerald-500" />
            <span>अक्सर पूछे जाने वाले सवाल (FAQs):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {currentConfig.faqs.map((f, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/50 space-y-0.5"
              >
                <div className="font-bold text-slate-900 dark:text-white text-[11px]">
                  {f.q}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-neutral-400">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <a
            id="btn-call-toll-free"
            href="tel:18001801551"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Call 1800-180-1551 (Toll-Free)</span>
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="btn-close-bottom"
              type="button"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                onClose();
              }}
              className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              Close
            </button>
            <Link
              id="btn-register-mobile-link"
              to="/register"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                onClose();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs shadow-xs transition"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Register Mobile</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
