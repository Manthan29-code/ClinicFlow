import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  PlusCircle,
  RefreshCw,
  Phone,
  CheckCircle2,
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPatients } from '../api/patientApi';
import { getDoctors } from '../api/doctorApi';
import { getTodayAppointments, createAppointment } from '../api/appointmentApi';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';
import { formatDateTime } from '../utils/formatDate';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

export default function Appointments() {
  // Data state
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);

  // Loading state
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    appointmentDateTime: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch dropdown data (Patients & Doctors)
  const loadDropdownData = useCallback(async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        getPatients(),
        getDoctors(),
      ]);
      setPatients(patientsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch (err) {
      toast.error('Failed to load patients or doctors: ' + getErrorMessage(err));
    }
  }, []);

  // Fetch Today's appointments list
  const loadTodayAppointments = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoadingAppointments(true);
    try {
      const res = await getTodayAppointments();
      setTodayAppointments(res.data || []);
    } catch (err) {
      toast.error('Failed to load appointments: ' + getErrorMessage(err));
    } finally {
      if (showSpinner) setLoadingAppointments(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoadingInitial(true);
      await Promise.all([loadDropdownData(), loadTodayAppointments(false)]);
      setLoadingInitial(false);
    };
    init();
  }, [loadDropdownData, loadTodayAppointments]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.patient) {
      errors.patient = 'Please select a patient';
    }

    if (!formData.doctor) {
      errors.doctor = 'Please select a doctor';
    }

    if (!formData.appointmentDateTime) {
      errors.appointmentDateTime = 'Date and time are required';
    } else {
      const selectedDate = new Date(formData.appointmentDateTime);
      if (isNaN(selectedDate.getTime())) {
        errors.appointmentDateTime = 'Invalid date and time format';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit appointment booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const isoDateTime = new Date(formData.appointmentDateTime).toISOString();
      const payload = {
        patient: formData.patient,
        doctor: formData.doctor,
        appointmentDateTime: isoDateTime,
      };

      const res = await createAppointment(payload);
      toast.success(res.message || 'Appointment scheduled successfully!');

      // Reset form
      setFormData({
        patient: '',
        doctor: '',
        appointmentDateTime: '',
      });

      // Reload today's appointments list
      await loadTodayAppointments(true);
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      const serverErrors = extractFieldErrors(err);
      if (Object.keys(serverErrors).length > 0) {
        setFormErrors(serverErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current local datetime formatted for min attribute in input
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  if (loadingInitial) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader message="Loading appointment schedule & doctors..." size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C18C5D]/10 text-[#C18C5D] border border-[#C18C5D]/20">
              Screen 2 • OPD Scheduling
            </span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-bold tracking-tight text-[#2C2C24]">
            Appointments & Daily Queue
          </h1>
          <p className="text-sm text-[#78786C] mt-1">
            Schedule doctor consultations and view today’s real-time patient queue.
          </p>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={() => {
            loadDropdownData();
            loadTodayAppointments(true);
          }}
          disabled={loadingAppointments}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#4A4A40] border border-[#DED8CF] shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAppointments ? 'animate-spin text-[#C18C5D]' : ''}`} />
          <span>Refresh Today's Queue</span>
        </button>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Book Appointment Form (5 cols on lg) */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-5 bg-[#FEFEFA] rounded-[2rem] border border-[#DED8CF]/70 p-6 sm:p-8 shadow-soft relative"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#DED8CF]/50">
            <div className="w-10 h-10 rounded-2xl bg-[#C18C5D]/10 text-[#C18C5D] flex items-center justify-center border border-[#C18C5D]/20">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-fraunces text-xl font-bold text-[#2C2C24]">
                Book Appointment
              </h2>
              <p className="text-xs text-[#78786C]">
                Assign doctor and schedule time slot
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Patient Dropdown */}
            <div>
              <label
                htmlFor="patient-select"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Select Patient <span className="text-[#A85448]">*</span>
              </label>
              <div className="relative">
                <select
                  id="patient-select"
                  name="patient"
                  value={formData.patient}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 pr-9 rounded-full bg-white/60 border text-sm text-[#2C2C24] appearance-none focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    formErrors.patient
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#C18C5D]/30 focus:border-[#C18C5D]'
                  }`}
                >
                  <option value="" disabled>Choose Patient...</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.phone})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#78786C]">
                  ▼
                </div>
              </div>
              {formErrors.patient && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.patient}
                </p>
              )}
            </div>

            {/* Doctor Dropdown */}
            <div>
              <label
                htmlFor="doctor-select"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Attending Doctor <span className="text-[#A85448]">*</span>
              </label>
              <div className="relative">
                <select
                  id="doctor-select"
                  name="doctor"
                  value={formData.doctor}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 pr-9 rounded-full bg-white/60 border text-sm text-[#2C2C24] appearance-none focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    formErrors.doctor
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#C18C5D]/30 focus:border-[#C18C5D]'
                  }`}
                >
                  <option value="" disabled>Choose Doctor & Specialization...</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} — {d.category}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#78786C]">
                  ▼
                </div>
              </div>
              {formErrors.doctor && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.doctor}
                </p>
              )}
            </div>

            {/* Date & Time Input */}
            <div>
              <label
                htmlFor="appointment-datetime"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Appointment Date & Time <span className="text-[#A85448]">*</span>
              </label>
              <div className="relative">
                <input
                  id="appointment-datetime"
                  type="datetime-local"
                  name="appointmentDateTime"
                  value={formData.appointmentDateTime}
                  min={getMinDateTime()}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                    formErrors.appointmentDateTime
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#C18C5D]/30 focus:border-[#C18C5D]'
                  }`}
                />
              </div>
              {formErrors.appointmentDateTime && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.appointmentDateTime}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-full bg-[#C18C5D] hover:bg-[#a8764b] text-white font-bold text-sm shadow-[0_4px_20px_-2px_rgba(193,140,93,0.3)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18C5D]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Confirm & Schedule</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Right Column: Today's Appointments (7 cols on lg) */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 bg-[#FEFEFA] rounded-[2rem] border border-[#DED8CF]/70 p-6 sm:p-8 shadow-soft"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DED8CF]/50">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-fraunces text-xl font-bold text-[#2C2C24]">
                  Today's Appointments
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6DCCD] text-[#4A4A40]">
                  {todayAppointments.length}
                </span>
              </div>
              <p className="text-xs text-[#78786C]">
                Live list of appointments scheduled for today
              </p>
            </div>
          </div>

          {/* List or Table */}
          {loadingAppointments ? (
            <div className="py-12">
              <Loader message="Fetching today's queue..." />
            </div>
          ) : todayAppointments.length === 0 ? (
            <EmptyState
              title="No appointments for today"
              description="There are no appointments scheduled for today yet. Use the booking form on the left to schedule one."
              icon={Calendar}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DED8CF]/60 text-[11px] font-bold uppercase tracking-wider text-[#78786C]">
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Doctor</th>
                    <th className="py-3 px-3">Time</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED8CF]/40">
                  <AnimatePresence>
                    {todayAppointments.map((item, index) => (
                      <motion.tr
                        key={item._id || index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        className="group hover:bg-[#F0EBE5]/40 transition-colors"
                      >
                        {/* Patient */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#5D7052]/15 text-[#5D7052] font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {item.patient?.name ? item.patient.name.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#2C2C24]">
                                {item.patient?.name || 'Unknown Patient'}
                              </p>
                              {item.patient?.phone && (
                                <p className="text-[11px] text-[#78786C] font-mono">
                                  {item.patient.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Doctor */}
                        <td className="py-3.5 px-3">
                          <div>
                            <p className="text-xs font-bold text-[#2C2C24]">
                              {item.doctor?.name || 'Attending Doctor'}
                            </p>
                            <p className="text-[11px] text-[#78786C]">
                              {item.doctor?.category || 'General'}
                            </p>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 text-xs text-[#4A4A40] font-medium">
                            <Clock className="w-3.5 h-3.5 text-[#78786C]" />
                            <span>{formatDateTime(item.appointmentDateTime)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-right">
                          <StatusBadge status={item.status} />
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
