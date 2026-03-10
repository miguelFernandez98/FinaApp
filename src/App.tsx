import React from 'react'
import {
  IonApp,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonLabel,
  IonIcon,
  IonRouterOutlet,
} from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import { home as homeIcon, list as listIcon, cog as cogIcon } from 'ionicons/icons'
import { Route, Redirect } from 'react-router-dom'
import { FinanceProvider } from './contexts/FinanceContext'
import Home from './pages/Home'
import History from './pages/History'
import Settings from './pages/Settings'
import './App.css'

const App: React.FC = () => {
  return (
    <IonApp>
      <FinanceProvider>
        <IonReactRouter>
          <IonTabs>
            <IonRouterOutlet>
              <Route path="/home" component={Home} exact={true} />
              <Route path="/history" component={History} exact={true} />
              <Route path="/settings" component={Settings} exact={true} />
              <Route exact path="/">
                <Redirect to="/home" />
              </Route>
            </IonRouterOutlet>

            <IonTabBar slot="bottom">
              <IonTabButton tab="home" href="/home">
                <IonIcon icon={homeIcon} />
                <IonLabel>Home</IonLabel>
              </IonTabButton>
              <IonTabButton tab="history" href="/history">
                <IonIcon icon={listIcon} />
                <IonLabel>Historial</IonLabel>
              </IonTabButton>
              <IonTabButton tab="settings" href="/settings">
                <IonIcon icon={cogIcon} />
                <IonLabel>Configuración</IonLabel>
              </IonTabButton>
            </IonTabBar>
          </IonTabs>
        </IonReactRouter>
      </FinanceProvider>
    </IonApp>
  )
}

export default App
