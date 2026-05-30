import { Redirect, Route, useLocation } from 'react-router-dom';
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
import { calendarOutline, scanCircleOutline, waterOutline } from 'ionicons/icons';
import WelcomePage from './pages/WelcomePage';
import SearchGreenhousePage from './pages/SearchGreenhousePage';
import ControlPage from './pages/ControlPage';
import SchedulePage from './pages/SchedulePage';

setupIonicReact();

function RootRedirect() {
  const hasSeenWelcome = window.localStorage.getItem('greenhouseWelcomeSeen') === 'true';

  return <Redirect to={hasSeenWelcome ? '/search' : '/start'} />;
}

function AppTabs() {
  const location = useLocation();
  const hideTabs = location.pathname === '/start';

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/start" component={WelcomePage} />
        <Route exact path="/search" component={SearchGreenhousePage} />
        <Route exact path="/control" component={ControlPage} />
        <Route exact path="/schedules" component={SchedulePage} />
        <Route exact path="/" component={RootRedirect} />
      </IonRouterOutlet>
      <IonTabBar slot="bottom" className={hideTabs ? 'tab-bar-hidden' : undefined}>
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
  );
}

export default function App() {
  return (
    <IonApp>
      <IonReactRouter>
        <AppTabs />
      </IonReactRouter>
    </IonApp>
  );
}
