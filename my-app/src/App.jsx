// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import HomePage from "./components/HomePage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import StudentLogin from "./components/StudentLogin";
import DreamsPage from "./components/DreamsPage";
import NominatedSenseiPage from "./components/NominatedSenseiPage";
import IsDonePage from "./components/isDonePage";

import RequireAuth from "./routes/RequireAuth";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/admin" element={<AdminLogin />} />

        {/* Student protected */}
        <Route element={<RequireAuth role="student" />}>
          <Route path="/nominations" element={<NominatedSenseiPage />} />
          <Route path="/nominations/done" element={<IsDonePage />} />
          
          {/* <Route path="/questionnaire" element={<HomePage />} /> */}
          {/* <Route path="/questionnaire/dreams" element={<DreamsPage />} /> */}
        </Route>

        {/* Admin protected */}
        <Route element={<RequireAuth role="admin" />}>
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
