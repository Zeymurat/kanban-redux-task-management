import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db, getBatch } from '../firebase';

// Firestore referansı
const boardsRef = collection(db, 'boards');

// Yardımcı fonksiyonlar
const fetchBoardData = async (boardId) => {
  const boardDoc = await getDoc(doc(db, 'boards', boardId));
  if (!boardDoc.exists()) return null;
  
  const boardData = boardDoc.data();
  // Convert Firestore Timestamps to JavaScript Date objects
  if (boardData.createdAt && typeof boardData.createdAt.toDate === 'function') {
    boardData.createdAt = boardData.createdAt.toDate().toISOString();
  }
  if (boardData.updatedAt && typeof boardData.updatedAt.toDate === 'function') {
    boardData.updatedAt = boardData.updatedAt.toDate().toISOString();
  }
  boardData.id = boardDoc.id;
  
  // Columns'ları getir
  const columnsSnapshot = await getDocs(collection(db, 'boards', boardId, 'columns'));
  boardData.columns = [];
  
  for (const colDoc of columnsSnapshot.docs) {
    const columnData = colDoc.data();
    // Convert Firestore Timestamps to JavaScript Date objects
    if (columnData.createdAt && typeof columnData.createdAt.toDate === 'function') {
      columnData.createdAt = columnData.createdAt.toDate().toISOString();
    }
    if (columnData.updatedAt && typeof columnData.updatedAt.toDate === 'function') {
      columnData.updatedAt = columnData.updatedAt.toDate().toISOString();
    }
    const column = { id: colDoc.id, ...columnData };
    
    // Task'ları getir
    const tasksSnapshot = await getDocs(collection(db, 'boards', boardId, 'columns', colDoc.id, 'tasks'));
    column.tasks = [];
    
    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data();
      // Convert Firestore Timestamps to JavaScript Date objects
      if (taskData.createdAt && typeof taskData.createdAt.toDate === 'function') {
        taskData.createdAt = taskData.createdAt.toDate().toISOString();
      }
      if (taskData.updatedAt && typeof taskData.updatedAt.toDate === 'function') {
        taskData.updatedAt = taskData.updatedAt.toDate().toISOString();
      }
      const task = { id: taskDoc.id, ...taskData };
      
      // Subtask'ları getir
      const subtasksSnapshot = await getDocs(collection(
        db, 
        'boards', 
        boardId, 
        'columns', 
        colDoc.id, 
        'tasks', 
        taskDoc.id, 
        'subtasks'
      ));
      
      task.subtasks = subtasksSnapshot.docs.map(st => {
        const subtaskData = st.data();
        // Convert Firestore Timestamps to JavaScript Date objects
        if (subtaskData.createdAt && typeof subtaskData.createdAt.toDate === 'function') {
          subtaskData.createdAt = subtaskData.createdAt.toDate().toISOString();
        }
        if (subtaskData.updatedAt && typeof subtaskData.updatedAt.toDate === 'function') {
          subtaskData.updatedAt = subtaskData.updatedAt.toDate().toISOString();
        }
        return {
          id: st.id,
          ...subtaskData
        };
      });
      
      column.tasks.push(task);
    }
    
    boardData.columns.push(column);
  }
  
  return boardData;
};

// Async Thunks
export const loadBoards = createAsyncThunk(
  'boards/loadBoards',
  async () => {
    console.log('loadBoards: Fetching boards from Firestore...');
    try {
      const snapshot = await getDocs(boardsRef);
      console.log(`loadBoards: Found ${snapshot.docs.length} boards`);
      
      const boards = [];
      
      for (const doc of snapshot.docs) {
        console.log(`loadBoards: Processing board ${doc.id}...`);
        try {
          const boardData = await fetchBoardData(doc.id);
          if (boardData) {
            console.log(`loadBoards: Successfully loaded board ${doc.id} with ${boardData.columns?.length || 0} columns`);
            boards.push(boardData);
          } else {
            console.warn(`loadBoards: Failed to load board ${doc.id}, skipping...`);
          }
        } catch (error) {
          console.error(`loadBoards: Error loading board ${doc.id}:`, error);
        }
      }
      
      console.log(`loadBoards: Successfully loaded ${boards.length} boards`);
      return boards;
    } catch (error) {
      console.error('loadBoards: Error fetching boards:', error);
      throw error;
    }
  }
);

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (boardData) => {
    const newBoard = await addBoardToFirestore(boardData);
    return newBoard;
  }
);

