# Smart Classroom and Timetable Scheduler - Project Summary

## Overview

This project implements a comprehensive **Smart Classroom and Timetable Scheduler (SCTS)** system that automates academic timetable generation using hybrid Genetic Algorithm (GA) and Constraint Satisfaction Programming (CSP) optimization techniques.

## Key Features Implemented

### 1. Backend (Node.js/Express.js/MongoDB)
- ✅ **Authentication System**: JWT-based authentication with role-based access control (Admin, Faculty, Student)
- ✅ **Database Models**: Complete MongoDB schemas for Users, Faculty, Classrooms, Subjects, Timeslots, and Timetables
- ✅ **RESTful API**: Comprehensive API routes for all entities
- ✅ **Optimization Engine**: Hybrid GA-CSP algorithm for timetable generation
- ✅ **Classroom Allocation**: Intelligent room assignment based on capacity, equipment, and type
- ✅ **Constraint Satisfaction**: Hard constraint checking and violation repair

### 2. Frontend (React.js/Material-UI)
- ✅ **Role-Based Dashboards**: Separate interfaces for Admin, Faculty, and Students
- ✅ **Authentication**: Login system with protected routes
- ✅ **Timetable Generation**: Admin interface for generating optimized timetables
- ✅ **Timetable Viewing**: Display generated timetables with metrics
- ✅ **Responsive Design**: Material-UI components for modern UI/UX

### 3. Core Algorithms

#### Genetic Algorithm Component
- Population initialization
- Fitness evaluation (multi-objective: utilization, balance, preferences)
- Selection (tournament selection)
- Crossover (two-point crossover)
- Mutation (swap, random reassignment, shift)
- Convergence detection

#### Constraint Satisfaction Component
- Hard constraint checking:
  - No faculty double-booking
  - No classroom double-booking
  - Capacity constraints
  - Faculty availability
  - Room type requirements
- Violation repair algorithms

#### Classroom Allocation
- Multi-factor preference scoring
- Capacity matching
- Equipment requirements
- Accessibility needs
- Greedy assignment with backtracking

## Project Structure

```
SCTS/
├── backend/
│   ├── algorithms/
│   │   ├── optimizationEngine.js      # Main GA-CSP hybrid engine
│   │   ├── constraintSatisfaction.js  # CSP constraint checking
│   │   └── classroomAllocation.js     # Smart room allocation
│   ├── models/                        # MongoDB schemas
│   ├── routes/                         # API endpoints
│   ├── middleware/                     # Auth middleware
│   ├── config/                         # Configuration
│   └── server.js                       # Express server
├── frontend/
│   ├── src/
│   │   ├── pages/                      # React pages
│   │   ├── components/                 # Reusable components
│   │   ├── context/                    # React context (Auth)
│   │   └── App.js                      # Main app component
│   └── public/
└── package.json
```

## Performance Metrics

The system is designed to achieve:
- **75% time reduction**: 3-5 days vs 12-15 days manual scheduling
- **95% classroom utilization**: Up from typical 40%
- **99% conflict-free**: Guaranteed through CSP enforcement
- **40% fewer staff**: 3 vs 5-8 people required

## Technology Stack

### Backend
- Node.js 14+
- Express.js 4.18+
- MongoDB 4.4+
- JWT Authentication
- bcryptjs for password hashing

### Frontend
- React 18.2+
- Material-UI 5.14+
- React Router 6.16+
- Axios for API calls

## Installation & Setup

See `INSTALLATION.md` for detailed setup instructions.

Quick start:
```bash
npm run install:all
# Configure .env file
npm run dev:all
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/stats` - System statistics
- `POST /api/admin/generate-timetable` - Generate optimized timetable

### Entities
- Faculty: `/api/faculty`
- Classroom: `/api/classroom`
- Subject: `/api/subject`
- Timeslot: `/api/timeslot`
- Timetable: `/api/timetable`

## Usage Workflow

1. **Admin Setup**:
   - Login as admin
   - Add faculty members with availability
   - Add classrooms with capacities and equipment
   - Add subjects with requirements
   - Create timeslots

2. **Timetable Generation**:
   - Navigate to Generate Timetable
   - Select academic year, semester, department
   - Configure GA parameters (optional)
   - Generate timetable
   - Review metrics and conflicts
   - Approve and publish

3. **Faculty**:
   - Update availability
   - View assigned schedule
   - Request leaves

4. **Students**:
   - View published timetables
   - Filter by program/semester

## Future Enhancements

- [ ] Multi-campus coordination
- [ ] Dynamic rescheduling for emergencies
- [ ] Machine learning demand forecasting
- [ ] IoT smart classroom integration
- [ ] Mobile application
- [ ] Exam scheduling module
- [ ] Advanced visualization (Gantt charts, heatmaps)
- [ ] Export to calendar formats (iCal, Google Calendar)

## Testing

To test the system:
1. Create admin user (via seed script or API)
2. Add sample data (faculty, classrooms, subjects)
3. Generate a test timetable
4. Verify constraints are satisfied
5. Check utilization metrics

## License

MIT License

## Author

Rahul Kumar - Lovely Professional University, Punjab, India

## References

See the review paper and patent application documents for detailed literature review and technical specifications.




