import { useState } from 'react';

function AppTest() {
  const [message, setMessage] = useState('¡Sistema Scout funcionando!');

  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '24px' }}>
        Sistema de Gestión Boy Scout - Grupo Scout Lima 12
      </h1>
      <p style={{ color: '#666', fontSize: '16px', marginTop: '20px' }}>
        {message}
      </p>
      <button 
        onClick={() => setMessage('¡React está funcionando correctamente!')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          marginTop: '10px',
          cursor: 'pointer'
        }}
      >
        Probar React
      </button>
    </div>
  );
}

export default AppTest;