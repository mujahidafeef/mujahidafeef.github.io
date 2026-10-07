// ============================================================
//  db.js — shared database layer for EduMinat
//  Version: 3 (adds reports store)
// ============================================================

const DB_NAME = 'EduMinatDB';
const DB_VERSION = 3;

let db;

// ============================================================
//  OPEN DB
// ============================================================
function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);

    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked — close other tabs'));

    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      console.log('Upgrading DB schema to v' + DB_VERSION);

      const ensureStore = (name, options, indexes = []) => {
        let store;
        if (!database.objectStoreNames.contains(name)) {
          store = database.createObjectStore(name, options);
        } else {
          store = e.target.transaction.objectStore(name);
        }
        indexes.forEach(({
          name: idxName,
          keyPath,
          unique
        }) => {
          if (!store.indexNames.contains(idxName)) {
            store.createIndex(idxName, keyPath, {
              unique: !!unique
            });
          }
        });
      };

      // ---------- users ----------
      ensureStore('users', {
        keyPath: 'email'
      }, [{
        name: 'role',
        keyPath: 'role'
      }]);

      // ---------- competitions ----------
      ensureStore('competitions', {
        keyPath: 'id',
        autoIncrement: true
      }, [{
          name: 'status',
          keyPath: 'status'
        },
        {
          name: 'organizer',
          keyPath: 'organizerEmail'
        }
      ]);

      // ---------- registrations ----------
      ensureStore('registrations', {
        keyPath: 'id',
        autoIncrement: true
      }, [{
          name: 'student',
          keyPath: 'studentEmail'
        },
        {
          name: 'competition',
          keyPath: 'competitionId'
        }
      ]);

      // ---------- marks ----------
      ensureStore('marks', {
        keyPath: 'id',
        autoIncrement: true
      }, [{
        name: 'student',
        keyPath: 'studentEmail'
      }]);

      // ---------- session ----------
      ensureStore('session', {
        keyPath: 'id'
      });

      // ---------- reports (NEW v3) ----------
      ensureStore('reports', {
        keyPath: 'id',
        autoIncrement: true
      }, [{
          name: 'organizer',
          keyPath: 'organizerEmail'
        },
        {
          name: 'status',
          keyPath: 'status'
        }
      ]);
    };

    req.onsuccess = () => {
      db = req.result;
      db.onversionchange = () => {
        db.close();
        db = null;
        alert('Database updated in another tab. Please refresh.');
      };
      resolve(db);
    };
  });
}

// ============================================================
//  GENERIC TRANSACTION HELPER
// ============================================================
function tx(storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB not open. Call DB.openDB() first.'));

    if (!db.objectStoreNames.contains(storeName)) {
      return reject(new Error(
        `Object store "${storeName}" does not exist. ` +
        `Delete EduMinatDB in DevTools → Application → IndexedDB and refresh.`
      ));
    }

    let transaction;
    try {
      transaction = db.transaction(storeName, mode);
    } catch (err) {
      return reject(err);
    }

    const store = transaction.objectStore(storeName);

    let request;
    try {
      request = fn(store);
    } catch (err) {
      return reject(err);
    }

    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      reject(request.error || new Error('Request failed'));
    };
  });
}

