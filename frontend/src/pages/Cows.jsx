import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { calculateCustomerFinances } from '../utils/calculations';
import { Save, Plus, Trash2, Box, Search, CreditCard, Download } from 'lucide-react';
import debounce from 'lodash/debounce';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { exportToExcel } from '../utils/exportToExcel';

const Cows = () => {
  const [cows, setCows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalState, setModalState] = useState({ type: null, data: null });

  const latestCows = useRef([]);
  const snapshot = useRef([]);
  const isDirty = useRef(false);
  const isSaving = useRef(false);
  const timeoutRef = useRef(null);
  
  const socket = useSocket();

  // Debounced search handler
  const updateSearch = useCallback(
    debounce((query) => {
      setDebouncedSearch(query);
    }, 300),
    []
  );

  useEffect(() => {
    updateSearch(searchQuery);
  }, [searchQuery, updateSearch]);

  // Keep latest cows referenced for unmount/beforeunload functions safely
  useEffect(() => {
    latestCows.current = cows;
  }, [cows]);

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [cowsRes, custRes, payRes] = await Promise.all([
        api.get('/cows'),
        api.get('/customers'),
        api.get('/payments')
      ]);
      setCustomers(custRes.data);
      setPayments(payRes.data);
      
      const loadedCows = (cowsRes.data || []).map(cow => ({
        id: Math.random().toString(36).substr(2, 9),
        dbId: cow._id,
        numberId: (cow.numberId || '').toString(),
        weight: (cow.weight || 0).toString(),
        partners: (cow.partners || []).map(p => ({
          id: Math.random().toString(36).substr(2, 9),
          customerId: p.customerId ? (p.customerId._id || p.customerId) : '',
          share: (p.share || 0).toString(),
          price: (p.price || 0).toString(),
          slaughterCostShare: (p.slaughterCostShare || 0).toString(),
        }))
      }));

      const finalCows = loadedCows.length > 0 ? loadedCows : [createEmptyCow()];
      setCows(finalCows);
      snapshot.current = JSON.parse(JSON.stringify(finalCows)); 
      isDirty.current = false;
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.friendlyMessage || 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    if (socket) {
      const handleDataUpdated = () => {
        if (!isDirty.current) fetchAllData(false);
      };
      socket.on('data_updated', handleDataUpdated);
      return () => socket.off('data_updated', handleDataUpdated);
    }
  }, [socket]);

  const formatPayload = (c) => ({
    dbId: c.dbId,
    numberId: Number(c.numberId),
    weight: Number(c.weight) || 0,
    partners: c.partners
      .filter(p => p.customerId.trim() !== '')
      .map(p => ({
        customerId: p.customerId,
        share: Number(p.share) || 0,
        price: Number(p.price) || 0,
        slaughterCostShare: Number(p.slaughterCostShare) || 0
      }))
  });

  const performSave = async () => {
    if (!isDirty.current || isSaving.current) return;
    
    isSaving.current = true;
    setSaveStatus('جاري الحفظ...');

    const currentCows = latestCows.current;

    try {
      const deletedCows = snapshot.current.filter(snap => snap.dbId && !currentCows.find(c => c.dbId === snap.dbId));
      const newCows = currentCows.filter(c => !c.dbId && c.numberId.toString().trim() !== '');
      const updatedCows = currentCows.filter(c => {
         if (!c.dbId || c.numberId.toString().trim() === '') return false;
         const snap = snapshot.current.find(s => s.dbId === c.dbId);
         if (!snap) return true;
         return JSON.stringify(c) !== JSON.stringify(snap);
      });

      const promises = [];

      for (const cow of deletedCows) {
        promises.push(api.delete(`/cows/${cow.dbId}`));
      }

      for (const cow of newCows) {
        const payload = formatPayload(cow);
        promises.push(api.post('/cows', payload).then(res => {
          cow.dbId = res.data._id;
        }));
      }

      for (const cow of updatedCows) {
        const payload = formatPayload(cow);
        promises.push(api.put(`/cows/${cow.dbId}`, payload));
      }

      await Promise.all(promises);

      snapshot.current = JSON.parse(JSON.stringify(currentCows));
      isDirty.current = false;
      
      setSaveStatus('تم الحفظ بنجاح ✅');
      setTimeout(() => { if (!isDirty.current) setSaveStatus(''); }, 3000);
    } catch (err) {
      setSaveStatus('خطأ في الحفظ!');
      console.error(err);
    } finally {
      isSaving.current = false;
    }
  };

  useEffect(() => {
    if (!isDirty.current) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setSaveStatus('يوجد تغييرات (سيتم الحفظ تلقائياً)...');
    timeoutRef.current = setTimeout(() => performSave(), 30000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [cows]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty.current) {
        performSave();
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (isDirty.current) performSave();
    };
  }, []);

  const markDirty = () => { isDirty.current = true; };
  const createEmptyPartner = () => ({ id: Math.random().toString(36).substr(2, 9), customerId: '', share: '', price: '', slaughterCostShare: '' });
  const createEmptyCow = () => ({ id: Math.random().toString(36).substr(2, 9), numberId: '', weight: '', dbId: null, partners: [] });
  const handleAddCow = () => { markDirty(); setCows([...cows, createEmptyCow()]); };
  const handleRemoveCow = (cowIdKey) => { if(window.confirm('هل أنت متأكد من حذف العجل؟')) { markDirty(); setCows(cows.filter(c => c.id !== cowIdKey)); } };
  const handleChangeCow = (cowIdKey, field, value) => { markDirty(); setCows(cows.map(c => c.id === cowIdKey ? { ...c, [field]: value } : c)); };
  const handleAddPartner = (cowIdKey) => { markDirty(); setCows(cows.map(c => c.id === cowIdKey ? { ...c, partners: [...c.partners, createEmptyPartner()] } : c)); };
  const handleRemovePartner = (cowIdKey, partnerIdKey) => { markDirty(); setCows(cows.map(c => c.id === cowIdKey ? { ...c, partners: c.partners.filter(p => p.id !== partnerIdKey) } : c)); };

  const handleChangePartner = (cowIdKey, partnerIdKey, field, value) => {
    if (field === 'customerId' && value === 'NEW') {
      setModalState({ type: 'CUSTOMER', data: { cowIdKey, partnerIdKey } });
      return;
    }
    markDirty();
    setCows(cows.map(c => {
      if (c.id === cowIdKey) {
        return { ...c, partners: c.partners.map(p => p.id === partnerIdKey ? { ...p, [field]: value } : p) };
      }
      return c;
    }));
  };

  const filteredCows = useMemo(() => {
    if (!debouncedSearch) return cows;
    const query = debouncedSearch.toLowerCase();
    return cows.filter(cow => {
      if (cow.numberId.toString().includes(query)) return true;
      for (let p of cow.partners) {
        const customer = customers.find(c => c._id === p.customerId);
        if (customer && (customer.name.toLowerCase().includes(query) || (customer.phone && customer.phone.includes(query)))) return true;
      }
      return false;
    });
  }, [cows, debouncedSearch, customers]);

  const handleExportExcel = () => {
    const data = filteredCows.flatMap(cow => {
      return cow.partners
        .filter(p => p.customerId)
        .map(p => {
          const fin = calculateCustomerFinances(cow.weight, p, cow.dbId, payments);
          const customer = customers.find(c => c._id === p.customerId);
          return {
            "رقم العجل": cow.numberId,
            "اسم العميل": customer ? customer.name : "غير معروف",
            "وزن العجل": cow.weight,
            "سعر الكجم": p.price,
            "إجمالي الحساب": fin.customerTotal,
            "المدفوع": fin.paidAmount,
            "المتبقي": fin.remaining
          };
        });
    });
    exportToExcel(data, "بيانات_العجول");
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <h2 className="page-title">إدارة العجول والعملاء</h2>
          <span style={{ fontSize: '0.85rem', color: saveStatus.includes('خطأ') ? 'var(--danger)' : saveStatus.includes('✅') ? 'var(--success)' : 'var(--warning-color)' }}>
            {saveStatus}
          </span>
        </div>
        
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <div className="input-group" style={{ marginBottom: 0, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="input-control" 
              placeholder="بحث برقم العجل، اسم أو هاتف العميل..." 
              style={{ paddingRight: '35px', width: '300px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={handleExportExcel}>
            <Download size={18} /> تحميل Excel
          </button>
          <button className="btn btn-outline" onClick={() => performSave(false)} disabled={!isDirty.current || isSaving.current}>
            <Save size={18} /> حفظ يدوي
          </button>
          <button className="btn btn-outline" onClick={handleAddCow}>
            <Plus size={18} /> إضافة عجل جديد
          </button>
        </div>
      </div>

      <ErrorMessage message={error} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {filteredCows.map(cow => (
          <CowCard 
            key={cow.id} 
            cow={cow} 
            customers={customers} 
            payments={payments}
            handleChangeCow={handleChangeCow}
            handleRemoveCow={handleRemoveCow}
            handleAddPartner={handleAddPartner}
            handleRemovePartner={handleRemovePartner}
            handleChangePartner={handleChangePartner}
            setModalState={setModalState}
          />
        ))}

        {filteredCows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '2px dashed #cbd5e0', borderRadius: '8px' }}>
            لا توجد بيانات مطابقة.
          </div>
        )}
      </div>

      {modalState.type === 'CUSTOMER' && <CustomerModal 
        onClose={() => setModalState({type: null, data: null})} 
        onSuccess={async (newId) => {
          const { cowIdKey, partnerIdKey } = modalState.data;
          await fetchAllData(false); 
          setCows(prev => prev.map(c => c.id === cowIdKey ? { ...c, partners: c.partners.map(p => p.id === partnerIdKey ? { ...p, customerId: newId } : p) } : c));
          markDirty();
          setModalState({type: null, data: null});
        }} 
      />}

      {modalState.type === 'PAYMENT' && <PaymentModal 
        cowId={modalState.data.cowId}
        customerId={modalState.data.customerId}
        onClose={() => setModalState({type: null, data: null})} 
        onSuccess={async () => {
          await fetchAllData(false);
          setModalState({type: null, data: null});
        }} 
      />}
    </div>
  );
};

