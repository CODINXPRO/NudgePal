import { Language } from '../contexts/AppContext';

export interface Translations {
  // Onboarding
  welcome: string;
  welcomeSubtitle: string;
  nameQuestion: string;
  namePlaceholder: string;
  selectLanguage: string;
  getStarted: string;
  
  // Navigation
  myDay: string;
  myBills: string;
  todayOverview: string;
  habitsRoutines: string;
  billsPayments: string;
  weeklyReports: string;
  settings: string;
  themesAppearance: string;
  backupExport: string;
  helpTips: string;
  calendar: string;
  hydration: string;
  current: string;
  menuTitle: string;
  
  // Habits
  habits: string;
  hydrate: string;
  eyeBreaks: string;
  movementBreaks: string;
  morningCheckin: string;
  eveningCheckin: string;
  addCustomHabit: string;
  completeHabit: string;
  snooze: string;
  
  // Bills
  bills: string;
  noBillsAdded: string;
  addBill: string;
  billName: string;
  dueDate: string;
  frequency: string;
  remindMe: string;
  monthly: string;
  quarterly: string;
  yearly: string;
  daysBefore: string;
  
  // Hydration
  justDrank: string;
  waterGoal: string;
  minutesLeft: string;
  
  // Hydration Reminder Names
  morningGlass: string;
  afterBreakfast: string;
  midMorningBoost: string;
  beforeLunch: string;
  afternoonRefresh: string;
  afterDinner: string;
  beforeBed: string;
  
  // Notifications
  timeToHydrate: string;
  eyeBreakTime: string;
  movementTime: string;
  billReminder: string;
  
  // Common
  save: string;
  cancel: string;
  done: string;
  next: string;
  back: string;
  edit: string;
  delete: string;
  confirm: string;
  
  // Time
  minutes: string;
  hours: string;
  days: string;
  today: string;
  tomorrow: string;
  
  // Greetings
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  hi: string;
  
  // Extra hydration UI
  clickRemindersHint: string;
  notTimeYetTitle: string;
  notTimeYetNextSipText: string;
  notTimeYetBody: string;
  gotIt: string;
  onlyLogWhenTime: string;
  confirmDidYouDrinkPrefix: string;
  confirmYesText: string;
  confirmNoText: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Onboarding
    welcome: 'Welcome to NudgePal!',
    welcomeSubtitle: 'Your personal companion for healthy habits and timely reminders',
    nameQuestion: 'What should we call you?',
    namePlaceholder: 'Enter your name',
    selectLanguage: 'Select your language',
    getStarted: 'Get Started',
    
    // Navigation
    myDay: 'My Day',
    myBills: 'My Bills',
    todayOverview: "Today's Overview",
    habitsRoutines: 'Habits & Routines',
    billsPayments: 'Bills & Payments',
    weeklyReports: 'Weekly Reports',
    settings: 'Settings',
    themesAppearance: 'Themes & Appearance',
    backupExport: 'Backup & Export',
    helpTips: 'Help & Tips',
    calendar: 'Calendar',
    current: 'Current',
    menuTitle: 'Menu',
    
    // Habits
    habits: 'Habits',
    hydrate: 'Hydrate',
    eyeBreaks: '20-20-20 Eye Breaks',
    movementBreaks: 'Movement Breaks',
    morningCheckin: 'Morning Check-in',
    eveningCheckin: 'Evening Check-in',
    addCustomHabit: 'Add Custom Habit',
    completeHabit: 'Mark Complete',
    snooze: 'Snooze',
    
    // Bills
    bills: 'Bills',
    noBillsAdded: 'No Bills Added Yet',
    addBill: 'Add Bill',
    billName: "What's this bill called?",
    dueDate: 'When is it due?',
    frequency: 'How often?',
    remindMe: 'Remind me...',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    daysBefore: 'days before',
    
    // Hydration
    hydration: 'Hydration',
    justDrank: 'I Just Drank',
    waterGoal: 'Water Goal',
    minutesLeft: 'minutes left',
    
    // Hydration Reminder Names
    morningGlass: 'Morning glass',
    afterBreakfast: 'After breakfast',
    midMorningBoost: 'Mid-morning boost',
    beforeLunch: 'Before lunch',
    afternoonRefresh: 'Afternoon refresh',
    afterDinner: 'After dinner',
    beforeBed: 'Before bed',
    
    // Notifications
    timeToHydrate: 'time to hydrate!',
    eyeBreakTime: "time for a 20-20-20 eye break!",
    movementTime: 'time to move around!',
    billReminder: 'bill reminder',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    edit: 'Edit',
    delete: 'Delete',
    confirm: 'Confirm',
    
