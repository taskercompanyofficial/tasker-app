export type LanguageCode = "en" | "ur-Latn" | "ur";

export interface Translations {
  common: {
    continue: string;
    back: string;
    submit: string;
    cancel: string;
    loading: string;
    save: string;
    edit: string;
    next: string;
    skip: string;
    upload: string;
    camera: string;
    gallery: string;
    success: string;
    error: string;
    required: string;
    change: string;
    retake: string;
    search: string;
    logout: string;
    viewAll: string;
    noServicesAvailable: string;
    noTrendingServices: string;
    categories: string;
    recentActivity: string;
    comingSoon: string;
    underDevelopment: string;
    walletComingSoonDescription: string;
    noServicesFound: string;
    tryAdjustSearch: string;
    clearSearch: string;
    status: string;
    details: string;
    close: string;
    refresh: string;
    moreInformation: string;
    total: string;
    checkout: string;
    items: string;
  };
  language: {
    selectLanguage: string;
    subtitle: string;
    english: string;
    romanUrdu: string;
    urdu: string;
    continue: string;
    switchPrompt: string;
  };
  roleSelection: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    customerTitle: string;
    customerDesc: string;
    vendorTitle: string;
    vendorDesc: string;
    switchLanguage: string;
  };
  auth: {
    signIn: string;
    verifiedExperts: string;
    customerTagline: string;
    vendorTagline: string;
    partnerProgram: string;
    enterPhone: string;
    sendViaWhatsApp: string;
    sendViaSms: string;
    termsNotice: string;
    privacyPolicy: string;
    termsOfService: string;
    verifyOtpTitle: string;
    codeSentTo: string;
    enterDigitsPrompt: string;
    resendIn: string;
    resendCode: string;
    verifyAndSignIn: string;
    changeNumber: string;
    loginSuccess: string;
  };
  customer: {
    tabs: {
      home: string;
      services: string;
      orders: string;
      wallet: string;
      settings: string;
    };
    home: {
      greeting: string;
      searchPlaceholder: string;
      mainCategories: string;
      trendingServices: string;
      bookNow: string;
      trackJob: string;
      freeInstallation: string;
      commercialInquiries: string;
      emergencySupport: string;
    };
    services: {
      title: string;
      availableCount: string;
      searchPlaceholder: string;
      emptyServices: string;
      sortBy: string;
      priceLowToHigh: string;
      priceHighToLow: string;
      mostPopular: string;
      availableServices: string;
      serviceCount: string;
      servicesCount: string;
      noMatchSearch: string;
      serviceNotFound: string;
    };
    orders: {
      title: string;
      active: string;
      history: string;
      filterAll: string;
      pending: string;
      allocated: string;
      inProgress: string;
      completed: string;
      cancelled: string;
      emptyTitle: string;
      emptyMessage: string;
      emptyFilteredTitle: string;
      emptyFilteredMessage: string;
      loadingMore: string;
      noMoreOrders: string;
      browseServices: string;
      emptyActive: string;
      emptyHistory: string;
      orderNo: string;
      scheduledAt: string;
      assignedTechnician: string;
      totalAmount: string;
      viewDetails: string;
      trackLive: string;
    };
    wallet: {
      title: string;
      availableBalance: string;
      topUp: string;
      giftVouchers: string;
      transactionHistory: string;
      noTransactions: string;
    };
    settings: {
      title: string;
      personalInfo: string;
      savedAddresses: string;
      languageSettings: string;
      notificationPreferences: string;
      helpSupport: string;
      privacyPolicy: string;
      logoutConfirm: string;
    };
  };
  vendor: {
    tabs: {
      dashboard: string;
      jobs: string;
      earnings: string;
      ledger: string;
      chat: string;
      settings: string;
    };
    dashboard: {
      welcome: string;
      goOnline: string;
      goOffline: string;
      onlineState: string;
      offlineState: string;
      takeDailySelfie: string;
      selfieVerified: string;
      todayEarnings: string;
      completedJobs: string;
      activeJobs: string;
      efficiencyRate: string;
      quickActions: string;
      recentDispatches: string;
    };
    jobs: {
      title: string;
      pending: string;
      inProgress: string;
      completed: string;
      allJobs: string;
      customerName: string;
      address: string;
      acceptJob: string;
      declineJob: string;
      startTrip: string;
      reachedLocation: string;
      startWork: string;
      completeJob: string;
      callCustomer: string;
      chatCustomer: string;
      emptyJobs: string;
    };
    earnings: {
      title: string;
      netBalance: string;
      grossRevenue: string;
      companyDues: string;
      requestPayout: string;
      submitProof: string;
      recentLedger: string;
      filterAll: string;
      filterCredits: string;
      filterDebits: string;
    };
    ledger: {
      title: string;
      subtitle: string;
      servicesListed: string;
      customRates: string;
    };
    settings: {
      title: string;
      vendorProfile: string;
      staffManagement: string;
      languageSettings: string;
      serviceRates: string;
      dutySchedule: string;
      supportDesk: string;
      logoutConfirm: string;
    };
  };
  vendorOnboarding: {
    scanCnicTitle: string;
    scanCnicSub: string;
    frontSideTitle: string;
    frontSideDesc: string;
    backSideTitle: string;
    backSideDesc: string;
    scanDocument: string;
    takePhoto: string;
    chooseGallery: string;
    uploadAndScanBtn: string;
    scanningNotice: string;
    frontRequired: string;
    backRequired: string;
    scanSuccess: string;
    verifyDetailsTitle: string;
    verifyDetailsSub: string;
    fullName: string;
    fatherName: string;
    cnicNumber: string;
    dob: string;
    gender: string;
    male: string;
    female: string;
    currentAddress: string;
    selectCity: string;
    citySearchPlaceholder: string;
    workCategoriesTitle: string;
    workCategoriesSub: string;
    experience: string;
    experiencePlaceholder: string;
    saveAndContinue: string;
    cityRequired: string;
    categoriesRequired: string;
    addressRequired: string;
    cnicRequired: string;
    nameRequired: string;
  };
}