// Extracted CowCard for better performance and readability
const CowCard = React.memo(({ cow, customers, payments, handleChangeCow, handleRemoveCow, handleAddPartner, handleRemovePartner, handleChangePartner, setModalState }) => {
  const calculations = useMemo(() => {
    let meat = 0;
    let total = 0;
    let slaughter = 0;
    
    const partnersFinances = cow.partners.map(p => {
      const f = calculateCustomerFinances(cow.weight, p, cow.dbId, payments);
      meat += f.totalBeforeSlaughter;
      total += f.customerTotal;
      slaughter += f.slaughterCostShare;
      return { ...p, finances: f };
    });

    return { partnersFinances, meat, total, slaughter };
  }, [cow.weight, cow.partners, cow.dbId, payments]);

  return (
    <div className="card" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '2px solid var(--primary-color)'}}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>رقم العجل:</label>
            <input type="number" className="input-control" style={{ width: '120px', fontWeight: 'bold' }} placeholder="#" value={cow.numberId} onChange={(e) => handleChangeCow(cow.id, 'numberId', e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>الوزن الإجمالي (كجم):</label>
            <input type="number" className="input-control" style={{ width: '150px' }} placeholder="الوزن الصافي" value={cow.weight} onChange={(e) => handleChangeCow(cow.id, 'weight', e.target.value)} />
          </div>
        </div>
        <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleRemoveCow(cow.id)} title="حذف العجل بالكامل">
          <Trash2 size={18} />
        </button>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
        <table style={{ width: '100%', minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>العميل</th>
              <th style={{ width: '80px' }}>النسبة (%)</th>
              <th style={{ width: '90px' }}>السعر/كجم</th>
              <th style={{ width: '100px' }}>تكلفة الذبح</th>
              <th style={{ backgroundColor: '#f7fafc', width: '90px' }}>وزن العميل</th>
              <th style={{ backgroundColor: '#f7fafc', width: '130px' }}>حساب العميل (بدون دبح)</th>
              <th style={{ backgroundColor: '#f7fafc', width: '120px' }}>إجمالي العميل</th>
              <th style={{ width: '130px' }}>المدفوع</th>
              <th style={{ backgroundColor: '#fff5f5', width: '120px' }}>المتبقي</th>
              <th style={{ width: '100px' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cow.partners.length === 0 && (
              <tr><td colSpan="10" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>لا يوجد عملاء مضافين.</td></tr>
            )}
            {calculations.partnersFinances.map(partner => (
              <tr key={partner.id}>
                <td>
                  <select className="input-control" style={{marginBottom: 0, padding: '0.4rem'}} value={partner.customerId} onChange={(e) => handleChangePartner(cow.id, partner.id, 'customerId', e.target.value)}>
                    <option value="">اختر عميل...</option>
                    {customers.map(c => <option key={c._id} value={c._id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>)}
                    <option value="NEW" style={{fontWeight: 'bold', color: 'var(--primary-color)'}}>+ إضافة عميل جديد</option>
                  </select>
                </td>
                <td><input type="number" className="input-control" style={{marginBottom: 0, padding: '0.4rem'}} value={partner.share} onChange={(e) => handleChangePartner(cow.id, partner.id, 'share', e.target.value)} /></td>
                <td><input type="number" className="input-control" style={{marginBottom: 0, padding: '0.4rem'}} value={partner.price} onChange={(e) => handleChangePartner(cow.id, partner.id, 'price', e.target.value)} /></td>
                <td><input type="number" className="input-control" style={{marginBottom: 0, padding: '0.4rem'}} value={partner.slaughterCostShare} onChange={(e) => handleChangePartner(cow.id, partner.id, 'slaughterCostShare', e.target.value)} /></td>
                <td style={{ backgroundColor: '#f7fafc', fontSize: '0.9rem' }}>{partner.finances.customerWeight.toFixed(2)} كجم</td>
                <td style={{ backgroundColor: '#f7fafc', fontWeight: 'bold' }}>{partner.finances.totalBeforeSlaughter.toFixed(2)} ج.م</td>
                <td style={{ backgroundColor: '#f7fafc', fontWeight: 'bold', color: 'var(--primary-color)' }}>{partner.finances.customerTotal.toFixed(2)} ج.م</td>
                <td style={{ fontWeight: 'bold', color: partner.finances.paidAmount > 0 ? 'var(--success)' : 'inherit' }}>{partner.finances.paidAmount.toFixed(2)} ج.م</td>
                <td style={{ backgroundColor: '#fff5f5', fontWeight: 'bold', color: partner.finances.remaining > 0 ? 'var(--danger)' : 'var(--success)' }}>{partner.finances.remaining.toFixed(2)} ج.م</td>
                <td style={{display: 'flex', gap: '0.25rem'}}>
                  <button className="btn btn-primary" style={{padding: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}} onClick={() => {
                      if (!cow.dbId || !partner.customerId) { alert('يرجى حفظ الكارت واختيار اسم العميل قبل تسجيل الدفعة.'); return; }
                      setModalState({ type: 'PAYMENT', data: { cowId: cow.dbId, customerId: partner.customerId } });
                    }}>
                    <CreditCard size={14} /> دفع
                  </button>
                  <button className="btn btn-outline" style={{padding: '0.4rem', color: 'var(--danger)', borderColor: 'var(--danger)'}} onClick={() => handleRemovePartner(cow.id, partner.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <button className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }} onClick={() => handleAddPartner(cow.id)}>
          <Plus size={16} /> إضافة عميل لهذا العجل
        </button>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <SummaryStat label="💰 إجمالي العجل" value={calculations.meat} color="var(--primary-color)" />
          <SummaryStat label="🔪 إجمالي الدبح" value={calculations.slaughter} />
          <SummaryStat label="🧾 الإجمالي الكلي" value={calculations.total} color="var(--success)" />
        </div>
      </div>
    </div>
  );
});

const SummaryStat = ({ label, value, color }) => (
  <div style={{ textAlign: 'center' }}>
    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
    <strong style={{ fontSize: '1.2rem', color: color || 'inherit' }}>{value.toFixed(2)} ج.م</strong>
  </div>
);

// Modals
const CustomerModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/customers', form);
      onSuccess(res.data._id);
    } catch (err) { alert(err.response?.data?.error || err.message); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
      <div className="card" style={{width: '400px'}}>
        <h3>إضافة عميل جديد</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>اسم العميل *</label>
            <input type="text" className="input-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required autoFocus />
          </div>
          <div className="input-group">
            <label>رقم الهاتف *</label>
            <input type="text" className="input-control" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
          </div>
          <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>حفظ</button>
            <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentModal = ({ cowId, customerId, onClose, onSuccess }) => {
  const [form, setForm] = useState({ amount: '', paymentMethod: 'cash' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/payments', { amount: Number(form.amount), paymentMethod: form.paymentMethod, cowId, customerId });
      onSuccess();
    } catch (err) { alert(err.response?.data?.error || err.message); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
      <div className="card" style={{width: '400px'}}>
        <h3>تسجيل دفعة</h3>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>المبلغ (ج.م) *</label>
            <input type="number" className="input-control" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required autoFocus />
          </div>
          <div className="input-group">
            <label>طريقة الدفع *</label>
            <select className="input-control" value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} required>
              <option value="cash">كاش (نقدًا)</option>
              <option value="transfer">تحويل بنكي / محفظة</option>
            </select>
          </div>
          <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>تسجيل</button>
            <button type="button" className="btn btn-outline" onClick={onClose}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Cows;
