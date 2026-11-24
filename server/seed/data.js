export const categories = [
  { slug: 'jee', name: 'JEE', tagline: 'Main & Advanced', description: 'Complete Physics, Chemistry and Mathematics preparation with problem-solving drills and full-length mocks.', icon: 'atom', accent: 'orange' },
  { slug: 'neet', name: 'NEET', tagline: 'Medical entrance', description: 'NCERT-first Biology, concept-led Physics and reaction-focused Chemistry for NEET UG.', icon: 'stethoscope', accent: 'emerald' },
  { slug: 'upsc', name: 'UPSC', tagline: 'Civil services', description: 'Prelims and Mains preparation spanning polity, history, geography, economy and answer writing.', icon: 'landmark', accent: 'indigo' },
  { slug: 'ssc', name: 'SSC', tagline: 'CGL & CHSL', description: 'Quant, reasoning and English modules tuned for SSC Tier 1 and Tier 2 patterns.', icon: 'file-text', accent: 'rose' },
  { slug: 'banking', name: 'Banking', tagline: 'IBPS, SBI & RBI', description: 'Speed-focused aptitude, puzzles, comprehension and banking awareness for bank exams.', icon: 'briefcase', accent: 'sky' },
  { slug: 'gate', name: 'GATE', tagline: 'Engineering PG', description: 'Subject-deep GATE CSE preparation with PYQ analysis and concept-first lectures.', icon: 'cpu', accent: 'violet' },
  { slug: 'cuet', name: 'CUET', tagline: 'University entrance', description: 'Domain subjects plus the General Test for central university admissions.', icon: 'graduation-cap', accent: 'amber' },
  { slug: 'school', name: 'School', tagline: 'CBSE & ICSE', description: 'Board-aligned Class 10 and 12 courses with derivations, numericals and revision marathons.', icon: 'school', accent: 'teal' },
  { slug: 'foundation', name: 'Foundation', tagline: 'Classes 6–10', description: 'Early conceptual strength in Maths and Science that compounds into competitive exam success.', icon: 'sparkles', accent: 'fuchsia' },
];

export const teachers = [
  {
    email: 'teacher@edupulse.demo', name: 'Dr. Vikram Sethi', headline: 'JEE & NEET Physics · 14 years of teaching',
    qualification: 'Ph.D. Physics, IIT Delhi', experienceYears: 14, subjects: 'Physics, Mechanics, Modern Physics',
    bio: 'Vikram has mentored over 12,000 students for JEE and NEET. His classes focus on first-principles reasoning and exam-ready problem templates.',
  },
  {
    email: 'anjali.rao@edupulse.demo', name: 'Anjali Rao', headline: 'NEET Biology · NCERT specialist',
    qualification: 'M.Sc. Zoology, Delhi University', experienceYears: 11, subjects: 'Biology, Genetics, Human Physiology',
    bio: 'Anjali turns dense NCERT chapters into memory maps and high-yield question sets. Her students consistently score 320+ in NEET Biology.',
  },
  {
    email: 'rohit.bansal@edupulse.demo', name: 'Rohit Bansal', headline: 'JEE Mathematics · Calculus & Algebra',
    qualification: 'B.Tech, IIT Bombay', experienceYears: 9, subjects: 'Mathematics, Calculus, Coordinate Geometry',
    bio: 'Rohit builds mathematical intuition before shortcuts. He is known for structured problem ladders that move from basics to JEE Advanced level.',
  },
  {
    email: 'sneha.iyer@edupulse.demo', name: 'Sneha Iyer', headline: 'Chemistry · Organic mechanisms decoded',
    qualification: 'M.Sc. Chemistry, IIT Madras', experienceYears: 8, subjects: 'Chemistry, Organic Chemistry, Physical Chemistry',
    bio: 'Sneha teaches reaction mechanisms as stories, not lists. Her visual approach to organic chemistry helps students retain mechanisms for years.',
  },
  {
    email: 'arjun.nair@edupulse.demo', name: 'Arjun Nair', headline: 'UPSC Polity & Governance',
    qualification: 'M.A. Political Science, JNU', experienceYears: 12, subjects: 'Polity, Governance, International Relations',
    bio: 'Arjun simplifies the Constitution through case studies and current examples. A former civil services interview panellist, he teaches answer framing as well as content.',
  },
  {
    email: 'kavita.deshmukh@edupulse.demo', name: 'Kavita Deshmukh', headline: 'UPSC History & GS Answer Writing',
    qualification: 'M.A. History, Pune University', experienceYears: 10, subjects: 'History, Art & Culture, GS Mains',
    bio: 'Kavita focuses on themes rather than dates, and on answers rather than notes. Her mains answer frameworks are used by aspirants across three attempt levels.',
  },
  {
    email: 'manish.gupta@edupulse.demo', name: 'Manish Gupta', headline: 'SSC & Banking Quantitative Aptitude',
    qualification: 'M.Com, Delhi School of Economics', experienceYears: 13, subjects: 'Quantitative Aptitude, Arithmetic, Data Interpretation',
    bio: 'Manish has helped thousands crack SSC and bank exams with calculation strategies that save seconds per question.',
  },
  {
    email: 'pooja.malhotra@edupulse.demo', name: 'Pooja Malhotra', headline: 'Reasoning & English for Banking',
    qualification: 'M.A. English, Punjab University', experienceYears: 9, subjects: 'Reasoning, English Language, Banking Awareness',
    bio: 'Pooja decodes puzzles with a repeatable process and teaches English through exam-grade passages rather than isolated grammar drills.',
  },
  {
    email: 'rakesh.verma@edupulse.demo', name: 'Rakesh Verma', headline: 'GATE CSE · Algorithms & Systems',
    qualification: 'M.Tech CSE, IIT Kanpur', experienceYears: 15, subjects: 'Algorithms, Operating Systems, DBMS',
    bio: 'Rakesh teaches computer science as connected systems. His GATE problem sessions are built from two decades of previous-year papers.',
  },
  {
    email: 'nisha.kulkarni@edupulse.demo', name: 'Nisha Kulkarni', headline: 'CUET & Board Mathematics',
    qualification: 'M.Sc. Mathematics, Banaras Hindu University', experienceYears: 7, subjects: 'Mathematics, Statistics, CUET General Test',
    bio: 'Nisha makes mathematics approachable for board and CUET students with worked examples and timed practice.',
  },
  {
    email: 'sameer.khan@edupulse.demo', name: 'Sameer Khan', headline: 'Foundation Science & Maths',
    qualification: 'B.Ed., M.Sc. Physics', experienceYears: 10, subjects: 'Science, Mathematics, Foundation Courses',
    bio: 'Sameer builds curiosity first. His foundation classes use demonstrations and everyday examples before formal definitions.',
  },
  {
    email: 'aditi.bose@edupulse.demo', name: 'Aditi Bose', headline: 'CUET English & General Test',
    qualification: 'M.A. English, Jadavpur University', experienceYears: 6, subjects: 'English, General Test, Economics',
    bio: 'Aditi helps students master reading comprehension, vocabulary and the CUET General Test with adaptive practice sets.',
  },
];

export const pendingTeacher = {
  email: 'karan.bhatt@edupulse.demo', name: 'Karan Bhatt', headline: 'Physics educator (application under review)',
  qualification: 'M.Sc. Physics, University of Rajasthan', experienceYears: 4, subjects: 'Physics, JEE Main',
};

