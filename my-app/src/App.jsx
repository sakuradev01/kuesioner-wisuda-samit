import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from './components/HomePage'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import StudentLogin from './components/StudentLogin'
import DreamsPage from './components/DreamsPage'
import NominatedSenseiPage from './components/NominatedSenseiPage'
import RequireAuth from "./routes/RequireAuth";
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/admin" element={<AdminLogin />} />

        <Route element={<RequireAuth />}>
          <Route path="/questionnaire" element={<HomePage />} />
          <Route path="/questionnaire/nominations" element={<NominatedSenseiPage />} />
          <Route path="/questionnaire/dreams" element={<DreamsPage />} />
          
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
