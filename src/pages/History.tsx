import React, { useMemo, useState } from 'react'
import { useFinance } from '../contexts/FinanceContext'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonText,
  IonButton,
  IonIcon,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
} from '@ionic/react'
import { trash as trashIcon, pencil as pencilIcon } from 'ionicons/icons'

const History: React.FC = () => {
  const [range, setRange] = useState<'1w' | '1m' | '3m' | '1y'>('1m')
  const { transactions: txs, deleteTransaction, editTransaction } = useFinance()

  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)

  const filtered = useMemo(() => {
    const now = new Date()
    let start = new Date()
    if (range === '1w') start.setDate(now.getDate() - 7)
    if (range === '1m') start.setMonth(now.getMonth() - 1)
    if (range === '3m') start.setMonth(now.getMonth() - 3)
    if (range === '1y') start.setFullYear(now.getFullYear() - 1)

    return txs.filter((t: any) => new Date(t.date) >= start)
  }, [txs, range])

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div className="w-full flex items-center justify-between px-4">
            <h1 className="text-lg font-semibold">Historial</h1>
            <div className="text-sm muted">{filtered.length} transacciones</div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="max-w-3xl mx-auto p-4">
          <div className="mb-4">
            <IonSegment value={range} onIonChange={(e) => setRange((e.detail.value ?? '1m') as '1w' | '1m' | '3m' | '1y')}>
              <IonSegmentButton value="1w">
                <IonLabel>1 Semana</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="1m">
                <IonLabel>1 Mes</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="3m">
                <IonLabel>3 Meses</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="1y">
                <IonLabel>1 Año</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="p-4 rounded bg-gray-50/50 text-muted">No hay transacciones en este periodo</div>
            ) : (
              filtered.map((t: any) => (
                <div key={t.id} className="p-3 rounded shadow-sm bg-white/5 flex flex-col">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="block">{t.description ?? t.type}</strong>
                      <small className="text-sm text-muted">{new Date(t.date).toLocaleString()} • {t.tags?.join(', ')}</small>
                    </div>
                    <div className="flex items-center gap-2">
                      <IonButton size="small" fill="clear" onClick={() => { setEditing(t); setEditOpen(true); }}>
                        <IonIcon icon={pencilIcon} />
                      </IonButton>
                      <IonButton size="small" color="danger" onClick={() => deleteTransaction(t.id)}>
                        <IonIcon icon={trashIcon} />
                      </IonButton>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <IonModal isOpen={editOpen} onDidDismiss={() => setEditOpen(false)}>
            <IonHeader>
              <IonToolbar>
                <IonTitle>Editar Transacción</IonTitle>
                <IonButton slot="end" onClick={() => setEditOpen(false)}>Cerrar</IonButton>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {editing && (
                <div className="max-w-xl mx-auto">
                  <IonItem>
                    <IonLabel>Descripción</IonLabel>
                    <IonInput value={editing.description} onIonChange={(e: any) => setEditing({ ...editing, description: e.detail.value })} />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Cantidad</IonLabel>
                    <IonInput value={String(editing.amount)} inputmode="decimal" onIonChange={(e: any) => setEditing({ ...editing, amount: Number(e.detail.value) })} />
                  </IonItem>
                  <IonItem>
                    <IonLabel>Moneda</IonLabel>
                    <IonSelect value={editing.currency} onIonChange={(e) => setEditing({ ...editing, currency: e.detail.value })}>
                      <IonSelectOption value="VES">VES</IonSelectOption>
                      <IonSelectOption value="USD">USD</IonSelectOption>
                      <IonSelectOption value="EUR">EUR</IonSelectOption>
                    </IonSelect>
                  </IonItem>
                  <div className="p-4">
                    <IonButton expand="block" onClick={async () => { await editTransaction(editing.id, { description: editing.description, amount: editing.amount, currency: editing.currency }); setEditOpen(false); }}>Guardar</IonButton>
                  </div>
                </div>
              )}
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default History