export const courses = [
  {
    slug: 'jee-main-physics-2027', title: 'JEE Main 2027 Physics: Complete Course',
    subtitle: 'Mechanics to Modern Physics with 500+ solved problems and full-length mocks',
    description:
      'A structured JEE Main Physics program covering the full syllabus through concept lectures, guided problem sets and exam-pattern mock analysis. Each chapter ends with a checkpoint quiz and a revision sheet so you always know what to fix next.',
    category: 'jee', exam: 'JEE Main', classLevel: 'Class 11–12 / Dropper', subjectArea: 'Physics', language: 'English',
    level: 'Intermediate', durationWeeks: 40, priceCents: 499900, mrpCents: 799900, teacherEmail: 'teacher@edupulse.demo',
    objectives: ['Master the full JEE Main Physics syllabus with exam-level problem practice', 'Build speed and accuracy with timed chapter checkpoints', 'Learn error analysis and question selection during mocks', 'Revise using formula sheets and one-page chapter summaries'],
    targetAudience: 'Class 11, 12 and dropper students targeting JEE Main 2027',
    batchTimings: 'Mon–Sat · 6:30 PM – 8:00 PM IST', startDate: '2026-12-01', endDate: '2027-11-30', validityDays: 365, createdAtDaysAgo: 75,
    curriculum: [
      {
        subject: 'Physics',
        chapters: [
          { name: 'Units, Dimensions & Errors', lectures: ['Dimensional Analysis Made Simple', 'Error Propagation and Significant Figures'] },
          { name: 'Kinematics', lectures: ['Motion in a Straight Line: Graphs & Equations', 'Projectile Motion: Core Problem Patterns'] },
          { name: 'Laws of Motion', lectures: ['Free Body Diagrams That Never Fail', 'Friction: Static vs Kinetic Traps'] },
          { name: 'Work, Energy & Power', lectures: ['Work–Energy Theorem in One Shot', 'Conservative Forces and Potential Energy'] },
          { name: 'Rotational Motion', lectures: ['Moment of Inertia: Standard Cases', 'Rolling Without Slipping Problems'] },
        ],
      },
    ],
  },
  {
    slug: 'jee-advanced-mathematics', title: 'JEE Advanced Mathematics: Calculus & Algebra',
    subtitle: 'Problem ladders from JEE Main level to Advanced-level multi-concept questions',
    description:
      'Designed for students who can solve standard problems but stall on JEE Advanced questions. The course connects functions, limits, calculus and coordinate geometry through carefully sequenced problem ladders and full solution discussions.',
    category: 'jee', exam: 'JEE Advanced', classLevel: 'Class 11–12 / Dropper', subjectArea: 'Mathematics', language: 'English',
    level: 'Advanced', durationWeeks: 36, priceCents: 599900, mrpCents: 899900, teacherEmail: 'rohit.bansal@edupulse.demo',
    objectives: ['Strengthen function and graph intuition for advanced problems', 'Master differentiation and integration techniques under time pressure', 'Handle multi-concept coordinate geometry questions', 'Develop an approach for partial marking and question selection'],
    targetAudience: 'JEE Advanced aspirants scoring 60+ percentile in Main',
    batchTimings: 'Tue, Thu, Sat · 7:00 PM – 8:30 PM IST', startDate: '2026-12-05', endDate: '2027-10-31', validityDays: 365, createdAtDaysAgo: 62,
    curriculum: [
      {
        subject: 'Mathematics',
        chapters: [
          { name: 'Functions & Graphs', lectures: ['Domain, Range and Graph Transformations', 'Composite and Inverse Functions'] },
          { name: 'Limits & Continuity', lectures: ['Evaluating Limits: Standard Forms', 'Continuity and Differentiability Checkpoints'] },
          { name: 'Differentiation', lectures: ['Chain Rule and Implicit Differentiation', 'Maxima–Minima Word Problems'] },
          { name: 'Integration', lectures: ['Standard Integrals and Substitution', 'Definite Integrals via Properties'] },
          { name: 'Coordinate Geometry', lectures: ['Straight Lines: Distance & Angle Formulas', 'Circle: Tangents and Family of Circles'] },
        ],
      },
    ],
  },
  {
    slug: 'jee-chemistry-foundations-free', title: 'JEE Chemistry Foundations (Free)',
    subtitle: 'Mole concept, atomic structure and bonding — the base every JEE aspirant needs',
    description:
      'A free starter course covering the three chapters that decide whether the rest of JEE Chemistry feels easy or impossible. Includes original notes and a practice set after every lecture.',
    category: 'jee', exam: 'JEE Main', classLevel: 'Class 11', subjectArea: 'Chemistry', language: 'English',
    level: 'Beginner', durationWeeks: 8, priceCents: 0, mrpCents: 0, teacherEmail: 'sneha.iyer@edupulse.demo',
    objectives: ['Build confidence with mole concept and stoichiometry', 'Understand quantum numbers and electronic configuration', 'Predict molecular geometry and polarity', 'Attempt foundation-level JEE questions independently'],
    targetAudience: 'Class 11 students starting JEE preparation',
    batchTimings: 'Self-paced with weekly doubt sessions', startDate: '2026-11-20', endDate: '2027-02-28', validityDays: 365, createdAtDaysAgo: 48,
    curriculum: [
      {
        subject: 'Chemistry',
        chapters: [
          { name: 'Some Basic Concepts', lectures: ['Mole Concept: From Grams to Particles', 'Stoichiometry: Limiting Reagent Drills'] },
          { name: 'Atomic Structure', lectures: ['Quantum Numbers Without Confusion', 'Electronic Configuration Shortcuts'] },
          { name: 'Chemical Bonding', lectures: ['Hybridisation and Geometry', 'Dipole Moment and Polarity'] },
        ],
      },
    ],
  },
  {
    slug: 'jee-main-mock-test-series', title: 'JEE Main 2027 Mock Test Series',
    subtitle: 'Full-syllabus mocks with detailed solutions and rank analysis',
    description:
      'Practise with exam-pattern papers, receive chapter-wise analytics and compare your performance on a real leaderboard. Includes two strategy lectures on analysing mock results and planning revision.',
    category: 'jee', exam: 'JEE Main', classLevel: 'Class 11–12 / Dropper', subjectArea: 'All subjects', language: 'English',
    level: 'Advanced', durationWeeks: 20, priceCents: 99900, mrpCents: 199900, teacherEmail: 'rohit.bansal@edupulse.demo',
    objectives: ['Simulate the JEE Main exam environment', 'Identify weak chapters from real attempt analytics', 'Improve time allocation across subjects', 'Track rank movement across mocks'],
    targetAudience: 'Students who have completed at least 70% of the JEE syllabus',
    batchTimings: 'One mock every Sunday · 9:00 AM IST', startDate: '2026-12-01', endDate: '2027-04-30', validityDays: 365, createdAtDaysAgo: 30,
    curriculum: [
      {
        subject: 'Exam Strategy',
        chapters: [
          { name: 'Mock Analysis', lectures: ['How JEE Main Mock Analysis Works', 'Time Management in a 3-Hour Paper'] },
        ],
      },
    ],
    testSlugs: ['jee-main-full-mock-1', 'jee-main-full-mock-2'],
  },
  {
    slug: 'neet-biology-ncert-decoded', title: 'NEET UG Biology: NCERT Decoded',
    subtitle: 'Line-by-line NCERT coverage with high-yield question practice',
    description:
      'Biology decides your NEET rank. This course walks through NCERT chapters with memory maps, exception lists and question patterns that repeat across years. Every lecture ends with an NCERT-based practice set.',
    category: 'neet', exam: 'NEET UG', classLevel: 'Class 11–12 / Dropper', subjectArea: 'Biology', language: 'English',
    level: 'Intermediate', durationWeeks: 40, priceCents: 449900, mrpCents: 699900, teacherEmail: 'anjali.rao@edupulse.demo',
    objectives: ['Cover the entire NEET Biology syllabus from NCERT', 'Memorise high-yield facts using structured maps', 'Solve assertion–reason and statement-based questions', 'Track chapter-wise accuracy from tests'],
    targetAudience: 'NEET UG aspirants in Class 11, 12 or a dropper year',
    batchTimings: 'Mon–Fri · 5:00 PM – 6:30 PM IST', startDate: '2026-12-01', endDate: '2027-11-30', validityDays: 365, createdAtDaysAgo: 70,
    curriculum: [
      {
        subject: 'Biology',
        chapters: [
          { name: 'Cell: The Unit of Life', lectures: ['Prokaryotic vs Eukaryotic Cells', 'Cell Organelles: Function Table'] },
          { name: 'Human Physiology', lectures: ['Digestion and Absorption Essentials', 'Breathing and Exchange of Gases'] },
          { name: 'Genetics', lectures: ['Mendelian Genetics Problem Solving', 'Molecular Basis of Inheritance'] },
          { name: 'Ecology', lectures: ['Population Interactions with Examples', 'Ecosystem Energy Flow'] },
        ],
      },
    ],
  },
  {
    slug: 'neet-physics-concepts', title: 'NEET Physics: Concepts + Problem Solving',
    subtitle: 'The 30 chapters that matter, taught with NEET-level depth',
    description:
      'Physics is the differentiator in NEET. This course focuses on conceptual clarity for mechanics, thermodynamics and electricity, with numericals limited to the NEET pattern so you do not waste time on irrelevant difficulty.',
    category: 'neet', exam: 'NEET UG', classLevel: 'Class 11–12 / Dropper', subjectArea: 'Physics', language: 'English',
    level: 'Intermediate', durationWeeks: 32, priceCents: 399900, mrpCents: 649900, teacherEmail: 'teacher@edupulse.demo',
    objectives: ['Understand mechanics through NEET-level problems', 'Apply thermodynamic sign conventions correctly', 'Solve circuit problems using Kirchhoff laws', 'Avoid over-preparation with the right difficulty level'],
    targetAudience: 'NEET aspirants who want a reliable Physics score',
    batchTimings: 'Mon, Wed, Fri · 7:30 PM – 9:00 PM IST', startDate: '2026-12-10', endDate: '2027-10-31', validityDays: 365, createdAtDaysAgo: 55,
    curriculum: [
      {
        subject: 'Physics',
        chapters: [
          { name: 'Kinematics & Laws of Motion', lectures: ['Relative Velocity in NEET Problems', 'Friction and Tension Numericals'] },
          { name: 'Thermodynamics', lectures: ['First Law: Sign Conventions', 'Thermodynamic Processes Compared'] },
          { name: 'Current Electricity', lectures: ['Series–Parallel Circuits', "Kirchhoff's Laws in Two Loops"] },
        ],
      },
    ],
  },
  {
    slug: 'neet-chemistry-organic-inorganic', title: 'NEET Chemistry: Organic + Inorganic Essentials',
    subtitle: 'Reaction mechanisms, periodic trends and coordination chemistry made visual',
    description:
      'A compact NEET Chemistry course that prioritises the mechanisms and trends that appear in almost every paper. Includes reaction maps for organic chemistry and concise inorganic revision tables.',
    category: 'neet', exam: 'NEET UG', classLevel: 'Class 11–12 / Dropper', subjectArea: 'Chemistry', language: 'English',
    level: 'Intermediate', durationWeeks: 30, priceCents: 449900, mrpCents: 599900, teacherEmail: 'sneha.iyer@edupulse.demo',
    objectives: ['Decode organic mechanisms into simple steps', 'Master IUPAC naming and isomerism', 'Revise inorganic trends with tables and exceptions', 'Solve NCERT-level assertion questions'],
    targetAudience: 'NEET aspirants targeting 140+ in Chemistry',
    batchTimings: 'Tue, Thu, Sat · 6:00 PM – 7:30 PM IST', startDate: '2026-12-08', endDate: '2027-10-31', validityDays: 365, createdAtDaysAgo: 41,
    curriculum: [
      {
        subject: 'Chemistry',
        chapters: [
          { name: 'Organic Basics', lectures: ['IUPAC Naming Masterclass', 'Isomerism: Structural vs Stereo'] },
          { name: 'Reaction Mechanisms', lectures: ['SN1 vs SN2: Deciding Factors', 'Aldehydes and Ketones Reactions'] },
          { name: 'Inorganic Essentials', lectures: ['Periodic Trends Quick Revision', 'Coordination Compounds: CFT Basics'] },
        ],
      },
    ],
  },
  {
    slug: 'neet-dropper-starter-free', title: 'NEET 2027 Dropper Starter (Free)',
    subtitle: 'A realistic 10-month roadmap, NCERT strategy and weekly revision system',
    description:
      'A free three-class orientation for droppers. Learn how to plan ten months, how to read NCERT for retention, and how to run a weekly revision cycle that prevents backlogs. Includes a downloadable planner.',
    category: 'neet', exam: 'NEET UG', classLevel: 'Dropper', subjectArea: 'Strategy', language: 'English',
    level: 'Beginner', durationWeeks: 3, priceCents: 0, mrpCents: 0, teacherEmail: 'anjali.rao@edupulse.demo',
    objectives: ['Build a realistic 10-month NEET preparation plan', 'Read NCERT for retention, not completion', 'Set up a weekly revision and testing cycle'],
    targetAudience: 'Droppers starting NEET preparation from scratch or restarting after a gap',
    batchTimings: 'Self-paced', startDate: '2026-11-18', endDate: '2027-01-31', validityDays: 365, createdAtDaysAgo: 20,
    curriculum: [
      {
        subject: 'NEET 2027 Roadmap',
        chapters: [
          { name: 'Planning', lectures: ['Building a 10-Month NEET Plan', 'NCERT Reading Strategy', 'Weekly Revision Framework'] },
        ],
      },
    ],
  },
  {
    slug: 'upsc-prelims-gs-foundation', title: 'UPSC Prelims GS Foundation 2027',
    subtitle: 'Polity, history and geography with current-affairs integration',
    description:
      'A foundation course for UPSC Prelims GS Paper 1. Lectures move from constitutional basics to modern history and geography, with every topic linked to previous-year questions and current affairs.',
    category: 'upsc', exam: 'UPSC CSE', classLevel: 'Graduate', subjectArea: 'General Studies', language: 'English',
    level: 'Intermediate', durationWeeks: 44, priceCents: 699900, mrpCents: 999900, teacherEmail: 'arjun.nair@edupulse.demo',
    objectives: ['Build a strong foundation in polity, history and geography', 'Connect static topics with current affairs', 'Practise UPSC-style elimination techniques', 'Revise through structured notes and mind maps'],
    targetAudience: 'First-time UPSC aspirants and graduates starting Prelims preparation',
    batchTimings: 'Mon–Fri · 8:00 PM – 9:30 PM IST', startDate: '2026-12-15', endDate: '2027-12-31', validityDays: 365, createdAtDaysAgo: 84,
    curriculum: [
      {
        subject: 'Polity',
        chapters: [
          { name: 'Constitutional Framework', lectures: ['Making of the Constitution', 'Preamble and Basic Structure'] },
          { name: 'Union & State Government', lectures: ['President, PM and Council of Ministers', 'Parliament: Procedures and Committees'] },
        ],
      },
      {
        subject: 'History',
        chapters: [{ name: 'Modern India', lectures: ['Revolt of 1857: Causes and Impact', 'National Movement Phases'] }],
      },
      {
        subject: 'Geography',
        chapters: [{ name: 'Physical Geography', lectures: ['Monsoon Mechanism', 'Rivers and Drainage Systems'] }],
      },
    ],
  },
  {
    slug: 'upsc-mains-answer-writing', title: 'UPSC Mains Answer Writing Intensive',
    subtitle: 'Daily answer practice, evaluation frameworks and ethics case studies',
    description:
      'A mains-focused course built around writing, not just reading. Each module demonstrates a structure, then makes you write under timed conditions with model answers and evaluation checklists.',
    category: 'upsc', exam: 'UPSC CSE', classLevel: 'Graduate', subjectArea: 'GS Mains', language: 'English',
    level: 'Advanced', durationWeeks: 24, priceCents: 549900, mrpCents: 799900, teacherEmail: 'kavita.deshmukh@edupulse.demo',
    objectives: ['Structure GS answers with introductions, body and conclusions', 'Integrate data, examples and committee recommendations', 'Handle ethics case studies with a repeatable framework', 'Improve answer speed without losing depth'],
    targetAudience: 'UPSC Mains aspirants and Prelims-cleared candidates',
    batchTimings: 'Tue, Thu, Sun · 7:00 PM – 8:30 PM IST', startDate: '2026-12-20', endDate: '2027-08-31', validityDays: 365, createdAtDaysAgo: 50,
    curriculum: [
      {
        subject: 'GS Answer Writing',
        chapters: [
          { name: 'Structures & Frameworks', lectures: ['Answer Frameworks for GS Papers', 'Using Data and Examples Effectively'] },
          { name: 'Ethics', lectures: ['Case Studies: Ethical Dilemmas', 'Probity in Governance'] },
        ],
      },
      {
        subject: 'History',
        chapters: [{ name: 'Modern India Themes', lectures: ['Freedom Struggle Themes for Mains', 'Post-Independence Consolidation'] }],
      },
    ],
  },
  {
    slug: 'indian-polity-free', title: 'Indian Polity & Constitution (Free)',
    subtitle: 'Fundamental rights, DPSP and amendments explained for UPSC and SSC',
    description:
      'A free four-lecture series covering the constitutional concepts that appear in UPSC, SSC and state examinations. Includes original revision notes and a short practice quiz.',
    category: 'upsc', exam: 'UPSC CSE', classLevel: 'Graduate', subjectArea: 'Polity', language: 'English',
    level: 'Beginner', durationWeeks: 4, priceCents: 0, mrpCents: 0, teacherEmail: 'arjun.nair@edupulse.demo',
    objectives: ['Understand the sources and structure of the Constitution', 'Distinguish fundamental rights from directive principles', 'Recall landmark amendment cases'],
    targetAudience: 'UPSC, SSC and state PSC aspirants starting polity',
    batchTimings: 'Self-paced', startDate: '2026-11-15', endDate: '2027-01-15', validityDays: 365, createdAtDaysAgo: 33,
    curriculum: [
      {
        subject: 'Polity',
        chapters: [
          { name: 'Constitution Basics', lectures: ['Sources of the Indian Constitution', 'Fundamental Rights Explained', 'DPSP vs Fundamental Duties', 'Amendments: Key Cases'] },
        ],
      },
    ],
  },
  {
    slug: 'ssc-cgl-complete', title: 'SSC CGL 2027 Complete Preparation',
    subtitle: 'Quant, reasoning and English with Tier 1 and Tier 2 strategy',
    description:
      'A full SSC CGL program built around the current exam pattern. Learn calculation shortcuts, practice chapter-wise reasoning sets and improve English accuracy with exam-style passages.',
    category: 'ssc', exam: 'SSC CGL', classLevel: 'Graduate', subjectArea: 'All sections', language: 'Hindi + English',
    level: 'Intermediate', durationWeeks: 32, priceCents: 349900, mrpCents: 499900, teacherEmail: 'manish.gupta@edupulse.demo',
    objectives: ['Solve quantitative aptitude questions within 45 seconds', 'Approach reasoning sets with a fixed method', 'Improve English accuracy with grammar rules', 'Evaluate preparation with Tier 1 mocks'],
    targetAudience: 'SSC CGL 2027 aspirants',
    batchTimings: 'Mon–Sat · 7:00 AM – 8:30 AM IST', startDate: '2026-12-01', endDate: '2027-10-31', validityDays: 365, createdAtDaysAgo: 67,
    curriculum: [
      {
        subject: 'Quantitative Aptitude',
        chapters: [
          { name: 'Arithmetic', lectures: ['Percentage and Profit–Loss Shortcuts', 'Time, Speed and Distance Tricks'] },
          { name: 'Advanced Maths', lectures: ['Algebra: Identities in Exams', 'Geometry: Circle Theorems'] },
        ],
      },
      {
        subject: 'Reasoning',
        chapters: [{ name: 'Verbal Reasoning', lectures: ['Syllogism: Venn Method', 'Coding–Decoding Patterns'] }],
      },
    ],
  },
  {
    slug: 'ssc-chsl-booster', title: 'SSC CHSL Quant + Reasoning Booster',
    subtitle: 'A 10-week speed and accuracy sprint for CHSL Tier 1',
    description:
      'Focused preparation for SSC CHSL Tier 1 with daily practice targets. Covers number system, data interpretation, grammar and reasoning patterns that dominate recent papers.',
    category: 'ssc', exam: 'SSC CHSL', classLevel: 'Class 12 pass', subjectArea: 'Quant + Reasoning', language: 'Hindi + English',
    level: 'Beginner', durationWeeks: 10, priceCents: 249900, mrpCents: 399900, teacherEmail: 'pooja.malhotra@edupulse.demo',
    objectives: ['Master divisibility and LCM–HCF shortcuts', 'Read data interpretation charts quickly', 'Fix common grammar errors', 'Complete sectional tests within time'],
    targetAudience: 'SSC CHSL aspirants and first-time government exam candidates',
    batchTimings: 'Mon–Fri · 8:00 AM – 9:00 AM IST', startDate: '2026-12-05', endDate: '2027-03-31', validityDays: 365, createdAtDaysAgo: 36,
    curriculum: [
      {
        subject: 'Quantitative Aptitude',
        chapters: [
          { name: 'Number System', lectures: ['Divisibility Rules', 'LCM–HCF Word Problems'] },
          { name: 'Data Interpretation', lectures: ['Tables and Bar Charts', 'Pie Chart Calculations'] },
        ],
      },
      {
        subject: 'English',
        chapters: [{ name: 'Grammar', lectures: ['Spotting Errors: Subject–Verb Agreement', 'Idioms and Phrases Drill'] }],
      },
    ],
  },
  {
    slug: 'ssc-cgl-mock-series', title: 'SSC CGL Tier 1 Mock Series',
    subtitle: 'Ten exam-pattern mocks with section-wise timing analysis',
    description:
      'Practice under real Tier 1 conditions with instant scoring, section-wise analytics and rank among EduPulse students. Includes two lectures on exam pattern and scorecard analysis.',
    category: 'ssc', exam: 'SSC CGL', classLevel: 'Graduate', subjectArea: 'All sections', language: 'Hindi + English',
    level: 'Intermediate', durationWeeks: 12, priceCents: 49900, mrpCents: 99900, teacherEmail: 'manish.gupta@edupulse.demo',
    objectives: ['Attempt Tier 1 mocks with correct section strategy', 'Analyse scorecards to find weak topics', 'Improve speed across quant and reasoning'],
    targetAudience: 'SSC CGL aspirants who have completed the syllabus',
    batchTimings: 'One mock every Saturday · 10:00 AM IST', startDate: '2026-11-25', endDate: '2027-03-31', validityDays: 365, createdAtDaysAgo: 18,
    curriculum: [
      {
        subject: 'Exam Strategy',
        chapters: [{ name: 'Mock Analysis', lectures: ['SSC CGL Tier 1 Exam Pattern', 'Analysing Your Mock Scorecard'] }],
      },
    ],
    testSlugs: ['ssc-cgl-tier1-mock-1'],
  },
  {
    slug: 'ibps-po-foundation', title: 'IBPS PO 2027 Foundation Batch',
    subtitle: 'Aptitude, reasoning and English from basics to prelims level',
    description:
      'A complete foundation for IBPS PO Prelims and Mains. Starts with aptitude basics, then moves into high-level puzzles, data interpretation and comprehension with weekly sectional tests.',
    category: 'banking', exam: 'IBPS PO', classLevel: 'Graduate', subjectArea: 'Prelims + Mains', language: 'Hindi + English',
    level: 'Beginner', durationWeeks: 30, priceCents: 399900, mrpCents: 599900, teacherEmail: 'pooja.malhotra@edupulse.demo',
    objectives: ['Build aptitude fundamentals with daily drills', 'Solve floor, box and seating puzzles confidently', 'Improve comprehension accuracy', 'Track sectional performance weekly'],
    targetAudience: 'Graduates preparing for IBPS PO 2027',
    batchTimings: 'Mon–Sat · 6:00 PM – 7:30 PM IST', startDate: '2026-12-10', endDate: '2027-10-31', validityDays: 365, createdAtDaysAgo: 58,
    curriculum: [
      {
        subject: 'Quantitative Aptitude',
        chapters: [
          { name: 'Simplification', lectures: ['Approximation Techniques', 'Quadratic Equations Comparison'] },
          { name: 'Data Interpretation', lectures: ['Caselet DI', 'Missing DI Tables'] },
        ],
      },
      {
        subject: 'Reasoning',
        chapters: [{ name: 'Puzzles', lectures: ['Floor and Box Puzzles', 'Seating Arrangement Basics'] }],
      },
      {
        subject: 'English',
        chapters: [{ name: 'Comprehension', lectures: ['Reading Comprehension Strategy', 'Cloze Test with Context'] }],
      },
    ],
  },
  {
    slug: 'sbi-clerk-complete', title: 'SBI Clerk Complete Preparation',
    subtitle: 'Crack the prelims with arithmetic, puzzles and English essentials',
    description:
      'Built for SBI Clerk Prelims, this course balances speed-building arithmetic with reasoning puzzle practice and exam-grade English. Includes mock test strategy and revision checkpoints.',
    category: 'banking', exam: 'SBI Clerk', classLevel: 'Graduate', subjectArea: 'Prelims', language: 'Hindi + English',
    level: 'Beginner', durationWeeks: 20, priceCents: 299900, mrpCents: 449900, teacherEmail: 'manish.gupta@edupulse.demo',
    objectives: ['Solve arithmetic questions with shortcuts', 'Master linear arrangements and inequality', 'Improve vocabulary and error spotting', 'Complete prelims mocks within time'],
    targetAudience: 'SBI Clerk aspirants',
    batchTimings: 'Mon–Sat · 8:00 PM – 9:00 PM IST', startDate: '2026-12-12', endDate: '2027-06-30', validityDays: 365, createdAtDaysAgo: 28,
    curriculum: [
      {
        subject: 'Quantitative Aptitude',
        chapters: [{ name: 'Arithmetic', lectures: ['Ratio and Partnership', 'Simple and Compound Interest'] }],
      },
      {
        subject: 'Reasoning',
        chapters: [{ name: 'Puzzles', lectures: ['Linear Arrangements', 'Syllogism and Inequality'] }],
      },
      {
        subject: 'English',
        chapters: [{ name: 'Vocabulary', lectures: ['Synonyms and Antonyms in Context', 'Error Spotting Essentials'] }],
      },
    ],
  },
  {
    slug: 'banking-awareness-free', title: 'Banking Awareness & Current Affairs (Free)',
    subtitle: 'RBI, banking operations and digital payments in four lectures',
    description:
      'A free banking awareness module for IBPS, SBI and RBI aspirants. Covers the RBI, account types, NPAs and India\u2019s digital payment ecosystem with notes for revision.',
    category: 'banking', exam: 'IBPS PO', classLevel: 'Graduate', subjectArea: 'Banking Awareness', language: 'Hindi + English',
    level: 'Beginner', durationWeeks: 4, priceCents: 0, mrpCents: 0, teacherEmail: 'pooja.malhotra@edupulse.demo',
    objectives: ['Understand RBI functions and monetary tools', 'Distinguish bank account and deposit types', 'Explain NPAs and priority sector lending', 'Follow digital payment developments'],
    targetAudience: 'Banking exam aspirants starting awareness preparation',
    batchTimings: 'Self-paced', startDate: '2026-11-18', endDate: '2027-01-31', validityDays: 365, createdAtDaysAgo: 22,
    curriculum: [
      {
        subject: 'Banking Awareness',
        chapters: [{ name: 'Banking Basics', lectures: ['RBI: Functions and Tools', 'Types of Bank Accounts', 'NPA and Priority Sector Lending', 'Digital Payments Landscape'] }],
      },
    ],
  },
  {
    slug: 'gate-cs-algorithms', title: 'GATE CS 2027: Algorithms & Data Structures',
    subtitle: 'Complexity, sorting, graphs and dynamic programming with GATE problem sets',
    description:
      'A rigorous GATE CSE course on algorithms and data structures. Each lecture combines proof-level understanding with previous-year GATE problems and shortcut methods for the exam.',
    category: 'gate', exam: 'GATE CSE', classLevel: 'B.Tech / Graduate', subjectArea: 'Algorithms', language: 'English',
    level: 'Advanced', durationWeeks: 24, priceCents: 499900, mrpCents: 699900, teacherEmail: 'rakesh.verma@edupulse.demo',
    objectives: ['Analyse algorithm complexity rigorously', 'Solve recurrence relations for GATE patterns', 'Master graph traversals and shortest paths', 'Recognise dynamic programming problem types'],
    targetAudience: 'GATE CSE 2027 aspirants and final-year CSE students',
    batchTimings: 'Mon, Wed, Fri · 9:00 PM – 10:30 PM IST', startDate: '2026-12-01', endDate: '2027-07-31', validityDays: 365, createdAtDaysAgo: 64,
    curriculum: [
      {
        subject: 'Algorithms',
        chapters: [
          { name: 'Complexity', lectures: ['Asymptotic Notations', 'Recurrence Relations'] },
          { name: 'Sorting', lectures: ['Merge Sort vs Quick Sort', 'Heap Sort Walkthrough'] },
          { name: 'Graphs', lectures: ['BFS and DFS Applications', 'Shortest Path Algorithms'] },
          { name: 'Dynamic Programming', lectures: ['0/1 Knapsack', 'LCS and LIS Patterns'] },
        ],
      },
    ],
  },
  {
    slug: 'gate-cs-os-dbms', title: 'GATE CS: Operating Systems & DBMS',
    subtitle: 'Processes, memory, normalisation and transactions with PYQ-focused teaching',
    description:
      'Two high-weightage GATE CSE subjects taught together. Understand scheduling and memory management, then move to functional dependencies, normal forms and transaction isolation.',
    category: 'gate', exam: 'GATE CSE', classLevel: 'B.Tech / Graduate', subjectArea: 'OS + DBMS', language: 'English',
    level: 'Advanced', durationWeeks: 18, priceCents: 449900, mrpCents: 649900, teacherEmail: 'rakesh.verma@edupulse.demo',
    objectives: ['Compare CPU scheduling algorithms quantitatively', 'Solve paging and page replacement problems', 'Normalise relations up to BCNF', 'Analyse concurrency control and SQL queries'],
    targetAudience: 'GATE CSE aspirants revising core systems subjects',
    batchTimings: 'Tue, Thu, Sat · 9:00 PM – 10:30 PM IST', startDate: '2026-12-05', endDate: '2027-05-31', validityDays: 365, createdAtDaysAgo: 46,
    curriculum: [
      {
        subject: 'Operating Systems',
        chapters: [
          { name: 'Processes & Scheduling', lectures: ['CPU Scheduling Algorithms', "Deadlocks and Banker's Algorithm"] },
          { name: 'Memory Management', lectures: ['Paging and Page Replacement', 'Virtual Memory Concepts'] },
        ],
      },
      {
        subject: 'DBMS',
        chapters: [
          { name: 'Normalisation', lectures: ['Functional Dependencies', '1NF to BCNF'] },
          { name: 'Transactions', lectures: ['ACID and Concurrency Control', 'SQL Joins and Indexing'] },
        ],
      },
    ],
  },
  {
    slug: 'cuet-ug-mathematics', title: 'CUET UG Mathematics Complete',
    subtitle: 'Domain Mathematics with timed sectionals and shortcut practice',
    description:
      'A CUET-focused Mathematics course covering algebra, calculus, probability and coordinate geometry at the right difficulty level. Includes sectional tests and a formula handbook.',
    category: 'cuet', exam: 'CUET UG', classLevel: 'Class 12', subjectArea: 'Mathematics', language: 'English',
    level: 'Intermediate', durationWeeks: 16, priceCents: 199900, mrpCents: 299900, teacherEmail: 'nisha.kulkarni@edupulse.demo',
    objectives: ['Cover the CUET Mathematics domain syllabus', 'Solve questions with exam-appropriate shortcuts', 'Practise timed sectional tests', 'Revise using a compact formula handbook'],
    targetAudience: 'Class 12 students targeting central universities through CUET UG',
    batchTimings: 'Mon, Wed, Fri · 5:30 PM – 7:00 PM IST', startDate: '2026-12-08', endDate: '2027-05-31', validityDays: 365, createdAtDaysAgo: 25,
    curriculum: [
      {
        subject: 'Mathematics',
        chapters: [
          { name: 'Algebra', lectures: ['Matrices and Determinants', 'Complex Numbers Basics'] },
          { name: 'Calculus', lectures: ['Derivatives and Applications', 'Definite Integrals'] },
          { name: 'Probability', lectures: ['Conditional Probability', "Bayes' Theorem Problems"] },
          { name: 'Coordinate Geometry', lectures: ['Straight Lines', 'Conic Sections Overview'] },
        ],
      },
    ],
  },
  {
    slug: 'cuet-english-general-free', title: 'CUET English & General Test (Free)',
    subtitle: 'Reading comprehension, language skills and General Test orientation',
    description:
      'A free CUET starter covering reading comprehension, sentence rearrangement, vocabulary and what the General Test actually expects. Includes a practice set after each class.',
    category: 'cuet', exam: 'CUET UG', classLevel: 'Class 12', subjectArea: 'English + General Test', language: 'English',
    level: 'Beginner', durationWeeks: 6, priceCents: 0, mrpCents: 0, teacherEmail: 'aditi.bose@edupulse.demo',
    objectives: ['Read passages with speed and accuracy', 'Solve rearrangement and vocabulary questions', 'Understand the CUET General Test structure'],
    targetAudience: 'Class 12 students beginning CUET preparation',
    batchTimings: 'Self-paced', startDate: '2026-11-20', endDate: '2027-02-28', validityDays: 365, createdAtDaysAgo: 14,
    curriculum: [
      {
        subject: 'English',
        chapters: [
          { name: 'Reading', lectures: ['Skimming and Scanning Techniques', 'Inference Questions'] },
          { name: 'Language', lectures: ['Sentence Rearrangement', 'Vocabulary in Context', 'CUET General Test Overview'] },
        ],
      },
    ],
  },
  {
    slug: 'class12-physics-board', title: 'Class 12 CBSE Physics Board Booster',
    subtitle: 'Derivations, numericals and previous-year questions for board excellence',
    description:
      'A board-focused Class 12 Physics course. Covers electrostatics, current electricity, optics and modern physics with derivations, marking-scheme tips and previous-year board questions.',
    category: 'school', exam: 'CBSE Class 12', classLevel: 'Class 12', subjectArea: 'Physics', language: 'English',
    level: 'Intermediate', durationWeeks: 20, priceCents: 249900, mrpCents: 399900, teacherEmail: 'teacher@edupulse.demo',
    objectives: ['Write board-perfect derivations', 'Solve numericals with correct units and steps', 'Practise previous-year board questions', 'Score full marks in objective sections'],
    targetAudience: 'CBSE Class 12 students preparing for board examinations',
    batchTimings: 'Mon–Fri · 4:00 PM – 5:00 PM IST', startDate: '2026-12-01', endDate: '2027-03-31', validityDays: 365, createdAtDaysAgo: 38,
    curriculum: [
      {
        subject: 'Physics',
        chapters: [
          { name: 'Electrostatics', lectures: ["Coulomb's Law and Field Lines", 'Capacitors and Dielectrics'] },
          { name: 'Current Electricity', lectures: ['Drift Velocity and Resistance', 'Wheatstone Bridge Problems'] },
          { name: 'Optics', lectures: ['Ray Optics: Mirrors and Lenses', 'Wave Optics: Interference'] },
          { name: 'Modern Physics', lectures: ['Photoelectric Effect', 'Atoms and Nuclei Recap'] },
        ],
      },
    ],
  },
  {
    slug: 'class10-science-free', title: 'Class 10 CBSE Science Full Syllabus (Free)',
    subtitle: 'Every chapter, every important question — completely free',
    description:
      'A free Class 10 Science course covering chemical reactions, life processes, light and electricity. Each class includes board-style questions and a one-page revision sheet.',
    category: 'school', exam: 'CBSE Class 10', classLevel: 'Class 10', subjectArea: 'Science', language: 'English',
    level: 'Beginner', durationWeeks: 16, priceCents: 0, mrpCents: 0, teacherEmail: 'sameer.khan@edupulse.demo',
    objectives: ['Understand core Class 10 Science concepts', 'Write balanced equations confidently', 'Solve light and electricity numericals', 'Revise with chapter-wise question banks'],
    targetAudience: 'CBSE Class 10 students',
    batchTimings: 'Self-paced', startDate: '2026-11-15', endDate: '2027-03-31', validityDays: 365, createdAtDaysAgo: 44,
    curriculum: [
      {
        subject: 'Science',
        chapters: [
          { name: 'Chemical Reactions', lectures: ['Balancing Equations', 'Types of Reactions'] },
          { name: 'Life Processes', lectures: ['Nutrition in Plants and Animals', 'Respiration and Transportation'] },
          { name: 'Light', lectures: ['Reflection and Refraction', 'Lens Formula Numericals'] },
          { name: 'Electricity', lectures: ["Ohm's Law and Circuits", 'Heating Effect of Current'] },
        ],
      },
    ],
  },
  {
    slug: 'foundation-maths-science', title: 'Foundation Class 8–10: Maths & Science',
    subtitle: 'Build the concepts that make Class 11 and competitive exams easier',
    description:
      'A foundational program for Classes 8–10 that strengthens algebra, geometry and core science concepts. Lessons use everyday examples before formal problem solving.',
    category: 'foundation', exam: 'Foundation', classLevel: 'Class 8–10', subjectArea: 'Maths + Science', language: 'English',
    level: 'Beginner', durationWeeks: 24, priceCents: 199900, mrpCents: 299900, teacherEmail: 'sameer.khan@edupulse.demo',
    objectives: ['Build algebraic fluency early', 'Understand geometry through reasoning', 'Connect science concepts to daily life', 'Prepare for Olympiads and future competitive exams'],
    targetAudience: 'Students in Classes 8–10 and parents planning early preparation',
    batchTimings: 'Sat–Sun · 10:00 AM – 11:30 AM IST', startDate: '2026-12-05', endDate: '2027-05-31', validityDays: 365, createdAtDaysAgo: 31,
    curriculum: [
      {
        subject: 'Mathematics',
        chapters: [
          { name: 'Algebra Basics', lectures: ['Linear Equations in One Variable', 'Polynomials and Identities'] },
          { name: 'Geometry', lectures: ['Triangles and Congruence', 'Circles: Basic Properties'] },
        ],
      },
      {
        subject: 'Science',
        chapters: [
          { name: 'Physics Foundations', lectures: ['Motion and Speed', 'Force and Pressure'] },
          { name: 'Chemistry Foundations', lectures: ['Atoms and Molecules', 'Acids, Bases and Salts'] },
        ],
      },
    ],
  },
  {
    slug: 'jee-physics-wave-optics-draft', title: 'JEE Main 2027: Wave Optics Deep Dive',
    subtitle: 'Draft course — build and submit for review in the educator dashboard',
    description:
      'An in-progress draft course demonstrating educator course creation. Add subjects, chapters, lectures and uploads from the teacher dashboard, then submit it for administrator review before publishing.',
    category: 'jee', exam: 'JEE Main', classLevel: 'Class 12', subjectArea: 'Physics', language: 'English',
    level: 'Intermediate', durationWeeks: 6, priceCents: 149900, mrpCents: 249900, teacherEmail: 'teacher@edupulse.demo',
    objectives: ['Understand interference and diffraction conceptually', 'Solve YDSE numericals accurately'],
    targetAudience: 'Class 12 JEE aspirants revising optics',
    batchTimings: 'Weekend batch · 5:00 PM – 6:30 PM IST', startDate: '2027-01-10', endDate: '2027-03-31', validityDays: 365, createdAtDaysAgo: 5,
    status: 'draft', curriculum: [],
  },
];

