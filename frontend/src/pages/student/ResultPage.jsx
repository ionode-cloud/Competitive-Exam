import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { CheckCircle, XCircle, Clock, Award, Star } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result } = location.state || {};
  const [rating, setRating] = useState(0);

  if (!result) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '20px' }}>
        <h2>No Result Data Found</h2>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  const chartData = {
    labels: ['English', 'Reasoning', 'Quant'],
    datasets: [
      {
        label: 'Score',
        data: [
          result.scoreBySection?.English || 0,
          result.scoreBySection?.Reasoning || 0,
          result.scoreBySection?.Quant || 0
        ],
        backgroundColor: ['#1976d2', '#9c27b0', '#2e7d32'],
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Subject-wise Performance', font: { size: 16 } }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', background: 'var(--bg-main)', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Exam Summary</h1>
        <p style={{ color: 'var(--text-muted)' }}>Congratulations! You have completed the test.</p>
      </div>

      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <StatCard icon={<Award color="#facc15" />} label="Total Score" value={result.score} sub={`out of ${result.totalMarks || 100}`} color="#fefce8" />
        <StatCard icon={<CheckCircle color="#22c55e" />} label="Correct" value={result.correct} sub="Questions" color="#f0fdf4" />
        <StatCard icon={<XCircle color="#ef4444" />} label="Wrong" value={result.wrong} sub="Questions" color="#fef2f2" />
        <StatCard icon={<Clock color="#3b82f6" />} label="Time Taken" value={Math.floor(result.timeTaken / 60) + 'm ' + (result.timeTaken % 60) + 's'} sub="Duration" color="#eff6ff" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        {/* Performance Chart */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Feedback Section */}
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <h3>Rate your experience</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                size={32} 
                fill={star <= rating ? '#facc15' : 'none'} 
                color="#facc15" 
                style={{ cursor: 'pointer' }}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Your feedback helps us improve our mock tests!</p>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>Back to Dashboard</button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="glass animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: color, border: 'none', display: 'flex', gap: '16px', alignItems: 'center' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  </div>
);

export default ResultPage;
