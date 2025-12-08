/**
 * Translations for Dealandme
 * Currently supports: English (en), Bangla (bn)
 */

export type Language = "en" | "bn";

export const translations = {
  // Common
  appName: {
    en: "Dealandme",
    bn: "ডিলএন্ডমি",
  },
  loading: {
    en: "Loading...",
    bn: "লোড হচ্ছে...",
  },
  error: {
    en: "Something went wrong",
    bn: "কিছু সমস্যা হয়েছে",
  },
  back: {
    en: "Back",
    bn: "পেছনে",
  },

  // Login Page
  login: {
    title: {
      en: "Enter your phone number",
      bn: "আপনার ফোন নম্বর দিন",
    },
    subtitle: {
      en: "We'll send you a one-time password",
      bn: "আমরা আপনাকে একটি OTP পাঠাবো",
    },
    phoneLabel: {
      en: "Phone Number",
      bn: "ফোন নম্বর",
    },
    phonePlaceholder: {
      en: "Enter your phone number (01XXXXXXXXX)",
      bn: "আপনার ফোন নম্বর দিন (০১XXXXXXXXX)",
    },
    sendOtp: {
      en: "Send OTP",
      bn: "OTP পাঠান",
    },
    sending: {
      en: "Sending...",
      bn: "পাঠানো হচ্ছে...",
    },
    otpTitle: {
      en: "Enter OTP",
      bn: "OTP দিন",
    },
    otpSubtitle: {
      en: "Enter the 6-digit code sent to your phone",
      bn: "আপনার ফোনে পাঠানো ৬ সংখ্যার কোড দিন",
    },
    otpSentTo: {
      en: "OTP sent to",
      bn: "OTP পাঠানো হয়েছে",
    },
    change: {
      en: "Change",
      bn: "পরিবর্তন",
    },
    otpLabel: {
      en: "OTP Code",
      bn: "OTP কোড",
    },
    otpPlaceholder: {
      en: "Enter 6-digit OTP",
      bn: "৬ সংখ্যার OTP দিন",
    },
    verifyOtp: {
      en: "Verify OTP",
      bn: "OTP যাচাই করুন",
    },
    verifying: {
      en: "Verifying...",
      bn: "যাচাই হচ্ছে...",
    },
    testOtpHint: {
      en: "For testing, use OTP: 123456",
      bn: "টেস্টিং এর জন্য OTP: ১২৩৪৫৬ ব্যবহার করুন",
    },
  },

  // Restaurants Page
  restaurants: {
    title: {
      en: "Restaurants",
      bn: "রেস্টুরেন্ট",
    },
    browseTitle: {
      en: "Browse Restaurants",
      bn: "রেস্টুরেন্ট দেখুন",
    },
    noRestaurants: {
      en: "No restaurants available",
      bn: "কোনো রেস্টুরেন্ট নেই",
    },
    viewOffer: {
      en: "View Offer",
      bn: "অফার দেখুন",
    },
    backToRestaurants: {
      en: "Back to restaurants",
      bn: "রেস্টুরেন্ট লিস্টে ফিরুন",
    },
    browseMore: {
      en: "Browse more restaurants",
      bn: "আরো রেস্টুরেন্ট দেখুন",
    },
  },

  // Restaurant Detail Page
  restaurantDetail: {
    currentOffer: {
      en: "Current Offer",
      bn: "বর্তমান অফার",
    },
    noActiveOffer: {
      en: "This restaurant currently has no active offer.",
      bn: "এই রেস্টুরেন্টে বর্তমানে কোনো অফার নেই।",
    },
    getCoupon: {
      en: "Get Coupon",
      bn: "কুপন নিন",
    },
    generating: {
      en: "Generating...",
      bn: "তৈরি হচ্ছে...",
    },
    yourCouponCode: {
      en: "Your Coupon Code",
      bn: "আপনার কুপন কোড",
    },
    showCodeToStaff: {
      en: "Show this code to the restaurant staff",
      bn: "এই কোডটি রেস্টুরেন্ট স্টাফকে দেখান",
    },
    expiresIn: {
      en: "Expires in",
      bn: "মেয়াদ শেষ",
    },
    expired: {
      en: "Expired",
      bn: "মেয়াদ শেষ",
    },
    couponGenerated: {
      en: "Coupon generated successfully!",
      bn: "কুপন সফলভাবে তৈরি হয়েছে!",
    },
    alreadyHaveCoupon: {
      en: "You already have an active coupon for this restaurant",
      bn: "এই রেস্টুরেন্টের জন্য আপনার একটি সক্রিয় কুপন আছে",
    },
  },

  // Coupon Usage Guide
  couponGuide: {
    title: {
      en: "How to Use Your Coupon",
      bn: "কুপন কিভাবে ব্যবহার করবেন",
    },
    step1: {
      en: "Generate your coupon from the restaurant page",
      bn: "রেস্টুরেন্ট পেজ থেকে কুপন নিন",
    },
    step2: {
      en: "Show the coupon code to the restaurant staff before ordering",
      bn: "অর্ডার করার আগে কুপন কোডটি রেস্টুরেন্ট স্টাফকে দেখান",
    },
    step3: {
      en: "Staff will validate and apply your discount",
      bn: "স্টাফ যাচাই করে আপনার ডিসকাউন্ট দেবে",
    },
    note: {
      en: "Note: Each coupon is valid for 3 hours and can only be used once.",
      bn: "নোট: প্রতিটি কুপন ৩ ঘন্টা বৈধ এবং একবারই ব্যবহার করা যাবে।",
    },
  },

  // My Coupons Page
  myCoupons: {
    title: {
      en: "My Coupons",
      bn: "আমার কুপন",
    },
    noCoupons: {
      en: "No coupons yet",
      bn: "এখনো কোনো কুপন নেই",
    },
    noCouponsSubtitle: {
      en: "Browse restaurants and get your first coupon!",
      bn: "রেস্টুরেন্ট দেখুন এবং প্রথম কুপন নিন!",
    },
    browseRestaurants: {
      en: "Browse Restaurants",
      bn: "রেস্টুরেন্ট দেখুন",
    },
    active: {
      en: "Active",
      bn: "সক্রিয়",
    },
    used: {
      en: "Used",
      bn: "ব্যবহৃত",
    },
    expired: {
      en: "Expired",
      bn: "মেয়াদ শেষ",
    },
    created: {
      en: "Created",
      bn: "তৈরি",
    },
    redeemed: {
      en: "Redeemed",
      bn: "ব্যবহার করা হয়েছে",
    },
    expires: {
      en: "Expires",
      bn: "মেয়াদ",
    },
  },

  // Restaurant Validation Page
  validation: {
    title: {
      en: "Validate Coupon",
      bn: "কুপন যাচাই করুন",
    },
    enterCode: {
      en: "Enter Coupon Code",
      bn: "কুপন কোড দিন",
    },
    codePlaceholder: {
      en: "e.g., ABC12345",
      bn: "যেমন: ABC12345",
    },
    validateButton: {
      en: "Validate Coupon",
      bn: "কুপন যাচাই করুন",
    },
    validating: {
      en: "Validating...",
      bn: "যাচাই হচ্ছে...",
    },
    instruction: {
      en: "Ask the customer to show their coupon code, then enter it above to validate and redeem.",
      bn: "কাস্টমারকে কুপন কোড দেখাতে বলুন, তারপর উপরে দিয়ে যাচাই করুন।",
    },
    redeemed: {
      en: "Coupon Redeemed!",
      bn: "কুপন সফলভাবে ব্যবহার হয়েছে!",
    },
    alreadyUsed: {
      en: "Already Used",
      bn: "আগেই ব্যবহার হয়েছে",
    },
    expiredCoupon: {
      en: "Coupon Expired",
      bn: "কুপনের মেয়াদ শেষ",
    },
    wrongRestaurant: {
      en: "Wrong Restaurant",
      bn: "ভুল রেস্টুরেন্ট",
    },
    notFound: {
      en: "Not Found",
      bn: "পাওয়া যায়নি",
    },
    redemptionDetails: {
      en: "Redemption Details",
      bn: "ব্যবহারের বিবরণ",
    },
    code: {
      en: "Code",
      bn: "কোড",
    },
    customer: {
      en: "Customer",
      bn: "কাস্টমার",
    },
    offer: {
      en: "Offer",
      bn: "অফার",
    },
    validateAnother: {
      en: "Validate Another Coupon",
      bn: "আরেকটি কুপন যাচাই করুন",
    },
  },

  // Restaurant Dashboard
  dashboard: {
    title: {
      en: "Dashboard",
      bn: "ড্যাশবোর্ড",
    },
    welcomeBack: {
      en: "Welcome back",
      bn: "স্বাগতম",
    },
    validateCoupon: {
      en: "Validate Coupon",
      bn: "কুপন যাচাই",
    },
    validateCouponDesc: {
      en: "Enter a coupon code to validate and redeem",
      bn: "কুপন কোড দিয়ে যাচাই করুন",
    },
    redemptionHistory: {
      en: "Redemption History",
      bn: "ব্যবহারের ইতিহাস",
    },
    redemptionHistoryDesc: {
      en: "View all redeemed coupons and their details",
      bn: "সব ব্যবহৃত কুপন দেখুন",
    },
    quickTip: {
      en: "Quick Tip",
      bn: "টিপস",
    },
    quickTipText: {
      en: "When a customer shows you their coupon code, use the \"Validate Coupon\" feature to verify and mark it as used. Each coupon can only be used once.",
      bn: "কাস্টমার কুপন কোড দেখালে \"কুপন যাচাই\" ফিচার ব্যবহার করে যাচাই করুন। প্রতিটি কুপন একবারই ব্যবহার করা যায়।",
    },
    todaySummary: {
      en: "Today's Summary",
      bn: "আজকের সারাংশ",
    },
    couponsGenerated: {
      en: "Coupons Generated",
      bn: "কুপন তৈরি হয়েছে",
    },
    couponsRedeemed: {
      en: "Coupons Redeemed",
      bn: "কুপন ব্যবহার হয়েছে",
    },
    pendingCoupons: {
      en: "Pending Coupons",
      bn: "অপেক্ষমান কুপন",
    },
  },

  // Navigation
  nav: {
    restaurants: {
      en: "Restaurants",
      bn: "রেস্টুরেন্ট",
    },
    myCoupons: {
      en: "My Coupons",
      bn: "আমার কুপন",
    },
    logout: {
      en: "Logout",
      bn: "লগআউট",
    },
    dashboard: {
      en: "Dashboard",
      bn: "ড্যাশবোর্ড",
    },
    validate: {
      en: "Validate",
      bn: "যাচাই",
    },
    history: {
      en: "History",
      bn: "ইতিহাস",
    },
  },

  // Errors
  errors: {
    phoneRequired: {
      en: "Phone number is required",
      bn: "ফোন নম্বর দিতে হবে",
    },
    invalidPhone: {
      en: "Invalid phone number format. Use Bangladesh number (01XXXXXXXXX)",
      bn: "ভুল ফোন নম্বর। বাংলাদেশি নম্বর দিন (০১XXXXXXXXX)",
    },
    otpRequired: {
      en: "OTP is required",
      bn: "OTP দিতে হবে",
    },
    invalidOtp: {
      en: "Invalid OTP",
      bn: "ভুল OTP",
    },
    otpExpired: {
      en: "OTP expired. Please request a new one.",
      bn: "OTP এর মেয়াদ শেষ। নতুন OTP নিন।",
    },
    tooManyRequests: {
      en: "Too many requests. Please try again later.",
      bn: "অনেক বেশি রিকোয়েস্ট। কিছুক্ষণ পর চেষ্টা করুন।",
    },
    networkError: {
      en: "Network error. Please check your connection.",
      bn: "নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন।",
    },
    failedToSendOtp: {
      en: "Failed to send OTP",
      bn: "OTP পাঠাতে ব্যর্থ",
    },
    failedToVerifyOtp: {
      en: "Failed to verify OTP",
      bn: "OTP যাচাই করতে ব্যর্থ",
    },
    failedToGenerateCoupon: {
      en: "Failed to generate coupon",
      bn: "কুপন তৈরি করতে ব্যর্থ",
    },
  },
} as const;

/**
 * Get translation for a key
 */
export function t(
  key: keyof typeof translations,
  subKey: string,
  lang: Language = "bn"
): string {
  const category = translations[key];
  if (category && typeof category === "object" && subKey in category) {
    const item = category[subKey as keyof typeof category];
    if (item && typeof item === "object" && lang in item) {
      return item[lang as keyof typeof item] as string;
    }
  }
  return subKey;
}

/**
 * Default language - Bangla for Bangladesh users
 */
export const DEFAULT_LANGUAGE: Language = "bn";