export const materials = [
  {
    title: 'JEE Physics Formula Sheet: Mechanics to Modern Physics',
    exam: 'JEE Main', category: 'Formula sheet', subject: 'Physics', chapterName: 'All chapters',
    description: 'A single-sheet revision companion covering dimensional analysis, mechanics, electromagnetism and modern physics formulas.',
    isPremium: false, courseSlug: 'jee-main-physics-2027',
    notes: [
      'Projectile range R = u² sin 2θ / g; maximum height H = u² sin²θ / 2g.',
      'For rolling without slipping, v = ωR and kinetic energy splits between translation and rotation.',
      'Kirchhoff loop rule: sum of potential changes around a closed loop is zero.',
      'Photoelectric equation: hν = φ + K_max, with stopping potential V₀ = K_max/e.',
    ],
  },
  {
    title: 'Kinematics: Graphs, Equations and Problem Templates',
    exam: 'JEE Main', category: 'Chapter notes', subject: 'Physics', chapterName: 'Kinematics',
    description: 'Chapter notes with worked examples on motion graphs, relative velocity and projectile problems.',
    isPremium: true, courseSlug: 'jee-main-physics-2027',
    notes: [
      'Slope of an x–t graph gives velocity; slope of a v–t graph gives acceleration.',
      'Area under a v–t graph is displacement; area under an a–t graph is change in velocity.',
      'Use v² = u² + 2as when time is not given, and s = ut + ½at² when acceleration is constant.',
      'Resolve projectile motion into independent horizontal and vertical motions.',
    ],
  },
  {
    title: 'JEE Mathematics: Calculus Revision Notes',
    exam: 'JEE Main', category: 'Revision notes', subject: 'Mathematics', chapterName: 'Calculus',
    description: 'Limits, differentiation and integration techniques condensed into a revision workflow.',
    isPremium: true, courseSlug: 'jee-advanced-mathematics',
    notes: [
      'L’Hôpital’s rule applies to 0/0 and ∞/∞ forms after checking differentiability.',
      'Chain rule: d/dx f(g(x)) = f′(g(x)) · g′(x).',
      'Integration by parts: ∫u dv = uv − ∫v du; choose u using the ILATE order.',
      'Definite integrals can be simplified using symmetry: ∫₀ᵃ f(x) dx = ∫₀ᵃ f(a − x) dx.',
    ],
  },
  {
    title: 'Organic Chemistry Reaction Map: Class 11 & 12',
    exam: 'JEE Main', category: 'Mind map', subject: 'Chemistry', chapterName: 'Organic Chemistry',
    description: 'A visual reaction map connecting substitution, elimination, addition and carbonyl reactions.',
    isPremium: true, courseSlug: 'neet-chemistry-organic-inorganic',
    notes: [
      'SN1 proceeds through a carbocation and is favoured by tertiary substrates and polar protic solvents.',
      'SN2 is a single-step backside attack favoured by primary substrates and polar aprotic solvents.',
      'Aldehydes are more reactive than ketones towards nucleophilic addition due to lower steric hindrance.',
      'Markovnikov addition places hydrogen on the carbon with more hydrogens; peroxide effect reverses it for HBr.',
    ],
  },
  {
    title: 'JEE Main 2025 Physics: Solved Previous-Year Paper',
    exam: 'JEE Main', category: 'Solved paper', subject: 'Physics', chapterName: 'Previous year',
    description: 'An original solved walkthrough of representative previous-year physics questions with approach notes.',
    isPremium: true, courseSlug: 'jee-main-mock-test-series',
    notes: [
      'Start with questions you can solve in under 90 seconds; return to multi-step problems later.',
      'In mechanics, draw the free-body diagram before writing any equation.',
      'For numerical questions, check units and order of magnitude to eliminate options.',
      'Record every silly mistake in a separate error log and revise it weekly.',
    ],
  },
  {
    title: 'NEET Biology NCERT Summary: Cell & Human Physiology',
    exam: 'NEET UG', category: 'NCERT summary', subject: 'Biology', chapterName: 'Cell and Physiology',
    description: 'Chapter summaries with exception lists and high-yield NCERT lines for quick revision.',
    isPremium: true, courseSlug: 'neet-biology-ncert-decoded',
    notes: [
      'Prokaryotes lack membrane-bound organelles; ribosomes are 70S with 50S and 30S subunits.',
      'Mitochondria and chloroplasts contain their own DNA and ribosomes.',
      'Enzymes in the small intestine act at alkaline pH; pepsin acts in an acidic medium.',
      'Human lungs have about 300 million alveoli providing a large surface area for gas exchange.',
    ],
  },
  {
    title: 'NEET Biology Mind Map: Genetics and Evolution',
    exam: 'NEET UG', category: 'Mind map', subject: 'Biology', chapterName: 'Genetics',
    description: 'One-page genetics map covering Mendelian ratios, linkage and molecular inheritance.',
    isPremium: true, courseSlug: 'neet-biology-ncert-decoded',
    notes: [
      'Monohybrid F2 phenotypic ratio is 3:1; dihybrid F2 ratio is 9:3:3:1.',
      'Test cross with a recessive parent reveals the genotype of a dominant phenotype.',
      'DNA replication is semi-conservative, demonstrated by the Meselson–Stahl experiment.',
      'The lac operon is negatively regulated and induced by lactose.',
    ],
  },
  {
    title: 'NEET Physics Numerical Practice: Mechanics',
    exam: 'NEET UG', category: 'Practice worksheet', subject: 'Physics', chapterName: 'Mechanics',
    description: 'A graded numerical worksheet with answers, focusing on NEET-level mechanics.',
    isPremium: false, courseSlug: 'neet-physics-concepts',
    notes: [
      'Use g = 10 m/s² unless the question specifies 9.8 m/s².',
      'For pulleys, write equations for each block and relate accelerations through the string constraint.',
      'Friction force is self-adjusting up to μN; check whether the applied force exceeds the limiting value.',
      'In circular motion, centripetal force is the net inward force, not an extra force.',
    ],
  },
  {
    title: 'NEET Chemistry: Equilibrium & Solutions Handbook',
    exam: 'NEET UG', category: 'Revision notes', subject: 'Chemistry', chapterName: 'Equilibrium',
    description: 'Equilibrium constants, Le Chatelier principles and colligative properties in one handbook.',
    isPremium: true, courseSlug: 'neet-chemistry-organic-inorganic',
    notes: [
      'For aA + bB ⇌ cC + dD, Kc = [C]^c[D]^d / [A]^a[B]^b.',
      'Increasing pressure shifts equilibrium towards the side with fewer gaseous moles.',
      'A catalyst changes both forward and backward rates equally and does not change K.',
      'Colligative properties depend on the number of particles, not their nature.',
    ],
  },
  {
    title: 'NEET UG 2025 Biology: Practice Question Set',
    exam: 'NEET UG', category: 'Important questions', subject: 'Biology', chapterName: 'Mixed',
    description: 'An original practice set built around frequently repeated NEET Biology themes.',
    isPremium: true, courseSlug: 'neet-biology-ncert-decoded',
    notes: [
      'Read the question stem twice; NEET often tests one-word exceptions.',
      'For assertion–reason questions, evaluate each statement independently before choosing.',
      'Revise diagrams: nephron, heart, neuron and chloroplast diagrams carry direct marks.',
      'Maintain a one-page exception list for each chapter.',
    ],
  },
  {
    title: 'UPSC Polity Notes: Constitutional Framework',
    exam: 'UPSC CSE', category: 'Chapter notes', subject: 'Polity', chapterName: 'Constitution',
    description: 'Structured polity notes covering the Constitution, rights, DPSP and amendments.',
    isPremium: true, courseSlug: 'upsc-prelims-gs-foundation',
    notes: [
      'The Preamble is not enforceable in court but guides constitutional interpretation.',
      'The basic structure doctrine emerged from the Kesavananda Bharati case (1973).',
      'Fundamental rights are justiciable; directive principles are not directly enforceable.',
      'Article 368 governs the amendment procedure, with special majorities for federal provisions.',
    ],
  },
  {
    title: 'UPSC Modern History Timeline (1857–1947)',
    exam: 'UPSC CSE', category: 'Revision notes', subject: 'History', chapterName: 'Modern India',
    description: 'A compact timeline linking movements, leaders and constitutional developments.',
    isPremium: true, courseSlug: 'upsc-mains-answer-writing',
    notes: [
      'The Revolt of 1857 led to the transfer of power from the Company to the Crown.',
      'The Indian National Congress was founded in 1885; the moderates dominated until the 1905 partition of Bengal.',
      'Gandhi’s mass movements: Non-Cooperation (1920), Civil Disobedience (1930), Quit India (1942).',
      'The Cabinet Mission Plan (1946) shaped the Constituent Assembly.',
    ],
  },
  {
    title: 'UPSC Geography: Monsoon and Drainage Systems',
    exam: 'UPSC CSE', category: 'Chapter notes', subject: 'Geography', chapterName: 'Physical Geography',
    description: 'Explain monsoon mechanisms and India’s major drainage systems with diagrams.',
    isPremium: false, courseSlug: 'upsc-prelims-gs-foundation',
    notes: [
      'The Indian monsoon is influenced by the ITCZ shift, jet streams and sea-surface temperatures.',
      'Himalayan rivers are perennial; peninsular rivers are largely rain-fed.',
      'The Ganga basin is India’s largest, followed by the Godavari.',
      'Western disturbances bring winter rain to north India.',
    ],
  },
  {
    title: 'UPSC Economy Basics: Fiscal and Monetary Policy',
    exam: 'UPSC CSE', category: 'Concept notes', subject: 'Economy', chapterName: 'Macroeconomics',
    description: 'A primer on fiscal policy, monetary tools and key economic indicators for Prelims.',
    isPremium: true, courseSlug: 'upsc-prelims-gs-foundation',
    notes: [
      'Fiscal policy is managed by the government; monetary policy by the RBI.',
      'Repo rate is the rate at which the RBI lends to banks; reverse repo absorbs liquidity.',
      'CRR and SLR alter the funds available for lending.',
      'Inflation targeting uses CPI as the nominal anchor.',
    ],
  },
  {
    title: 'UPSC Prelims 2025 GS Paper 1: Practice Set',
    exam: 'UPSC CSE', category: 'Sample paper', subject: 'General Studies', chapterName: 'Mixed',
    description: 'An original UPSC-style practice paper with elimination-based explanations.',
    isPremium: true, courseSlug: 'upsc-prelims-gs-foundation',
    notes: [
      'Attempt factual questions first, then statement-based questions in a second pass.',
      'Use elimination: one definitively wrong statement can eliminate multiple options.',
      'Do not attempt questions with more than two unknown entities unless options permit elimination.',
      'Limit guesswork to questions where two options are already eliminated.',
    ],
  },
  {
    title: 'SSC Quant Shortcuts: Percentages to Interest',
    exam: 'SSC CGL', category: 'Formula sheet', subject: 'Quantitative Aptitude', chapterName: 'Arithmetic',
    description: 'Speed techniques for the arithmetic topics that dominate SSC Tier 1.',
    isPremium: false, courseSlug: 'ssc-cgl-complete',
    notes: [
      'To increase then decrease by the same percentage, the net change is −(x²/100)%.',
      'Successive discounts of a% and b% equal a + b − ab/100.',
      'For compound interest, amount = P(1 + r/100)^n; for simple interest, SI = PRT/100.',
      'Ratio problems are easiest when one quantity is kept constant.',
    ],
  },
  {
    title: 'SSC English Grammar Rules and Error Spotting',
    exam: 'SSC CGL', category: 'Practice worksheet', subject: 'English', chapterName: 'Grammar',
    description: 'Twenty high-frequency grammar rules with error-spotting practice.',
    isPremium: false, courseSlug: 'ssc-chsl-booster',
    notes: [
      'The verb agrees with the subject, not with a phrase between the two.',
      'Use “since” for a point in time and “for” for a duration.',
      'Comparatives need than; do not use double comparatives.',
      'Collective nouns take a singular verb when acting as a unit.',
    ],
  },
  {
    title: 'SSC Reasoning: Puzzles and Seating Arrangements Workbook',
    exam: 'SSC CGL', category: 'Practice worksheet', subject: 'Reasoning', chapterName: 'Puzzles',
    description: 'A workbook of linear arrangement, floor puzzle and syllogism sets with solutions.',
    isPremium: true, courseSlug: 'ssc-cgl-complete',
    notes: [
      'Convert every clue into a notation before drawing the arrangement.',
      'In linear arrangements, “left” and “right” are relative to the direction the person faces.',
      'In syllogism, use Venn diagrams and test the conclusion in every possible arrangement.',
      'For floor puzzles, make a table with floor numbers and fixed attributes.',
    ],
  },
  {
    title: 'Banking Awareness Capsule: RBI and Digital Payments',
    exam: 'IBPS PO', category: 'Revision notes', subject: 'Banking Awareness', chapterName: 'Banking Basics',
    description: 'A concise capsule on RBI functions, banking terms and India’s payment systems.',
    isPremium: false, courseSlug: 'banking-awareness-free',
    notes: [
      'The RBI was established in 1935 and nationalised in 1949.',
      'UPI is operated by NPCI and enables instant bank-to-bank transfers.',
      'CRR is the share of deposits kept with the RBI; SLR is held in approved securities.',
      'Priority sector lending targets agriculture, MSMEs, education and weaker sections.',
    ],
  },
  {
    title: 'IBPS DI Practice Set: Tables, Caselets and Charts',
    exam: 'IBPS PO', category: 'Practice worksheet', subject: 'Quantitative Aptitude', chapterName: 'Data Interpretation',
    description: 'Eight data interpretation sets with solutions and calculation shortcuts.',
    isPremium: true, courseSlug: 'ibps-po-foundation',
    notes: [
      'Read the chart title and units before calculating.',
      'Approximate aggressively when options are far apart.',
      'Learn fraction-to-percentage conversions for faster comparisons.',
      'In caselets, extract data into a table before solving questions.',
    ],
  },
  {
    title: 'Banking English: Cloze Test and Comprehension Practice',
    exam: 'SBI Clerk', category: 'Practice worksheet', subject: 'English', chapterName: 'Comprehension',
    description: 'Passages and cloze tests modelled on recent banking exams.',
    isPremium: true, courseSlug: 'sbi-clerk-complete',
    notes: [
      'Read the passage once for structure before looking at the questions.',
      'For cloze tests, use context and collocations rather than isolated grammar.',
      'Eliminate options that change the tone of the passage.',
      'Look for paraphrases of passage lines in comprehension options.',
    ],
  },
  {
    title: 'GATE Algorithms: Complexity Cheat Sheet',
    exam: 'GATE CSE', category: 'Formula sheet', subject: 'Algorithms', chapterName: 'Complexity',
    description: 'Recurrences, sorting complexities and graph algorithm bounds in one place.',
    isPremium: true, courseSlug: 'gate-cs-algorithms',
    notes: [
      'Master theorem form: T(n) = aT(n/b) + f(n).',
      'Merge sort is Θ(n log n) in all cases; quicksort is Θ(n²) worst case.',
      'Dijkstra works for non-negative weights; Bellman–Ford handles negative edges.',
      'Heap operations cost O(log n); building a heap costs O(n).',
    ],
  },
  {
    title: 'GATE OS Notes: Process Scheduling and Deadlocks',
    exam: 'GATE CSE', category: 'Chapter notes', subject: 'Operating Systems', chapterName: 'Processes',
    description: 'Scheduling algorithms, deadlock conditions and Banker’s algorithm with solved examples.',
    isPremium: true, courseSlug: 'gate-cs-os-dbms',
    notes: [
      'Shortest Job First minimises average waiting time but can starve long jobs.',
      'Round robin performance depends heavily on the time quantum.',
      'Deadlock requires mutual exclusion, hold and wait, no preemption and circular wait.',
      'Banker’s algorithm checks safety by simulating resource allocation.',
    ],
  },
  {
    title: 'GATE DBMS: Normalisation from 1NF to BCNF',
    exam: 'GATE CSE', category: 'Chapter notes', subject: 'DBMS', chapterName: 'Normalisation',
    description: 'Functional dependencies, candidate keys and normal forms explained with examples.',
    isPremium: true, courseSlug: 'gate-cs-os-dbms',
    notes: [
      'A candidate key determines every attribute and is minimal.',
      '2NF removes partial dependencies; 3NF removes transitive dependencies.',
      'BCNF requires every determinant to be a superkey.',
      'Lossless decomposition preserves relationships and avoids redundancy.',
    ],
  },
  {
    title: 'GATE CSE 2025: Previous-Year Algorithms Questions',
    exam: 'GATE CSE', category: 'Solved paper', subject: 'Algorithms', chapterName: 'Previous year',
    description: 'Selected previous-year algorithm questions with complete solutions and exam tips.',
    isPremium: true, courseSlug: 'gate-cs-algorithms',
    notes: [
      'Read the exact complexity asked: worst case, best case or average case.',
      'For recurrence questions, expand a few terms before applying a formula.',
      'Draw the recursion tree to verify master theorem results.',
      'Eliminate options by substituting small values of n.',
    ],
  },
  {
    title: 'CUET Mathematics Formula Handbook',
    exam: 'CUET UG', category: 'Formula sheet', subject: 'Mathematics', chapterName: 'All chapters',
    description: 'Formula reference for algebra, calculus, probability and coordinate geometry.',
    isPremium: false, courseSlug: 'cuet-ug-mathematics',
    notes: [
      'Quadratic roots: sum = −b/a, product = c/a.',
      'Derivative of sin x is cos x; derivative of cos x is −sin x.',
      'Probability of A or B: P(A∪B) = P(A) + P(B) − P(A∩B).',
      'Distance of a point from a line uses the perpendicular distance formula.',
    ],
  },
  {
    title: 'CUET English Reading Comprehension Practice',
    exam: 'CUET UG', category: 'Practice worksheet', subject: 'English', chapterName: 'Reading',
    description: 'Five passages with inference, tone and vocabulary questions.',
    isPremium: true, courseSlug: 'cuet-english-general-free',
    notes: [
      'Identify the main idea before answering detail questions.',
      'Tone questions require attention to adjectives and qualifiers.',
      'Eliminate options that are true but not stated in the passage.',
      'Practise reading 600-word passages in under four minutes.',
    ],
  },
  {
    title: 'Class 12 Physics: Important Derivations',
    exam: 'CBSE Class 12', category: 'Important questions', subject: 'Physics', chapterName: 'All chapters',
    description: 'Board-focused derivations with marking-scheme steps for full marks.',
    isPremium: true, courseSlug: 'class12-physics-board',
    notes: [
      'Write the formula, define symbols and show each algebraic step.',
      'State the assumptions before deriving capacitor or lens formulas.',
      'Draw labelled diagrams for every optics derivation.',
      'Finish with the final expression and its physical meaning.',
    ],
  },
  {
    title: 'Class 10 Science Important Questions',
    exam: 'CBSE Class 10', category: 'Important questions', subject: 'Science', chapterName: 'All chapters',
    description: 'Chapter-wise board-style questions covering chemical reactions, life processes, light and electricity.',
    isPremium: false, courseSlug: 'class10-science-free',
    notes: [
      'Balance chemical equations and include state symbols where required.',
      'Draw ray diagrams with arrows and label principal focus and centre of curvature.',
      'For electricity numericals, write the formula before substituting values.',
      'Explain life processes with labelled diagrams where possible.',
    ],
  },
  {
    title: 'Class 12 Chemistry Named Reactions',
    exam: 'CBSE Class 12', category: 'Revision notes', subject: 'Chemistry', chapterName: 'Organic Chemistry',
    description: 'Named reactions with reagents, conditions and products for board revision.',
    isPremium: true, courseSlug: 'class12-physics-board',
    notes: [
      'Cannizzaro reaction requires a strong base and no alpha hydrogen.',
      'Hoffmann bromamide degradation converts amides to amines with one fewer carbon.',
      'Aldol condensation needs an alpha hydrogen and a base.',
      'Sandmeyer reaction replaces diazonium groups with halides using copper salts.',
    ],
  },
  {
    title: 'Foundation Maths Worksheet: Algebra and Geometry',
    exam: 'Foundation', category: 'Practice worksheet', subject: 'Mathematics', chapterName: 'Algebra & Geometry',
    description: 'A graded worksheet for Classes 8–10 with hints and full solutions.',
    isPremium: false, courseSlug: 'foundation-maths-science',
    notes: [
      'Use the distributive property to expand expressions before simplifying.',
      'The sum of angles in a triangle is 180°.',
      'Congruence criteria: SSS, SAS, ASA, AAS and RHS.',
      'The perpendicular from the centre bisects a chord.',
    ],
  },
  {
    title: 'Foundation Science Notes: Motion, Force and Matter',
    exam: 'Foundation', category: 'Chapter notes', subject: 'Science', chapterName: 'Physics & Chemistry',
    description: 'Simple explanations of motion, force, atoms and acids with everyday examples.',
    isPremium: true, courseSlug: 'foundation-maths-science',
    notes: [
      'Speed = distance / time; velocity includes direction.',
      'Force is a push or pull that can change the state of motion.',
      'Atoms combine in fixed ratios to form compounds.',
      'Acids turn blue litmus red; bases turn red litmus blue.',
    ],
  },
  {
    title: 'NEET Physics: Oscillations and Waves Quick Revision',
    exam: 'NEET UG', category: 'Revision notes', subject: 'Physics', chapterName: 'Oscillations',
    description: 'Short notes on SHM, wave equations and sound, tuned to NEET question patterns.',
    isPremium: false, courseSlug: 'neet-physics-concepts',
    notes: [
      'For SHM, acceleration is proportional to displacement and directed towards the mean position.',
      'Time period of a simple pendulum is independent of mass.',
      'Wave speed v = fλ; sound speed depends on the medium and temperature.',
      'In stationary waves, nodes have zero displacement and antinodes have maximum displacement.',
    ],
  },
  {
    title: 'SSC GK Capsule: Polity, Geography and Economy',
    exam: 'SSC CGL', category: 'Revision notes', subject: 'General Awareness', chapterName: 'Mixed',
    description: 'A compact GK revision capsule for SSC Tier 1.',
    isPremium: true, courseSlug: 'ssc-cgl-mock-series',
    notes: [
      'The President is the head of state; the Prime Minister heads the government.',
      'The Tropic of Cancer passes through eight Indian states.',
      'GDP measures the value of final goods and services produced domestically.',
      'The Finance Commission recommends devolution of taxes between the Union and states.',
    ],
  },
];

