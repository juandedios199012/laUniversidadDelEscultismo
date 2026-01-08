// Componente de prueba simple
export default function AppTest() {
  return (
    <div style={{
      padding: '40px',
      fontSize: '24px',
      color: 'white',
      backgroundColor: '#1a1a2e',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>✅ React Funcionando</h1>
      <p>Si ves esto, React está cargando correctamente.</p>
      <p>Hora: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
