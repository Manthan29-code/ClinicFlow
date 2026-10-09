import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  Search,
  Users,
  Phone,
  User,
  Calendar,
  X,
  RefreshCw,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  fetchPatientsList,
  registerNewPatient,
  setSearchQuery,
} from '../store/slices/patientSlice';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export default function Patients() {
  const dispatch = useDispatch();
  const { list: patients, count, loading, submitting } = useSelector(
    (state) => state.patients
  );

  // Form local state
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    age: '',
    phone: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Search local state
  const [searchInput, setSearchInput] = useState('');
  const debounceTimerRef = useRef(null);

  // Fetch patients on mount or debounced search
  const loadPatients = useCallback(
    (query = '') => {
      dispatch(fetchPatientsList(query));
    },
    [dispatch]
  );

  useEffect(() => {
    loadPatients('');
  }, [loadPatients]);

  // Debounced search handler (400ms)
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      dispatch(setSearchQuery(val));
      loadPatients(val.trim());
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    dispatch(setSearchQuery(''));
    loadPatients('');
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form before submission
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Patient name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.gender) {
      errors.gender = 'Please select a gender';
    }

    if (formData.age === '' || formData.age === null || formData.age === undefined) {
      errors.age = 'Age is required';
    } else {
      const ageNum = Number(formData.age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 120) {
        errors.age = 'Age must be a valid number between 0 and 120';
      }
    }

    const cleanPhone = formData.phone.trim();
    if (!cleanPhone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phone = 'Phone must be exactly 10 digits';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit patient registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      gender: formData.gender,
      age: Number(formData.age),
      phone: formData.phone.trim(),
    };

    try {
      const resultAction = await dispatch(registerNewPatient(payload));
      if (registerNewPatient.fulfilled.match(resultAction)) {
        toast.success(resultAction.payload?.message || 'Patient registered successfully!');
        // Clear form
        setFormData({ name: '', gender: '', age: '', phone: '' });
        setFormErrors({});
        // Reload list to ensure fresh data and sync
        loadPatients(searchInput.trim());
      } else {
        const error = resultAction.payload;
        const msg = getErrorMessage(error);
        toast.error(msg);
        const serverErrors = extractFieldErrors(error);
        if (Object.keys(serverErrors).length > 0) {
          setFormErrors(serverErrors);
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getGenderBadgeStyle = (gender) => {
    switch (gender) {
      case 'Female':
        return 'bg-[#C18C5D]/15 text-[#C18C5D] border-[#C18C5D]/30';
      case 'Male':
        return 'bg-[#5D7052]/15 text-[#5D7052] border-[#5D7052]/30';
      default:
        return 'bg-[#78786C]/15 text-[#4A4A40] border-[#78786C]/30';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header section with Organic / Natural theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#5D7052]/10 text-[#5D7052] border border-[#5D7052]/20">
              Screen 1 • Reception Desk
            </span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-bold tracking-tight text-[#2C2C24]">
            Patient Directory & Intake
          </h1>
          <p className="text-sm text-[#78786C] mt-1">
            Register new outpatients and manage real-time OPD records.
          </p>
        </div>

        {/* Quick Refresh Button */}
        <button
          type="button"
          onClick={() => loadPatients(searchInput.trim())}
          disabled={loading}
          aria-label="Refresh patient list"
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#4A4A40] border border-[#DED8CF] shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#5D7052]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Two Column Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Register Patient Form (5 cols on lg) */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 bg-[#FEFEFA] rounded-[2rem] border border-[#DED8CF]/70 p-6 sm:p-8 shadow-soft relative"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#DED8CF]/50">
            <div className="w-10 h-10 rounded-2xl bg-[#5D7052]/10 text-[#5D7052] flex items-center justify-center border border-[#5D7052]/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-fraunces text-xl font-bold text-[#2C2C24]">
                Register New Patient
              </h2>
              <p className="text-xs text-[#78786C]">
                Enter outpatient demographic details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="patient-name"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Full Name <span className="text-[#A85448]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#78786C]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="patient-name"
                  type="text"
                  name="name"
                  placeholder="e.g. Ravi Shah"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`w-full h-11 pl-11 pr-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    formErrors.name
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                  }`}
                />
              </div>
              {formErrors.name && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Gender & Age Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gender */}
              <div>
                <label
                  htmlFor="patient-gender"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
                >
                  Gender <span className="text-[#A85448]">*</span>
                </label>
                <div className="relative">
                  <select
                    id="patient-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`w-full h-11 px-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] appearance-none focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                      formErrors.gender
                        ? 'border-[#A85448] focus:ring-[#A85448]/30'
                        : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                    }`}
                  >
                    <option value="" disabled>Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#78786C]">
                    ▼
                  </div>
                </div>
                {formErrors.gender && (
                  <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                    {formErrors.gender}
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label
                  htmlFor="patient-age"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
                >
                  Age (Years) <span className="text-[#A85448]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#78786C]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    id="patient-age"
                    type="number"
                    name="age"
                    min="0"
                    max="120"
                    placeholder="e.g. 34"
                    value={formData.age}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className={`w-full h-11 pl-11 pr-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.age
                        ? 'border-[#A85448] focus:ring-[#A85448]/30'
                        : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                    }`}
                  />
                </div>
                {formErrors.age && (
                  <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                    {formErrors.age}
                  </p>
                )}
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="patient-phone"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Phone Number (10 Digits) <span className="text-[#A85448]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#78786C]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="patient-phone"
                  type="tel"
                  name="phone"
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className={`w-full h-11 pl-11 pr-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    formErrors.phone
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                  }`}
                />
              </div>
              {formErrors.phone && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.phone}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-full bg-[#5D7052] hover:bg-[#47573E] text-[#F3F4F1] font-bold text-sm shadow-[0_4px_20px_-2px_rgba(93,112,82,0.25)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Patient</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right Column: Patient Search & List (7 cols on lg) */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 bg-[#FEFEFA] rounded-[2rem] border border-[#DED8CF]/70 p-6 sm:p-8 shadow-soft"
        >
          {/* Header & Debounced Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fraunces text-xl font-bold text-[#2C2C24]">
                  Registered Patients
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6DCCD] text-[#4A4A40]">
                  {count}
                </span>
              </div>
              <p className="text-xs text-[#78786C]">
                Search directory by name or phone
              </p>
            </div>

            {/* Search Input with Debounce */}
            <div className="relative min-w-[240px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78786C]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={handleSearchChange}
                placeholder="Search name or phone..."
                className="w-full h-10 pl-9 pr-8 rounded-full bg-white/70 border border-[#DED8CF] text-xs text-[#2C2C24] placeholder-[#78786C]/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5D7052]/30 focus:border-[#5D7052] transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#78786C] hover:text-[#2C2C24]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table / List View */}
          {loading ? (
            <div className="py-12">
              <Loader message="Fetching patient directory..." />
            </div>
          ) : patients.length === 0 ? (
            <EmptyState
              title={searchInput ? 'No matching patients' : 'No patients registered yet'}
              description={
                searchInput
                  ? `No patients found matching "${searchInput}". Try clearing the search filter.`
                  : 'Start by filling out the registration form on the left to add your first patient.'
              }
              icon={Users}
              action={
                searchInput ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-5 py-2 rounded-full text-xs font-bold bg-[#5D7052] text-white hover:bg-[#47573E] transition-transform hover:scale-105 active:scale-95"
                  >
                    Clear Search
                  </button>
                ) : null
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DED8CF]/60 text-[11px] font-bold uppercase tracking-wider text-[#78786C]">
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Gender</th>
                    <th className="py-3 px-3">Age</th>
                    <th className="py-3 px-3 text-right">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED8CF]/40">
                  <AnimatePresence>
                    {patients.map((patient, index) => (
                      <motion.tr
                        key={patient._id || index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        className="group hover:bg-[#F0EBE5]/40 transition-colors"
                      >
                        {/* Name */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#5D7052]/15 text-[#5D7052] font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-[#5D7052] group-hover:text-white transition-colors">
                              {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <span className="text-sm font-bold text-[#2C2C24] group-hover:text-[#5D7052] transition-colors">
                              {patient.name}
                            </span>
                          </div>
                        </td>

                        {/* Gender */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getGenderBadgeStyle(
                              patient.gender
                            )}`}
                          >
                            {patient.gender || '—'}
                          </span>
                        </td>

                        {/* Age */}
                        <td className="py-3.5 px-3 text-sm text-[#4A4A40] font-medium">
                          {patient.age} yrs
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[#4A4A40] bg-[#F0EBE5]/60 px-2.5 py-1 rounded-full border border-[#DED8CF]/50">
                            <Phone className="w-3 h-3 text-[#78786C]" />
                            <span>{patient.phone}</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