export const faqs = [
  { question: 'How do I enroll in a course?', answer: 'Create a student account, open any free course and select Enroll now. Paid courses require a payment gateway, which is not configured on this deployment yet, so paid checkout shows a clear setup notice instead of a fake success screen.' },
  { question: 'Are the live classes included in my course?', answer: 'Yes. Live classes scheduled for your enrolled courses appear in Live Classes and on your dashboard. Joining in-app requires the platform to have LiveKit credentials configured; otherwise the class page tells you the exact status.' },
  { question: 'How is my test score calculated?', answer: 'Each test uses its own marking scheme. Correct answers add marks, wrong answers apply negative marking, and unattempted questions score zero. Your percentage, accuracy, rank and percentile are computed from real attempts on the platform.' },
  { question: 'Can I retake a test?', answer: 'You can attempt a test again from its instructions page. Every attempt is stored separately, and in-progress attempts can be resumed until the timer ends.' },
  { question: 'Where can I download study materials?', answer: 'Open Study Materials from the top navigation. Free resources can be previewed and downloaded after signing in. Premium resources unlock automatically when you are enrolled in the linked course.' },
  { question: 'What happens if my internet disconnects during a test?', answer: 'Attempt answers are saved automatically and can be resumed until the test timer expires. The server enforces the timer, so refreshing the page does not reset it.' },
  { question: 'Can I become an educator on EduPulse?', answer: 'Yes. Register as an educator, complete your profile and wait for an administrator to approve your account. Approved educators can create courses, schedule live classes, upload lectures and publish tests.' },
  { question: 'How do I reset my password?', answer: 'Use the Forgot password link on the login page. If email delivery is not configured on this deployment, the page tells you to contact an administrator, who can reset the password securely from the admin panel.' },
  { question: 'Is my payment information secure?', answer: 'EduPulse never stores card details. Payments, when enabled, are processed by a PCI-compliant gateway and verified on the server before enrollment is activated. This project does not activate paid access from a frontend success message.' },
  { question: 'Are the demo accounts available in production?', answer: 'No. The demo accounts are created by the development seed script only and must never be used as production accounts. Change every seeded password before any public deployment.' },
];