// Add task to Firestore
const addTaskToFirestore = async (boardId, columnId, taskData) => {
  try {
    console.log('addTaskToFirestore - Input:', { boardId, columnId, taskData });
    
    // Temel görev verisini oluştur
    const taskRef = doc(collection(db, 'boards', boardId, 'columns', columnId, 'tasks'));
    
    // Yeni görev nesnesini oluştur, subtasks'ı çıkarıyoruz
    const { subtasks, ...taskWithoutSubtasks } = taskData;
    
    const newTask = {
      ...taskWithoutSubtasks,
      id: taskRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating task with data:', newTask);
    await setDoc(taskRef, newTask);
    
    // Alt görevleri işle
    const processedSubtasks = [];
    
    // Eğer geçerli alt görevler varsa işle
    if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      console.log(`Processing ${subtasks.length} subtasks`);
      const batch = getBatch();
      const subtasksRef = collection(db, 'boards', boardId, 'columns', columnId, 'tasks', taskRef.id, 'subtasks');
      
      for (const subtask of subtasks) {
        try {
          const subtaskRef = doc(subtasksRef);
          const newSubtask = {
            ...subtask,
            id: subtaskRef.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          batch.set(subtaskRef, newSubtask);
          processedSubtasks.push(newSubtask);
        } catch (subtaskError) {
          console.error('Error processing subtask:', subtaskError);
          // Hata olsa bile diğer alt görevleri işlemeye devam et
        }
      }
      
      if (processedSubtasks.length > 0) {
        console.log(`Committing batch with ${processedSubtasks.length} subtasks`);
        await batch.commit();
      } else {
        console.log('No valid subtasks to commit');
      }
    } else {
      console.log('No subtasks to process');
    }

    // Sonuç olarak dönecek görev verisini oluştur
    const resultTask = {
      ...newTask,
      subtasks: processedSubtasks.length > 0 ? processedSubtasks : []
    };
    
    console.log('Task created successfully:', resultTask);
    return resultTask;
  } catch (error) {
    console.error('Error adding task to Firestore:', {
      error,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const addTask = createAsyncThunk(
  'boards/addTask',
  async ({ boardId, columnId, taskData }, { rejectWithValue }) => {
    try {
      if (!boardId || !columnId || !taskData) {
        throw new Error('Missing required parameters');
      }
      
      console.log('addTask - Dispatching with:', { boardId, columnId, taskData });
      const newTask = await addTaskToFirestore(boardId, columnId, taskData);
      console.log('addTask - Task created successfully:', newTask);
      return { boardId, columnId, task: newTask };
    } catch (error) {
      console.error('Error in addTask:', error);
      return rejectWithValue(error.message || 'Failed to add task');
    }
  }
);

// Update board in Firestore
const updateBoardInFirestore = async (boardId, updates) => {
  const boardRef = doc(db, 'boards', boardId);
  await updateDoc(boardRef, { name: updates.name });
  
  // Mevcut sütunları al
  const columnsRef = collection(db, 'boards', boardId, 'columns');
  const columnsSnapshot = await getDocs(columnsRef);
  
  // Mevcut sütun ID'lerini topla
  const existingColumnIds = new Set(columnsSnapshot.docs.map(doc => doc.id));
  const updatedColumnIds = new Set();
  
  // Her bir sütunu güncelle veya oluştur
  for (const column of updates.columns || []) {
    const columnData = {
      name: column.name,
      tasks: column.tasks || []
    };
    
    if (column.id && existingColumnIds.has(column.id)) {
      // Mevcut sütunu güncelle
      const columnRef = doc(columnsRef, column.id);
      await updateDoc(columnRef, columnData);
    } else {
      // Yeni sütun ekle
      const newColumnRef = doc(columnsRef, column.id || uuidv4());
      await setDoc(newColumnRef, columnData);
    }
    updatedColumnIds.add(column.id);
  }
  
  // Kaldırılan sütunları sil
  for (const columnId of existingColumnIds) {
    if (!updatedColumnIds.has(columnId)) {
      await deleteDoc(doc(columnsRef, columnId));
    }
  }
};

export const updateBoard = createAsyncThunk(
  'boards/updateBoard',
  async ({ boardId, updates }) => {
    try {
      await updateBoardInFirestore(boardId, updates);
      return { boardId, updates };
    } catch (error) {
      console.error('Error updating board:', error);
      throw error;
    }
  }
);

// Delete board from Firestore
const deleteBoardFromFirestore = async (boardId) => {
  // Board'u ve tüm alt koleksiyonlarını sil
  const batch = [];
  
  // Board'u sil
  const boardRef = doc(db, 'boards', boardId);
  batch.push(deleteDoc(boardRef));
  
  // Tüm sütunları ve altındaki task'ları sil
  const columnsRef = collection(db, 'boards', boardId, 'columns');
  const columnsSnapshot = await getDocs(columnsRef);
  
  for (const colDoc of columnsSnapshot.docs) {
    const tasksRef = collection(columnsRef, colDoc.id, 'tasks');
    const tasksSnapshot = await getDocs(tasksRef);
    
    // Her task'ın altındaki subtask'ları sil
    for (const taskDoc of tasksSnapshot.docs) {
      const subtasksRef = collection(tasksRef, taskDoc.id, 'subtasks');
      const subtasksSnapshot = await getDocs(subtasksRef);
      
      subtasksSnapshot.forEach((subtaskDoc) => {
        batch.push(deleteDoc(doc(subtasksRef, subtaskDoc.id)));
      });
      
      // Task'ı sil
      batch.push(deleteDoc(doc(tasksRef, taskDoc.id)));
    }
    
    // Sütunu sil
    batch.push(deleteDoc(doc(columnsRef, colDoc.id)));
  }
  
  // Tüm silme işlemlerini tek seferde gerçekleştir
  await Promise.all(batch);
};

export const removeBoard = createAsyncThunk(
  'boards/removeBoard',
  async (boardId, { getState, dispatch }) => {
    try {
      await deleteBoardFromFirestore(boardId);
      return boardId;
    } catch (error) {
      console.error('Error deleting board:', error);
      throw error;
    }
  }
);

const boardsSlice = createSlice({
  name: "boards",
  initialState: {
    boards: [],
    currentBoard: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null
  },
  reducers: {
    setCurrentBoard: (state, action) => {
      console.log('Setting current board:', action.payload);
      if (action.payload) {
        state.currentBoard = action.payload;
        // Tarayıcıda geçici olarak sakla (sayfa yenilemelerinde kullanılabilir)
        try {
          localStorage.setItem('currentBoard', action.payload);
        } catch (e) {
          console.warn('Could not save currentBoard to localStorage', e);
        }
      }
    },
    
    moveTask: (state, action) => {
      const { sourceColumnId, targetColumnId, taskId } = action.payload;
      const board = state.currentBoard;
      
      if (!board) return;
      
      // Görevi bul
      const task = board.columns.flatMap(col => col.tasks).find(task => task.id === taskId);
      if (!task) return;
      
      // Kaynak sütundan görevi kaldır
      const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
      if (sourceColumn && sourceColumn.tasks) {
        sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id !== taskId);
      }
      
      // Hedef sütuna görevi ekle
      const targetColumn = board.columns.find(col => col.id === targetColumnId);
      if (targetColumn) {
        // Görevin sütun bilgilerini güncelle
        const updatedTask = { ...task };
        updatedTask.columnId = targetColumnId;
        updatedTask.status = targetColumn.name;
        
        // Görevi hedef sütuna ekle
        if (!targetColumn.tasks) targetColumn.tasks = [];
        targetColumn.tasks = [...targetColumn.tasks.filter(t => t.id !== taskId), updatedTask];
      }
      
      // Redux state'ini güncelle
      board.lastUpdated = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadBoards.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(loadBoards.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.boards = action.payload;
        
        // Eğer currentBoard yoksa veya geçerli bir board değilse, ilk board'u seç
        if (action.payload.length > 0) {
          const hasValidCurrentBoard = state.currentBoard && 
            action.payload.some(board => board.id === state.currentBoard);
            
          if (!hasValidCurrentBoard) {
            // Önce localStorage'dan kontrol et
            try {
              const savedBoardId = localStorage.getItem('currentBoard');
              const isValidSavedBoard = savedBoardId && 
                action.payload.some(board => board.id === savedBoardId);
                
              if (isValidSavedBoard) {
                state.currentBoard = savedBoardId;
                console.log('Restored currentBoard from localStorage:', savedBoardId);
              } else {
                // Geçerli bir kayıtlı board yoksa ilk board'u seç
                state.currentBoard = action.payload[0].id;
                console.log('Set default currentBoard:', action.payload[0].id);
                // Yeni seçilen board'u kaydet
                localStorage.setItem('currentBoard', state.currentBoard);
              }
            } catch (e) {
              console.warn('Error accessing localStorage:', e);
              // localStorage'a erişilemiyorsa ilk board'u seç
              state.currentBoard = action.payload[0].id;
            }
          }
        } else {
          state.currentBoard = null;
        }
        
        console.log('Boards loaded, currentBoard set to:', state.currentBoard);
      })
      .addCase(loadBoards.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards.push(action.payload);
        state.currentBoard = action.payload.id;
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        const { boardId, updates } = action.payload;
        const existingBoardIndex = state.boards.findIndex(board => board.id === boardId);
        if (existingBoardIndex !== -1) {
          // Mevcut board'u güncelle
          state.boards[existingBoardIndex] = {
            ...state.boards[existingBoardIndex],
            ...updates,
            // Eğer columns güncellenmişse onu da ekle
            ...(updates.columns && { columns: updates.columns })
          };
          
          // Eğer güncellenen board şu anki board ise, currentBoard'u da güncelle
          if (state.currentBoard === boardId) {
            state.boards[existingBoardIndex].lastUpdated = new Date().toISOString();
          }
        }
      })
      .addCase(removeBoard.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(removeBoard.fulfilled, (state, action) => {
        const boardId = action.payload;
        const boardIndex = state.boards.findIndex(board => board.id === boardId);
        
        if (boardIndex !== -1) {
          // Board'u listeden kaldır
          state.boards.splice(boardIndex, 1);
          
          // Eğer silinen board şu anki board ise
          if (state.currentBoard === boardId) {
            // Eğer başka board varsa bir sonrakini, yoksa null yap
            state.currentBoard = state.boards.length > 0 
              ? state.boards[Math.min(boardIndex, state.boards.length - 1)]?.id 
              : null;
          }
        }
        
        // İşlem başarılı olduğunda status'u güncelle
        state.status = 'succeeded';
      })
      .addCase(removeBoard.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        const { boardId, columnId, task } = action.payload;
        const board = state.boards.find(b => b.id === boardId);
        if (board) {
          const column = board.columns.find(col => col.id === columnId);
          if (column) {
            if (!column.tasks) column.tasks = [];
            column.tasks.push(task);
          }
        }
      })
      .addCase(updateTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const { boardId, columnId: targetColumnId, task: updatedTask, sourceColumnId } = action.payload;
        const board = state.boards.find(b => b.id === boardId);
        if (!board) return;

        // Eğer sütun değiştiyse, eski sütundan görevi kaldır
        if (sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
          const sourceColumn = board.columns.find(col => col.id === sourceColumnId);
          if (sourceColumn && sourceColumn.tasks) {
            sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id !== updatedTask.id);
            console.log('Task removed from source column:', sourceColumnId);
          }
        }

        // Hedef sütunu bul ve görevi güncelle
        const targetColumn = board.columns.find(col => col.id === targetColumnId);
        if (targetColumn) {
          if (!targetColumn.tasks) targetColumn.tasks = [];
          
          // Eski görevi kaldır ve yenisini ekle
          targetColumn.tasks = [
            ...targetColumn.tasks.filter(t => t.id !== updatedTask.id),
            updatedTask
          ];
          console.log('Task updated in target column:', targetColumnId, updatedTask);
        }

        // Son güncelleme zamanını güncelle
        board.lastUpdated = new Date().toISOString();
        console.log('Board last updated:', board.lastUpdated);
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        console.error('Failed to update task:', action.error);
      })
      .addCase(deleteTask.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        const { boardId, columnId, taskId } = action.payload;
        const board = state.boards.find(b => b.id === boardId);
        
        if (board) {
          const column = board.columns.find(col => col.id === columnId);
          if (column && column.tasks) {
            column.tasks = column.tasks.filter(task => task.id !== taskId);
            console.log('Task removed from state:', taskId);
          }
        }
        
        state.status = 'succeeded';
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        console.error('Failed to delete task:', action.error);
      });
  },
});

