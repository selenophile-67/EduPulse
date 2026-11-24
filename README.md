# 🎓 EduPulse – Your Complete Learning Ecosystem

**EduPulse** is a full-stack online learning platform designed to make quality education accessible, interactive, and personalized. Inspired by modern EdTech platforms, EduPulse brings together students, educators, and administrators in one unified digital learning ecosystem.

The platform supports students preparing for competitive and academic examinations such as JEE, NEET, UPSC, SSC, Banking, GATE, CUET, CBSE, and Foundation courses.

With interactive dashboards, structured courses, recorded lectures, online examinations, study materials, live-class scheduling, and AI-powered learning assistance, EduPulse aims to simplify the entire learning journey.

---

## ✨ Key Features

### 👨‍🎓 1. Student Dashboard
- Personalized student dashboard.
- View enrolled courses and learning progress.
- Track completed and pending lectures.
- Monitor examination performance.
- Access upcoming classes and schedules.
- Manage bookmarks and notifications.
- View academic performance analytics.

### 📚 2. Course Management
- Browse courses across multiple examination categories.
- Explore detailed course descriptions.
- View educators and course information.
- Access structured subjects and chapters.
- Manage course enrollments.
- Track learning progress.

### 🎥 3. Recorded Video Lectures
- Organized video lecture system.
- Course-wise and chapter-wise navigation.
- Resume lectures from previously saved positions.
- Track lecture completion.
- Access protected course content.
- Navigate through the course curriculum.

### 📝 4. Online Test Series
- Interactive online examination interface.
- Multiple-choice questions.
- Countdown timer.
- Question navigation panel.
- Save and review answers.
- Automatic answer submission when time expires.
- Negative marking support.
- Instant result generation.
- Detailed answer solutions.
- Subject-wise performance analysis.

### 📖 5. Study Materials
- Digital educational resource library.
- PDF study materials.
- Chapter-wise learning resources.
- Document preview and download.
- Download tracking.
- Bookmark important materials.
- Enrollment-based access to premium resources.

### 📅 6. Live Classes
- Scheduled live-class management.
- Upcoming and completed class listings.
- Educator information.
- Class attendance tracking.
- Live-session status management.
- Integration-ready live streaming infrastructure.

### 🤖 7. AI Learning Assistant
- Dedicated AI Tutor interface.
- AI integration configuration.
- Environment-based LLM settings.
- Foundation for personalized learning assistance.

*Note: Actual AI-generated responses require an external LLM API configuration.*

### 👨‍🏫 8. Teacher Dashboard
- Dedicated educator dashboard.
- Manage assigned courses.
- Organize course content.
- Manage lectures and study materials.
- Create and manage tests.
- Monitor enrolled students.
- Manage scheduled classes.
- Track teaching activities.

### 🛠️ 9. Admin Dashboard
- Centralized administration panel.
- Monitor platform activity.
- Manage students and educators.
- Approve educator accounts.
- Create and manage courses.
- Manage class sessions.
- Monitor platform integrations.
- Review user messages.
- Manage platform operations.

### 🔐 10. Authentication & Security
- Secure user registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Database-backed session management.
- Session revocation.
- Role-based access control.
- CSRF origin protection.
- API rate limiting.
- Protected application routes.

### 📊 11. Performance Analytics
- Student performance tracking.
- Test score analysis.
- Subject-wise performance breakdown.
- Chapter-wise performance insights.
- Learning progress monitoring.
- Data-driven dashboard statistics.

### 🎨 12. Modern User Interface
- Clean and modern EdTech interface.
- Responsive layouts.
- Light and dark themes.
- Reusable UI components.
- Interactive dashboard elements.
- Smooth navigation.
- Modern icons and visual elements.

---

## 🖥️ Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 19, TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| Data Fetching | TanStack Query |
| Icons | Lucide React |
| Backend | Node.js, Express.js |
| Database | SQLite |
| Database Runtime | Node.js `node:sqlite` |
| Authentication | JWT, bcryptjs |
| Validation | Zod |
| File Uploads | Multer |
| API Documentation | Swagger / OpenAPI |
| Testing | Node.js Test Runner, Supertest |

---

## 📂 Project Structure

```text
EduPulse/
│
├── client/
│   ├── public/
│   │
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── layout/
│       │   ├── cards.tsx
│       │   ├── charts.tsx
│       │   ├── ui.tsx
│       │   └── ProtectedRoute.tsx
│       │
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   ├── ThemeContext.tsx
│       │   └── ToastContext.tsx
│       │
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       │   ├── admin/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── player/
│       │   ├── teacher/
│       │   ├── tests/
│       │   ├── Home.tsx
│       │   ├── Courses.tsx
│       │   ├── LiveClasses.tsx
│       │   ├── Materials.tsx
│       │   └── Results.tsx
│       │
│       ├── App.tsx
│       ├── main.tsx
│       └── index.css
│
├── server/
│   ├── config/
│   │   ├── db.js
│   │   ├── env.js
│   │   └── schema.sql
│   │
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── seed/
│   ├── test/
│   ├── uploads/
│   └── server.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

---

## ⚙️ Installation & Setup

Follow these steps to run EduPulse locally.

### Prerequisites

Make sure you have installed:

- Node.js 22.5 or later.
- npm (Node Package Manager).
- Git.
- A code editor such as Visual Studio Code.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/EduPulse.git
```

