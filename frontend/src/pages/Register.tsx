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
  isPlatform,
} from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useAuth } from '../hooks/useAuth';
import ErrorAlert from '../components/ErrorAlert';

const Register: React.FC = () => {
  const { register, loading: authLoading, clearError } = useAuth();
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

  
  const isNative = isPlatform('capacitor');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('La photo ne doit pas dépasser 5MB');
      setShowError(true);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Veuillez sélectionner une image valide');
      setShowError(true);
      return;
    }

    setPhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    clearFieldError('photo');
    
    
  };

  const takePhotoNative = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        correctOrientation: true
      });

      if (image.dataUrl) {
        // Convertir DataUrl en File
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'profile-photo.jpg', { 
          type: 'image/jpeg',
          lastModified: new Date().getTime()
        });

        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage('La photo ne doit pas dépasser 5MB');
          setShowError(true);
          return;
        }

        setPhoto(file);
        setPhotoPreview(image.dataUrl);
        clearFieldError('photo');
        
        console.log('📸 Photo prise avec succès (native)');
      }
    } catch (error) {
      console.log('Camera cancelled or error:', error);
    
      if (error !== 'USER_CANCELED' && error !== 'canceled') {
        setErrorMessage('Erreur lors de la prise de photo');
        setShowError(true);
      }
    }
  };

  const openGalleryNative = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        correctOrientation: true
      });

      if (image.dataUrl) {
        // Convertir DataUrl en File
        const response = await fetch(image.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'profile-photo.jpg', { 
          type: 'image/jpeg',
          lastModified: new Date().getTime()
        });

        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage('La photo ne doit pas dépasser 5MB');
          setShowError(true);
          return;
        }

        setPhoto(file);
        setPhotoPreview(image.dataUrl);
        clearFieldError('photo');
        
        console.log(' Photo sélectionnée depuis la galerie (native)');
      }
    } catch (error) {
      console.log('Gallery cancelled or error:', error);
     
      if (error !== 'USER_CANCELED' && error !== 'canceled') {
        setErrorMessage('Erreur lors de la sélection depuis la galerie');
        setShowError(true);
      }
    }
  };

  const takePhotoWeb = async () => {
    try {
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false 
      });
      
      // Créer un élément video pour afficher le flux caméra
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Créer un canvas pour capturer la photo
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Attendre que la vidéo soit prête
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Créer une modal pour afficher la caméra
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
       
        video.style.maxWidth = '90%';
        video.style.maxHeight = '70%';
        video.style.borderRadius = '10px';
        
       
        const captureBtn = document.createElement('button');
        captureBtn.textContent = '📸 Prendre la photo';
        captureBtn.style.marginTop = '20px';
        captureBtn.style.padding = '10px 20px';
        captureBtn.style.backgroundColor = '#4F46E5';
        captureBtn.style.color = 'white';
        captureBtn.style.border = 'none';
        captureBtn.style.borderRadius = '5px';
        captureBtn.style.cursor = 'pointer';
        captureBtn.style.fontSize = '16px';
        
       
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = ' Annuler';
        cancelBtn.style.marginTop = '10px';
        cancelBtn.style.padding = '10px 20px';
        cancelBtn.style.backgroundColor = '#6B7280';
        cancelBtn.style.color = 'white';
        cancelBtn.style.border = 'none';
        cancelBtn.style.borderRadius = '5px';
        cancelBtn.style.cursor = 'pointer';
        cancelBtn.style.fontSize = '16px';
        
        captureBtn.onclick = () => {
          // Capturer la photo
          context?.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convertir en blob
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], 'profile-photo.jpg', { 
                type: 'image/jpeg',
                lastModified: new Date().getTime()
              });
              
              processSelectedFile(file);
            }
            
            // Nettoyer
            stream.getTracks().forEach(track => track.stop());
            document.body.removeChild(modal);
          }, 'image/jpeg', 0.9);
        };
        
        cancelBtn.onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
        };
        
        modal.appendChild(video);
        modal.appendChild(captureBtn);
        modal.appendChild(cancelBtn);
        document.body.appendChild(modal);
      });
      
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      
     
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; 
      
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          processSelectedFile(file);
        }
      };
      
      input.click();
    }
  };

  const openGalleryWeb = () => {
    
    fileInputRef.current?.click();
  };

  const takePhoto = isNative ? takePhotoNative : takePhotoWeb;
  const openGallery = isNative ? openGalleryNative : openGalleryWeb;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!photo && !photoPreview) {
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

      setSuccessMessage(` Félicitations ${formData.prenom} ! Votre compte a été créé avec succès.`);
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
        {/* Background Elements */}
        <div className="absolute inset-0 bg-white/80"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-200 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-60 blur-xl hidden md:block"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200 rounded-full translate-x-1/3 translate-y-1/3 opacity-60 blur-xl hidden md:block"></div>
        
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <div className="max-w-2xl w-full space-y-6 premium-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                <span className="text-white text-5xl relative z-10">✨</span>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Rejoignez-nous</h1>
              <p className="text-xl text-gray-600 font-light">
                Créez votre compte et découvrez une communauté de cinéphiles
              </p>
            </div>

            {/* Registration Card */}
            <IonCard className="rounded-3xl shadow-2xl border border-gray-100 bg-white/90 backdrop-blur-sm">
              <IonCardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Profile Photo Section */}
                  <div className="text-center">
                    <IonLabel className="text-gray-800 font-bold text-lg mb-4 block">
                      Photo de profil *
                    </IonLabel>
                    
                    <div className="relative inline-block mb-4">
                      <IonAvatar
                        className={`w-32 h-32 border-4 shadow-2xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                          fieldErrors.photo ? 'border-red-500' : 'border-indigo-400 hover:border-purple-400'
                        }`}
                        onClick={openGallery}
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-4xl">👤</span>
                          </div>
                        )}
                      </IonAvatar>
                      
                      {/* Bouton + pour ajouter une photo */}
                      <button
                        type="button"
                        onClick={openGallery}
                        className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-3 shadow-lg hover:scale-110 transition-transform duration-200"
                      >
                        <div className="bg-white rounded-full p-1 w-8 h-8 flex items-center justify-center">
                          <span className="text-indigo-500 text-lg font-bold">+</span>
                        </div>
                      </button>
                    </div>

                    {/* Input caché pour la galerie */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {/* Boutons Caméra et Galerie */}
                    <div className="flex justify-center space-x-4 mt-4">
                      <IonButton
                        fill="solid"
                        onClick={takePhoto}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl"
                        size="small"
                      >
                        <span className="mr-2"></span>
                        {isNative ? 'Caméra' : 'Prendre une photo'}
                      </IonButton>
                      
                      <IonButton
                        fill="solid"
                        onClick={openGallery}
                        className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl"
                        size="small"
                      >
                        <span className="mr-2"></span>
                        {isNative ? 'Galerie' : 'Choisir un fichier'}
                      </IonButton>
                    </div>

                    {fieldErrors.photo && (
                      <IonText color="danger">
                        <p className="text-sm mt-2 text-red-500">{fieldErrors.photo}</p>
                      </IonText>
                    )}
                  </div>

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom */}
                    <div className="space-y-2">
                      <IonLabel className="text-gray-800 font-bold text-lg">
                        Nom *
                      </IonLabel>
                      <IonItem className="enhanced-input rounded-xl border border-gray-200" lines="none">
                        <IonInput
                          type="text"
                          value={formData.nom}
                          onIonInput={(e) => handleInputChange('nom', e.detail.value!)}
                          required
                          className="text-gray-800 text-lg placeholder-gray-500"
                          placeholder="Votre nom"
                        />
                      </IonItem>
                      {fieldErrors.nom && (
                        <IonText color="danger">
                          <p className="text-sm mt-1 text-red-500">{fieldErrors.nom}</p>
                        </IonText>
                      )}
                    </div>

                    {/* Prénom */}
                    <div className="space-y-2">
                      <IonLabel className="text-gray-800 font-bold text-lg">
                        Prénom *
                      </IonLabel>
                      <IonItem className="enhanced-input rounded-xl border border-gray-200" lines="none">
                        <IonInput
                          type="text"
                          value={formData.prenom}
                          onIonInput={(e) => handleInputChange('prenom', e.detail.value!)}
                          required
                          className="text-gray-800 text-lg placeholder-gray-500"
                          placeholder="Votre prénom"
                        />
                      </IonItem>
                      {fieldErrors.prenom && (
                        <IonText color="danger">
                          <p className="text-sm mt-1 text-red-500">{fieldErrors.prenom}</p>
                        </IonText>
                      )}
                    </div>
                  </div>

                  {/* Âge */}
                  <div className="space-y-2">
                    <IonLabel className="text-gray-800 font-bold text-lg">
                      Âge *
                    </IonLabel>
                    <IonItem className="enhanced-input rounded-xl border border-gray-200" lines="none">
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
                        className="text-gray-800 text-lg placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Votre âge"
                      />
                    </IonItem>
                    {fieldErrors.age && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-500">{fieldErrors.age}</p>
                      </IonText>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <IonLabel className="text-gray-800 font-bold text-lg">
                      Email *
                    </IonLabel>
                    <IonItem className="enhanced-input rounded-xl border border-gray-200" lines="none">
                      <IonInput
                        type="email"
                        value={formData.email}
                        onIonInput={(e) => handleInputChange('email', e.detail.value!)}
                        required
                        className="text-gray-800 text-lg placeholder-gray-500"
                        placeholder="votre@email.com"
                      />
                    </IonItem>
                    {fieldErrors.email && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-500">{fieldErrors.email}</p>
                      </IonText>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <IonLabel className="text-gray-800 font-bold text-lg">
                      Mot de passe *
                    </IonLabel>
                    <IonItem className="enhanced-input rounded-xl border border-gray-200" lines="none">
                      <IonInput
                        type="password"
                        value={formData.password}
                        onIonInput={(e) => handleInputChange('password', e.detail.value!)}
                        required
                        className="text-gray-800 text-lg placeholder-gray-500"
                        placeholder="Minimum 8 caractères"
                      />
                    </IonItem>
                    {fieldErrors.password && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-500">{fieldErrors.password}</p>
                      </IonText>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <IonLabel className="text-gray-800 font-bold text-lg">
                      Confirmer le mot de passe *
                    </IonLabel>
                    <IonItem className="enhanced-input rounded-xl border border-gray-200" lines="none">
                      <IonInput
                        type="password"
                        value={formData.confirmPassword}
                        onIonInput={(e) => handleInputChange('confirmPassword', e.detail.value!)}
                        required
                        className="text-gray-800 text-lg placeholder-gray-500"
                        placeholder="Retapez votre mot de passe"
                      />
                    </IonItem>
                    {fieldErrors.confirmPassword && (
                      <IonText color="danger">
                        <p className="text-sm mt-1 text-red-500">{fieldErrors.confirmPassword}</p>
                      </IonText>
                    )}
                  </div>

                  {/* Submit Button */}
                  <IonButton
                    type="submit"
                    expand="block"
                    fill="clear"
                    className="w-full premium-btn h-14 rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white"
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
                        <span className="text-lg font-bold text-white">Créer mon compte</span>
                      </div>
                    )}
                  </IonButton>

                  {/* Login Link */}
                  <div className="text-center pt-6 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100 shadow-sm">
                      <p className="text-gray-700 font-medium mb-3">
                        Déjà un compte ?
                      </p>
                      <IonButton
                        fill="clear"
                        routerLink="/login"
                        className="w-full premium-btn h-14 rounded-xl shadow-lg bg-gradient-to-r from-green-500 to-green-600"
                      >
                        <span className="flex items-center justify-center text-white font-semibold">
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