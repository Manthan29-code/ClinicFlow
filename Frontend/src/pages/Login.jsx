import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, User, Phone, ArrowRight, ShieldCheck, UserPlus, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';

export default function Login() {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const targetPath = location.state?.from?.pathname || '/patients';
      navigate(targetPath, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Staff name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    const phoneClean = formData.phone.trim();
    if (!phoneClean) {
      errs.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(phoneClean)) {
      errs.phone = 'Phone number must be exactly 10 digits';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear inline error on edit
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
    };

    try {
      if (isRegisterMode) {
        const res = await register(payload);
        toast.success(res?.message || 'Staff registered successfully!');
      } else {
        const res = await login(payload);
        toast.success(res?.message || 'Welcome back to ClinicFlow!');
      }
      navigate('/patients');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      
      const serverFieldErrors = extractFieldErrors(err);
      if (Object.keys(serverFieldErrors).length > 0) {
        setErrors(serverFieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (mode) => {
    setIsRegisterMode(mode);
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative Blob Shapes */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5D7052]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-[#C18C5D]/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-[#FEFEFA]/90 backdrop-blur-xl border border-[#DED8CF]/70 rounded-[2.5rem] p-8 sm:p-10 shadow-float relative overflow-hidden">
          {/* Subtle top accent curve */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#5D7052] via-[#C18C5D] to-[#5D7052]" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#5D7052] text-[#F3F4F1] shadow-[0_4px_20px_rgba(93,112,82,0.3)] mb-4">
              <Activity className="w-8 h-8" strokeWidth={2.2} />
            </div>
            <h1 className="font-fraunces text-3xl font-bold tracking-tight text-[#2C2C24]">
              Clinic<span className="text-[#5D7052]">Flow</span>
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#78786C] font-semibold mt-1">
              OPD Management System
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex bg-[#F0EBE5]/80 p-1.5 rounded-full border border-[#DED8CF]/60 mb-6">
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052] ${
                !isRegisterMode
                  ? 'bg-white text-[#2C2C24] shadow-sm'
                  : 'text-[#78786C] hover:text-[#2C2C24]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052] ${
                isRegisterMode
                  ? 'bg-white text-[#2C2C24] shadow-sm'
                  : 'text-[#78786C] hover:text-[#2C2C24]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Staff</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Staff Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#78786C]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g. Dr. Priya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-12 pl-11 pr-4 rounded-full bg-white/70 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.name
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3 animate-fadeIn">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Phone Input */}
            <div>
              <label
                htmlFor="phone"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Phone Number (10 Digits)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#78786C]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-12 pl-11 pr-4 rounded-full bg-white/70 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.phone
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3 animate-fadeIn">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Hint */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0EBE5]/50 border border-[#DED8CF]/40 text-[11px] text-[#78786C]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5D7052] flex-shrink-0" />
              <span>Login uses your registered Name + Phone number.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-4 rounded-full bg-[#5D7052] hover:bg-[#47573E] text-[#F3F4F1] font-bold text-sm shadow-[0_4px_20px_-2px_rgba(93,112,82,0.25)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052] focus-visible:ring-offset-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-[#F3F4F1] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegisterMode ? 'Complete Registration' : 'Enter Clinic'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
