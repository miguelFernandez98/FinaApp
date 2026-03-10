import React, { useMemo, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
} from '@ionic/react';

interface Rates { USD: number; EUR: number }

interface CalculatorProps { isOpen: boolean; onClose: () => void; rates: Rates }

const currencyOptions = ['VES', 'USD', 'EUR'] as const;
type Currency = typeof currencyOptions[number];

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose, rates }) => {
  const [amount, setAmount] = useState<string>('');
  const [from, setFrom] = useState<Currency>('VES');
  const [to, setTo] = useState<Currency>('USD');
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    if (amount === '' || Number.isNaN(Number(amount))) return ''
    const a = Number(amount)
    const toVES = (value: number, cur: Currency) =>
      cur === 'VES' ? value : cur === 'USD' ? value * rates.USD : value * rates.EUR
    const fromVES = (valueVES: number, cur: Currency) =>
      cur === 'VES' ? valueVES : cur === 'USD' ? valueVES / rates.USD : valueVES / rates.EUR
    return fromVES(toVES(a, from), to)
  }, [amount, from, to, rates])

  const clear = () => {
    setAmount('');
    setFrom('VES');
    setTo('USD');
  };

  const copyResult = async () => {
    if (result === '' || typeof result === 'string' && result === '') return
    try {
      const text = `${Number(result).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.warn('Copy failed', e)
    }
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Calculadora</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => { clear(); onClose(); }}>Cerrar</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="container">
          <div className="card space-y-4">
            <div>
              <label className="block text-sm font-medium">Cantidad</label>
              <IonInput
                className="mt-2"
                inputmode="decimal"
                value={amount}
                onIonChange={(e: any) => setAmount(String(e?.detail?.value ?? ''))}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">Desde</label>
                <IonSelect value={from} onIonChange={(e) => setFrom(e.detail.value)}>
                  {currencyOptions.map((c) => (
                    <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                  ))}
                </IonSelect>
              </div>
              <div>
                <label className="block text-sm font-medium">Hacia</label>
                <IonSelect value={to} onIonChange={(e) => setTo(e.detail.value)}>
                  {currencyOptions.map((c) => (
                    <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                  ))}
                </IonSelect>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium">Resultado</h3>
              <p className="text-lg mt-2">{result === '' ? '-' : `${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`}</p>
              {result !== '' && (
                <div className="mt-2 flex items-center gap-2">
                  <IonButton size="small" onClick={copyResult}>{copied ? 'Copiado' : 'Copiar'}</IonButton>
                  <div className="text-sm text-muted">Equivalente VES: {(() => {
                    const num = Number(result)
                    if (Number.isNaN(num)) return '-'
                    const inVES = to === 'VES' ? num : to === 'USD' ? num * rates.USD : num * rates.EUR
                    return inVES.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' VES'
                  })()}</div>
                </div>
              )}
            </div>

            <div>
              <IonButton expand="block" onClick={() => { setAmount(''); }}>Limpiar</IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default Calculator;
