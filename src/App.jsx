import { React, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadBoards, setCurrentBoard } from './redux/boardsSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';

function App() {
  const dispatch = useDispatch();
  const [boardModalOpen, setBoardModalOpen] = useState(false);
  const [boardType, setBoardType] = useState('edit');
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState({ 
    isOpen: false, 
    columnId: null, 
    taskId: null, 
    task: null 
  });
  const [taskType, setTaskType] = useState('edit');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Redux state'ini güvenli bir şekilde al
  const { boards, currentBoard, status, error } = useSelector((state) => ({
    boards: state.boards?.boards || [],
    currentBoard: state.boards?.currentBoard || null,
    status: state.boards?.status || 'idle',
    error: state.boards?.error || null
  }));

  // Uygulama yüklendiğinde verileri yükle
  useEffect(() => {
    const loadData = async () => {
      try {
        const resultAction = await dispatch(loadBoards());
        
        if (loadBoards.fulfilled.match(resultAction)) {
          const loadedBoards = resultAction.payload;
          if (Array.isArray(loadedBoards) && loadedBoards.length > 0) {
            // Eğer currentBoard yoksa veya geçersizse ilk board'u seç
            const validCurrentBoard = loadedBoards.some(board => board.id === currentBoard);
            if (!validCurrentBoard) {
              dispatch(setCurrentBoard(loadedBoards[0].id));
            }
          }
        }
      } catch (err) {
        console.error('Boards yüklenirken hata oluştu:', err);
      }
    };

    loadData();
  }, [dispatch]);

  // Yükleme durumunu göster
  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center justify-center mb-5">
          <img src="https://zeynelcmurat.com/img/favicon/icon.svg" alt="Loading" className="h-20 w-20" />
        </div>
        <div className="flex items-center justify-center mb-2">
          <div className="loader"></div>
        </div>
        {/* <div className="flex items-center justify-center">
          <div className="text-xl">Yükleniyor...</div>
        </div> */}
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden'>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Header
        boardModalOpen={boardModalOpen}
        setBoardModalOpen={setBoardModalOpen}
        openEditModal={openEditModal}
        setOpenEditModal={setOpenEditModal}
        boardType={boardType}
        setBoardType={setBoardType}
        openTaskModal={openTaskModal}
        setOpenTaskModal={setOpenTaskModal}
        taskType={taskType}
        setTaskType={setTaskType}
      />
      <main className='flex-1 overflow-auto pt-16 pb-16'>
        {error ? (
          <div className="p-4 text-red-600 dark:text-red-400">
            Hata: {error}
          </div>
        ) : (
          <Body 
            openEditModal={openEditModal}
            setOpenEditModal={setOpenEditModal}
            boardType={boardType}
            setBoardType={setBoardType}
            openTaskModal={openTaskModal}
            setOpenTaskModal={setOpenTaskModal}
            taskType={taskType}
            setTaskType={setTaskType}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            setBoardModalOpen={setBoardModalOpen}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
