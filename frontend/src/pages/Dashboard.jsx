import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { BookOpen, DollarSign, Receipt, CreditCard } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    totalCows: 0,
    totalExpectedRevenue: 0,
    totalExpenses: 0,
    totalPaymentsReceived: 0,
    totalOutstanding: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const socket = useSocket();

  const fetchMetrics = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/dashboard');
      setMetrics(res.data || {
        totalCows: 0,
        totalExpectedRevenue: 0,
        totalExpenses: 0,
        totalPaymentsReceived: 0,
        totalOutstanding: 0
      });
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard metrics', err);
      setError(err.friendlyMessage || 'حدث خطأ أثناء تحميل بيانات لوحة القيادة');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    if (socket) {
      const handleUpdate = () => fetchMetrics(false);
      socket.on('data_updated', handleUpdate);
      return () => {
        socket.off('data_updated', handleUpdate);
      };
    }
  }, [socket]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">لوحة القيادة</h2>
      </div>

      <ErrorMessage message={error} />

      <div className="grid-cards">
        <div className="card stat-card border-r-4" style={{borderRight: '4px solid var(--primary-color)'}}>
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-details">
            <h3>إجمالي العجول</h3>
            <p>{(metrics.totalCows || 0)}</p>
          </div>
        </div>

        <div className="card stat-card" style={{borderRight: '4px solid #3182CE'}}>
          <div className="stat-icon" style={{backgroundColor: '#EBF8FF', color: '#3182CE'}}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>الإيرادات المتوقعة</h3>
            <p>{(metrics.totalExpectedRevenue || 0).toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>

        <div className="card stat-card" style={{borderRight: '4px solid var(--success)'}}>
          <div className="stat-icon" style={{backgroundColor: '#C6F6D5', color: 'var(--success)'}}>
            <CreditCard size={24} />
          </div>
          <div className="stat-details">
            <h3>المدفوعات المستلمة</h3>
            <p>{(metrics.totalPaymentsReceived || 0).toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>

        <div className="card stat-card" style={{borderRight: '4px solid var(--warning)'}}>
          <div className="stat-icon" style={{backgroundColor: '#FEEBC8', color: 'var(--warning)'}}>
            <DollarSign size={24} />
          </div>
          <div className="stat-details">
            <h3>المبالغ المتبقية</h3>
            <p>{(metrics.totalOutstanding || 0).toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>

        <div className="card stat-card" style={{borderRight: '4px solid var(--danger)'}}>
          <div className="stat-icon" style={{backgroundColor: '#FED7D7', color: 'var(--danger)'}}>
            <Receipt size={24} />
          </div>
          <div className="stat-details">
            <h3>إجمالي المصروفات</h3>
            <p>{(metrics.totalExpenses || 0).toLocaleString('ar-EG')} ج.م</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
