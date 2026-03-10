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

interface Rates {
  USD: number; // VES per 1 USD
  EUR: number; // VES per 1 EUR
}

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  rates: Rates; // pass current exchange rates
}

const currencyOptions = ['VES', 'USD', 'EUR'] as const;
type Currency = typeof currencyOptions[number];

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose, rates }) => {
  const [amount, setAmount] = useState<string>('');
  const [from, setFrom] = useState<Currency>('VES');
  const [to, setTo] = useState<Currency>('USD');

  const result = useMemo(() => {
    if (amount === '' || Number.isNaN(Number(amount))) return '';
    const a = Number(amount);
    // Convert any currency -> VES
    const toVES = (value: number, cur: Currency) => {
      if (cur === 'VES') return value;
      if (cur === 'USD') return value * rates.USD;
      if (cur === 'EUR') return value * rates.EUR;
      return value;
    };
    // Convert VES -> target currency
    const fromVES = (valueVES: number, cur: Currency) => {
      if (cur === 'VES') return valueVES;
      if (cur === 'USD') return valueVES / rates.USD;
      if (cur === 'EUR') return valueVES / rates.EUR;
      return valueVES;
    };

    const asVES = toVES(a, from);
    const converted = fromVES(asVES, to);
    return converted;
  }, [amount, from, to, rates]);

  const clear = () => {
    setAmount('');
    setFrom('VES');
    setTo('USD');
  };

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
        <IonGrid>
          <IonRow>
            <IonCol>
              <IonItem>
                <IonLabel position="stacked">Cantidad</IonLabel>
                <IonInput
                  inputmode="decimal"
                  value={amount}
                  onIonChange={(e: any) => {
                    // Ionic's IonInput provides the value in e.detail.value
                    const val = e?.detail?.value ?? ''
                    setAmount(val === null ? '' : String(val))
                  }}
                  placeholder="0.00"
                />
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonItem>
                <IonLabel>Desde</IonLabel>
                <IonSelect value={from} onIonChange={(e) => setFrom(e.detail.value)}>
                  {currencyOptions.map((c) => (
                    <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
            <IonCol>
              <IonItem>
                <IonLabel>Hacia</IonLabel>
                <IonSelect value={to} onIonChange={(e) => setTo(e.detail.value)}>
                  {currencyOptions.map((c) => (
                    <IonSelectOption key={c} value={c}>{c}</IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </IonCol>
          </IonRow>

          <IonRow className="ion-margin-top">
            <IonCol>
              <IonText>
                <h2>Resultado</h2>
                <p style={{ fontSize: 20 }}>{result === '' ? '-' : `${result.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`}</p>
              </IonText>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol>
              <IonButton expand="block" onClick={() => { setAmount(''); }}>Limpiar</IonButton>
            </IonCol>
          </IonRow>

        </IonGrid>
      </IonContent>
    </IonModal>
  );
};

export default Calculator;
