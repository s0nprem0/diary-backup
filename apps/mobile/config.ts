import { Platform } from 'react-native';

// ---------------------------------------------------------
// CONFIGURATION
// ---------------------------------------------------------

// 1. Android Emulator (Standard)
const ANDROID_EMULATOR_IP = '10.0.2.2';

// 2. iOS Simulator (Standard)
const IOS_SIMULATOR_IP = 'localhost';

// 3. Physical Device (Run 'ipconfig' or 'ifconfig' on PC to find this)
// REPLACE THIS with your computer's LAN IP if testing on a real phone!
const LAN_IP = 'localhost';

const IP = Platform.select({
  android: ANDROID_EMULATOR_IP, // Change to LAN_IP if using physical Android device
  ios: IOS_SIMULATOR_IP,        // Change to LAN_IP if using physical iOS device
  default: LAN_IP,
});

const BASE_URL = `http://${IP}:3001`;

export const ENTRIES_API = `${BASE_URL}/entries`;
