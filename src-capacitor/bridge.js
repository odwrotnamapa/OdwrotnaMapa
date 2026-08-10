import { registerPlugin, Capacitor } from '@capacitor/core';
import { Directory, Encoding } from '@capacitor/filesystem';

window.CapacitorApp = registerPlugin('App');
window.CapacitorFilesystem = registerPlugin('Filesystem');
window.CapacitorShare = registerPlugin('Share');
window.CapacitorDirectory = Directory;
window.CapacitorEncoding = Encoding;
window.CapacitorPlatform = Capacitor.getPlatform();
window.CapacitorIsNative = Capacitor.isNativePlatform();
