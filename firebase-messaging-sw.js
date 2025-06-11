// // firebase-messaging-sw.js

// importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
// importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// firebase.initializeApp({
//   apiKey: "AIzaSyCgJgzPaZ-XRjuJdtwiwqA75uLwzghx38Y",
//   authDomain: "printing-app-80c92.firebaseapp.com",
//   projectId: "printing-app-80c92",
//   storageBucket: "printing-app-80c92.firebasestorage.app",
//   messagingSenderId: "962407205985",
//   appId: "1:962407205985:web:615841b83ec64db0f16e20",
//   measurementId: "G-N8Z50JTSXY"
// });

// const messaging = firebase.messaging();

// // Optional: handle background messages here
// messaging.onBackgroundMessage((payload) => {
//   console.log('[firebase-messaging-sw.js] Received background message ', payload);
//   // Customize notification here if needed
// });

// firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCgJgzPaZ-XRjuJdtwiwqA75uLwzghx38Y",
  authDomain: "printing-app-80c92.firebaseapp.com",
  projectId: "printing-app-80c92",
  storageBucket: "printing-app-80c92.firebasestorage.app",
  messagingSenderId: "962407205985",
  appId: "1:962407205985:web:615841b83ec64db0f16e20",
  measurementId: "G-N8Z50JTSXY"
});

const messaging = firebase.messaging();

// Show background notifications with custom icon
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const { title, body, icon, badge } = payload.notification;

//   console.log

  self.registration.showNotification(title, {
    body: body,
    icon: icon, // Your custom brand icon
    badge: badge         // Optional small monochrome icon
  });
});
