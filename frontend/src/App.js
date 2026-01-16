import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardLayout from './components/Layout/DashboardLayout';
import theme from './theme/theme';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Timetables from './pages/Timetables';
import GenerateTimetable from './pages/GenerateTimetable';
import FacultyAvailability from './pages/FacultyAvailability';
import FacultyTimetable from './pages/FacultyTimetable';
import ViewTimetable from './pages/ViewTimetable';
// Admin Management Pages
import ManageFaculty from './pages/admin/ManageFaculty';
import ManageStudents from './pages/admin/ManageStudents';
import ManageClassrooms from './pages/admin/ManageClassrooms';
import ManageSubjects from './pages/admin/ManageSubjects';
import ManageTimeslots from './pages/admin/ManageTimeslots';
import ManageLeaveRequests from './pages/admin/ManageLeaveRequests';
import ManageAttendance from './pages/admin/ManageAttendance';
import FacultyAttendance from './pages/FacultyAttendance';
import StudentAttendance from './pages/StudentAttendance';
import Profile from './pages/Profile';
import SupportTickets from './pages/SupportTickets';
import HelpCenter from './pages/HelpCenter';
import SubstituteManagement from './pages/SubstituteManagement';

function App() {
  // Set document title
  React.useEffect(() => {
    document.title = 'SCTS - Smart Classroom & Timetable Scheduler';
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route
              path="/"
              element={
                <PrivateRoute fallback={<Landing />}>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty"
              element={
                <PrivateRoute requiredRole="faculty">
                  <DashboardLayout>
                    <FacultyDashboard />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/student"
              element={
                <PrivateRoute requiredRole="student">
                  <DashboardLayout>
                    <StudentDashboard />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/timetables"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Timetables />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/generate"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <GenerateTimetable />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <PrivateRoute requiredRole="faculty">
                  <DashboardLayout>
                    <FacultyAvailability />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/timetable"
              element={
                <PrivateRoute requiredRole="faculty">
                  <DashboardLayout>
                    <FacultyTimetable />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/timetable/:id"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <ViewTimetable />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            {/* Admin Management Routes */}
            <Route
              path="/admin/faculty"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageFaculty />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageStudents />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/classrooms"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageClassrooms />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/subjects"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageSubjects />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/timeslots"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageTimeslots />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/leave-requests"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageLeaveRequests />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/attendance"
              element={
                <PrivateRoute requiredRole="admin">
                  <DashboardLayout>
                    <ManageAttendance />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/faculty/attendance"
              element={
                <PrivateRoute requiredRole="faculty">
                  <DashboardLayout>
                    <FacultyAttendance />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/student/attendance"
              element={
                <PrivateRoute requiredRole="student">
                  <DashboardLayout>
                    <StudentAttendance />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/support"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SupportTickets />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/help"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <HelpCenter />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/substitute"
              element={
                <PrivateRoute>
                  <DashboardLayout>
                    <SubstituteManagement />
                  </DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