// ============================================================
//  KPM PAJSK SCORING TABLES
//  Source: Bahagian Sukan, Kokurikulum dan Kesenian (BSKK),
//  Kementerian Pendidikan Malaysia
// ============================================================
const KPM_SCORING = {
  // Skor Penglibatan — { level: { engagementType: score } }
  participation: {
    antarabangsa: {
      1: 20,
      2: 15,
      3: 10
    },
    kebangsaan: {
      1: 17,
      2: 12,
      3: 8
    },
    negeri: {
      1: 14,
      2: 10,
      3: 6
    },
    bahagian: {
      1: 12,
      2: 9,
      3: 5
    },
    zon_daerah: {
      1: 11,
      2: 8,
      3: 4
    }
  },

  // Skor Pencapaian — { level: { result: score } }
  achievement: {
    antarabangsa: {
      johan: 20,
      naib_johan: 19,
      ketiga: 18,
      keempat: 17,
      kelima: 16
    },
    kebangsaan: {
      johan: 17,
      naib_johan: 16,
      ketiga: 15,
      keempat: 14,
      kelima: 13
    },
    negeri: {
      johan: 14,
      naib_johan: 13,
      ketiga: 12,
      keempat: 11,
      kelima: 10
    },
    daerah: {
      johan: 11,
      naib_johan: 10,
      ketiga: 9,
      keempat: 8,
      kelima: 7
    },
    sekolah: {
      johan: 8,
      naib_johan: 7,
      ketiga: 6,
      keempat: 5,
      kelima: 4
    }
  },

  levelLabels: {
    antarabangsa: 'Antarabangsa',
    kebangsaan: 'Kebangsaan',
    negeri: 'Negeri',
    bahagian: 'Bahagian (Sabah/Sarawak)',
    zon_daerah: 'Zon/Daerah'
  },

  engagementLabels: {
    1: 'Penglibatan I (Pertandingan berperingkat)',
    2: 'Penglibatan II (Tanpa pemeringkatan / Jawatankuasa)',
    3: 'Penglibatan III (Dalam talian tanpa interaksi langsung / Penonton)'
  },

  resultLabels: {
    johan: 'Johan',
    naib_johan: 'Naib Johan',
    ketiga: 'Ketiga',
    keempat: 'Keempat',
    kelima: 'Kelima',
    penyertaan: 'Penyertaan'
  }
};

// ---------- KPM helpers ----------
function getParticipationScore(level, engagementType) {
  const row = KPM_SCORING.participation[level];
  if (!row) return 0;
  return row[engagementType] || 0;
}

function getAchievementScore(level, result) {
  if (!result || result === 'penyertaan') return 0;
  // Bahagian (Sabah/Sarawak) has no achievement row → fall back to negeri
  // Zon/Daerah maps to daerah in the achievement table
  const achievementLevel =
    level === 'zon_daerah' ? 'daerah' :
    level === 'bahagian' ? 'negeri' :
    level;
  const row = KPM_SCORING.achievement[achievementLevel];
  if (!row) return 0;
  return row[result] || 0;
}

function computeRegistrationPajsk(competition, result) {
  const participation = getParticipationScore(competition.level, competition.engagementType);
  const achievement = getAchievementScore(competition.level, result);
  return {
    participationScore: participation,
    achievementScore: achievement,
    totalPajsk: participation + achievement
  };
}

// ============================================================
//  STORE APIS
// ============================================================

// ---------- Users ----------
const Users = {
  add: (user) => tx('users', 'readwrite', s => s.add(user)),
  put: (user) => tx('users', 'readwrite', s => s.put(user)),
  get: (email) => tx('users', 'readonly', s => s.get(email)),
  all: () => tx('users', 'readonly', s => s.getAll()),
  byRole: (role) => tx('users', 'readonly', s => s.index('role').getAll(role))
};

// ---------- Competitions ----------
const Competitions = {
  add: (comp) => tx('competitions', 'readwrite', s => s.add(comp)),
  put: (comp) => tx('competitions', 'readwrite', s => s.put(comp)),
  get: (id) => tx('competitions', 'readonly', s => s.get(id)),
  all: () => tx('competitions', 'readonly', s => s.getAll()),
  byStatus: (st) => tx('competitions', 'readonly', s => s.index('status').getAll(st)),
  byOrganizer: (email) => tx('competitions', 'readonly', s => s.index('organizer').getAll(email))
};

