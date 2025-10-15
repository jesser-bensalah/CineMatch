import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface UseCameraReturn {
  takePhoto: () => Promise<{ file: File; webPath: string } | null>;
  loading: boolean;
  error: string | null;
}

export const useCamera = (): UseCameraReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const takePhoto = async (): Promise<{ file: File; webPath: string } | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const isNative = Capacitor.isNativePlatform();
      
      if (isNative) {
        return await takePhotoNative();
      } else {
        return await takePhotoWeb();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erreur lors de la sélection de la photo';
      setError(errorMessage);
      console.error('Photo error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const takePhotoNative = async (): Promise<{ file: File; webPath: string } | null> => {
    try {
     
      const available = await Camera.checkPermissions();
      if (available.camera !== 'granted' || available.photos !== 'granted') {
        const permission = await Camera.requestPermissions();
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
      });

      if (!image.webPath) {
        throw new Error('Erreur lors de la capture de la photo');
      }

      
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const file = new File([blob], 'profile-photo.jpg', { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      return { file, webPath: image.webPath };
    } catch (error) {
      
      console.warn('Camera native failed, falling back to file input');
      return await takePhotoWeb();
    }
  };

  const takePhotoWeb = (): Promise<{ file: File; webPath: string } | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (file) {
          const webPath = URL.createObjectURL(file);
          resolve({ file, webPath });
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  };

  return {
    takePhoto,
    loading,
    error,
  };
};