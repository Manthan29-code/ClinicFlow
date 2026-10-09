import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  Users,
  Calendar,
  Stethoscope,
  LogOut,
  User as UserIcon,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navLinks = [
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: Calendar },
    { to: '/consultations', label: 'Consultations', icon: Stethoscope },
  ];

  return (
    <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
      <nav
        aria-label="Main Navigation"
        className="relative flex items-center justify-between px-5 py-3 rounded-full bg-white/80 backdrop-blur-md border border-[#DED8CF]/80 shadow-soft transition-all duration-300"
      >
        {/* Brand / Logo */}
        <NavLink
          to="/patients"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052] rounded-full p-1"
        >
          <div className="w-10 h-10 rounded-full bg-[#5D7052] flex items-center justify-center text-[#F3F4F1] shadow-[0_2px_10px_rgba(93,112,82,0.3)] transition-transform duration-300 group-hover:scale-105">
            <Activity className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <span className="font-fraunces text-lg font-bold tracking-tight text-[#2C2C24]">
              Clinic<span className="text-[#5D7052]">Flow</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#78786C] -mt-1">
              OPD Care
            </span>
          </div>
        </NavLink>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#F0EBE5]/60 p-1.5 rounded-full border border-[#DED8CF]/40">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052] ${
                    isActive
                      ? 'text-white bg-[#5D7052] shadow-[0_3px_12px_rgba(93,112,82,0.25)]'
                      : 'text-[#4A4A40] hover:text-[#2C2C24] hover:bg-white/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-4 h-4" strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="hidden md:flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F0EBE5]/70 border border-[#DED8CF]/50 text-xs font-medium text-[#4A4A40]">
              <div className="w-6 h-6 rounded-full bg-[#C18C5D]/20 text-[#C18C5D] flex items-center justify-center font-bold">
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
              </div>
              <span className="max-w-[120px] truncate font-semibold text-[#2C2C24]">
                {user.name}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            aria-label="Log out of session"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-[#A85448] bg-[#F8ECE9]/70 hover:bg-[#F8ECE9] border border-[#A85448]/20 transition-all duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A85448]"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          className="md:hidden p-2 rounded-full text-[#4A4A40] hover:bg-[#F0EBE5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mt-2 p-4 rounded-[2rem] bg-white/95 backdrop-blur-lg border border-[#DED8CF] shadow-float flex flex-col gap-2"
          >
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#5D7052] text-white'
                        : 'text-[#4A4A40] hover:bg-[#F0EBE5]'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {user && (
              <div className="pt-3 mt-2 border-t border-[#DED8CF] flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#5D7052]/20 text-[#5D7052] flex items-center justify-center font-bold text-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#2C2C24]">{user.name}</p>
                    <p className="text-[11px] text-[#78786C]">{user.phone || 'Staff'}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#A85448] bg-[#F8ECE9] border border-[#A85448]/20"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
