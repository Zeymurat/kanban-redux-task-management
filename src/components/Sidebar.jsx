import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Switch } from "@headlessui/react";
import { setCurrentBoard } from "../redux/boardsSlice";
import boardIcon from "../assets/icon-board.svg";
import useDarkMode from "../hooks/useDarkMode";
import darkIcon from "../assets/icon-dark-theme.svg";
import lightIcon from "../assets/icon-light-theme.svg";
import showSidebarIcon from "../assets/icon-show-sidebar.svg";
import hideSidebarIcon from "../assets/icon-hide-sidebar.svg";
import AddEditBoardModal from "../modals/AddEditBoardModal";

function Sidebar({ 
  boards=[], 
  isSideBarOpen, 
  setIsSideBarOpen, 
  setIsBoardModalOpen: setBoardModalFromProps,
  setBoardModalOpen,
  setBoardType 
}) {
  const dispatch = useDispatch();
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [colorTheme, setTheme] = useDarkMode();
  const [darkSide, setDarkSide] = useState(
    colorTheme === "dark" ? true : false
  );

  const toggleDarkMode = (checked) => {
    setTheme(colorTheme);
    setDarkSide(checked);
  };

  const toggleSidebar = () => {
    setIsSideBarOpen(!isSideBarOpen);
  };

  const handleCreateNewBoard = () => {
    if (setBoardModalOpen && setBoardType) {
      setBoardModalOpen(true);
      setBoardType('add');
    } else if (setBoardModalFromProps) {
      setBoardModalFromProps({ isOpen: true, type: 'add' });
    } else if (setIsBoardModalOpen) {
      setIsBoardModalOpen({ isOpen: true, type: 'add' });
    }
    
    // Mobilde sidebar'ı kapat
    if (window.innerWidth < 768) {
      setIsSideBarOpen(false);
    }
  };

  // Mevcut board'u al
  const { currentBoard, boards: allBoards } = useSelector((state) => state.boards);
  const activeBoard = allBoards.find(board => board.id === currentBoard) || allBoards[0];

  return (
    <div className={`fixed top-0 left-0 h-full bg-white dark:bg-darkGrey shadow-lg z-20 transition-all duration-300 ${
      isSideBarOpen ? 'w-64' : 'w-0 overflow-hidden'
    }`}>
      <div className="h-full flex flex-col">
        <div>
          {/* reWrite modal  */}

          {isSideBarOpen && (
            <div className=" bg-white  dark:bg-[#2b2c37]    w-full   py-20 ">
              <h3 className=" dark:text-gray-300 text-gray-600 font-semibold mx-4 mb-8 ">
                ALL BOARDS ({boards?.length})
              </h3>

              <div className="flex flex-col h-[59vh] justify-between">
                <div>
                  <div className="pr-6">
                    {allBoards.map((board, index) => (
                      <div
                        key={board.id || index}
                        className={`flex items-center space-x-3 px-6 py-3 rounded-r-full cursor-pointer ${
                          board.id === currentBoard
                            ? 'bg-purple-500 text-white'
                            : 'text-mediumGrey hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-veryDarkGrey'
                        }`}
                        onClick={() => {
                          dispatch(setCurrentBoard(board.id));
                        }}
                      >
                        <img 
                          src={boardIcon} 
                          alt="board icon" 
                          className={`h-4 ${board.id === currentBoard ? 'brightness-0 invert' : ''}`} 
                        />
                        <span className="font-medium">{board.name}</span>
                      </div>
                    ))}
                    <div
                      className="flex items-center space-x-3 px-6 py-3 text-purple-500 cursor-pointer rounded-r-full hover:bg-gray-100 dark:hover:bg-veryDarkGrey"
                      onClick={handleCreateNewBoard}
                    >
                      {/* <img src={boardIcon} alt="create new board" className="h-4" /> */}
                      <span className="font-medium">+ Create New Board</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mx-4 mt-4 p-3 bg-white  dark:bg-[#2b2c37] rounded-lg flex justify-center items-center space-x-4">
                <img src={lightIcon} alt="light mode" className="h-4" />
                <Switch
                  checked={darkSide}
                  onChange={toggleDarkMode}
                  className={`${
                    darkSide ? 'bg-purple-500' : 'bg-gray-300'
                  } relative inline-flex h-5 w-10 items-center rounded-full`}
                >
                  <span
                    className={`${
                      darkSide ? 'translate-x-5' : 'translate-x-1'
                    } inline-block h-3.5 w-3.5 transform rounded-full bg-white transition`}
                  />
                </Switch>
                <img src={darkIcon} alt="dark mode" className="h-4" />
              </div>
            </div>
          )}

          {/* Sidebar hide/show toggle */}
          {isSideBarOpen ? (
            <div className="mt-0 bg-white  dark:bg-[#2b2c37] dark:text-gray-300 text-gray-600">
              <div
                onClick={toggleSidebar}
                className="flex items-center py-3 pl-6 text-mediumGrey hover:text-purple-500 hover:bg-gray-100 dark:hover:bg-veryDarkGrey rounded-r-full cursor-pointer transition-colors"
              >
                <img 
                  src={hideSidebarIcon} 
                  alt="hide sidebar" 
                  className="h-4 mr-3" 
                />
                <span className="font-medium ">Hide Sidebar</span>
              </div>
            </div>
          ) : (
            <div 
              className="fixed bottom-8 left-0 flex items-center justify-center bg-purple-500 p-5 rounded-r-full h-12 w-14 cursor-pointer hover:opacity-80 transition-opacity z-10"
              onClick={toggleSidebar}
            >
              <img src={showSidebarIcon} alt="show sidebar" className="h-4" />
            </div>
          )}
        </div>
      </div>

      {isBoardModalOpen?.isOpen && (
        <AddEditBoardModal
          type={isBoardModalOpen.type || 'add'}
          setIsBoardModalOpen={setIsBoardModalOpen}
        />
      )}
    </div>
  );
}

export default Sidebar;
