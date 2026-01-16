import { BrowserRouter as Router, Routes, Route } from "react-router";
import HomePage from "@/react-app/pages/Home";
import ClassDetail from "@/react-app/pages/ClassDetail";
import TeachersPage from "@/react-app/pages/Teachers";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/class/:id" element={<ClassDetail />} />
        <Route path="/teachers" element={<TeachersPage />} />
      </Routes>
    </Router>
  );
}
