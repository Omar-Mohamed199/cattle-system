import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { Plus, Trash2, Download, Search } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { exportToExcel } from '../utils/exportToExcel';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cows, setCows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ amount: '', customerId: '', cowId: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
  const [searchQuery, setSearchQuery] = useState('');
  const socket = useSocket();

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [payRes, custRes, cowsRes] = await Promise.all([
        api.get('/payments'),
        api.get('/customers'),
        api.get('/cows')
      ]);
      setPayments(payRes.data || []);
      setCustomers(custRes.data || []);
      setCows(cowsRes.data || []);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.friendlyMessage || 'حدث خطأ أثناء تحميل البيانات');
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
      const dataToSubmit = { ...form };
      if (!dataToSubmit.cowId) delete dataToSubmit.cowId;

      await api.post('/payments', dataToSubmit);
      setIsModalOpen(false);
      setForm({ amount: '', customerId: '', cowId: '', paymentMethod: 'cash', date: new Date().toISOString().split('T')[0] });
    } catch (err) {
      alert('خطأ في إضافة الدفعة: ' + (err.friendlyMessage || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const deletePayment = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) {
      try {
        await api.delete(`/payments/${id}`);
      } catch (err) {
        alert('خطأ في حذف الدفعة');
      }
    }
  };

  const filteredPayments = (payments || []).filter(p => {
    const query = searchQuery.toLowerCase();
    const customerName = p.customerId?.name?.toLowerCase() || '';
    const customerPhone = p.customerId?.phone || '';
    const cowNumber = p.cowId?.numberId?.toString() || '';
    const sheepNumber = p.sheepId?.numberId?.toString() || '';
    
    return customerName.includes(query) || 
           customerPhone.includes(query) || 
           cowNumber.includes(query) || 
           sheepNumber.includes(query);
  });

  const handleExport = () => {
    const data = filteredPayments.map(p => ({
      "التاريخ": new Date(p.date).toLocaleDateString('ar-EG'),
      "العميل": p.customerId?.name || "غير معروف",
      "رقم التليفون": p.customerId?.phone || "-",
      "المبلغ": p.amount,
      "طريقة الدفع": p.paymentMethod === 'transfer' ? 'تحويل بنكي' : 'كاش',
      "رقم العجل": p.cowId ? `#${p.cowId.numberId}` : '-',
      "رقم الخروف": p.sheepId ? `#${p.sheepId.numberId}` : '-'
    }));
    exportToExcel(data, "المدفوعات");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">إدارة المدفوعات (الأقساط)</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="بحث بالاسم، الهاتف، أو رقم الحيوان..." 
              style={{ paddingRight: '35px', width: '300px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={handleExport}>
            <Download size={18} /> تحميل Excel
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> تسجيل دفعة
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      {isModalOpen && (
        <div className="card" style={{marginBottom: '2rem'}}>
          <h3 style={{marginBottom: '1rem'}}>تسجيل دفعة جديدة</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
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
              <button type="submit" className="btn btn-primary" disabled={submitting}>حفظ</button>
              <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{padding: 0, overflowX: 'auto'}}>
        <table>
          <thead>
            <tr>
              <th>التاريخ</th>
              <th>العميل</th>
              <th>المبلغ</th>
              <th>طريقة الدفع</th>
              <th>مرتبط بـ (عجل/خروف)</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 && (
              <tr><td colSpan="6" style={{textAlign:'center', padding:'2rem', color:'var(--text-muted)'}}>لا توجد مدفوعات مطابقة للبحث</td></tr>
            )}
            {filteredPayments.map(payment => (
              <tr key={payment._id}>
                <td>{new Date(payment.date).toLocaleDateString('ar-EG')}</td>
                <td>
                  <div style={{display: 'flex', flexDirection: 'column'}}>
                    <span>{payment.customerId ? payment.customerId.name : 'غير معروف'}</span>
                    {payment.customerId?.phone && <small style={{color: 'var(--text-muted)', fontSize: '0.75rem'}}>{payment.customerId.phone}</small>}
                  </div>
                </td>
                <td style={{color: 'var(--success)', fontWeight: 'bold'}}>{payment.amount.toLocaleString('ar-EG')} ج.م</td>
                <td>{payment.paymentMethod === 'transfer' ? 'تحويل بنكي' : 'كاش'}</td>
                <td>
                  {payment.cowId && <span className="badge badge-warning" title="عجل">#{payment.cowId.numberId} (عجل)</span>}
                  {payment.sheepId && <span className="badge badge-primary" style={{backgroundColor: 'var(--primary-color)'}} title="خروف">#{payment.sheepId.numberId} (خروف)</span>}
                  {!payment.cowId && !payment.sheepId && '-'}
                </td>
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
