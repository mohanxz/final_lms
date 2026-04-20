import PrivateRoute from './components/PrivateRoute'
import PublicRoute from './components/PublicRoute' 
import Login from './components/Login'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import ForgotPassword from './components/ForgotPassword';
import VerifyCode from './components/VerifyCode';
import ResetPassword from './components/ResetPassword';

// In your App component (or AdminLayout if global)




function LoginApp() {
  return (
    
      <Routes>
        <Route
        path="/login" element={
          <PublicRoute>
             <Login />
          </PublicRoute>
        }/>
        
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-code" element={<VerifyCode />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/" element={<PrivateRoute />} />
        <Route path="*" element={<div>404 - Not Found</div>} />
        
      </Routes>
    
  )
}

export default LoginApp;
