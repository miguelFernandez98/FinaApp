import React, { useRef, useState } from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
} from '@ionic/react'
import { cloudDownloadOutline, cloudUploadOutline, trash } from 'ionicons/icons'
import { useFinance } from '../contexts/FinanceContext'

const Settings: React.FC = () => {
  const [dark, setDark] = useState(false)

  const toggleDark = (val: boolean) => {
    setDark(val)
    document.body.classList.toggle('dark', val)
  }

  const fileRef = useRef<HTMLInputElement | null>(null)
  const { exportTransactions, importTransactions, clearAll } = useFinance()

  const onImportClick = () => fileRef.current?.click()
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      await importTransactions(f)
      alert('Importación completada')
    } catch (err) {
      alert('Error al importar: ' + err)
    }
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Configuración</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <div className="container space-y-3">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Modo Oscuro</h2>
                <p className="muted">Activa para cambiar la paleta de colores</p>
              </div>
              <IonItem lines="none">
                <IonToggle checked={dark} onIonChange={(e) => toggleDark(e.detail.checked)} />
              </IonItem>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold">Respaldo de datos</h3>
            <p className="muted">Exporta o importa tus transacciones. El import reemplaza los datos actuales.</p>
            <div className="flex items-center gap-3 mt-3">
              <IonButton onClick={() => exportTransactions()}>
                <IonIcon icon={cloudDownloadOutline} />&nbsp;Exportar
              </IonButton>
              <IonButton onClick={onImportClick}>
                <IonIcon icon={cloudUploadOutline} />&nbsp;Importar
              </IonButton>
              <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={onFile} />
              <IonButton color="danger" onClick={() => { if (confirm('Eliminar todos los datos?')) clearAll() }}>
                <IonIcon icon={trash} />&nbsp;Borrar todo
              </IonButton>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Settings
