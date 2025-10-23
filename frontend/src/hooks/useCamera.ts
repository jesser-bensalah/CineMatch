import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface UseCameraReturn {
  takePhoto: () => Promise<{ file: File; webPath: string } | null>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useCamera = (): UseCameraReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const takePhoto = async (): Promise<{ file: File; webPath: string } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const isNative = Capacitor.isNativePlatform();
      console.log(' Taking photo on platform:', isNative ? 'Native' : 'Web');
      
      if (isNative) {
        return await takePhotoNative();
      } else {
        return await takePhotoWeb();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la sélection de la photo';
      setError(errorMessage);
      console.error(' Photo error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takePhotoNative = async (): Promise<{ file: File; webPath: string } | null> => {
    try {
      console.log('📱 Using native camera...');
      
     
      const available = await Camera.checkPermissions();
      console.log(' Camera permissions:', available);
      
      if (available.camera !== 'granted' || available.photos !== 'granted') {
        const permission = await Camera.requestPermissions({
          permissions: ['camera', 'photos']
        });
        console.log(' Requested permissions:', permission);
        
        if (permission.camera !== 'granted' || permission.photos !== 'granted') {
          throw new Error('Permissions caméra non accordées');
        }
      }

      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false,
        width: 800,
        height: 800,
        correctOrientation: true
      });

      if (!image.webPath) {
        throw new Error('Erreur lors de la capture de la photo');
      }

      console.log(' Photo captured:', image.webPath);

     
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      
      
      if (blob.size > 10 * 1024 * 1024) { 
        throw new Error('La photo est trop volumineuse (max 10MB)');
      }

      const file = new File([blob], `profile-photo-${Date.now()}.jpg`, { 
        type: blob.type || 'image/jpeg',
        lastModified: Date.now()
      });

      return { file, webPath: image.webPath };
    } catch (error) {
      console.warn('Native camera failed, falling back to file input:', error);
      return await takePhotoWeb();
    }
  };

  const takePhotoWeb = (): Promise<{ file: File; webPath: string } | null> => {
    return new Promise((resolve) => {
      console.log(' Using web file input...');
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; 
      
      const handleCancel = () => {
        window.removeEventListener('focus', handleCancel);
        setTimeout(() => {
          if (!input.files?.length) {
            console.log(' Photo selection cancelled');
            resolve(null);
          }
        }, 1000);
      };
      
      window.addEventListener('focus', handleCancel);
      
      input.onchange = (e: Event) => {
        window.removeEventListener('focus', handleCancel);
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
          // Vérification du type de fichier
          if (!file.type.startsWith('image/')) {
            setError('Veuillez sélectionner une image valide');
            resolve(null);
            return;
          }
          
         
          if (file.size > 10 * 1024 * 1024) { 
            setError('La photo est trop volumineuse (max 10MB)');
            resolve(null);
            return;
          }
          
          const webPath = URL.createObjectURL(file);
          console.log('Photo selected:', file.name, file.size, 'bytes');
          resolve({ file, webPath });
        } else {
          resolve(null);
        }
      };
      
      
      setTimeout(() => {
        if (input.parentNode) {
          input.parentNode.removeChild(input);
        }
      }, 1000);
      
      input.click();
    });
  };

  return {
    takePhoto,
    loading,
    error,
    clearError,
  };
};