import React, { useEffect, useState } from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonText,
} from '@ionic/react'
import Calculator from '../components/Calculator'
import {
  IonModal,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/react'
import { useFinance } from '../contexts/FinanceContext'

type TxType = 'income' | 'expense' | 'debt'

const Home: React.FC = () => {
  const [calcOpen, setCalcOpen] = useState(false)
  const [rates, setRates] = useState<{ USD: number; EUR: number }>({ USD: 0, EUR: 0 })
  const [loadingRates, setLoadingRates] = useState(true)
  const [binanceBuy, setBinanceBuy] = useState<number | null>(null)
  const [binanceSell, setBinanceSell] = useState<number | null>(null)
  const [loadingBinance, setLoadingBinance] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const { addTransaction } = useFinance()
  const { transactions } = useFinance()

  const [form, setForm] = useState<{ type: TxType; amount: string; currency: 'VES' | 'USD' | 'EUR'; tags: string; description: string }>({
    type: 'expense',
    amount: '',
    currency: 'VES',
    tags: '',
    description: '',
  })

  const submit = async () => {
    const amt = Number(form.amount || 0)
    if (!amt || amt <= 0) return
    await addTransaction({
      type: form.type,
      amount: amt,
      currency: form.currency,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: form.description,
    })
    setAddOpen(false)
    setForm({ type: 'expense', amount: '', currency: 'VES', tags: '', description: '' })
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const mod = await import('../utils/rates')
      try {
        const r = await mod.fetchRates()
        if (mounted) setRates(r)
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setLoadingRates(false)
      }

      // Try Binance P2P medians (buy/sell)
      try {
        const bin = await mod.fetchBinanceP2P()
        if (mounted) {
          setBinanceBuy(bin.buy)
          setBinanceSell(bin.sell)
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoadingBinance(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  // Compute summary (convert currencies to VES using rates)
  const toVES = (amount: number, currency: 'VES' | 'USD' | 'EUR') => {
    if (currency === 'VES') return amount
    if (currency === 'USD') return amount * (rates.USD || 1)
    if (currency === 'EUR') return amount * (rates.EUR || 1)
    return amount
  }

  const balance = transactions.reduce((acc, t) => {
    const v = toVES(t.amount, t.currency)
    if (t.type === 'income') return acc + v
    return acc - v
  }, 0)

  const totalExpenses = transactions.reduce((acc, t) => {
    if (t.type === 'expense') return acc + toVES(t.amount, t.currency)
    return acc
  }, 0)

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="w-full flex items-center justify-between px-4">
            <h1 className="text-xl font-semibold">FinanzApp</h1>
            <div className="text-sm muted">Balance: {balance.toFixed(2)} VES</div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-3xl mx-auto p-4">
          <div className="card mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} VES</h2>
                <p className="muted">Gastos: {totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })} VES</p>
              </div>
              <div>
                {balance > 0 ? <span className="px-3 py-1 rounded bg-green-100 text-green-800">Ahorro</span> : <span className="px-3 py-1 rounded bg-red-100 text-red-800">Negativo</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-semibold mb-2">BCV</h3>
              {loadingRates ? <p className="muted">Cargando tasas...</p> : <>
                <p>USD: <strong>{rates.USD.toLocaleString()}</strong></p>
                <p>EUR: <strong>{rates.EUR.toLocaleString()}</strong></p>
              </>}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Binance P2P</h3>
              {loadingBinance ? <p className="muted">Cargando...</p> : (
                <>
                  <p className="muted">Compra (buy USDT): {binanceBuy ? (<strong>{binanceBuy.toLocaleString()} VES</strong>) : <span className="muted">N/A</span>}</p>
                  <p className="muted">Venta (sell USDT): {binanceSell ? (<strong>{binanceSell.toLocaleString()} VES</strong>) : <span className="muted">N/A</span>}</p>
                </>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Calculadora</h3>
              <IonButton expand="block" onClick={() => setCalcOpen(true)}>Abrir Calculadora</IonButton>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2">Acciones</h3>
              <IonButton expand="block" color="secondary" onClick={() => setAddOpen(true)}>Agregar Transacción</IonButton>
            </div>
          </div>

          <Calculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} rates={rates} />

          <IonModal isOpen={addOpen} onDidDismiss={() => setAddOpen(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Nueva Transacción</IonTitle>
                <IonButton slot="end" onClick={() => setAddOpen(false)}>Cerrar</IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <div className="max-w-xl mx-auto">
                <IonItem>
                  <IonLabel>Tipo</IonLabel>
                  <IonSelect value={form.type} onIonChange={(e) => setForm(f => ({ ...f, type: e.detail.value }))}>
                    <IonSelectOption value="income">Ingreso</IonSelectOption>
                    <IonSelectOption value="expense">Egreso</IonSelectOption>
                    <IonSelectOption value="debt">Deuda</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Cantidad</IonLabel>
                  <IonInput value={form.amount} inputmode="decimal" placeholder="0.00" onIonChange={(e: any) => setForm(f => ({ ...f, amount: String(e.detail.value ?? '') }))} />
                </IonItem>
                <IonItem>
                  <IonLabel>Moneda</IonLabel>
                  <IonSelect value={form.currency} onIonChange={(e) => setForm(f => ({ ...f, currency: e.detail.value }))}>
                    <IonSelectOption value="VES">VES</IonSelectOption>
                    <IonSelectOption value="USD">USD</IonSelectOption>
                    <IonSelectOption value="EUR">EUR</IonSelectOption>
                  </IonSelect>
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Tags (separados por coma)</IonLabel>
                  <IonInput value={form.tags} onIonChange={(e: any) => setForm(f => ({ ...f, tags: String(e.detail.value ?? '') }))} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Descripción</IonLabel>
                  <IonTextarea value={form.description} onIonChange={(e: any) => setForm(f => ({ ...f, description: String(e.detail.value ?? '') }))} />
                </IonItem>

                <div className="p-4">
                  <IonButton expand="block" onClick={submit}>Guardar</IonButton>
                </div>
              </div>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Home
