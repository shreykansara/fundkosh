import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, initializeDatabaseSeed } from './data/database';
import { Entity, Transaction, SpeedBumpEvaluationResult } from './domain/models';
import { PaymentController } from './controllers/PaymentController';
import { SpeedBumpEvaluator } from './engine/SpeedBumpEvaluator';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  Wallet, 
  Store, 
  Users, 
  Activity,
  AlertTriangle
} from 'lucide-react';

const paymentController = new PaymentController();
const speedBumpEvaluator = new SpeedBumpEvaluator();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [senderUpi, setSenderUpi] = useState('aarav@fundkosh');
  const [receiverUpi, setReceiverUpi] = useState('gigatech@upi');
  const [amount, setAmount] = useState<number>(3500);
  const [note, setNote] = useState('Buying Wireless Headphones');

  // Active Speed Bump State
  const [activeSpeedBump, setActiveSpeedBump] = useState<{
    tx: Transaction;
    evalResult: SpeedBumpEvaluationResult;
  } | null>(null);

  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Live query for entities & transactions from Dexie DB
  const entities = useLiveQuery(() => db.entities.toArray(), []);
  const transactions = useLiveQuery(() => db.transactions.orderBy('timestamp').reverse().toArray(), []);
  const speedBumpRules = useLiveQuery(() => db.speed_bump_rules.toArray(), []);

  useEffect(() => {
    initializeDatabaseSeed().then(() => {
      setIsDbReady(true);
    });
  }, []);

  // Cooldown timer effect for Speed Bump modal
  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownLeft]);

  const handleSendPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const result = await paymentController.initiatePayment(senderUpi, receiverUpi, amount, note);

    if (result.status === 'SPEED_BUMP_REQUIRED' && result.evaluationResult) {
      setActiveSpeedBump({
        tx: result.transaction,
        evalResult: result.evaluationResult
      });
      setCooldownLeft(result.evaluationResult.suggestedCooldownSeconds);
      setStatusMessage('⚡ Speed-Bump Triggered! Psychological Reflection Intercept Activated.');
    } else if (result.status === 'COMPLETED') {
      setStatusMessage(`✅ Payment of ₹${amount.toLocaleString()} completed instantly (No Speed-Bump triggered).`);
    } else if (result.status === 'FAILED') {
      setStatusMessage(`❌ Payment Failed: ${result.errorMessage}`);
    }
  };

  const handleResolveSpeedBump = async (choice: 'CONFIRM' | 'CANCEL') => {
    if (!activeSpeedBump) return;

    const res = await paymentController.resolveSpeedBump(activeSpeedBump.tx.id, choice);
    setActiveSpeedBump(null);

    if (res.status === 'COMPLETED') {
      setStatusMessage(`✅ Transaction confirmed and completed after speed-bump reflection!`);
    } else if (res.status === 'BLOCKED') {
      setStatusMessage(`🛑 Transaction cancelled safely. Funds preserved in account!`);
    }
  };

  if (!isDbReady || !entities) {
    return (
      <div style={styles.centerContainer}>
        <Activity className="animate-spin" size={32} color="#38bdf8" />
        <p style={{ marginTop: 12, color: '#94a3b8' }}>Initializing FundKosh Local Ledger DB...</p>
      </div>
    );
  }

  const selectedReceiver = entities.find(e => e.upi_id === receiverUpi);

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>FundKosh <span style={styles.subtitleBadge}>On-Device Core Backbone</span></h1>
          <p style={styles.description}>
            Privacy-First Cash Management & Real-Time Speed-Bump Reflection Engine
          </p>
        </div>
        <div style={styles.statusChip}>
          <span style={styles.dot}></span> Local DB Active
        </div>
      </header>

      {/* Main Grid Layout */}
      <div style={styles.grid}>
        
        {/* Left Column: Accounts & Payment Simulator */}
        <div style={styles.col}>
          
          {/* Entity Ledger Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Wallet size={20} color="#38bdf8" />
              <h2 style={styles.cardTitle}>Local Ledger Accounts (8 Entities)</h2>
            </div>
            <div style={styles.entityList}>
              {entities.map(entity => (
                <div key={entity.id} style={styles.entityItem}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={styles.entityName}>{entity.name}</span>
                      <span style={getCategoryStyle(entity.category)}>{entity.category}</span>
                    </div>
                    <span style={styles.upiText}>{entity.upi_id}</span>
                  </div>
                  <div style={styles.balanceText}>
                    ₹{entity.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Simulator Card */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <ArrowRightLeft size={20} color="#38bdf8" />
              <h2 style={styles.cardTitle}>Payment Transfer Simulator</h2>
            </div>
            
            {statusMessage && (
              <div style={styles.notification}>
                {statusMessage}
              </div>
            )}

            <form onSubmit={handleSendPayment} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sender Account (Payer)</label>
                <select 
                  value={senderUpi} 
                  onChange={e => setSenderUpi(e.target.value)}
                  style={styles.input}
                >
                  {entities.filter(e => e.type !== 'merchant').map(e => (
                    <option key={e.id} value={e.upi_id}>
                      {e.name} (Balance: ₹{e.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Receiver Account (Payee / Merchant)</label>
                <select 
                  value={receiverUpi} 
                  onChange={e => setReceiverUpi(e.target.value)}
                  style={styles.input}
                >
                  {entities.filter(e => e.upi_id !== senderUpi).map(e => (
                    <option key={e.id} value={e.upi_id}>
                      {e.name} [{e.category.toUpperCase()}] ({e.upi_id})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Amount (₹)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(Number(e.target.value))}
                    style={styles.input}
                    min={1}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Note / Description</label>
                  <input 
                    type="text" 
                    value={note} 
                    onChange={e => setNote(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              {selectedReceiver && (
                <div style={styles.previewBox}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Real-time Risk Preview:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    {selectedReceiver.category === 'impulsive' || amount >= 2000 ? (
                      <>
                        <AlertTriangle size={16} color="#f59e0b" />
                        <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 500 }}>
                          High chance of triggering Speed-Bump ({selectedReceiver.category} / ₹{amount.toLocaleString()})
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} color="#10b981" />
                        <span style={{ color: '#10b981', fontSize: 13, fontWeight: 500 }}>
                          Direct payment likely (Essential category under threshold)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <button type="submit" style={styles.submitBtn}>
                Initiate UPI Payment
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Speed-Bump Rules & Transaction Audit Ledger */}
        <div style={styles.col}>
          
          {/* Active Speed Bump Rules */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <ShieldAlert size={20} color="#38bdf8" />
              <h2 style={styles.cardTitle}>Speed-Bump Engine Rules</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {speedBumpRules?.map(rule => (
                <div key={rule.id} style={styles.ruleCard}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{rule.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{rule.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Ledger Log */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Activity size={20} color="#38bdf8" />
              <h2 style={styles.cardTitle}>Transaction Audit Ledger</h2>
            </div>
            <div style={styles.txList}>
              {transactions?.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                  No transactions recorded yet. Initiate a transfer above to test state transitions.
                </div>
              ) : (
                transactions?.map(tx => (
                  <div key={tx.id} style={styles.txItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc' }}>
                        {tx.sender_upi} → {tx.receiver_upi}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                        ₹{tx.amount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={getStatusBadgeStyle(tx.status)}>{tx.status}</span>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {tx.speed_bump_reason && (
                      <div style={styles.reasonText}>
                        Reason: {tx.speed_bump_reason}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Speed Bump Intercept Modal */}
      {activeSpeedBump && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={styles.modalIconBg}>
                <ShieldAlert size={36} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: '12px 0 4px 0' }}>
                Psychological Speed-Bump Intercept
              </h2>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                FundKosh detected an impulsive spend pattern. Take a breath before completing this transfer.
              </p>
            </div>

            <div style={styles.modalSummary}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Amount:</span>
                <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: 16 }}>₹{activeSpeedBump.tx.amount.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Payee:</span>
                <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>{activeSpeedBump.tx.receiver_upi}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8', fontSize: 13 }}>Risk Score:</span>
                <span style={{ color: '#ef4444', fontWeight: 700, fontSize: 14 }}>{activeSpeedBump.evalResult.riskScore} / 100</span>
              </div>
            </div>

            <div style={styles.reasonsBox}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', textTransform: 'uppercase' }}>
                Trigger Reasons:
              </span>
              <ul style={{ margin: '6px 0 0 0', paddingLeft: 18, fontSize: 13, color: '#fecaca' }}>
                {activeSpeedBump.evalResult.reasons.map((r, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{r}</li>
                ))}
              </ul>
            </div>

            {cooldownLeft > 0 ? (
              <div style={styles.cooldownNotice}>
                <Clock size={16} color="#fbbf24" />
                <span>Reflection Delay: Proceed enabled in <strong>{cooldownLeft}s</strong></span>
              </div>
            ) : (
              <div style={styles.cooldownDoneNotice}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Reflection complete. You may now decide.</span>
              </div>
            )}

            <div style={styles.modalActions}>
              <button 
                onClick={() => handleResolveSpeedBump('CANCEL')}
                style={styles.cancelBtn}
              >
                <XCircle size={16} />
                Cancel Payment (Save Money)
              </button>
              <button 
                onClick={() => handleResolveSpeedBump('CONFIRM')}
                disabled={cooldownLeft > 0}
                style={{
                  ...styles.confirmBtn,
                  opacity: cooldownLeft > 0 ? 0.5 : 1,
                  cursor: cooldownLeft > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <CheckCircle2 size={16} />
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper badge styles
function getCategoryStyle(category: string): React.CSSProperties {
  switch (category) {
    case 'primary': return { backgroundColor: '#1e3a8a', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 };
    case 'household': return { backgroundColor: '#14532d', color: '#4ade80', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 };
    case 'essential': return { backgroundColor: '#065f46', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 };
    case 'impulsive': return { backgroundColor: '#831843', color: '#f472b6', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 };
    default: return { backgroundColor: '#334155', color: '#cbd5e1', padding: '2px 8px', borderRadius: 4, fontSize: 11 };
  }
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'COMPLETED': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 };
    case 'SPEED_BUMP_REQUIRED': return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 };
    case 'BLOCKED': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 };
    default: return { backgroundColor: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 };
  }
}

// Inline Styles Object
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 1200, margin: '0 auto', padding: '24px 16px', boxSizing: 'border-box' },
  centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #1e293b' },
  title: { fontSize: 24, fontWeight: 700, color: '#f8fafc', margin: 0 },
  subtitleBadge: { fontSize: 12, fontWeight: 600, backgroundColor: '#0284c7', color: '#e0f2fe', padding: '3px 8px', borderRadius: 4, marginLeft: 8 },
  description: { fontSize: 14, color: '#94a3b8', margin: '4px 0 0 0' },
  statusChip: { display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: '#38bdf8', border: '1px solid #334155' },
  dot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 },
  col: { display: 'flex', flexDirection: 'column', gap: 24 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#f8fafc', margin: 0 },
  entityList: { display: 'flex', flexDirection: 'column', gap: 10 },
  entityItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#0f172a', borderRadius: 8, border: '1px solid #1e293b' },
  entityName: { fontWeight: 600, fontSize: 14, color: '#f8fafc' },
  upiText: { fontSize: 12, color: '#64748b', display: 'block', marginTop: 2 },
  balanceText: { fontWeight: 700, fontSize: 14, color: '#38bdf8' },
  notification: { backgroundColor: '#0c4a6e', color: '#7dd3fc', border: '1px solid #0284c7', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  formRow: { display: 'flex', gap: 12 },
  label: { fontSize: 12, fontWeight: 600, color: '#cbd5e1' },
  input: { backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: 6, padding: '10px 12px', color: '#f8fafc', fontSize: 14, outline: 'none' },
  previewBox: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, border: '1px dashed #334155' },
  submitBtn: { backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: 8, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginTop: 8 },
  ruleCard: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #1e293b' },
  txList: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' },
  txItem: { backgroundColor: '#0f172a', padding: 12, borderRadius: 8, border: '1px solid #1e293b' },
  reasonText: { fontSize: 12, color: '#fbbf24', marginTop: 6, fontStyle: 'italic' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modalContent: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, maxWidth: 440, width: '100%', border: '1px solid #475569', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' },
  modalIconBg: { width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
  modalSummary: { backgroundColor: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155', marginBottom: 14 },
  reasonsBox: { backgroundColor: 'rgba(153, 27, 27, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: 12, borderRadius: 8, marginBottom: 14 },
  cooldownNotice: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 16 },
  cooldownDoneNotice: { display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: 10, borderRadius: 8, fontSize: 13, marginBottom: 16 },
  modalActions: { display: 'flex', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  confirmBtn: { flex: 1, backgroundColor: '#dc2626', color: '#ffffff', border: 'none', padding: '12px', borderRadius: 8, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
};