// ---------- Registrations ----------
const Registrations = {
  add: (reg) => tx('registrations', 'readwrite', s => s.add(reg)),
  put: (reg) => tx('registrations', 'readwrite', s => s.put(reg)),
  get: (id) => tx('registrations', 'readonly', s => s.get(id)),
  all: () => tx('registrations', 'readonly', s => s.getAll()),
  byStudent: (email) => tx('registrations', 'readonly', s => s.index('student').getAll(email)),
  byCompetition: (id) => tx('registrations', 'readonly', s => s.index('competition').getAll(id)),
  find: async (studentEmail, competitionId) => {
    const all = await tx('registrations', 'readonly', s => s.getAll());
    return all.find(r => r.studentEmail === studentEmail && r.competitionId === competitionId);
  }
};

// ---------- Marks ----------
const Marks = {
  add: (mark) => tx('marks', 'readwrite', s => s.add(mark)),
  put: (mark) => tx('marks', 'readwrite', s => s.put(mark)),
  get: (id) => tx('marks', 'readonly', s => s.get(id)),
  all: () => tx('marks', 'readonly', s => s.getAll()),
  byStudent: (email) => tx('marks', 'readonly', s => s.index('student').getAll(email))
};

// ---------- Reports (NEW) ----------
const Reports = {
  add: (r) => tx('reports', 'readwrite', s => s.add(r)),
  put: (r) => tx('reports', 'readwrite', s => s.put(r)),
  get: (id) => tx('reports', 'readonly', s => s.get(id)),
  all: () => tx('reports', 'readonly', s => s.getAll()),
  byOrganizer: (email) => tx('reports', 'readonly', s => s.index('organizer').getAll(email)),
  byStatus: (st) => tx('reports', 'readonly', s => s.index('status').getAll(st))
};

// ---------- Session ----------
const Session = {
  set: (user) => tx('session', 'readwrite', s => s.put({
    id: 'current',
    ...user
  })),
  get: () => tx('session', 'readonly', s => s.get('current')),
  clear: () => tx('session', 'readwrite', s => s.delete('current'))
};

// ============================================================
//  CONVENIENCE HELPERS
// ============================================================
async function currentUser() {
  return await Session.get();
}

async function logout() {
  await Session.clear();
  window.location.href = 'login.html';
}

// ============================================================
//  RESET DEMO — wipes IndexedDB and reloads with fresh seed
// ============================================================
async function resetDemo() {
  if (!confirm('Reset semua data demo? Semua perubahan akan hilang.')) return;

  try {
    // 1. Close the active connection so delete isn't blocked
    if (db) {
      db.close();
      db = null;
    }

    // 2. Delete the database
    await new Promise((resolve) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => {
        console.log('✅ DB deleted');
        resolve();
      };
      req.onerror = () => {
        console.error('Delete failed:', req.error);
        resolve();
      };
      req.onblocked = () => {
        alert('Sila tutup semua tab EduMinat yang lain, kemudian cuba lagi.');
        resolve();
      };
    });

    // reset tour banner
    localStorage.removeItem('eduminat.tour.dismissed');

    // 3. Reload the page — db.js will rebuild and reseed
    location.reload();
  } catch (err) {
    console.error(err);
    alert('Reset failed: ' + err.message);
  }
}

async function calculatePajsk(studentEmail) {
  const BASE_ATTENDANCE = 40;
  const BASE_JAWATAN = 10;

  const regs = await Registrations.byStudent(studentEmail);
  const completed = regs.filter(r => r.status === 'completed' && r.totalPajsk);
  const competitionTotal = completed.reduce((sum, r) => sum + (r.totalPajsk || 0), 0);

  return {
    base: BASE_ATTENDANCE + BASE_JAWATAN,
    fromCompetitions: competitionTotal,
    total: BASE_ATTENDANCE + BASE_JAWATAN + competitionTotal
  };
}