export const translations: Record<LanguageCode, Translations> = {
  en: {
    common: {
      continue: "Continue",
      back: "Back",
      submit: "Submit",
      cancel: "Cancel",
      loading: "Loading...",
      save: "Save",
      edit: "Edit",
      next: "Next",
      skip: "Skip",
      upload: "Upload",
      camera: "Camera",
      gallery: "Gallery",
      success: "Success",
      error: "Error",
      required: "Required",
      change: "Change",
      retake: "Retake",
      search: "Search...",
      logout: "Log Out",
      viewAll: "View All",
      noServicesAvailable: "No services available",
      noTrendingServices: "No trending services",
      categories: "Categories",
      recentActivity: "Recent Activity",
      comingSoon: "Coming Soon",
      underDevelopment: "Under Development",
      walletComingSoonDescription: "We're working on an improved wallet experience. Stay tuned!",
      noServicesFound: "No services found",
      tryAdjustSearch: "Try adjusting your search",
      clearSearch: "Clear Search",
      status: "Status",
      details: "Details",
      close: "Close",
      refresh: "Refresh",
      moreInformation: "More information",
      total: "Total",
      checkout: "Checkout",
      items: "items",
    },
    language: {
      selectLanguage: "Select Your Language",
      subtitle: "Choose your preferred language to continue",
      english: "English",
      romanUrdu: "Roman Urdu (Aasan)",
      urdu: "اردو (Urdu)",
      continue: "Continue",
      switchPrompt: "Select Application Language",
    },
    roleSelection: {
      welcomeTitle: "Welcome to Tasker Company",
      welcomeSubtitle: "Pakistan's Premier On-Demand Home & Commercial Services",
      customerTitle: "Book a Service",
      customerDesc: "Find trusted technicians for AC, electrical, plumbing & more",
      vendorTitle: "I'm a Service Provider",
      vendorDesc: "Grow your business, get daily jobs and guaranteed payouts",
      switchLanguage: "Change Language",
    },
    auth: {
      signIn: "Sign in",
      verifiedExperts: "Verified Experts",
      customerTagline: "Get your service in minutes",
      vendorTagline: "Get daily jobs & grow earnings",
      partnerProgram: "Verified Partner",
      enterPhone: "Enter phone number",
      sendViaWhatsApp: "Send via WhatsApp",
      sendViaSms: "Send via SMS",
      termsNotice: "By proceeding you agree to",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      verifyOtpTitle: "Verify Mobile Number",
      codeSentTo: "We sent a 6-digit code to",
      enterDigitsPrompt: "Enter 6-Digit Code",
      resendIn: "Resend code in",
      resendCode: "Resend Code",
      verifyAndSignIn: "Verify & Sign In",
      changeNumber: "Change Number",
      loginSuccess: "Signed in successfully!",
    },
    customer: {
      tabs: {
        home: "Home",
        services: "Services",
        orders: "My Orders",
        wallet: "Wallet",
        settings: "Settings",
      },
      home: {
        greeting: "Find Expert Help Today",
        searchPlaceholder: "Search for AC repair, electrician, plumber...",
        mainCategories: "Main Services",
        trendingServices: "Popular Services",
        bookNow: "Book Now",
        trackJob: "Track Active Job",
        freeInstallation: "Free Brand Installation",
        commercialInquiries: "Commercial & B2B Contracts",
        emergencySupport: "24/7 Priority Support",
      },
      services: {
        title: "Our Services",
        availableCount: "services available",
        searchPlaceholder: "Search services...",
        emptyServices: "No services found matching your search",
        sortBy: "Sort by:",
        priceLowToHigh: "Price: Low to High",
        priceHighToLow: "Price: High to Low",
        mostPopular: "Most Popular",
        availableServices: "Available Services",
        serviceCount: "service",
        servicesCount: "services",
        noMatchSearch: "No services match your search",
        serviceNotFound: "Service not found",
      },
      orders: {
        title: "My Service Orders",
        active: "Active",
        history: "History",
        filterAll: "All",
        pending: "Pending",
        allocated: "Allocated",
        inProgress: "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
        emptyTitle: "No Orders Yet",
        emptyMessage: "You haven't placed any orders yet.",
        emptyFilteredTitle: "No {{status}} orders",
        emptyFilteredMessage: "You don't have any {{status}} orders.",
        loadingMore: "Loading more orders...",
        noMoreOrders: "No more orders",
        browseServices: "Browse Services",
        emptyActive: "No active service bookings right now.",
        emptyHistory: "No past service bookings found.",
        orderNo: "Order #",
        scheduledAt: "Scheduled For",
        assignedTechnician: "Assigned Technician",
        totalAmount: "Total",
        viewDetails: "View Details",
        trackLive: "Track Technician Live",
      },
      wallet: {
        title: "Tasker Wallet",
        availableBalance: "Available Balance",
        topUp: "Add Funds",
        giftVouchers: "My Vouchers",
        transactionHistory: "Transaction History",
        noTransactions: "No wallet transactions yet.",
      },
      settings: {
        title: "Settings & Profile",
        personalInfo: "Personal Information",
        savedAddresses: "Saved Addresses",
        languageSettings: "Application Language",
        notificationPreferences: "Notifications",
        helpSupport: "Help & Customer Support",
        privacyPolicy: "Terms & Privacy Policy",
        logoutConfirm: "Are you sure you want to log out?",
      },
    },
    vendor: {
      tabs: {
        dashboard: "Dashboard",
        jobs: "Jobs",
        earnings: "Earnings",
        ledger: "Ledger",
        chat: "Chat",
        settings: "Settings",
      },
      dashboard: {
        welcome: "Partner Dashboard",
        goOnline: "Go Online",
        goOffline: "Go Offline",
        onlineState: "You are ONLINE & receiving jobs",
        offlineState: "You are OFFLINE",
        takeDailySelfie: "24h Daily Selfie Verification",
        selfieVerified: "Selfie Verified Today",
        todayEarnings: "Today's Earnings",
        completedJobs: "Completed Jobs",
        activeJobs: "In-Progress Jobs",
        efficiencyRate: "Success Rate",
        quickActions: "Quick Actions",
        recentDispatches: "New Dispatches",
      },
      jobs: {
        title: "Assigned Jobs",
        pending: "New",
        inProgress: "Active",
        completed: "Done",
        allJobs: "All Jobs",
        customerName: "Customer",
        address: "Location",
        acceptJob: "Accept Job",
        declineJob: "Decline",
        startTrip: "Start Navigation",
        reachedLocation: "Reached Site",
        startWork: "Start Repair",
        completeJob: "Complete Service",
        callCustomer: "Call Customer",
        chatCustomer: "Chat",
        emptyJobs: "No jobs assigned right now.",
      },
      earnings: {
        title: "Earnings & Settlements",
        netBalance: "Net Balance",
        grossRevenue: "Total Revenue",
        companyDues: "Company Share Payable",
        requestPayout: "Request Payout",
        submitProof: "Upload Payment Slip",
        recentLedger: "Ledger Statements",
        filterAll: "All Time",
        filterCredits: "Credits",
        filterDebits: "Debits",
      },
      ledger: {
        title: "Assigned Rates",
        subtitle: "services listed",
        servicesListed: "Services Listed",
        customRates: "Custom Rates",
      },
      settings: {
        title: "Partner Settings",
        vendorProfile: "Business Profile",
        staffManagement: "Technician Staff",
        languageSettings: "App Language (Urdu / English)",
        serviceRates: "My Rate Card",
        dutySchedule: "Working Hours",
        supportDesk: "Partner Support Desk",
        logoutConfirm: "Are you sure you want to log out of Partner Account?",
      },
    },
    vendorOnboarding: {
      scanCnicTitle: "CNIC Document Scan",
      scanCnicSub: "Capture or upload clear front and back photos of your Pakistani CNIC",
      frontSideTitle: "CNIC Front Side",
      frontSideDesc: "Ensure name, photo and CNIC number are clearly readable",
      backSideTitle: "CNIC Back Side",
      backSideDesc: "Ensure your residential address and barcode are visible",
      scanDocument: "Scan Document",
      takePhoto: "Take Photo",
      chooseGallery: "Choose from Gallery",
      uploadAndScanBtn: "Upload & Verify with AI",
      scanningNotice: "Uploading & extracting your details...",
      frontRequired: "Please provide the front side of your CNIC",
      backRequired: "Please provide the back side of your CNIC",
      scanSuccess: "CNIC scanned successfully! Verify your details below.",
      verifyDetailsTitle: "Verify Your Profile",
      verifyDetailsSub: "Confirm your extracted identity details, city and work skills",
      fullName: "Full Name (as on CNIC)",
      fatherName: "Father's Name",
      cnicNumber: "CNIC Number (13 Digits)",
      dob: "Date of Birth",
      gender: "Gender",
      male: "Male",
      female: "Female",
      currentAddress: "Current Address",
      selectCity: "Operating City",
      citySearchPlaceholder: "Search city (e.g. Lahore, Karachi)",
      workCategoriesTitle: "What Services Do You Provide?",
      workCategoriesSub: "Select all categories and skills you can work on",
      experience: "Years of Experience",
      experiencePlaceholder: "e.g. 3 Years, 5+ Years",
      saveAndContinue: "Save & Continue to Next Step",
      cityRequired: "Please select your operating city",
      categoriesRequired: "Please select at least one service category",
      addressRequired: "Current address is required",
      cnicRequired: "Valid 13-digit CNIC is required",
      nameRequired: "Full name is required",
    },
  },

  "ur-Latn": {
    common: {
      continue: "Aagay Barhein",
      back: "Wapis",
      submit: "Submit Karein",
      cancel: "Mansookh",
      loading: "Loading ho rahi hai...",
      save: "Mehfooz Karein",
      edit: "Tabdeel Karein",
      next: "Agla",
      skip: "Skip Karein",
      upload: "Upload",
      camera: "Camera",
      gallery: "Gallery",
      success: "Kamyabi",
      error: "Kharabi",
      required: "Zaroori",
      change: "Tabdeel Karein",
      retake: "Dobara Lein",
      search: "Talash karein...",
      logout: "Log Out",
      viewAll: "Sab Dekhein",
      noServicesAvailable: "Koi khidmaat dastiyab nahi hain",
      noTrendingServices: "Koi maqbool khidmaat nahi hain",
      categories: "Shobay",
      recentActivity: "Haliya Sargarmiyan",
      comingSoon: "Jald aa raha hai",
      underDevelopment: "Tayari jari hai",
      walletComingSoonDescription: "Hum aap ke liye behtar wallet tayyar kar rahe hain. Mazeed khabar jald milegi!",
      noServicesFound: "Koi khidmaat nahi milin",
      tryAdjustSearch: "Apni talash mein tabdeeli karein",
      clearSearch: "Talash saaf karein",
      status: "Status",
      details: "Tafseelat",
      close: "Band Karein",
      refresh: "Taza Karein",
      moreInformation: "Mazeed maloomat",
      total: "Kul",
      checkout: "Checkout",
      items: "items",
    },
    language: {
      selectLanguage: "Apni Zubaan Muntakhib Karein",
      subtitle: "Aasan istemal ke liye apni zubaan chunein",
      english: "English",
      romanUrdu: "Roman Urdu (Aasan)",
      urdu: "اردو (Urdu)",
      continue: "Aagay Barhein",
      switchPrompt: "App ki Zubaan Muntakhib Karein",
    },
    roleSelection: {
      welcomeTitle: "Tasker Company mein Khushamdeed",
      welcomeSubtitle: "Pakistan ki behtareen home aur maintenance services",
      customerTitle: "Service Book Karein",
      customerDesc: "AC, bijli, plumbing aur deegar kamo ke liye maahir technician bulayein",
      vendorTitle: "Bator Partner / Technician Shamil Hon",
      vendorDesc: "Rozana orders hasil karein aur apni aamdani barhayein",
      switchLanguage: "Zubaan Tabdeel Karein",
    },
    auth: {
      signIn: "Sign In Karein",
      verifiedExperts: "Tasdeeq Shuda Maahir",
      customerTagline: "Chund minton mein service hasil karein",
      vendorTagline: "Rozana jobs aur behtareen aamdani",
      partnerProgram: "Tasdeeq Shuda Partner",
      enterPhone: "Mobile number darj karein",
      sendViaWhatsApp: "WhatsApp par bhejein",
      sendViaSms: "SMS par bhejein",
      termsNotice: "Aagay barh kar aap mutafiq hain",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Khidmaat ke Qawaneen",
      verifyOtpTitle: "Mobile Number ki Tasdeeq",
      codeSentTo: "Hum ne 6-hindson ka code bheja hai",
      enterDigitsPrompt: "6-Hindson ka code darj karein",
      resendIn: "Dobara code bhejein",
      resendCode: "Dobara Code Bhejein",
      verifyAndSignIn: "Tasdeeq aur Sign In Karein",
      changeNumber: "Number Tabdeel Karein",
      loginSuccess: "Kamyabi se Sign In ho gaya!",
    },
    customer: {
      tabs: {
        home: "Home",
        services: "Services",
        orders: "My Orders",
        wallet: "Wallet",
        settings: "Settings",
      },
      home: {
        greeting: "Aaj Hi Maahir Karigar Bulayein",
        searchPlaceholder: "AC repair, electrician, plumber talash karein...",
        mainCategories: "Khaas Khidmaat",
        trendingServices: "Mashhoor Services",
        bookNow: "Abhi Book Karein",
        trackJob: "Live Order Track Karein",
        freeInstallation: "Muft Company Fitting",
        commercialInquiries: "Company & B2B Contracts",
        emergencySupport: "24/7 Helpline",
      },
      services: {
        title: "Hamari Khidmaat",
        availableCount: "khidmaat dastiyab hain",
        searchPlaceholder: "Khidmaat talash karein...",
        emptyServices: "Aap ki talash ke mutabiq koi service nahi mili",
        sortBy: "Tarteeb:",
        priceLowToHigh: "Qeemat: Kam se Zyada",
        priceHighToLow: "Qeemat: Zyada se Kam",
        mostPopular: "Sab se Maqbool",
        availableServices: "Dastiyab Khidmaat",
        serviceCount: "khidmat",
        servicesCount: "khidmaat",
        noMatchSearch: "Talash ke mutabiq koi khidmat nahi mili",
        serviceNotFound: "Khidmat nahi mili",
      },
      orders: {
        title: "Meray Orders",
        active: "Jari",
        history: "Mukammal",
        filterAll: "Tamam",
        pending: "Pending",
        allocated: "Taqseem Shuda",
        inProgress: "Jari",
        completed: "Mukammal",
        cancelled: "Mansookh",
        emptyTitle: "Abhi tak koi order nahi",
        emptyMessage: "Aap ne abhi tak koi order nahi diya.",
        emptyFilteredTitle: "Koi {{status}} order nahi",
        emptyFilteredMessage: "Aap ke paas koi {{status}} order nahi hai.",
        loadingMore: "Mazeed orders load ho rahe hain...",
        noMoreOrders: "Mazeed orders nahi hain",
        browseServices: "Khidmaat dekhein",
        emptyActive: "Filhal koi jari order nahi hai.",
        emptyHistory: "Purana record mojood nahi hai.",
        orderNo: "Order Number",
        scheduledAt: "Waqt",
        assignedTechnician: "Mukhtas Karigar",
        totalAmount: "Kul Raqam",
        viewDetails: "Tafseelat Dekhein",
        trackLive: "Karigar ko Live Track Karein",
      },
      wallet: {
        title: "Tasker Wallet",
        availableBalance: "Mojooda Balance",
        topUp: "Paisa Daalein",
        giftVouchers: "Inaami Vouchers",
        transactionHistory: "Len Den Record",
        noTransactions: "Koi transactions nahi milien.",
      },
      settings: {
        title: "Settings aur Profile",
        personalInfo: "Zati Maloomat",
        savedAddresses: "Mehfooz Patay",
        languageSettings: "App ki Zubaan",
        notificationPreferences: "Notifications",
        helpSupport: "Madad aur Helpline",
        privacyPolicy: "Qawaneen aur Privacy",
        logoutConfirm: "Kia aap waqai log out karna chahtay hain?",
      },
    },
    vendor: {
      tabs: {
        dashboard: "Dashboard",
        jobs: "Orders",
        earnings: "Aamdani",
        ledger: "Ledger",
        chat: "Chat",
        settings: "Settings",
      },
      dashboard: {
        welcome: "Partner Dashboard",
        goOnline: "Online Ho Jayein",
        goOffline: "Offline Ho Jayein",
        onlineState: "Aap ONLINE hain aur orders mil rahay hain",
        offlineState: "Aap OFFLINE hain",
        takeDailySelfie: "Rozana ki Selfie Tasdeeq",
        selfieVerified: "Selfie Tasdeeq Shuda",
        todayEarnings: "Aaj ki Aamdani",
        completedJobs: "Mukammal Kaam",
        activeJobs: "Jari Kaam",
        efficiencyRate: "Kamyabi ki Sharah",
        quickActions: "Fauri Istemal",
        recentDispatches: "Naye Orders",
      },
      jobs: {
        title: "Milnay Walay Kaam",
        pending: "Naye",
        inProgress: "Jari",
        completed: "Mukammal",
        allJobs: "Tamam Orders",
        customerName: "Gahak",
        address: "Pata",
        acceptJob: "Kaam Qabool Karein",
        declineJob: "Inkaar Karein",
        startTrip: "Rasta Shuru Karein",
        reachedLocation: "Pohanch Gaye",
        startWork: "Kaam Shuru Karein",
        completeJob: "Kaam Mukammal Karein",
        callCustomer: "Gahak ko Phone Karein",
        chatCustomer: "Chat Karein",
        emptyJobs: "Filhal koi naya order nahi aya.",
      },
      earnings: {
        title: "Aamdani aur Hisab",
        netBalance: "Baqaya Balance",
        grossRevenue: "Kul Kamai",
        companyDues: "Company ka Hissa",
        requestPayout: "Paisa Nikalwayein",
        submitProof: "Raseed Upload Karein",
        recentLedger: "Khata Record",
        filterAll: "Shuru se Ab Tak",
        filterCredits: "Jama Raqam",
        filterDebits: "Wasool Raqam",
      },
      ledger: {
        title: "Taye Shuda Rates",
        subtitle: "services ki fehrist",
        servicesListed: "Services ki Fehrist",
        customRates: "Makhsoos Rates",
      },
      settings: {
        title: "Partner Settings",
        vendorProfile: "Karobari Profile",
        staffManagement: "Technician Staff",
        languageSettings: "Zubaan (Urdu / English)",
        serviceRates: "Rates ki List",
        dutySchedule: "Kaam ke Auqat",
        supportDesk: "Helpline Support",
        logoutConfirm: "Kia aap Partner Account se bahar nikalna chahtay hain?",
      },
    },
    vendorOnboarding: {
      scanCnicTitle: "CNIC Document Scan",
      scanCnicSub: "Apne Pakistani CNIC ke samnay aur peechay ki saaf tasweerein upload karein",
      frontSideTitle: "CNIC Samnay Ka Hissa",
      frontSideDesc: "Naam, tasweer aur CNIC number saaf nazar aana chahiye",
      backSideTitle: "CNIC Peechay Ka Hissa",
      backSideDesc: "Ghar ka pata aur barcode saaf nazar aana chahiye",
      scanDocument: "Document Scan Karein",
      takePhoto: "Tasweer Lein",
      chooseGallery: "Gallery se Chunein",
      uploadAndScanBtn: "Upload karein aur AI se scan karein",
      scanningNotice: "CNIC upload aur scan ho raha hai...",
      frontRequired: "CNIC ka samnay ka hissa upload karna zaroori hai",
      backRequired: "CNIC ka peechay ka hissa upload karna zaroori hai",
      scanSuccess: "CNIC scan ho gaya! Neechay apni details check karein.",
      verifyDetailsTitle: "Apni Maloomat ki Tasdeeq Karein",
      verifyDetailsSub: "AI se parhi gayi details, apna shehar aur kaam muntakhib karein",
      fullName: "Pura Naam (CNIC ke mutabiq)",
      fatherName: "Walid ka Naam",
      cnicNumber: "CNIC Number (13 Hindsey)",
      dob: "Tareekh-e-Pedaish",
      gender: "Jins",
      male: "Mard",
      female: "Khatoon",
      currentAddress: "Mojooda Pata",
      selectCity: "Kaam ka Shehar",
      citySearchPlaceholder: "Shehar talash karein (maslan Lahore, Karachi)",
      workCategoriesTitle: "Aap Kia Kaam Kar Saktay Hain?",
      workCategoriesSub: "Tamam mutaaliqa services muntakhib karein jo aap kar saktay hain",
      experience: "Tajurba (Saal)",
      experiencePlaceholder: "Maslan 3 Saal, 5+ Saal",
      saveAndContinue: "Mehfooz Karein aur Aglay Step par Jayein",
      cityRequired: "Barah-e-karam apna shehar muntakhib karein",
      categoriesRequired: "Kam az kam aik service category muntakhib karein",
      addressRequired: "Mojooda pata likhna zaroori hai",
      cnicRequired: "13-hindson ka sahih CNIC darj karein",
      nameRequired: "Pura naam darj karna zaroori hai",
    },
  },

  ur: {
    common: {
      continue: "آگے بڑھیں",
      back: "واپس",
      submit: "جمع کروائیں",
      cancel: "منسوخ",
      loading: "لوڈ ہو رہا ہے...",
      save: "محفوظ کریں",
      edit: "تبدیل کریں",
      next: "اگلا",
      skip: "چھوڑیں",
      upload: "اپلوڈ",
      camera: "کیمرہ",
      gallery: "گیلری",
      success: "کامیابی",
      error: "خرابی",
      required: "ضروری",
      change: "تبدیل کریں",
      retake: "دوبارہ لیں",
      search: "تلاش کریں...",
      logout: "لاگ آؤٹ",
      viewAll: "سب دیکھیں",
      noServicesAvailable: "کوئی خدمات دستیاب نہیں ہیں",
      noTrendingServices: "کوئی مقبول خدمات نہیں ہیں",
      categories: "اقسام",
      recentActivity: "حالیہ سرگرمیاں",
      comingSoon: "جلد آ رہا ہے",
      underDevelopment: "زیرِ تیاری",
      walletComingSoonDescription: "ہم آپ کے لیے بہتر والیٹ تیار کر رہے ہیں۔ مزید معلومات جلد ملیں گی!",
      noServicesFound: "کوئی خدمات نہیں ملیں",
      tryAdjustSearch: "اپنی تلاش میں تبدیلی کریں",
      clearSearch: "تلاش صاف کریں",
      status: "حیثیت",
      details: "تفصیلات",
      close: "بند کریں",
      refresh: "تازہ کریں",
      moreInformation: "مزید معلومات",
      total: "کل",
      checkout: "چیک آؤٹ",
      items: "اشیاء",
    },
    language: {
      selectLanguage: "اپنی زبان منتخب کریں",
      subtitle: "آگے بڑھنے کے لیے اپنی پسندیدہ زبان منتخب کریں",
      english: "English",
      romanUrdu: "Roman Urdu (آسان)",
      urdu: "اردو (Urdu)",
      continue: "آگے بڑھیں",
      switchPrompt: "ایپ کی زبان منتخب کریں",
    },
    roleSelection: {
      welcomeTitle: "ٹاسکر کمپنی میں خوش آمدید",
      welcomeSubtitle: "پاکستان کی معتبر ترین ہوم اور کمرشل سروسز",
      customerTitle: "سروس بک کریں",
      customerDesc: "اے سی، الیکٹریشن، پلمبنگ اور دیگر کاموں کے لیے ماہر کاریگر بلائیں",
      vendorTitle: "بطور پارٹنر / کاریگر شامل ہوں",
      vendorDesc: "روزانہ کام حاصل کریں اور محفوظ ادائیگیوں سے اپنا کاروبار بڑھائیں",
      switchLanguage: "زبان تبدیل کریں",
    },
    auth: {
      signIn: "سائن ان کریں",
      verifiedExperts: "تصدیق شدہ ماہرین",
      customerTagline: "چند منٹوں میں سروس حاصل کریں",
      vendorTagline: "روزانہ کام اور بہترین آمدنی",
      partnerProgram: "تصدیق شدہ پارٹنر",
      enterPhone: "موبائل نمبر درج کریں",
      sendViaWhatsApp: "واٹس ایپ پر کوڈ بھیجیں",
      sendViaSms: "ایس ایم ایس پر کوڈ بھیجیں",
      termsNotice: "آگے بڑھ کر آپ متفق ہیں",
      privacyPolicy: "پرائیویسی پالیسی",
      termsOfService: "شرائط و ضوابط",
      verifyOtpTitle: "موبائل نمبر کی تصدیق",
      codeSentTo: "ہم نے 6 ہندسوں کا کوڈ بھیجا ہے",
      enterDigitsPrompt: "6 ہندسوں کا کوڈ درج کریں",
      resendIn: "دوبارہ کوڈ بھیجیں",
      resendCode: "دوبارہ کوڈ بھیجیں",
      verifyAndSignIn: "تصدیق اور سائن ان کریں",
      changeNumber: "نمبر تبدیل کریں",
      loginSuccess: "کامیابی سے سائن ان ہو گیا!",
    },
    customer: {
      tabs: {
        home: "ہوم",
        services: "خدمات",
        orders: "آرڈرز",
        wallet: "والیٹ",
        settings: "ترتیبات",
      },
      home: {
        greeting: "ماہر کاریگر تلاش کریں",
        searchPlaceholder: "اے سی، الیکٹریشن، پلمبر تلاش کریں...",
        mainCategories: "اہم شعبہ جات",
        trendingServices: "مقبول خدمات",
        bookNow: "ابھی بک کریں",
        trackJob: "جاری کام کی لائیو معلومات",
        freeInstallation: "مفت کمپنی انسٹالیشن",
        commercialInquiries: "کمرشل اور کمپنی معاہدے",
        emergencySupport: "24/7 ایمرجنسی ہیلپ لائن",
      },
      services: {
        title: "ہماری خدمات",
        availableCount: "خدمات دستیاب ہیں",
        searchPlaceholder: "خدمات تلاش کریں...",
        emptyServices: "آپ کی تلاش کے مطابق کوئی سروس نہیں ملی",
        sortBy: "ترتیب دیں:",
        priceLowToHigh: "قیمت: کم سے زیادہ",
        priceHighToLow: "قیمت: زیادہ سے کم",
        mostPopular: "سب سے مقبول",
        availableServices: "دستیاب خدمات",
        serviceCount: "سروس",
        servicesCount: "سروسز",
        noMatchSearch: "تلاش سے مطابقت رکھنے والی کوئی سروس نہیں ملی",
        serviceNotFound: "سروس نہیں ملی",
      },
      orders: {
        title: "میرے سروس آرڈرز",
        active: "جاری",
        history: "سابقہ",
        filterAll: "تمام",
        pending: "زیرِ انتظار",
        allocated: "مختص کردہ",
        inProgress: "جاری",
        completed: "مکمل",
        cancelled: "منسوخ",
        emptyTitle: "ابھی تک کوئی آرڈر نہیں",
        emptyMessage: "آپ نے ابھی تک کوئی آرڈر نہیں دیا۔",
        emptyFilteredTitle: "کوئی {{status}} آرڈر نہیں",
        emptyFilteredMessage: "آپ کے پاس کوئی {{status}} آرڈر نہیں ہے۔",
        loadingMore: "مزید آرڈرز لوڈ ہو رہے ہیں...",
        noMoreOrders: "مزید آرڈرز نہیں ہیں",
        browseServices: "خدمات دیکھیں",
        emptyActive: "فی الحال کوئی آرڈر جاری نہیں ہے۔",
        emptyHistory: "کوئی سابقہ آرڈر نہیں ملا۔",
        orderNo: "آرڈر نمبر",
        scheduledAt: "مقررہ وقت",
        assignedTechnician: "مقرر کردہ کاریگر",
        totalAmount: "کل رقم",
        viewDetails: "تفصیلات دیکھیں",
        trackLive: "کاریگر کو لائیو ٹریک کریں",
      },
      wallet: {
        title: "ٹاسکر والیٹ",
        availableBalance: "دستیاب بیلنس",
        topUp: "رقم شامل کریں",
        giftVouchers: "میرے واؤچرز",
        transactionHistory: "لین دین کی تاریخ",
        noTransactions: "کوئی لین دین درج نہیں ہے۔",
      },
      settings: {
        title: "پروفائل اور ترتیبات",
        personalInfo: "ذاتی معلومات",
        savedAddresses: "محفوظ کردہ پتے",
        languageSettings: "ایپلی کیشن کی زبان",
        notificationPreferences: "نوٹیفکیشن کی ترتیبات",
        helpSupport: "مدد اور کسٹمر سپورٹ",
        privacyPolicy: "قوانین اور پرائیویسی پالیسی",
        logoutConfirm: "کیا آپ واقعی لاگ آؤٹ کرنا چاہتے ہیں؟",
      },
    },
    vendor: {
      tabs: {
        dashboard: "ڈیش بورڈ",
        jobs: "آرڈرز",
        earnings: "آمدنی",
        ledger: "کھاتہ",
        chat: "چیٹ",
        settings: "ترتیبات",
      },
      dashboard: {
        welcome: "پارٹنر ڈیش بورڈ",
        goOnline: "آن لائن ہوں",
        goOffline: "آف لائن ہوں",
        onlineState: "آپ آن لائن ہیں اور کام موصول کر رہے ہیں",
        offlineState: "آپ آف لائن ہیں",
        takeDailySelfie: "روزانہ کی سیلفی تصدیق",
        selfieVerified: "آج کی سیلفی تصدیق شدہ",
        todayEarnings: "آج کی آمدنی",
        completedJobs: "مکمل کام",
        activeJobs: "جاری کام",
        efficiencyRate: "کامیابی کی شرح",
        quickActions: "فوری کام",
        recentDispatches: "نئے موصولہ آرڈرز",
      },
      jobs: {
        title: "موصولہ آرڈرز",
        pending: "نئے",
        inProgress: "جاری",
        completed: "مکمل",
        allJobs: "تمام کام",
        customerName: "کسٹمر",
        address: "مقام",
        acceptJob: "کام قبول کریں",
        declineJob: "انکار کریں",
        startTrip: "راستہ شروع کریں",
        reachedLocation: "مقام پر پہنچ گئے",
        startWork: "کام شروع کریں",
        completeJob: "کام مکمل کریں",
        callCustomer: "کسٹمر کو کال کریں",
        chatCustomer: "پیغام بھیجیں",
        emptyJobs: "فی الحال کوئی نیا کام تفویض نہیں ہے۔",
      },
      earnings: {
        title: "آمدنی اور حساب کتاب",
        netBalance: "خالص بیلنس",
        grossRevenue: "کل آمدنی",
        companyDues: "کمپنی کا واجب الادا حصہ",
        requestPayout: "ادائیگی کی درخواست کریں",
        submitProof: "ادائیگی کی رسید جمع کروائیں",
        recentLedger: "کھاتہ کا ریکارڈ",
        filterAll: "مکمل ریکارڈ",
        filterCredits: "جمع رقم",
        filterDebits: "منہا رقم",
      },
      ledger: {
        title: "مقررہ نرخ نامہ",
        subtitle: "خدمات کی فہرست",
        servicesListed: "کل خدمات",
        customRates: "مخصوص نرخ",
      },
      settings: {
        title: "پارٹنر ترتیبات",
        vendorProfile: "کاروباری پروفائل",
        staffManagement: "کاریگر عملہ",
        languageSettings: "ایپ کی زبان (اردو / انگریزی)",
        serviceRates: "ریٹ لسٹ",
        dutySchedule: "اوقات کار",
        supportDesk: "پارٹنر سپورٹ ہیلپ لائن",
        logoutConfirm: "کیا آپ پارٹنر اکاؤنٹ سے لاگ آؤٹ کرنا چاہتے ہیں؟",
      },
    },
    vendorOnboarding: {
      scanCnicTitle: "شناختی کارڈ اسکین",
      scanCnicSub: "اپنے پاکستانی شناختی کارڈ کے دونوں اطراف کی واضح تصاویر اپلوڈ کریں",
      frontSideTitle: "شناختی کارڈ کا سامنے کا حصہ",
      frontSideDesc: "نام، تصویر اور شناختی کارڈ نمبر واضح نظر آنا چاہیے",
      backSideTitle: "شناختی کارڈ کا پچھلا حصہ",
      backSideDesc: "رہائشی پتہ اور بارکوڈ واضح نظر آنا چاہیے",
      scanDocument: "دستاویز اسکین کریں",
      takePhoto: "تصویر لیں",
      chooseGallery: "گیلری سے منتخب کریں",
      uploadAndScanBtn: "اپلوڈ کریں اور اے آئی سے اسکین کریں",
      scanningNotice: "شناختی کارڈ اپلوڈ اور اسکین ہو رہا ہے...",
      frontRequired: "شناختی کارڈ کا سامنے کا حصہ ضروری ہے",
      backRequired: "شناختی کارڈ کا پچھلا حصہ ضروری ہے",
      scanSuccess: "شناختی کارڈ اسکین ہو گیا! نیچے اپنی تفصیلات کی تصدیق کریں۔",
      verifyDetailsTitle: "اپنی تفصیلات کی تصدیق کریں",
      verifyDetailsSub: "شناختی کارڈ کی تفصیلات، اپنا شہر اور اپنے ہنر منتخب کریں",
      fullName: "مکمل نام (شناختی کارڈ کے مطابق)",
      fatherName: "والد کا نام",
      cnicNumber: "شناختی کارڈ نمبر (13 ہندسے)",
      dob: "تاریخ پیدائش",
      gender: "جنس",
      male: "مرد",
      female: "خاتون",
      currentAddress: "موجودہ رہائشی پتہ",
      selectCity: "کام کا شہر",
      citySearchPlaceholder: "شہر تلاش کریں (مثلاً لاہور، کراچی)",
      workCategoriesTitle: "آپ کیا کیا کام کر سکتے ہیں؟",
      workCategoriesSub: "وہ تمام شعبے منتخب کریں جن میں آپ خدمات فراہم کر سکتے ہیں",
      experience: "تجربہ (سال)",
      experiencePlaceholder: "مثلاً 3 سال، 5+ سال",
      saveAndContinue: "محفوظ کریں اور اگلے مرحلے پر جائیں",
      cityRequired: "براہ کرم اپنا شہر منتخب کریں",
      categoriesRequired: "کم از کم ایک شعبہ منتخب کریں",
      addressRequired: "موجودہ پتہ درج کرنا ضروری ہے",
      cnicRequired: "درست 13 ہندسوں کا شناختی کارڈ نمبر ضروری ہے",
      nameRequired: "مکمل نام درج کرنا ضروری ہے",
    },
  },
};
