import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Stethoscope,
  Thermometer,
  Activity,
  FileText,
  Save,
  CheckCircle,
  History,
  Calendar,
  User,
  Heart,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAppointments } from '../api/appointmentApi';
import { getPatients, getPatientConsultations } from '../api/patientApi';
import { createConsultation, completeConsultation } from '../api/consultationApi';
import { getErrorMessage, extractFieldErrors } from '../utils/getErrorMessage';
import { formatDateTime } from '../utils/formatDate';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

export default function Consultations() {
  // Section A Data & State
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [savedDraftId, setSavedDraftId] = useState(null);

  // Section A Form State
  const [formData, setFormData] = useState({
    appointment: '',
    temperature: '',
    pulse: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState({});

  // Section B Data & State
  const [patientsList, setPatientsList] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load Scheduled Appointments for Section A
  const loadScheduledAppointments = useCallback(async () => {
    setLoadingScheduled(true);
    try {
      const res = await getAppointments({ status: 'Scheduled' });
      setScheduledAppointments(res.data || []);
    } catch (err) {
      toast.error('Failed to load scheduled appointments: ' + getErrorMessage(err));
    } finally {
      setLoadingScheduled(false);
    }
  }, []);

  // Load Patients list for Section B
  const loadPatients = useCallback(async () => {
    try {
      const res = await getPatients();
      setPatientsList(res.data || []);
    } catch (err) {
      toast.error('Failed to load patient list: ' + getErrorMessage(err));
    }
  }, []);

  // Load Consultation History for Selected Patient in Section B
  const loadHistoryForPatient = useCallback(async (patientId) => {
    if (!patientId) {
      setPatientHistory([]);
      return;
    }
    setLoadingHistory(true);
    try {
      const res = await getPatientConsultations(patientId);
      setPatientHistory(res.data || []);
    } catch (err) {
      toast.error('Failed to load consultation history: ' + getErrorMessage(err));
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    loadScheduledAppointments();
    loadPatients();
  }, [loadScheduledAppointments, loadPatients]);

  // When patient selection changes in Section B
  const handleHistoryPatientChange = (e) => {
    const patientId = e.target.value;
    setSelectedPatientId(patientId);
    loadHistoryForPatient(patientId);
  };

  // Section A form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // If appointment changes, clear existing draft
    if (name === 'appointment') {
      setSavedDraftId(null);
    }
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate Section A Form
  const validateForm = () => {
    const errors = {};

    if (!formData.appointment) {
      errors.appointment = 'Please select a scheduled appointment';
    }

    if (formData.temperature === '' || formData.temperature === null || formData.temperature === undefined) {
      errors.temperature = 'Body temperature is required';
    } else {
      const tempNum = Number(formData.temperature);
      if (isNaN(tempNum) || tempNum < 70 || tempNum > 115) {
        errors.temperature = 'Enter a valid temperature in °F (e.g. 98.6)';
      }
    }

    if (formData.pulse === '' || formData.pulse === null || formData.pulse === undefined) {
      errors.pulse = 'Pulse rate is required';
    } else {
      const pulseNum = Number(formData.pulse);
      if (isNaN(pulseNum) || pulseNum < 30 || pulseNum > 220) {
        errors.pulse = 'Enter a valid pulse rate in bpm (e.g. 72)';
      }
    }

    if (!formData.notes.trim()) {
      errors.notes = 'Clinical consultation notes are required';
    } else if (formData.notes.trim().length < 3) {
      errors.notes = 'Notes must be at least 3 characters long';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Step 1: Save Consultation Draft
  const handleSaveDraft = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSavingDraft(true);
    setFormErrors({});

    const payload = {
      appointment: formData.appointment,
      vitals: {
        temperature: Number(formData.temperature),
        pulse: Number(formData.pulse),
      },
      notes: formData.notes.trim(),
    };

    try {
      const res = await createConsultation(payload);
      const draftId = res.data?._id;
      setSavedDraftId(draftId);
      toast.success(res.message || 'Consultation draft saved successfully!');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      const serverErrors = extractFieldErrors(err);
      if (Object.keys(serverErrors).length > 0) {
        setFormErrors(serverErrors);
      }
    } finally {
      setSavingDraft(false);
    }
  };

  // Step 2: Mark Consultation as Completed
  const handleCompleteConsultation = async () => {
    if (!savedDraftId) {
      toast.error('Please save consultation draft first');
      return;
    }

    setCompleting(true);
    try {
      const res = await completeConsultation(savedDraftId);
      toast.success(res.message || 'Consultation marked as completed!');

      // Find the appointment to check if it matches Section B patient
      const completedAppt = scheduledAppointments.find(
        (a) => a._id === formData.appointment
      );

      // Reset form & draft state
      setSavedDraftId(null);
      setFormData({
        appointment: '',
        temperature: '',
        pulse: '',
        notes: '',
      });
      setFormErrors({});

      // Reload scheduled appointments (the completed appointment disappears)
      await loadScheduledAppointments();

      // If this patient is selected in Section B, refresh history
      if (completedAppt?.patient?._id && completedAppt.patient._id === selectedPatientId) {
        await loadHistoryForPatient(selectedPatientId);
      }
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#5D7052]/10 text-[#5D7052] border border-[#5D7052]/20">
              Screen 3 • Clinical OPD
            </span>
          </div>
          <h1 className="font-fraunces text-3xl sm:text-4xl font-bold tracking-tight text-[#2C2C24]">
            Consultations & Medical Records
          </h1>
          <p className="text-sm text-[#78786C] mt-1">
            Record patient vitals, enter physician notes, and review completed medical histories.
          </p>
        </div>

        {/* Global Refresh */}
        <button
          type="button"
          onClick={() => {
            loadScheduledAppointments();
            loadPatients();
            if (selectedPatientId) loadHistoryForPatient(selectedPatientId);
          }}
          disabled={loadingScheduled || loadingHistory}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/80 hover:bg-white text-xs font-bold text-[#4A4A40] border border-[#DED8CF] shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingScheduled ? 'animate-spin text-[#5D7052]' : ''}`} />
          <span>Refresh All</span>
        </button>
      </div>

      {/* Main Two Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* SECTION A: Consultation Form (6 cols on lg) */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-6 bg-[#FEFEFA] rounded-[2rem] border border-[#DED8CF]/70 p-6 sm:p-8 shadow-soft relative"
        >
          {/* Section A Title */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#DED8CF]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5D7052]/10 text-[#5D7052] flex items-center justify-center border border-[#5D7052]/20">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-fraunces text-xl font-bold text-[#2C2C24]">
                  Record Consultation
                </h2>
                <p className="text-xs text-[#78786C]">
                  Section A • Active OPD Session
                </p>
              </div>
            </div>

            {/* Draft Status Badge */}
            {savedDraftId && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#5D7052]/15 text-[#5D7052] border border-[#5D7052]/30 flex items-center gap-1.5 animate-pulse">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Draft Saved</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveDraft} noValidate className="space-y-5">
            {/* Appointment Dropdown */}
            <div>
              <label
                htmlFor="scheduled-appointment"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Scheduled Appointment <span className="text-[#A85448]">*</span>
              </label>
              <div className="relative">
                <select
                  id="scheduled-appointment"
                  name="appointment"
                  value={formData.appointment}
                  onChange={handleInputChange}
                  disabled={savingDraft || completing}
                  className={`w-full h-11 px-4 pr-9 rounded-full bg-white/60 border text-xs sm:text-sm text-[#2C2C24] appearance-none focus:bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer ${
                    formErrors.appointment
                      ? 'border-[#A85448] focus:ring-[#A85448]/30'
                      : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                  }`}
                >
                  <option value="" disabled>Choose Scheduled Appointment...</option>
                  {scheduledAppointments.map((appt) => (
                    <option key={appt._id} value={appt._id}>
                      {appt.patient?.name || 'Patient'} — {appt.doctor?.name || 'Doctor'} ({formatDateTime(appt.appointmentDateTime)})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#78786C]">
                  ▼
                </div>
              </div>
              {formErrors.appointment && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.appointment}
                </p>
              )}
              {scheduledAppointments.length === 0 && !loadingScheduled && (
                <p className="text-[11px] text-[#78786C] mt-1 ml-2">
                  No scheduled appointments available. Book one in Screen 2.
                </p>
              )}
            </div>

            {/* Vitals Grid (Temperature & Pulse) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Temperature */}
              <div>
                <label
                  htmlFor="vitals-temp"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
                >
                  Body Temp (°F) <span className="text-[#A85448]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78786C]">
                    <Thermometer className="w-4 h-4 text-[#C18C5D]" />
                  </div>
                  <input
                    id="vitals-temp"
                    type="number"
                    step="0.1"
                    name="temperature"
                    placeholder="e.g. 98.6"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    disabled={savingDraft || completing}
                    className={`w-full h-11 pl-10 pr-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.temperature
                        ? 'border-[#A85448] focus:ring-[#A85448]/30'
                        : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                    }`}
                  />
                </div>
                {formErrors.temperature && (
                  <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                    {formErrors.temperature}
                  </p>
                )}
              </div>

              {/* Pulse */}
              <div>
                <label
                  htmlFor="vitals-pulse"
                  className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
                >
                  Pulse (BPM) <span className="text-[#A85448]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#78786C]">
                    <Heart className="w-4 h-4 text-[#A85448]" />
                  </div>
                  <input
                    id="vitals-pulse"
                    type="number"
                    name="pulse"
                    placeholder="e.g. 72"
                    value={formData.pulse}
                    onChange={handleInputChange}
                    disabled={savingDraft || completing}
                    className={`w-full h-11 pl-10 pr-4 rounded-full bg-white/60 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      formErrors.pulse
                        ? 'border-[#A85448] focus:ring-[#A85448]/30'
                        : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                    }`}
                  />
                </div>
                {formErrors.pulse && (
                  <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                    {formErrors.pulse}
                  </p>
                )}
              </div>
            </div>

            {/* Clinical Notes */}
            <div>
              <label
                htmlFor="consultation-notes"
                className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
              >
                Physician Diagnosis & Notes <span className="text-[#A85448]">*</span>
              </label>
              <textarea
                id="consultation-notes"
                name="notes"
                rows={4}
                placeholder="Enter symptoms observed, diagnosis, and prescription advice..."
                value={formData.notes}
                onChange={handleInputChange}
                disabled={savingDraft || completing}
                className={`w-full p-4 rounded-[1.5rem] bg-white/60 border text-sm text-[#2C2C24] placeholder-[#78786C]/60 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-none ${
                  formErrors.notes
                    ? 'border-[#A85448] focus:ring-[#A85448]/30'
                    : 'border-[#DED8CF] focus:ring-[#5D7052]/30 focus:border-[#5D7052]'
                }`}
              />
              {formErrors.notes && (
                <p className="text-xs text-[#A85448] font-semibold mt-1 ml-3">
                  {formErrors.notes}
                </p>
              )}
            </div>

            {/* Two-step Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {/* Step 1: Save Draft */}
              <button
                type="submit"
                disabled={savingDraft || completing}
                className="flex-1 h-12 rounded-full bg-[#5D7052] hover:bg-[#47573E] text-[#F3F4F1] font-bold text-xs sm:text-sm shadow-[0_4px_20px_-2px_rgba(93,112,82,0.25)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D7052]"
              >
                {savingDraft ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{savedDraftId ? 'Update Draft' : 'Step 1: Save Draft'}</span>
                  </>
                )}
              </button>

              {/* Step 2: Mark as Completed */}
              <button
                type="button"
                onClick={handleCompleteConsultation}
                disabled={!savedDraftId || completing || savingDraft}
                className={`flex-1 h-12 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C18C5D] ${
                  savedDraftId
                    ? 'bg-[#C18C5D] hover:bg-[#a8764b] text-white shadow-[0_4px_20px_-2px_rgba(193,140,93,0.3)] hover:scale-[1.02] active:scale-95 cursor-pointer'
                    : 'bg-[#F0EBE5] text-[#78786C] border border-[#DED8CF]/60 opacity-60 cursor-not-allowed'
                }`}
              >
                {completing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Step 2: Complete Session</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* ========================================================================= */}
        {/* SECTION B: Completed Consultations for Patient (6 cols on lg) */}
        {/* ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-6 bg-[#FEFEFA] rounded-[2rem] border border-[#DED8CF]/70 p-6 sm:p-8 shadow-soft"
        >
          {/* Section B Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#DED8CF]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#C18C5D]/10 text-[#C18C5D] flex items-center justify-center border border-[#C18C5D]/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-fraunces text-xl font-bold text-[#2C2C24]">
                  Consultation History
                </h2>
                <p className="text-xs text-[#78786C]">
                  Section B • Completed Patient Records
                </p>
              </div>
            </div>

            {selectedPatientId && (
              <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E6DCCD] text-[#4A4A40]">
                {patientHistory.length} Record{patientHistory.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Patient Selector */}
          <div className="mb-6">
            <label
              htmlFor="history-patient-select"
              className="block text-xs font-bold uppercase tracking-wider text-[#4A4A40] mb-1.5 ml-1"
            >
              Select Patient for Medical History
            </label>
            <div className="relative">
              <select
                id="history-patient-select"
                value={selectedPatientId}
                onChange={handleHistoryPatientChange}
                className="w-full h-11 px-4 pr-9 rounded-full bg-white/70 border border-[#DED8CF] text-xs sm:text-sm text-[#2C2C24] appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C18C5D]/30 focus:border-[#C18C5D] transition-all cursor-pointer"
              >
                <option value="">-- Choose Patient to View History --</option>
                {patientsList.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.phone}) — {p.gender}, {p.age}y
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#78786C]">
                ▼
              </div>
            </div>
          </div>

          {/* History List Content */}
          {!selectedPatientId ? (
            <EmptyState
              title="Select a Patient"
              description="Choose a patient from the dropdown above to load their completed clinical consultation history."
              icon={User}
            />
          ) : loadingHistory ? (
            <div className="py-12">
              <Loader message="Loading patient consultation records..." />
            </div>
          ) : patientHistory.length === 0 ? (
            <EmptyState
              title="No completed consultations"
              description="No completed clinical consultation records found for this patient."
              icon={FileText}
            />
          ) : (
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              <AnimatePresence>
                {patientHistory.map((item, index) => (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    className="p-5 rounded-[1.5rem] bg-[#FDFCF8] border border-[#DED8CF] shadow-subtle hover:shadow-soft transition-all duration-200"
                  >
                    {/* Record Top Bar */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[#DED8CF]/40">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#5D7052]" />
                        <span className="text-xs font-bold text-[#2C2C24]">
                          {formatDateTime(item.consultationDate || item.appointment?.appointmentDateTime)}
                        </span>
                      </div>
                      <StatusBadge status="Completed" size="sm" />
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-[#5D7052]/10 text-[#5D7052] flex items-center justify-center text-xs font-bold">
                        Dr
                      </div>
                      <p className="text-xs font-semibold text-[#2C2C24]">
                        {item.appointment?.doctor?.name || 'Physician'}
                        <span className="text-[#78786C] font-normal ml-1">
                          ({item.appointment?.doctor?.category || 'General'})
                        </span>
                      </p>
                    </div>

                    {/* Vitals Chips */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C18C5D]/10 border border-[#C18C5D]/20 text-xs font-semibold text-[#C18C5D]">
                        <Thermometer className="w-3.5 h-3.5" />
                        <span>Temp: {item.vitals?.temperature}°F</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A85448]/10 border border-[#A85448]/20 text-xs font-semibold text-[#A85448]">
                        <Heart className="w-3.5 h-3.5" />
                        <span>Pulse: {item.vitals?.pulse} bpm</span>
                      </div>
                    </div>

                    {/* Physician Notes */}
                    <div className="p-3 rounded-xl bg-white/70 border border-[#DED8CF]/60 text-xs text-[#2C2C24] leading-relaxed">
                      <p className="font-bold text-[#78786C] text-[10px] uppercase tracking-wider mb-1">
                        Clinical Notes:
                      </p>
                      {item.notes}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
