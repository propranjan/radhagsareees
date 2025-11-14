export default function Custom404() {
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>404 – Page not found</h1>
        <a href="/" style={{ display: 'inline-block', marginTop: '1rem', color: '#2563eb', textDecoration: 'underline' }}>Go back home</a>
      </div>
    </div>
  );
}
