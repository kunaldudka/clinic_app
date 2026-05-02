import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/patients/PatientList';
import PatientForm from './pages/patients/PatientForm';
import PatientDetail from './pages/patients/PatientDetail';
import VisitForm from './pages/visits/VisitForm';
import PrescriptionForm from './pages/prescriptions/PrescriptionForm';
import PrescriptionPrint from './pages/prescriptions/PrescriptionPrint';
import Profile from './pages/Profile';
import MedicineUpload from './pages/medicines/MedicineUpload';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />

      <Route element={
        <PrivateRoute><Layout /></PrivateRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientList />} />
        <Route path="patients/new" element={<PatientForm />} />
        <Route path="patients/:id" element={<PatientDetail />} />
        <Route path="patients/:id/edit" element={<PatientForm />} />
        <Route path="patients/:patientId/visits/new" element={<VisitForm />} />
        <Route
          path="patients/:patientId/visits/:visitId/prescriptions/new"
          element={<PrescriptionForm />}
        />
        <Route path="prescriptions/:id/print" element={<PrescriptionPrint />} />
        <Route path="profile" element={<Profile />} />
        <Route path="medicines" element={<MedicineUpload />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