### 2. Navigate to the Project Directory

```bash
cd EduPulse
```

### 3. Install Dependencies

```bash
npm install
```

This installs dependencies for both the frontend and backend workspaces.

### 4. Configure Environment Variables

Create a `.env` file in the root directory or inside the `server/` directory.

You can use the provided `.env.example` as a reference.

```env
PORT=4100
CLIENT_ORIGIN=http://localhost:5173

JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=7d

DB_PATH=data/edupulse.db
```

Additional integrations can be configured using the environment variables described in `.env.example`.

**Important:** Never upload your actual `.env` file, passwords, API keys, or secret credentials to GitHub.

### 5. Initialize the Database

Run the following command:

```bash
npm run seed
```

This initializes the SQLite database and populates it with development sample data.

### 6. Start the Development Server

```bash
npm run dev
```

The application starts with two development servers:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4100 |
| API Documentation | http://localhost:4100/api/docs |

Open the frontend URL in your browser to explore EduPulse.

---

## 🔑 Demo Login Credentials

Use the following development accounts to explore different dashboards.

| Role | Email | Password |
|---|---|---|
| Student | student@edupulse.demo | Student@123 |
| Teacher | teacher@edupulse.demo | Teacher@123 |
| Admin | admin@edupulse.demo | Admin@123 |

**Additional Teacher Account:**

| Role | Email | Password |
|---|---|---|
| Pending Teacher | karan.bhatt@edupulse.demo | Teacher@123 |

These accounts are created through the database seed script and are intended strictly for local development and testing.

Do not use these credentials in production.

---

## 🔌 Available Scripts

Run these commands from the project root directory.

| Command | Description |
|---|---|
| `npm install` | Install project dependencies |
| `npm run dev` | Start frontend and backend |
| `npm run seed` | Initialize and populate the database |
| `npm run build` | Build the frontend for production |
| `npm start` | Start the production server |
| `npm test` | Run backend API tests |

---

## 🔗 API Documentation

EduPulse provides RESTful APIs for communication between the frontend and backend.

API documentation is available through Swagger UI:

```text
http://localhost:4100/api/docs
```

OpenAPI specification:

```text
http://localhost:4100/api/openapi.json
```

### Main API Modules

```text
/api/auth
/api/users
/api/students
/api/teachers
/api/courses
/api/batches
/api/enrollments
/api/lectures
/api/live-classes
/api/materials
/api/tests
/api/questions
/api/results
/api/assignments
/api/submissions
/api/doubts
/api/payments
/api/notifications
/api/admin
```

---

## 🧪 Testing

EduPulse includes an automated backend API test suite.

Execute:

```bash
npm test
```

The tests cover:

- Health and integration status.
- User authentication.
- Session management.
- Role-based authorization.
- CSRF protection.
- Course enrollment.
- Payment access restrictions.
- Examination lifecycle.
- Automatic answer submission.
- Negative marking and result generation.
- Educator approval.
- Course publishing restrictions.

---

## 🔒 Integration Status

Some advanced capabilities require external service credentials.

| Feature | Current Status |
|---|---|
| Authentication | Implemented |
| Course Management | Implemented |
| Student Dashboard | Implemented |
| Teacher Dashboard | Implemented |
| Admin Dashboard | Implemented |
| Recorded Lectures | Implemented |
| Study Materials | Implemented |
| Test Engine | Implemented |
| Performance Analytics | Implemented |
| Live Streaming | Requires LiveKit configuration and implementation |
| Online Payments | Requires Razorpay configuration and implementation |
| AI Tutor Responses | Requires LLM API configuration and implementation |
| Email Delivery | Requires SMTP configuration |
| Cloud Storage | Optional; local disk storage is the default |

The application intentionally reports unavailable integrations rather than displaying fake successful operations.

---

## 🚀 Future Enhancements

The following features represent potential future improvements:

- [ ] Fully integrated live video streaming.
- [ ] Razorpay-powered course purchases.
- [ ] AI-powered doubt-solving assistant.
- [ ] Personalized AI study planner.
- [ ] AI-generated practice questions.
- [ ] Advanced student performance analytics.
- [ ] Gamification and achievement badges.
- [ ] Student discussion community.
- [ ] Parent / Guardian dashboard.
- [ ] Mobile application.
- [ ] Push notifications.
- [ ] Offline learning support.
- [ ] Advanced recommendation engine.

---

## 🎯 Project Objective

The primary objective of EduPulse is to create a unified digital learning environment that combines academic resources, interactive learning, examination preparation, and personalized student progress tracking.

By bringing students and educators together on one platform, EduPulse aims to make learning more accessible, organized, and engaging.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome!

If you would like to contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your changes.
5. Push your branch.
6. Open a Pull Request.

---

## 📄 License

No license has been specified yet. Please add an appropriate LICENSE file before permitting reuse or redistribution of this project.

---

## ⭐ Support

If you find EduPulse interesting or useful, consider giving the repository a ⭐ on GitHub.

Your support and feedback are appreciated!

**EduPulse – Learn Smarter. Grow Faster. Achieve More.** 🎓
