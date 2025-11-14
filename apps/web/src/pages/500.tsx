export default function Custom500() {
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>500 – Internal Server Error</h1>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>Please try again later.</p>
        <a href="/" style={{ display: 'inline-block', marginTop: '1rem', color: '#2563eb', textDecoration: 'underline' }}>Go back home</a>
      </div>
    </div>
  );
}
