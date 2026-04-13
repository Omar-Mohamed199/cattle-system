import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2 } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cows, setCows] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', customerId: '', cowId: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
  const socket = useSocket();

  const fetchData = async () => {
    try {
      const [payRes, custRes, cowsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/customers'),
        api.get('/cows')
      ]);
      setPayments(payRes.data);
      setCustomers(custRes.data);
      setCows(cowsRes.data);
    } catch (err) {
      console.error(err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('data_updated', fetchData);
      return () => socket.off('data_updated', fetchData);
    }
  }, [socket]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...form };
      if (!dataToSubmit.cowId) delete dataToSubmit.cowId; // Option to be null/undefined

      await api.post('/payments', dataToSubmit);
      setIsModalOpen(false);
      setForm({ amount: '', customerId: '', cowId: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert('خطأ في إضافة الدفعة: ' + (err.response?.data?.error || err.message));
    }
  };

  const deletePayment = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      await api.delete(`/payments/${id}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">إدارة المدفوعات (الأقساط)</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> تسجيل دفعة
        </button>
      </div>

      {isModalOpen && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <h3 style={{marginBottom: '1rem'}}>تسجيل دفعة جديدة</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>المبلغ (ج.م)</label>
                <input type="number" className="input-control" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>التاريخ</label>
                <input type="date" className="input-control" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
              </div>
              <div className="input-group">
                <label>العميل</label>
                <select className="input-control" value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} required>
                  <option value="">اختر عميل...</option>
                  {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>طريقة الدفع</label>
                <select className="input-control" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} required>
                  <option value="cash">كاش (نقدًا)</option>
                  <option value="transfer">تحويل بنكي / محفظة</option>
                </select>
              </div>
              <div className="input-group">
                <label>مرتبط بعجل *</label>
                <select className="input-control" value={form.cowId} onChange={e => setForm({...form, cowId: e.target.value})} required>
                  <option value="">اختر العجل...</option>
                  {cows.map(c => <option key={c._id} value={c._id}>عجل #{c.numberId}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
              <button type="submit" className="btn btn-primary">حفظ</button>
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
              <th>العميل</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>مرتبط بعجل</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td>{new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                <td>{payment.customerId ? payment.customerId.name : 'غير معروف'}</td>
                <td style={{color: 'var(--success)', fontWeight: 'bold'}}>{payment.amount} ج.م</td>
                <td>{payment.paymentMethod === 'transfer' ? 'تحويل بنكي' : 'كاش'}</td>
                <td>{payment.cowId ? <span className="badge badge-warning">#{payment.cowId.numberId}</span> : '-'}</td>
                <td>
                  <button className="btn btn-danger" style={{padding: '0.25rem 0.5rem'}} onClick={() => deletePayment(payment._id)}>
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

export default Payments;
