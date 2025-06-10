import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadBoards, setCurrentBoard } from '../redux/boardsSlice';
import Column from './Column';
import AddEditTaskModal from '../modals/AddEditTaskModal';
import AddEditBoardModal from '../modals/AddEditBoardModal';
import Sidebar from './Sidebar';

export default function Body({ 
  openEditModal, 
  setOpenEditModal, 
  boardType, 
  setBoardType, 
  openTaskModal, 
  setOpenTaskModal, 
  taskType, 
  setTaskType,
  isSidebarOpen,
  setIsSidebarOpen,
  setBoardModalOpen
}) {
  const [boardModalOpen, setBoardModalOpenState] = useState({ isOpen: false, type: 'add' });
  const dispatch = useDispatch();
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Task modal state'ini yönet
  const handleTaskClick = (task, columnId) => {
    if (!task || !columnId) {
      console.error('Invalid task or columnId in handleTaskClick:', { task, columnId });
      return;
    }

    console.log('Task clicked in handleTaskClick:', {
      taskId: task.id,
      columnId,
      hasTask: !!task
    });

    // Create a clean task object
    const taskData = {
      ...task,
      subtasks: Array.isArray(task.subtasks) ? task.subtasks : []
    };

    // Set the selected task first
    setSelectedTask(taskData);
    
    // Then set the modal state with the task data
    setOpenTaskModal({
      isOpen: true,
      columnId,
      taskId: task.id,
      task: taskData,
      _debug: {
        timestamp: new Date().toISOString(),
        source: 'handleTaskClick'
      }
    });
    
    setTaskType("edit");
  };

  const handleTaskModalOpen = (task, columnId) => {
    console.log('Opening task modal:', { 
      task: task ? {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        subtasks: task.subtasks?.length || 0
      } : null, 
      columnId 
    });
    
    const type = task ? 'edit' : 'add';
    setTaskType(type);
    
    if (!task) {
      // Yeni görev ekleme modu
      setSelectedTask(null);
      setOpenTaskModal({
        isOpen: true,
        columnId,
        taskId: null,
        task: null,
        _debug: {
          hasTask: false,
          source: 'handleTaskModalOpen',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }
    
    // Task'ın bir kopyasını oluştur
    const taskCopy = { 
      ...task,
      subtasks: Array.isArray(task.subtasks) ? [...task.subtasks] : []
    };
    
    console.log('Setting task modal state with task:', {
      id: taskCopy.id,
      title: taskCopy.title,
      description: taskCopy.description,
      status: taskCopy.status,
      subtasks: taskCopy.subtasks.length
    });
    
    // Önce selectedTask'ı güncelle
    setSelectedTask(taskCopy);
    
    // Sonra modal state'ini güncelle
    setOpenTaskModal({
      isOpen: true,
      columnId,
      taskId: task.id,
      task: taskCopy,
      _debug: {
        hasTask: true,
        source: 'handleTaskModalOpen',
        timestamp: new Date().toISOString()
      }
    });
  };
  
  const handleTaskModalClose = () => {
    setSelectedTask(null);
    setOpenTaskModal({ isOpen: false, columnId: null, taskId: null, task: null });
  };
  
  // Redux state'ini güvenli bir şekilde al
  const { boards, currentBoard, status, error } = useSelector((state) => {
    console.log('Redux state:', {
      allBoards: state.boards?.boards?.map(b => ({ id: b.id, name: b.name })),
      currentBoard: state.boards?.currentBoard,
      status: state.boards?.status,
      error: state.boards?.error
    });

    const boardsArray = state.boards?.boards || [];
    const currentBoardId = state.boards?.currentBoard || null;
    
    // Eğer currentBoard varsa ve geçerliyse, onu döndür
    if (currentBoardId && boardsArray.some(board => board.id === currentBoardId)) {
      console.log('Returning valid current board:', currentBoardId);
      return {
        boards: boardsArray,
        currentBoard: currentBoardId,
        status: state.boards?.status || 'idle',
        error: state.boards?.error || null
      };
    }
    
    // Eğer geçerli bir currentBoard yoksa, ilk board'u seç
    const firstBoardId = boardsArray.length > 0 ? boardsArray[0].id : null;
    console.log('No valid current board, using first board:', firstBoardId);
    
    return {
      boards: boardsArray,
      currentBoard: firstBoardId,
      status: state.boards?.status || 'idle',
      error: state.boards?.error || null
    };
  });
  
  const [loading, setLoading] = useState(status === 'loading');

  // Boards'ları yükle
  useEffect(() => {
    if (status === 'idle') {
      const loadData = async () => {
        try {
          setLoading(true);
          const resultAction = await dispatch(loadBoards());
          
          if (loadBoards.fulfilled.match(resultAction)) {
            const loadedBoards = resultAction.payload || [];
            if (loadedBoards.length > 0 && !currentBoard) {
              // İlk board'u seç
              dispatch(setCurrentBoard(loadedBoards[0].id));
            }
          }
        } catch (err) {
          console.error('Boards yüklenirken hata oluştu:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadData();
    } else if (status === 'succeeded' || status === 'failed') {
      setLoading(false);
    }
  }, [dispatch, status, currentBoard]);

  // Yükleme durumunu göster
  if (loading || status === 'loading') {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-gray-500 dark:text-gray-400'>Yükleniyor...</div>
      </div>
    );
  }

  // Hata durumunu göster
  if (error) {
    return (
      <div className='p-4 text-red-600 dark:text-red-400'>
        Hata: {error}
      </div>
    );
  }

  // Boards yoksa
  if (!boards || boards.length === 0) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center'>
        <p className='mb-4 text-gray-500 dark:text-gray-400'>
          You have not created any pipelines yet.
        </p>
        <button
          onClick={() => {
            // Buraya yeni board oluşturma işlemi eklenecek
          }}
          className='px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors'
        >
          + Add New Pipeline
        </button>
      </div>
    );
  }

  // Mevcut board'u bul
  const board = currentBoard 
    ? boards.find((b) => b.id === currentBoard) 
    : (boards.length > 0 ? boards[0] : null);
  
  console.log('Current board state:', { 
    currentBoard, 
    boardCount: boards.length,
    boardFound: !!board,
    boardIds: boards.map(b => b.id)
  });
  
  // Eğer currentBoard ayarlı ama board bulunamadıysa veya hiç board yoksa
  useEffect(() => {
    if (boards.length === 0) return;
    
    if (currentBoard) {
      const boardExists = boards.some(b => b.id === currentBoard);
      if (!boardExists) {
        console.log(`Board with id ${currentBoard} not found, falling back to first board`);
        dispatch(setCurrentBoard(boards[0].id));
      }
    } else if (boards.length > 0) {
      console.log('No current board set, using first available board');
      dispatch(setCurrentBoard(boards[0].id));
    }
  }, [currentBoard, boards, dispatch]);

  // Board yüklenemediyse
  if (!board) {
    return (
      <div className='flex-1 flex items-center justify-center p-4 text-gray-500 dark:text-gray-400'>
        Pipeline loading failed.
      </div>
    );
  }

  // Column'lar yoksa
  if (!board.columns || board.columns.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center'>
        <div className='text-gray-500 dark:text-gray-400'>
          There is no column in this pipeline. Please add your first column.
        </div>
      </div>
    );
  }
  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);
  const isMobile = window.innerWidth < 768;
  useEffect(() => {
    const handleResize = () => {
      setWindowSize([
        window.innerWidth,
        window.innerHeight,
      ]);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsSideBarOpen(isMobile ? false : true);
  }, [isMobile]);
  const [isSideBarOpen, setIsSideBarOpen] = useState(isMobile ? false : true);

  
  return (
    <div className='flex h-full bg-lightGrey dark:bg-veryDarkGrey'>
      {boardModalOpen?.isOpen && (
        <AddEditBoardModal
          type={boardModalOpen.type || 'add'}
          setIsBoardModalOpen={setBoardModalOpenState}
        />
      )}
      <div 
        className={`flex-1 p-6 overflow-x-auto overflow-y-hidden scrollbar-hide transition-all duration-300 ${isSideBarOpen ? 'ml-64' : 'ml-0'}`}
      >
        {!isMobile && <Sidebar
          boards={boards}
          isSideBarOpen={isSideBarOpen}
          setIsSideBarOpen={setIsSideBarOpen}
          setIsBoardModalOpen={setBoardModalOpen || setBoardModalOpenState}
          setBoardModalOpen={setBoardModalOpen || setBoardModalOpenState}
          setBoardType={setBoardType}
        />}
        <div className='flex gap-6 min-w-max h-full items-start'>
          {board.columns.map((column) => (
            <Column 
              key={column.id} 
              column={column} 
              boardId={board.id}
              onTaskClick={handleTaskModalOpen}
            />
          ))}
          
          {/* Yeni sütun ekleme butonu */}
          <div className='w-72 flex-shrink-0'>
            <button 
              className='w-full p-4 h-full text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2'
              onClick={() => {
                setBoardType("edit");
                setOpenEditModal(true);
              }}
            >
              <span>+</span>
              <span>Add New Column</span>
            </button>
          </div>
        </div>
        
        {/* Task Ekleme/Düzenleme Modalı */}
        {openTaskModal?.isOpen && (() => {
          const debugProps = {
            taskId: openTaskModal.taskId,
            columnId: openTaskModal.columnId,
            type: taskType,
            hasTask: !!openTaskModal.task,
            task: openTaskModal.task ? {
              id: openTaskModal.task.id,
              title: openTaskModal.task.title,
              status: openTaskModal.task.status,
              description: openTaskModal.task.description?.substring(0, 50) + (openTaskModal.task.description?.length > 50 ? '...' : ''),
              subtasks: openTaskModal.task.subtasks?.length || 0
            } : null,
            timestamp: new Date().toISOString(),
            modalState: {
              ...openTaskModal,
              task: openTaskModal.task ? { id: openTaskModal.task.id, title: openTaskModal.task.title } : null
            },
            selectedTask: selectedTask ? {
              id: selectedTask.id,
              title: selectedTask.title,
              status: selectedTask.status,
              description: selectedTask.description?.substring(0, 50) + (selectedTask.description?.length > 50 ? '...' : ''),
              subtasks: selectedTask.subtasks || ""
            } : null
          };
          
          console.log('Rendering AddEditTaskModal with props:', debugProps);
          
          return (
            <div key={`modal-container-${openTaskModal.taskId || 'add'}`}>
              <AddEditTaskModal
                key={`modal-${openTaskModal.taskId || 'add'}-${Date.now()}`}
                isOpen={openTaskModal.isOpen}
                setTaskModalOpen={setOpenTaskModal}
                type={taskType}
                initialColumnId={openTaskModal.columnId}
                taskId={openTaskModal.taskId}
                selectedTask={openTaskModal.task || selectedTask}
                onClose={handleTaskModalClose}
                debugTask={openTaskModal.task}
                debugColumnId={openTaskModal.columnId}
                board={board}
              />
            </div>
          );
        })()}
      </div>
    </div>
  );
}
