import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Mail,
  Phone,
  Lock,
  Search,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    }

    if (!formData.studentId.trim()) {
      errs.studentId = 'Student / Staff ID is required';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email format (e.g. name@campus.edu)';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters long';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        studentId: formData.studentId.trim().toUpperCase(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
      });

      setSuccessMessage('Account registered successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err) {
      console.error('[Registration Error]:', err);
      const serverMsg =
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Unable to connect to backend server at http://localhost:5000. Please ensure the server is running.'
          : 'Registration failed. Please check your credentials or try a different Student ID / Email.');

      setErrorMessage(serverMsg);

      // Highlight field if duplicate detected
      if (serverMsg.toLowerCase().includes('email')) {
        setErrors((prev) => ({
          ...prev,
          email: 'This email address is already in use. Please log in instead.',
        }));
      } else if (
        serverMsg.toLowerCase().includes('student') ||
        serverMsg.toLowerCase().includes('id')
      ) {
        setErrors((prev) => ({
          ...prev,
          studentId: 'This ID is already registered. Please log in instead.',
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-md mb-2">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Create FindIt Account
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Join the campus recovery network to report & search lost items
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-soft space-y-5">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  id="name"
                  placeholder="e.g. Sukesh R"
                  icon={User}
                  value={formData.name}
                  error={errors.name}
                  required
                  onChange={(e) => handleChange('name', e.target.value)}
                />

                <Input
                  label="Student / Staff ID"
                  id="studentId"
                  placeholder="e.g. CS202501"
                  icon={CreditCard}
                  value={formData.studentId}
                  error={errors.studentId}
                  required
                  onChange={(e) => handleChange('studentId', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Campus Email"
                  id="email"
                  type="email"
                  placeholder="name@campus.edu"
                  icon={Mail}
                  value={formData.email}
                  error={errors.email}
                  required
                  onChange={(e) => handleChange('email', e.target.value)}
                />

                <Input
                  label="Phone Number"
                  id="phone"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  icon={Phone}
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>

              {/* Role Selector */}
              <Select
                label="Account Role"
                id="role"
                options={[
                  { value: 'student', label: 'Student' },
                  { value: 'staff', label: 'Faculty / Campus Staff' },
                ]}
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.password}
                  error={errors.password}
                  required
                  onChange={(e) => handleChange('password', e.target.value)}
                />

                <Input
                  label="Confirm Password"
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.confirmPassword}
                  error={errors.confirmPassword}
                  required
                  onChange={(e) =>
                    handleChange('confirmPassword', e.target.value)
                  }
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                Create Account
              </Button>
            </form>
          </div>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RegisterPage;
