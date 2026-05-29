import { Redirect, Route } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { calendarOutline, homeOutline, scanCircleOutline, waterOutline } from 'ionicons/icons';
import WelcomePage from './pages/WelcomePage';
import SearchGreenhousePage from './pages/SearchGreenhousePage';
import ControlPage from './pages/ControlPage';
import SchedulePage from './pages/SchedulePage';

setupIonicReact();

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <IonTabs>
          <IonRouterOutlet>
            <Route exact path="/start" component={WelcomePage} />
            <Route exact path="/search" component={SearchGreenhousePage} />
            <Route exact path="/control" component={ControlPage} />
            <Route exact path="/schedules" component={SchedulePage} />
            <Route exact path="/">
              <Redirect to="/start" />
            </Route>
          </IonRouterOutlet>
          <IonTabBar slot="bottom">
            <IonTabButton tab="start" href="/start">
              <IonIcon icon={homeOutline} />
              <IonLabel>Start</IonLabel>
            </IonTabButton>
            <IonTabButton tab="search" href="/search">
              <IonIcon icon={scanCircleOutline} />
              <IonLabel>Szukaj</IonLabel>
            </IonTabButton>
            <IonTabButton tab="control" href="/control">
              <IonIcon icon={waterOutline} />
              <IonLabel>Sterowanie</IonLabel>
            </IonTabButton>
            <IonTabButton tab="schedules" href="/schedules">
              <IonIcon icon={calendarOutline} />
              <IonLabel>Harmonogram</IonLabel>
            </IonTabButton>
          </IonTabBar>
        </IonTabs>
      </IonReactRouter>
    </IonApp>
  );
}
