import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  preferred_units: 'imperial' | 'metric';
  notification_preferences: {
    email: boolean;
    push: boolean;
    maintenance_reminders: boolean;
    recall_alerts: boolean;
    document_expiration: boolean;
  };
  created_at: string;
}

// Debounce utility
function useDebouncedCallback(callback: (...args: any[]) => void, delay: number) {
  const timer = useRef<NodeJS.Timeout | null>(null);
  return (...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  };
}

// Validation helpers
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
const validateName = (name: string) => {
  return /^[a-zA-Z\-' ]{1,50}$/.test(name);
};

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [formTouched, setFormTouched] = useState<{ [key: string]: boolean }>({});
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    first_name: null,
    last_name: null,
    avatar_url: null,
    phone_number: null,
    preferred_units: 'imperial',
    notification_preferences: {
      email: true,
      push: true,
      maintenance_reminders: true,
      recall_alerts: true,
      document_expiration: true,
    },
    created_at: '',
  });

  // Debounced input handler
  const debouncedInputChange = useDebouncedCallback((name: string, value: string) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
  }, 300);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) {
        throw new Error('User ID is required');
      }

      // Get user profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        // Type assertion for notification_preferences since it comes from Json type
        const notificationPrefs = typeof data.notification_preferences === 'object' && 
          data.notification_preferences !== null ? 
          data.notification_preferences as {
            email: boolean;
            push: boolean;
            maintenance_reminders: boolean;
            recall_alerts: boolean;
            document_expiration: boolean;
          } : {
            email: true,
            push: true,
            maintenance_reminders: true,
            recall_alerts: true,
            document_expiration: true,
          };

        setProfile({
          ...data,
          email: user?.email || '',
          preferred_units: (data.preferred_units as 'imperial' | 'metric') || 'imperial',
          notification_preferences: notificationPrefs,
        });
        
        // Set avatar preview if exists
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while fetching your profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Full form validation
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!profile.first_name || !validateName(profile.first_name)) {
      errors.first_name = 'First name is required and must be valid.';
    }
    if (!profile.last_name || !validateName(profile.last_name)) {
      errors.last_name = 'Last name is required and must be valid.';
    }
    if (profile.phone_number && !validatePhoneNumber(profile.phone_number)) {
      errors.phone_number = 'Please enter a valid phone number.';
    }
    if (!profile.email || !validateEmail(profile.email)) {
      errors.email = 'Email is required and must be valid.';
    }
    return errors;
  };

  // On input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormTouched((prev) => ({ ...prev, [name]: true }));
    debouncedInputChange(name, value);
    // Validate on change
    setFormErrors((prev) => ({ ...prev, ...validateForm() }));
  };

  // On blur, validate field
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setFormTouched((prev) => ({ ...prev, [name]: true }));
    setFormErrors((prev) => ({ ...prev, ...validateForm() }));
  };

  const handleNotificationChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // Check push notification support when enabling push notifications
    if (name === 'push' && checked) {
      const isSupported = await checkPushNotificationSupport();
      if (!isSupported) return;
    }
    
    setProfile((prev) => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [name]: checked,
      },
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview with size optimization
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 200;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setAvatarPreview(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null;
    
    try {
      // Upload to storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, avatarFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('An error occurred while uploading avatar');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched({ first_name: true, last_name: true, email: true, phone_number: true });
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors in the form.');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to update your profile');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      let avatarUrl = profile.avatar_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          avatar_url: avatarUrl,
          phone_number: profile.phone_number,
          preferred_units: profile.preferred_units,
          notification_preferences: profile.notification_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setSuccess('Profile updated successfully');
      
      // Clear avatar file after successful upload
      setAvatarFile(null);
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while updating your profile');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Navigate to login page after sign out
      navigate('/login');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred while signing out');
      }
      setLoading(false);
    }
  };

  // Add phone number validation
  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  };

  // Add push notification support check
  const checkPushNotificationSupport = async () => {
    if (!('Notification' in window)) {
      setProfile((prev) => ({
        ...prev,
        notification_preferences: {
          ...prev.notification_preferences,
          push: false,
        },
      }));
      setError('Push notifications are not supported in your browser');
      return false;
    }
    
    if (Notification.permission === 'denied') {
      setProfile((prev) => ({
        ...prev,
        notification_preferences: {
          ...prev.notification_preferences,
          push: false,
        },
      }));
      setError('Push notifications are blocked. Please enable them in your browser settings.');
      return false;
    }
    
    return true;
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">
          Please log in to view your profile
        </h2>
        <button
          onClick={() => navigate('/login')}
          className="btn-primary"
        >
          Log In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>
      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4" role="alert">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4" role="status">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{success}</h3>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-8" aria-label="Profile form">
          {/* Avatar section */}
          <div className="flex flex-col items-center space-y-4 w-full sm:w-1/3">
            <label htmlFor="avatar" className="block text-md font-medium text-gray-900 mb-2">Profile Photo</label>
            <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </div>
            <label htmlFor="avatar" className="btn-secondary cursor-pointer" tabIndex={0} aria-label="Change profile photo">
              Choose File
              <input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
                aria-label="Upload profile photo"
              />
            </label>
          </div>
          {/* Profile details */}
          <div className="flex-1 space-y-6 w-full sm:w-2/3">
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">Email</label>
                <div className="mt-2">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    disabled
                    className="form-input bg-gray-50"
                    aria-label="Email address"
                  />
                  <p className="text-xs text-gray-500 mt-1">To change your email, please contact support</p>
                  {formTouched.email && formErrors.email && <span className="text-xs text-red-600">{formErrors.email}</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="first_name" className="block text-sm font-medium leading-6 text-gray-900">First Name</label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={profile.first_name || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="form-input"
                    aria-label="First name"
                    aria-invalid={!!formErrors.first_name}
                    aria-describedby="first_name-error"
                  />
                  {formTouched.first_name && formErrors.first_name && <span id="first_name-error" className="text-xs text-red-600">{formErrors.first_name}</span>}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="last_name" className="block text-sm font-medium leading-6 text-gray-900">Last Name</label>
                <div className="mt-2">
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={profile.last_name || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="form-input"
                    aria-label="Last name"
                    aria-invalid={!!formErrors.last_name}
                    aria-describedby="last_name-error"
                  />
                  {formTouched.last_name && formErrors.last_name && <span id="last_name-error" className="text-xs text-red-600">{formErrors.last_name}</span>}
                </div>
              </div>
              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium leading-6 text-gray-900">Phone Number</label>
                <div className="mt-2">
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={profile.phone_number || ''}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className="form-input"
                    aria-label="Phone number"
                    aria-invalid={!!formErrors.phone_number}
                    aria-describedby="phone_number-error"
                  />
                  {formTouched.phone_number && formErrors.phone_number && <span id="phone_number-error" className="text-xs text-red-600">{formErrors.phone_number}</span>}
                </div>
              </div>
              <div>
                <label htmlFor="preferred_units" className="block text-sm font-medium leading-6 text-gray-900">Preferred Units</label>
                <div className="mt-2">
                  <select
                    id="preferred_units"
                    name="preferred_units"
                    value={profile.preferred_units}
                    onChange={handleInputChange}
                    className="form-input"
                    aria-label="Preferred units"
                  >
                    <option value="imperial">Imperial (miles, gallons)</option>
                    <option value="metric">Metric (kilometers, liters)</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Notification Preferences */}
            <fieldset className="mt-6" aria-labelledby="notification-preferences-label">
              <legend id="notification-preferences-label" className="text-base font-semibold leading-7 text-gray-900">Notification Preferences</legend>
              <p className="mt-1 text-sm leading-6 text-gray-600">Choose how and when you'd like to be notified</p>
              <div className="mt-4 space-y-4">
                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="email-notifications"
                      name="email"
                      type="checkbox"
                      checked={profile.notification_preferences.email}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="email-notifications" className="font-medium text-gray-900">
                      Email Notifications
                    </label>
                    <p className="text-gray-500">Receive updates via email</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="push-notifications"
                      name="push"
                      type="checkbox"
                      checked={profile.notification_preferences.push}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="push-notifications" className="font-medium text-gray-900">
                      Push Notifications
                    </label>
                    <p className="text-gray-500">Receive push notifications on your devices</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="maintenance-reminders"
                      name="maintenance_reminders"
                      type="checkbox"
                      checked={profile.notification_preferences.maintenance_reminders}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="maintenance-reminders" className="font-medium text-gray-900">
                      Maintenance Reminders
                    </label>
                    <p className="text-gray-500">Get notified about upcoming maintenance</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="recall-alerts"
                      name="recall_alerts"
                      type="checkbox"
                      checked={profile.notification_preferences.recall_alerts}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="recall-alerts" className="font-medium text-gray-900">
                      Recall Alerts
                    </label>
                    <p className="text-gray-500">Get notified about new recalls for your vehicles</p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="flex h-6 items-center">
                    <input
                      id="document-expiration"
                      name="document_expiration"
                      type="checkbox"
                      checked={profile.notification_preferences.document_expiration}
                      onChange={handleNotificationChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-600"
                    />
                  </div>
                  <div className="ml-3 text-sm leading-6">
                    <label htmlFor="document-expiration" className="font-medium text-gray-900">
                      Document Expiration
                    </label>
                    <p className="text-gray-500">Get notified before documents expire</p>
                  </div>
                </div>
              </div>
            </fieldset>
            <div className="border-t border-gray-200 pt-6 flex justify-between">
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-danger"
                aria-label="Sign out"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                aria-label="Save changes"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
