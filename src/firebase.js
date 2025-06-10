import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  writeBatch
} from 'firebase/firestore';

// Firebase yapılandırma bilgileriniz
const firebaseConfig = {
  apiKey: "AIzaSyDpQP99GeDvk7nTytPvwZYyuguPj3QP0WA",
  authDomain: "kanban-task-management-96b56.firebaseapp.com",
  projectId: "kanban-task-management-96b56",
  storageBucket: "kanban-task-management-96b56.appspot.com",
  messagingSenderId: "192962477565",
  appId: "1:192962477565:web:a436932d42b24ed2ea6d94"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore'u başlat
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Batch işlemleri için yardımcı fonksiyon
const getBatch = () => writeBatch(db);

// Çevrimdışı desteği etkinleştir
const enableOfflinePersistence = async () => {
  try {
    await enableMultiTabIndexedDbPersistence(db);
    console.log("Çevrimdışı destek etkinleştirildi");
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn("Çoklu sekme açıkken çevrimdışı destek devre dışı bırakıldı");
    } else if (err.code === 'unimplemented') {
      console.warn("Tarayıcı çevrimdışı desteği desteklemiyor");
    } else {
      console.error("Çevrimdışı destek hatası:", err);
    }
  }
};

// Uygulama başladığında çevrimdışı desteği etkinleştir
enableOfflinePersistence();

export { db, getBatch, writeBatch };
export default app;