export const banners = [
  { title: 'JEE Main 2027 batches are open', subtitle: 'Complete Physics with 500+ solved problems and weekly mock analysis.', ctaLabel: 'Explore JEE courses', ctaLink: '/courses?exam=JEE%20Main', theme: 'orange', position: 1 },
  { title: 'Free NEET dropper starter', subtitle: 'A three-class roadmap to plan ten months of preparation.', ctaLabel: 'Start free', ctaLink: '/courses?price=free', theme: 'emerald', position: 2 },
  { title: 'SSC CGL mock series', subtitle: 'Practise Tier 1 patterns with real analytics and rankings.', ctaLabel: 'View test series', ctaLink: '/tests?exam=SSC%20CGL', theme: 'rose', position: 3 },
];

export const reviewSeeds = [
  { courseSlug: 'jee-main-physics-2027', rating: 5, body: 'Dr. Sethi changed how I approach physics problems. The free-body diagram method and mock analysis helped me move from 40 to 68 marks in Physics in three months.' },
  { courseSlug: 'jee-main-physics-2027', rating: 5, body: 'Every lecture ends with a checkpoint quiz, which is exactly what I needed. The revision sheets are compact enough to finish the night before a test.' },
  { courseSlug: 'jee-main-physics-2027', rating: 4, body: 'Excellent problem selection. I would like even more advanced-level questions in rotational motion, but the explanations are very clear.' },
  { courseSlug: 'jee-main-physics-2027', rating: 5, body: 'I joined for rotational motion and stayed for the mock strategy lectures. My time management in Physics improved immediately.' },
  { courseSlug: 'jee-advanced-mathematics', rating: 5, body: 'The problem ladders are the best part. Each question builds on the previous one, so advanced calculus finally feels logical instead of magical.' },
  { courseSlug: 'jee-advanced-mathematics', rating: 4, body: 'Rohit sir explains the “why” behind every shortcut. The coordinate geometry module is especially strong.' },
  { courseSlug: 'jee-chemistry-foundations-free', rating: 5, body: 'I started JEE Chemistry from zero and this free course made the mole concept genuinely understandable. The stopping-reagent drills are gold.' },
  { courseSlug: 'jee-chemistry-foundations-free', rating: 4, body: 'Great value for a free course. The bonding lectures are clear, though I wish there were more practice questions after hybridisation.' },
  { courseSlug: 'jee-main-mock-test-series', rating: 5, body: 'The mock analytics are detailed and honest. Seeing my chapter-wise weaknesses after each test made my revision plan much more focused.' },
  { courseSlug: 'neet-biology-ncert-decoded', rating: 5, body: 'Anjali ma’am’s memory maps are the reason I remember exceptions now. I revised the entire Class 12 Biology syllabus in two weeks using her notes.' },
  { courseSlug: 'neet-biology-ncert-decoded', rating: 5, body: 'This course respects NEET students’ time. No unnecessary depth, just NCERT lines, diagrams and high-yield questions with clear explanations.' },
  { courseSlug: 'neet-biology-ncert-decoded', rating: 4, body: 'Very good structure. I would appreciate a few more full-length biology section tests, but the chapter quizzes are useful.' },
  { courseSlug: 'neet-physics-concepts', rating: 5, body: 'NEET physics finally feels manageable. The lectures stay at the right difficulty instead of chasing JEE Advanced questions.' },
  { courseSlug: 'neet-physics-concepts', rating: 4, body: 'The thermodynamics sign convention lecture saved me from repeated mistakes. Good pace and plenty of numericals.' },
  { courseSlug: 'neet-chemistry-organic-inorganic', rating: 5, body: 'Sneha ma’am turns mechanisms into stories. I no longer memorise reactions blindly, and my organic accuracy has improved a lot.' },
  { courseSlug: 'neet-chemistry-organic-inorganic', rating: 4, body: 'The inorganic revision tables are excellent. The course could use a few more NCERT-based assertion questions.' },
  { courseSlug: 'neet-dropper-starter-free', rating: 5, body: 'I took a drop year and was overwhelmed. The three lectures gave me a realistic plan, and I have followed the weekly revision framework since then.' },
  { courseSlug: 'upsc-prelims-gs-foundation', rating: 5, body: 'Arjun sir connects static polity with current affairs in a way that makes revision natural. The elimination techniques are practical, not generic advice.' },
  { courseSlug: 'upsc-prelims-gs-foundation', rating: 4, body: 'Strong content and pace. History lectures are detailed; the geography diagrams are especially useful for revision.' },
  { courseSlug: 'upsc-mains-answer-writing', rating: 5, body: 'Kavita ma’am’s answer frameworks changed my mains preparation. Writing a structured answer in eight minutes is now possible for me.' },
  { courseSlug: 'upsc-mains-answer-writing', rating: 4, body: 'The ethics case studies are excellent. I would like more examples for GS Paper 3, but the overall guidance is very practical.' },
  { courseSlug: 'indian-polity-free', rating: 5, body: 'A free polity course that is genuinely better than many paid ones. The fundamentals, DPSP and amendment lectures are crisp and exam-focused.' },
  { courseSlug: 'ssc-cgl-complete', rating: 5, body: 'Manish sir’s shortcuts are practical and not gimmicky. My quant speed improved from 45 seconds per question to under 30.' },
  { courseSlug: 'ssc-cgl-complete', rating: 4, body: 'Good coverage of Tier 1 topics. The geometry lectures helped me fix silly mistakes in circles and triangles.' },
  { courseSlug: 'ssc-chsl-booster', rating: 4, body: 'The 10-week plan is realistic for working students. The grammar drill sessions are short but effective.' },
  { courseSlug: 'ibps-po-foundation', rating: 5, body: 'Pooja ma’am’s puzzle method is systematic. I used to skip puzzles; now they are my strongest section in mock tests.' },
  { courseSlug: 'ibps-po-foundation', rating: 4, body: 'Very solid foundation course. The DI caselets are challenging, and the weekly tests keep me accountable.' },
  { courseSlug: 'sbi-clerk-complete', rating: 4, body: 'The arithmetic shortcuts are useful and the English lectures are exam-oriented. Overall a good value course.' },
  { courseSlug: 'banking-awareness-free', rating: 5, body: 'Short, sharp and free. I revised banking awareness in one evening before my exam and it covered most of the expected topics.' },
  { courseSlug: 'gate-cs-algorithms', rating: 5, body: 'Rakesh sir’s proof-based approach made algorithms click. The DP lectures are the best I have seen for GATE preparation.' },
  { courseSlug: 'gate-cs-algorithms', rating: 5, body: 'Every lecture ends with previous-year GATE questions. That pattern made revision far more efficient for me.' },
  { courseSlug: 'gate-cs-os-dbms', rating: 4, body: 'The OS scheduling examples are excellent. DBMS normalisation is explained with enough examples to internalise the rules.' },
  { courseSlug: 'cuet-ug-mathematics', rating: 4, body: 'Nisha ma’am keeps CUET students in mind and avoids unnecessary JEE-level depth. The sectional tests are useful.' },
  { courseSlug: 'cuet-english-general-free', rating: 5, body: 'I had no idea what the CUET General Test expected. This free course gave me a clear starting point and the practice passages are good.' },
  { courseSlug: 'class12-physics-board', rating: 5, body: 'The derivation lectures follow the marking scheme exactly. I wrote my board exam with much more confidence this year.' },
  { courseSlug: 'class12-physics-board', rating: 4, body: 'Very helpful for last-minute revision. The optics numericals are explained step by step.' },
  { courseSlug: 'class10-science-free', rating: 5, body: 'My daughter used this free course for her Class 10 boards. The revision sheets and ray diagrams were extremely helpful.' },
  { courseSlug: 'class10-science-free', rating: 5, body: 'Clear explanations without any unnecessary jargon. The electricity numericals finally make sense to me.' },
  { courseSlug: 'foundation-maths-science', rating: 4, body: 'Good foundational course for younger students. The everyday examples keep my son interested in science.' },
  { courseSlug: 'foundation-maths-science', rating: 5, body: 'We joined to prepare for Olympiads. The geometry reasoning lectures are excellent for building intuition early.' },
];

