// ============================================================
//  i18n.js — shared translations for EduMinat
// ============================================================
const TRANSLATIONS = {
    en: {
        'app.name': 'EduMinat',
        'role.student': 'Student',
        'role.parent': 'Parent',
        'role.teacher': 'Teacher',
        'role.organizer': 'Organizer',
        'role.kpm': 'KPM Officer',

        // Login
        'login.headline': 'Track competitions,<br>earn PAJSK marks.',
        'login.subtext': 'One platform for students, parents, teachers, organizers, and KPM.',
        'login.welcome': 'Welcome back',
        'login.pick_role': 'Select a role to auto-fill demo credentials',
        'login.iam': 'I am a',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.btn': 'Log in',
        'login.hint': 'Demo credentials auto-fill based on role',
        'login.feat1': 'Browse & register competitions',
        'login.feat2': 'Monitor PAJSK progress',
        'login.feat3': 'Manage student participation',
        'login.feat4': 'Approve & generate letters',
        'login.invalid': 'Invalid credentials',
        'login.welcome_user': 'Welcome, {name}!',

        // Nav
        'nav.dashboard': 'Dashboard',
        'nav.browse': 'Browse',
        'nav.mycomps': 'My Competitions',
        'nav.pajsk': 'PAJSK',
        'nav.logout': 'Logout',
        'nav.my_events': 'My Events',
        'nav.submit_comp': 'Submit Competition',
        'nav.queue': 'Approval Queue',
        'nav.all_comps': 'All Competitions',
        'nav.reports': 'Reports',
        'nav.class': 'Class Overview',
        'nav.child': 'Child Progress',
        'nav.reset': 'Reset Demo',
        'nav.analytics': 'Analytics',
        'kpm.analytics_title': 'National <span>Analytics</span>',
        'kpm.kpi_schools': 'Schools',
        'kpm.kpi_students': 'Active Students',
        'kpm.kpi_avg_pajsk': 'Avg PAJSK',
        'kpm.kpi_total_marks': 'Total Marks Awarded',
        'kpm.chart_by_level': 'Competitions by Level',
        'kpm.chart_by_category': 'Competitions by Category',
        'kpm.chart_pajsk_trend': 'PAJSK Awarded (Last 6 Months)',
        'kpm.no_data': 'Not enough data yet',

        // Common
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.back': 'Back',
        'common.manage': 'Manage',
        'common.approve': 'Approve',
        'common.reject': 'Reject',
        'common.acknowledge': 'Acknowledge',
        'common.download_pdf': 'Download PDF',
        'common.download_xlsx': 'Download Excel',
        'common.upload_results': 'Upload Results',
        'common.submit': 'Submit',
        'common.submit_for_approval': 'Submit for KPM Approval',
        'common.confirm_import': 'Confirm Import',
        'common.preview_import': 'Preview Import Results',
        'common.review_before': 'Review before committing changes',
        'common.apply_n': 'Apply {n} changes',
        'common.nothing_to_apply': 'Nothing to apply',
        'common.generating': 'Generating...',
        'common.error': 'Error',
        'common.not_found': 'Not Found',
        'common.competition_missing': 'Competition missing.',

        // Student
        'student.hello': 'Hello',
        'student.pajsk_total': 'PAJSK Marks',
        'student.pajsk_sub': 'accumulated',
        'student.joined': 'Joined',
        'student.joined_sub': 'active now',
        'student.completed': 'Completed',
        'student.completed_sub': 'this year',
        'student.ongoing': 'Ongoing Competitions',
        'student.ongoing_empty': 'No active competitions.',
        'student.past': 'Completed Competitions',
        'student.past_empty': 'No completed competitions yet.',
        'student.browse_title': 'Browse <span>Competitions</span>',
        'student.browse_empty': 'No competitions available.',
        'student.my_title': 'My <span>Competitions</span>',
        'student.my_empty': 'You have not registered for any competitions.',
        'student.pajsk_title': 'PAJSK <span>Analysis</span>',
        'student.pajsk_base': 'Attendance + Position',
        'student.pajsk_base_sub': 'base',
        'student.pajsk_comp': 'Competitions',
        'student.pajsk_comp_sub': 'from events',
        'student.pajsk_total_lbl': 'Total',
        'student.pajsk_overall': 'overall',
        'student.pajsk_breakdown': 'Breakdown by Competition (KPM PAJSK)',
        'student.pajsk_empty': 'No marks recorded yet.',
        'student.register': 'Register',
        'student.registered': 'Registered',
        'student.registered_toast': 'Registered successfully!',
        'student.max_marks': 'Max Marks',
        'student.marks': 'Marks',

        // Table headers
        'th.competition': 'Competition',
        'th.organizer': 'Organizer',
        'th.category': 'Category',
        'th.date': 'Date',
        'th.level': 'Level',
        'th.marks_promise': 'Max Marks',
        'th.status': 'Status',
        'th.result': 'Result',
        'th.marks': 'Marks',
        'th.participation': 'Participation',
        'th.achievement': 'Achievement',
        'th.total': 'Total',
        'th.student': 'Student',
        'th.class': 'Class',
        'th.name': 'Name',
        'th.participants': 'Participants',
        'th.total_pajsk': 'Total PAJSK',
        'th.actions': 'Actions',

        // Organizer
        'org.my_events': 'My <span>Events</span>',
        'org.approved': 'Approved',
        'org.approved_sub': 'open for participants',
        'org.pending': 'Pending',
        'org.pending_sub': 'waiting for KPM',
        'org.completed': 'Completed',
        'org.completed_sub': 'report submitted',
        'org.manage_title': 'Event Management',
        'org.create_event': 'Create Event',
        'org.no_events': 'No events yet. Create one to start.',
        'org.comp_details': 'Competition Details',
        'org.participants_n': 'Participants',
        'org.no_participants': 'No registered participants yet.',
        'org.excel_help': 'How to use Excel',
        'org.excel_help_1': '1) Click Download Excel to get the participant list.',
        'org.excel_help_2': '2) Fill in the Result column (Johan / Naib Johan / Ketiga / Keempat / Kelima / Penyertaan).',
        'org.excel_help_3': '3) Save the file and click Upload Results.',
        'org.submit_report': 'Submit Report to KPM',
        'org.submit_report_desc': 'All results entered. Submit report for KPM approval and recognition.',
        'org.report_sent': 'Report Submitted',
        'org.report_sent_desc': 'Waiting for KPM confirmation and acknowledgement letter.',
        'org.level': 'Level',
        'org.engagement': 'Engagement',
        'org.participation_score': 'Participation Score',
        'org.max_achievement': 'Max. Achievement',
        'org.manage_prefix': 'Manage:',
        'org.new_comp_title': 'Submit <span>Competition</span>',
        'org.comp_name': 'Competition Name',
        'org.comp_desc': 'Description',
        'org.comp_category': 'Category',
        'org.comp_date': 'Date',
        'org.comp_level': 'Level',
        'org.comp_engagement': 'Engagement Type',
        'org.max_pajsk': 'Maximum PAJSK marks',
        'org.max_pajsk_sub': 'Participation + Achievement (Johan)',
        'org.set_result': '— Not set —',
        'org.pick_result': 'Pick a result first',
        'org.saved_result': '{result} · {marks} PAJSK',
        'org.save_failed': 'Failed to save result',
        'org.report_submitted': 'Report sent to KPM',
        'org.report_failed': 'Failed to send report',
        'org.import_reading': 'Reading file...',
        'org.import_success': '✅ {n} results updated',
        'org.import_failed': 'Failed to save changes',
        'org.import_error': 'Failed to read file',
        'org.export_success': 'Excel downloaded',
        'org.export_failed': 'Failed to download Excel',
        'org.no_export': 'No participants to export',
        'org.apply_changes': 'Apply {n} changes',
        'org.nothing_apply': 'Nothing to apply',
        'org.name_required': 'Name required',
        'org.date_required': 'Date required',

        // KPM
        'kpm.queue_title': 'KPM <span>Approval Queue</span>',
        'kpm.waiting': 'Waiting',
        'kpm.approved': 'Approved',
        'kpm.total': 'Total',
        'kpm.reports_title': 'Reports &amp; <span>Acknowledgement Letters</span>',
        'kpm.pending': 'Pending',
        'kpm.pending_sub': 'needs verification',
        'kpm.verified': 'Verified',
        'kpm.verified_sub': 'letters ready',
        'kpm.reports': 'Organizer Reports',
        'kpm.no_pending': 'No pending applications.',
        'kpm.no_comps': 'No competitions in the system.',
        'kpm.no_reports': 'No reports submitted yet.',
        'kpm.approved_toast': 'Competition approved',
        'kpm.rejected_toast': 'Competition rejected',
        'kpm.ack_toast': 'Report acknowledged',
        'kpm.pdf_preparing': 'Preparing PDF letter...',
        'kpm.pdf_success': 'PDF downloaded',
        'kpm.pdf_failed': 'Failed to generate PDF',

        // Result labels
        'result.johan': 'Johan (1st)',
        'result.naib_johan': 'Naib Johan (2nd)',
        'result.ketiga': 'Third Place',
        'result.keempat': 'Fourth Place',
        'result.kelima': 'Fifth Place',
        'result.penyertaan': 'Participation',

        // Levels
        'level.antarabangsa': 'International',
        'level.kebangsaan': 'National',
        'level.negeri': 'State',
        'level.bahagian': 'Division (Sabah/Sarawak)',
        'level.zon_daerah': 'Zone/District',

        // Engagement types
        'eng.1': 'Type I (Ranked competition)',
        'eng.2': 'Type II (Non-ranked / Committee)',
        'eng.3': 'Type III (Online, no live interaction / Spectator)',
        'org.engagement_short': 'Type {n}',

        // Statuses
        'status.registered': 'Registered',
        'status.ongoing': 'Ongoing',
        'status.completed': 'Completed',
        'status.pending': 'Pending',
        'status.approved': 'Approved',
        'status.rejected': 'Rejected',
        'status.submitted': 'Submitted',
        'status.acknowledged': 'Acknowledged',

        // Parent
        'parent.title': 'Progress of <span>{name}</span>',
        'parent.class': 'Class',
        'parent.pajsk': 'PAJSK Marks',
        'parent.comps': 'Competitions',
        'parent.activity': 'Activity',
        'parent.no_activity': 'No activity yet.',
        'parent.no_child': 'No child record found.',
        'parent.children': 'Children',
        'parent.total_pajsk': 'Total PAJSK',
        'parent.total_activities': 'Activities',

        // Teacher
        'teacher.title': 'Class <span>Overview</span>',
        'teacher.students': 'Students',
        'teacher.avg_pajsk': 'Average PAJSK',
        'teacher.active': 'Active',
        'teacher.student_list': 'Student List',
        'teacher.no_students': 'No students.',
        'teacher.all_classes': 'All Classes',
        'teacher.across_selection': 'across selection',
        'teacher.completed_lower': 'completed',
        'teacher.students_lower': 'students',
        'teacher.avg': 'Avg',
        'teacher.completed': 'Completed',
        'common.view': 'View',
        'common.close': 'Close',

        // Teacher add manual mark
        'nav.manual_mark': 'Add PAJSK Mark',
        'manual.title': 'Add Manual PAJSK',
        'manual.subtitle': 'For school-level or unlisted competitions',
        'manual.student': 'Student',
        'manual.select_student': '— Select student —',
        'manual.competition': 'Competition Name',
        'manual.competition_ph': 'e.g. School Science Fair 2026',
        'manual.level': 'Level',
        'manual.engagement': 'Engagement Type',
        'manual.result': 'Result',
        'manual.score_preview': 'PAJSK Score',
        'manual.participation_part': 'Participation',
        'manual.achievement_part': 'Achievement',
        'manual.total_part': 'Total',
        'manual.save': 'Save Mark',
        'manual.saved': 'PAJSK mark added: {marks} marks',
        'manual.error_student': 'Please select a student',
        'manual.error_name': 'Please enter a competition name',
        'manual.error_result': 'Please select a result',
        'teacher.add_mark': 'Add mark',

        // Teacher bulk upload
        'nav.bulk_import': 'Bulk Import',
        'bulk.title': 'Bulk Import PAJSK Marks',
        'bulk.subtitle': 'For school-level or unlisted competitions',
        'bulk.download_template': 'Download Template',
        'bulk.upload_file': 'Upload Filled Excel',
        'bulk.instructions_title': 'How to use',
        'bulk.instruction_1': '1. Click Download Template to get an Excel file with all students pre-filled.',
        'bulk.instruction_2': '2. Fill in CompetitionName, Level, Engagement, and Result columns for each row.',
        'bulk.instruction_3': '3. Save the file, then click Upload Filled Excel.',
        'bulk.instruction_4': '4. Review the preview and click Confirm to save.',
        'bulk.valid_levels': 'Valid Levels',
        'bulk.valid_engagements': 'Valid Engagements',
        'bulk.valid_results': 'Valid Results',
        'bulk.preview_title': 'Preview Bulk Import',
        'bulk.preview_sub': 'Review before committing changes',
        'bulk.chip_new': '{n} new',
        'bulk.chip_error': '{n} errors',
        'bulk.chip_skip': '{n} skipped',
        'bulk.confirm': 'Confirm Import',
        'bulk.apply_n': 'Apply {n} marks',
        'bulk.nothing': 'Nothing to apply',
        'bulk.reading': 'Reading file...',
        'bulk.saved': '✅ {n} marks added',
        'bulk.failed': 'Failed to save marks',
        'bulk.no_file': 'No file selected',
        'bulk.template_downloaded': 'Template downloaded',
        'bulk.template_failed': 'Failed to generate template',
        'bulk.row': 'Row',

        // Teacher analytics
        'nav.teacher_analytics': 'Analytics',
        'teacher.analytics_title': 'Class <span>Analytics</span>',
        'teacher.kpi_students': 'Students',
        'teacher.kpi_classes': 'Classes',
        'teacher.kpi_avg_pajsk': 'Avg PAJSK',
        'teacher.kpi_active_rate': 'Active Rate',
        'teacher.chart_class_pajsk': 'Average PAJSK by Class',
        'teacher.chart_activity': 'Student Activity Status',
        'teacher.chart_top_students': 'Top 10 Students by PAJSK',
        'teacher.activity_active': 'Active now',
        'teacher.activity_completed': 'Completed',
        'teacher.activity_inactive': 'No activity',

        // Tour banner
        'tour.title': 'Welcome to EduMinat',
        'tour.body': 'This demo shows the full KPM PAJSK flow. Try it end-to-end:',
        'tour.step1': 'Create a competition as Organizer',
        'tour.step2': 'Approve it as KPM',
        'tour.step3': 'Register as a Student',
        'tour.step4': 'Award results & submit report',
        'tour.step5': 'Generate the acknowledgement letter',
        'tour.dismiss': 'Got it',
        'tour.help': 'Show tour again',
    },

    // ============================================================
    //  BAHASA MELAYU
    // ============================================================
    my: {
        'app.name': 'EduMinat',
        'role.student': 'Pelajar',
        'role.parent': 'Ibu Bapa',
        'role.teacher': 'Guru',
        'role.organizer': 'Penganjur',
        'role.kpm': 'Pegawai KPM',

        'login.headline': 'Jejak pertandingan,<br>kumpul mata PAJSK.',
        'login.subtext': 'Satu platform untuk pelajar, ibu bapa, guru, penganjur, dan KPM.',
        'login.welcome': 'Selamat kembali',
        'login.pick_role': 'Pilih peranan untuk isi kredensial demo',
        'login.iam': 'Saya seorang',
        'login.email': 'E-mel',
        'login.password': 'Kata laluan',
        'login.btn': 'Log masuk',
        'login.hint': 'Kredensial demo diisi automatik mengikut peranan',
        'login.feat1': 'Cari & daftar pertandingan',
        'login.feat2': 'Pantau kemajuan PAJSK',
        'login.feat3': 'Urus penyertaan pelajar',
        'login.feat4': 'Lulus & jana surat',
        'login.invalid': 'Kredensial tidak sah',
        'login.welcome_user': 'Selamat datang, {name}!',

        'nav.dashboard': 'Papan Pemuka',
        'nav.browse': 'Cari',
        'nav.mycomps': 'Pertandingan Saya',
        'nav.pajsk': 'PAJSK',
        'nav.logout': 'Log keluar',
        'nav.my_events': 'Acara Saya',
        'nav.submit_comp': 'Hantar Pertandingan',
        'nav.queue': 'Senarai Kelulusan',
        'nav.all_comps': 'Semua Pertandingan',
        'nav.reports': 'Laporan',
        'nav.class': 'Gambaran Kelas',
        'nav.child': 'Kemajuan Anak',
        'nav.reset': 'Set Semula Demo',
        'nav.analytics': 'Analitik',
        'kpm.analytics_title': 'Analitik <span>Kebangsaan</span>',
        'kpm.kpi_schools': 'Sekolah',
        'kpm.kpi_students': 'Pelajar Aktif',
        'kpm.kpi_avg_pajsk': 'Purata PAJSK',
        'kpm.kpi_total_marks': 'Jumlah Mata Diagihkan',
        'kpm.chart_by_level': 'Pertandingan Mengikut Peringkat',
        'kpm.chart_by_category': 'Pertandingan Mengikut Kategori',
        'kpm.chart_pajsk_trend': 'Mata PAJSK Diagihkan (6 Bulan Terakhir)',
        'kpm.no_data': 'Belum cukup data',

        'common.loading': 'Memuatkan...',
        'common.save': 'Simpan',
        'common.cancel': 'Batal',
        'common.back': 'Kembali',
        'common.manage': 'Urus',
        'common.approve': 'Lulus',
        'common.reject': 'Tolak',
        'common.acknowledge': 'Sahkan',
        'common.download_pdf': 'Muat Turun PDF',
        'common.download_xlsx': 'Muat Turun Excel',
        'common.upload_results': 'Muat Naik Keputusan',
        'common.submit': 'Hantar',
        'common.submit_for_approval': 'Hantar untuk Kelulusan KPM',
        'common.confirm_import': 'Sahkan Import',
        'common.preview_import': 'Pratonton Import Keputusan',
        'common.review_before': 'Semak sebelum membuat perubahan',
        'common.apply_n': 'Guna {n} perubahan',
        'common.nothing_to_apply': 'Tiada perubahan',
        'common.generating': 'Menjana...',
        'common.error': 'Ralat',
        'common.not_found': 'Tidak Dijumpai',
        'common.competition_missing': 'Pertandingan tidak dijumpai.',

        'student.hello': 'Hai',
        'student.pajsk_total': 'Mata PAJSK',
        'student.pajsk_sub': 'terkumpul',
        'student.joined': 'Disertai',
        'student.joined_sub': 'aktif sekarang',
        'student.completed': 'Tamat',
        'student.completed_sub': 'sepanjang tahun',
        'student.ongoing': 'Pertandingan Sedang Disertai',
        'student.ongoing_empty': 'Belum mendaftar sebarang pertandingan aktif.',
        'student.past': 'Pertandingan Telah Tamat',
        'student.past_empty': 'Belum ada pertandingan yang tamat.',
        'student.browse_title': 'Cari <span>Pertandingan</span>',
        'student.browse_empty': 'Tiada pertandingan tersedia.',
        'student.my_title': 'Pertandingan <span>Saya</span>',
        'student.my_empty': 'Anda belum mendaftar sebarang pertandingan.',
        'student.pajsk_title': 'Analisa <span>Mata PAJSK</span>',
        'student.pajsk_base': 'Kehadiran + Jawatan',
        'student.pajsk_base_sub': 'asas',
        'student.pajsk_comp': 'Pertandingan',
        'student.pajsk_comp_sub': 'dari acara',
        'student.pajsk_total_lbl': 'Jumlah',
        'student.pajsk_overall': 'keseluruhan',
        'student.pajsk_breakdown': 'Pecahan Mengikut Pertandingan (KPM PAJSK)',
        'student.pajsk_empty': 'Belum ada markah direkodkan.',
        'student.register': 'Daftar',
        'student.registered': 'Berdaftar',
        'student.registered_toast': 'Berjaya mendaftar!',
        'student.max_marks': 'Markah Maksimum',
        'student.marks': 'Mata',

        'th.competition': 'Pertandingan',
        'th.organizer': 'Penganjur',
        'th.category': 'Kategori',
        'th.date': 'Tarikh',
        'th.level': 'Peringkat',
        'th.marks_promise': 'Markah Maksimum',
        'th.status': 'Status',
        'th.result': 'Keputusan',
        'th.marks': 'Mata',
        'th.participation': 'Penglibatan',
        'th.achievement': 'Pencapaian',
        'th.total': 'Jumlah',
        'th.student': 'Pelajar',
        'th.class': 'Kelas',
        'th.name': 'Nama',
        'th.participants': 'Peserta',
        'th.total_pajsk': 'Jumlah PAJSK',
        'th.actions': 'Tindakan',

        'org.my_events': 'Acara <span>Saya</span>',
        'org.approved': 'Diluluskan',
        'org.approved_sub': 'sedia untuk peserta',
        'org.pending': 'Menunggu',
        'org.pending_sub': 'menunggu KPM',
        'org.completed': 'Tamat',
        'org.completed_sub': 'laporan dihantar',
        'org.manage_title': 'Pengurusan Acara',
        'org.create_event': 'Cipta Acara',
        'org.no_events': 'Belum ada acara. Cipta satu untuk mula.',
        'org.comp_details': 'Butiran Pertandingan',
        'org.participants_n': 'Peserta',
        'org.no_participants': 'Tiada peserta berdaftar setakat ini.',
        'org.excel_help': 'Cara guna Excel',
        'org.excel_help_1': '1) Klik Muat Turun Excel untuk senarai peserta.',
        'org.excel_help_2': '2) Isi kolum Result (Johan / Naib Johan / Ketiga / Keempat / Kelima / Penyertaan).',
        'org.excel_help_3': '3) Simpan fail dan klik Muat Naik Keputusan.',
        'org.submit_report': 'Hantar Laporan ke KPM',
        'org.submit_report_desc': 'Semua keputusan telah dimasukkan. Hantar laporan untuk kelulusan dan pengiktirafan KPM.',
        'org.report_sent': 'Laporan Telah Dihantar',
        'org.report_sent_desc': 'Menunggu pengesahan dan surat pengiktirafan daripada KPM.',
        'org.level': 'Peringkat',
        'org.engagement': 'Penglibatan',
        'org.participation_score': 'Skor Penglibatan',
        'org.max_achievement': 'Maks. Pencapaian',
        'org.manage_prefix': 'Urus:',
        'org.new_comp_title': 'Hantar <span>Pertandingan</span>',
        'org.comp_name': 'Nama Pertandingan',
        'org.comp_desc': 'Deskripsi',
        'org.comp_category': 'Kategori',
        'org.comp_date': 'Tarikh',
        'org.comp_level': 'Peringkat',
        'org.comp_engagement': 'Jenis Penglibatan',
        'org.max_pajsk': 'Markah PAJSK Maksimum',
        'org.max_pajsk_sub': 'Penglibatan + Pencapaian (Johan)',
        'org.set_result': '— Belum ditetapkan —',
        'org.pick_result': 'Pilih keputusan dahulu',
        'org.saved_result': '{result} · {marks} PAJSK',
        'org.save_failed': 'Gagal simpan keputusan',
        'org.report_submitted': 'Laporan dihantar ke KPM',
        'org.report_failed': 'Gagal hantar laporan',
        'org.import_reading': 'Membaca fail...',
        'org.import_success': '✅ {n} keputusan dikemas kini',
        'org.import_failed': 'Gagal menyimpan perubahan',
        'org.import_error': 'Gagal membaca fail',
        'org.export_success': 'Excel dimuat turun',
        'org.export_failed': 'Gagal muat turun Excel',
        'org.no_export': 'Tiada peserta untuk dieksport',
        'org.apply_changes': 'Guna {n} perubahan',
        'org.nothing_apply': 'Tiada perubahan',
        'org.name_required': 'Nama diperlukan',
        'org.date_required': 'Tarikh diperlukan',

        'kpm.queue_title': 'KPM <span>Senarai Kelulusan</span>',
        'kpm.waiting': 'Menunggu',
        'kpm.approved': 'Diluluskan',
        'kpm.total': 'Jumlah',
        'kpm.reports_title': 'Laporan &amp; <span>Surat Pengiktirafan</span>',
        'kpm.pending': 'Menunggu',
        'kpm.pending_sub': 'perlu disahkan',
        'kpm.verified': 'Disahkan',
        'kpm.verified_sub': 'surat sedia',
        'kpm.reports': 'Laporan Penganjur',
        'kpm.no_pending': 'Tiada permohonan menunggu.',
        'kpm.no_comps': 'Tiada pertandingan dalam sistem.',
        'kpm.no_reports': 'Tiada laporan dihantar setakat ini.',
        'kpm.approved_toast': 'Pertandingan diluluskan',
        'kpm.rejected_toast': 'Pertandingan ditolak',
        'kpm.ack_toast': 'Laporan disahkan',
        'kpm.pdf_preparing': 'Menyediakan surat PDF...',
        'kpm.pdf_success': 'PDF dimuat turun',
        'kpm.pdf_failed': 'Gagal menjana PDF',

        'result.johan': 'Johan',
        'result.naib_johan': 'Naib Johan',
        'result.ketiga': 'Ketiga',
        'result.keempat': 'Keempat',
        'result.kelima': 'Kelima',
        'result.penyertaan': 'Penyertaan',

        'level.antarabangsa': 'Antarabangsa',
        'level.kebangsaan': 'Kebangsaan',
        'level.negeri': 'Negeri',
        'level.bahagian': 'Bahagian (Sabah/Sarawak)',
        'level.zon_daerah': 'Zon/Daerah',

        'eng.1': 'Penglibatan I (Pertandingan berperingkat)',
        'eng.2': 'Penglibatan II (Tanpa pemeringkatan / Jawatankuasa)',
        'eng.3': 'Penglibatan III (Dalam talian tanpa interaksi langsung / Penonton)',
        'org.engagement_short': 'Jenis {n}',

        'status.registered': 'Berdaftar',
        'status.ongoing': 'Berjalan',
        'status.completed': 'Tamat',
        'status.pending': 'Menunggu',
        'status.approved': 'Diluluskan',
        'status.rejected': 'Ditolak',
        'status.submitted': 'Dihantar',
        'status.acknowledged': 'Disahkan',

        'parent.title': 'Kemajuan <span>{name}</span>',
        'parent.class': 'Kelas',
        'parent.pajsk': 'Mata PAJSK',
        'parent.comps': 'Pertandingan',
        'parent.activity': 'Aktiviti',
        'parent.no_activity': 'Belum ada aktiviti.',
        'parent.no_child': 'Tiada rekod anak.',
        'parent.children': 'Anak',
        'parent.total_pajsk': 'Jumlah PAJSK',
        'parent.total_activities': 'Aktiviti',

        'teacher.title': 'Gambaran <span>Kelas</span>',
        'teacher.students': 'Pelajar',
        'teacher.avg_pajsk': 'Purata PAJSK',
        'teacher.active': 'Aktif',
        'teacher.student_list': 'Senarai Pelajar',
        'teacher.no_students': 'Tiada pelajar.',
        'teacher.all_classes': 'Semua Kelas',
        'teacher.across_selection': 'dalam pilihan',
        'teacher.completed_lower': 'tamat',
        'teacher.students_lower': 'pelajar',
        'teacher.avg': 'Purata',
        'teacher.completed': 'Tamat',
        'common.view': 'Lihat',
        'common.close': 'Tutup',

        // Teacher add manual mark
        'nav.manual_mark': 'Tambah Mata PAJSK',
        'manual.title': 'Tambah Mata PAJSK Manual',
        'manual.subtitle': 'Untuk pertandingan peringkat sekolah atau tidak tersenarai',
        'manual.student': 'Pelajar',
        'manual.select_student': '— Pilih pelajar —',
        'manual.competition': 'Nama Pertandingan',
        'manual.competition_ph': 'cth. Pesta Sains Sekolah 2026',
        'manual.level': 'Peringkat',
        'manual.engagement': 'Jenis Penglibatan',
        'manual.result': 'Keputusan',
        'manual.score_preview': 'Skor PAJSK',
        'manual.participation_part': 'Penglibatan',
        'manual.achievement_part': 'Pencapaian',
        'manual.total_part': 'Jumlah',
        'manual.save': 'Simpan Mata',
        'manual.saved': 'Mata PAJSK ditambah: {marks} mata',
        'manual.error_student': 'Sila pilih pelajar',
        'manual.error_name': 'Sila masukkan nama pertandingan',
        'manual.error_result': 'Sila pilih keputusan',
        'teacher.add_mark': 'Tambah mata',

        //teacher bulk upload
        'nav.bulk_import': 'Import Pukal',
        'bulk.title': 'Import Pukal Mata PAJSK',
        'bulk.subtitle': 'Untuk pertandingan peringkat sekolah atau tidak tersenarai',
        'bulk.download_template': 'Muat Turun Templat',
        'bulk.upload_file': 'Muat Naik Excel',
        'bulk.instructions_title': 'Cara guna',
        'bulk.instruction_1': '1. Klik Muat Turun Templat untuk fail Excel dengan semua pelajar.',
        'bulk.instruction_2': '2. Isi kolum CompetitionName, Level, Engagement, dan Result untuk setiap baris.',
        'bulk.instruction_3': '3. Simpan fail, kemudian klik Muat Naik Excel.',
        'bulk.instruction_4': '4. Semak pratonton dan klik Sahkan untuk simpan.',
        'bulk.valid_levels': 'Peringkat Sah',
        'bulk.valid_engagements': 'Penglibatan Sah',
        'bulk.valid_results': 'Keputusan Sah',
        'bulk.preview_title': 'Pratonton Import Pukal',
        'bulk.preview_sub': 'Semak sebelum membuat perubahan',
        'bulk.chip_new': '{n} baharu',
        'bulk.chip_error': '{n} ralat',
        'bulk.chip_skip': '{n} dilangkau',
        'bulk.confirm': 'Sahkan Import',
        'bulk.apply_n': 'Guna {n} mata',
        'bulk.nothing': 'Tiada perubahan',
        'bulk.reading': 'Membaca fail...',
        'bulk.saved': '✅ {n} mata ditambah',
        'bulk.failed': 'Gagal menyimpan mata',
        'bulk.no_file': 'Tiada fail dipilih',
        'bulk.template_downloaded': 'Templat dimuat turun',
        'bulk.template_failed': 'Gagal menjana templat',
        'bulk.row': 'Baris',

        // Teacher analytics
        'nav.teacher_analytics': 'Analitik',
        'teacher.analytics_title': 'Analitik <span>Kelas</span>',
        'teacher.kpi_students': 'Pelajar',
        'teacher.kpi_classes': 'Kelas',
        'teacher.kpi_avg_pajsk': 'Purata PAJSK',
        'teacher.kpi_active_rate': 'Kadar Aktif',
        'teacher.chart_class_pajsk': 'Purata PAJSK Mengikut Kelas',
        'teacher.chart_activity': 'Status Aktiviti Pelajar',
        'teacher.chart_top_students': '10 Pelajar Teratas Mengikut PAJSK',
        'teacher.activity_active': 'Aktif sekarang',
        'teacher.activity_completed': 'Tamat',
        'teacher.activity_inactive': 'Tiada aktiviti',

        // Tour banner
        'tour.title': 'Selamat datang ke EduMinat',
        'tour.body': 'Demo ini menunjukkan aliran penuh PAJSK KPM. Cuba dari awal hingga akhir:',
        'tour.step1': 'Cipta pertandingan sebagai Penganjur',
        'tour.step2': 'Luluskan sebagai KPM',
        'tour.step3': 'Daftar sebagai Pelajar',
        'tour.step4': 'Beri keputusan & hantar laporan',
        'tour.step5': 'Jana surat pengiktirafan',
        'tour.dismiss': 'Faham',
        'tour.help': 'Tunjuk semula',
    }
};

