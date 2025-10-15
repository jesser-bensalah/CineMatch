import React, { useState, useRef } from 'react';
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
  IonAvatar,
  IonText,
  IonToast,
} from '@ionic/react';
import { useAuth } from '../hooks/useAuth';
import ErrorAlert from '../components/ErrorAlert';

const Register: React.FC = () => {
  const { register, loading: authLoading, error: authError, clearError } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    age: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('La photo ne doit pas dépasser 5MB');
        setShowError(true);
        return;
      }

      setPhoto(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
      clearFieldError('photo');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!photo) {
      errors.photo = 'Veuillez sélectionner une photo de profil';
    }

    if (!formData.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      errors.prenom = 'Le prénom est requis';
    }

    const age = parseInt(formData.age);
    if (!formData.age || isNaN(age)) {
      errors.age = 'L\'âge est requis';
    } else if (age < 13) {
      errors.age = 'Vous devez avoir au moins 13 ans';
    } else if (age > 120) {
      errors.age = 'L\'âge doit être réaliste';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'L\'email est requis';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.password) {
      errors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));

    if (fieldErrors[key]) {
      clearFieldError(key);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      age: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setPhoto(null);
    setPhotoPreview('');
    setFieldErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register({
        nom: formData.nom,
        prenom: formData.prenom,
        age: parseInt(formData.age),
        email: formData.email,
        password: formData.password,
        photo: photo!
      });

      setSuccessMessage(`🎉 Félicitations ${formData.prenom} ! Votre compte a été créé avec succès.`);
      setShowSuccess(true);

      setTimeout(() => {
        resetForm();
      }, 2000);

    } catch (error: any) {
      setErrorMessage(error.message);
      setShowError(true);
    }
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

      <IonContent fullscreen className="relative">
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <div className="max-w-2xl w-full space-y-6 premium-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                <span className="text-white text-5xl relative z-10">✨</span>
              </div>
              <h1 className="section-title mb-4">Rejoignez-nous</h1>
              <p className="text-xl text-gray-200 font-light">
                Créez votre compte et découvrez une communauté de cinéphiles
              </p>
            </div>

            {/* Registration Card */}
            <IonCard className="premium-movie-card">
              <IonCardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Photo */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <IonAvatar
                        className={`w-32 h-32 border-4 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${fieldErrors.photo ? 'border-red-500' : 'border-indigo-400/50 hover:border-purple-400'
                          }`}
                        onClick={triggerFileInput}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <span className="text-gray-400 text-lg font-medium">📸</span>
                          </div>
                        )}
                      </IonAvatar>
                      <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-2 shadow-lg">
                        <div className="bg-white rounded-full p-1">
                          <span className="text-indigo-500 text-sm">+</span>
                        </div>
                      </div>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />

                    <IonButton
                      fill="clear"
                      onClick={triggerFileInput}
                      className="mt-4 text-gradient-blue font-semibold text-lg"
                    >
                      📸 Choisir une photo
                    </IonButton>

                    {fieldErrors.photo && (
                      <IonText color="danger">
                        <p className="text-sm mt-2 text-red-400">{fieldErrors.photo}</p>
                      </IonText>
                    )}
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom */}
                    <IonItem className="enhanced-input" lines="none">
                      <IonLabel position="stacked" className="text-gradient-blue font-bold text-lg mb-4">
                        Nom *
                      </IonLabel>
                      <IonInput
                        type="text"
                        value={formData.nom}
                        onIonInput={(e) => handleInputChange('nom', e.detail.value!)}
                        required
                        className="text-white text-lg placeholder-gray-400"
                        placeholder="Votre nom"
                      />
                      {fieldErrors.nom && (
                        <IonText color="danger">
                          <p className="text-sm mt-1 text-red-400">{fieldErrors.nom}</p>
                        </IonText>
                      )}
                    </IonItem>

                    {/* Prénom */}
                    <IonItem className="enhanced-input" lines="none">
                      <IonLabel position="stacked" className="text-gradient-blue font-bold text-lg mb-4">
                        Prénom *
                      </IonLabel>
                      <IonInput
                        type="text"
                        value={formData.prenom}
                        onIonInput={(e) => handleInputChange('prenom', e.detail.value!)}
                        required
                        className="text-white text-lg placeholder-gray-400"
                        placeholder="Votre prénom"
                      />
                      {fieldErrors.prenom && (
                        <IonText color="danger">
                          <p className="text-sm mt-1 text-red-400">{fieldErrors.prenom}</p>
                        </IonText>
                      )}
                    </IonItem>
                  </div>

                  {/* Âge */}
                  <IonItem className="enhanced-input" lines="none">
                    <IonLabel position="stacked" className="text-gradient-blue font-bold text-lg mb-4">
                      Âge *
                    </IonLabel>
                    <IonInput
                      type="number"
                      inputMode="numeric"
                      value={formData.age}
                      onIonInput={(e) => {
                        const value = e.detail.value?.replace(/\D/g, '').slice(0, 3) || '';
                        handleInputChange('age', value);
                      }}
                      required
                      min="13"
                      max="120"
                      className="text-white text-lg placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Votre âge"
                    />
                    {fieldErrors.age && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-400">{fieldErrors.age}</p>
                      </IonText>
                    )}
                  </IonItem>

                  {/* Email */}
                  <IonItem className="enhanced-input" lines="none">
                    <IonLabel position="stacked" className="text-gradient-blue font-bold text-lg mb-4">
                      Email *
                    </IonLabel>
                    <IonInput
                      type="email"
                      value={formData.email}
                      onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                      required
                      className="text-white text-lg placeholder-gray-400"
                      placeholder="votre@email.com"
                    />
                    {fieldErrors.email && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-400">{fieldErrors.email}</p>
                      </IonText>
                    )}
                  </IonItem>

                  {/* Password */}
                  <IonItem className="enhanced-input" lines="none">
                    <IonLabel position="stacked" className="text-gradient-blue font-bold text-lg mb-4">
                      Mot de passe *
                    </IonLabel>
                    <IonInput
                      type="password"
                      value={formData.password}
                      onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                      required
                      className="text-white text-lg placeholder-gray-400"
                      placeholder="Minimum 8 caractères"
                    />
                    {fieldErrors.password && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-400">{fieldErrors.password}</p>
                      </IonText>
                    )}
                  </IonItem>

                  {/* Confirm Password */}
                  <IonItem className="enhanced-input" lines="none">
                    <IonLabel position="stacked" className="text-gradient-blue font-bold text-lg mb-4">
                      Confirmer le mot de passe *
                    </IonLabel>
                    <IonInput
                      type="password"
                      value={formData.confirmPassword}
                      onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
                      required
                      className="text-white text-lg placeholder-gray-400"
                      placeholder="Retapez votre mot de passe"
                    />
                    {fieldErrors.confirmPassword && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-400">{fieldErrors.confirmPassword}</p>
                      </IonText>
                    )}
                  </IonItem>

                  {/* Submit Button */}
                  <IonButton
                  fill="clear"
                    type="submit"
                    expand="block"
                    className="premium-btn mt-8 h-14"
                    disabled={authLoading}
                  >
                    {authLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-t-2 border-white border-solid rounded-full animate-spin mr-3"></div>
                        <span className="text-white font-semibold">Création du compte...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-2xl mr-3"></span>
                        <span className="text-lg font-bold" style={{ color: 'white' }}>Créer mon compte</span>
                      </div>
                    )}
                  </IonButton>

                  {/* Login Link */}
                  <div className="text-center pt-6 border-t border-white/20">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100 shadow-sm w-full">
                      <p className="text-gray-700 font-medium mb-3 w-full">
                        Déjà un compte ?
                      </p>
                      <IonButton
                        fill="clear"
                        routerLink="/login"
                        className="w-full bg-gradient-to-r premium-btn mt-8 h-14 rounded-2xl shadow-lg"
                      >
                        <span className="flex items-center justify-center text-lg">
                          <span className="mr-2"></span>
                          Se connecter
                          <span className="ml-2">→</span>
                        </span>
                      </IonButton>
                    </div>
                  </div>
                </form>
              </IonCardContent>
            </IonCard>


          </div>
        </div>

        {/* Error Alert */}
        <ErrorAlert
          isOpen={showError}
          onDismiss={() => {
            setShowError(false);
            clearError();
          }}
          message={errorMessage}
        />

        {/* Success Toast */}
        <IonToast
          isOpen={showSuccess}
          onDidDismiss={() => setShowSuccess(false)}
          message={successMessage}
          duration={5000}
          position="top"
          color="success"
          buttons={[
            {
              text: 'OK',
              role: 'cancel',
              handler: () => {
                setShowSuccess(false);
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};


export default Register;