    // Time
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    today: 'Today',
    tomorrow: 'Tomorrow',
    
    // Greetings
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
    hi: 'Hi',
    // Extra hydration UI
    clickRemindersHint: 'Click reminders to log water',
    notTimeYetTitle: 'Not time yet —',
    notTimeYetNextSipText: 'your next sip is at',
    notTimeYetBody: 'Come back later to log this sip! 💙',
    gotIt: 'Got it! ✨',
    onlyLogWhenTime: 'You can only log water when it\'s time!',
    confirmDidYouDrinkPrefix: 'Did you really drink the',
    confirmYesText: '🎉 Yes, I did!',
    confirmNoText: 'Oops, not yet',
  },
  
  fr: {
    // Onboarding
    welcome: 'Bienvenue dans NudgePal !',
    welcomeSubtitle: 'Votre compagnon personnel pour des habitudes saines et des rappels opportuns',
    nameQuestion: 'Comment devons-nous vous appeler ?',
    namePlaceholder: 'Entrez votre nom',
    selectLanguage: 'Sélectionnez votre langue',
    getStarted: 'Commencer',
    
    // Navigation
    myDay: 'Ma Journée',
    myBills: 'Mes Factures',
    todayOverview: "Aperçu d'aujourd'hui",
    habitsRoutines: 'Habitudes & Routines',
    billsPayments: 'Factures & Paiements',
    weeklyReports: 'Rapports Hebdomadaires',
    settings: 'Paramètres',
    themesAppearance: 'Thèmes & Apparence',
    backupExport: 'Sauvegarde & Export',
    helpTips: 'Aide & Conseils',
    calendar: 'Calendrier',
    current: 'Actuel',
    menuTitle: 'Menu',
    
    // Habits
    habits: 'Habitudes',
    hydrate: 'Hydratation',
    eyeBreaks: 'Pauses Oculaires 20-20-20',
    movementBreaks: 'Pauses Mouvement',
    morningCheckin: 'Check-in Matinal',
    eveningCheckin: 'Check-in du Soir',
    addCustomHabit: 'Ajouter Habitude Personnalisée',
    completeHabit: 'Marquer Terminé',
    snooze: 'Reporter',
    
    // Bills
    bills: 'Factures',
    noBillsAdded: 'Aucune Facture Ajoutée',
    addBill: 'Ajouter Facture',
    billName: 'Comment cette facture s\'appelle-t-elle ?',
    dueDate: 'Quand est-elle due ?',
    frequency: 'À quelle fréquence ?',
    remindMe: 'Me rappeler...',
    monthly: 'Mensuel',
    quarterly: 'Trimestriel',
    yearly: 'Annuel',
    daysBefore: 'jours avant',
    
    // Hydration
    hydration: 'Hydratation',
    justDrank: 'Je Viens de Boire',
    waterGoal: 'Objectif Eau',
    minutesLeft: 'minutes restantes',
    
    // Hydration Reminder Names
    morningGlass: 'Verre du matin',
    afterBreakfast: 'Après le petit-déjeuner',
    midMorningBoost: 'Coup de pouce du milieu de matinée',
    beforeLunch: 'Avant le déjeuner',
    afternoonRefresh: 'Rafraîchissement de l\'après-midi',
    afterDinner: 'Après le dîner',
    beforeBed: 'Avant le coucher',
    
    // Notifications
    timeToHydrate: 'il est temps de s\'hydrater !',
    eyeBreakTime: "temps pour une pause oculaire 20-20-20 !",
    movementTime: 'temps de bouger !',
    billReminder: 'rappel de facture',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    done: 'Terminé',
    next: 'Suivant',
    back: 'Retour',
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    
    // Time
    minutes: 'minutes',
    hours: 'heures',
    days: 'jours',
    today: "Aujourd'hui",
    tomorrow: 'Demain',
    
    // Greetings
    goodMorning: 'Bonjour',
    goodAfternoon: 'Bon après-midi',
    goodEvening: 'Bonsoir',
    hi: 'Salut',
    // Extra hydration UI
    clickRemindersHint: 'Cliquez sur les rappels pour enregistrer de l\'eau',
    notTimeYetTitle: 'Pas encore l\'heure —',
    notTimeYetNextSipText: 'votre prochaine gorgée est à',
    notTimeYetBody: 'Revenez plus tard pour enregistrer cette gorgée ! 💙',
    gotIt: 'Compris ! ✨',
    onlyLogWhenTime: 'Vous ne pouvez enregistrer de l\'eau que lorsqu\'il est temps !',
    confirmDidYouDrinkPrefix: 'هل شربت حقًا',
    confirmYesText: '🎉 Oui, je l\'ai fait !',
    confirmNoText: 'Oups, pas encore',
  },
  
  ar: {
    // Onboarding
    welcome: 'مرحباً بك في نودج بال!',
    welcomeSubtitle: 'رفيقك الشخصي للعادات الصحية والتذكيرات في الوقت المناسب',
    nameQuestion: 'ماذا نناديك؟',
    namePlaceholder: 'أدخل اسمك',
    selectLanguage: 'اختر لغتك',
    getStarted: 'ابدأ',
    
    // Navigation
    myDay: 'يومي',
    myBills: 'فواتيري',
    todayOverview: 'نظرة عامة على اليوم',
    habitsRoutines: 'العادات والروتين',
    billsPayments: 'الفواتير والمدفوعات',
    weeklyReports: 'التقارير الأسبوعية',
    settings: 'الإعدادات',
    themesAppearance: 'الثيمات والمظهر',
    backupExport: 'النسخ الاحتياطي والتصدير',
    helpTips: 'المساعدة والنصائح',
    calendar: 'التقويم',
    current: 'الحالية',
    menuTitle: 'القائمة',
    
    // Habits
    habits: 'العادات',
    hydrate: 'الترطيب',
    eyeBreaks: 'استراحة العين 20-20-20',
    movementBreaks: 'استراحة الحركة',
    morningCheckin: 'تسجيل الدخول الصباحي',
    eveningCheckin: 'تسجيل الدخول المسائي',
    addCustomHabit: 'إضافة عادة مخصصة',
    completeHabit: 'وضع علامة مكتمل',
    snooze: 'تأجيل',
    
    // Bills
    bills: 'الفواتير',
    noBillsAdded: 'لم تتم إضافة فواتير بعد',
    addBill: 'إضافة فاتورة',
    billName: 'ما اسم هذه الفاتورة؟',
    dueDate: 'متى موعد الاستحقاق؟',
    frequency: 'كم مرة؟',
    remindMe: 'ذكرني...',
    monthly: 'شهرياً',
    quarterly: 'ربع سنوي',
    yearly: 'سنوياً',
    daysBefore: 'أيام قبل',
    
    // Hydration
    hydration: 'الترطيب',
    justDrank: 'لقد شربت للتو',
    waterGoal: 'هدف الماء',
    minutesLeft: 'دقائق متبقية',
    
    // Hydration Reminder Names
    morningGlass: 'كوب الصباح',
    afterBreakfast: 'بعد الإفطار',
    midMorningBoost: 'تعزيز منتصف الصباح',
    beforeLunch: 'قبل الغداء',
    afternoonRefresh: 'انتعاش الظهيرة',
    afterDinner: 'بعد العشاء',
    beforeBed: 'قبل النوم',
    
    // Notifications
    timeToHydrate: 'حان وقت الترطيب!',
    eyeBreakTime: "حان وقت استراحة العين 20-20-20!",
    movementTime: 'حان وقت الحركة!',
    billReminder: 'تذكير بالفاتورة',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    done: 'تم',
    next: 'التالي',
    back: 'رجوع',
    edit: 'تعديل',
    delete: 'حذف',
    confirm: 'تأكيد',
    
    // Time
    minutes: 'دقائق',
    hours: 'ساعات',
    days: 'أيام',
    today: 'اليوم',
    tomorrow: 'غداً',
    
    // Greetings
    goodMorning: 'صباح الخير',
    goodAfternoon: 'مساء الخير',
    goodEvening: 'مساء الخير',
    hi: 'مرحباً',
    // Extra hydration UI
    clickRemindersHint: 'انقر على التذكيرات لتسجيل الماء',
    notTimeYetTitle: 'لم يحن الوقت بعد —',
    notTimeYetNextSipText: 'المرة التالية للشرب هي في',
    notTimeYetBody: 'عُد لاحقاً لتسجل هذه الرشفة! 💙',
    gotIt: 'حسناً! ✨',
    onlyLogWhenTime: 'يمكنك تسجيل الماء فقط عند الموعد!',
    confirmDidYouDrinkPrefix: 'هل شربت فعلاً',
    confirmYesText: '🎉 نعم، شربت!',
    confirmNoText: 'أوه، ليس بعد',
  },
};

export default translations;