// ============================================================
//  CORE
// ============================================================
const I18N_STORAGE_KEY = 'eduminat.lang';
let __currentLang = localStorage.getItem(I18N_STORAGE_KEY) || 'my';

function getLanguage() {
    return __currentLang;
}

function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    __currentLang = lang;
    localStorage.setItem(I18N_STORAGE_KEY, lang);
    document.dispatchEvent(new CustomEvent('languagechange', {
        detail: {
            lang
        }
    }));
}

function t(key, vars) {
    const dict = TRANSLATIONS[__currentLang] || TRANSLATIONS.my;
    let str = dict[key] ?? TRANSLATIONS.my[key] ?? key;
    if (vars) {
        Object.keys(vars).forEach(k => {
            str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
        });
    }
    return str;
}

function tResult(key) {
    return t(`result.${key}`);
}

function tLevel(key) {
    return t(`level.${key}`);
}

function tEngagement(type) {
    return t(`eng.${type}`);
}

function tStatus(key) {
    return t(`status.${key}`);
}

// ============================================================
//  LANGUAGE SWITCHER
// ============================================================
function injectLanguageSwitcher() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    let switcher = document.getElementById('langSwitcher');
    if (!switcher) {
        switcher = document.createElement('div');
        switcher.id = 'langSwitcher';
        switcher.className = 'lang-switcher';
        const nav = sidebar.querySelector('.nav');
        if (!nav) return;
        const logout = nav.querySelector('.nav-item.logout');
        if (logout) nav.insertBefore(switcher, logout);
        else nav.appendChild(switcher);
    }

    switcher.innerHTML = `
    <button class="lang-btn ${__currentLang === 'my' ? 'active' : ''}" data-lang="my">BM</button>
    <button class="lang-btn ${__currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
  `;

    switcher.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });
}

// Apply data-i18n attributes across the page
function applyI18n(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(el => {
        el.innerHTML = t(el.dataset.i18n);
    });
    (root || document).querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
}

// ============================================================
//  EXPOSE
// ============================================================
window.I18N = {
    t,
    tResult,
    tLevel,
    tEngagement,
    tStatus,
    getLanguage,
    setLanguage,
    injectLanguageSwitcher,
    applyI18n,
    TRANSLATIONS
};