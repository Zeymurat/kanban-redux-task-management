const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const data = require('./src/data/data.json');

// Firebase Admin SDK'yı başlat
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function importData() {
  try {
    console.log('Veri aktarımı başlıyor...');
    
    // Mevcut verileri temizle (isteğe bağlı)
    // console.log('Mevcut veriler temizleniyor...');
    // const boardsSnapshot = await db.collection('boards').get();
    // const batch = db.batch();
    // boardsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    // await batch.commit();

    // Yeni verileri ekle
    console.log('Yeni veriler ekleniyor...');
    const batch = db.batch();
    const boardsRef = db.collection('boards');
    
    for (const board of data.boards) {
      console.log(`Board ekleniyor: ${board.name}`);
      const boardRef = boardsRef.doc();
      const boardData = {
        name: board.name,
        isActive: board.isActive || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      batch.set(boardRef, boardData);
      
      // Columns ekle
      if (board.columns && board.columns.length > 0) {
        for (const column of board.columns) {
          const columnRef = boardRef.collection('columns').doc();
          const columnData = {
            name: column.name,
            order: column.order || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          batch.set(columnRef, columnData);
          
          // Tasks ekle
          if (column.tasks && column.tasks.length > 0) {
            for (const task of column.tasks) {
              const taskRef = columnRef.collection('tasks').doc();
              const taskData = {
                title: task.title,
                description: task.description || '',
                status: task.status || column.name,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
              };
              
              batch.set(taskRef, taskData);
              
              // Subtasks ekle
              if (task.subtasks && task.subtasks.length > 0) {
                for (const [index, subtask] of task.subtasks.entries()) {
                  const subtaskRef = taskRef.collection('subtasks').doc();
                  const subtaskData = {
                    title: subtask.title,
                    isCompleted: subtask.isCompleted || false,
                    order: index,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                  };
                  
                  batch.set(subtaskRef, subtaskData);
                }
              }
            }
          }
        }
      }
    }
    
    await batch.commit();
    console.log('Veri aktarımı başarıyla tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('Veri aktarımı sırasında hata oluştu:', error);
    process.exit(1);
  }
}

importData();
