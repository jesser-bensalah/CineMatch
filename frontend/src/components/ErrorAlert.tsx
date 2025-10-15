import React from 'react';
import { IonAlert } from '@ionic/react';

interface ErrorAlertProps {
  isOpen: boolean;
  onDismiss: () => void;
  title?: string;
  message: string;
  buttonText?: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  isOpen,
  onDismiss,
  title = 'Erreur',
  message,
  buttonText = 'OK'
}) => {
  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      header={title}
      message={message}
      buttons={[buttonText]}
      className="rounded-lg"
      backdropDismiss={true}
    />
  );
};

export default ErrorAlert;