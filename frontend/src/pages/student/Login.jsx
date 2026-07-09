import React from 'react';
import PublicLayout from '../../layouts/PublicLayout';
import StudentLoginForm from '../../components/student/StudentLoginForm';

const StudentLogin = () => {
  return (
    <PublicLayout>
      <div style={{
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background glowing orbs */}
        <div className="orb orb-orange" style={{ width: 500, height: 500, top: '10%', left: '-15%', opacity: 0.15 }} />
        <div className="orb orb-blue" style={{ width: 400, height: 400, bottom: '10%', right: '-10%', opacity: 0.1 }} />
        
        <StudentLoginForm isEmbedded={false} />
      </div>
    </PublicLayout>
  );
};

export default StudentLogin;
