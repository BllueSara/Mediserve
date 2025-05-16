// Language management system
const languageManager = {
    currentLang: 'en',
    translations: {
        en: {
            // Navigation
            'home': 'Home',
            'profile': 'Profile',
            'notifications': 'Notifications',
            'logs': 'Logs',
            'language': 'Language',
            'current_language': 'English',
            'english': 'English',
            'arabic': 'عربي',
            'back': 'Back',
            
            // Common
            'welcome': 'Welcome',
            'please_enter_info': 'Please enter your information',
            'username_email_id': 'Username / Email / ID',
            'password': 'Password',
            'email': 'Email',
            'sign_in': 'Sign In',
            'sign_up': 'Sign Up',
            'create_account': 'Create Account',
            'if_you_have_account': 'If you already have an account',
            'if_you_new': 'If you\'re new here, create an account',
            'select_department': 'Select Department',
            'search_department': 'Search department...',
            'submit': 'Submit',
            'cancel': 'Cancel',
            'save_changes': 'Save Changes',
            
            // Home Page
            'enterprise_solutions': 'Enterprise Technology Solutions',
            'comprehensive_services': 'Comprehensive technical services for modern businesses, empowering your digital transformation with cutting-edge solutions.',
            'technical_support': 'Technical Support',
            'support_desc': '24/7 expert technical assistance for all your IT infrastructure needs',
            'security_solutions': 'Security Solutions',
            'security_desc': 'Advanced cybersecurity measures to protect your digital assets',
            'network_infrastructure': 'Network Infrastructure',
            'network_desc': 'Robust networking solutions for seamless connectivity',
            'application_services': 'Application Services',
            'app_desc': 'Custom application development and maintenance',
            'data_center': 'Data Center Solutions',
            'data_center_desc': 'State-of-the-art data center management and hosting',
            'admin_panel': 'Admin Permissions',
            'admin_desc': 'Manage system users, logs, and advanced settings',
            
            // Reports
            'choose_reports_type': 'Choose Reports Type',
            'select_reports_type': 'Select the appropriate reports type for your request',
            'internal_report': 'Internal Report',
            'external_report': 'External Report',
            'for_internal_team': 'For internal team members and employees',
            'for_external_partners': 'For clients and external partners',
            
            // Maintenance
            'maintenance': 'Maintenance',
            'processor_generation': 'Processor Generation',
            'select_generation': 'Select generation',
            'search_generation': 'Search generation...',
            'cpu': 'CPU',
            'select_processor': 'Select processor',
            'search_cpu': 'Search CPU...',
            'ram': 'RAM',
            
            // Tickets
            'choose_ticket_type': 'Choose Ticket Type',
            'select_ticket_type': 'Select the appropriate ticket type for your request',
            'technical_support_desc': 'Get help with technical issues and system problems',
            'maintenance_desc': 'Request hardware maintenance or repairs',
            'software': 'Software',
            'software_desc': 'Report software issues or request new features',
            'network': 'Network',
            'network_desc': 'Report network connectivity issues or request network changes',
            
            // Notifications
            'clear_all': 'Clear all',
            'view_all': 'View All Notifications',
            'mark_all_read': 'Mark All as Read',
            'all_notifications': 'All Notifications',
            'unread': 'Unread',
            'read': 'Read',
            'system_update': 'System Update',
            'system_update_desc': 'A new system update is available. Please restart your computer to apply the changes.',
            'maintenance_complete': 'Maintenance Complete',
            'maintenance_complete_desc': 'The scheduled maintenance has been completed successfully.',
            'security_alert': 'Security Alert',
            'security_alert_desc': 'New security patches have been installed. Your system is now more secure.',
            
            // Profile
            'personal_info': 'Personal Information',
            'account_settings': 'Account Settings',
            'security': 'Security',
            'preferences': 'Preferences',
            'full_name': 'Full Name',
            'department': 'Department',
            'position': 'Position',
            'username': 'Username',
            'two_factor_auth': 'Two-Factor Authentication',
            'login_notifications': 'Login Notifications',
            'theme': 'Theme',
            'light': 'Light',
            'dark': 'Dark'
        },
        ar: {
            // Navigation
            'home': 'الرئيسية',
            'profile': 'الملف الشخصي',
            'notifications': 'الإشعارات',
            'logs': 'السجلات',
            'language': 'اللغة',
            'current_language': 'عربي',
            'english': 'English',
            'arabic': 'عربي',
            'back': 'رجوع',
            
            // Common
            'welcome': 'مرحباً',
            'please_enter_info': 'الرجاء إدخال معلوماتك',
            'username_email_id': 'اسم المستخدم / البريد الإلكتروني / الرقم الوظيفي',
            'password': 'كلمة المرور',
            'email': 'البريد الإلكتروني',
            'sign_in': 'تسجيل الدخول',
            'sign_up': 'إنشاء حساب',
            'create_account': 'إنشاء حساب',
            'if_you_have_account': 'إذا كان لديك حساب بالفعل',
            'if_you_new': 'إذا كنت جديداً هنا، قم بإنشاء حساب',
            'select_department': 'اختر القسم',
            'search_department': 'ابحث عن قسم...',
            'submit': 'إرسال',
            'cancel': 'إلغاء',
            'save_changes': 'حفظ التغييرات',
            
            // Home Page
            'enterprise_solutions': 'حلول تكنولوجيا المؤسسات',
            'comprehensive_services': 'خدمات تقنية شاملة للشركات الحديثة، تمكين التحول الرقمي الخاص بك مع حلول متطورة',
            'technical_support': 'الدعم الفني',
            'support_desc': 'مساعدة فنية متخصصة على مدار الساعة لجميع احتياجات البنية التحتية لتكنولوجيا المعلومات',
            'security_solutions': 'حلول الأمن السيبراني',
            'security_desc': 'إجراءات أمن سيبراني متقدمة لحماية أصولك الرقمية',
            'network_infrastructure': 'البنية التحتية للشبكات',
            'network_desc': 'حلول شبكات قوية للاتصال السلس',
            'application_services': 'خدمات التطبيقات',
            'app_desc': 'تطوير وصيانة التطبيقات المخصصة',
            'data_center': 'حلول مراكز البيانات',
            'data_center_desc': 'إدارة واستضافة مراكز البيانات المتطورة',
            'admin_panel': 'صلاحيات المشرف',
            'admin_desc': 'إدارة مستخدمي النظام والسجلات والإعدادات المتقدمة',
            
            // Reports
            'choose_reports_type': 'اختر نوع التقارير',
            'select_reports_type': 'اختر نوع التقرير المناسب لطلبك',
            'internal_report': 'تقرير داخلي',
            'external_report': 'تقرير خارجي',
            'for_internal_team': 'لأعضاء الفريق الداخلي والموظفين',
            'for_external_partners': 'للعملاء والشركاء الخارجيين',
            
            // Maintenance
            'maintenance': 'الصيانة',
            'processor_generation': 'جيل المعالج',
            'select_generation': 'اختر الجيل',
            'search_generation': 'ابحث عن جيل...',
            'cpu': 'المعالج',
            'select_processor': 'اختر المعالج',
            'search_cpu': 'ابحث عن معالج...',
            'ram': 'الذاكرة العشوائية',
            
            // Tickets
            'choose_ticket_type': 'اختر نوع التذكرة',
            'select_ticket_type': 'اختر نوع التذكرة المناسب لطلبك',
            'technical_support_desc': 'احصل على المساعدة في المشكلات الفنية ومشكلات النظام',
            'maintenance_desc': 'طلب صيانة أو إصلاح الأجهزة',
            'software': 'البرمجيات',
            'software_desc': 'الإبلاغ عن مشكلات البرمجيات أو طلب ميزات جديدة',
            'network': 'الشبكة',
            'network_desc': 'الإبلاغ عن مشكلات الاتصال بالشبكة أو طلب تغييرات الشبكة',
            
            // Notifications
            'clear_all': 'مسح الكل',
            'view_all': 'عرض كل الإشعارات',
            'mark_all_read': 'تحديد الكل كمقروء',
            'all_notifications': 'كل الإشعارات',
            'unread': 'غير مقروء',
            'read': 'مقروء',
            'system_update': 'تحديث النظام',
            'system_update_desc': 'يتوفر تحديث جديد للنظام. يرجى إعادة تشغيل جهاز الكمبيوتر لتطبيق التغييرات.',
            'maintenance_complete': 'اكتملت الصيانة',
            'maintenance_complete_desc': 'تم إكمال الصيانة المجدولة بنجاح.',
            'security_alert': 'تنبيه أمني',
            'security_alert_desc': 'تم تثبيت تحديثات أمنية جديدة. نظامك الآن أكثر أماناً.',
            
            // Profile
            'personal_info': 'المعلومات الشخصية',
            'account_settings': 'إعدادات الحساب',
            'security': 'الأمان',
            'preferences': 'التفضيلات',
            'full_name': 'الاسم الكامل',
            'department': 'القسم',
            'position': 'المنصب',
            'username': 'اسم المستخدم',
            'two_factor_auth': 'المصادقة الثنائية',
            'login_notifications': 'إشعارات تسجيل الدخول',
            'theme': 'المظهر',
            'light': 'فاتح',
            'dark': 'داكن'
        }
    },

    // Initialize language
    init() {
        // Load saved language preference or default to English
        this.currentLang = localStorage.getItem('language') || 'en';
        this.applyLanguage();
    },

    // Switch language
    switchLanguage() {
        this.currentLang = this.currentLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('language', this.currentLang);
        this.applyLanguage();
    },

    // Apply language to the page
    applyLanguage() {
        // Set HTML lang attribute
        document.documentElement.lang = this.currentLang;
        
        // Set text direction
        document.documentElement.dir = this.currentLang === 'ar' ? 'rtl' : 'ltr';
        
        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[this.currentLang][key]) {
                element.textContent = this.translations[this.currentLang][key];
            }
        });

        // Update all elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            if (this.translations[this.currentLang][key]) {
                element.placeholder = this.translations[this.currentLang][key];
            }
        });

        // Update language button text
        const langButton = document.querySelector('.lang-switch-btn');
        if (langButton) {
            langButton.textContent = this.currentLang === 'en' ? 'ع' : 'En';
        }
    }
};

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    languageManager.init();
    
    // Add click event listener to language switch button
    const langButton = document.querySelector('.lang-switch-btn');
    if (langButton) {
        langButton.addEventListener('click', () => {
            languageManager.switchLanguage();
        });
    }

    // Add click event listeners to language dropdown options
    document.querySelectorAll('[data-i18n="english"], [data-i18n="arabic"]').forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const newLang = option.getAttribute('data-i18n') === 'english' ? 'en' : 'ar';
            if (newLang !== languageManager.currentLang) {
                languageManager.currentLang = newLang;
                localStorage.setItem('language', newLang);
                languageManager.applyLanguage();
            }
        });
    });
});
