import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { calculateCustomerFinances } from '../utils/calculations';
import LoadingSpinner from '../components/LoadingSpinner';
import { Download } from 'lucide-react';
import { exportToExcel } from '../utils/exportToExcel';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('cows'); // cows, expenses, slaughter
  
  // Data
  const [cows, setCows] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [cowsRes, payRes, expRes] = await Promise.all([
        api.get('/cows'),
        api.get('/payments'),
        api.get('/expenses')
      ]);
      setCows(cowsRes.data);
      setPayments(payRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error(err);
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

  // Tab Styles
  const tabStyle = (tab) => ({
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    borderBottom: activeTab === tab ? '3px solid var(--primary-color)' : '3px solid transparent',
    color: activeTab === tab ? 'var(--primary-color)' : 'var(--text-muted)',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    transition: 'all 0.2s',
    userSelect: 'none'
  });

  // Memoized reports data
  const cowsReportData = useMemo(() => {
    return cows.map(cow => {
      let expected = 0;
      let paid = 0;
      let remaining = 0;

      cow.partners.forEach(p => {
        const fin = calculateCustomerFinances(cow.weight, p, cow._id, payments);
        expected += fin.customerTotal;
        paid += fin.paidAmount;
        remaining += fin.remaining;
      });

      return {
        id: cow._id,
        numberId: cow.numberId,
        expected,
        paid,
        remaining
      };
    });
  }, [cows, payments]);

  const slaughterReportData = useMemo(() => {
    return cows.map(cow => {
      const distributed = cow.partners.reduce((sum, p) => sum + (p.slaughterCostShare || 0), 0);
      return {
        id: cow._id,
        numberId: cow.numberId,
        totalSlaughterCost: cow.totalSlaughterCost || 0,
        distributed
      };
    });
  }, [cows]);

  const expensesTotal = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleExportExcel = () => {
    let data = [];
    let fileName = "";

    if (activeTab === 'cows') {
      data = cowsReportData.map(row => ({
        "العجل": row.numberId,
        "المستحق": row.expected,
        "المدفوع": row.paid,
        "المتبقي": row.remaining
      }));
      fileName = "تقرير_المبيعات";
    } else if (activeTab === 'slaughter') {
      data = slaughterReportData.map(row => ({
        "العجل": row.numberId,
        "تكلفة الذبح": row.totalSlaughterCost,
        "الموزع": row.distributed
      }));
      fileName = "تقرير_الذبح";
    } else {
      data = expenses.map(exp => ({
        "التاريخ": new Date(exp.date).toLocaleDateString('ar-EG'),
        "البيان": exp.description,
        "المبلغ": exp.amount
      }));
      fileName = "تقرير_المصروفات";
    }

    exportToExcel(data, fileName);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">التقارير المالية</h2>
        <button className="btn btn-outline" style={{ color: 'var(--success)', borderColor: 'var(--success)' }} onClick={handleExportExcel}>
          <Download size={18} /> تحميل Excel
        </button>
      </div>

      <div style={{display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', overflowX: 'auto', whiteSpace: 'nowrap'}}>
        <div style={tabStyle('cows')} onClick={() => setActiveTab('cows')}>تقرير المبيعات</div>
        <div style={tabStyle('slaughter')} onClick={() => setActiveTab('slaughter')}>تقرير الذبح</div>
        <div style={tabStyle('expenses')} onClick={() => setActiveTab('expenses')}>تقرير المصروفات</div>
      </div>

      {activeTab === 'cows' && (
        <div className="card" style={{padding: 0, overflowX: 'auto', marginTop: '1.5rem'}}>
          <table>
            <thead>
              <tr>
                <th>العجل</th>
                <th>الشركاء المستحق عليهم</th>
                <th>المدفوع من الشركاء</th>
                <th>المتبقي</th>
              </tr>
            </thead>
            <tbody>
              {cowsReportData.map(row => (
                <tr key={row.id}>
                  <td><span className="badge badge-success" style={{fontSize:'1rem'}}>#{row.numberId}</span></td>
                  <td>{row.expected.toLocaleString('ar-EG')} ج.م</td>
                  <td style={{color: 'var(--success)'}}>{row.paid.toLocaleString('ar-EG')} ج.م</td>
                  <td style={{color: row.remaining > 0 ? 'var(--danger)' : 'inherit', fontWeight: 'bold'}}>{row.remaining.toLocaleString('ar-EG')} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'slaughter' && (
        <div className="card" style={{padding: 0, overflowX: 'auto', marginTop: '1.5rem'}}>
          <table>
            <thead>
              <tr>
                <th>العجل</th>
                <th>تكلفة الذبح الإجمالية</th>
                <th>إجمالي الموزع على الشركاء</th>
              </tr>
            </thead>
            <tbody>
              {slaughterReportData.map(row => (
                <tr key={row.id}>
                  <td><span className="badge badge-success" style={{fontSize:'1rem'}}>#{row.numberId}</span></td>
                  <td>{row.totalSlaughterCost.toLocaleString('ar-EG')} ج.م</td>
                  <td>{row.distributed.toLocaleString('ar-EG')} ج.م</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="card" style={{marginTop: '1.5rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3>إجمالي المصروفات: <span style={{color: 'var(--danger)'}}>{expensesTotal.toLocaleString('ar-EG')} ج.م</span></h3>
          </div>
          <div style={{padding: 0, overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
            <table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(exp => (
                  <tr key={exp._id}>
                    <td>{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                    <td>{exp.description}</td>
                    <td style={{color: 'var(--danger)'}}>{exp.amount.toLocaleString('ar-EG')} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
