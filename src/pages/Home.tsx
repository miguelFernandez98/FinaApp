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
    import('../utils/rates').then(({ fetchRates }) => {
      fetchRates()
        .then((r) => {
          if (mounted) setRates(r)
        })
        .catch(() => {})
        .finally(() => {
          if (mounted) setLoadingRates(false)
        })
    })
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
          <IonTitle>FinanzApp</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Resumen del mes</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonText>
                      <h2>Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })} VES</h2>
                      <p>Gastos: {totalExpenses.toLocaleString(undefined, { maximumFractionDigits: 2 })} VES</p>
                      {balance > 0 ? (
                        <p style={{ color: 'green' }}>Logro: Ahorro</p>
                      ) : (
                        <p style={{ color: 'crimson' }}>Alerta: Balance negativo</p>
                      )}
                    </IonText>
                  </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>BCV</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {loadingRates ? (
                    <p>Cargando tasas...</p>
                  ) : (
                    <>
                      <p>USD: {rates.USD.toLocaleString()}</p>
                      <p>EUR: {rates.EUR.toLocaleString()}</p>
                    </>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Binance P2P</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Compra: --</p>
                  <p>Venta: --</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Calculadora</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton expand="block" onClick={() => setCalcOpen(true)}>Abrir Calculadora</IonButton>
                  <IonButton expand="block" color="secondary" onClick={() => setAddOpen(true)} className="ion-margin-top">Agregar Transacción</IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Resumen Rápido</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <p>Flujo actual: --</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <Calculator isOpen={calcOpen} onClose={() => setCalcOpen(false)} rates={rates} />

        <IonModal isOpen={addOpen} onDidDismiss={() => setAddOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Nueva Transacción</IonTitle>
              <IonButton slot="end" onClick={() => setAddOpen(false)}>Cerrar</IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
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

            <div style={{ padding: 16 }}>
              <IonButton expand="block" onClick={submit}>Guardar</IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  )
}

export default Home
