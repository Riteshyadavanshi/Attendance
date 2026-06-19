import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export function useFaceCapture() {
  const [capturing, setCapturing] = useState(false);
  const [lastImage, setLastImage] = useState<string | null>(null);

  const captureFace = useCallback(async (): Promise<string | null> => {
    setCapturing(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera', 'Camera permission is required for face check-in.');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        base64: true,
        cameraType: ImagePicker.CameraType.front,
        quality: 0.8,
      });

      if (result.canceled) return null;

      const base64 = result.assets[0]?.base64;
      if (!base64) {
        throw new Error('Camera did not return image data');
      }
      setLastImage(base64);
      return base64;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Camera error';
      Alert.alert('Camera', message);
      return null;
    } finally {
      setCapturing(false);
    }
  }, []);

  return { capturing, lastImage, captureFace };
}
