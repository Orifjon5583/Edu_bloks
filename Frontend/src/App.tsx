import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// SuperAdmin pages
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import Branches from "./pages/superadmin/Branches";
import Groups from "./pages/superadmin/Groups";
import Teachers from "./pages/superadmin/Teachers";
import Students from "./pages/superadmin/Students";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminStudents from "./pages/admin/Students";
import Assignments from "./pages/admin/Assignments";
import AssignmentWizard from "./pages/admin/AssignmentWizard";
import SubmissionReview from "./pages/admin/SubmissionReview";
import Library from "./pages/admin/Library";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import AssignmentExecution from "./pages/student/AssignmentExecution";
import StudentHistory from "./pages/student/History";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* SuperAdmin routes */}
            <Route path="/sa/dashboard" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/sa/branches" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Branches />
              </ProtectedRoute>
            } />
            <Route path="/sa/groups" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Groups />
              </ProtectedRoute>
            } />
            <Route path="/sa/teachers" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Teachers />
              </ProtectedRoute>
            } />
            <Route path="/sa/students" element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <Students />
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminStudents />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Assignments />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments/library" element={
              <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
                <Library />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments/new" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssignmentWizard />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments/:id" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssignmentWizard />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments/:id/edit" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AssignmentWizard />
              </ProtectedRoute>
            } />
            <Route path="/admin/assignments/:id/submissions" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SubmissionReview />
              </ProtectedRoute>
            } />

            {/* Student routes */}
            <Route path="/student/dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/assignments/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <AssignmentExecution />
              </ProtectedRoute>
            } />
            <Route path="/student/history" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentHistory />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
