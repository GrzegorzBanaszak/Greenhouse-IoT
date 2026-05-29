import { useHistory } from 'react-router-dom';
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowForwardOutline, leafOutline } from 'ionicons/icons';

export default function WelcomePage() {
  const history = useHistory();

  return (
    <IonPage>
      <IonContent fullscreen className="welcome-page">
        <main className="welcome-shell">
          <section className="welcome-card">
            <div className="logo-mark">
              <IonIcon icon={leafOutline} />
            </div>
            <h1>Greenhouse Controller</h1>
            <p>Steruj podlewaniem i monitoruj poziom wody</p>
            <IonButton expand="block" size="large" onClick={() => history.push('/search')}>
              Rozpocznij
              <IonIcon icon={arrowForwardOutline} slot="end" />
            </IonButton>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}