// ============================================================
//  SEED DEMO DATA (comprehensive — covers all use cases)
// ============================================================
async function seedDemoData() {
  try {
    const existing = await Users.all();
    if (existing.length > 0) {
      console.log('Demo data already present — skipping seed.');
      return;
    }
    console.log('Seeding comprehensive demo data...');

    // ============================================================
    //  USERS
    // ============================================================

    // ---------- Students ----------
    // Group 1: The three Afeef brothers (one family, different classes)
    // Group 2: Classmates in 5 Alpha (varied PAJSK levels)
    // Group 3: Students in 4 Beta (another class, for teacher breadth)
    // Group 4: A brand-new student with zero activity (edge case)
    const students = [
      // --- The three brothers ---
      {
        email: 'mujahid@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Mujahid Afeef',
        class: '5 Alpha'
      },
      {
        email: 'mursyid@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Mursyid Afeef',
        class: '4 Beta'
      },
      {
        email: 'musyrif@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Musyrif Afeef',
        class: '2 Alpha'
      },

      // --- 5 Alpha classmates (varied achievement) ---
      {
        email: 'aisyah@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Nur Aisyah',
        class: '5 Alpha'
      }, // top performer
      {
        email: 'danial@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Danial Haziq',
        class: '5 Alpha'
      }, // active, mixed
      {
        email: 'aminah@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Aminah Shahira',
        class: '5 Alpha'
      }, // international achiever
      {
        email: 'irfan@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Irfan Hakimi',
        class: '5 Alpha'
      }, // district-level only
      {
        email: 'liyana@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Liyana Zulkifli',
        class: '5 Alpha'
      }, // pending result
      {
        email: 'aminah@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Aminah Diyana',
        class: '5 Alpha'
      }, // just registered

      // --- 4 Beta classmates ---
      {
        email: 'hafiz@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Hafiz Rahman',
        class: '4 Beta'
      },
      {
        email: 'sarah@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Sarah Ismail',
        class: '4 Beta'
      },
      {
        email: 'zaki@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Zaki Iskandar',
        class: '4 Beta'
      }, // no activity at all (edge case)
    ];

    for (const s of students) await Users.put(s);

    // ---------- Parents ----------
    // Parent 1: the three Afeef brothers
    await Users.put({
      email: 'parent@eduminat.my',
      password: 'parent123',
      role: 'parent',
      name: 'Puan Nurul Izzah',
      childEmails: [
        'mujahid@eduminat.my',
        'mursyid@eduminat.my',
        'musyrif@eduminat.my'
      ]
    });

    // Parent 2: single child (Aisyah) — edge case for single-child parent
    await Users.put({
      email: 'parent2@eduminat.my',
      password: 'parent123',
      role: 'parent',
      name: 'Encik Rosli',
      childEmails: ['aisyah@eduminat.my']
    });

    // Parent 3: two kids in different classes
    await Users.put({
      email: 'parent3@eduminat.my',
      password: 'parent123',
      role: 'parent',
      name: 'Puan Hasnah',
      childEmails: [
        'hafiz@eduminat.my',
        'sarah@eduminat.my'
      ]
    });

    // ---------- Teachers ----------
    await Users.put({
      email: 'teacher@eduminat.my',
      password: 'teacher123',
      role: 'teacher',
      name: 'Cikgu Siti',
      class: '5 Alpha'
    });

    await Users.put({
      email: 'teacher2@eduminat.my',
      password: 'teacher123',
      role: 'teacher',
      name: 'Cikgu Ahmad',
      class: '4 Beta'
    });

    // ---------- Organizers ----------
    await Users.put({
      email: 'organizer@eduminat.my',
      password: 'organizer123',
      role: 'organizer',
      name: 'FutureTech Academy'
    });

    await Users.put({
      email: 'organizer2@eduminat.my',
      password: 'organizer123',
      role: 'organizer',
      name: 'ArtsHub Malaysia'
    });

    // ---------- KPM ----------
    await Users.put({
      email: 'kpm@eduminat.my',
      password: 'kpm123',
      role: 'kpm',
      name: 'KPM Officer'
    });

    // ============================================================
    //  COMPETITIONS — cover all statuses, levels, engagement types
    // ============================================================
    const seedComps = [
      // --- APPROVED (students can register) ---
      {
        name: 'National Coding Challenge',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'National coding competition (online, live, ranked).',
        date: '2026-06-12',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'Robotics Championship',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'National robotics tournament with live ranking.',
        date: '2026-07-05',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'International Math Olympiad',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'Top-tier international olympiad.',
        date: '2026-09-20',
        status: 'approved',
        level: 'antarabangsa',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'Innovation Expo',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'State-level innovation showcase (no ranking).',
        date: '2026-06-28',
        status: 'approved',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 2,
        hasRanking: false
      },
      {
        name: 'District Science Fair',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'District-level science fair.',
        date: '2026-05-15',
        status: 'approved',
        level: 'zon_daerah',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'Digital Arts Showcase',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Arts',
        description: 'National online digital art competition.',
        date: '2026-08-10',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'Public Speaking Contest',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Language',
        description: 'State-level public speaking.',
        date: '2026-04-22',
        status: 'approved',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'Sabah Heritage Video Contest',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Arts',
        description: 'Division-level video contest (Sabah/Sarawak).',
        date: '2026-03-05',
        status: 'approved',
        level: 'bahagian',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true
      },

      // --- PENDING (waiting for KPM approval) ---
      {
        name: 'Creative Arts Showcase 2026',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'Arts',
        description: 'Digital and traditional art competition (pending KPM).',
        date: '2026-11-01',
        status: 'pending',
        level: 'kebangsaan',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true
      },
      {
        name: 'Startup Pitch Competition',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'STEM',
        description: 'University-level startup pitching (pending).',
        date: '2026-12-15',
        status: 'pending',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true
      },

      // --- COMPLETED (report already submitted to KPM) ---
      {
        name: 'Larian Merdeka 2026',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'Sports',
        description: 'National independence-day run (completed).',
        date: '2026-08-31',
        status: 'completed',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 2,
        hasRanking: false
      },

      // --- REJECTED (edge case: KPM turned it down) ---
      {
        name: 'Unauthorized Bootcamp',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'STEM',
        description: 'Rejected by KPM due to missing documentation.',
        date: '2026-10-01',
        status: 'rejected',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true
      }
    ];

    for (const c of seedComps) {
      c.participationScore = getParticipationScore(c.level, c.engagementType);
      c.maxAchievementScore = c.hasRanking ? getAchievementScore(c.level, 'johan') : 0;
      await Competitions.add(c);
    }

    // ============================================================
    //  REGISTRATIONS & MARKS — cover every result type
    // ============================================================
    const allComps = await Competitions.all();
    const find = (name) => allComps.find(c => c.name === name);

    const coding = find('National Coding Challenge');
    const robotics = find('Robotics Championship');
    const imo = find('International Math Olympiad');
    const innovation = find('Innovation Expo');
    const district = find('District Science Fair');
    const arts = find('Digital Arts Showcase');
    const speaking = find('Public Speaking Contest');
    const heritage = find('Sabah Heritage Video Contest');
    const larian = find('Larian Merdeka 2026');

    // ----- Helper to register + award in one shot -----
    async function register(studentEmail, comp, {
      status = 'registered',
      result = null
    } = {}) {
      if (!comp) return;
      const entry = {
        studentEmail,
        competitionId: comp.id,
        status,
        registeredAt: Date.now() - 30 * 24 * 3600 * 1000,
        result,
        participationScore: 0,
        achievementScore: 0,
        totalPajsk: 0
      };

      if (status === 'completed' && result) {
        const scores = computeRegistrationPajsk(comp, result);
        entry.completedAt = Date.now() - 5 * 24 * 3600 * 1000;
        entry.participationScore = scores.participationScore;
        entry.achievementScore = scores.achievementScore;
        entry.totalPajsk = scores.totalPajsk;

        await Registrations.add(entry);
        await Marks.add({
          studentEmail,
          competitionId: comp.id,
          competitionName: comp.name,
          level: comp.level,
          result,
          participationScore: scores.participationScore,
          achievementScore: scores.achievementScore,
          marks: scores.totalPajsk,
          type: 'Competition',
          source: comp.name,
          awardedAt: entry.completedAt
        });
      } else {
        await Registrations.add(entry);
      }
    }

    // ============================================================
    //  Mujahid (5A) — active + one completed (Ketiga, national)
    // ============================================================
    await register('mujahid@eduminat.my', coding, {
      status: 'registered'
    });
    await register('mujahid@eduminat.my', arts, {
      status: 'registered'
    });
    await register('mujahid@eduminat.my', robotics, {
      status: 'completed',
      result: 'ketiga'
    });

    // ============================================================
    //  Mursyid (4B) — completed (participation), one active
    // ============================================================
    await register('mursyid@eduminat.my', coding, {
      status: 'registered'
    });
    await register('mursyid@eduminat.my', innovation, {
      status: 'completed',
      result: 'penyertaan'
    });

    // ============================================================
    //  Musyrif (2A) — over-achiever (Naib Johan, national)
    // ============================================================
    await register('musyrif@eduminat.my', coding, {
      status: 'completed',
      result: 'naib_johan'
    });

    // ============================================================
    //  Aisyah (5A) — top performer (Johan ×2, International)
    // ============================================================
    await register('aisyah@eduminat.my', robotics, {
      status: 'completed',
      result: 'johan'
    });
    await register('aisyah@eduminat.my', speaking, {
      status: 'completed',
      result: 'johan'
    });
    await register('aisyah@eduminat.my', imo, {
      status: 'completed',
      result: 'keempat'
    });

    // ============================================================
    //  Danial (5A) — mixed (Johann district, Ketiga state)
    // ============================================================
    await register('danial@eduminat.my', coding, {
      status: 'registered'
    });
    await register('danial@eduminat.my', district, {
      status: 'completed',
      result: 'johan'
    });
    await register('danial@eduminat.my', heritage, {
      status: 'completed',
      result: 'ketiga'
    });

    // ============================================================
    //  Fatimah (5A) — international achiever (5th place)
    // ============================================================
    await register('fatimah@eduminat.my', imo, {
      status: 'completed',
      result: 'kelima'
    });
    await register('fatimah@eduminat.my', arts, {
      status: 'registered'
    });

    // ============================================================
    //  Irfan (5A) — district-level only
    // ============================================================
    await register('irfan@eduminat.my', district, {
      status: 'completed',
      result: 'keempat'
    });
    await register('irfan@eduminat.my', larian, {
      status: 'completed',
      result: 'penyertaan'
    });

    // ============================================================
    //  Liyana (5A) — registered, awaiting result (edge case)
    // ============================================================
    await register('liyana@eduminat.my', coding, {
      status: 'registered'
    });
    await register('liyana@eduminat.my', arts, {
      status: 'registered'
    });

    // ============================================================
    //  Aminah (5A) — just registered, no results yet
    // ============================================================
    await register('aminah@eduminat.my', coding, {
      status: 'registered'
    });

    // ============================================================
    //  Hafiz (4B) — national participation, state 3rd
    // ============================================================
    await register('hafiz@eduminat.my', larian, {
      status: 'completed',
      result: 'penyertaan'
    });
    await register('hafiz@eduminat.my', speaking, {
      status: 'completed',
      result: 'ketiga'
    });

    // ============================================================
    //  Sarah (4B) — arts lover, no results yet
    // ============================================================
    await register('sarah@eduminat.my', arts, {
      status: 'registered'
    });

    // ============================================================
    //  Zaki (4B) — no activity at all (edge case: empty dashboard)
    //  (intentionally no registrations)

    // ============================================================
    //  REPORTS — one already acknowledged (for KPM letter demo)
    // ============================================================
    const completedCount = await Registrations.byCompetition(robotics.id);
    const completedRobotics = completedCount.filter(r => r.status === 'completed');

    await Reports.add({
      competitionId: robotics.id,
      competitionName: robotics.name,
      organizerEmail: 'organizer@eduminat.my',
      organizerName: 'FutureTech Academy',
      participants: completedRobotics.length,
      totalPajskAwarded: completedRobotics.reduce((s, r) => s + (r.totalPajsk || 0), 0),
      status: 'submitted',
      submittedAt: Date.now() - 2 * 24 * 3600 * 1000
    });

    // One already acknowledged (KPM can download letter immediately)
    const completedLarian = (await Registrations.byCompetition(larian.id))
      .filter(r => r.status === 'completed');

    await Reports.add({
      competitionId: larian.id,
      competitionName: larian.name,
      organizerEmail: 'organizer@eduminat.my',
      organizerName: 'FutureTech Academy',
      participants: completedLarian.length,
      totalPajskAwarded: completedLarian.reduce((s, r) => s + (r.totalPajsk || 0), 0),
      status: 'acknowledged',
      submittedAt: Date.now() - 10 * 24 * 3600 * 1000,
      acknowledgedAt: Date.now() - 8 * 24 * 3600 * 1000
    });

    console.log(`✅ Comprehensive demo seeded: ${students.length} students, ${seedComps.length} competitions, 3 parents, 2 teachers, 2 organizers.`);
  } catch (err) {
    console.error('Seed failed:', err);
  }
}

