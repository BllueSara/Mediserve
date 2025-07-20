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
<<<<<<< HEAD
                        'cancel_emails': 'Cancel Emails',
            'can_cancel_emails': 'Can cancel emails',
            'cancel_notifications': 'Cancel Notifications',
            'can_cancel_notifications': 'Can cancel notifications',
            'cancel_logs': 'Cancel Logs',
            'can_cancel_logs': 'Can cancel logs',
=======
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
            'english': 'English',
            'arabic': 'Arabic',
            'back': 'Back',
            'additional_information': 'Additional Information',

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
            'technical_team_note': 'Technical Team Note',
            'issue_summary': 'Issue Summary',
            'no_matching_reports_found': 'No matching reports found',
            'download_replacement_report': ' Replacement Report',






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
            'dark': 'Dark',

            // Dashboard
            'dashboard': 'Dashboard',
            'dashboard_desc': 'Overview of system performance and key metrics',
            'active_monitors': '12 Active Monitors',

            // ... existing English translations ...
            // Dashboard translations
            'maintenance_dashboard': "Maintenance Dashboard",
            'last_updated': "Last updated",
            'completion_rates': "Completion Rates",
            'regular': "Regular",
            'internal': "Internal",
            'external': "External",
            'hover_for_details': "Hover over charts for details",
            'reports_overview': "Reports Overview",
            'internal_maintenance': "Internal Maintenance - Critical Devices",
            'external_maintenance': "Renewing device",
            'support_tickets': "Support Tickets",
            'maintenance_overview': "Maintenance Overview (Internal vs External)",
            'upcoming_maintenance': "Upcoming Maintenance - Regular Maintenance",
            'task': "Task",
            'date': "Date",
            'priority': "Priority",
            'type': "TYPE",
            'specs': "SPECS",
            'status': "STATUS",
            'open': "Open",
            'in_progress': "In Progress",
            'resolved': "Resolved",
            'from_last_week': "from last week",
            'no_upgrade_needed': "No upgrade needed for any devices.",
            'critical': "CRITICAL",
            'warning': "WARNING",
            'back': "Back",
            'home': "Home",
            // ... existing code ...

            // Reports
            'reports': 'Reports',
            'reports_desc': 'Detailed analytics and performance reports',
            'available_reports': '28 Available Reports',

            // Tickets
            'tickets': 'Tickets',
            'tickets_desc': 'Manage and track support requests',
            'open_tickets': '15 Open Tickets',

            // Maintenance
            'scheduled_tasks': '2 Scheduled Tasks',

            // Maintenance Types
            'regular_maintenance': 'Regular Maintenance',
            'regular_maintenance_desc': 'Schedule and perform routine maintenance tasks',
            'external_maintenance': 'External Maintenance',
            'external_maintenance_desc': 'Manage external maintenance requests and contractors',
            'add_maintenance': 'Add Maintenance',
            'add_maintenance_desc': 'Create new maintenance requests and tasks',
            'general_maintenance': 'General Maintenance',
            'general_maintenance_desc': 'View and manage all maintenance activities',

            // Regular Maintenance
            'scheduled_maintenance': 'Scheduled Maintenance',
            'device_name': 'Device Name',
            'maintenance_type': 'Maintenance Type',
            'preventive': 'Preventive',
            'corrective': 'Corrective',
            'schedule_date': 'Schedule Date',
            'description': 'Description',
            'add': 'Add',
            'record_maintenance': 'Record device maintenance information',
            'last_maintenance_date': 'Last Maintenance Date',
            'maintenance_frequency': 'Maintenance Frequency',
            'every_3_months': 'Every 3 months',
            'every_4_months': 'Every 4 months',
            'device_type': 'Device Type',
            'select_device_type': 'Select device type',
            'search_device_type': 'Search device type...',
            'section': 'Section',
            'select_section': 'Select section',
            'search_section': 'Search section...',
            'device_specifications': 'Device Specifications',
            'select_specification': 'Select specification',
            'search_specification': 'Search specification...',
            'problem_status': 'Problem Status',
            'select_problem_status': 'Select Problem Status',
            'search_problem_status': 'Search problem status...',
            'technical_name': 'Technical Name',
            'select_technical': 'Select Technical Engineer',
            'search_technical': 'Search technical...',
            'notes': 'Notes',
            'add_notes': 'Add any additional notes here...',
            'submit_maintenance': 'Submit Maintenance Log',
            'required': '*',
            'enter_device_specifications': 'Enter Device Specifications',
            'save': 'Save',
            'cancel': 'Cancel',
            'add_new': 'Add New',
            'new_value': 'New Value',
            'enter_new_value': 'Enter new value...',

            // External Maintenance
            'external_requests': 'External Requests',
            'add_external': 'Add External Request',
            'contractor_name': 'Contractor Name',
            'service_type': 'Service Type',
            'repair': 'Repair',
            'installation': 'Installation',
            'request_date': 'Request Date',

            // Add Maintenance
            'priority': 'Priority',
            'low': 'Low',
            'medium': 'Medium',
            'high': 'High',

            // General Maintenance
            'status': 'Status',
            'all': 'All',
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed',
            'date': 'Date',
            'actions': 'Actions',

            // External Maintenance Details
            'fill_maintenance_details': 'Please fill in the maintenance details below',
            'device_information': 'Device Information',
            'problem_type': 'Type of Problem',
            'select_problem_type': 'Select Problem type',
            'search_problem_type': 'Search problem type...',

            // Ticket Information
            'ticket_information': 'Ticket Information',
            'ticket_number': 'Ticket Number',
            'enter_ticket_number': 'Enter ticket number',
            'maintenance_manager': 'Maintenance Manager',
            'enter_manager_name': 'Enter manager name',
            'reporter_name': 'Reporter Name',
            'select_reporter': 'Select Reporter',
            'search_reporter': 'Search reporter...',
            'diagnosis_details': 'Diagnosis Details',
            'initial_diagnosis': 'Initial Diagnosis',
            'enter_initial_diagnosis': 'Enter initial diagnosis',
            'final_diagnosis': 'Final Diagnosis',
            'enter_final_diagnosis': 'Enter final diagnosis',
            'submit_form': 'Submit Form',
            'issue_summary': 'Issue Summary',

            // Add Maintenance Details
            'enter_device_name': 'Enter device name',
            'computer': 'Computer',
            'printer': 'Printer',
            'network': 'Network Device',
            'other': 'Other',
            'location': 'Location',
            'enter_location': 'Enter location',
            'assigned_to': 'Assigned To',
            'select_technician': 'Select Technician',
            'date_range': 'Date Range',
            'start_date': 'Start Date',
            'end_date': 'End Date',
            'previous': 'Previous',
            'next': 'Next',
            'page_info': 'Page {0} of {1}',
