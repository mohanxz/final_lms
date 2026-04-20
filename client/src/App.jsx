import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminApp from "./apps/admin/AdminApp";
import StudentApp from "./apps/student/App";
import SuperAdminApp from "./apps/superadmin/App";
import LoginApp from "./apps/login/LoginApp"; // or similar

function App() {
  
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/student/*" element={<StudentApp />} />
        <Route path="/superadmin/*" element={<SuperAdminApp />} />
        <Route path="/*" element={<LoginApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