// ---------- i18n-aware labels (falls back to BM if i18n.js not loaded) ----------
function levelLabel(key) {
  return window.I18N ? window.I18N.tLevel(key) : (KPM_SCORING.levelLabels[key] || key);
}

function engagementLabel(type) {
  return window.I18N ? window.I18N.tEngagement(type) : (KPM_SCORING.engagementLabels[type] || type);
}

function resultLabel(key) {
  return window.I18N ? window.I18N.tResult(key) : (KPM_SCORING.resultLabels[key] || key);
}

function statusLabel(key) {
  return window.I18N ? window.I18N.tStatus(key) : key;
}

// ---------- i18n-aware label helpers (fallback to BM) ----------
function levelLabel(key) {
  return window.I18N ? window.I18N.tLevel(key) : (KPM_SCORING.levelLabels[key] || key);
}

function engagementLabel(type) {
  return window.I18N ? window.I18N.tEngagement(type) : (KPM_SCORING.engagementLabels[type] || type);
}

function engagementShort(type) {
  return window.I18N ? window.I18N.t('org.engagement_short', {
    n: type
  }) : `Type ${type}`;
}

function resultLabel(key) {
  return window.I18N ? window.I18N.tResult(key) : (KPM_SCORING.resultLabels[key] || key);
}

