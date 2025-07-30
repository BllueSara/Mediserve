const db = require('../db');

const searchDeviceReports = async (req, res) => {
    try {
        const { deviceName, department } = req.query;
        
        console.log('=== SEARCH DEVICE REPORTS START ===');
        console.log('Request query:', req.query);
        console.log('Device name:', deviceName);
        console.log('Department:', department);
        
        if (!deviceName) {
            console.log('ERROR: Device name is required');
            return res.status(400).json({ error: 'Device name is required' });
        }

        // أولاً، نتحقق من أن الجهاز موجود في Maintenance_Devices وهو من نوع PC
        const deviceCheckQuery = `
            SELECT id, device_name, device_type, department_id 
            FROM Maintenance_Devices 
            WHERE device_name = ? AND LOWER(device_type) IN ('pc', 'desktop', 'laptop', 'كمبيوتر', 'لابتوب')
        `;
        
        console.log('Device check query:', deviceCheckQuery);
        console.log('Device check params:', [deviceName]);
        
        const [deviceCheck] = await db.promise().query(deviceCheckQuery, [deviceName]);
        console.log('Device check result:', deviceCheck);
        
        if (!deviceCheck || deviceCheck.length === 0) {
            console.log('No device found in Maintenance_Devices');
            return res.json([]);
        }
        
        console.log('Device found:', deviceCheck[0]);
        
        // نتأكد من أن الجهاز ينتمي للقسم المطلوب إذا تم تمريره
        if (department && deviceCheck[0].department_id) {
            console.log('Checking department match...');
            const deptQuery = `SELECT name FROM Departments WHERE id = ?`;
            const [deptResult] = await db.promise().query(deptQuery, [deviceCheck[0].department_id]);
            console.log('Department query result:', deptResult);
            
            if (deptResult.length > 0) {
                const actualDepartment = deptResult[0].name;
                console.log('Actual department:', actualDepartment, 'Expected department:', department);
                
                // تحقق من تطابق القسم (مع مراعاة الترجمة)
                const isDepartmentMatch = actualDepartment === department || 
                                        actualDepartment.includes('|') && 
                                        (actualDepartment.split('|')[0].trim() === department || 
                                         actualDepartment.split('|')[1].trim() === department);
                
                if (!isDepartmentMatch) {
                    console.log('Department mismatch. Expected:', department, 'Found:', actualDepartment);
                    return res.json([]);
                }
            }
        }

        // نستخدم device_id للبحث بدلاً من device_name
        const deviceId = deviceCheck[0].id;
        const deviceNameExact = deviceCheck[0].device_name; // نستخدم الاسم الدقيق من قاعدة البيانات
        
        console.log('Device ID:', deviceId);
        console.log('Device name exact:', deviceNameExact);
        
        // تحقق إضافي للتأكد من أن device_id صحيح
        const deviceVerificationQuery = `
            SELECT id, device_name, device_type, department_id 
            FROM Maintenance_Devices 
            WHERE id = ? AND device_name = ?
        `;
        
        const [deviceVerification] = await db.promise().query(deviceVerificationQuery, [deviceId, deviceNameExact]);
        console.log('Device verification result:', deviceVerification);
        
        if (!deviceVerification || deviceVerification.length === 0) {
            console.log('Device verification failed - ID and name mismatch');
            return res.json([]);
        }
        
        // البحث في جميع أنواع التقارير باستخدام device_id مع تحسين الفلترة
        const query = `
            SELECT DISTINCT
                id,
                maintenance_type,
                device_name,
                department,
                created_at,
                status,
                ticket_number,
                report_number,
                request_number,
                device_id
            FROM (
                SELECT 
                    rm.id,
                    'Regular' as maintenance_type,
                    md.device_name,
                    d.name as department,
                    rm.created_at,
                    rm.status,
                    NULL as ticket_number,
                    NULL as report_number,
                    NULL as request_number,
                    rm.device_id
                FROM Regular_Maintenance rm
                LEFT JOIN Maintenance_Devices md ON rm.device_id = md.id
                LEFT JOIN Departments d ON md.department_id = d.id
                WHERE rm.device_id = ? AND md.device_name = ?
                
                UNION ALL
                
                SELECT 
                    gm.id,
                    'General' as maintenance_type,
                    md.device_name,
                    gm.department_name as department,
                    gm.created_at,
                    CASE 
                        WHEN gm.problem_status LIKE '%[%' AND gm.problem_status LIKE '%]%' 
                        THEN TRIM(BOTH '"' FROM REPLACE(REPLACE(gm.problem_status, '[', ''), ']', ''))
                        ELSE gm.problem_status 
                    END as status,
                    NULL as ticket_number,
                    NULL as report_number,
                    NULL as request_number,
                    gm.device_id
                FROM General_Maintenance gm
                LEFT JOIN Maintenance_Devices md ON gm.device_id = md.id
                WHERE gm.device_id = ? AND md.device_name = ?
                
                UNION ALL
                
                SELECT 
                    em.id,
                    'External' as maintenance_type,
                    em.device_name,
                    em.department_name as department,
                    em.created_at,
                    em.status,
                    em.ticket_number,
                    NULL as report_number,
                    NULL as request_number,
                    NULL as device_id
                FROM External_Maintenance em
                WHERE em.device_name = ? AND em.department_name = ?
                
                UNION ALL
                
                SELECT 
                    it.id,
                    'Internal' as maintenance_type,
                    md.device_name,
                    d.name as department,
                    mr.created_at,
                    it.status,
                    it.ticket_number,
                    NULL as report_number,
                    NULL as request_number,
                    mr.device_id
                FROM Internal_Tickets it
                LEFT JOIN Maintenance_Reports mr ON it.id = mr.ticket_id
                LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
                LEFT JOIN Departments d ON md.department_id = d.id
                WHERE mr.device_id = ? AND md.device_name = ?
                
                UNION ALL
                
                SELECT 
                    et.id,
                    'External Ticket' as maintenance_type,
                    md.device_name,
                    d.name as department,
                    et.created_at,
                    et.status,
                    et.ticket_number,
                    NULL as report_number,
                    NULL as request_number,
                    mr.device_id
                FROM External_Tickets et
                LEFT JOIN Maintenance_Reports mr ON et.id = mr.ticket_id
                LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
                LEFT JOIN Departments d ON md.department_id = d.id
                WHERE mr.device_id = ? AND md.device_name = ?
                
                UNION ALL
                
                SELECT 
                    nmr.id,
                    'New' as maintenance_type,
                    nmr.device_name,
                    NULL as department,
                    nmr.created_at,
                    nmr.status,
                    NULL as ticket_number,
                    NULL as report_number,
                    NULL as request_number,
                    NULL as device_id
                FROM New_Maintenance_Report nmr
                WHERE nmr.device_name = ?
                
                UNION ALL
                
                SELECT 
                    mr.id,
                    'Maintenance Report' as maintenance_type,
                    md.device_name,
                    d.name as department,
                    mr.created_at,
                    mr.status,
                    NULL as ticket_number,
                    mr.report_number,
                    NULL as request_number,
                    mr.device_id
                FROM Maintenance_Reports mr
                LEFT JOIN Maintenance_Devices md ON mr.device_id = md.id
                LEFT JOIN Departments d ON md.department_id = d.id
                WHERE mr.device_id = ? AND md.device_name = ?
            ) AS combined_reports
            ORDER BY created_at DESC, id DESC
            LIMIT 10
        `;

        // تحسين المعاملات لتشمل القسم للتقارير الخارجية
        const params = [
            deviceId, deviceNameExact,        // Regular
            deviceId, deviceNameExact,        // General
            deviceNameExact, department || '', // External (uses device_name + department)
            deviceId, deviceNameExact,        // Internal
            deviceId, deviceNameExact,        // External Ticket
            deviceNameExact,                  // New (uses device_name)
            deviceId, deviceNameExact         // Maintenance Report
        ];

        console.log('Main query params:', params);
        console.log('Main query:', query);

        const result = await db.promise().query(query, params);
        console.log('Main query result:', result);
        
        // تحقق إضافي من نتيجة الاستعلام
        if (!result || !Array.isArray(result) || result.length === 0 || !result[0] || !Array.isArray(result[0])) {
            console.log('No results found from main query');
            return res.json([]);
        }
        
        const reports = result[0];
        console.log('Raw reports from database:', reports);
        
        if (!reports || reports.length === 0) {
            console.log('No reports found in result array');
            return res.json([]);
        }
        
        // تحقق إضافي للتأكد من أن جميع التقارير تعود للجهاز الصحيح
        const filteredReports = reports.filter(report => {
            const isCorrectDevice = report.device_name === deviceNameExact;
            if (!isCorrectDevice) {
                console.log(`Filtering out report with wrong device name: ${report.device_name} (expected: ${deviceNameExact})`);
            }
            return isCorrectDevice;
        });
        
        console.log('Reports after device name filtering:', filteredReports);
        
        // تحقق إضافي للتأكد من أن التقارير تحتوي على البيانات المطلوبة
        const validReports = filteredReports.filter(report => {
            const hasRequiredFields = report.id && report.maintenance_type && report.device_name;
            if (!hasRequiredFields) {
                console.log(`Filtering out report with missing required fields:`, report);
            }
            return hasRequiredFields;
        });
        
        console.log('Reports after validation:', validReports);
        
        // تحقق إضافي للتأكد من أن جميع التقارير لها device_id صحيح
        console.log('=== VERIFYING REPORTS DEVICE ID ===');
        const verifiedReports = [];
        for (const report of validReports) {
            console.log(`Report ID: ${report.id}, Type: ${report.maintenance_type}, Device: ${report.device_name}`);
            
            let isValidReport = true;
            
            // تحقق من device_id للتقارير المختلفة
            if (report.maintenance_type === 'Regular') {
                const rmQuery = `SELECT device_id FROM Regular_Maintenance WHERE id = ?`;
                const [rmResult] = await db.promise().query(rmQuery, [report.id]);
                const actualDeviceId = rmResult[0]?.device_id;
                console.log(`Regular Maintenance device_id: ${actualDeviceId}, Expected: ${deviceId}`);
                if (actualDeviceId !== deviceId) {
                    console.log(`❌ Invalid device_id for Regular Maintenance report ${report.id}`);
                    isValidReport = false;
                }
            } else if (report.maintenance_type === 'General') {
                const gmQuery = `SELECT device_id FROM General_Maintenance WHERE id = ?`;
                const [gmResult] = await db.promise().query(gmQuery, [report.id]);
                const actualDeviceId = gmResult[0]?.device_id;
                console.log(`General Maintenance device_id: ${actualDeviceId}, Expected: ${deviceId}`);
                if (actualDeviceId !== deviceId) {
                    console.log(`❌ Invalid device_id for General Maintenance report ${report.id}`);
                    isValidReport = false;
                }
            } else if (report.maintenance_type === 'Internal') {
                const itQuery = `
                    SELECT mr.device_id 
                    FROM Internal_Tickets it 
                    LEFT JOIN Maintenance_Reports mr ON it.id = mr.ticket_id 
                    WHERE it.id = ?
                `;
                const [itResult] = await db.promise().query(itQuery, [report.id]);
                const actualDeviceId = itResult[0]?.device_id;
                console.log(`Internal Ticket device_id: ${actualDeviceId}, Expected: ${deviceId}`);
                if (actualDeviceId !== deviceId) {
                    console.log(`❌ Invalid device_id for Internal Ticket report ${report.id}`);
                    isValidReport = false;
                }
            } else if (report.maintenance_type === 'External Ticket') {
                const etQuery = `
                    SELECT mr.device_id 
                    FROM External_Tickets et 
                    LEFT JOIN Maintenance_Reports mr ON et.id = mr.ticket_id 
                    WHERE et.id = ?
                `;
                const [etResult] = await db.promise().query(etQuery, [report.id]);
                const actualDeviceId = etResult[0]?.device_id;
                console.log(`External Ticket device_id: ${actualDeviceId}, Expected: ${deviceId}`);
                if (actualDeviceId !== deviceId) {
                    console.log(`❌ Invalid device_id for External Ticket report ${report.id}`);
                    isValidReport = false;
                }
            } else if (report.maintenance_type === 'Maintenance Report') {
                const mrQuery = `SELECT device_id FROM Maintenance_Reports WHERE id = ?`;
                const [mrResult] = await db.promise().query(mrQuery, [report.id]);
                const actualDeviceId = mrResult[0]?.device_id;
                console.log(`Maintenance Report device_id: ${actualDeviceId}, Expected: ${deviceId}`);
                if (actualDeviceId !== deviceId) {
                    console.log(`❌ Invalid device_id for Maintenance Report ${report.id}`);
                    isValidReport = false;
                }
            } else if (report.maintenance_type === 'External') {
                // تحقق إضافي من التقارير الخارجية للتأكد من تطابق القسم
                if (department) {
                    const emQuery = `SELECT department_name FROM External_Maintenance WHERE id = ?`;
                    const [emResult] = await db.promise().query(emQuery, [report.id]);
                    const actualDepartment = emResult[0]?.department_name;
                    console.log(`External Maintenance department: ${actualDepartment}, Expected: ${department}`);
                    
                    if (actualDepartment) {
                        const isDepartmentMatch = actualDepartment === department || 
                                                actualDepartment.includes('|') && 
                                                (actualDepartment.split('|')[0].trim() === department || 
                                                 actualDepartment.split('|')[1].trim() === department);
                        
                        if (!isDepartmentMatch) {
                            console.log(`❌ Invalid department for External Maintenance report ${report.id}`);
                            isValidReport = false;
                        }
                    }
                }
            } else if (report.maintenance_type === 'New') {
                // تحقق إضافي من التقارير الجديدة للتأكد من تطابق اسم الجهاز
                const nmrQuery = `SELECT device_name FROM New_Maintenance_Report WHERE id = ?`;
                const [nmrResult] = await db.promise().query(nmrQuery, [report.id]);
                const actualDeviceName = nmrResult[0]?.device_name;
                console.log(`New Maintenance Report device_name: ${actualDeviceName}, Expected: ${deviceNameExact}`);
                
                if (actualDeviceName !== deviceNameExact) {
                    console.log(`❌ Invalid device_name for New Maintenance Report ${report.id}`);
                    isValidReport = false;
                }
            }
            
            if (isValidReport) {
                verifiedReports.push(report);
                console.log(`✅ Valid report: ${report.id}`);
            }
        }
        console.log('=== END VERIFYING REPORTS DEVICE ID ===');
        
        console.log('Final reports to send:', verifiedReports);
        console.log('Number of reports found:', verifiedReports.length);
        
        // تحقق إضافي من ترتيب التقارير حسب التاريخ
        const sortedReports = verifiedReports.sort((a, b) => {
            const dateA = new Date(a.created_at);
            const dateB = new Date(b.created_at);
            
            // إذا كان التاريخ متساوي، رتب حسب ID تنازلي (الأكبر أولاً)
            if (dateA.getTime() === dateB.getTime()) {
                return b.id - a.id;
            }
            
            return dateB - dateA; // ترتيب تنازلي (الأحدث أولاً)
        });
        
        // تحقق إضافي من أن التقرير الأول هو الأحدث فعلاً
        if (sortedReports.length > 1) {
            const firstReportDate = new Date(sortedReports[0].created_at);
            const secondReportDate = new Date(sortedReports[1].created_at);
            
            if (secondReportDate > firstReportDate) {
                console.warn('⚠️ Warning: Reports are not properly sorted by date');
                console.log('First report date:', firstReportDate);
                console.log('Second report date:', secondReportDate);
                
                // إعادة ترتيب التقارير بشكل صحيح
                sortedReports.sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    
                    // إذا كان التاريخ متساوي، رتب حسب ID تنازلي
                    if (dateA.getTime() === dateB.getTime()) {
                        return b.id - a.id;
                    }
                    
                    return dateB - dateA;
                });
                
                console.log('Reports re-sorted by date and ID');
            } else if (firstReportDate.getTime() === secondReportDate.getTime()) {
                // إذا كان التاريخ متساوي، تأكد من أن الأول له ID أكبر
                if (sortedReports[0].id < sortedReports[1].id) {
                    console.warn('⚠️ Warning: Reports with same date, re-sorting by ID');
                    sortedReports.sort((a, b) => {
                        const dateA = new Date(a.created_at);
                        const dateB = new Date(b.created_at);
                        
                        if (dateA.getTime() === dateB.getTime()) {
                            return b.id - a.id;
                        }
                        
                        return dateB - dateA;
                    });
                    
                    console.log('Reports re-sorted by ID for same date');
                }
            }
        }
        
        console.log('Reports after sorting by date:', sortedReports);
        console.log('=== SEARCH DEVICE REPORTS END ===');
        
        // تحقق نهائي من أن جميع التقارير تعود للجهاز الصحيح
        const finalValidReports = sortedReports.filter(report => {
            const isValid = report.device_name === deviceNameExact;
            if (!isValid) {
                console.error(`❌ Final validation failed: Report ${report.id} has wrong device name: ${report.device_name} (expected: ${deviceNameExact})`);
            }
            return isValid;
        });
        
        if (finalValidReports.length !== sortedReports.length) {
            console.warn(`⚠️ Warning: Filtered out ${sortedReports.length - finalValidReports.length} reports with wrong device names`);
        }
        
        console.log('Final valid reports count:', finalValidReports.length);
        
        // تحقق نهائي من ترتيب التقارير
        if (finalValidReports.length > 1) {
            const firstDate = new Date(finalValidReports[0].created_at);
            const secondDate = new Date(finalValidReports[1].created_at);
            
            if (secondDate > firstDate) {
                console.error('❌ Final validation failed: Reports are not properly sorted');
                console.error('First report date:', firstDate);
                console.error('Second report date:', secondDate);
                
                // إعادة ترتيب التقارير بشكل صحيح
                finalValidReports.sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    return dateB - dateA;
                });
                
                console.log('✅ Reports re-sorted correctly');
            }
        }
        
        console.log('Final reports to send:', finalValidReports);
        
        // تحقق نهائي من أن جميع التقارير تحتوي على البيانات المطلوبة
        const fullyValidReports = finalValidReports.filter(report => {
            const hasRequiredFields = report.id && 
                                    report.maintenance_type && 
                                    report.device_name && 
                                    report.device_name === deviceNameExact &&
                                    report.created_at;
            
            if (!hasRequiredFields) {
                console.error(`❌ Final validation failed: Report ${report.id} missing required fields`);
                console.error('Report data:', report);
            }
            
            return hasRequiredFields;
        });
        
        if (fullyValidReports.length !== finalValidReports.length) {
            console.warn(`⚠️ Warning: Filtered out ${finalValidReports.length - fullyValidReports.length} reports with missing required fields`);
        }
        
        console.log('Fully valid reports count:', fullyValidReports.length);
        
        // تحقق نهائي من ترتيب التقارير
        if (fullyValidReports.length > 1) {
            const firstDate = new Date(fullyValidReports[0].created_at);
            const secondDate = new Date(fullyValidReports[1].created_at);
            
            if (secondDate > firstDate) {
                console.error('❌ Final validation failed: Reports are not properly sorted');
                console.error('First report date:', firstDate);
                console.error('Second report date:', secondDate);
                
                // إعادة ترتيب التقارير بشكل صحيح
                fullyValidReports.sort((a, b) => {
                    const dateA = new Date(a.created_at);
                    const dateB = new Date(b.created_at);
                    
                    // إذا كان التاريخ متساوي، رتب حسب ID تنازلي
                    if (dateA.getTime() === dateB.getTime()) {
                        return b.id - a.id;
                    }
                    
                    return dateB - dateA;
                });
                
                console.log('✅ Reports re-sorted correctly');
            } else if (firstDate.getTime() === secondDate.getTime()) {
                // إذا كان التاريخ متساوي، تأكد من أن الأول له ID أكبر
                if (fullyValidReports[0].id < fullyValidReports[1].id) {
                    console.warn('⚠️ Final validation: Reports with same date, ensuring highest ID is first');
                    fullyValidReports.sort((a, b) => {
                        const dateA = new Date(a.created_at);
                        const dateB = new Date(b.created_at);
                        
                        if (dateA.getTime() === dateB.getTime()) {
                            return b.id - a.id;
                        }
                        
                        return dateB - dateA;
                    });
                    
                    console.log('✅ Reports re-sorted by ID for same date');
                }
            }
        }
        
        // تحقق نهائي من أن التقرير الأول هو الصحيح
        if (fullyValidReports.length > 0) {
            const firstReport = fullyValidReports[0];
            console.log('=== FINAL VALIDATION OF FIRST REPORT ===');
            console.log('First report ID:', firstReport.id);
            console.log('First report type:', firstReport.maintenance_type);
            console.log('First report device:', firstReport.device_name);
            console.log('First report date:', firstReport.created_at);
            console.log('Expected device:', deviceNameExact);
            
            // تحقق من أن التقرير الأول يخص الجهاز الصحيح
            if (firstReport.device_name !== deviceNameExact) {
                console.error('❌ CRITICAL ERROR: First report has wrong device name!');
                console.error('First report device:', firstReport.device_name);
                console.error('Expected device:', deviceNameExact);
                
                // ابحث عن تقرير بالجهاز الصحيح
                const correctReport = fullyValidReports.find(r => r.device_name === deviceNameExact);
                if (correctReport) {
                    console.log('✅ Found correct report, moving it to first position');
                    // انقل التقرير الصحيح للمرتبة الأولى
                    const index = fullyValidReports.indexOf(correctReport);
                    if (index > 0) {
                        fullyValidReports.splice(index, 1);
                        fullyValidReports.unshift(correctReport);
                    }
                }
            } else {
                console.log('✅ First report validation passed');
            }
        }
        
        console.log('Final sorted reports to send:', fullyValidReports);
        
        res.json(fullyValidReports);

    } catch (error) {
        console.error('=== ERROR IN SEARCH DEVICE REPORTS ===');
        console.error('Error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { searchDeviceReports }; 