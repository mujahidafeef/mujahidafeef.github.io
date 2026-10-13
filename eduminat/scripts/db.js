// ============================================================
//  db.js — shared database layer for EduMinat
//  Version: 3 (adds reports store)
// ============================================================

const DB_NAME = 'EduMinatDB';
const DB_VERSION = 6;

let db;


const DEFAULT_KPM_LETTERHEAD = {
  directorName: 'Ithnin bin Mahadi',
  directorDesignation: 'Pengarah',

  contactName: 'Puan Sanoyah binti Yusof',
  contactPhoneLandline: '03-88841179',
  contactPhoneMobile: '012-3311 537',
  contactEmail: 'sanoyah.yusof@moe.gov.my',

  divisionName: 'Bahagian Sukan, Kokurikulum dan Kesenian',
  ministryName: 'Kementerian Pendidikan Malaysia',
  address: 'Aras 1, 2 & 7, Blok E13, Kompleks E\nPusat Pentadbiran Kerajaan Persekutuan\n62604 PUTRAJAYA MALAYSIA',
  phone: '+603 8884 1001 / +603 8884 1002',
  fax: '+603 8884 1034',
  website: 'www.moe.gov.my',

  refPrefix: 'KPM.600-4/1/1 Jld. 5',
  refStart: 1,
  //letterLanguage: 'my'
};

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

      // ---------- reflections (NEW v4) ----------
      ensureStore('reflections', {
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

      // ---------- settings ----------
      ensureStore('settings', {
        keyPath: 'key'
      });

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

// ---------- Reflections ----------
const Reflections = {
  add: (r) => tx('reflections', 'readwrite', s => s.add(r)),
  put: (r) => tx('reflections', 'readwrite', s => s.put(r)),
  get: (id) => tx('reflections', 'readonly', s => s.get(id)),
  all: () => tx('reflections', 'readonly', s => s.getAll()),
  byStudent: (email) => tx('reflections', 'readonly', s => s.index('student').getAll(email)),
  byCompetition: (id) => tx('reflections', 'readonly', s => s.index('competition').getAll(id)),
  find: async (studentEmail, competitionId) => {
    const all = await tx('reflections', 'readonly', s => s.getAll());
    return all.find(r => r.studentEmail === studentEmail && r.competitionId === competitionId);
  }
};

// ---------- Settings ----------
const Settings = {
  get: (key) => tx('settings', 'readonly', s => s.get(key)),
  set: (key, value) => tx('settings', 'readwrite', s => s.put({
    key,
    value
  })),
  //all: () => tx('settings', 'readonly', s => s.getAll()),
  delete: (key) => tx('settings', 'readwrite', s => s.delete(key))
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

// Simple in-memory PAJSK cache
const __pajskCache = new Map();

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

// Clear cache whenever marks or registrations change
function invalidatePajskCache() {
  __pajskCache.clear();
}

// ============================================================
//  SEEDED RNG — deterministic random (mulberry32)
// ============================================================
function makeRng(seed) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rng = makeRng(20261013);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const pickN = (arr, n) => {
  const copy = [...arr];
  const out = [];
  for (let i = 0; i < n && copy.length; i++) {
    out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
  }
  return out;
};

// ============================================================
//  DEMO DATA POOLS
// ============================================================
const CLASSES = [
  '5 Alpha', '5 Beta', '4 Alpha', '4 Beta',
  '3 Alpha', '2 Alpha', '2 Beta', '1 Alpha'
];

const MALE_NAMES = [
  'Ahmad Zaki', 'Danial Haziq', 'Irfan Hakimi', 'Hafiz Rahman', 'Zaki Iskandar',
  'Amirul Asyraf', 'Iman Hakim', 'Luqman Nur', 'Firdaus Azmi', 'Hakim Danish',
  'Ridzuan Amin', 'Syafiq Rahim', 'Aiman Zulkifli', 'Harith Iskandar', 'Naufal Idris',
  'Rizqi Adnan', 'Nabil Farhan', 'Umar Abdul', 'Yusuf Hakim', 'Hamzah Roslan'
];
const FEMALE_NAMES = [
  'Nur Aisyah', 'Liyana Zulkifli', 'Sarah Ismail', 'Aminah Diyana', 'Fatimah Az-Zahra',
  'Siti Khadijah', 'Nur Hidayah', 'Alya Damia', 'Sofia Iman', 'Balqis Zahra',
  'Sumayyah Nur', 'Khadijah Amal', 'Maryam Aisyah', 'Zahra Insyirah', 'Hana Safiya',
  'Nadhirah Izz', 'Wardina Sofia', 'Salsabila', 'Raudhah Nur', 'Husna Adlina'
];

const COMP_CATEGORIES = ['STEM', 'Language', 'Arts', 'Sports'];

const COMP_SUBJECTS = {
  STEM: ['Coding', 'Robotics', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Data Science', 'AI', 'Astronomy'],
  Language: ['Essay Writing', 'Debate', 'Public Speaking', 'Poetry', 'Storytelling', 'Translation'],
  Arts: ['Digital Arts', 'Painting', 'Photography', 'Drama', 'Music', 'Dance', 'Design'],
  Sports: ['Badminton', 'Athletics', 'Swimming', 'Football', 'Basketball', 'Chess', 'Cycling']
};

const COMP_LEVELS = [{
    key: 'antarabangsa',
    weight: 6,
    prefix: 'International'
  },
  {
    key: 'kebangsaan',
    weight: 20,
    prefix: 'National'
  },
  {
    key: 'negeri',
    weight: 25,
    prefix: 'State-Level'
  },
  {
    key: 'bahagian',
    weight: 15,
    prefix: 'Division-Level'
  },
  {
    key: 'zon_daerah',
    weight: 20,
    prefix: 'District-Level'
  }
];

const COMP_SUFFIXES = ['Championship', 'Challenge', 'Olympiad', 'Cup', 'Competition', 'Festival', 'Tournament', 'Contest'];

const ORGANIZER_POOL = [{
    email: 'organizer@eduminat.my',
    name: 'FutureTech Academy'
  },
  {
    email: 'organizer2@eduminat.my',
    name: 'ArtsHub Malaysia'
  },
  {
    email: 'organizer3@eduminat.my',
    name: 'EduSports Alliance'
  }
];

const SCHOOL_NAME_POOL = ['SK Putrajaya Presint 11 (2)', 'SK Lubok Kelubi', 'SK Pengkalan Kubor (1)', 'Sekolah Tuanku Abdul Rahman', 'SMK Putrajaya Presint 8 (1)', 'SMK Taman Tun Dr Ismail', 'SMK Seri Bintang Utara', 'SMK Bandar Baru Uda', 'SMK Sultan Abdul Samad', 'SMK Jalan Empat', 'SMK Seri Kembangan', 'SMK Taman Desa', 'SMK Bukit Jalil', 'SMK Bandar Tun Hussein Onn', 'SMK Seri Serdang'];

// Weighted random picker
function weightedPick(weightedArr) {
  const total = weightedArr.reduce((s, x) => s + x.weight, 0);
  let r = rng() * total;
  for (const item of weightedArr) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return weightedArr[weightedArr.length - 1];
}

// ============================================================
//  CANNED REFLECTIONS — pre-written AI output
// ============================================================
const CANNED_REFLECTIONS = [{
    insights: `**What went well:**
      You showed strong problem-solving skills during the competition. Your ability to stay calm under pressure was evident, and you collaborated well with your team.

      **What to improve:**
      Consider documenting your process more systematically. Keeping a simple log during future competitions could help you identify what worked and what didn't.

      **What's next:**
      Look for competitions that stretch your technical skills. A national-level event in the same category would be a great next step.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that debugging under time pressure requires a different mindset than debugging at home.',
      q2: 'Our robot stopped working in round 2. We had to rewire it in 10 minutes.',
      q3: 'I would test the battery backup earlier.',
      q4: 'I was the lead coder. I coordinated the team on the technical side.',
      q5: 'I want to improve my time management during the build phase.'
    }
  },
  {
    insights: `**What went well:**
      Your presentation skills stood out. You engaged the judges with clear, confident delivery and strong supporting evidence.

      **What to improve:**
      The research portion could be deeper. Consider spending more time on the background before the event.

      **What's next:**
      Public speaking at the state level would be a natural next step. Look for debate or presentation-based competitions.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that research and delivery are equally important — one without the other weakens the pitch.',
      q2: 'I was asked a question I hadn\'t anticipated. I had to think on my feet.',
      q3: 'I would prepare more backup statistics.',
      q4: 'I was the main presenter. My teammate handled Q&A support.',
      q5: 'I want to improve my impromptu speaking.'
    }
  },
  {
    insights: `**What went well:**
      You demonstrated resilience — recovering from a slow start and finishing strong. Your persistence is a real strength.

      **What to improve:**
      Early-stage strategy could use work. Plan the first 20% of any competition more carefully.

      **What's next:**
      Consider entering a mixed-level event where you can benchmark against stronger opponents.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that the first hour sets the tone for the rest of the day.',
      q2: 'I fell behind early and had to catch up. I focused on small wins.',
      q3: 'I would plan the first hour better.',
      q4: 'I worked solo but coordinated with friends for mutual support.',
      q5: 'Better opening strategy.'
    }
  },
  {
    insights: `**What went well:**
      Excellent teamwork. You naturally took a supportive role and helped others stay focused — a skill many overlook.

      **What to improve:**
      Consider developing a specialised strength to complement your team-player role.

      **What's next:**
      Try an event where you can lead a small group — you're ready for it.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that keeping the team calm is as valuable as solving the problem.',
      q2: 'Two teammates disagreed on approach. I helped mediate.',
      q3: 'I would speak up earlier about my own ideas.',
      q4: 'I was the coordinator — I kept everyone on track.',
      q5: 'I want to build more technical depth.'
    }
  },
  {
    insights: `**What went well:**
      You completed the event with minimal support, showing strong self-direction and independence.

      **What to improve:**
      Try collaborating more in future events — some of your best ideas may come from working with others.

      **What's next:**
      A team-based competition would balance your independence with collaborative skills.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that I can rely on myself when needed.',
      q2: 'Time ran short and I had to make hard choices.',
      q3: 'I would start earlier.',
      q4: 'I worked solo this time.',
      q5: 'Teamwork experience.'
    }
  },
  {
    insights: `**What went well:**
      Strong technical execution — you clearly prepared well in advance. Your results reflected that effort.

      **What to improve:**
      Don't neglect the presentation side. Judges reward clarity as much as substance.

      **What's next:**
      Consider a higher-level event in the same category. You're ready to compete at a bigger scale.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that preparation pays off more than raw talent.',
      q2: 'A last-minute change almost broke our plan. We adapted.',
      q3: 'Nothing major — I would keep the same approach.',
      q4: 'I led the technical side.',
      q5: 'Presentation confidence.'
    }
  },
  {
    insights: `**What went well:**
      You showed curiosity — asking questions and learning from every interaction. That mindset will take you far.

      **What to improve:**
      Confidence in delivery. You know the material; trust yourself to speak up more.

      **What's next:**
      Try a competition with more live interaction — you'll grow fastest that way.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned more from watching others compete than I expected.',
      q2: 'Answering judges\' questions was nerve-wracking.',
      q3: 'I would practise my answers more.',
      q4: 'I was a team member and supported the lead.',
      q5: 'I want to speak more confidently in public.'
    }
  },
  {
    insights: `**What went well:**
      Your creativity stood out. The judges specifically noted your original approach.

      **What to improve:**
      Tighten the execution phase — great ideas deserve great delivery.

      **What's next:**
      Look for innovation-focused competitions where creativity is the primary criterion.`,
    questions: [{
        id: 'q1',
        text: 'What did you learn from this competition that you didn\'t know before?'
      },
      {
        id: 'q2',
        text: 'What was the most challenging moment, and how did you handle it?'
      },
      {
        id: 'q3',
        text: 'What would you do differently if you could start over?'
      },
      {
        id: 'q4',
        text: 'How did you work with others, and what role did you play in the team?'
      },
      {
        id: 'q5',
        text: 'What\'s one skill you want to improve before your next competition?'
      }
    ],
    answers: {
      q1: 'I learned that ideas are cheap but execution is what wins.',
      q2: 'We had 30 minutes to finish our prototype.',
      q3: 'I would plan the execution phase better.',
      q4: 'I was the ideas person on the team.',
      q5: 'Execution discipline.'
    }
  }
];

// ============================================================
//  SEED DEMO DATA (v5 — expanded with generated bulk)
// ============================================================
async function seedDemoData() {
  try {
    const existing = await Users.all();
    if (existing.length > 0) {
      console.log('Demo data already present — skipping seed.');
      return;
    }
    console.log('Seeding expanded demo data (v5)...');

    // ============================================================
    //  HAND-CURATED USERS
    // ============================================================

    // --- The three Afeef brothers ---
    const curatedStudents = [{
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
      {
        email: 'aisyah@eduminat.my',
        password: 'student123',
        role: 'student',
        name: 'Nur Aisyah',
        class: '5 Alpha'
      },
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
      }
    ];

    // --- Generated students (fill out the school) ---
    const generatedStudents = [];
    const usedEmails = new Set(curatedStudents.map(s => s.email));
    let nameIndex = 0;

    const targetPerClass = {
      '5 Alpha': 12,
      '5 Beta': 10,
      '4 Alpha': 9,
      '4 Beta': 8,
      '3 Alpha': 8,
      '2 Alpha': 6,
      '2 Beta': 5,
      '1 Alpha': 4
    };

    for (const cls of CLASSES) {
      const target = targetPerClass[cls] || 5;
      let added = 0;
      while (added < target) {
        // Alternate gender pool
        const pool = rng() < 0.5 ? MALE_NAMES : FEMALE_NAMES;
        const fullName = pick(pool);
        const slug = fullName.toLowerCase().replace(/\s+/g, '') + (nameIndex++);
        const email = `${slug}@eduminat.my`;

        if (usedEmails.has(email)) continue;
        usedEmails.add(email);

        generatedStudents.push({
          email,
          password: 'student123',
          role: 'student',
          name: fullName,
          class: cls
        });
        added++;
      }
    }

    const allStudents = [...curatedStudents, ...generatedStudents];
    for (const s of allStudents) await Users.put(s);

    // --- Parents ---
    await Users.put({
      email: 'parent@eduminat.my',
      password: 'parent123',
      role: 'parent',
      name: 'Puan Nurul Izzah',
      childEmails: ['mujahid@eduminat.my', 'mursyid@eduminat.my', 'musyrif@eduminat.my']
    });
    await Users.put({
      email: 'parent2@eduminat.my',
      password: 'parent123',
      role: 'parent',
      name: 'Encik Rosli',
      childEmails: ['aisyah@eduminat.my']
    });
    await Users.put({
      email: 'parent3@eduminat.my',
      password: 'parent123',
      role: 'parent',
      name: 'Puan Hasnah',
      childEmails: ['hafiz@eduminat.my', 'sarah@eduminat.my']
    });

    // --- Teachers, Organizers, KPM ---
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
    await Users.put({
      email: 'organizer@eduminat.my',
      password: 'organizer123',
      role: 'organizer',
      name: 'FutureTech Academy',
      letterhead: {
        address: 'No. 12, Jalan Teknologi 3/5\nTaman Sains Selangor\n47810 Petaling Jaya, Selangor',
        contactPerson: 'Encik Faizal bin Ahmad',
        contactPhone: '03-7890 1234',
        contactEmail: 'admin@futuretech.com.my'
      }
    });
    await Users.put({
      email: 'organizer2@eduminat.my',
      password: 'organizer123',
      role: 'organizer',
      name: 'ArtsHub Malaysia',
        letterhead: {
          address: 'Unit 8-3, Menara Creative\nJalan Ampang\n50450 Kuala Lumpur',
          contactPerson: 'Puan Melissa Tan',
          contactPhone: '03-2345 6789',
          contactEmail: 'hello@artshub.my'
        }
    });
    await Users.put({
      email: 'organizer3@eduminat.my',
      password: 'organizer123',
      role: 'organizer',
      name: 'EduSports Alliance',
      letterhead: {
        address: 'Lot 5, Jalan Sukan 2\nTaman Perindustrian Sukan\n43300 Seri Kembangan, Selangor',
        contactPerson: 'Encik Hafiz bin Karim',
        contactPhone: '03-8765 4321',
        contactEmail: 'contact@edusports.com.my'
      }
    });
    await Users.put({
      email: 'brightday@eduminat.my',
      password: 'organizer123',
      role: 'organizer',
      name: 'BrightDay Sports Club',
      letterhead: {
        address: 'Lot 7, Jalan Sukan Perdana\nTaman Sukan Negara\n57000 Kuala Lumpur',
        contactPerson: 'Encik Azman bin Yusof',
        contactPhone: '03-9055 1234',
        contactEmail: 'hello@brightday.my'
      }
    });
    await Users.put({
      email: 'kpm@eduminat.my',
      password: 'kpm123',
      role: 'kpm',
      name: 'KPM Officer'
    });

    // ============================================================
    //  HAND-CURATED COMPETITIONS
    //  Cover all levels, categories, engagement types, statuses
    // ============================================================
    const curatedComps = [
      // ---------- STEM · National · Ranked ----------
      {
        name: 'National Coding Challenge',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'A national-level coding competition where students solve algorithmic problems under time pressure. Online, ranked, and live-streamed.',
        date: '2026-02-20',
        status: 'completed',
        level: 'kebangsaan',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true,
        url: 'https://www.code.org/learn',
        official: {
          dateStart: '2026-02-20',
          dateEnd: '2026-02-21',
          year: 2026
        }
      },
      {
        name: 'Robotics Championship',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'A national robotics tournament where teams design, build, and battle autonomous robots in a live arena.',
        date: '2026-07-05',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        url: 'https://www.firstinspires.org/robotics/frc',
        official: {
          dateStart: '2026-07-05',
          dateEnd: '2026-07-06',
          year: 2026
        }
      },

      // ---------- STEM · International · Ranked ----------
      {
        name: 'International Math Olympiad',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'The world\'s most prestigious mathematics competition for secondary school students, held annually.',
        date: '2026-09-20',
        status: 'approved',
        level: 'antarabangsa',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        url: 'https://www.imo-official.org',
        official: {
          dateStart: '2026-09-20',
          dateEnd: '2026-09-27',
          year: 2026
        }
      },

      // ---------- STEM · State · Ranked ----------
      {
        name: 'Selangor Science & Innovation Fair',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'State-level science fair showcasing innovation projects from secondary schools across Selangor.',
        date: '2026-05-15',
        status: 'completed',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-05-15',
          dateEnd: '2026-05-16',
          year: 2026
        }
      },

      // ---------- STEM · District · Ranked ----------
      {
        name: 'District Science Quiz',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'A quick-fire science quiz for secondary students across the district, testing general knowledge and reasoning.',
        date: '2026-03-10',
        status: 'completed',
        level: 'zon_daerah',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-03-10',
          dateEnd: '2026-03-10',
          year: 2026
        }
      },

      // ---------- Language · National · Ranked ----------
      {
        name: 'National Public Speaking Championship',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Language',
        description: 'Students deliver 5-minute speeches on national topics before a panel of judges. Judged on content, delivery, and structure.',
        date: '2026-04-18',
        status: 'completed',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-04-18',
          dateEnd: '2026-04-18',
          year: 2026
        }
      },

      // ---------- Language · State · Ranked ----------
      {
        name: 'Johor Inter-School Debate Cup',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Language',
        description: 'A state-level debate tournament in the British Parliamentary format. Three preliminary rounds followed by knockout stages.',
        date: '2026-06-08',
        status: 'approved',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-06-08',
          dateEnd: '2026-06-09',
          year: 2026
        }
      },

      // ---------- Language · National · Non-ranked ----------
      {
        name: 'Malaysian Young Writers Workshop',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Language',
        description: 'A 3-day creative writing workshop with published Malaysian authors. No competition — participation and completion recognised.',
        date: '2026-08-12',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 2,
        hasRanking: false,
        official: {
          dateStart: '2026-08-12',
          dateEnd: '2026-08-14',
          year: 2026
        }
      },

      // ---------- Arts · National · Ranked ----------
      {
        name: 'Digital Arts Showcase',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Arts',
        description: 'An online national digital art competition. Students submit original digital artwork around a yearly theme.',
        date: '2026-10-01',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-10-01',
          dateEnd: '2026-10-31',
          year: 2026
        }
      },

      // ---------- Arts · Division · Ranked (Sabah/Sarawak) ----------
      {
        name: 'Sabah Heritage Video Contest',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Arts',
        description: 'A division-level video competition celebrating Sabah\'s cultural heritage. Submissions judged by local filmmakers.',
        date: '2026-03-15',
        status: 'completed',
        level: 'bahagian',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-03-15',
          dateEnd: '2026-03-20',
          year: 2026
        }
      },

      // ---------- Sports · National · Non-ranked ----------
      {
        name: 'Larian Merdeka 2026',
        organizerEmail: 'brightday@eduminat.my',
        organizerName: 'BrightDay Sports Club',
        category: 'Sports',
        description: 'A national independence-day fun run. All finishers receive a participation certificate. Non-competitive.',
        date: '2026-08-31',
        status: 'approved',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 2,
        hasRanking: false,
        official: {
          dateStart: '2026-08-31',
          dateEnd: '2026-08-31',
          year: 2026
        }
      },

      // ---------- Sports · State · Ranked ----------
      {
        name: 'Kuala Lumpur Badminton Open',
        organizerEmail: 'organizer3@eduminat.my',
        organizerName: 'EduSports Alliance',
        category: 'Sports',
        description: 'A state-level badminton tournament for secondary school students. Singles and doubles categories.',
        date: '2026-05-25',
        status: 'completed',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-05-25',
          dateEnd: '2026-05-27',
          year: 2026
        }
      },

      // ---------- Sports · District · Non-ranked ----------
      {
        name: 'District Chess Carnival',
        organizerEmail: 'organizer3@eduminat.my',
        organizerName: 'EduSports Alliance',
        category: 'Sports',
        description: 'A district-level chess carnival open to all secondary students. Played in a friendly swiss-system format.',
        date: '2026-11-08',
        status: 'approved',
        level: 'zon_daerah',
        mode: 'fizikal',
        engagementType: 2,
        hasRanking: false,
        official: {
          dateStart: '2026-11-08',
          dateEnd: '2026-11-08',
          year: 2026
        }
      },

      // ---------- Pending approval (KPM queue demo) ----------
      {
        name: 'National Entrepreneurship Pitch 2026',
        organizerEmail: 'organizer@eduminat.my',
        organizerName: 'FutureTech Academy',
        category: 'STEM',
        description: 'Students pitch startup ideas to a panel of Malaysian entrepreneurs. Judged on viability, creativity, and presentation.',
        date: '2026-12-05',
        status: 'pending',
        level: 'kebangsaan',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-12-05',
          dateEnd: '2026-12-06',
          year: 2026
        }
      },
      {
        name: 'ASEAN Youth Film Festival',
        organizerEmail: 'organizer2@eduminat.my',
        organizerName: 'ArtsHub Malaysia',
        category: 'Arts',
        description: 'A regional film festival for youth filmmakers across ASEAN. Short films under 10 minutes.',
        date: '2026-12-15',
        status: 'pending',
        level: 'antarabangsa',
        mode: 'dalam_talian',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-12-15',
          dateEnd: '2026-12-20',
          year: 2026
        }
      },

      // ---------- Rejected (edge case) ----------
      {
        name: 'Unauthorized Tech Bootcamp',
        organizerEmail: 'organizer3@eduminat.my',
        organizerName: 'EduSports Alliance',
        category: 'STEM',
        description: 'Rejected by KPM due to incomplete documentation and unverified organizer credentials.',
        date: '2026-11-20',
        status: 'rejected',
        level: 'negeri',
        mode: 'fizikal',
        engagementType: 1,
        hasRanking: true,
        official: {
          dateStart: '2026-11-20',
          dateEnd: '2026-11-22',
          year: 2026
        }
      }
    ];

    // ============================================================
    //  GENERATED COMPETITIONS (~40 more)
    // ============================================================
    const generatedComps = [];
    const startDates = [
      new Date('2026-01-15'), new Date('2026-02-10'), new Date('2026-03-05'),
      new Date('2026-04-20'), new Date('2026-05-15'), new Date('2026-06-10'),
      new Date('2026-07-20'), new Date('2026-08-15'), new Date('2026-09-10'),
      new Date('2026-10-05'), new Date('2026-11-12'), new Date('2026-12-08')
    ];

    for (let i = 0; i < 40; i++) {
      const level = weightedPick(COMP_LEVELS);
      const category = pick(COMP_CATEGORIES);
      const subject = pick(COMP_SUBJECTS[category]);
      const suffix = pick(COMP_SUFFIXES);
      const organizer = pick(ORGANIZER_POOL);
      const date = startDates[Math.floor(rng() * startDates.length)];
      const dayOffset = Math.floor(rng() * 25);
      const compDate = new Date(date.getTime() + dayOffset * 24 * 3600 * 1000);

      const name = `${level.prefix} ${subject} ${suffix} ${compDate.getFullYear()}`;

      // Status: mostly approved, some pending/completed/rejected
      let status;
      const roll = rng();
      if (roll < 0.65) status = 'approved';
      else if (roll < 0.80) status = 'pending';
      else if (roll < 0.95) status = 'completed';
      else status = 'rejected';

      // Engagement type: mostly Type I, occasionally II or III
      const engRoll = rng();
      const engagementType = engRoll < 0.7 ? 1 : (engRoll < 0.9 ? 2 : 3);
      const hasRanking = engagementType === 1;

      // 40% of generated competitions have a URL
      const hasUrl = rng() < 0.4;

      generatedComps.push({
        name,
        organizerEmail: organizer.email,
        organizerName: organizer.name,
        category,
        description: `${level.prefix} ${subject.toLowerCase()} competition organized by ${organizer.name}.`,
        date: compDate.toISOString().slice(0, 10),
        status,
        level: level.key,
        mode: rng() < 0.5 ? 'fizikal' : 'dalam_talian',
        engagementType,
        hasRanking,
        url: hasUrl ? `https://example.com/${name.toLowerCase().replace(/\s+/g, '-')}` : '',
        official: {
          dateStart: compDate.toISOString().slice(0, 10),
          dateEnd: new Date(compDate.getTime() + Math.floor(rng() * 30) * 24 * 3600 * 1000).toISOString().slice(0, 10),
          year: compDate.getFullYear()
        }
      });
    }

    const allCompsToAdd = [...curatedComps, ...generatedComps];
    for (const c of allCompsToAdd) {
      c.participationScore = getParticipationScore(c.level, c.engagementType);
      c.maxAchievementScore = c.hasRanking ? getAchievementScore(c.level, 'johan') : 0;
      await Competitions.add(c);
    }

    // Reload from DB to get IDs
    const allComps = await Competitions.all();
    const approvedComps = allComps.filter(c => c.status === 'approved' || c.status === 'completed');

    const find = (name) => allComps.find(c => c.name === name);
    const coding = find('National Coding Challenge');
    const robotics = find('Robotics Championship');
    const imo = find('International Math Olympiad');
    const larian = find('Larian Merdeka 2026');

    // ============================================================
    //  REGISTRATION + MARK HELPER
    // ============================================================
    async function register(studentEmail, comp, {
      status = 'registered',
      result = null,
      daysAgo = 30
    } = {}) {
      if (!comp) return;
      const entry = {
        studentEmail,
        competitionId: comp.id,
        status,
        registeredAt: Date.now() - daysAgo * 24 * 3600 * 1000,
        result,
        participationScore: 0,
        achievementScore: 0,
        totalPajsk: 0
      };

      if (status === 'completed' && result) {
        const scores = computeRegistrationPajsk(comp, result);
        entry.completedAt = Date.now() - Math.max(1, daysAgo - 10) * 24 * 3600 * 1000;
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
    //  HAND-CURATED REGISTRATIONS (kept from previous version)
    // ============================================================
    await register('mujahid@eduminat.my', coding, {
      status: 'registered'
    });
    await register('mujahid@eduminat.my', robotics, {
      status: 'completed',
      result: 'ketiga'
    });
    await register('mursyid@eduminat.my', coding, {
      status: 'registered'
    });
    await register('musyrif@eduminat.my', coding, {
      status: 'completed',
      result: 'naib_johan'
    });
    await register('aisyah@eduminat.my', robotics, {
      status: 'completed',
      result: 'johan'
    });
    await register('aisyah@eduminat.my', imo, {
      status: 'completed',
      result: 'keempat'
    });
    await register('hafiz@eduminat.my', larian, {
      status: 'completed',
      result: 'penyertaan'
    });
    await register('sarah@eduminat.my', coding, {
      status: 'registered'
    });

    // ============================================================
    //  GENERATED REGISTRATIONS (~300 more)
    // ============================================================
    const RESULT_POOL = [{
        result: 'johan',
        weight: 12
      },
      {
        result: 'naib_johan',
        weight: 12
      },
      {
        result: 'ketiga',
        weight: 14
      },
      {
        result: 'keempat',
        weight: 8
      },
      {
        result: 'kelima',
        weight: 6
      },
      {
        result: 'penyertaan',
        weight: 48
      }
    ];

    // Each student joins 3-6 approved competitions (excluding Zaki)
    for (const student of allStudents) {
      if (student.email === 'zaki@eduminat.my') continue;
      if (student.email.startsWith('mujahid') || student.email.startsWith('mursyid') ||
        student.email.startsWith('musyrif') || student.email.startsWith('aisyah') ||
        student.email.startsWith('hafiz') || student.email.startsWith('sarah')) continue;

      const joinCount = 3 + Math.floor(rng() * 4); // 3-6
      const pickedComps = pickN(approvedComps, joinCount);

      for (const comp of pickedComps) {
        // Status: mostly completed, some registered
        const status = rng() < 0.75 ? 'completed' : 'registered';
        const result = status === 'completed' ?
          weightedPick(RESULT_POOL).result :
          null;

        await register(student.email, comp, {
          status,
          result,
          daysAgo: 5 + Math.floor(rng() * 60)
        });
      }
    }

    // ============================================================
    //  REFLECTIONS — canned AI output (no API key needed)
    // ============================================================
    const reflectionStudents = [
      'aisyah@eduminat.my', 'hafiz@eduminat.my', 'mursyid@eduminat.my',
      'musyrif@eduminat.my', 'sarah@eduminat.my', 'mujahid@eduminat.my'
    ];

    for (let i = 0; i < reflectionStudents.length; i++) {
      const studentEmail = reflectionStudents[i];
      const studentRegs = await Registrations.byStudent(studentEmail);
      const completedRegs = studentRegs.filter(r => r.status === 'completed');
      if (completedRegs.length === 0) continue;

      const reg = completedRegs[0];
      const comp = allComps.find(c => c.id === reg.competitionId);
      if (!comp) continue;

      const canned = CANNED_REFLECTIONS[i % CANNED_REFLECTIONS.length];
      await Reflections.add({
        studentEmail,
        competitionId: comp.id,
        competitionName: comp.name,
        answers: canned.answers,
        questions: canned.questions,
        insights: canned.insights,
        aiEnabled: false, // ← shows demo-mode badge in the UI
        createdAt: Date.now() - (10 + i) * 24 * 3600 * 1000
      });
    }

    // ============================================================
    //  REPORTS
    // ============================================================
    const completedRobotics = (await Registrations.byCompetition(robotics.id))
      .filter(r => r.status === 'completed');

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

    const completedLarian = (await Registrations.byCompetition(larian.id))
      .filter(r => r.status === 'completed');

    await Reports.add({
      competitionId: larian.id,
      competitionName: larian.name,
      organizerEmail: 'brightday@eduminat.my',
      organizerName: 'BrightDay Sports Club',
      participants: completedLarian.length,
      totalPajskAwarded: completedLarian.reduce((s, r) => s + (r.totalPajsk || 0), 0),
      status: 'acknowledged',
      submittedAt: Date.now() - 10 * 24 * 3600 * 1000,
      acknowledgedAt: Date.now() - 8 * 24 * 3600 * 1000
    });

    // Seed the KPM letterhead with defaults
    const existingLetterhead = await Settings.get('kpm_letterhead');
    if (!existingLetterhead) {
      await Settings.set('kpm_letterhead', DEFAULT_KPM_LETTERHEAD);
    }

    const totalComps = allComps.length;
    console.log(`✅ Demo seeded: ${allStudents.length} students, ${totalComps} competitions, ${CLASSES.length} classes, 3 parents, 2 teachers, 3 organizers.`);
  } catch (err) {
    console.error('Seed failed:', err);
  }
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

  // refections
  Reflections,
  Settings,
// Convenience wrappers
getKpmLetterhead: async () => (await Settings.get('kpm_letterhead'))?.value || DEFAULT_KPM_LETTERHEAD,
  saveKpmLetterhead: async (v) => Settings.set('kpm_letterhead', {
    ...DEFAULT_KPM_LETTERHEAD,
    ...v
  })
};