// Add new board to Firestore
export const addBoardToFirestore = async (boardData) => {
  try {
    const boardRef = doc(collection(db, 'boards'));
    const columns = boardData.columns || [  // Burada columns kullanılacak
      { id: uuidv4(), name: 'Todo', tasks: [] },
      { id: uuidv4(), name: 'In Progress', tasks: [] },
      { id: uuidv4(), name: 'Done', tasks: [] },
    ];

    // Board verisini kaydet
    await setDoc(boardRef, {
      name: boardData.name,
      createdAt: new Date().toISOString(),
    });

    // Column'ları ekle
    const createdColumns = [];
    for (const column of columns) {
      const columnRef = doc(collection(db, 'boards', boardRef.id, 'columns'));
      await setDoc(columnRef, {
        name: column.name,
        order: columns.indexOf(column),
      });
      createdColumns.push({
        id: columnRef.id,
        name: column.name,
        tasks: []
      });
    }

    return { 
      id: boardRef.id, 
      name: boardData.name, 
      columns: createdColumns,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding board:', error);
    throw error;
  }
}

// Update task in Firestore
// Delete task from Firestore
export const deleteTask = createAsyncThunk(
  'boards/deleteTask',
  async ({ boardId, columnId, taskId }, { rejectWithValue }) => {
    try {
      console.log('Deleting task:', { boardId, columnId, taskId });
      
      // Task'ın referansını al
      const taskRef = doc(db, 'boards', boardId, 'columns', columnId, 'tasks', taskId);
      
      // Task'ı sil
      await deleteDoc(taskRef);
      
      console.log('Task deleted successfully');
      return { boardId, columnId, taskId };
    } catch (error) {
      console.error('Error deleting task:', error);
      return rejectWithValue(error.message);
    }
  }
);

// Update task in Firestore
export const updateTask = createAsyncThunk(
  'boards/updateTask',
  async ({ boardId, columnId, task, sourceColumnId, targetColumnId }, { getState, rejectWithValue }) => {
    const taskId = task?.id;
    console.log('Starting updateTask with:', { 
      boardId, 
      columnId, 
      taskId, 
      task, 
      sourceColumnId, 
      targetColumnId 
    });
    
    if (!boardId || !taskId) {
      const error = new Error('Missing required fields');
      console.error('Validation error:', { boardId, taskId });
      return rejectWithValue(error.message);
    }

    try {
      console.log('Starting task update process...');
      console.log('Parameters:', { boardId, columnId, taskId, sourceColumnId, targetColumnId });
      
      // Parametre kontrolü
      if (!boardId || !taskId) {
        throw new Error('Missing required parameters: boardId and taskId are required');
      }
      
      let taskDoc = null;
      let foundColumnId = null;
      
      // Önce verilen columnId'de arama yap
      if (columnId) {
        try {
          console.log(`Searching for task in column: ${columnId}`);
          const taskRef = doc(db, 'boards', boardId, 'columns', columnId, 'tasks', taskId);
          const docSnap = await getDoc(taskRef);
          
          if (docSnap.exists()) {
            taskDoc = docSnap;
            foundColumnId = columnId;
            console.log('Task found in provided column:', columnId);
          } else {
            console.log('Task not found in provided column, will search in other columns');
          }
        } catch (error) {
          console.error('Error searching in provided column:', error);
          // Hata olsa bile diğer sütunlarda aramaya devam et
        }
      }
      
      // Eğer verilen columnId'de bulunamadıysa veya columnId verilmediyse, tüm sütunlarda ara
      if (!taskDoc) {
        console.log('Task not found in provided column, searching in all columns...');
        try {
          const columnsRef = collection(db, 'boards', boardId, 'columns');
          const columnsSnapshot = await getDocs(columnsRef);
          
          if (columnsSnapshot.empty) {
            console.log('No columns found in the board');
          } else {
            console.log(`Searching in ${columnsSnapshot.size} columns...`);
          }
          
          for (const col of columnsSnapshot.docs) {
            const colId = col.id;
            // Eğer zaten bu sütunda aradıysak atla
            if (columnId && colId === columnId) {
              console.log('Skipping already searched column:', colId);
              continue;
            }
            
            console.log(`Checking column: ${colId}`);
            try {
              const taskRef = doc(db, 'boards', boardId, 'columns', colId, 'tasks', taskId);
              const docSnap = await getDoc(taskRef);
              
              if (docSnap.exists()) {
                taskDoc = docSnap;
                foundColumnId = colId;
                console.log('Task found in column during full search:', colId);
                break;
              }
            } catch (error) {
              console.error(`Error searching in column ${colId}:`, error);
              // Hata olsa bile diğer sütunlarda aramaya devam et
            }
          }
        } catch (error) {
          console.error('Error fetching columns:', error);
          throw error; // Bu hatayı yukarı fırlat
        }
      }
      
      // Eğer görev hiçbir sütunda bulunamadıysa
      if (!taskDoc || !taskDoc.exists()) {
        const errorMessage = `Task not found: ${taskId} in any column of board ${boardId}`;
        console.error(errorMessage, { 
          boardId, 
          taskId, 
          columnId, 
          sourceColumnId, 
          targetColumnId 
        });
        return rejectWithValue(errorMessage);
      }
      
      const taskData = taskDoc.data();
      
      // Eğer sourceColumnId verildiyse ve bulunan sütunla eşleşmiyorsa uyarı ver
      if (sourceColumnId && sourceColumnId !== foundColumnId) {
        console.warn(`Task found in column ${foundColumnId} but was expected in ${sourceColumnId}. Using found column.`);
      }
      
      const sourceColumn = foundColumnId;
      console.log('Source column:', sourceColumn);
      console.log('Target column:', targetColumnId);
      
      // Eğer sütun değişiyorsa
      if (targetColumnId && sourceColumn !== targetColumnId) {
        console.log('Moving task between columns:', { sourceColumn: sourceColumn, targetColumnId });
        
        // Hedef sütunu kontrol et
        const targetColumnDoc = await getDoc(doc(db, 'boards', boardId, 'columns', targetColumnId));
        if (!targetColumnDoc.exists()) {
          const error = new Error(`Target column not found: ${targetColumnId}`);
          console.error(error.message);
          return rejectWithValue(error.message);
        }
        
        try {
          // Yeni sütunda task referansı oluştur
          const newTaskRef = doc(db, 'boards', boardId, 'columns', targetColumnId, 'tasks', taskId);
          
          // Task verilerini güncelle
          const updatedTask = {
            ...task, // Yeni gelen task verilerini kullan
            id: taskId,
            columnId: targetColumnId, // Sütun ID'sini güncelle
            updatedAt: new Date().toISOString(),
            createdAt: task.createdAt || taskData.createdAt || new Date().toISOString(),
            createdBy: task.createdBy || taskData.createdBy || 'unknown'
          };
          
          console.log('Task data to update:', updatedTask);
          
          // Batch işlemi başlat
          const batch = writeBatch(db);
          
          // Yeni task'ı ekle
          batch.set(newTaskRef, updatedTask);
          
          // Eski task'ı sil
          const oldTaskRef = doc(db, 'boards', boardId, 'columns', sourceColumn, 'tasks', taskId);
          batch.delete(oldTaskRef);
          
          // Subtask'ları taşı
          const oldSubtasksRef = collection(db, 'boards', boardId, 'columns', sourceColumn, 'tasks', taskId, 'subtasks');
          const oldSubtasksSnapshot = await getDocs(oldSubtasksRef);
          
          const newSubtasksRef = collection(db, 'boards', boardId, 'columns', targetColumnId, 'tasks', taskId, 'subtasks');
          
          // Eğer eski subtasklar varsa taşı
          if (!oldSubtasksSnapshot.empty) {
            oldSubtasksSnapshot.docs.forEach(subtaskDoc => {
              const subtaskData = subtaskDoc.data();
              const newSubtaskRef = doc(newSubtasksRef, subtaskDoc.id);
              batch.set(newSubtaskRef, {
                ...subtaskData,
                updatedAt: new Date().toISOString()
              });
            });
          }
          
          await batch.commit();
          
          return { 
            boardId, 
            columnId: targetColumnId, 
            task: updatedTask,
            sourceColumnId: sourceColumn
          };
        } catch (error) {
          console.error('Error moving task:', error);
          return rejectWithValue(error.message);
        }
      } else {
        // Aynı sütunda güncelle
        try {
          // Task referansını al
          const taskRef = doc(db, 'boards', boardId, 'columns', columnId, 'tasks', taskId);
          
          // Task verilerini güncelle
          const updatedTask = {
            ...task, // Yeni gelen task verilerini kullan
            id: taskId,
            columnId: columnId,
            updatedAt: new Date().toISOString(),
            createdAt: task.createdAt || taskData.createdAt || new Date().toISOString(),
            createdBy: task.createdBy || taskData.createdBy || 'unknown'
          };
          
          console.log('Updating task in same column:', { columnId, taskId, task: updatedTask });
          
          // Task'ı güncelle
          await updateDoc(taskRef, updatedTask);
          
          // Subtask'ları güncelle
          if (task.subtasks && task.subtasks.length > 0) {
            const batch = writeBatch(db);
            const subtasksRef = collection(db, 'boards', boardId, 'columns', columnId, 'tasks', taskId, 'subtasks');
            
            // Önce mevcut tüm subtask'ları sil
            const subtasksSnapshot = await getDocs(subtasksRef);
            subtasksSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            
            // Yeni subtask'ları ekle
            task.subtasks.forEach(subtask => {
              const newSubtaskRef = doc(subtasksRef, subtask.id || uuidv4());
              batch.set(newSubtaskRef, {
                ...subtask,
                id: newSubtaskRef.id,
                createdAt: subtask.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            });
            
            await batch.commit();
          }
          
          return { 
            boardId, 
            columnId, 
            task: updatedTask,
            sourceColumnId: columnId
          };
        } catch (error) {
          console.error('Error updating task:', error);
          return rejectWithValue(error.message);
        }
      }
    } catch (error) {
      console.error('Unexpected error in updateTask:', error);
      return rejectWithValue(error.message);
    }
  }
);
export const { setCurrentBoard, moveTask } = boardsSlice.actions;
export default boardsSlice.reducer;
