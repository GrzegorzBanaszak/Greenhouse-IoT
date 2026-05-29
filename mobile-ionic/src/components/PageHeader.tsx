import { IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/react';
import { leafOutline } from 'ionicons/icons';

type PageHeaderProps = {
  title: string;
};

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <IonHeader translucent>
      <IonToolbar>
        <IonTitle>
          <span className="toolbar-title">
            <IonIcon icon={leafOutline} />
            {title}
          </span>
        </IonTitle>
      </IonToolbar>
    </IonHeader>
  );
}
