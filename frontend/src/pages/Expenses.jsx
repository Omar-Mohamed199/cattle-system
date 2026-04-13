import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const socket = useSocket();

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get('/expenses');
      setExpenses(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء تحميل المصروفات');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      const handleUpdate = () => fetchData(false);
      socket.on('data_updated', handleUpdate);
      return () => socket.off('data_updated', handleUpdate);
    }
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenses', form);
      setIsModalOpen(false);
      setForm({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert('خطأ في إضافة المصروف: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteExpense = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      try {
        await api.delete(`/expenses/${id}`);
      } catch (err) {
        alert('خطأ في حذف المصروف');
      }
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">المصروفات العامة</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> تسجيل مصروف
        </button>
      </div>

      <ErrorMessage message={error} />

      {isModalOpen && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <h3 style={{marginBottom: '1rem'}}>تسجيل مصروف جديد</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>المبلغ (ج.م)</label>
                <input type="number" className="input-control" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>البيان / الوصف</label>
                <input type="text" className="input-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>التاريخ</label>
                <input type="date" className="input-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>حفظ</button>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{padding: 0, overflow: 'hidden'}}>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>البيان</th>
              <th>المبلغ</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr><td colSpan="4" style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>لا توجد مصروفات مسجلة</td></tr>
            )}
            {expenses.map(expense => (
              <tr key={expense._id}>
                <td>{new Date(expense.date).toLocaleDateString('ar-EG')}</td>
                <td>{expense.description}</td>
                <td style={{color: 'var(--danger)', fontWeight: 'bold'}}>{expense.amount.toLocaleString('ar-EG')} ج.م</td>
                <td>
                  <button className="btn btn-danger" style={{padding: '0.25rem 0.5rem'}} onClick={() => deleteExpense(expense._id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Expenses;
