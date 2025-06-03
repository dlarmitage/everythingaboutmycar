import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useApp } from '../context/AppContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
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

      // Get user profile from profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          ...data,
          email: user?.email || '',
          notification_preferences: data.notification_preferences || {
            email: true,
            push: true,
            maintenance_reminders: true,
            recall_alerts: true,
            document_expiration: true,
          },
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
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
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
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
        .from('user-avatars')
        .upload(filePath, avatarFile);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage
        .from('user-avatars')
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
          full_name: profile.full_name,
          avatar_url: avatarUrl,
          phone_number: profile.phone_number,
          preferred_units: profile.preferred_units,
          notification_preferences: profile.notification_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local user state
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          full_name: profile.full_name,
          avatar_url: avatarUrl,
        },
      });
      
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-600">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-card p-6 mb-6">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
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
          <div className="mb-6 rounded-md bg-green-50 p-4">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Avatar section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <svg
                      className="h-16 w-16"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="avatar"
                  className="btn-secondary cursor-pointer"
                >
                  Change Avatar
                  <input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            {/* Profile details */}
            <div className="flex-1 space-y-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Email
                  </label>
                  <div className="mt-2">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profile.email}
                      disabled
                      className="form-input bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      To change your email, please contact support
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="full_name"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Full Name
                  </label>
                  <div className="mt-2">
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={profile.full_name || ''}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Phone Number
                  </label>
                  <div className="mt-2">
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={profile.phone_number || ''}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="preferred_units"
                    className="block text-sm font-medium leading-6 text-gray-900"
                  >
                    Preferred Units
                  </label>
                  <div className="mt-2">
                    <select
                      id="preferred_units"
                      name="preferred_units"
                      value={profile.preferred_units}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="imperial">Imperial (miles, gallons)</option>
                      <option value="metric">Metric (kilometers, liters)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold leading-7 text-gray-900">
                  Notification Preferences
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Choose how and when you'd like to be notified
                </p>

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
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleSignOut}
                className="btn-danger"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
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
