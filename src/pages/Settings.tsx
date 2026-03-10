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
import fetchRates, { setOfflineMode } from '../utils/rates'

type Rates = { USD: number; EUR: number }

const Settings: React.FC = () => {
  const [dark, setDark] = useState(false)

  const toggleDark = (val: boolean) => {
    setDark(val)
    document.body.classList.toggle('dark', val)
  }

  const fileRef = useRef<HTMLInputElement | null>(null)
  const { exportTransactions, importTransactions, clearAll } = useFinance()

  const [offline, setOffline] = useState<boolean>(() => {
    try { return localStorage.getItem('finanzapp_offline_mode_v1') === 'true' } catch (e) { return false }
  })
  const [cachedRates, setCachedRates] = useState<Rates | null>(() => {
    try {
      const raw = localStorage.getItem('finanzapp_cached_rates_v1')
      return raw ? JSON.parse(raw) as Rates : null
    } catch (e) { return null }
  })
  const [loadingRates, setLoadingRates] = useState(false)
  const [proxyUrl, setProxyUrl] = useState<string>(() => {
    try { return localStorage.getItem('finanzapp_binance_proxy_v1') || '' } catch (e) { return '' }
  })

  const toggleOffline = async (val: boolean) => {
    setOffline(val)
    try { setOfflineMode(val) } catch (e) {}
    if (!val) return
    // when enabling offline mode, ensure we have cached rates
    const cached = localStorage.getItem('finanzapp_cached_rates_v1')
    if (!cached) {
      // try to fetch now so cache is populated
      setLoadingRates(true)
      try {
        const r = await fetchRates()
        setCachedRates(r)
      } catch (e) {
        // ignore
      } finally {
        setLoadingRates(false)
      }
    }
  }

  const refreshRates = async () => {
    setLoadingRates(true)
    try {
      const r = await fetchRates()
      setCachedRates(r)
      alert('Tasas actualizadas')
    } catch (e) {
      alert('No se pudieron actualizar las tasas')
    } finally { setLoadingRates(false) }
  }

  const saveProxy = () => {
    try { localStorage.setItem('finanzapp_binance_proxy_v1', proxyUrl || '') } catch (e) {}
    alert(proxyUrl ? 'Proxy guardado' : 'Proxy limpiado')
  }

  const clearProxy = () => {
    try { localStorage.removeItem('finanzapp_binance_proxy_v1') } catch (e) {}
    setProxyUrl('')
    alert('Proxy eliminado')
  }

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Modo Sin Conexión</h2>
                <p className="muted">Cuando está activo, la app usa tasas en cache y no hace llamadas externas.</p>
              </div>
              <IonItem lines="none">
                <IonToggle checked={offline} onIonChange={(e) => toggleOffline(e.detail.checked)} />
              </IonItem>
            </div>
            <div className="mt-3">
              {cachedRates ? (
                <div className="muted">Tasas en cache: USD→{cachedRates.USD.toLocaleString()} VES · EUR→{cachedRates.EUR.toLocaleString()} VES</div>
              ) : (
                <div className="muted">No hay tasas en cache.</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <IonButton onClick={refreshRates} disabled={loadingRates}>
                  {loadingRates ? 'Actualizando...' : 'Actualizar tasas'}
                </IonButton>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold">Proxy para Binance P2P</h3>
            <p className="muted">Si Binance bloquea CORS, puedes configurar un proxy. Usa {"{url}"} en la URL para que se reemplace por la URL objetivo, o proporciona un prefijo que acepte la URL codificada al final.</p>
            <div className="mt-2">
              <IonItem>
                <IonLabel position="stacked">Proxy URL</IonLabel>
                <input value={proxyUrl} onChange={(e) => setProxyUrl((e.target as HTMLInputElement).value)} placeholder="https://my-proxy.example.com/?url=" style={{ width: '100%' }} />
              </IonItem>
              <div className="flex items-center gap-2 mt-2">
                <IonButton onClick={saveProxy}>Guardar proxy</IonButton>
                <IonButton color="medium" onClick={clearProxy}>Eliminar proxy</IonButton>
              </div>
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
