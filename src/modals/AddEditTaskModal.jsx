import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addTask, updateTask, deleteTask } from "../redux/boardsSlice";
import ConfirmModal from "./ConfirmModal";
import { v4 as uuidv4 } from "uuid";
import crossIcon from "../assets/icon-cross.svg";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddEditTaskModal({
  type = 'add',
  isOpen = false,
  setTaskModalOpen,
  initialColumnId = null,
  taskId = null,
  selectedTask = null,
  onClose,
  // Diğer props'lar
}) {
  const dispatch = useDispatch();
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(""); // Seçilen sütunun ID'si
  const [newColIndex, setNewColIndex] = useState(0); // Eski kullanım, kaldırılabilir
  const [subtasks, setSubtasks] = useState([
    { title: "", isCompleted: false, id: uuidv4() },
    { title: "", isCompleted: false, id: uuidv4() },
  ]);

  const { boards, currentBoard } = useSelector((state) => state.boards);
  const board = boards?.find(board => board.id === currentBoard);

  // Düzenlenen görevin kendisini tutan state
  const [currentTask, setCurrentTask] = useState(null);
  // Görevin modal açıldığında bulunduğu sütunun adını tutar (güncelleme için gerekli)
  const [initialTaskStatus, setInitialTaskStatus] = useState(null);

  // **ANA EFFECT BLOĞU: Görev yükleme ve form alanlarını başlatma**
  useEffect(() => {
    console.log(`[AddEditTaskModal - Effect] Type: ${type}, taskId: ${taskId}, hasSelectedTask: ${!!selectedTask}`);
    // console.log('[AddEditTaskModal - Effect] Debug Props:', { debugTask, debugColumnId });

    let taskToLoad = null;

    if (type === 'edit') {
      // Eğer selectedTask prop'u varsa, bu en doğru ve güncel bilgidir.
      if (selectedTask) {
        console.log('[AddEditTaskModal - Effect] Using selectedTask from props for edit mode.');
        taskToLoad = {
          ...selectedTask,
          subtasks: Array.isArray(selectedTask.subtasks) ? selectedTask.subtasks : []
        };
      } else if (taskId && board?.columns) {
        // Eğer selectedTask bir nedenden dolayı gelmediyse ama taskId varsa, board'dan ara (yedek)
        console.warn('[AddEditTaskModal - Effect] selectedTask is null, attempting to find task by taskId.');
        for (const column of board.columns) {
          const found = column.tasks?.find(t => t.id === taskId);
          if (found) {
            taskToLoad = {
              ...found,
              subtasks: Array.isArray(found.subtasks) ? found.subtasks : []
            };
            console.log('[AddEditTaskModal - Effect] Found task by ID:', taskToLoad.title);
            break;
          }
        }
        if (!taskToLoad) {
          console.error('[AddEditTaskModal - Effect] Could not find task with ID:', taskId);
        }
      }
    }

    // currentTask state'ini güncelle
    setCurrentTask(taskToLoad);

    // Form alanlarını güncelle
    if (taskToLoad) {
      console.log('[AddEditTaskModal - Effect] Setting form fields with loaded task:', taskToLoad.title);
      setTitle(taskToLoad.title || '');
      setDescription(taskToLoad.description || '');
      setStatus(taskToLoad.status || '');
      setInitialTaskStatus(taskToLoad.status || ''); // Orijinal durumu kaydet

      // Alt görevleri kontrol et ve ayarla
      setSubtasks(
        Array.isArray(taskToLoad.subtasks) && taskToLoad.subtasks.length > 0
          ? taskToLoad.subtasks.map(st => ({ ...st, id: st.id || uuidv4() }))
          : [{ title: "", isCompleted: false, id: uuidv4() }, { title: "", isCompleted: false, id: uuidv4() }]
      );

      // Mevcut görevin sütun indexini bul (dropdown için)
      const currentColumnIndex = board?.columns?.findIndex(col => col.name === taskToLoad.status);
      if (currentColumnIndex !== -1) {
        setNewColIndex(currentColumnIndex);
      } else {
        setNewColIndex(0); // Varsayılan olarak ilk sütun
      }

    } else if (type === 'add') {
      // Yeni görev ekleme modu veya görev bulunamadıysa formu sıfırla
      console.log('[AddEditTaskModal - Effect] Initializing form for add mode.');
      setTitle('');
      setDescription('');
      setSubtasks([
        { title: "", isCompleted: false, id: uuidv4() },
        { title: "", isCompleted: false, id: uuidv4() },
      ]);
      setInitialTaskStatus(null); // Yeni görevde başlangıç durumu yok

      // Yeni görev için başlangıç durumunu ve indexini ayarla
      if (initialColumnId && board?.columns) {
        const column = board.columns.find(col => col.id === initialColumnId);
        if (column) {
          setStatus(column.name);
          const index = board.columns.findIndex(col => col.id === initialColumnId);
          if (index !== -1) {
            setNewColIndex(index);
          }
        }
      } else if (board?.columns?.length > 0) {
        setStatus(board.columns[0].name);
        setNewColIndex(0);
      } else {
        setStatus(''); // Board veya sütun yoksa boş
        setNewColIndex(0);
      }
    }
  }, [selectedTask, taskId, type, initialColumnId, board]);

  const handleCloseModal = () => {
    if (onClose) {
      onClose();
    } else if (typeof setTaskModalOpen === 'function') {
      setTaskModalOpen(prev => ({
        ...(typeof prev === 'object' ? prev : { isOpen: !!prev }), // prev bir boolean ise objeye çevir
        isOpen: false,
        columnId: null,
        taskId: null,
        task: null // Modalı kapatırken görevi de sıfırla
      }));
    }
  };

  // Modal dışına tıklayınca kapatma
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
      setTaskModalOpen({ isOpen: false, columnId: null, taskId: null, task: null });
    }
  };

  // Eğer board veya sütunlar yüklenmediyse modalı render etme
  if (!board || !board.columns) {
    console.warn('[AddEditTaskModal] Board or columns not available. Not rendering modal.');
    return null;
  }

  const columns = board.columns; // Sütunları al

  const onChangeSubtasks = (id, newValue) => {
    setSubtasks((prevState) => {
      const newState = [...prevState];
      const subtask = newState.find((subtask) => subtask.id === id);
      if (subtask) {
        subtask.title = newValue;
      }
      return newState;
    });
  };

  const onChangeStatus = (e) => {
    const selectedColumnName = e.target.value;
    setStatus(selectedColumnName);
    
    // Seçilen sütunun ID'sini bul ve kaydet
    if (board?.columns) {
      const selectedColumn = board.columns.find(col => col.name === selectedColumnName);
      if (selectedColumn) {
        setSelectedStatus(selectedColumn.id);
      }
    }
  };

  const validate = () => {
    // Başlık kontrolü
    if (!title || !title.trim()) {
      toast.error('Lütfen bir başlık girin');
      setIsValid(false);
      return false;
    }
    
    // Sütun kontrolü
    if (!selectedStatus || !board?.columns?.some(col => col.id === selectedStatus)) {
      toast.error('Lütfen geçerli bir sütun seçin');
      setIsValid(false);
      return false;
    }
    
    // Alt görev kontrolü (boş olmayanlar)
    const hasEmptySubtasks = (subtasks || []).some(
      subtask => !subtask.title || !subtask.title.trim()
    );
    
    if (hasEmptySubtasks) {
      toast.error('Lütfen tüm alt görevleri doldurun veya silin');
      setIsValid(false);
      return false;
    }
    
    setIsValid(true);
    return true;
  };

  const onDelete = (id) => {
    setSubtasks((prevState) => prevState.filter((el) => el.id !== id));
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteTask = async () => {
    try {
      setIsLoading(true);
      setShowDeleteConfirm(false);
      
      // Görevin bulunduğu sütunu bul
      const board = boards.find(b => b.id === currentBoard);
      if (!board) {
        throw new Error('Board bulunamadı');
      }
      
      // Görevin bulunduğu sütunu bul
      let sourceColumn = null;
      let taskId = selectedTask?.id;
      
      if (!taskId) {
        throw new Error('Silinecek görev bulunamadı');
      }
      
      // Tüm sütunlarda görevi ara
      for (const column of board.columns) {
        const task = column.tasks?.find(t => t.id === taskId);
        if (task) {
          sourceColumn = column;
          break;
        }
      }
      
      if (!sourceColumn) {
        throw new Error('Görevin bulunduğu sütun bulunamadı');
      }
      
      // Silme işlemini başlat
      await dispatch(
        deleteTask({
          boardId: currentBoard,
          columnId: sourceColumn.id,
          taskId: taskId
        })
      ).unwrap();
      
      // Başarılı mesajı göster
      toast.success('Görev başarıyla silindi');
      
      // Modal'ı kapat
      if (onClose) onClose();
      setTaskModalOpen(false);
      
    } catch (error) {
      console.error('Görev silinirken hata oluştu:', error);
      toast.error(`Görev silinirken bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validasyon yap
      if (!validate()) {
        console.log('Form validation failed');
        return;
      }
      
      setIsLoading(true);
      
      // Geçerli board'u al
      const board = boards.find(b => b.id === currentBoard);
      if (!board) {
        throw new Error('Board bulunamadı');
      }
      
      // Seçilen sütunu bul (önce selectedStatus'e göre, yoksa ilk sütunu kullan)
      let targetColumn = null;
      if (selectedStatus) {
        targetColumn = board.columns.find(col => col.id === selectedStatus);
      } 
      
      // Eğer hala hedef sütun yoksa, ilk sütunu kullan
      if (!targetColumn && board.columns.length > 0) {
        targetColumn = board.columns[0];
        console.warn('No column selected, using first column as fallback');
      }
      
      if (!targetColumn) {
        throw new Error('Geçerli bir sütun bulunamadı');
      }
      
      // Geçerli görevi al (düzenleme modunda)
      const currentTask = selectedTask || {};
      
      // Geçerli alt görevleri al
      const validSubtasks = (subtasks || [])
        .filter(subtask => subtask && subtask.title && subtask.title.trim() !== '')
        .map(subtask => ({
          id: subtask.id || uuidv4(),
          title: (subtask.title || '').trim(),
          isCompleted: !!subtask.isCompleted
        }));
      
      // Görev verisini oluştur
      const taskData = {
        id: type === 'edit' ? (currentTask.id || uuidv4()) : uuidv4(),
        title: (title || '').trim(),
        description: (description || '').trim(),
        status: targetColumn.name,
        columnId: targetColumn.id,
        isCompleted: type === 'edit' ? !!currentTask.isCompleted : false,
        createdBy: type === 'edit' ? (currentTask.createdBy || 'unknown') : 'currentUser',
        createdAt: type === 'edit' ? (currentTask.createdAt || new Date().toISOString()) : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Alt görevleri doğrudan buraya ekliyoruz
        subtasks: validSubtasks
      };
      
      console.log('Prepared task data:', JSON.stringify(taskData, null, 2));
      
      if (type === 'add') {
        // Yeni görev ekleme
        console.log('[AddEditTaskModal - Submit] Adding new task to column:', targetColumn.name);
        
        const result = await dispatch(
          addTask({
            boardId: board.id,
            columnId: targetColumn.id,
            taskData: taskData  // task yerine taskData kullanıyoruz
          })
        ).unwrap();
        
        console.log('Task added successfully:', result);
        toast.success('Görev başarıyla eklendi!');
      } else {
        // Mevcut görevi güncelleme
        console.log('[AddEditTaskModal - Submit] Updating existing task:', currentTask.title);
        
        // Kaynak sütunu bul
        const sourceColumn = board.columns.find(col => 
          Array.isArray(col.tasks) && col.tasks.some(t => t && t.id === currentTask.id)
        );
        
        const sourceColumnId = sourceColumn?.id;
        if (!sourceColumnId) {
          const errorMsg = 'Kaynak sütun bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.';
          console.error(errorMsg);
          toast.error(errorMsg);
          return;
        }
        
        const isColumnChanged = sourceColumnId !== targetColumn.id;
        console.log(`[AddEditTaskModal - Submit] Column changed: ${isColumnChanged}, Source: ${sourceColumnId}, Target: ${targetColumn.id}`);
        
        await dispatch(
          updateTask({
            boardId: board.id,
            columnId: targetColumn.id,
            task: taskData,
            sourceColumnId: isColumnChanged ? sourceColumnId : undefined,
            targetColumnId: isColumnChanged ? targetColumn.id : undefined
          })
        ).unwrap();
        
        console.log('Task updated successfully');
        toast.success('Görev başarıyla güncellendi!');
      }
      
      // Modal'ı kapat
      if (onClose) onClose();
      setTaskModalOpen(false);
    } catch (error) {
      console.error(`[AddEditTaskModal - Submit] Error:`, error);
      const errorMessage = error.message || 'Bilinmeyen bir hata oluştu';
      console.error('Error details:', { error });
      toast.error(`Görev ${type === 'add' ? 'eklenirken' : 'güncellenirken'} bir hata oluştu: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Eğer modal kapalıysa null döndür
  if (!isOpen) {
    return null;
  }

  // Escape tuşuyla kapatma
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Sadece bir kere mount edildiğinde ekle/kaldır

  return (
    <React.Fragment>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
      {/* Modal İçeriği */}
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-8 shadow-lg dark:bg-[#2b2c37] dark:text-white"
        onClick={(e) => e.stopPropagation()} // İçeriğe tıklayınca modalın kapanmasını engelle
        role="document"
      >
        <h3 className=" text-lg ">
          {type === "edit" ? "Edit" : "Add New"} Task
          <button
            type="button"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
            onClick={handleCloseModal}
          >
            ✕
          </button>
        </h3>

        {/* Görev Adı */}
        <div className="mt-8 flex flex-col space-y-1">
          <label className="text-sm dark:text-white text-gray-500">
            Task Name
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            id="task-name-input"
            type="text"
            className={`bg-transparent px-4 py-2 outline-none focus:border-0 rounded-md text-sm border-[0.5px] border-gray-600 focus:outline-[#635fc7] outline-1 ${!isValid && !title.trim() ? 'border-red-500' : ''}`}
            placeholder="e.g Take coffee break"
          />
          {!isValid && !title.trim() && (
            <p className="text-red-500 text-xs mt-1">Can't be empty</p>
          )}
        </div>

        {/* Açıklama */}
        <div className="mt-8 flex flex-col space-y-1">
          <label className="text-sm dark:text-white text-gray-500">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            id="task-description-input"
            className="bg-transparent outline-none min-h-[200px] focus:border-0 px-4 py-2 rounded-md text-sm border-[0.5px] border-gray-600 focus:outline-[#635fc7] outline-[1px]"
            placeholder="e.g. It's always good to take a break. This 15 minute break will recharge the batteries a little."
          />
        </div>

        {/* Alt Görevler */}
        <div className="mt-8 flex flex-col space-y-3">
          <label className="text-sm dark:text-white text-gray-500">
            Subtasks
          </label>
          {subtasks.map((subtask, index) => (
            <div key={subtask.id || index} className="flex items-center w-full">
              {/* Checkbox for isCompleted */}
              <input
                type="checkbox"
                checked={subtask.isCompleted}
                onChange={(e) => {
                  setSubtasks(prevSubtasks => 
                    prevSubtasks.map(st => 
                      st.id === subtask.id 
                        ? { ...st, isCompleted: e.target.checked } // Checkbox için doğru güncelleme
                        : st
                    )
                  );
                }}
                className="mr-2 h-4 w-4 cursor-pointer"
              />
              {/* Text input for subtask title */}
              <input
                onChange={(e) => onChangeSubtasks(subtask.id, e.target.value)}
                type="text"
                value={subtask.title}
                className={`${subtask.isCompleted ? 'line-through text-gray-500' : ''} bg-transparent outline-none focus:border-0 flex-grow px-4 py-2 rounded-md text-sm border-[0.5px] border-gray-600 focus:outline-[#635fc7] outline-[1px] ${!isValid && !subtask.title.trim() ? 'border-red-500' : ''}`}
                placeholder="e.g Take coffee break"
              />
              <img
                src={crossIcon}
                onClick={() => onDelete(subtask.id)}
                className="m-4 cursor-pointer"
                alt="Delete subtask"
              />
            </div>
          ))}
          {!isValid && subtasks.some(st => !st.title.trim()) && (
            <p className="text-red-500 text-xs mt-1">Subtasks can't be empty</p>
          )}

          <button
            className="w-full items-center dark:text-[#635fc7] dark:bg-white text-white bg-[#635fc7] py-2 rounded-full"
            onClick={() => {
              setSubtasks((state) => [
                ...state,
                { title: "", isCompleted: false, id: uuidv4() },
              ]);
            }}
          >
            + Add New Subtask
          </button>
        </div>

        {/* Mevcut Durum */}
        <div className="mt-8 flex flex-col space-y-3">
          <label className="text-sm dark:text-white text-gray-500">
            Current Status
          </label>
          <select
            value={status}
            onChange={onChangeStatus}
            className="select-status flex-grow px-4 py-2 rounded-md text-sm bg-transparent focus:border-0 border-[1px] border-gray-300 focus:outline-[#635fc7] outline-none dark:bg-[#2b2c37] dark:text-white"
          >
            {columns.length > 0 ? (
              columns.map((column) => (
                <option key={column.id} value={column.name} className="dark:bg-[#2b2c37]">
                  {column.name}
                </option>
              ))
            ) : (
              <option className="dark:bg-[#2b2c37]">No columns available</option>
            )}
          </select>
          <button
            onClick={async (e) => {
              try {
                await onSubmit(e);
                setTaskModalOpen(false);
              } catch (error) {
                console.error('Error in form submission:', error);
              }
            }}
            className={`w-full items-center text-white py-2 rounded-full ${isLoading ? 'bg-[#a8a4ff] cursor-not-allowed' : 'bg-[#635fc7] hover:bg-[#4945c5]'}`}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {type === "edit" ? "Saving..." : "Creating..."}
              </span>
            ) : (
              type === "edit" ? "Save Changes" : "Create Task"
            )}
          </button>
          {type === "edit" && (
            <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isLoading}
            className={`w-full items-center text-white py-2 rounded-full ${isLoading ? 'bg-red-300' : 'bg-red-500 hover:opacity-75'}`}
          >
            {isLoading ? 'Deleting...' : 'Delete Task'}
          </button>
          )}
        </div>
      </div>
      </div>
      
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
      />
    </React.Fragment>
  );
}

export default AddEditTaskModal;