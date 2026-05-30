import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonButton, IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowForwardOutline, leafOutline } from 'ionicons/icons';

const welcomeStorageKey = 'greenhouseWelcomeSeen';

export default function WelcomePage() {
  const history = useHistory();

  useEffect(() => {
    if (window.localStorage.getItem(welcomeStorageKey) === 'true') {
      history.replace('/search');
    }
  }, [history]);

  function startSetup() {
    window.localStorage.setItem(welcomeStorageKey, 'true');
    history.replace('/search');
  }

  return (
    <IonPage>
      <IonContent fullscreen className="welcome-page">
        <main className="welcome-splash">
          <div className="welcome-background" aria-hidden="true">
            <div className="welcome-background-image" />
            <div className="welcome-background-overlay" />
          </div>

          <section className="welcome-content" aria-label="Greenhouse Controller">
            <div className="welcome-logo-wrap welcome-animate">
              <div className="welcome-logo">
                <IonIcon icon={leafOutline} />
              </div>
            </div>

            <div className="welcome-copy">
              <h1 className="welcome-animate welcome-delay-100">Greenhouse Controller</h1>
              <p className="welcome-animate welcome-delay-200">Steruj podlewaniem i monitoruj poziom wody</p>
            </div>

            <div className="welcome-spacer" />

            <div className="welcome-action welcome-animate welcome-delay-300">
              <IonButton expand="block" size="large" className="welcome-start-button" onClick={startSetup}>
                Rozpocznij
                <IonIcon icon={arrowForwardOutline} slot="end" />
              </IonButton>
            </div>
          </section>
        </main>
      </IonContent>
    </IonPage>
  );
}
