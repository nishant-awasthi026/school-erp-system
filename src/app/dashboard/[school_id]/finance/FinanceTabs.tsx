'use client';

import { useState } from 'react';

interface FinanceData {
    fees: any[];
    feeRecords: any[];
    expenses: any[];
    ledger: any[];
    classes: any[];
    schoolId: string;
}

export default function FinanceTabs({ data }: { data: FinanceData }) {
    const [activeTab, setActiveTab] = useState<'fees' | 'defaulters' | 'expenses' | 'ledger'>('fees');

    const { fees, feeRecords, expenses, ledger, classes, schoolId } = data;

    // Calculate defaulters
    const defaulters = feeRecords.filter(
        (record: any) => record.status === 'PENDING' && new Date(record.fee.dueDate) < new Date()
    );

    // Calculate totals
    const totalIncome = feeRecords.reduce((sum: number, record: any) => sum + record.paidAmount, 0);
    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
    const totalOutstanding = feeRecords.reduce(
        (sum: number, record: any) => sum + (record.fee.amount - record.paidAmount),
        0
    );

    return (
        <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Total Income
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>
                        ₹{totalIncome.toLocaleString()}
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Total Expenses
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--error)' }}>
                        ₹{totalExpenses.toLocaleString()}
                    </div>
                </div>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        Outstanding
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        ₹{totalOutstanding.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    {['fees', 'defaulters', 'expenses', 'ledger'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            style={{
                                padding: '1rem 0',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                                fontWeight: activeTab === tab ? 'bold' : 'normal',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="card">
                {activeTab === 'fees' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Fee Collection</h2>
                            <a href={`/dashboard/${schoolId}/finance/add-fee`} className="btn btn-primary">
                                Add New Fee
                            </a>
                        </div>

                        {fees.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                No fees created yet.
                            </p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.75rem' }}>Title</th>
                                        <th style={{ padding: '0.75rem' }}>Amount</th>
                                        <th style={{ padding: '0.75rem' }}>Due Date</th>
                                        <th style={{ padding: '0.75rem' }}>Collected</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map((fee: any) => {
                                        const collected = fee.records.reduce(
                                            (sum: number, r: any) => sum + r.paidAmount,
                                            0
                                        );
                                        return (
                                            <tr key={fee.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '0.75rem' }}>{fee.name}</td>
                                                <td style={{ padding: '0.75rem' }}>₹{fee.amount}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {new Date(fee.dueDate).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    ₹{collected} / ₹{fee.amount * fee.records.length}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'defaulters' && (
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            Defaulter List
                        </h2>

                        {defaulters.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                No defaulters found. All dues are up to date!
                            </p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.75rem' }}>Student</th>
                                        <th style={{ padding: '0.75rem' }}>Fee</th>
                                        <th style={{ padding: '0.75rem' }}>Due Amount</th>
                                        <th style={{ padding: '0.75rem' }}>Due Date</th>
                                        <th style={{ padding: '0.75rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {defaulters.map((record: any) => (
                                        <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem' }}>{record.student.user.name}</td>
                                            <td style={{ padding: '0.75rem' }}>{record.fee.name}</td>
                                            <td style={{ padding: '0.75rem', color: 'var(--error)' }}>
                                                ₹{record.fee.amount - record.paidAmount}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {new Date(record.fee.dueDate).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <a
                                                    href={`/dashboard/${schoolId}/finance/payment/${record.id}`}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.75rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        border: '1px solid var(--primary)',
                                                        background: 'rgba(59, 130, 246, 0.1)',
                                                        color: 'var(--primary)',
                                                        textDecoration: 'none',
                                                    }}
                                                >
                                                    Record Payment
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'expenses' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Expenses</h2>
                            <a href={`/dashboard/${schoolId}/finance/add-expense`} className="btn btn-primary">
                                Add Expense
                            </a>
                        </div>

                        {expenses.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                No expenses recorded yet.
                            </p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.75rem' }}>Title</th>
                                        <th style={{ padding: '0.75rem' }}>Category</th>
                                        <th style={{ padding: '0.75rem' }}>Amount</th>
                                        <th style={{ padding: '0.75rem' }}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((expense: any) => (
                                        <tr key={expense.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem' }}>{expense.title}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: 'rgba(168, 85, 247, 0.1)',
                                                    color: '#a855f7',
                                                }}>
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.75rem', color: 'var(--error)' }}>₹{expense.amount}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                {new Date(expense.date).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'ledger' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Ledger</h2>
                            <a href={`/dashboard/${schoolId}/finance/add-ledger`} className="btn btn-primary">
                                Add Entry
                            </a>
                        </div>

                        {ledger.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                                No ledger entries yet.
                            </p>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '0.75rem' }}>Date</th>
                                        <th style={{ padding: '0.75rem' }}>Description</th>
                                        <th style={{ padding: '0.75rem' }}>Type</th>
                                        <th style={{ padding: '0.75rem' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ledger.map((entry: any) => (
                                        <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '0.75rem' }}>
                                                {new Date(entry.date).toLocaleDateString()}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{entry.description}</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.75rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    background: entry.entryType === 'INCOME' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: entry.entryType === 'INCOME' ? 'var(--success)' : 'var(--error)',
                                                }}>
                                                    {entry.entryType}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: '0.75rem',
                                                    color: entry.entryType === 'INCOME' ? 'var(--success)' : 'var(--error)',
                                                    fontWeight: '600',
                                                }}
                                            >
                                                {entry.entryType === 'INCOME' ? '+' : '-'}₹{entry.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
