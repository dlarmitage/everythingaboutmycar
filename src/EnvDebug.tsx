import React, { useEffect, useState } from 'react';

const EnvDebug = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // Get all environment variables that start with VITE_
    const viteEnvVars: Record<string, string> = {};
    
    // Check if import.meta.env exists and log its structure
    console.log('import.meta.env:', import.meta.env);
    
    // Try to access specific environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    console.log('VITE_SUPABASE_URL:', supabaseUrl);
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'Set (hidden for security)' : 'Not Set');
    console.log('VITE_OPENAI_API_KEY:', openaiKey ? 'Set (hidden for security)' : 'Not Set');
    
    // Add them to our state object (but don't show the actual values for security)
    viteEnvVars['VITE_SUPABASE_URL'] = supabaseUrl || 'Not Set';
    viteEnvVars['VITE_SUPABASE_ANON_KEY'] = supabaseKey ? 'Set (hidden for security)' : 'Not Set';
    viteEnvVars['VITE_OPENAI_API_KEY'] = openaiKey ? 'Set (hidden for security)' : 'Not Set';
    
    setEnvVars(viteEnvVars);
  }, []);
  
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333' }}>Environment Variables Debug</h1>
      <p>Check the browser console for more detailed information.</p>
      
      <h2>Environment Variables:</h2>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Troubleshooting Steps:</h2>
        <ol>
          <li>Make sure your .env file is in the root directory of your project</li>
          <li>Verify that the .env file has the correct format (no spaces around = sign)</li>
          <li>Restart the development server with <code>npm run dev</code></li>
          <li>Try running <code>npm run build</code> to see if the environment variables are loaded during build</li>
          <li>Check if you need to configure Vite to load environment variables from a specific file</li>
        </ol>
      </div>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Next Steps:</h2>
        <button 
          onClick={() => window.location.reload()} 
          style={{
            padding: '0.5rem 1rem',
            background: '#4a90e2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          Reload Page
        </button>
        
        <button 
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
          }}
          style={{
            padding: '0.5rem 1rem',
            background: '#e24a4a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Clear Storage & Reload
        </button>
      </div>
    </div>
  );
};

export default EnvDebug;