'department-select': 'Select Department',
            // Profile Page
            'reset_password': 'Reset Password',
            'sign_out': 'Sign Out',
            'role': 'Role',

            // Track Page
            'activity_log': 'Activity Log',
            'all_activities': 'All Activities',
            'added': 'Added',
            'deleted': 'Deleted',
            'edited': 'Edited',
            'submitted': 'Submitted',
            'uploaded': 'Uploaded',
            'search_activities': 'Search activities...',

            // Permissions Page
            'search_users': 'Search users...',
            'add_new_user': '+ Add New User',
            'status': 'Status:',
            'active': 'Active',
            'delete': 'Delete',
            'device_access_permissions': 'Device Access Permissions',
            'all_devices': 'All Devices',
            'pc_only': 'PC Only',
            'scanner_only': 'Scanner Only',
            'printer_only': 'Printer Only',
            'action_permissions': 'Action Permissions',
            'full_access': 'Full Access',
            'can_perform_all': 'Can perform all actions',
            'view_access': 'View Access',
            'can_view_only': 'Can view information only',
            'add_items': 'Add Items',
            'can_add_new': 'Can add new items',
            'edit_items': 'Edit Items',
            'share_items': 'Share Items',
            'can_share': 'Can share items',
            'can_modify': 'Can modify existing items',
            'delete_items': 'Delete Items',
            'can_remove': 'Can remove items',
            'check_logs': 'Check Logs',
            'can_check_logs': 'Can check logs',
            'edit_permission': 'Edit Permission',
            'can_edit_permission': 'Can edit permission',

            // Dashboard Page
            'server_status': 'Server Status',
            'active_servers': 'Active Servers',
            'inactive_servers': 'Inactive Servers',
            'reports_overview': 'Reports Overview',
            'critical_devices': 'Critical Devices',
            'main_server': 'Main Server',
            'backup_storage': 'Backup Storage',
            'network_switch': 'Network Switch',
            'database_server': 'Database Server',
            'faulty_devices': 'Faulty Devices',
            'type': 'TYPE',
            'specs': 'SPECS',
            'status': 'STATUS',
            'support_tickets': 'Support Tickets',
            'open': 'Open',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'maintenance_overview': 'Maintenance Overview',
            'upcoming_maintenance': 'Upcoming Maintenance',
            'server_backup': 'Server Backup',
            'system_updates': 'System Updates',
            'network_maintenance': 'Network Maintenance',
            'high': 'HIGH',
            'medium': 'MEDIUM',
            'low': 'LOW',
            'normal': 'NORMAL',
            'warning': 'WARNING',
            'critical': 'CRITICAL',
            'Renewing device': 'Renewing device',
            'show_more_details': 'Show More Details',

            // Reports Page
            'general_reports': 'General Reports',
            'view_manage_reports': 'View and manage standard reports',
            'periodic_reports': 'Periodic Reports',
            'schedule_track_reports': 'Schedule and track recurring reports',

            // Tickets Page
            'internal_ticket': 'Internal Ticket',
            'external_ticket': 'External Ticket',
         // Dashboard specific translations
            'it_device_management_dashboard': 'IT Device Management Dashboard',
            'total_devices': 'Total Devices',
            'total_pcs': 'Total PCs',
            'total_scanners': 'Total Scanners',
            'total_printers': 'Total Printers',
            'device_ram_distribution': 'Device RAM Distribution',
            'cpu_generation_overview': 'CPU Generation Overview',
            'outdated_os_versions': 'Outdated OS Versions',
            'devices': 'devices',
            'filters': 'Filters',
            'filter_by_department': 'Filter by Department',
            'filter_by_cpu_gen': 'Filter by CPU Gen',
            'filter_by_os_version': 'Filter by OS Version',
            'filter_by_ram_size': 'Filter by RAM Size',
            'apply_filters': 'Apply Filters',
            'needs_replacement': 'Needs Replacement',
            'device_name': 'Device Name',
            'department': 'Department',
            'ram': 'RAM',
            'cpu_generation': 'CPU Generation',
            'os_version': 'OS Version',
            'status': 'Status',
            'replace_soon': 'Replace Soon',
            'ok': 'OK',
            'all': 'All',
            // Maintenance Page
            'add_devices': 'Add Devices',

            // Report Type3 Page
            'type_of_report': 'Type of report',
            'closed': 'Closed',

            // Login Page
            'login_signup': 'Login and Sign Up',
            'remember_me': 'Remember Me',
            'forgot_password': 'Forgot your password?',
            'username': 'Username',
            'employee_id': 'Employee ID',
            'phone_number': 'Phone Number',
            'loginError': 'Invalid username or password',
            'inactive': 'Your account is inactive. Please contact the administrator.',
            'enter_new_password': "Enter new password",
            'password_required': "Password is required",
            'password_updated': "Password updated successfully",
            'password_update_failed': "Failed to update password",
            // General Maintenance
            'fill_required_fields': 'Please fill in all required fields',
            'customer_name': 'Customer Name',
            'enter_customer_name': 'Enter customer name',
            'id_number': 'ID Number',
            'enter_id_number': 'Enter ID number',
            'ext_number': 'Ext Number',
            'enter_ext_number': 'Enter extension number',
            'floor': 'Floor',
            'select_floor': 'Select Floor',
            'search_floor': 'Search floor...',
            'technical': 'Technical',
            'select_technical': 'Select Technical',
            'search_technical': 'Search technical...',
            'problem_status': 'Problem Status',
            'select_status': 'Select Status',
            'search_status': 'Search status...',
            'submit_form': 'Submit Form',
            'type_of_problem': 'Type of Problem',
            'select_problem_type': 'Select Problem type',
            'search_problem_type': 'Search problem type...',
            'hardware': 'Hardware',
            'software': 'Software',
            'network': 'Network',
            'printer': 'Printer',
            'scanner': 'Scanner',
            'other': 'Other',

            // External Maintenance Page
            'record_external_maintenance': 'Record external device maintenance information',
            'device_information': 'Device Information',
            'ticket_information': 'Ticket Information',
            'diagnosis_details': 'Diagnosis Details',
            'initial_diagnosis': 'Initial Diagnosis',
            'enter_initial_diagnosis': 'Enter initial diagnosis',
            'final_diagnosis': 'Final Diagnosis',
            'enter_final_diagnosis': 'Enter final diagnosis',
            'maintenance_manager': 'Maintenance Manager',
            'enter_manager_name': 'Enter manager name',
            'reporter_name': 'Reporter Name',
            'select_reporter': 'Select Reporter',
            'search_reporter': 'Search reporter...',
            'ticket_number': 'Ticket Number',
            'enter_ticket_number': 'Enter ticket number',

            // Add Devices Page
            'add_new_device': 'Add a new device to the system',
            'add_device': 'Add Device',
            'enter_new_value': 'Enter new value...',

            // Internal Ticket Page
            'internal_ticket': 'Internal Ticket',
            'fill_ticket_details': 'Fill in the details below to create a new Internal ticket',
            'ticket_type': 'Ticket Type',
            'select_ticket_type': 'Select Ticket Type',
            'search_ticket_types': 'Search ticket types...',
            'specify_custom_type': 'Specify Custom Type',
            'enter_custom_type': 'Enter custom type',
            'auto_generated': 'Auto-generated...',
            'technical_name': 'Technical Name',
            'select_technical_engineer': 'Select Technical Engineer',
            'search_technical': 'Search technical...',
            'report_status': 'Report Status',
            'select_report_status': 'Select Report Status',
            'search_report_statuses': 'Search report statuses...',
            'upload_email_copy': 'Upload a Copy of the Email',
            'drop_files_here': 'Drop files here or click to upload',
            'supported_formats': 'Supported formats: PDF, DOC, DOCX, EML',
            'priority': 'Priority',
            'high': 'High',
            'medium': 'Medium',
            'low': 'Low',
            'report_details': 'Report Details',
            'enter_description': 'Enter detailed description of the issue',
            'final_diagnosis': 'Final Diagnosis',
            'enter_final_diagnosis': 'Enter final diagnosis after investigation',
            'other_description': 'Other Description',
            'provide_additional_details': 'Please provide additional details if \'Other\' is selected',
            'save_ticket': 'Save Ticket',
            'initial_diagnosis': 'Initial Diagnosis',
            'select_initial_diagnosis': 'Select Initial Diagnosis',
            'search_problem_status': 'Search problem status...',

            // External Ticket Page
            'external_ticket': 'External Ticket',
            'fill_support_ticket': 'Fill in the details below to create a new support ticket',
            'enter_ticket_number': 'Enter Ticket Number',
            'reporter_name': 'Reporter Name',
            'enter_reporter_name': 'Enter reporter name',
            'issue_description': 'Issue Description',
            'describe_issue': 'Describe the issue in detail...',
            'report_datetime': 'Report Date/Time',
            'save_ticket': 'Save Ticket',

            // Reports Pages
            'issue': 'Issue',
            'selected_issue': 'Selected Issue',
            'reports_dashboard': 'Reports Dashboard',
            'search_reports': 'Search reports...',
            'report_types': 'Report Types',
            'maintenance': 'Maintenance',
            'ticket': 'Ticket',
            'new_report': 'New Report',
            'status': 'Status',
            'open': 'Open',
            'in_progress': 'In Progress',
            'closed': 'Closed',
            'all_devices': 'All Devices',
            'pc': 'PC',
            'printer': 'Printer',
            'scanner': 'Scanner',
            'new_report_btn': 'New Report',
            'maintenance_dashboard': 'Maintenance Dashboard',
            'month_maintenance': '3-Month Maintenance',
            'month_maintenance_4': '4-Month Maintenance',
            'month_schedule': '3-Month Schedule',
            'month_schedule_4': '4-Month Schedule',
            'device_name': 'Device Name',
            'category': 'Category',
            'last_maintenance': 'Last Maintenance',
            'next_due_date': 'Next Due Date',
            'status': 'Status',
            'fill_report_details': 'Fill out the report details below',
            'report_type': 'Report Type',
            'select_report_type': 'Select report type',
            'submission_date': 'Submission Date',
            'device_type': 'Device Type',
            'select_device_type': 'Select device type',
            'select_status': 'Select status',
            'detailed_description': 'Detailed Description',
            'enter_description': 'Enter detailed description of the report...',
            'signature': 'Signature',
            'choose_signature': 'Choose how to provide your signature',
            'draw_signature': 'Draw Signature',
            'upload_signature': 'Or Upload Signature Image',
            'clear_signature': 'Clear Signature',
            'submit_report': 'Submit Report',
            'report_language': 'Report Language',
            'select_language': 'Select Language',

            'network_reports': 'Network Reports',
            'upload_excel': 'Upload Excel File',

            // Report Details Page
            'maintenance_report': 'Maintenance Report',
            'download_pdf': 'Download PDF',
            'edit_report': 'Edit Report',
            'save_changes': 'Save Changes',
            'close_report': 'Close Report',
            'report_id': 'Report ID',
            'device_specifications': 'Device Specifications',
            'attachment': 'Attachment',
            'additional_notes': 'Additional Notes',
            'select_report_contents': 'Select Report Contents',
            'technical_notes': 'Technical  Note',
            'generate_pdf': 'Generate PDF',
            'cancel': 'Cancel',
            'technical_status': "Technical Status",
            'technical_status_name': "Technical Status Name",
            'enter_technical_status': "Enter technical status...",
            'please_enter_technical_status': "Please enter technical status",
            'error_fetching_technical_status': "Error fetching technical status",
            'error_saving_technical_status': "Error saving technical status",
            'failed_to_save_technical_status': "Failed to save technical status",
            'problem_status': "Problem Status",
            'problem_status_name': "Problem Status Name",
            'enter_problem_status': "Enter problem status...",
            'please_enter_problem_status': "Please enter problem status",
            'error_fetching_problem_status': "Error fetching problem status",
            'error_saving_problem_status': "Error saving problem status",
            'failed_to_save_problem_status': "Failed to save problem status",
            // Device Specifications
            'device_name': 'Device Name',
            'serial_number': 'Serial Number',
            'ministry_number': 'Ministry Number',
            'cpu': 'CPU',
            'ram': 'RAM',
            'os': 'Operating System',
            'generation': 'Generation',
            'model': 'Model',
            'hard_drive': 'Hard Drive',
            'ram_size': 'RAM Size',
            'mac_address': 'MAC Address',
            'ip_address': 'IP Address',
            'printer_type': 'Printer Type',
            'ink_type': 'Ink Type',
            'ink_serial': 'Ink Serial Number',
            'scanner_type': 'Scanner Type',

            // Dropdowns
            'select_specification': "Select specification",
            'select_department': "Select Department",
            'select_model': "Select Model",
            'select_processor': "Select processor",
            'select_ram': "Select RAM",
            'select_hard_drive': "Select Hard Drive",
            'select_os': "Select OS",
            'select_ram_size': "Select RAM Size",
            'select_generation': "Select generation",
            'select_printer_type': "Select Printer Type",
            'select_ink_type': "Select Ink Type",
            'select_scanner_type': "Select Scanner Type",
            'select_ink_serial': "Select Ink Serial Number",
            'select_processor_generation': "Select Processor Generation",

            // Add New Options
            'add_new_processor': "Add New Processor",
            'add_new_ram': "Add New RAM",
            'add_new_hard_drive': "Add New Hard Drive",
            'add_new_os': "Add New OS",
            'add_new_ram_size': "Add New RAM Size",
            'add_new_generation': "Add New Generation",
            'add_new_printer_type': "Add New Printer Type",
            'add_new_ink_type': "Add New Ink Type",
            'add_new_scanner_type': "Add New Scanner Type",
            'add_new_department': "Add New Department",
            'add_new_model': "Add New Model",
            'add_new_report_status': "Add New Report Status",
            'add_new_ticket_type': "Add New Ticket Type",
            'report_status': "Report Status",
            'ticket_type': "Ticket Type",


            // Placeholders
            'search_processor': "Search processor...",
            'search_ram': "Search RAM...",
            'search_drive': "Search Drive...",
            'search_os': "Search OS...",
            'search_ram_size': "Search RAM size...",
            'search_generation': "Search generation...",
            'search_printer_type': "Search printer type...",
            'search_ink_type': "Search ink type...",
            'search_scanner_type': "Search scanner type...",
            'search_department': "Search department...",
            'search_model': "Search model...",
            'usernameEn' : "Username (English)",
            'usernameAr' : "Username (Arabic)",


            // Error Messages
            'please_select_valid_option': "Please select a valid option",
            'please_enter_valid_value': "Please enter a valid value",
            'please_enter_model_name': "Please enter a model name",
            'please_enter_section_name': "Please enter a section name",
            'please_enter_processor': "Please enter processor name",
            'please_enter_ram': "Please enter RAM type",
            'please_enter_hard_drive': "Please enter hard drive type",
            'please_enter_os': "Please enter OS name",
            'please_enter_ram_size': "Please enter RAM size",
            'please_enter_generation': "Please enter generation number",
            'please_enter_printer_type': "Please enter printer type",
            'please_enter_ink_type': "Please enter ink type",
            'please_enter_scanner_type': "Please enter scanner type",

            // Success Messages
            'saved_successfully': "Saved successfully",
            'updated_successfully': "Updated successfully",
            'deleted_successfully': "Deleted successfully",

            // Error Messages
            'failed_to_save': "Failed to save",
            'failed_to_update': "Failed to update",
            'failed_to_delete': "Failed to delete",
            'failed_to_load': "Failed to load data",

            // Confirmations
            'confirm_delete': "Are you sure you want to delete",
            'confirm_update': "Are you sure you want to update",

            // Device Types
            'pc': "PC",
            'laptop': "Laptop",
            'desktop': "Desktop",
            'printer': "Printer",
            'scanner': "Scanner",

            // Device Specifications
            'device_name': "Device Name",
            'serial_number': "Serial Number",
            'ministry_number': "Ministry Number",
            'mac_address': "MAC Address",
            'ip_address': "IP Address",
            'processor': "Processor",
            'ram': "RAM",
            'hard_drive': "Hard Drive",
            'operating_system': "Operating System",
            'ram_size': "RAM Size",
            'processor_generation': "Processor Generation",
            'printer_type': "Printer Type",
            'ink_type': "Ink Type",
            'scanner_type': "Scanner Type",
            'ink_serial_number': "Ink Serial Number",

            // Sections
            'department': "Department",
            'model': "Model",
            'section': "Section",
            'section_name': "Section Name",
            'model_name': "Model Name",
            'enter_section_name': "Enter section name",
            'enter_model_name': "Enter model name",
            'technical': "Technical",
            'reporter': "Reporter",

            // Actions
            'edit': "Edit",
            'delete': "Delete",
            'save': "Save",
            'cancel': "Cancel",
            'add': "Add",
            'update': "Update",
            'remove': "Remove",
            'enter': "Enter",

            // Status
            'is_required': "is required",
            'all_devices': "All Devices",
            'no_specifications_found': "No specifications found",
            'download_excel': 'Download Excel',
            'no_data_found': 'No data found for this report.',
            'ip_address': 'IP Address',
            'status': 'Status',
            'latency': 'Latency',
            'packet_loss': 'Packet Loss',
            'timestamp': 'Timestamp',
            'circuit_name': 'Circuit Name',
            'isp': 'ISP',
            'location': 'Location',
            'circuit_speed': 'Circuit Speed',
            'start_contract': 'Start Contract',
            'end_contract': 'End Contract',
            'active': 'Active',
            'failed': 'Failed',
            'unstable': 'Unstable',
            'delay': 'Delay',
            'no_ip_specified': 'No IP address specified',
            'no_data_for_ip': 'No data found for this IP.',
            'report': 'Report',
            'latency_ms': 'Latency (ms)',
            'packet_loss_percent': 'Packet Loss (%)',
            'time': 'Time',
            'response_time': 'Response Time',
            // Popup Titles
            'add_device': "Add Device",
            'edit_device': "Edit Device",
            'add_specification': "Add Specification",
            'edit_specification': "Edit Specification",
            'add_model': "Add Model",
            'edit_model': "Edit Model",
            'add_section': "Add Section",
            'edit_section': "Edit Section",
            'for': "For",

            'change_Role': "Change Role",
            // Saved Devices Page
            'saved_devices': "Saved Devices",
            'total_devices': "Total Devices",
            'active': "Active",
            'failed': "Failed",
            'unstable': "Unstable",
            'ping_all': "Ping All",
            'ping': "Ping",
            'ping_t': "Ping -t",
            'traceroute': "Traceroute",
            'generate_report': "Generate Report",
            'share': "Share",
            'ready_for_commands': "Ready for commands...",
            'search': "Search...",
            'ping_as_group': "Ping as Group",
            'other': "Other...",
            'enter_number': "Enter number...",
            'all': "All",
            'mine': "Mine",
            'shared_with_me': "Shared With Me",
            'filter_by': "Filter by",
            'governmental_number': "Governmental Number",
            'select_value': "Select value",
            'actions': "Actions",
            'circuit_name': "Circuit Name",
            'isp': "ISP",
            'location': "Location",
            'ip_address': "IP Address",
            'speed': "Speed",
            'start_date': "Start Date",
            'end_date': "End Date",
            'select_users_to_share': "Select User(s) to Share With",
            'confirm': "Confirm",
            'cancel': "Cancel",
            'edit_entry': "Edit Entry",
            'save': "Save",
            'error_loading_reports': "Error loading reports",

            // Diagnostic Page
            'network_diagnostic_tool': "Network Diagnostic Tool",
            'total_devices': "Total Devices",
            'active': "Active",
            'failed': "Failed",
            'unstable': "Unstable",
            'ping_all': "Ping All",
            'ping': "Ping",
            'ping_t': "Ping -t",
            'traceroute': "Traceroute",
            'generate_report': "Generate Report",
            'save_all_ips': "Save All IPs",
            'share': "Share",
            'ready_for_commands': "Ready for commands...",
            'add_row': "+ Add Row",
            'ping_as_group': "Ping as Group",
            'enter_number': "Enter number",
            'circuit_name': "Circuit Name",
            'enter_circuit_name': "Enter Circuit Name",
            'isp': "ISP",
            'isp_placeholder': "Such:STC",
            'location': "Location",
            'enter_location': "Enter Location",
            'ip_address': "IP Address",
            'circuit_speed': "Circuit Speed",
            'enter_circuit_speed': "Enter Circuit Speed",
            'start_contract': "Start Contract",
            'end_contract': "End Contract",
            'select_users_to_share': "Select User(s) to Share With",
            'confirm': "Confirm",
            'cancel': "Cancel",
            'device_count': "Device Count",
            'fill_complete_row': "Please fill in at least one complete row before saving.",
            // Tool Selection Page
            'network_tools': "Network Tools",
            'select_ping_method': "Select your preferred ping method",
            'ping_existing_device': "Ping from existing device",
            'use_connected_devices': "Use one of your currently connected devices",
            'ping_new_device': "Ping a new device",
            'add_ping_new_device': "Add and ping a new network device",
            'reset_password': 'Reset Password',
            'enter_email_reset': 'Enter your email to reset your password',
            'error_message': 'Something went wrong.',