export const studentNames = [
  'Aarav Sharma', 'Vivaan Patel', 'Aditya Singh', 'Ishaan Gupta', 'Kabir Malhotra',
  'Ananya Verma', 'Diya Nair', 'Myra Joshi', 'Saanvi Reddy', 'Aadhya Iyer',
  'Reyansh Kapoor', 'Krishna Rao', 'Arnav Mehta', 'Dhruv Chawla', 'Ayaan Khan',
  'Pari Desai', 'Riya Bansal', 'Aisha Siddiqui', 'Navya Kulkarni', 'Tara Menon',
  'Vihaan Agarwal', 'Siddharth Sinha', 'Yash Thakur', 'Nikhil Saxena', 'Rohan Pillai',
  'Ira Bhatt', 'Meera Shetty', 'Kavya Ghosh', 'Naina Chauhan', 'Sara Fernandes',
  'Advait Kulkarni', 'Rudra Pandey', 'Devansh Mishra', 'Aryan Das', 'Kian Shah',
  'Anika Bajaj', 'Mira Soni', 'Trisha Rao', 'Shreya Mishra', 'Ritika Jain',
  'Om Prakash', 'Harsh Vardhan', 'Aakash Yadav', 'Vikrant Rana', 'Sahil Arora',
  'Neha Srinivasan', 'Pooja Naidu', 'Priya Ramachandran', 'Sneha Dutta', 'Ritu Ahuja',
  'Mohit Bhardwaj', 'Rahul Nigam', 'Sourav Ghoshal', 'Abhishek Paul', 'Deepak Rawat',
  'Shalini Gupta', 'Anjali Menon', 'Swati Bhandari', 'Payal Chopra', 'Divya Prakash',
  'Tanmay Bose', 'Adarsh Kini', 'Kunal Jha', 'Raghav Sood', 'Aarush Tiwari',
  'Ishita Banerjee', 'Sanya Sethi', 'Mahima Shah', 'Kritika Rathi', 'Anushka Goel',
  'Vedant Kale', 'Rachit Sarin', 'Pratham Lodha', 'Manav Dhillon', 'Aman Gill',
  'Simran Kaur', 'Gurpreet Sandhu', 'Hiba Ansari', 'Zoya Mirza', 'Nandini Purohit',
];

export const dailyTips = [
  'Revise one formula sheet every morning for 10 minutes.',
  'Attempt one timed sectional test before lunch.',
  'Log every silly mistake in an error notebook.',
  'Explain one concept aloud to test your understanding.',
];
