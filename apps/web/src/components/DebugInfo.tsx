export function DebugInfo() {
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>Environment: {import.meta.env.MODE}</div>
      <div>VITE_ENV: {import.meta.env.VITE_ENV}</div>
      <div>Firebase API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing'}</div>
      <div>User Agent: {navigator.userAgent.substring(0, 50)}...</div>
      <div>Timestamp: {new Date().toISOString()}</div>
    </div>
  );
}
