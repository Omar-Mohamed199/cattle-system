import React, { useState, useEffect } from 'react';
import api from '../api';
import { useSocket } from '../context/SocketContext';
import { calculateCustomerFinances } from '../utils/calculations';
import { Filter } from 'lucide-react';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('cows'); // cows, expenses, slaughter
  
  // Data
  const [cows, setCows] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const socket = useSocket();

  const fetchData = async () => {
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
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      socket.on('data_updated', fetchData);
      return () => socket.off('data_updated', fetchData);
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

  // Calculate cows report
  const renderCowsReport = () => {
    return (
      <div className="card" style={{padding: 0, overflow: 'hidden', marginTop: '1.5rem'}}>
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
            {cows.map(cow => {
              let expected = 0;
              let paid = 0;
              let remaining = 0;

              cow.partners.forEach(p => {
                const fin = calculateCustomerFinances(cow.weight, p, cow._id, payments);
                expected += fin.customerTotal;
                paid += fin.paidAmount;
                remaining += fin.remaining;
              });

              return (
                <tr key={cow._id}>
                  <td><span className="badge badge-success" style={{fontSize:'1rem'}}>#{cow.numberId}</span></td>
                  <td>{expected.toLocaleString('ar-EG')} ج.م</td>
                  <td style={{color: 'var(--success)'}}>{paid.toLocaleString('ar-EG')} ج.م</td>
                  <td style={{color: remaining > 0 ? 'var(--danger)' : 'inherit', fontWeight: 'bold'}}>{remaining.toLocaleString('ar-EG')} ج.م</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Calculate slaughter report
  const renderSlaughterReport = () => {
    return (
      <div className="card" style={{padding: 0, overflow: 'hidden', marginTop: '1.5rem'}}>
        <table>
          <thead>
            <tr>
              <th>العجل</th>
              <th>تكلفة الذبح الإجمالية</th>
              <th>إجمالي الموزع على الشركاء</th>
            </tr>
          </thead>
          <tbody>
            {cows.map(cow => {
              const distributed = cow.partners.reduce((sum, p) => sum + (p.slaughterCostShare || 0), 0);
              return (
                <tr key={cow._id}>
                  <td><span className="badge badge-success" style={{fontSize:'1rem'}}>#{cow.numberId}</span></td>
                  <td>{(cow.totalSlaughterCost || 0).toLocaleString('ar-EG')} ج.م</td>
                  <td>{distributed.toLocaleString('ar-EG')} ج.م</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderExpensesReport = () => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    return (
      <div className="card" style={{marginTop: '1.5rem'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
          <h3>إجمالي المصروفات: <span style={{color: 'var(--danger)'}}>{total.toLocaleString('ar-EG')} ج.م</span></h3>
        </div>
        <div style={{padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)'}}>
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
    );
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">التقارير المالية</h2>
      </div>

      <div style={{display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem'}}>
        <div style={tabStyle('cows')} onClick={() => setActiveTab('cows')}>تقرير المبيعات والعجول</div>
        <div style={tabStyle('slaughter')} onClick={() => setActiveTab('slaughter')}>تقرير الذبح</div>
        <div style={tabStyle('expenses')} onClick={() => setActiveTab('expenses')}>تقرير المصروفات العامة</div>
      </div>

      {activeTab === 'cows' && renderCowsReport()}
      {activeTab === 'slaughter' && renderSlaughterReport()}
      {activeTab === 'expenses' && renderExpensesReport()}

    </div>
  );
};

export default Reports;
