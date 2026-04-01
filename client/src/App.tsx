import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LogWorkout from "./pages/LogWorkout";
import AICoach from "./pages/AICoach";
import WorkoutPage from "./pages/Workout";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicOnlyRoute from "./components/auth/PublicOnlyRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log-workout" element={<LogWorkout />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<Navigate to="/profile" replace />} />
            <Route path="/ai-coach" element={<AICoach />} />
            <Route path="/workout" element={<WorkoutPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
