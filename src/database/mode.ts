import { Platform } from 'react-native';
// The recording instance is only a local web demo on its dedicated port.
// Native builds and the normal 8081 preview always use the original database.
export const isWalkthrough = __DEV__ && Platform.OS === 'web' && typeof window !== 'undefined' && window.location.port === '8082' && process.env.EXPO_PUBLIC_DEMO_MODE === '1';

