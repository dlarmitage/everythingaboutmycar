import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
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
  preferred_currency: string | null;
  notification_preferences: {
    email: boolean;
    push: boolean;
    maintenance_reminders: boolean;
    recall_alerts: boolean;
    document_expiration: boolean;
  };
  created_at: string;
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingProfileData, setPendingProfileData] = useState<UserProfile | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    first_name: null,
    last_name: null,
    avatar_url: null,
    phone_number: null,
    preferred_units: 'imperial',
    preferred_currency: 'USD',
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
    if (open && user) {
      fetchUserProfile();
    }
  }, [open, user]);

  // Track changes for unsaved changes detection
  useEffect(() => {
    if (originalProfile) {
      const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile) || avatarFile !== null;
      setHasUnsavedChanges(hasChanges);
      if (hasChanges) {
        setPendingProfileData(profile);
      } else {
        setPendingProfileData(null);
      }
    }
  }, [profile, originalProfile, avatarFile]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setHasUnsavedChanges(false);
      setShowUnsavedChangesDialog(false);
      setPendingProfileData(null);
    } else {
      // Reset all state when modal closes
      setHasUnsavedChanges(false);
      setShowUnsavedChangesDialog(false);
      setPendingProfileData(null);
      setError(null);
      setSuccess(null);
      setAvatarFile(null);
    }
  }, [open]);
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

        const profileData = {
          ...data,
          email: user?.email || '',
          preferred_units: ((data.preferred_units === 'imperial' || data.preferred_units === 'metric') ? data.preferred_units : 'imperial') as 'imperial' | 'metric',
          notification_preferences: notificationPrefs
        };

        setProfile(profileData);
        setOriginalProfile(profileData);
        
        // If avatar URL exists, set it as preview
        if (profileData.avatar_url) {
          const { data: avatarData } = supabase.storage
            .from('documents')
            .getPublicUrl(profileData.avatar_url);
            
          if (avatarData?.publicUrl) {
            setAvatarPreview(avatarData.publicUrl);
          }
        }
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
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
    const file = e.target.files?.[0];
    if (file) {
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
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, avatarFile, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error: any) {
      setError(`Error uploading avatar: ${error.message}`);
      return null;
    }
  };
  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!user?.id) {
        throw new Error('User ID is required');
      }

      // First upload avatar if there's a new one
      let avatarPath = profile.avatar_url;
      if (avatarFile) {
        avatarPath = await uploadAvatar();
        if (!avatarPath) {
          throw new Error('Failed to upload avatar');
        }
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          preferred_units: profile.preferred_units,
          preferred_currency: profile.preferred_currency,
          avatar_url: avatarPath,
          notification_preferences: profile.notification_preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update original profile to reflect saved changes
      setOriginalProfile({
        ...profile,
        avatar_url: avatarPath,
      });
      
      // Clear avatar file since it's been uploaded
      setAvatarFile(null);
      
      // Update profile with new avatar path
      setProfile(prev => ({
        ...prev,
        avatar_url: avatarPath,
      }));

      setSuccess('Profile updated successfully');
      setHasUnsavedChanges(false);
      setPendingProfileData(null);
    } catch (error: any) {
      setError(`Error updating profile: ${error.message}`);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      onClose();
    }
  };

  // Handle saving pending changes
  const handleSavePendingChanges = async () => {
    await handleSave();
    if (!error) {
      onClose();
      setShowUnsavedChangesDialog(false);
    }
  };

  // Handle discarding changes
  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false);
    setPendingProfileData(null);
    setShowUnsavedChangesDialog(false);
    onClose();
  };
  if (loading) {
    return (
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    <span className="ml-3 text-sm text-gray-600">Loading profile...</span>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  return (
    <Fragment>
      {/* Main Profile Modal */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 max-h-[80vh] overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Profile Settings
                    </Dialog.Title>
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={handleClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="mt-6">
                    {error && (
                      <div className="mb-4 rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                      </div>
                    )}

                    {success && (
                      <div className="mb-4 rounded-md bg-green-50 p-4">
                        <div className="text-sm text-green-700">{success}</div>
                      </div>
                    )}

                    <form className="space-y-6">
                      {/* Top Section - Avatar on left, Name fields on right */}
                      <div className="flex flex-col sm:flex-row gap-6">
                        {/* Avatar Section */}
                        <div className="sm:w-1/3">
                          <label className="block text-sm font-medium leading-6 text-gray-900">
                            Profile Photo
                          </label>
                          <div className="mt-2 flex flex-col items-center gap-y-3">
                            {avatarPreview ? (
                              <img
                                className="h-24 w-24 rounded-full object-cover"
                                src={avatarPreview}
                                alt="Avatar preview"
                              />
                            ) : (
                              <UserCircleIcon className="h-24 w-24 text-gray-300" aria-hidden="true" />
                            )}
                            <button
                              type="button"
                              onClick={() => document.getElementById('avatar-upload')?.click()}
                              className="mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                              Choose File
                            </button>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                        
                        {/* Name Fields */}
                        <div className="sm:w-2/3 space-y-4">
                          {/* First Name */}
                          <div>
                            <label htmlFor="first_name" className="block text-sm font-medium leading-6 text-gray-900">
                              First Name
                            </label>
                            <div className="mt-2">
                              <input
                                type="text"
                                id="first_name"
                                name="first_name"
                                value={profile.first_name || ''}
                                onChange={handleInputChange}
                                className="form-input w-full"
                              />
                            </div>
                          </div>

                          {/* Last Name */}
                          <div>
                            <label htmlFor="last_name" className="block text-sm font-medium leading-6 text-gray-900">
                              Last Name
                            </label>
                            <div className="mt-2">
                              <input
                                type="text"
                                id="last_name"
                                name="last_name"
                                value={profile.last_name || ''}
                                onChange={handleInputChange}
                                className="form-input w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                        {/* Email and Phone Number in same row */}
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                              Email
                            </label>
                            <div className="mt-2">
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={profile.email}
                                disabled
                                className="form-input bg-gray-50 text-gray-500 cursor-not-allowed w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="phone_number" className="block text-sm font-medium leading-6 text-gray-900">
                              Phone Number
                            </label>
                            <div className="mt-2">
                              <input
                                type="tel"
                                id="phone_number"
                                name="phone_number"
                                value={profile.phone_number || ''}
                                onChange={handleInputChange}
                                className="form-input w-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Preferred Units and Currency in same row */}
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                          <div>
                            <label htmlFor="preferred_units" className="block text-sm font-medium text-gray-700 mb-1">
                              Preferred Units
                            </label>
                            <select
                              id="preferred_units"
                              name="preferred_units"
                              className="form-select w-full"
                              value={profile.preferred_units}
                              onChange={handleInputChange}
                            >
                              <option value="imperial">Imperial (miles, gallons, °F)</option>
                              <option value="metric">Metric (km, liters, °C)</option>
                            </select>
                          </div>
                          <div>
                            <label htmlFor="preferred_currency" className="block text-sm font-medium text-gray-700 mb-1">
                              Preferred Currency
                            </label>
                            <select
                              id="preferred_currency"
                              name="preferred_currency"
                              className="form-select w-full"
                              value={profile.preferred_currency || 'USD'}
                              onChange={handleInputChange}
                            >
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="CAD">CAD ($)</option>
                              <option value="AUD">AUD ($)</option>
                              <option value="JPY">JPY (¥)</option>
                              <option value="CNY">CNY (¥)</option>
                              <option value="INR">INR (₹)</option>
                            </select>
                          </div>
                        </div>
                      
                      {/* Notification Preferences */}
                      <div>
                        <h4 className="text-sm font-medium leading-6 text-gray-900">Notification Preferences</h4>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
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
                              <p className="text-gray-500">Receive notifications via email</p>
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
                              <p className="text-gray-500">Be alerted about important vehicle recalls</p>
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
                              <p className="text-gray-500">Reminders for expiring insurance, registration, etc.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-6 border-t border-gray-200">
                        {/* Footer content removed - no buttons needed */}
                      </div>
                    </form>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Unsaved Changes Dialog */}
      {showUnsavedChangesDialog && (
        <Transition.Root show={showUnsavedChangesDialog} as={Fragment}>
          <Dialog as="div" className="relative z-20" onClose={handleDiscardChanges}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Unsaved Changes
                        </Dialog.Title>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">
                            You have unsaved changes. Do you want to save them before closing?
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="button"
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleSavePendingChanges}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                        onClick={handleDiscardChanges}
                      >
                        Discard Changes
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      )}
    </Fragment>
  );
}