function statusLabel(key) {
  return window.I18N ? window.I18N.tStatus(key) : key;
}

// ============================================================
//  MANUAL MARK — for school-level / unlisted competitions
//  Writes directly to Marks, bypassing Registrations.
// ============================================================
async function addManualMark({
  studentEmail,
  competitionName,
  level,
  engagementType,
  result,
  awardedBy
}) {
  const participationScore = getParticipationScore(level, engagementType);
  const achievementScore = getAchievementScore(level, result);
  const totalPajsk = participationScore + achievementScore;

  const record = {
    studentEmail,
    competitionName,
    level,
    engagementType,
    result,
    participationScore,
    achievementScore,
    marks: totalPajsk,
    type: 'manual',
    source: competitionName,
    awardedBy,
    awardedAt: Date.now()
  };

  const id = await Marks.add(record);
  return {
    id,
    ...record
  };
}

// ============================================================
//  EXPOSE TO WINDOW
// ============================================================
window.DB = {
  // lifecycle
  openDB,
  seedDemoData,
  currentUser,
  logout,
  calculatePajsk,

  // stores
  Users,
  Competitions,
  Registrations,
  Marks,
  Reports,
  Session,

  // KPM helpers
  KPM_SCORING,
  getParticipationScore,
  getAchievementScore,
  computeRegistrationPajsk,

  // i18n helpers
  levelLabel,
  engagementLabel,
  engagementShort,
  resultLabel,
  statusLabel,

  // reset demo
  resetDemo,

  // manual mark
  addManualMark,
};