/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  name: "HR Attendance",
  slug: "hr-attendance",
  version: "1.0.0",
  sdkVersion: "54.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#2563eb",
  },
  assetBundlePatterns: ["**/*"],
  androidStatusBar: {
    translucent: false,
    barStyle: "dark-content",
    backgroundColor: "#4F46E5",
  },
  ios: {
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription:
        "Camera is used for face enrollment and attendance check-in.",
      NSLocationWhenInUseUsageDescription:
        "Location is used to verify you are within the office geofence.",
    },
  },
  android: {
    package: "com.riteshyadavanshi.attendance",
    edgeToEdgeEnabled: false,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#2563eb",
    },
    permissions: ["CAMERA", "ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  plugins: [
    "expo-asset",
    "expo-font",
    [
      "expo-image-picker",
      {
        cameraPermission:
          "Allow HR Attendance to use your camera for face check-in.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow HR Attendance to use your location for geofenced check-in.",
      },
    ],
  ],
  extra: {
    eas: {
      projectId: "bd7f32c7-8d3f-4b13-99de-092427e14ac5",
    },
  },
};
