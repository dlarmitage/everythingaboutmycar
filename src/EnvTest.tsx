const EnvTest = () => {
  const envVars = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not Set',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Not Set'
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#333' }}>Environment Variables Test</h1>
      <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  );
};

export default EnvTest;
