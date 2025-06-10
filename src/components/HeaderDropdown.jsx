import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import boardIcon from "../assets/icon-board.svg";
import lightIcon from "../assets/icon-light-theme.svg";
import darkIcon from "../assets/icon-dark-theme.svg";
import { Switch } from '@headlessui/react';
import useDarkMode from "../hooks/useDarkMode";
import { setCurrentBoard } from '../redux/boardsSlice';

export default function HeaderDropdown({ 
    boards = [], 
    currentBoard, 
    setBoardModalOpen, 
    setOpenDropdown, 
    setBoardType 
}) {
    const dispatch = useDispatch();
    const [colorTheme, setTheme] = useDarkMode();
    const [darkSide, setDarkSide] = useState(
        colorTheme === 'light' ? false : true
    );
    
    const toggleDarkMode = (checked) => {
        setTheme(colorTheme);
        setDarkSide(checked);
    };

    const handleCreateNewBoard = () => {
        setBoardModalOpen(true);
        setOpenDropdown(false);
        setBoardType('add');
    };

    return (
        <div 
            className='py-10 px-6 absolute left-0 right-0 bottom-[-100vh] top-16 bg-[#00000080]'
            onClick={(e) => {
                if (e.target !== e.currentTarget) {
                    return;
                }
                setOpenDropdown(false);
            }}
        >
            {/* Dropdown Modal */}
            <div className='bg-white dark:bg-[#2b2c37] shadow-md shadow-[#364e7e1a] w-full py-4 rounded-xl'>
                <h3 className='dark:text-gray-300 text-gray-600 font-semibold mx-4 mb-8'>
                    All Boards ({boards?.length || 0})
                </h3>
                
                <div className='mx-4'>
                    {/* Board List */}
                    {Array.isArray(boards) && boards.map((board) => {
                        const isActive = board.id === currentBoard;
                        return (
                            <div
                                key={board.id}
                                className={`flex items-baseline space-x-2 px-5 py-4 dark:text-gray-300 cursor-pointer
                                    ${isActive ? 'bg-[#635fc7] rounded-r-full text-white dark:text-white mr-8' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    console.log('Selected board:', { id: board.id, name: board.name });
                                    dispatch(setCurrentBoard(board.id));
                                    setOpenDropdown(false);
                                }}
                            >
                                <img src={boardIcon} alt="board_icon" className='h-5' />
                                <p className='text-lg font-bold'>{board.name}</p>
                            </div>
                        );
                    })}

                    {/* Create New Board Button */}
                    <div
                        className='flex items-baseline space-x-2 px-5 py-4 text-[#635fc7] cursor-pointer'
                        onClick={handleCreateNewBoard}
                    >
                        <img src={boardIcon} alt="board_icon" className='h-5' />
                        <p className='text-lg italic hover:underline'>
                            Create New Board
                        </p>
                    </div>

                    {/* Dark Mode Toggle */}
                    <div className='mx-2 p-4 space-x-2 bg-slate-50 dark:bg-[#20212c] flex justify-center items-center rounded-lg'>
                        <img src={lightIcon} alt="light_icon" className='h-5' />
                        <Switch
                            className={`${darkSide ? 'bg-[#635fc7]' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full`}
                            checked={darkSide}
                            onChange={toggleDarkMode}
                        >
                            <span
                                aria-hidden="true"
                                className={`${darkSide ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                            />
                        </Switch>
                        <img src={darkIcon} alt="dark_icon" className='h-5' />
                    </div>
                </div>
            </div>
        </div>
    );
}
