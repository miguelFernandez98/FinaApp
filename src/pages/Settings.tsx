import React, { useState } from 'react'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonToggle,
} from '@ionic/react'

const Settings: React.FC = () => {
  const [dark, setDark] = useState(false)

  const toggleDark = (val: boolean) => {
    setDark(val)
    document.body.classList.toggle('dark', val)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Configuración</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonItem>
          <IonLabel>Modo Oscuro</IonLabel>
          <IonToggle checked={dark} onIonChange={(e) => toggleDark(e.detail.checked)} />
        </IonItem>
      </IonContent>
    </IonPage>
  )
}

export default Settings