'error_loading_reports': "Error loading reports",
            'external_maintenance_ticket': 'External maintenance ticket',
            'ping_t_auto': "Ping -t Auto",
            'show_reports': "Show Reports",
            'select_duration': "Select Duration",
            '6_hours': "6 Hours",
            '8_hours': "8 Hours",
            'view_reports': "View Reports",
            'view_manage_ping_reports': "View and manage saved ping reports",
            'ping_reports_title': "Ping Reports",
            'loading_reports': "Loading reports...",
            'full_name_en': 'Full Name (English)',
            'full_name_ar': 'Full Name (Arabic)',
            'add_new_user': '+ Add New User',
            'search_users': 'Search users...',
            'employee_id': 'Employee ID',
            'department': 'Department',
            'add': 'Add',
            'cancel': 'Cancel',
            'change_role': 'Change Role',
            // ... existing code ...
            'report_for': 'Report for',
            'unknown_ip': 'Unknown IP',
            'view_details': 'View Details',
            'download': 'Download',
            'no_reports_available': 'No reports available',
            'from': 'From',
            'to': 'To',
            'timeouts': 'Timeouts',
            'search_reports': 'Search reports...',
            'network_reports': 'Network Reports',
            'ips': 'IPs',
            'owner': 'Owner',
        },
        ar: {
          'report_for': 'البلاغ عن',
          'unknown_ip': 'IP غير معروف',
'view_details': 'عرض التفاصيل',
'download': 'تحميل',
'no_reports_available': 'لا توجد تقارير متاحة',
'from': 'من',
'to': 'إلى',
'timeouts': 'إنتهاء الوقت',
'search_reports': 'بحث عن التقارير',
'network_reports': 'تقارير الشبكة',
'ips': 'عناوين IP',
'owner': 'المالك',

            'issue': 'المشكلة',
            'selected_issue': 'المشكلة المحددة',
            'governmental_number': 'الرقم الحكومي',
            'department': 'الاقسام',
            'reporter': 'صاحب البلاغ',
            'model': 'الموديلات',
            'section': 'القسم',
            'section_name': 'اسم القسم',
            'model_name': 'اسم الموديل',
            'enter_section_name': ' ادخل اسم القسم ',
            'enter_model_name': 'ادخل اسم الموديل',
            'enter_new_password': "أدخل كلمة المرور الجديدة",
            'password_required': "كلمة المرور مطلوبة",
            'password_updated': "تم تحديث كلمة المرور بنجاح",
            'password_update_failed': "فشل في تحديث كلمة المرور",
            'change_role': "تغيير الصلاحيات",
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
            'enter': 'ادخل',
            'for': 'ل',
                        'ink_serial': 'رقم التسلسلي للحبر',
                                    'ink_serial_number': "رقم التسلسلي للحبر",



            'technical_status': "الحالة الفنية",
            'technical_status_name': "اسم الحالة الفنية",
            'enter_technical_status': "أدخل الحالة الفنية...",
            'please_enter_technical_status': "الرجاء إدخال الحالة الفنية",
            'error_fetching_technical_status': "خطأ في جلب الحالة الفنية",
            'error_saving_technical_status': "خطأ في حفظ الحالة الفنية",
            'failed_to_save_technical_status': "فشل في حفظ الحالة الفنية",
            'problem_status': "حالة المشكلة",
            'problem_status_name': "اسم نوع المشكلة",
            'enter_problem_status': "أدخل نوع المشكلة...",
            'please_enter_problem_status': "الرجاء إدخال نوع المشكلة",
            'error_fetching_problem_status': "خطأ في جلب نوع المشكلة",
            'error_saving_problem_status': "خطأ في حفظ نوع المشكلة",
            'failed_to_save_problem_status': "فشل في حفظ نوع المشكلة",
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
            'issue_summary': 'ملخص المشكلة',
            'additional_information': 'معلومات اضافية',
            'error_loading_reports' : 'خطأ في تحميل التقارير',
            'os': 'النظام التشغيلي',
            'generation': 'التصنيف',
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
            'dark': 'داكن',

            // Dashboard
            'dashboard': 'لوحة التحكم',
            'dashboard_desc': 'نظرة عامة على أداء النظام والمقاييس الرئيسية',
            'active_monitors': '12 جهاز مراقبة نشط',
            'maintenance_dashboard': "لوحة تحكم الصيانة",
            'last_updated': "آخر تحديث",
            'completion_rates': "معدلات الإنجاز",
            'regular': "دورية",
            'internal': "داخلي",
            'external': "خارجي",
            'hover_for_details': "مرر المؤشر فوق الرسوم البيانية للحصول على التفاصيل",
            'reports_overview': "نظرة عامة على التقارير",
            'internal_maintenance': "الصيانة الداخلية - الأجهزة الحرجة",
            'external_maintenance': "تجديد الأجهزة",
            'support_tickets': "تذاكر الدعم",
            'maintenance_overview': "نظرة عامة على الصيانة (داخلية مقابل خارجية)",
            'upcoming_maintenance': "الصيانة القادمة - الصيانة الدورية",
            'task': "المهمة",
            'date': "التاريخ",
            'priority': "الأولوية",
            'type': "النوع",
            'specs': "المواصفات",
            'status': "الحالة",
            'open': "مفتوحة",
            'in_progress': "قيد التنفيذ",
            'resolved': "تم الحل",
            'from_last_week': "من الأسبوع الماضي",
            'no_upgrade_needed': "لا توجد أجهزة تحتاج إلى ترقية.",
            'critical': "حرج",
            'warning': "تحذير",
            'back': "رجوع",
            'home': "الرئيسية",
            'packet_loss_ar': 'فقدان الحزم',
            'contract_start': 'بداية العقد',
            'contract_end': 'نهاية العقد',
            'circuit_speed_ar': 'سرعة الدائرة',
            'service_provider': 'مزود الخدمة',
            'circuit_name_ar': 'اسم الدائرة',
            'ip_address_ar': 'عنوان IP',
            'status_ar': 'الحالة',
            'response_time_ar': 'زمن الاستجابة',
            'packet_loss_percent_ar': 'فقدان الحزم (%)',
            'time_ar': 'الوقت',
            'latency_ms_ar': 'زمن الاستجابة (مللي ثانية)',
            'active_ar': 'نشط',
            'failed_ar': 'فشل',
            'unstable_ar': 'غير مستقر',
            'delay_ar': 'تأخير',
            'no_ip_specified_ar': 'لا يوجد عنوان IP محدد',
            'no_data_for_ip_ar': 'لا توجد بيانات لهذا العنوان',
            'report_ar': 'تقرير',
            'no_data_found_ar': 'لا توجد بيانات لهذا التقرير.',
            'report_details_for_ar': 'تفاصيل التقرير لـ',
            'download_excel_ar': 'تحميل Excel',
            // Reports
            'reports': 'التقارير',
            'reports_desc': 'تحليلات وتقارير أداء مفصلة',
            'available_reports': '28 تقرير متاح',

            // Tickets
            'tickets': 'التذاكر',
            'tickets_desc': 'إدارة وتتبع طلبات الدعم',
            'open_tickets': '15 تذكرة مفتوحة',

            // Maintenance
            'scheduled_tasks': '2 مهمة مجدولة',

            // Maintenance Types
            'regular_maintenance': 'الصيانة الدورية',
            'regular_maintenance_desc': 'جدولة وتنفيذ مهام الصيانة الروتينية',
            'external_maintenance': 'الصيانة الخارجية',
            'external_maintenance_desc': 'إدارة طلبات الصيانة الخارجية والمقاولين',
            'add_maintenance': 'إضافة صيانة',
            'add_maintenance_desc': 'إنشاء طلبات ومهام صيانة جديدة',
            'general_maintenance': 'الصيانة العامة',
            'general_maintenance_desc': 'عرض وإدارة جميع أنشطة الصيانة',

            // Regular Maintenance
            'scheduled_maintenance': 'الصيانة المجدولة',
            'device_name': 'اسم الجهاز',
            'maintenance_type': 'نوع الصيانة',
            'preventive': 'وقائية',
            'corrective': 'تصحيحية',
            'schedule_date': 'تاريخ الجدولة',
            'description': 'الوصف',
            'add': 'إضافة',
            'record_maintenance': 'تسجيل معلومات صيانة الجهاز',
            'last_maintenance_date': 'تاريخ آخر صيانة',
            'maintenance_frequency': 'تكرار الصيانة',
            'every_3_months': 'كل 3 أشهر',
            'every_4_months': 'كل 4 أشهر',
            'device_type': 'نوع الجهاز',
            'select_device_type': 'اختر نوع الجهاز',
            'search_device_type': 'ابحث عن نوع الجهاز...',
            'section': 'القسم',
            'select_section': 'اختر القسم',
            'search_section': 'ابحث عن قسم...',
            'device_specifications': 'مواصفات الجهاز',
            'select_specification': 'اختر المواصفات',
            'search_specification': 'ابحث عن مواصفات...',
            'problem_status': 'حالة المشكلة',
            'select_problem_status': 'اختر نوع المشكلة',
            'search_problem_status': 'ابحث عن نوع المشكلة...',
            'technical_name': 'اسم المهندس',
            'select_technical': 'اختر المهندس',
            'search_technical': 'ابحث عن فني...',
            'notes': 'ملاحظات',
            'add_notes': 'أضف أي ملاحظات إضافية هنا...',
            'submit_maintenance': 'إرسال سجل الصيانة',
            'required': '*',
            'enter_device_specifications': 'أدخل مواصفات الجهاز',
            'save': 'حفظ',
            'cancel': 'إلغاء',
            'add_new': 'إضافة ',
            'new_value': 'قيمة جديدة',
            'enter_new_value': 'أدخل قيمة جديدة...',

            // External Maintenance
            'external_requests': 'الطلبات الخارجية',
            'add_external': 'إضافة طلب خارجي',
            'contractor_name': 'اسم المقاول',
            'service_type': 'نوع الخدمة',
            'repair': 'إصلاح',
            'installation': 'تركيب',
            'request_date': 'تاريخ الطلب',
            'report_language': 'لغة التقرير',
            'select_language': 'اختر اللغة',

            // Add Maintenance
            'priority': 'الأولوية',
            'low': 'منخفضة',
            'medium': 'متوسطة',
            'high': 'عالية',

            // General Maintenance
            'status': 'الحالة',
            'all': 'الكل',
            'pending': 'قيد الانتظار',
            'in_progress': 'قيد التنفيذ',
            'completed': 'مكتمل',
            'date': 'التاريخ',
            'actions': 'الإجراءات',
            'no_matching_reports_found' : 'لا يوجد تقارير مطابقة',

            // External Maintenance Details
            'fill_maintenance_details': 'يرجى ملء تفاصيل الصيانة أدناه',
            'device_information': 'معلومات الجهاز',
            'problem_type': 'نوع المشكلة',
            'select_problem_type': 'اختر نوع المشكلة',
            'search_problem_type': 'ابحث عن نوع المشكلة...',

            // Ticket Information
            'ticket_information': 'معلومات التذكرة',
            'ticket_number': 'رقم التذكرة',
            'enter_ticket_number': 'أدخل رقم التذكرة',
            'maintenance_manager': 'مدير الصيانة',
            'enter_manager_name': 'أدخل اسم المدير',
            'reporter_name': 'اسم المبلغ',
            'select_reporter': 'اختر المبلغ',
            'search_reporter': 'ابحث عن مبلغ...',
            'diagnosis_details': 'تفاصيل التشخيص',
            'initial_diagnosis': 'التشخيص الأولي',
            'enter_initial_diagnosis': 'أدخل التشخيص الأولي',
            'final_diagnosis': 'التشخيص النهائي',
            'enter_final_diagnosis': 'أدخل التشخيص النهائي',
            'submit_form': 'إرسال النموذج',

            // Add Maintenance Details
            'enter_device_name': 'أدخل اسم الجهاز',
            'computer': 'حاسوب',
            'printer': 'طابعة',
            'network': 'جهاز شبكة',
            'other': 'أخرى',
            'location': 'الموقع',
            'enter_location': 'أدخل الموقع',
            'assigned_to': 'تعيين إلى',
            'select_technician': 'اختر المهندس',
            'date_range': 'النطاق الزمني',
            'start_date': 'تاريخ البداية',
            'end_date': 'تاريخ النهاية',
            'previous': 'السابق',
            'next': 'التالي',
            'device_count': 'عدد الاجهزة',
            'page_info': 'الصفحة {0} من {1}',

            // Profile Page
            'reset_password': 'إعادة تعيين كلمة المرور',
            'sign_out': 'تسجيل الخروج',
            'role': 'الدور',

            // Track Page
            'activity_log': 'سجل النشاط',
            'all_activities': 'جميع الأنشطة',
            'added': 'تمت الإضافة',
            'deleted': 'تم الحذف',
            'edited': 'تم التعديل',
            'submitted': 'تم الإرسال',
            'uploaded': 'تم الرفع',
            'search_activities': 'البحث في الأنشطة...',

            // Permissions Page
            'search_users': 'البحث عن المستخدمين...',
            'add_new_user': '+ إضافة مستخدم جديد',
            'status': 'الحالة:',
            'active': 'نشط',
            'delete': 'حذف',
            'device_access_permissions': 'صلاحيات الوصول للأجهزة',
            'all_devices': 'جميع الأجهزة',
            'pc_only': 'أجهزة الكمبيوتر فقط',
            'scanner_only': 'الماسح الضوئي فقط',
            'printer_only': 'الطابعة فقط',
            'action_permissions': 'صلاحيات الإجراءات',
            'full_access': 'وصول كامل',
            'can_perform_all': 'يمكنه تنفيذ جميع الإجراءات',
            'view_access': 'وصول للعرض فقط',
            'can_view_only': 'يمكنه عرض المعلومات فقط',
            'add_items': 'إضافة عناصر',
            'can_add_new': 'يمكنه إضافة عناصر جديدة',
            'edit_items': 'تعديل العناصر',
            'can_modify': 'يمكنه تعديل العناصر الموجودة',
            'delete_items': 'حذف العناصر',
            'can_remove': 'يمكنه حذف العناصر',
            'check_logs': 'فحص السجلات',
            'can_check_logs': 'يمكنه فحص السجلات',
            'edit_permission': 'تعديل الصلاحيات',
            'can_edit_permission': 'يمكنه تعديل الصلاحيات',
            'share_items': 'مشاركة العناصر',
            'can_share': 'يمكنه مشاركة العناصر',
<<<<<<< HEAD
            'cancel_emails': 'إلغاء الإيميلات',
            'can_cancel_emails': 'يمكنه إلغاء الإيميلات',
            'cancel_notifications': 'إلغاء الإشعارات',
            'can_cancel_notifications': 'يمكنه إلغاء الإشعارات',
            'cancel_logs': 'إلغاء السجلات',
            'can_cancel_logs': 'يمكنه إلغاء السجلات',
=======
>>>>>>> dfa1ff18f501a113e159d8d77f54553e04171c45
            // Dashboard Page
            'server_status': 'حالة الخادم',
            'active_servers': 'الخوادم النشطة',
            'inactive_servers': 'الخوادم غير النشطة',
            'reports_overview': 'نظرة عامة على التقارير',
            'critical_devices': 'الأجهزة الحساسة',
            'main_server': 'الخادم الرئيسي',
            'backup_storage': 'تخزين النسخ الاحتياطي',
            'network_switch': 'مفتاح الشبكة',
            'database_server': 'خادم قاعدة البيانات',
            'faulty_devices': 'الأجهزة المعطلة',
            'type': 'النوع',
            'specs': 'المواصفات',
            'status': 'الحالة',
            'support_tickets': 'تذاكر الدعم',
            'open': 'مفتوحة',
            'in_progress': 'قيد التنفيذ',
            'resolved': 'تم الحل',
            'maintenance_overview': 'نظرة عامة على الصيانة',
            'upcoming_maintenance': 'الصيانة القادمة',
            'server_backup': 'نسخ احتياطي للخادم',
            'system_updates': 'تحديثات النظام',
            'network_maintenance': 'صيانة الشبكة',
            'network_reports': 'تقارير الشبكة',
            'high': 'عالية',
            'medium': 'متوسطة',
            'low': 'منخفضة',
            'normal': 'طبيعي',
            'warning': 'تحذير',
            'critical': 'حرج',
            'Renewing device': 'الأجهزة المقترح تجديدها',
            'show_more_details': 'عرض التفاصيل',
            // Dashboard specific translations
            'it_device_management_dashboard': 'لوحة إدارة أجهزة تقنية المعلومات',
            'total_devices': 'إجمالي الأجهزة',
            'total_pcs': 'إجمالي أجهزة الكمبيوتر',
            'total_scanners': 'إجمالي الماسحات الضوئية',
            'total_printers': 'إجمالي الطابعات',
            'device_ram_distribution': 'توزيع ذاكرة الأجهزة',
            'cpu_generation_overview': 'نظرة عامة على جيل المعالج',
            'outdated_os_versions': 'إصدارات النظام التشغيلي القديمة',
            'devices': 'أجهزة',
            'filters': 'المرشحات',
            'filter_by_department': 'تصفية حسب القسم',
            'filter_by_cpu_gen': 'تصفية حسب جيل المعالج',
            'filter_by_os_version': 'تصفية حسب إصدار النظام',
            'filter_by_ram_size': 'تصفية حسب حجم الذاكرة',
            'apply_filters': 'تطبيق المرشحات',
            'needs_replacement': 'تحتاج استبدال',
            'device_name': 'اسم الجهاز',
            'department': 'القسم',
            'ram': 'الذاكرة',
            'cpu_generation': 'جيل المعالج',
            'os_version': 'إصدار النظام',
            'status': 'الحالة',
            'replace_soon': 'استبدال قريباً',
            'ok': 'جيد',
            'all': 'الكل',
            'download_replacement_report': ' تقرير الأجهزة المطلوب استبدالها',

            // Reports Page
            'general_reports': 'التقارير العامة',
            'view_manage_reports': 'عرض وإدارة التقارير القياسية',
            'periodic_reports': 'التقارير الدورية',
            'schedule_track_reports': 'جدولة وتتبع التقارير المتكررة',

            // Tickets Page
            'internal_ticket': 'تذكرة داخلية',
            'external_ticket': 'تذكرة خارجية',

            // Maintenance Page
            'add_devices': 'إضافة أجهزة',

            // Report Type3 Page
            'type_of_report': 'نوع التقرير',
            'closed': 'مغلق',

            // Login Page
            'login_signup': 'تسجيل الدخول وإنشاء حساب',
            'remember_me': 'تذكرني',
            'forgot_password': 'نسيت كلمة المرور؟',
            'username': 'اسم المستخدم',
            'employee_id': 'الرقم الوظيفي',
            'phone_number': 'رقم الهاتف',
            'loginError': 'بيانات الدخول غير صحيحة',
            'inactive:': '🚫 حسابك غير نشط. الرجاء التواصل مع المشرف.',

            'upload_excel': 'تحميل ملف Excel',
            // General Maintenance
            'fill_required_fields': 'يرجى ملء جميع الحقون المطلوبة',
            'customer_name': 'اسم العميل',
            'enter_customer_name': 'أدخل اسم العميل',
            'id_number': 'رقم الهوية',
            'enter_id_number': 'أدخل رقم الهوية',
            'ext_number': 'رقم التمديد',
            'enter_ext_number': 'أدخل رقم التمديد',
            'floor': 'الطابق',
            'select_floor': 'اختر الطابق',
            'search_floor': 'ابحث عن طابق...',
            'technical': 'المهندس',
            'select_technical': 'اختر المهندس',
            'search_technical': 'ابحث عن المهندس...',
            'problem_status': 'حالة المشكلة',
            'select_status': 'اختر الحالة',
            'search_status': 'ابحث عن حالة...',
            'submit_form': 'إرسال النموذج',
            'type_of_problem': 'نوع المشكلة',
            'select_problem_type': 'اختر نوع المشكلة',
            'search_problem_type': 'ابحث عن نوع المشكلة...',
            'hardware': 'معدات',
            'software': 'برمجيات',
            'network': 'شبكة',
            'printer': 'طابعة',
            'scanner': 'ماسح ضوئي',
            'other': 'أخرى',

            // External Maintenance Page
            'record_external_maintenance': 'تسجيل معلومات صيانة الجهاز الخارجي',
            'device_information': 'معلومات الجهاز',
            'ticket_information': 'معلومات التذكرة',
            'diagnosis_details': 'تفاصيل التشخيص',
            'initial_diagnosis': 'التشخيص الأولي',
            'enter_initial_diagnosis': 'أدخل التشخيص الأولي',
            'final_diagnosis': 'التشخيص النهائي',
            'enter_final_diagnosis': 'أدخل التشخيص النهائي',
            'enter_manager_name': 'أدخل اسم المدير',
            'reporter_name': 'اسم صاحب البلاغ',
            'select_reporter': 'اختر صاحب البلاغ',
            'search_reporter': 'ابحث عن مبلغ...',
            'ticket_number': 'رقم التذكرة',
            'enter_ticket_number': 'أدخل رقم التذكرة',
            'reporter': 'صاحب البلاغ',

            // Add Devices Page
            'add_new_device': 'إضافة جهاز جديد إلى النظام',
            'add_device': 'إضافة جهاز',
            'enter_new_value': 'أدخل قيمة جديدة...',

            // Internal Ticket Page
            'internal_ticket': 'تذكرة داخلية',
            'fill_ticket_details': 'املأ التفاصيل أدناه لإنشاء تذكرة داخلية جديدة',
            'ticket_type': 'نوع التذكرة',
            'select_ticket_type': 'اختر نوع التذكرة',
            'search_ticket_types': 'ابحث عن أنواع التذاكر...',
            'specify_custom_type': 'تحديد نوع مخصص',
            'enter_custom_type': 'أدخل النوع المخصص',
            'auto_generated': 'يتم إنشاؤه تلقائياً...',
            'technical_name': 'اسم المهندس',
            'select_technical_engineer': 'اختر المهندس',
            'search_technical': 'ابحث عن فني...',
            'report_status': 'حالة التقرير',
            'select_report_status': 'اختر حالة التقرير',
            'search_report_statuses': 'ابحث عن حالات التقرير...',
            'upload_email_copy': 'رفع نسخة من البريد الإلكتروني',
            'drop_files_here': 'اسحب الملفات هنا أو انقر للرفع',
            'supported_formats': 'الصيغ المدعومة: PDF, DOC, DOCX, EML',
            'priority': 'الأولوية',
            'high': 'عالية',
            'medium': 'متوسطة',
            'low': 'منخفضة',
            'report_details': 'تفاصيل التقرير',
            'enter_description': 'أدخل وصفاً مفصلاً للمشكلة',
            'final_diagnosis': 'التشخيص النهائي',
            'enter_final_diagnosis': 'أدخل التشخيص النهائي بعد التحقيق',
            'other_description': 'وصف آخر',
            'provide_additional_details': 'يرجى تقديم تفاصيل إضافية إذا تم اختيار \'أخرى\'',
            'save_ticket': 'حفظ التذكرة',
            'initial_diagnosis': 'التشخيص الأولي',
            'select_initial_diagnosis': 'اختر التشخيص الأولي',
            'search_problem_status': 'ابحث عن نوع المشكلة...',

            // External Ticket Page
            'external_ticket': 'تذكرة خارجية',
            'fill_support_ticket': 'املأ التفاصيل أدناه لإنشاء تذكرة دعم جديدة',
            'enter_ticket_number': 'أدخل رقم التذكرة',
            'reporter_name': 'اسم المبلغ',
            'enter_reporter_name': 'أدخل اسم المبلغ',
            'issue_description': 'وصف المشكلة',
            'describe_issue': 'صف المشكلة بالتفصيل...',
            'report_datetime': 'تاريخ/وقت التقرير',
            'save_ticket': 'حفظ التذكرة',

            // Reports Pages
            'reports_dashboard': 'لوحة التقارير',
            'search_reports': 'البحث في التقارير...',
            'report_types': 'أنواع التقارير',
            'maintenance': 'الصيانة',
            'ticket': 'التذكرة',
            'new_report': 'تقرير جديد',
            'status': 'الحالة',
            'open': 'مفتوح',
            'in_progress': 'قيد التنفيذ',
            'closed': 'مغلق',
            'all_devices': 'جميع الأجهزة',
            'pc': 'كمبيوتر',
            'printer': 'طابعة',
            'scanner': 'ماسح ضوئي',
            'new_report_btn': 'تقرير جديد',
            'maintenance_dashboard': 'لوحة الصيانة',
            'month_maintenance': 'صيانة 3 أشهر',
            'month_maintenance_4': 'صيانة 4 أشهر',
            'month_schedule': 'جدول 3 أشهر',
            'month_schedule_4': 'جدول 4 أشهر',
            'device_name': 'اسم الجهاز',
            'category': 'الفئة',
            'last_maintenance': 'آخر صيانة',
            'next_due_date': 'تاريخ الاستحقاق التالي',
            'status': 'الحالة',
            'fill_report_details': 'املأ تفاصيل التقرير أدناه',
            'report_type': 'نوع التقرير',
            'select_report_type': 'اختر نوع التقرير',
            'submission_date': 'تاريخ التقديم',
            'device_type': 'نوع الجهاز',
            'select_device_type': 'اختر نوع الجهاز',
            'select_status': 'اختر الحالة',
            'detailed_description': 'وصف مفصل',
            'enter_description': 'أدخل وصفاً مفصلاً للتقرير...',
            'signature': 'التوقيع',
            'choose_signature': 'اختر طريقة تقديم توقيعك',
            'draw_signature': 'رسم التوقيع',
            'upload_signature': 'أو رفع صورة التوقيع',
            'clear_signature': 'مسح التوقيع',
            'submit_report': 'تقديم التقرير',

            // Report Details Page
            'maintenance_report': 'تقرير الصيانة',
            'download_pdf': 'تحميل PDF',
            'edit_report': 'تعديل التقرير',
            'save_changes': 'حفظ التغييرات',
            'close_report': 'إغلاق التقرير',
            'report_id': 'رقم التقرير',
            'device_specifications': 'مواصفات الجهاز',
            'attachment': 'المرفقات',
            'additional_notes': 'ملاحظات إضافية',
            'select_report_contents': 'اختر محتويات التقرير',
            'technical_notes': 'ملاحظات فنية',
            'generate_pdf': 'إنشاء PDF',
            'cancel': 'إلغاء',
            'external_maintenance_ticket': 'تذكرة صيانة خارجية',
            // Device Specifications
            'device_name': 'اسم الجهاز',
            'serial_number': 'الرقم التسلسلي',
            'ministry_number': 'الرقم الوزاري',
            'mac_address': 'عنوان MAC',
            'ip_address': 'عنوان IP',
            'processor': 'المعالج',
            'ram': 'الذاكرة',
            'hard_drive': 'القرص الصلب',
            'operating_system': 'نظام التشغيل',
            'ram_size': 'حجم الذاكرة',
            'processor_generation': 'جيل المعالج',
            'printer_type': 'نوع الطابعة',
            'ink_type': 'نوع الحبر',
            'scanner_type': 'نوع الماسح',
            'ink_serial_number': 'الرقم التسلسلي للحبر',

            // Dropdowns
            'select_specification': "اختر المواصفات",
            'select_department': "اختر القسم",
            'select_model': "اختر الموديل",
            'select_processor': "اختر المعالج",
            'select_ram': "اختر الذاكرة",
            'select_hard_drive': "اختر القرص الصلب",
            'select_os': "اختر نظام التشغيل",
            'select_ram_size': "اختر حجم الذاكرة",
            'select_generation': "اختر الجيل",
            'select_printer_type': "اختر نوع الطابعة",
            'select_ink_type': "اختر نوع الحبر",
            'select_scanner_type': "اختر نوع الماسح",
            'select_ink_serial': "اختر الرقم التسلسلي للحبر",
            'select_processor_generation': "اختر جيل المعالج",

            // Add New Options
            'add_new_processor': "إضافة معالج جديد",
            'add_new_ram': "إضافة ذاكرة جديدة",
            'add_new_hard_drive': "إضافة قرص صلب جديد",
            'add_new_os': "إضافة نظام تشغيل جديد",
            'add_new_ram_size': "إضافة حجم ذاكرة جديد",
            'add_new_generation': "إضافة جيل جديد",
            'add_new_printer_type': "إضافة نوع طابعة جديد",
            'add_new_ink_type': "إضافة نوع حبر جديد",
            'add_new_scanner_type': "إضافة نوع ماسح جديد",
            'add_new_department': "إضافة قسم جديد",
            'add_new_model': "إضافة موديل جديد",
            'add_new_report_status': "Add New Report Status",
            'add_new_ticket_type': "Add New Ticket Type",


            // Placeholders
            'search_processor': "ابحث عن معالج...",
            'search_ram': "ابحث عن ذاكرة...",
            'search_drive': "ابحث عن قرص صلب...",
            'search_os': "ابحث عن نظام تشغيل...",
            'search_ram_size': "ابحث عن حجم ذاكرة...",
            'search_generation': "ابحث عن جيل...",
            'search_printer_type': "ابحث عن نوع طابعة...",
            'search_ink_type': "ابحث عن نوع حبر...",
            'search_scanner_type': "ابحث عن نوع ماسح...",
            'search_department': "ابحث عن قسم...",
            'search_model': "ابحث عن موديل...",
            'usernameEn': "اسم المستخدم (انجليزي)",
            'usernameAr': "اسم المستخدم (عربي)",

            // Error Messages
            'please_select_valid_option': "الرجاء اختيار خيار صحيح",
            'please_enter_valid_value': "الرجاء إدخال قيمة صحيحة",
            'please_enter_model_name': "الرجاء إدخال اسم الموديل",
            'please_enter_section_name': "الرجاء إدخال اسم القسم",
            'please_enter_processor': "الرجاء إدخال اسم المعالج",
            'please_enter_ram': "الرجاء إدخال نوع الذاكرة",
            'please_enter_hard_drive': "الرجاء إدخال نوع القرص الصلب",
            'please_enter_os': "الرجاء إدخال اسم نظام التشغيل",
            'please_enter_ram_size': "الرجاء إدخال حجم الذاكرة",
            'please_enter_generation': "الرجاء إدخال رقم الجيل",
            'please_enter_printer_type': "الرجاء إدخال نوع الطابعة",
            'please_enter_ink_type': "الرجاء إدخال نوع الحبر",
            'please_enter_scanner_type': "الرجاء إدخال نوع الماسح",

            // Success Messages
            'saved_successfully': "تم الحفظ بنجاح",
            'updated_successfully': "تم التحديث بنجاح",
            'deleted_successfully': "تم الحذف بنجاح",

            // Error Messages
            'failed_to_save': "فشل في الحفظ",
            'failed_to_update': "فشل في التحديث",
            'failed_to_delete': "فشل في الحذف",
            'failed_to_load': "فشل في تحميل البيانات",

            // Confirmations
            'confirm_delete': "هل أنت متأكد من حذف",
            'confirm_update': "هل أنت متأكد من تحديث",

            // Device Types
            'pc': "كمبيوتر",
            'laptop': "لابتوب",
            'desktop': "كمبيوتر مكتبي",
            'printer': "طابعة",
            'scanner': "ماسح ضوئي",

            // Device Specifications
            'device_name': "اسم الجهاز",
            'serial_number': "الرقم التسلسلي",
            'ministry_number': "الرقم الوزاري",
            'mac_address': "عنوان MAC",
            'ip_address': "عنوان IP",
            'processor': "المعالج",
            'ram': "الذاكرة",
            'hard_drive': "القرص الصلب",
            'operating_system': "نظام التشغيل",
            'ram_size': "حجم الذاكرة",
            'processor_generation': "جيل المعالج",
            'printer_type': "نوع الطابعة",
            'ink_type': "نوع الحبر",
            'scanner_type': "نوع الماسح",
            'ink_serial_number': "الرقم التسلسلي للحبر",

            // Actions
            'edit': "تعديل",
            'delete': "حذف",
            'save': "حفظ",
            'cancel': "إلغاء",
            'add': "إضافة",
            'update': "تحديث",
            'remove': "إزالة",

            // Status
            'is_required': "مطلوب",
            'all_devices': "جميع الأجهزة",
            'no_specifications_found': "لم يتم العثور على مواصفات",

            // Popup Titles
            'add_device': "إضافة جهاز",
            'edit_device': "تعديل جهاز",
            'add_specification': "إضافة مواصفات",
            'edit_specification': "تعديل مواصفات",
            'add_model': "إضافة موديل",
            'edit_model': "تعديل موديل",
            'add_section': "إضافة قسم",
            'edit_section': "تعديل قسم",

            'for': "For",

            // Saved Devices Page
            'saved_devices': "الأجهزة المحفوظة",
            'total_devices': "إجمالي الأجهزة",
            'active': "نشط",
            'failed': "فشل",
            'unstable': "غير مستقر",
            'ping_all': "اختبار الكل",
            'ping': "اختبار",
            'ping_t': "اختبار مستمر",
            'traceroute': "تتبع المسار",
            'generate_report': "إنشاء تقرير",
            'share': "مشاركة",
            'ready_for_commands': "جاهز للأوامر...",
            'search': "بحث...",
            'ping_as_group': "اختبار كمجموعة",
            'other': "أخرى...",
            'enter_number': "أدخل الرقم...",
            'all': "الكل",
            'mine': "الخاص بي",
            'shared_with_me': "مشارك معي",
            'filter_by': "تصفية حسب",
            'select_value': "اختر القيمة",
            'actions': "الإجراءات",
            'circuit_name': "اسم الدائرة",
            'isp': "مزود الخدمة",
            'location': "الموقع",
            'ip_address': "عنوان IP",
            'speed': "السرعة",
            'start_date': "تاريخ البدء",
            'end_date': "تاريخ الانتهاء",
            'select_users_to_share': "اختر المستخدمين للمشاركة معهم",
            'confirm': "تأكيد",
            'cancel': "إلغاء",
            'edit_entry': "تعديل الإدخال",
            'save': "حفظ",

            // Diagnostic Page
            'network_diagnostic_tool': "أداة تشخيص الشبكة",
            'total_devices': "إجمالي الأجهزة",
            'active': "نشط",
            'failed': "فشل",
            'unstable': "غير مستقر",
            'ping_all': "اختبار الكل",
            'ping': "اختبار",
            'ping_t': "اختبار مستمر",
            'traceroute': "تتبع المسار",
            'generate_report': "إنشاء تقرير",
            'save_all_ips': "حفظ جميع عناوين IP",
            'share': "مشاركة",
            'ready_for_commands': "جاهز للأوامر...",
            'add_row': "+ إضافة صف",
            'ping_as_group': "اختبار كمجموعة",
            'enter_number': "أدخل الرقم",
            'circuit_name': "اسم الدائرة",
            'enter_circuit_name': "أدخل اسم الدائرة",
            'isp': "مزود الخدمة",
            'isp_placeholder': "مثال: STC",
            'location': "الموقع",
            'enter_location': "أدخل الموقع",
            'ip_address': "عنوان IP",
            'circuit_speed': "سرعة الدائرة",
            'enter_circuit_speed': "أدخل سرعة الدائرة",
            'start_contract': "بداية العقد",
            'end_contract': "نهاية العقد",
            'select_users_to_share': "اختر المستخدمين للمشاركة معهم",
            'confirm': "تأكيد",
            'cancel': "إلغاء",
            'fill_complete_row': "يرجى ملء صف واحد على الأقل قبل الحفظ.",
            // Tool Selection Page
            'network_tools': "أدوات الشبكة",
            'select_ping_method': "اختر طريقة الـ ping المفضلة لديك",
            'ping_existing_device': "الـ ping من جهاز موجود",
            'use_connected_devices': "استخدم أحد أجهزتك المتصلة حالياً",
            'ping_new_device': "الـ ping لجهاز جديد",
            'add_ping_new_device': "إضافة والـ ping لجهاز شبكة جديد",
            'reset_password': 'إعادة تعيين كلمة المرور',
            'enter_email_reset': 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور',
            'error_message': 'حدث خطأ ما.',
            'ping_t_auto': "اختبار مستمر تلقائي",
            'show_reports': "عرض التقارير",
            'select_duration': "اختر المدة",
            '6_hours': "6 ساعات",
            '8_hours': "8 ساعات",
            'view_reports': "عرض التقارير",
            'view_manage_ping_reports': "عرض وإدارة تقارير البنق",
            'ping_reports_title': "Ping Reports",
            'loading_reports': "Loading reports...",
            'full_name_en': 'الاسم الكامل (انجليزي)',
            'full_name_ar': 'الاسم الكامل (عربي)',
            'add_new_user': '+ إضافة مستخدم جديد',
            'search_users': 'البحث عن المستخدمين...',
            'employee_id': 'الرقم الوظيفي',
            'department': 'القسم',
            'add': 'إضافة',
            'cancel': 'إلغاء',
            'change_role': 'تغيير الصلاحيات',
            'department-select': 'اختر القسم',
            // ... existing code ...
        }
    },
     description: {
    "Computer won’t turn on at all (no lights/sound)": { en: "Computer won't turn on at all (no lights/sound)", ar: "الكمبيوتر لا يعمل إطلاقًا (لا أضواء/أصوات)" },
    "Turns on but screen stays black": { en: "Turns on but screen stays black", ar: "يعمل ولكن تبقى الشاشة سوداء" },
    "Black screen / Blue screen with white error text (crashes suddenly)": { en: "Black screen / Blue screen with white error text (crashes suddenly)", ar: "شاشة سوداء أو زرقاء برسالة خطأ (يتعطل فجأة)" },
    "Stuck on loading screen (Windows/macOS won't start)": { en: "Stuck on loading screen (Windows/macOS won't start)", ar: "عالق في شاشة التحميل (ويندوز/ماك لا يقلع)" },
    "Stuck on loading screen (Windows/macOS won’t start)": { en: "Stuck on loading screen (Windows/macOS won’t start)", ar: "عالق في شاشة التحميل (ويندوز/ماك لا يقلع)" },
    "Monitor says \"No Signal\"": { en: "Monitor says \"No Signal\"", ar: "الشاشة تعرض \"لا يوجد إشارة\"" },
    "Blank Screen but computer is on": { en: "Blank Screen but computer is on", ar: "شاشة فارغة ولكن الكمبيوتر يعمل" },
    "Randomly shuts down or restarts": { en: "Randomly shuts down or restarts", ar: "يغلق أو يعيد التشغيل عشوائيًا" },
    "Computer makes weird noises (beeping, grinding)": { en: "Computer makes weird noises (beeping, grinding)", ar: "الكمبيوتر يصدر أصواتًا غريبة (صفير، طحن)" },
    "External hard drive not recognized": { en: "External hard drive not recognized", ar: "الهارد الخارجي غير معرّف" },
    "Mouse/keyboard disconnects randomly (wireless)": { en: "Mouse/keyboard disconnects randomly (wireless)", ar: "الماوس أو الكيبورد يفصل بشكل عشوائي (لاسلكي)" },
    "USB port not connecting / not charging": { en: "USB port not connecting / not charging", ar: "منفذ USB لا يعمل / لا يشحن" },
    "Extremely slow (takes a long time to open files/apps)": { en: "Extremely slow (takes a long time to open files/apps)", ar: "بطئ شديد (يتأخر في فتح الملفات/البرامج)" },
    "Freezes or gets stuck (mouse/keyboard stop working)": { en: "Freezes or gets stuck (mouse/keyboard stop working)", ar: "يتجمد أو يتوقف عن الاستجابة (الماوس/الكيبورد لا يعمل)" },
    "Programs keep crashing/closing unexpectedly": { en: "Programs keep crashing/closing unexpectedly", ar: "البرامج تغلق فجأة أو تتعطل باستمرار" },
    "Wrong colors (too dark, Inverted colors)": { en: "Wrong colors (too dark, Inverted colors)", ar: "ألوان غير صحيحة (غامقة جدًا، معكوسة)" },
    "Flickering or flashing screen": { en: "Flickering or flashing screen", ar: "وميض أو اهتزاز في الشاشة" },
    "Mouse not working": { en: "Mouse not working", ar: "الماوس لا يعمل" },
    "Keyboard not working": { en: "Keyboard not working", ar: "الكيبورد لا يعمل" },
      "Mouse pointer moves on its own": {
    en: "Mouse pointer moves on its own",
    ar: "مؤشر الماوس يتحرك من تلقاء نفسه"
  },
  "No sound from speakers/headphones": {
    en: "No sound from speakers/headphones",
    ar: "لا يوجد صوت من السماعات أو سماعات الرأس"
  },
  "Sound is crackling or distorted": {
    en: "Sound is crackling or distorted",
    ar: "الصوت مشوش أو متقطع"
  },
  "Microphone not working": {
    en: "Microphone not working",
    ar: "الميكروفون لا يعمل"
  },
  "Wi-Fi keeps disconnecting": {
    en: "Wi-Fi keeps disconnecting",
    ar: "الواي فاي ينقطع باستمرار"
  },
  "No internet even when connected": {
  en: "No internet even when connected",
  ar: "لا يوجد إنترنت رغم الاتصال"
},
"Can’t connect to Wi-Fi (wrong password/error)": {
  en: "Can’t connect to Wi-Fi (wrong password/error)",
  ar: "لا يمكن الاتصال بالواي فاي (كلمة مرور خاطئة أو خطأ)"
},
"Web pages load very slowly": {
  en: "Web pages load very slowly",
  ar: "صفحات الإنترنت تفتح ببطء شديد"
},
"Deleted a file by accident (need recovery)": {
  en: "Deleted a file by accident (need recovery)",
  ar: "تم حذف ملف عن طريق الخطأ (يحتاج استرجاع)"
},
"“Disk full” error (out of storage space)": {
  en: "“Disk full” error (out of storage space)",
  ar: "رسالة \"امتلاء القرص\" (لا توجد مساحة تخزين)"
},
"Application Problem (Apps not working)": {
  en: "Application Problem (Apps not working)",
  ar: "مشكلة في التطبيقات (لا تعمل)"
},
"Program won’t install/uninstall": {
  en: "Program won’t install/uninstall",
  ar: "لا يمكن تثبيت أو إزالة البرنامج"
},
"“Not responding” errors (frozen apps)": {
  en: "“Not responding” errors (frozen apps)",
  ar: "أخطاء \"لا يستجيب\" (البرامج مجمدة)"
},
"Pop-up ads/viruses (suspicious programs)": {
  en: "Pop-up ads/viruses (suspicious programs)",
  ar: "نوافذ منبثقة / فيروسات (برامج مشبوهة)"
},
"Windows/Mac update failed": {
  en: "Windows/Mac update failed",
  ar: "فشل تحديث النظام (ويندوز أو ماك)"
},
"Microsoft Office needs activation / Not working": {
  en: "Microsoft Office needs activation / Not working",
  ar: "أوفيس يحتاج تفعيل / لا يعمل"
},
"Windows needs activation / Not working": {
  en: "Windows needs activation / Not working",
  ar: "ويندوز يحتاج تفعيل / لا يعمل"
},
"Forgot password (can’t sign in)": {
  en: "Forgot password (can’t sign in)",
  ar: "نسيت كلمة المرور (لا يمكن تسجيل الدخول)"
},
"“Your account is locked” message": {
  en: "“Your account is locked” message",
  ar: "رسالة \"تم قفل حسابك\""
},
"Wrong username/password (but it’s correct)": {
  en: "Wrong username/password (but it’s correct)",
  ar: "اسم المستخدم أو كلمة المرور غير صحيحة (رغم أنها صحيحة)"
},
"Can’t open a file (unsupported format)": {
  en: "Can’t open a file (unsupported format)",
  ar: "لا يمكن فتح الملف (صيغة غير مدعومة)"
},
"Date/time keeps resetting to wrong value": {
  en: "Date/time keeps resetting to wrong value",
  ar: "التاريخ أو الوقت يعيد التعيين لقيمة خاطئة"
},
"Takes too long to shut down": {
  en: "Takes too long to shut down",
  ar: "يستغرق وقتًا طويلاً عند الإغلاق"
},
"Cables not connected / Need replacement": {
  en: "Cables not connected / Need replacement",
  ar: "الأسلاك غير متصلة أو تحتاج استبدال"
},

    "Printer is not responding": { en: "Printer is not responding", ar: "الطابعة لا تستجيب" },
    "Printer is not detected": { en: "Printer is not detected", ar: "الطابعة غير مكتشفة" },
    "Printer says \"offline\" when it’s plugged in": { en: "Printer says \"offline\" when it’s plugged in", ar: "الطابعة تظهر غير متصلة رغم توصيلها" },
    "Printer driver error pops up": { en: "Printer driver error pops up", ar: "ظهور خطأ تعريف الطابعة" },
    "Printer turns on but screen is blank": { en: "Printer turns on but screen is blank", ar: "الطابعة تعمل ولكن الشاشة فارغة" },
    "Printer keeps restarting": { en: "Printer keeps restarting", ar: "الطابعة تعيد التشغيل باستمرار" },
    "Printer makes loud grinding noises": { en: "Printer makes loud grinding noises", ar: "الطابعة تصدر أصوات طحن عالية" },
    "Printer disconnects (USB cable not working)": { en: "Printer disconnects (USB cable not working)", ar: "الطابعة تفصل (كابل USB لا يعمل)" },
    "Wi-Fi printer won’t connect to network": { en: "Wi-Fi printer won’t connect to network", ar: "الطابعة اللاسلكية لا تتصل بالشبكة" },
    "Printer works for one computer but not another": { en: "Printer works for one computer but not another", ar: "الطابعة تعمل على جهاز ولا تعمل على آخر" },
    "Can’t find printer in the list of devices": { en: "Can’t find printer in the list of devices", ar: "لا يمكن العثور على الطابعة في قائمة الأجهزة" },
    "Random error message (e.g., \"Error 0x000001\")": { en: "Random error message (e.g., \"Error 0x000001\")", ar: "رسالة خطأ عشوائية (مثل: Error 0x000001)" },
    "Print jobs stuck in queue (nothing comes out)": { en: "Print jobs stuck in queue (nothing comes out)", ar: "أوامر الطباعة عالقة (لا شيء يُطبع)" },
    "Spooler errors (print jobs stuck in queue)": { en: "Spooler errors (print jobs stuck in queue)", ar: "أخطاء في خدمة الطباعة (الطباعة عالقة)" },
    "Printer is turned on but does nothing": { en: "Printer is turned on but does nothing", ar: "الطابعة تعمل لكنها لا تطبع" },
    "Printer won’t print black (only color works)": { en: "Printer won’t print black (only color works)", ar: "الطابعة لا تطبع بالأسود (تطبع ألوان فقط)" },
    "Printer won’t print colors (only black works)": { en: "Printer won’t print colors (only black works)", ar: "الطابعة لا تطبع ألوان (تطبع أسود فقط)" },
    "Ink not recognized (error even after replacing)": { en: "Ink not recognized (error even after replacing)", ar: "الحبر غير معروف (حتى بعد الاستبدال)" },
    "Printer says \"low ink\" but cartridge is new": { en: "Printer says \"low ink\" but cartridge is new", ar: "الطابعة تظهر أن الحبر منخفض رغم أنه جديد" },
    "Printer says \"out of paper\" but tray is full": { en: "Printer says \"out of paper\" but tray is full", ar: "الطابعة تقول أن الورق ناقص رغم امتلاء الصينية" },
    "Paper keeps jamming / Feeding Issues": { en: "Paper keeps jamming / Feeding Issues", ar: "الورق ينحشر باستمرار / مشاكل في السحب" },
    "Printer pulls multiple sheets at once": { en: "Printer pulls multiple sheets at once", ar: "الطابعة تسحب أكثر من ورقة في وقت واحد" },
    "Paper comes out wrinkled or crumpled": { en: "Paper comes out wrinkled or crumpled", ar: "الورق يخرج مجعد أو مكرمش" },
    "Ink smears when touched": { en: "Ink smears when touched", ar: "الحبر يتلطخ عند اللمس" },
    "Print too faint or faded": { en: "Print too faint or faded", ar: "الطباعة باهتة جدًا" },
    "Streaks or lines on printed pages": { en: "Streaks or lines on printed pages", ar: "خطوط على الصفحات المطبوعة" },
    "Spots or smudges on prints": { en: "Spots or smudges on prints", ar: "بقع أو لطخات على المطبوعات" },
    "Colors look wrong (e.g., green instead of blue)": { en: "Colors look wrong (e.g., green instead of blue)", ar: "ألوان غير صحيحة (مثل: أخضر بدل أزرق)" },
    "Wrong colors in prints": { en: "Wrong colors in prints", ar: "ألوان غير صحيحة في الطباعة" },
    "Black ink prints as blank/gray": { en: "Black ink prints as blank/gray", ar: "الحبر الأسود يُطبع رمادي أو لا يُطبع" },
    "Cartridge alignment problems": { en: "Cartridge alignment problems", ar: "مشاكل في محاذاة الخراطيش" },
    "Slow printing speed": { en: "Slow printing speed", ar: "سرعة طباعة بطيئة" },
    "Scanner won’t scan (no response)": { en: "Scanner won’t scan (no response)", ar: "الماسح لا يستجيب" },
    "Scanned image is weird or cut off": { en: "Scanned image is weird or cut off", ar: "الصورة الممسوحة غير مكتملة أو مقطوعة" },
    "Scanned documents come out blurry": { en: "Scanned documents come out blurry", ar: "المستندات الممسوحة غير واضحة" },
    "The pages are blank / empty": { en: "The pages are blank / empty", ar: "الصفحات فارغة / لا تحتوي على محتوى" },
"Spooler errors (print jobs stuck in queue)": {
  en: "Spooler errors (print jobs stuck in queue)",
  ar: "أخطاء في خدمة الطباعة (الطباعة عالقة)"
},

    "Scanner won’t turn on (no lights/noise)": { en: "Scanner won’t turn on (no lights/noise)", ar: "الماسح لا يعمل (لا أضواء أو صوت)" },
    "Scanner not detected": { en: "Scanner not detected", ar: "الماسح غير مكتشف" },
    "\"Driver not found\" error": { en: "\"Driver not found\" error", ar: "خطأ \"لم يتم العثور على التعريف\"" },
    "Scanner not showing up in the list": { en: "Scanner not showing up in the list", ar: "الماسح لا يظهر في القائمة" },
    "Scanner makes loud grinding noises": { en: "Scanner makes loud grinding noises", ar: "الماسح يصدر أصوات طحن عالية" },
    "Scanner light flickers or stays off": { en: "Scanner light flickers or stays off", ar: "ضوء الماسح يومض أو لا يعمل" },
    "Scanner makes noise but doesn’t scan": { en: "Scanner makes noise but doesn’t scan", ar: "الماسح يصدر صوتًا لكنه لا يعمل" },
    "Scanner is busy error (even when not in use)": { en: "Scanner is busy error (even when not in use)", ar: "خطأ: الماسح مشغول (حتى عند عدم الاستخدام)" },
    "Scanner won’t grab the paper (no movement)": { en: "Scanner won’t grab the paper (no movement)", ar: "الماسح لا يسحب الورق (لا حركة)" },
    "Paper jams while scanning": { en: "Paper jams while scanning", ar: "الورق ينحشر أثناء المسح" },
    "Paper gets stuck or crumpled": { en: "Paper gets stuck or crumpled", ar: "الورق يتعطل أو يتكرمش" },
    "Scanner pulls multiple pages at once": { en: "Scanner pulls multiple pages at once", ar: "الماسح يسحب عدة صفحات دفعة واحدة" },
    "Printer works but scanner doesn’t": { en: "Printer works but scanner doesn’t", ar: "الطابعة تعمل ولكن الماسح لا يعمل" },
    "Scanner disconnects randomly (USB/Wi-Fi)": { en: "Scanner disconnects randomly (USB/Wi-Fi)", ar: "الماسح ينفصل عشوائيًا (USB/واي فاي)" },
    "Scanning software freezes or crashes": { en: "Scanning software freezes or crashes", ar: "برنامج المسح يتجمد أو يتعطل" },
    "Scanner button does nothing (on all-in-one machines)": { en: "Scanner button does nothing (on all-in-one machines)", ar: "زر الماسح لا يستجيب (في الأجهزة متعددة الوظائف)" },
    "Scanned document saves as blank/black": { en: "Scanned document saves as blank/black", ar: "المستند الممسوح يُحفظ فارغًا أو أسود" },
    "Only scans part of the page (cuts off edges)": { en: "Only scans part of the page (cuts off edges)", ar: "يمسح جزءًا من الصفحة فقط (يقطع الحواف)" },
    "Scanned file won’t save": { en: "Scanned file won’t save", ar: "الملف الممسوح لا يُحفظ" },
    "File format is wrong (e.g., saves as .BMP instead of .PDF)": { en: "File format is wrong (e.g., saves as .BMP instead of .PDF)", ar: "صيغة الملف غير صحيحة (مثل: .BMP بدلاً من .PDF)" },
    "Scanned image is blurry": { en: "Scanned image is blurry", ar: "الصورة الممسوحة غير واضحة" },
    "Dark or faded scans (too light/too dark)": { en: "Dark or faded scans (too light/too dark)", ar: "الصور الممسوحة باهتة جدًا أو مظلمة" },
    "Lines or streaks on scanned documents": { en: "Lines or streaks on scanned documents", ar: "خطوط أو شرائط على المستندات الممسوحة" },
    "Colors look wrong (e.g., red looks pink)": { en: "Colors look wrong (e.g., red looks pink)", ar: "ألوان غير صحيحة (مثلاً الأحمر يبدو وردي)" },
    "Black & white scans come out gray": { en: "Black & white scans come out gray", ar: "المسح بالأبيض والأسود يظهر رمادي" },
    "Scanning takes forever (unusually slow)": { en: "Scanning takes forever (unusually slow)", ar: "المسح يستغرق وقتًا طويلاً بشكل غير طبيعي" }
  },
