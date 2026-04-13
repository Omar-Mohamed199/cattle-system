import React from 'react';
const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{ 
      backgroundColor: '#fff5f5', 
      color: 'var(--danger)', 
      padding: '1rem', 
      borderRadius: 'var(--radius-md)', 
      border: '1px solid #feb2b2',
      marginBottom: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center'
    }}>
      {message}
    </div>
  );
};
export default ErrorMessage;
