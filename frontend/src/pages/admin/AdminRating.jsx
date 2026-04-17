import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Star, TrendingUp, BarChart2, Award } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminRating = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    avgRating: 0,
    totalFiveStars: 0,
    passingPercentage: 0
  });
  
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('admin')).token;
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/results`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const results = res.data;
        if (results.length === 0) {
          setLoading(false);
          return;
        }

        let totalPerc = 0;
        let passCount = 0;
        let starSum = 0;
        let fiveStarCount = 0;

        const monthlyData = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Ensure the last 6 months are visually seeded so the chart isn't empty sizing
        const d = new Date();
        for(let i = 5; i >= 0; i--) {
            const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
            monthlyData[monthNames[m.getMonth()]] = { sum: 0, count: 0 };
        }

        results.forEach(r => {
          const max = r.exam?.questions?.length || 1;
          const perc = (r.score / max) * 100;
          
          totalPerc += perc;
          if (perc >= 50) passCount++;
          
          let stars = 1;
          if (perc >= 90) stars = 5;
          else if (perc >= 80) stars = 4;
          else if (perc >= 60) stars = 3;
          else if (perc >= 50) stars = 2;
          
          starSum += stars;
          if (stars === 5) fiveStarCount++;

          const rMonth = monthNames[new Date(r.submittedAt).getMonth()];
          if (monthlyData[rMonth]) {
             monthlyData[rMonth].sum += perc;
             monthlyData[rMonth].count++;
          }
        });

        // Computed Stats
        setStats({
          avgRating: (starSum / results.length).toFixed(1),
          totalFiveStars: fiveStarCount,
          passingPercentage: ((passCount / results.length) * 100).toFixed(0)
        });

        // Computed Chart Data
        const labels = Object.keys(monthlyData);
        const dataPoints = labels.map(month => {
          const mData = monthlyData[month];
          return mData.count > 0 ? (mData.sum / mData.count).toFixed(1) : 0;
        });

        setChartData({
          labels,
          datasets: [
            {
              label: 'Average Score (%)',
              data: dataPoints,
              backgroundColor: 'rgba(2, 136, 209, 0.8)', // Primary brand color
              borderColor: 'rgba(2, 136, 209, 1)',
              borderWidth: 1,
              borderRadius: 6,
            }
          ]
        });

      } catch (err) {
        console.error('Failed to load rating metrics', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { min: 0, max: 100 }
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Ratings & Analytics</h1>
        <p style={{ color: 'var(--text-muted)' }}>Monitor global star ratings, pass metrics, and monthly performance trends.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-muted)' }}>
            <Star color="#fbbf24" fill="#fbbf24" /> <span style={{ fontWeight: 600 }}>Global Avg Rating</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            {loading ? '-' : stats.avgRating} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-muted)' }}>
            <Award color="#9c27b0" /> <span style={{ fontWeight: 600 }}>5-Star Honors</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>
             {loading ? '-' : stats.totalFiveStars} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>students</span>
          </div>
        </div>

        <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', color: 'var(--text-muted)' }}>
            <TrendingUp color="#2e7d32" /> <span style={{ fontWeight: 600 }}>Global Pass Rate</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            {loading ? '-' : stats.passingPercentage}%
          </div>
        </div>
      </div>

      <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', height: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <BarChart2 color="var(--primary)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Monthly Performance Trajectory</h3>
        </div>
        
        <div style={{ height: '300px', width: '100%' }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Calculating historical trends...
            </div>
          ) : chartData.labels.length > 0 ? (
            <Bar options={chartOptions} data={chartData} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              No sufficient metrics tracked to generate trends.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminRating;
