const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');
const data = require('../src/data/data.json');

// Firebase Admin SDK'yı başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function importData() {
  try {
    const batch = db.batch();
    const boardsRef = db.collection('boards');
    
    // Mevcut verileri temizle (opsiyonel)
    // const snapshot = await boardsRef.get();
    // snapshot.docs.forEach(doc => {
    //   batch.delete(doc.ref);
    // });
    // await batch.commit();
    // batch = db.batch();
    
    // Yeni verileri ekle
    for (const board of data.boards) {
      const boardRef = boardsRef.doc();
      const boardData = {
        ...board,
        id: boardRef.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      batch.set(boardRef, boardData);
    }
    
    await batch.commit();
    console.log('Veriler başarıyla yüklendi!');
    process.exit(0);
  } catch (error) {
    console.error('Veri yüklenirken hata oluştu:', error);
    process.exit(1);
  }
}

importData();
