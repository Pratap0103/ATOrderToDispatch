import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Gem } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
/* deleted import */
import Footer from '../components/Footer';
import logoSvg from '../Assets/logo.svg';

const Login = () => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const users = getUsers();
      const matchedUser = users.find(
        (u) => u.id === id && u.password === password
      );

      if (!matchedUser) {
        toast.error('Invalid credentials');
        setSubmitting(false);
        return;
      }

      toast.success('Login successful!');
      login(matchedUser);
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Login error');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoCredential = (userId) => {
    try {
      const users = getUsers();
      const found = users.find((u) => u.id === userId);
      if (found) {
        setId(found.id);
        setPassword(found.password);
        return;
      }
    } catch (e) {
      console.error(e);
    }

    if (userId === 'admin') {
      setId('admin');
      setPassword('admin123');
    } else if (userId === 'user') {
      setId('user');
      setPassword('user123');
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden">
      {/* Center Content */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 pb-14 sm:pb-16">
        <div className="w-[92%] sm:w-full max-w-[340px] sm:max-w-md bg-white rounded-2xl shadow-2xl p-4 sm:p-8 space-y-3.5 sm:space-y-6">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center space-y-2.5 sm:space-y-4">
            <div className="w-16 h-16 sm:w-24 sm:h-24 flex items-center justify-center">
              <img src={logoSvg} alt="JF Jewel Factory Logo" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="text-center space-y-0.5">
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Order To Dispatch</h1>
              <p className="text-gray-600 text-xs sm:text-base font-medium">Handmade Jewellery Unit</p>
            </div>
          </div>
 
          {/* Form */}
          <form className="space-y-2.5 sm:space-y-4" onSubmit={handleSubmit}>
            {/* User ID Input */}
            <div className="space-y-1">
              <label htmlFor="id" className="text-[11px] sm:text-sm font-semibold text-gray-700">
                User ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="id"
                  name="id"
                  type="text"
                  required
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="block w-full pl-9 pr-4 py-1.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs sm:text-sm"
                  placeholder="Enter user ID"
                />
              </div>
            </div>
 
            {/* Password Input */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-[11px] sm:text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-12 py-1.5 sm:py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs sm:text-sm"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>
 
            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-1.5 sm:py-2.5 px-4 text-xs sm:text-base font-bold text-white rounded-lg focus:outline-none focus-visible:ring-amber-600/20 dark:focus-visible:ring-amber-600/40 bg-transparent bg-gradient-to-r from-amber-600 via-amber-500/60 to-amber-600 [background-size:200%_auto] hover:bg-[99%_center] shadow-sm transition-all ${
                submitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
 
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500 font-semibold text-[11px] sm:text-xs">Demo Credentials</span>
            </div>
          </div>
 
          {/* Demo Credentials */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 sm:p-4">
            <p className="text-[9px] sm:text-xs font-semibold text-gray-500 text-center mb-1.5 sm:mb-3 uppercase tracking-wider">Quick Login Options</p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleDemoCredential('admin')}
                className="flex flex-col items-center justify-center p-1.5 sm:p-3 bg-white border border-gray-200 hover:border-amber-500 hover:shadow-md hover:bg-amber-50 rounded-lg transition-all group"
              >
                <span className="font-bold text-gray-800 text-[11px] sm:text-sm group-hover:text-amber-700">Admin</span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono mt-0.5">ID: admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoCredential('user')}
                className="flex flex-col items-center justify-center p-1.5 sm:p-3 bg-white border border-gray-200 hover:border-amber-500 hover:shadow-md hover:bg-amber-50 rounded-lg transition-all group"
              >
                <span className="font-bold text-gray-800 text-[11px] sm:text-sm group-hover:text-amber-700">User</span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono mt-0.5">ID: user</span>
              </button>
            </div>
          </div>
        </div>
      </div>
 
      {/* Footer at Bottom */}
      <div className="w-full fixed bottom-0 left-0 right-0 z-50">
        <Footer />
      </div>
    </div>
  );
};

export default Login;

