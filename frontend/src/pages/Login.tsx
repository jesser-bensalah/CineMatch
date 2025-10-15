import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonInput,
  IonButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonText,
} from '@ionic/react';
import { useAuth } from '../hooks/useAuth';
import ErrorAlert from '../components/ErrorAlert';

const Login: React.FC = () => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showError, setShowError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (error: any) {
      setShowError(true);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <IonPage className="bg-transparent overflow-hidden">
      <IonHeader className="premium-header">
        <IonToolbar className="bg-transparent">
          <IonTitle className="text-center">
            <div className="cinematch-logo">CineMatch</div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent fullscreen className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-60 blur-xl hidden md:block"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-60 blur-xl hidden md:block"></div>
        
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative z-10 w-full max-w-screen overflow-hidden">
          <div className="w-full max-w-md space-y-6 sm:space-y-8 premium-fade-in mx-auto">
            {/* Hero Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl relative overflow-hidden border-4 border-white">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                <span className="text-white text-3xl sm:text-4xl relative z-10">🎬</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
                Content de vous revoir
              </h1>
              <p className="text-base sm:text-lg text-gray-600 font-medium">
                Reconnectez-vous à votre univers cinéphile
              </p>
            </div>

            {/* Login Card */}
            <IonCard className="rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 bg-white/90 backdrop-blur-sm w-full mx-auto">
              <IonCardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 w-full">
                  {/* Email Input */}
                  <div className="space-y-2 w-full">
                    <IonLabel className="text-gray-800 font-bold text-base sm:text-lg flex items-center">
                      <span className="mr-2">📧</span>
                      Adresse Email
                      <span className="text-red-500 ml-1">*</span>
                    </IonLabel>
                    <IonItem 
                      className={`enhanced-input rounded-xl sm:rounded-2xl ${formData.email ? 'border-blue-500' : 'border-gray-200'}`} 
                      lines="none"
                    >
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                        required
                        className="text-gray-800 text-base sm:text-lg placeholder-gray-500"
                        placeholder="votre@email.com"
                      />
                    </IonItem>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2 w-full">
                    <IonLabel className="text-gray-800 font-bold text-base sm:text-lg flex items-center">
                      <span className="mr-2">🔒</span>
                      Mot de passe
                      <span className="text-red-500 ml-1">*</span>
                    </IonLabel>
                    <IonItem 
                      className={`enhanced-input rounded-xl sm:rounded-2xl ${formData.password ? 'border-blue-500' : 'border-gray-200'}`} 
                      lines="none"
                    >
                      <IonInput
                        type="password"
                        value={formData.password}
                        onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                        required
                        className="text-gray-800 text-base sm:text-lg placeholder-gray-500"
                        placeholder="Votre mot de passe"
                      />
                    </IonItem>
                  </div>

                  {/* Submit Button */}
                  <IonButton 
                  fill="clear"
                    type="submit" 
                    expand="block" 
                    className="premium-btn mt-6 sm:mt-8 h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                        <span className="text-white font-semibold text-base sm:text-lg">Connexion...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-xl sm:text-2xl mr-3"></span>
                        <span className="text-base sm:text-lg font-bold text-white">Se connecter</span>
                      </div>
                    )}
                  </IonButton>

                  {/* Register Link - Plus visible */}
                  <div className="text-center pt-5 sm:pt-6 border-t w-full">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-100 shadow-sm w-full">
                      <p className="text-gray-700 font-medium mb-2 sm:mb-3 text-sm sm:text-base w-full">
                        Nouveau sur CineMatch ?
                      </p>
                      <IonButton 
                        fill="clear" 
                        routerLink="/register"
                        className="w-full  premium-btn mt-6 sm:mt-8 h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg"
                      >
                        <span className="flex items-center justify-center text-base sm:text-lg">
                          <span className="mr-2"></span>
                          Créer mon compte
                          <span className="ml-2">→</span>
                        </span>
                      </IonButton>
                    </div>
                  </div>
                </form>
              </IonCardContent>
            </IonCard>

            {/* Security Note */}
            <div className="text-center mt-4 sm:mt-6 w-full">
              <p className="text-xs sm:text-sm text-gray-500 flex items-center justify-center w-full text-center px-2">
                <span className="mr-2">🔒</span>
                Vos données sont sécurisées et confidentielles
              </p>
            </div>
          </div>
        </div>

        <ErrorAlert
          isOpen={showError}
          onDismiss={() => {
            setShowError(false);
            clearError();
          }}
          message={error || 'Erreur lors de la connexion'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
