import React, { useState } from 'react';
import iconDown from "../assets/icon-chevron-down.svg";
import iconUp from "../assets/icon-chevron-up.svg";
import ellipsis from "../assets/icon-vertical-ellipsis.svg";
import HeaderDropdown from './HeaderDropdown';
import AddEditBoardModal from '../modals/AddEditBoardModal';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentBoard, removeBoard } from '../redux/boardsSlice';
import ElipsisMenu from './ElipsisMenu';
import DeleteModal from '../modals/DeleteModal';
import AddEditTaskModal from '../modals/AddEditTaskModal';



export default function Header({ openEditModal, setOpenEditModal,openTaskModal, setOpenTaskModal,taskType,setTaskType,boardModalOpen, setBoardModalOpen, boardType, setBoardType }) {
    const [openDropdown, setOpenDropdown] = useState(false);
    const dispatch = useDispatch();
    const [isElipsisMenuOpen, setIsElipsisMenuOpen] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);


    // Redux state'ini güvenli bir şekilde al
    const { boards, currentBoard } = useSelector((state) => ({
        boards: state.boards?.boards || [],
        currentBoard: state.boards?.currentBoard
    }));

    // Aktif board'u bul
    const activeBoard = boards.find(board => board.id === currentBoard) || boards[0];
    return (
        <div className='p-4 fixed left-0 bg-white dark:bg-[#2b2c37] z-50 right-0'>
            <header className='flex justify-between items-center dark:text-white'>
                {/*Left Side of Header*/}
                <div className='flex items-center space-x-2 md:space-x-4'>
                    <img src="https://zeynelcmurat.com/img/favicon/icon.svg"
                        alt="logo"
                        className='h-10 w-10' />
                    <h3 className="hidden md:inline-block font-bold font-sans md:text-4xl">Kanban Todo List</h3>
                    <div className='flex items-center'
                        onClick={(e) => {
                            const isMobile = window.innerWidth < 768; // check md breakpoint for clickability   
                            if (isMobile) {
                                setOpenDropdown(state => !state);
                            }
                        }}
                    >
                        <h3 className='truncate max-w-[250px] md:text-2xl text-xl font-bold md:ml-20 font-sans'>
                            {activeBoard?.name || 'Projects Pipelines'}
                        </h3>
                        <img
                            src={openDropdown ? iconUp : iconDown}
                            alt="dropdown_icon"
                            className='cursor-pointer w-3 ml-2 md:hidden'
                        />
                    </div>
                </div>
                {/*Right Side of Header*/}
                <div className='flex items-center space-x-4 md:space-x-6'>
                    <button className='hidden md:block button' onClick={() => {
                        setTaskType("add");
                        setOpenTaskModal({ isOpen: true });
                    }}>
                        + New Task
                    </button>
                    <button className='button py-1 px-3 md:hidden' onClick={() => {
                        setTaskType("add");
                        setOpenTaskModal({ isOpen: true });
                    }}>
                        +
                    </button>
                    <img src={ellipsis}
                        alt="ellipsis"
                        className='h-6 cursor-pointer'
                        onClick={() => {
                            setBoardType("edit");
                            setOpenDropdown(false)
                            setIsElipsisMenuOpen((prevState) => !prevState);
                        }} />
                </div>
                {isElipsisMenuOpen && (
                    <ElipsisMenu
                        type="Pipeline"
                        setOpenEditModal={setOpenEditModal}
                        setOpenDeleteModal={setOpenDeleteModal}
                        setIsElipsisMenuOpen={setIsElipsisMenuOpen}
                    />
                )}
            </header>
            {openDropdown && (
                <HeaderDropdown
                    boards={boards}
                    currentBoard={currentBoard}
                    setBoardModalOpen={setBoardModalOpen}
                    setOpenDropdown={setOpenDropdown}
                    setBoardType={setBoardType}
                />
            )}
            {openTaskModal?.isOpen && (
                <AddEditTaskModal 
                    setTaskModalOpen={setOpenTaskModal}
                    type={taskType}
                    initialColumnId={openTaskModal.columnId}
                    onClose={() => setOpenTaskModal({ isOpen: false, columnId: null })}
                />
            )}
            {boardModalOpen && (
                <AddEditBoardModal 
                    setBoardModalOpen={setBoardModalOpen} 
                    boardType={boardType} 
                    initialData={boardType === 'edit' ? activeBoard : null} 
                />
            )}
            {openEditModal && (
                <AddEditBoardModal 
                    setBoardModalOpen={setOpenEditModal} 
                    boardType={boardType}
                    initialData={activeBoard}
                />
            )}
            {openDeleteModal && activeBoard && (
                <DeleteModal 
                    type="board" 
                    title={activeBoard?.name} 
                    onDeleteBtnClick={async () => {
                        try {
                            await dispatch(removeBoard(activeBoard.id)).unwrap();
                            setOpenDeleteModal(false);
                        } catch (error) {
                            console.error('Error deleting board:', error);
                        }
                    }} 
                    setIsDeleteModalOpen={setOpenDeleteModal} 
                />
            )}
            
        </div>
    )
}
