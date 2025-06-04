import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppContextType, Vehicle, Profile, MaintenanceRecord, Document, RecallNotice, ServiceRecord, ServiceItem } from '../types';
import { supabase } from '../services/supabase';
import { getServiceRecords, getServiceItems } from '../services/serviceRecordService';

const AppContext = createContext<AppContextType | undefined>(undefined);

type AppProviderProps = {
  children: ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recallNotices, setRecallNotices] = useState<RecallNotice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for authenticated user
    const checkUser = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            // Check if the table doesn't exist
            if (profileError.code === '42P01') {
              // Use session data for user since we can't access the profiles table
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                first_name: session.user.user_metadata?.first_name || null,
                last_name: session.user.user_metadata?.last_name || null,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                notification_preferences: {}
              });
            }
            // If profile doesn't exist, create it
            else if (profileError.code === 'PGRST116') {
              const newProfile = {
                id: session.user.id,
                email: session.user.email || '', // Ensure email is never undefined
                first_name: session.user.user_metadata?.first_name || '',
                last_name: session.user.user_metadata?.last_name || '',
                created_at: new Date().toISOString()
              };
              
              // Fix TypeScript error by ensuring we're passing a properly typed object
              const { data: createdProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: newProfile.id,
                  email: newProfile.email,
                  first_name: newProfile.first_name,
                  last_name: newProfile.last_name,
                  created_at: newProfile.created_at,
                  // Add required fields with default values
                  avatar_url: null,
                  updated_at: new Date().toISOString(),
                  notification_preferences: {}
                })
                .select()
                .single();
                  
              if (createError) {
                // Even if we can't create a profile, set the user to prevent infinite loading
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  first_name: null,
                  last_name: null,
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  notification_preferences: {}
                });
              } else {
                setUser(createdProfile);
                await refreshVehicles();
              }
            } else {
              // For other errors, still set the user to prevent infinite loading
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                first_name: null,
                last_name: null,
                avatar_url: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                notification_preferences: {}
              });
            }
          } else {
            setUser(profile);
            await refreshVehicles();
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        // Ensure loading state is cleared even on error
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Set a timeout to ensure loading state doesn't get stuck
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    checkUser();
    
    return () => clearTimeout(loadingTimeout);

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setIsLoading(true);
          
          try {
            // Fetch user profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              // Check if the table doesn't exist
              if (profileError.code === '42P01') {
                // Use session data for user since we can't access the profiles table
                setUser({
                  id: session.user.id,
                  email: session.user.email || '',
                  first_name: session.user.user_metadata?.first_name || null,
                  last_name: session.user.user_metadata?.last_name || null,
                  avatar_url: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  notification_preferences: {}
                });
                await refreshVehicles();
              }
              // If profile doesn't exist, create it
              else if (profileError.code === 'PGRST116') {
                const newProfile = {
                  id: session.user.id,
                  email: session.user.email,
                  first_name: session.user.user_metadata?.first_name || '',
                  last_name: session.user.user_metadata?.last_name || '',
                  created_at: new Date().toISOString()
                };
                
                const { data: createdProfile, error: createError } = await supabase
                  .from('profiles')
                  .insert([newProfile])
                  .select()
                  .single();
                  
                if (createError) {
                  // Even if we can't create a profile, set the user to prevent infinite loading
                  setUser({
                    id: session.user.id,
                    email: session.user.email || '',
                    first_name: null,
                    last_name: null,
                    avatar_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    notification_preferences: {}
                  });
                } else {
                  setUser(createdProfile);
                  await refreshVehicles();
                }
              }
            } else {
              setUser(profile);
              await refreshVehicles();
            }
          } catch (error) {
            // Ensure loading state is cleared even on error
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setVehicles([]);
          setSelectedVehicle(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshVehicles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setVehicles(data || []);
      
      // Update selected vehicle if it's in the list
      if (selectedVehicle) {
        const updatedSelectedVehicle = data?.find(v => v.id === selectedVehicle.id);
        if (updatedSelectedVehicle) {
          setSelectedVehicle(updatedSelectedVehicle);
        } else if (data && data.length > 0) {
          setSelectedVehicle(data[0]);
        } else {
          setSelectedVehicle(null);
        }
      } else if (data && data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (error) {
      // Error handled silently to prevent app crashes
    }
  };

  const refreshMaintenanceRecords = async () => {
    if (!selectedVehicle) return;
    
    try {
      const { data, error } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('vehicle_id', selectedVehicle.id)
        .order('service_date', { ascending: false });
      
      if (error) throw error;
      
      setMaintenanceRecords(data || []);
    } catch (error) {
      // Error handled silently to prevent app crashes
      setMaintenanceRecords([]);
    }
  };
  
  const refreshServiceRecords = async () => {
    if (!selectedVehicle) return;
    
    try {
      // Get all service records for the selected vehicle
      const records = await getServiceRecords(selectedVehicle.id);
      setServiceRecords(records);
      
      // Get all service items for these records
      if (records.length > 0) {
        let allItems: ServiceItem[] = [];
        for (const record of records) {
          const items = await getServiceItems(record.id);
          allItems = [...allItems, ...items];
        }
        setServiceItems(allItems);
      } else {
        setServiceItems([]);
      }
    } catch (error) {
      console.error('Error fetching service records:', error);
      setServiceRecords([]);
      setServiceItems([]);
    }
  };

  const refreshDocuments = async () => {
    if (!selectedVehicle) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('vehicle_id', selectedVehicle.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      // Error handled silently to prevent app crashes
      setDocuments([]);
    }
  };

  const refreshRecallNotices = async () => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('recall_notices')
        .select('*');
      
      // If a specific vehicle is selected, filter by that vehicle
      if (selectedVehicle) {
        query = query.eq('vehicle_id', selectedVehicle.id);
      } else {
        // Otherwise, get recalls for all vehicles owned by the user
        const vehicleIds = vehicles.map(v => v.id);
        if (vehicleIds.length > 0) {
          query = query.in('vehicle_id', vehicleIds);
        }
      }
      
      const { data, error } = await query.order('recall_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching recall notices:', error);
        throw error;
      }
      
      setRecallNotices(data || []);
    } catch (error) {
      console.error('Error in refreshRecallNotices:', error);
      setRecallNotices([]);
    }
  };

  const value: AppContextType = {
    user,
    setUser,
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    maintenanceRecords,
    serviceRecords,
    serviceItems,
    documents,
    recallNotices,
    refreshVehicles,
    refreshMaintenanceRecords,
    refreshServiceRecords,
    refreshDocuments,
    refreshRecallNotices,
    isLoading,
  };
  
  // Update data when selected vehicle changes
  useEffect(() => {
    if (selectedVehicle) {
      refreshMaintenanceRecords();
      refreshServiceRecords();
      refreshDocuments();
      refreshRecallNotices();
    } else {
      setMaintenanceRecords([]);
      setServiceRecords([]);
      setServiceItems([]);
      setDocuments([]);
      setRecallNotices([]);
    }
  }, [selectedVehicle]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