departments: {
  "Laboratory Department": { en: "Laboratory Department", ar: "قسم المختبر" },
  "Internal Medicine Nursing (Men's Ward)": { en: "Internal Medicine Nursing (Men's Ward)", ar: "تمريض الباطنة (قسم الرجال)" },
  "Intensive Care Unit (ICU) Nursing": { en: "Intensive Care Unit (ICU) Nursing", ar: "تمريض العناية المركزة" },
  "Nursing Services Administration": { en: "Nursing Services Administration", ar: "إدارة خدمات التمريض" },
  "Daily Procedures Unit Nursing": { en: "Daily Procedures Unit Nursing", ar: "تمريض وحدة الإجراءات اليومية" },
  "Pulmonology Department": { en: "Pulmonology Department", ar: "قسم الأمراض الصدرية" },
  "General Surgery Department": { en: "General Surgery Department", ar: "قسم الجراحة العامة" },
  "Medical Supply Department": { en: "Medical Supply Department", ar: "قسم الإمداد الطبي" },
  "Medical Rehabilitation and Physiotherapy": { en: "Medical Rehabilitation and Physiotherapy", ar: "قسم التأهيل والعلاج الطبيعي" },
  "Bed Management Administration": { en: "Bed Management Administration", ar: "إدارة تنسيق الأسرة" },
  "Outpatient Clinics": { en: "Outpatient Clinics", ar: "العيادات الخارجية" },
  "Emergency Department": { en: "Emergency Department", ar: "قسم الطوارئ" },
  "Academic Affairs, Training, and Medical Education Administration": {
    en: "Academic Affairs, Training, and Medical Education Administration",
    ar: "إدارة الشؤون الأكاديمية والتدريب والتعليم الطبي"
  },
  "Endoscopy and Gastroenterology Department": { en: "Endoscopy and Gastroenterology Department", ar: "قسم التنظير والجهاز الهضمي" },
  "Health Economics Administration": { en: "Health Economics Administration", ar: "إدارة الاقتصاد الصحي" },
  "On-Call Supervisors' Office": { en: "On-Call Supervisors' Office", ar: "مكتب المشرفين المناوبين" },
  "Outpatient Clinics Nursing": { en: "Outpatient Clinics Nursing", ar: "تمريض العيادات الخارجية" },
  "Legal Affairs Department": { en: "Legal Affairs Department", ar: "قسم الشؤون القانونية" },
  "General Maintenance Department": { en: "General Maintenance Department", ar: "قسم الصيانة العامة" },
  "Finance and Accounting Administration": { en: "Finance and Accounting Administration", ar: "إدارة المالية والمحاسبة" },
  "Records, Archives, and Administrative Communications Department": {
    en: "Records, Archives, and Administrative Communications Department",
    ar: "قسم السجلات والأرشيف والمراسلات الإدارية"
  },
  "Nutrition Services Administration": { en: "Nutrition Services Administration", ar: "إدارة خدمات التغذية" },
  "Mental Health Department": { en: "Mental Health Department", ar: "قسم الصحة النفسية" },
  "Mortality Department": { en: "Mortality Department", ar: "قسم الوفيات" },
  "Psychiatric Nursing": { en: "Psychiatric Nursing", ar: "تمريض الطب النفسي" },
  "Orthopedic Nursing (Men’s Ward)": { en: "Orthopedic Nursing (Men’s Ward)", ar: "تمريض العظام (قسم الرجال)" },
  "Psychiatric Clinics Nursing": { en: "Psychiatric Clinics Nursing", ar: "تمريض العيادات النفسية" },
  "Diagnostic Radiology Department": { en: "Diagnostic Radiology Department", ar: "قسم الأشعة التشخيصية" },
  "Endoscopy Nursing": { en: "Endoscopy Nursing", ar: "تمريض التنظير" },
  "Home Healthcare Department": { en: "Home Healthcare Department", ar: "قسم الرعاية الصحية المنزلية" },
  "Telephone Exchange Department": { en: "Telephone Exchange Department", ar: "قسم سنترال الهاتف" },
  "Facilities and Support Services Administration": { en: "Facilities and Support Services Administration", ar: "إدارة المرافق والخدمات المساندة" },
  "Urology Department": { en: "Urology Department", ar: "قسم المسالك البولية" },
  "Surgical Nursing (Men’s Ward)": { en: "Surgical Nursing (Men’s Ward)", ar: "تمريض الجراحة (قسم الرجال)" },
  "Facilities and Maintenance Administration": { en: "Facilities and Maintenance Administration", ar: "إدارة المرافق والصيانة" },
  "Warehouse Department": { en: "Warehouse Department", ar: "قسم المستودعات" },
  "Security Department": { en: "Security Department", ar: "قسم الأمن" },
  "Archive Department": { en: "Archive Department", ar: "قسم الأرشيف" },
  "General Services Administration": { en: "General Services Administration", ar: "إدارة الخدمات العامة" },
  "Blood Bank Department": { en: "Blood Bank Department", ar: "قسم بنك الدم" },
  "Surgical Operations Department": { en: "Surgical Operations Department", ar: "قسم العمليات الجراحية" },
   "Procurement Administration": { en: "Procurement Administration", ar: "إدارة المشتريات" },
  "Transportation Department": { en: "Transportation Department", ar: "قسم النقل" },
  "Health Education Department": { en: "Health Education Department", ar: "قسم التوعية الصحية" },
  "Patient Experience Administration": { en: "Patient Experience Administration", ar: "إدارة تجربة المريض" },
  "Investment Administration": { en: "Investment Administration", ar: "إدارة الاستثمار" },
  "Internal Medicine Department": { en: "Internal Medicine Department", ar: "قسم الباطنة" },
  "Inventory Control Administration": { en: "Inventory Control Administration", ar: "إدارة مراقبة المخزون" },
  "Conservative Treatment Department": { en: "Conservative Treatment Department", ar: "قسم العلاج التحفظي" },
  "Emergency Nursing": { en: "Emergency Nursing", ar: "تمريض الطوارئ" },
  "Central Sterilization Department": { en: "Central Sterilization Department", ar: "قسم التعقيم المركزي" },
  "Internal Audit Department": { en: "Internal Audit Department", ar: "قسم التدقيق الداخلي" },
  "Dental Assistants Department": { en: "Dental Assistants Department", ar: "قسم مساعدي الأسنان" },
  "Endodontics Department": { en: "Endodontics Department", ar: "قسم علاج جذور الأسنان" },
  "Periodontology and Gum Surgery Department": { en: "Periodontology and Gum Surgery Department", ar: "قسم أمراض اللثة وجراحة اللثة" },
  "Payroll and Entitlements Department": { en: "Payroll and Entitlements Department", ar: "قسم الرواتب والمستحقات" },
  "Executive Administration for Medical Services": { en: "Executive Administration for Medical Services", ar: "الإدارة التنفيذية للخدمات الطبية" },
  "Home Psychiatry Department": { en: "Home Psychiatry Department", ar: "قسم الطب النفسي المنزلي" },
  "Security Services Nursing": { en: "Security Services Nursing", ar: "تمريض الخدمات الأمنية" },
  "Pharmacy Department": { en: "Pharmacy Department", ar: "قسم الصيدلية" },
  "Outpatient Clinics": { en: "Outpatient Clinics", ar: "العيادات الخارجية" },
  "Infection Control Department": { en: "Infection Control Department", ar: "قسم مكافحة العدوى" },
  "Public Health Department": { en: "Public Health Department", ar: "قسم الصحة العامة" },
  "Internal Medicine Nursing (Women’s Ward)": { en: "Internal Medicine Nursing (Women’s Ward)", ar: "تمريض الباطنة (قسم النساء)" },
  "Human Resources Operations Department": { en: "Human Resources Operations Department", ar: "إدارة عمليات الموارد البشرية" },
  "Patient Affairs Administration": { en: "Patient Affairs Administration", ar: "إدارة شؤون المرضى" },
  "Medical Secretary Department": { en: "Medical Secretary Department", ar: "قسم السكرتارية الطبية" },
  "Information Release Department": { en: "Information Release Department", ar: "قسم الإفصاح عن المعلومات" },
  "Social Services Department": { en: "Social Services Department", ar: "قسم الخدمة الاجتماعية" },
  "Jobs and Recruitment Department": { en: "Jobs and Recruitment Department", ar: "قسم التوظيف والاستقطاب" },
  "Dental Center": { en: "Dental Center", ar: "مركز الأسنان" },
  "Dermatology Department": { en: "Dermatology Department", ar: "قسم الأمراض الجلدية" },
  "Admissions Office": { en: "Admissions Office", ar: "مكتب الدخول" },
  "Orthopedics Department": { en: "Orthopedics Department", ar: "قسم العظام" },
  "Medical Statistics Department": { en: "Medical Statistics Department", ar: "قسم الإحصاء الطبي" },
  "Financial Planning and Control Administration": { en: "Financial Planning and Control Administration", ar: "إدارة التخطيط والرقابة المالية" },
  "Human Resources Planning Administration": { en: "Human Resources Planning Administration", ar: "إدارة تخطيط الموارد البشرية" },
  "Telemedicine Administration": { en: "Telemedicine Administration", ar: "إدارة الطب الاتصالي" },
  "Health Information Management": { en: "Health Information Management", ar: "إدارة المعلومات الصحية" },
  "Nephrology Nursing": { en: "Nephrology Nursing", ar: "تمريض الكلى" },
  "Home Healthcare Nursing": { en: "Home Healthcare Nursing", ar: "تمريض الرعاية الصحية المنزلية" },
  "Medical Records Department": { en: "Medical Records Department", ar: "قسم السجلات الطبية" },
  "Safety Department": { en: "Safety Department", ar: "قسم السلامة" },
  "Executive Administration for Human Resources": { en: "Executive Administration for Human Resources", ar: "الإدارة التنفيذية للموارد البشرية" },
  "Prosthodontics Department": { en: "Prosthodontics Department", ar: "قسم تركيبات الأسنان" },
  "Surgical Nursing (Women’s Ward)": { en: "Surgical Nursing (Women’s Ward)", ar: "تمريض الجراحة (قسم النساء)" },
  "Quality and Patient Safety Administration": { en: "Quality and Patient Safety Administration", ar: "إدارة الجودة وسلامة المرضى" },
  "Executive Administration for Financial and Administrative Affairs": { en: "Executive Administration for Financial and Administrative Affairs", ar: "الإدارة التنفيذية للشؤون المالية والإدارية" },
  "Operating Room Nursing": { en: "Operating Room Nursing", ar: "تمريض غرف العمليات" },
  "Information Technology Administration": { en: "Information Technology Administration", ar: "إدارة تقنية المعلومات" },
  "Compliance Department": { en: "Compliance Department", ar: "قسم الالتزام" },
  "Ophthalmology and Optometry Unit": { en: "Ophthalmology and Optometry Unit", ar: "وحدة طب وجراحة العيون والبصريات" },
  "Attendance Monitoring Administration": { en: "Attendance Monitoring Administration", ar: "إدارة متابعة الحضور" },
  "Emergency Department": { en: "Emergency Department", ar: "قسم الطوارئ" },
  "Human Resources Services Administration": { en: "Human Resources Services Administration", ar: "إدارة خدمات الموارد البشرية" },
  "Medical Maintenance Department": { en: "Medical Maintenance Department", ar: "قسم الصيانة الطبية" },
  "Government Relations Department": { en: "Government Relations Department", ar: "قسم العلاقات الحكومية" },
  "Finance Office": { en: "Finance Office", ar: "مكتب المالية" },
  "Orthopedic Nursing (Women’s Ward)": { en: "Orthopedic Nursing (Women’s Ward)", ar: "تمريض العظام (قسم النساء)" },
  "Housing Department": { en: "Housing Department", ar: "قسم الإسكان" },
  "Vascular Surgery Department": { en: "Vascular Surgery Department", ar: "قسم جراحة الأوعية الدموية" },
  "Anesthesiology Department": { en: "Anesthesiology Department", ar: "قسم التخدير" },
  "Executive Director’s Office": { en: "Executive Director’s Office", ar: "مكتب المدير التنفيذي" },
  "Human Resources Development Administration": { en: "Human Resources Development Administration", ar: "إدارة تطوير الموارد البشرية" },
  "Admissions and Healthcare Access Support Administration": { en: "Admissions and Healthcare Access Support Administration", ar: "إدارة القبول ودعم الوصول للرعاية الصحية" },
  "Internal Communication Administration": { en: "Internal Communication Administration", ar: "إدارة الاتصال الداخلي" },
  "Nephrology Department": { en: "Nephrology Department", ar: "قسم أمراض الكلى" },
  "Medical Documentation Department": { en: "Medical Documentation Department", ar: "قسم التوثيق الطبي" },
  "Neurosurgery Department": { en: "Neurosurgery Department", ar: "قسم جراحة الأعصاب" },
  "Endocrinology Department": { en: "Endocrinology Department", ar: "قسم الغدد الصماء" },
  "Ambulance Transportation Department": { en: "Ambulance Transportation Department", ar: "قسم النقل بالإسعاف" },
  "Religious Awareness and Spiritual Support Administration": { en: "Religious Awareness and Spiritual Support Administration", ar: "إدارة التوعية الدينية والدعم الروحي" },
  "Neurology Department": { en: "Neurology Department", ar: "قسم الأعصاب" },
  "Neurosurgery Nursing": { en: "Neurosurgery Nursing", ar: "تمريض جراحة الأعصاب" },
  "Occupational Health Clinic": { en: "Occupational Health Clinic", ar: "عيادة الصحة المهنية" },
  "Pediatric Dentistry Department": { en: "Pediatric Dentistry Department", ar: "قسم أسنان الأطفال" },
  "Otorhinolaryngology (ENT) Department": { en: "Otorhinolaryngology (ENT) Department", ar: "قسم الأنف والأذن والحنجرة" },
  "Strategic Planning and Transformation Administration": { en: "Strategic Planning and Transformation Administration", ar: "إدارة التخطيط الاستراتيجي والتحول" },
  "Emergency Planning and Preparedness Unit": { en: "Emergency Planning and Preparedness Unit", ar: "وحدة التخطيط للطوارئ والاستعداد" },
  "Clinical Nutrition Department": { en: "Clinical Nutrition Department", ar: "قسم التغذية العلاجية" },
  "Celiac Disease Center": { en: "Celiac Disease Center", ar: "مركز مرض السيلياك" },
  "Respiratory Therapy Department": { en: "Respiratory Therapy Department", ar: "قسم العلاج التنفسي" },
  "Orthodontics Department": { en: "Orthodontics Department", ar: "قسم تقويم الأسنان" },
  "Communication, Public Relations, and Health Media Administration": { en: "Communication, Public Relations, and Health Media Administration", ar: "إدارة التواصل والعلاقات العامة والإعلام الصحي" },
  "Geriatrics and Elderly Care Center": { en: "Geriatrics and Elderly Care Center", ar: "مركز طب ورعاية المسنين" },
  "Medical Coding Department": { en: "Medical Coding Department", ar: "قسم الترميز الطبي" },
  "Executive Administration": { en: "Executive Administration", ar: "الإدارة التنفيذية" },
  "Prisons Department": { en: "Prisons Department", ar: "قسم السجون" },
  "Orthopedic Nursing (Men's Ward)": {
  en: "Orthopedic Nursing (Men's Ward)",
  ar: "تمريض العظام - قسم الرجال"
},
"Executive Director's Office": {
  en: "Executive Director's Office",
  ar: "مكتب المدير التنفيذي"
},
"Internal Medicine Nursing (Women's Ward)": {
  en: "Internal Medicine Nursing (Women's Ward)",
  ar: "تمريض الباطنة - قسم النساء"
},
"Surgical Nursing (Women's Ward)": {
  en: "Surgical Nursing (Women's Ward)",
  ar: "تمريض الجراحة - قسم النساء"
},
"Orthopedic Nursing (Women's Ward)": {
  en: "Orthopedic Nursing (Women's Ward)",
  ar: "تمريض العظام - قسم النساء"
},
"Surgical Nursing (Men's Ward)": {
  en: "Surgical Nursing (Men's Ward)",
  ar: "تمريض الجراحة - قسم الرجال"
}

},
    floors : {
    "Basement 2": { en: "Basement 2", ar: "القبو الثاني" },
    "Basement 1": { en: "Basement 1", ar: "القبو الأول" },
    "Below Ground": { en: "Below Ground", ar: "تحت الأرض" },
    "Ground Level": { en: "Ground Level", ar: "الدور الأرضي" },
    "First Floor": { en: "First Floor", ar: "الدور الأول" },
    "Second Floor": { en: "Second Floor", ar: "الدور الثاني" },
    "Third Floor": { en: "Third Floor", ar: "الدور الثالث" },
    "Forth Floor": { en: "Fourth Floor", ar: "الدور الرابع" },
    "Fifth Floor": { en: "Fifth Floor", ar: "الدور الخامس" },
    "Sixth Floor": { en: "Sixth Floor", ar: "الدور السادس" },
    "Seventh Floor": { en: "Seventh Floor", ar: "الدور السابع" },
    "Eighth Floor": { en: "Eighth Floor", ar: "الدور الثامن" },
    "Ninth Floor": { en: "Ninth Floor", ar: "الدور التاسع" },
    "Tenth Floor": { en: "Tenth Floor", ar: "الدور العاشر" },
    "Rooftop": { en: "Rooftop", ar: "السطح" },
    "Parking": { en: "Parking", ar: "مواقف السيارات" }
  },
  
  problemStatuses: {
PC: {
  "Computer won’t turn on at all (no lights/sound)": {
    en: "Computer won’t turn on at all (no lights/sound)",
    ar: "الكمبيوتر لا يعمل إطلاقًا (لا أضواء/أصوات)"
  },
  "Turns on but screen stays black": {
    en: "Turns on but screen stays black",
    ar: "يعمل ولكن تبقى الشاشة سوداء"
  },
  "Black screen / Blue screen with white error text (crashes suddenly)": {
    en: "Black screen / Blue screen with white error text (crashes suddenly)",
    ar: "شاشة سوداء أو زرقاء برسالة خطأ (يتعطل فجأة)"
  },
  "Stuck on loading screen (Windows/macOS won’t start)": {
    en: "Stuck on loading screen (Windows/macOS won’t start)",
    ar: "عالق في شاشة التحميل (ويندوز/ماك لا يقلع)"
  },
  "Monitor says \"No Signal\"": {
    en: "Monitor says \"No Signal\"",
    ar: "الشاشة تعرض \"لا يوجد إشارة\""
  },
  "Blank Screen but computer is on": {
    en: "Blank Screen but computer is on",
    ar: "شاشة فارغة ولكن الكمبيوتر يعمل"
  },
  "Randomly shuts down or restarts": {
    en: "Randomly shuts down or restarts",
    ar: "يغلق أو يعيد التشغيل عشوائيًا"
  },
  "Computer makes weird noises (beeping, grinding)": {
    en: "Computer makes weird noises (beeping, grinding)",
    ar: "الكمبيوتر يصدر أصواتًا غريبة (صفير، طحن)"
  },
  "External hard drive not recognized": {
    en: "External hard drive not recognized",
    ar: "الهارد الخارجي غير معرّف"
  },
  "Mouse/keyboard disconnects randomly (wireless)": {
    en: "Mouse/keyboard disconnects randomly (wireless)",
    ar: "الماوس أو الكيبورد يفصل بشكل عشوائي (لاسلكي)"
  },
  "USB port not connecting / not charging": {
    en: "USB port not connecting / not charging",
    ar: "منفذ USB لا يعمل / لا يشحن"
  },
  "Extremely slow (takes a long time to open files/apps)": {
    en: "Extremely slow (takes a long time to open files/apps)",
    ar: "بطئ شديد (يتأخر في فتح الملفات/البرامج)"
  },
  "Freezes or gets stuck (mouse/keyboard stop working)": {
    en: "Freezes or gets stuck (mouse/keyboard stop working)",
    ar: "يتجمد أو يتوقف عن الاستجابة (الماوس/الكيبورد لا يعمل)"
  },
  "Programs keep crashing/closing unexpectedly": {
    en: "Programs keep crashing/closing unexpectedly",
    ar: "البرامج تغلق فجأة أو تتعطل باستمرار"
  },
  "Wrong colors (too dark, Inverted colors)": {
    en: "Wrong colors (too dark, Inverted colors)",
    ar: "ألوان غير صحيحة (غامقة جدًا، معكوسة)"
  },
  "Flickering or flashing screen": {
    en: "Flickering or flashing screen",
    ar: "وميض أو اهتزاز في الشاشة"
  },
  "Mouse not working": {
    en: "Mouse not working",
    ar: "الماوس لا يعمل"
  },
  "Keyboard not working": {
    en: "Keyboard not working",
    ar: "الكيبورد لا يعمل"
  },
  "Mouse pointer moves on its own": {
    en: "Mouse pointer moves on its own",
    ar: "مؤشر الماوس يتحرك من تلقاء نفسه"
  },
  "No sound from speakers/headphones": {
    en: "No sound from speakers/headphones",
    ar: "لا يوجد صوت من السماعات أو سماعات الرأس"
  },
  "Sound is crackling or distorted": {
    en: "Sound is crackling or distorted",
    ar: "الصوت مشوش أو متقطع"
  },
  "Microphone not working": {
    en: "Microphone not working",
    ar: "الميكروفون لا يعمل"
  },
  "Wi-Fi keeps disconnecting": {
    en: "Wi-Fi keeps disconnecting",
    ar: "الواي فاي ينقطع باستمرار"
  },
  "No internet even when connected": {
  en: "No internet even when connected",
  ar: "لا يوجد إنترنت رغم الاتصال"
},
"Can’t connect to Wi-Fi (wrong password/error)": {
  en: "Can’t connect to Wi-Fi (wrong password/error)",
  ar: "لا يمكن الاتصال بالواي فاي (كلمة مرور خاطئة أو خطأ)"
},
"Web pages load very slowly": {
  en: "Web pages load very slowly",
  ar: "صفحات الإنترنت تفتح ببطء شديد"
},
"Deleted a file by accident (need recovery)": {
  en: "Deleted a file by accident (need recovery)",
  ar: "تم حذف ملف عن طريق الخطأ (يحتاج استرجاع)"
},
"“Disk full” error (out of storage space)": {
  en: "“Disk full” error (out of storage space)",
  ar: "رسالة \"امتلاء القرص\" (لا توجد مساحة تخزين)"
},
"Application Problem (Apps not working)": {
  en: "Application Problem (Apps not working)",
  ar: "مشكلة في التطبيقات (لا تعمل)"
},
"Program won’t install/uninstall": {
  en: "Program won’t install/uninstall",
  ar: "لا يمكن تثبيت أو إزالة البرنامج"
},
"“Not responding” errors (frozen apps)": {
  en: "“Not responding” errors (frozen apps)",
  ar: "أخطاء \"لا يستجيب\" (البرامج مجمدة)"
},
"Pop-up ads/viruses (suspicious programs)": {
  en: "Pop-up ads/viruses (suspicious programs)",
  ar: "نوافذ منبثقة / فيروسات (برامج مشبوهة)"
},
"Windows/Mac update failed": {
  en: "Windows/Mac update failed",
  ar: "فشل تحديث النظام (ويندوز أو ماك)"
},
"Microsoft Office needs activation / Not working": {
  en: "Microsoft Office needs activation / Not working",
  ar: "أوفيس يحتاج تفعيل / لا يعمل"
},
"Windows needs activation / Not working": {
  en: "Windows needs activation / Not working",
  ar: "ويندوز يحتاج تفعيل / لا يعمل"
},
"Forgot password (can’t sign in)": {
  en: "Forgot password (can’t sign in)",
  ar: "نسيت كلمة المرور (لا يمكن تسجيل الدخول)"
},
"“Your account is locked” message": {
  en: "“Your account is locked” message",
  ar: "رسالة \"تم قفل حسابك\""
},
"Wrong username/password (but it’s correct)": {
  en: "Wrong username/password (but it’s correct)",
  ar: "اسم المستخدم أو كلمة المرور غير صحيحة (رغم أنها صحيحة)"
},
"Can’t open a file (unsupported format)": {
  en: "Can’t open a file (unsupported format)",
  ar: "لا يمكن فتح الملف (صيغة غير مدعومة)"
},
"Date/time keeps resetting to wrong value": {
  en: "Date/time keeps resetting to wrong value",
  ar: "التاريخ أو الوقت يعيد التعيين لقيمة خاطئة"
},
"Takes too long to shut down": {
  en: "Takes too long to shut down",
  ar: "يستغرق وقتًا طويلاً عند الإغلاق"
},
"Cables not connected / Need replacement": {
  en: "Cables not connected / Need replacement",
  ar: "الأسلاك غير متصلة أو تحتاج استبدال"
}

},


    Printer: {
      "Printer is not responding": { en: "Printer is not responding", ar: "الطابعة لا تستجيب" },
      "Printer is not detected": { en: "Printer is not detected", ar: "الطابعة غير مكتشفة" },
      "Printer says \"offline\" when it’s plugged in": { en: "Printer says \"offline\" when it’s plugged in", ar: "الطابعة تظهر غير متصلة رغم توصيلها" },
      "Printer driver error pops up": { en: "Printer driver error pops up", ar: "ظهور خطأ تعريف الطابعة" },
      "Printer turns on but screen is blank": { en: "Printer turns on but screen is blank", ar: "الطابعة تعمل ولكن الشاشة فارغة" },
      "Printer keeps restarting": { en: "Printer keeps restarting", ar: "الطابعة تعيد التشغيل باستمرار" },
      "Printer makes loud grinding noises": { en: "Printer makes loud grinding noises", ar: "الطابعة تصدر أصوات طحن عالية" },
      "Printer disconnects (USB cable not working)": { en: "Printer disconnects (USB cable not working)", ar: "الطابعة تفصل (كابل USB لا يعمل)" },
      "Wi-Fi printer won’t connect to network": { en: "Wi-Fi printer won’t connect to network", ar: "الطابعة اللاسلكية لا تتصل بالشبكة" },
      "Printer works for one computer but not another": { en: "Printer works for one computer but not another", ar: "الطابعة تعمل على جهاز ولا تعمل على آخر" },
      "Can’t find printer in the list of devices": { en: "Can’t find printer in the list of devices", ar: "لا يمكن العثور على الطابعة في قائمة الأجهزة" },
      "Random error message (e.g., \"Error 0x000001\")": { en: "Random error message (e.g., \"Error 0x000001\")", ar: "رسالة خطأ عشوائية (مثل: Error 0x000001)" },
      "Print jobs stuck in queue (nothing comes out)": { en: "Print jobs stuck in queue (nothing comes out)", ar: "أوامر الطباعة عالقة (لا شيء يُطبع)" },
      "Printer is turned on but does nothing": { en: "Printer is turned on but does nothing", ar: "الطابعة تعمل لكنها لا تطبع" },
      "Printer won’t print black (only color works)": { en: "Printer won’t print black (only color works)", ar: "الطابعة لا تطبع بالأسود (تطبع ألوان فقط)" },
      "Printer won’t print colors (only black works)": { en: "Printer won’t print colors (only black works)", ar: "الطابعة لا تطبع ألوان (تطبع أسود فقط)" },
      "Ink not recognized (error even after replacing)": { en: "Ink not recognized (error even after replacing)", ar: "الحبر غير معروف (حتى بعد الاستبدال)" },
      "Printer says \"low ink\" but cartridge is new": { en: "Printer says \"low ink\" but cartridge is new", ar: "الطابعة تظهر أن الحبر منخفض رغم أنه جديد" },
      "Printer says \"out of paper\" but tray is full": { en: "Printer says \"out of paper\" but tray is full", ar: "الطابعة تقول أن الورق ناقص رغم امتلاء الصينية" },
      "Paper keeps jamming / Feeding Issues": { en: "Paper keeps jamming / Feeding Issues", ar: "الورق ينحشر باستمرار / مشاكل في السحب" },
      "Printer pulls multiple sheets at once": { en: "Printer pulls multiple sheets at once", ar: "الطابعة تسحب أكثر من ورقة في وقت واحد" },
      "Paper comes out wrinkled or crumpled": { en: "Paper comes out wrinkled or crumpled", ar: "الورق يخرج مجعد أو مكرمش" },
      "Ink smears when touched": { en: "Ink smears when touched", ar: "الحبر يتلطخ عند اللمس" },
      "Print too faint or faded": { en: "Print too faint or faded", ar: "الطباعة باهتة جدًا" },
      "Streaks or lines on printed pages": { en: "Streaks or lines on printed pages", ar: "خطوط على الصفحات المطبوعة" },
      "Spots or smudges on prints": { en: "Spots or smudges on prints", ar: "بقع أو لطخات على المطبوعات" },
      "Colors look wrong (e.g., green instead of blue)": { en: "Colors look wrong (e.g., green instead of blue)", ar: "ألوان غير صحيحة (مثل: أخضر بدل أزرق)" },
      "Wrong colors in prints": { en: "Wrong colors in prints", ar: "ألوان غير صحيحة في الطباعة" },
      "Black ink prints as blank/gray": { en: "Black ink prints as blank/gray", ar: "الحبر الأسود يُطبع رمادي أو لا يُطبع" },
      "Cartridge alignment problems": { en: "Cartridge alignment problems", ar: "مشاكل في محاذاة الخراطيش" },
      "Slow printing speed": { en: "Slow printing speed", ar: "سرعة طباعة بطيئة" },
            "Scanner won’t scan (no response)": { en: "Scanner won’t scan (no response)", ar: "الماسح لا يستجيب" },
      "Scanned image is weird or cut off": { en: "Scanned image is weird or cut off", ar: "الصورة الممسوحة غير مكتملة أو مقطوعة" },
      "Scanned documents come out blurry": { en: "Scanned documents come out blurry", ar: "المستندات الممسوحة غير واضحة" },
      "The pages are blank / empty": { en: "The pages are blank / empty", ar: "الصفحات فارغة / لا تحتوي على محتوى" },
      "Spooler errors (print jobs stuck in queue)": {
  en: "Spooler errors (print jobs stuck in queue)",
  ar: "أخطاء في خدمة الطباعة (الطباعة عالقة)"
}

    },

    Scanner: {
      "Scanner won’t scan (no response)": { en: "Scanner won’t scan (no response)", ar: "الماسح لا يستجيب" },
      "Scanned image is weird or cut off": { en: "Scanned image is weird or cut off", ar: "الصورة الممسوحة غير مكتملة أو مقطوعة" },
      "Scanned documents come out blurry": { en: "Scanned documents come out blurry", ar: "المستندات الممسوحة غير واضحة" },
      "The pages are blank / empty": { en: "The pages are blank / empty", ar: "الصفحات فارغة / لا تحتوي على محتوى" },
      "Scanner won’t turn on (no lights/noise)": { en: "Scanner won’t turn on (no lights/noise)", ar: "الماسح لا يعمل (لا أضواء أو صوت)" },
      "Scanner not detected": { en: "Scanner not detected", ar: "الماسح غير مكتشف" },
      "\"Driver not found\" error": { en: "\"Driver not found\" error", ar: "خطأ \"لم يتم العثور على التعريف\"" },
      "Scanner not showing up in the list": { en: "Scanner not showing up in the list", ar: "الماسح لا يظهر في القائمة" },
      "Scanner makes loud grinding noises": { en: "Scanner makes loud grinding noises", ar: "الماسح يصدر أصوات طحن عالية" },
      "Scanner light flickers or stays off": { en: "Scanner light flickers or stays off", ar: "ضوء الماسح يومض أو لا يعمل" },
      "Scanner makes noise but doesn’t scan": { en: "Scanner makes noise but doesn’t scan", ar: "الماسح يصدر صوتًا لكنه لا يعمل" },
      "Scanner is busy error (even when not in use)": { en: "Scanner is busy error (even when not in use)", ar: "خطأ: الماسح مشغول (حتى عند عدم الاستخدام)" },
      "Scanner won’t grab the paper (no movement)": { en: "Scanner won’t grab the paper (no movement)", ar: "الماسح لا يسحب الورق (لا حركة)" },
      "Paper jams while scanning": { en: "Paper jams while scanning", ar: "الورق ينحشر أثناء المسح" },
      "Paper gets stuck or crumpled": { en: "Paper gets stuck or crumpled", ar: "الورق يتعطل أو يتكرمش" },
      "Scanner pulls multiple pages at once": { en: "Scanner pulls multiple pages at once", ar: "الماسح يسحب عدة صفحات دفعة واحدة" },
      "Printer works but scanner doesn’t": { en: "Printer works but scanner doesn’t", ar: "الطابعة تعمل ولكن الماسح لا يعمل" },
      "Scanner disconnects randomly (USB/Wi-Fi)": { en: "Scanner disconnects randomly (USB/Wi-Fi)", ar: "الماسح ينفصل عشوائيًا (USB/واي فاي)" },
      "Scanning software freezes or crashes": { en: "Scanning software freezes or crashes", ar: "برنامج المسح يتجمد أو يتعطل" },
      "Scanner button does nothing (on all-in-one machines)": { en: "Scanner button does nothing (on all-in-one machines)", ar: "زر الماسح لا يستجيب (في الأجهزة متعددة الوظائف)" },
      "Scanned document saves as blank/black": { en: "Scanned document saves as blank/black", ar: "المستند الممسوح يُحفظ فارغًا أو أسود" },
      "Only scans part of the page (cuts off edges)": { en: "Only scans part of the page (cuts off edges)", ar: "يمسح جزءًا من الصفحة فقط (يقطع الحواف)" },
      "Scanned file won’t save": { en: "Scanned file won’t save", ar: "الملف الممسوح لا يُحفظ" },
      "File format is wrong (e.g., saves as .BMP instead of .PDF)": { en: "File format is wrong (e.g., saves as .BMP instead of .PDF)", ar: "صيغة الملف غير صحيحة (مثل: .BMP بدلاً من .PDF)" },
      "Scanned image is blurry": { en: "Scanned image is blurry", ar: "الصورة الممسوحة غير واضحة" },
      "Dark or faded scans (too light/too dark)": { en: "Dark or faded scans (too light/too dark)", ar: "الصور الممسوحة باهتة جدًا أو مظلمة" },
      "Lines or streaks on scanned documents": { en: "Lines or streaks on scanned documents", ar: "خطوط أو شرائط على المستندات الممسوحة" },
      "Colors look wrong (e.g., red looks pink)": { en: "Colors look wrong (e.g., red looks pink)", ar: "ألوان غير صحيحة (مثلاً الأحمر يبدو وردي)" },
      "Black & white scans come out gray": { en: "Black & white scans come out gray", ar: "المسح بالأبيض والأسود يظهر رمادي" },
      "Scanning takes forever (unusually slow)": { en: "Scanning takes forever (unusually slow)", ar: "المسح يستغرق وقتًا طويلاً بشكل غير طبيعي" }
    }
  },

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
function translateDepartmentName(name) {
  const lang = languageManager.currentLang || 'en';
  const cleanName = name?.trim().replace(/[’']/g, "'");
  return languageManager.departments[cleanName]?.[lang] || cleanName;
}
function translateFloorName(name) {
  const lang = languageManager.currentLang || 'en';
  const clean = name?.trim();
  return languageManager.floors?.[clean]?.[lang] || clean;
}

function translateProblemText(deviceType, text) {
  const lang = languageManager.currentLang || 'en';

  // تنظيف النص لتوحيد الصيغة
  const clean = text?.trim()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ') // توحيد المسافات
    .replace(/ /g, '');   // إزالة المسافات غير المرئية

  const normalizedType = mapDeviceType(deviceType);
  const deviceProblems = languageManager.problemStatuses?.[normalizedType];

  // إذا لقى تطابق دقيق يرجع الترجمة
  if (deviceProblems && deviceProblems[clean]) {
    return deviceProblems[clean][lang] || clean;
  }

  // إذا ما لقى تطابق دقيق، يحاول يقارن تطابق تقريبي
  if (deviceProblems) {
    const foundKey = Object.keys(deviceProblems).find(k =>
      k.trim()
        .replace(/[‘’]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, ' ')
        .replace(/ /g, '') === clean
    );

    if (foundKey) {
      return deviceProblems[foundKey][lang] || foundKey;
    }
  }

  // fallback
  return text;
}



function normalizeDeviceType(type) {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}
function mapDeviceType(deviceType) {
  const map = {
    pc: "PC",              // ← هنا التغيير
    computer: "PC",        // ← كل ما يجي باسم computer أو pc يصير "PC"
    printer: "Printer",
    scanner: "Scanner"
  };

  const key = deviceType?.toLowerCase().trim();
  return map[key] || deviceType;
}
