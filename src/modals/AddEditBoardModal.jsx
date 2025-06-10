import React, { useState } from 'react'
import crossIcon from "../assets/icon-cross.svg"
import { useSelector, useDispatch } from 'react-redux'
import { v4 as uuidv4 } from 'uuid';
import { createBoard, updateBoard } from '../redux/boardsSlice';

export default function AddEditBoardModal({ setBoardModalOpen, boardType, initialData }) {
    const [name, setName] = useState(initialData?.name || '');
    const pipelines = useSelector(state => state.boards.boards);
    const [isValid, setIsValid] = useState(true);
    const dispatch = useDispatch();

    // Initialize default statuses with initial data if in edit mode
    const [defaultStatus, setDefaultStatus] = useState(() => {
        if (boardType === 'edit' && initialData?.columns?.length > 0) {
            return initialData.columns.map(column => ({
                id: column.id || uuidv4(),
                name: column.name,
                tasks: column.tasks || []
            }));
        }
        // Default statuses for new board
        return [
            { id: uuidv4(), name: 'Waiting', tasks: [] },
            { id: uuidv4(), name: 'In Progress', tasks: [] },
            { id: uuidv4(), name: 'Completed', tasks: [] },
        ];
    });

    // Update form when initialData changes
    React.useEffect(() => {
        if (boardType === 'edit' && initialData) {
            setName(initialData.name || '');
            if (initialData.columns?.length > 0) {
                setDefaultStatus(initialData.columns.map(col => ({
                    id: col.id || uuidv4(),
                    name: col.name,
                    tasks: col.tasks || []
                })));
            }
        }
    }, [initialData, boardType]);
    const onChange = (id, newValue) => {
        setDefaultStatus((prevState) => {
            const newState = [...prevState]
            const status = newState.find((status) => status.id === id)
            status.name = newValue
            return newState
        })
    }
    const onDelete = (id) => {
        setDefaultStatus((prevState) => prevState.filter((status) => status.id !== id))
    }
    const onAddStatus = () => {
        setDefaultStatus((prevState) => [...prevState, { id: uuidv4(), name: "", tasks: [] }])
    }
    const validate = () => {
        setIsValid(false)
        if (name.trim() === "") {
            setIsValid(true)

        }
        for (let i = 0; i < defaultStatus.length; i++) {
            if (!defaultStatus[i].name.trim()) {
                return false
            }
        }
        setIsValid(true)
        return true
    }
    const onSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!validate()) {
            return;
        }

        try {
            if (boardType === "add") {
                await dispatch(createBoard({
                    name,
                    columns: defaultStatus
                })).unwrap();
            } else {
                await dispatch(updateBoard({ 
                    boardId: initialData.id,
                    updates: { 
                        name,
                        columns: defaultStatus
                    }
                })).unwrap();
            }
            setBoardModalOpen(false);
        } catch (error) {
            console.error("Error saving board:", error);
            // Hata durumunda kullanıcıya bilgi verebilirsiniz
        }

        return false;
    }
    return (
        <div
            onClick={(e) => {
                if (e.target !== e.currentTarget) {
                    return
                }
                setBoardModalOpen(false)
            }}
            className='fixed top-0 left-0 right-0 bottom-0 px-2 py-4 scrollbar-hide overflow-scroll z-50 justify-center flex items-center bg-[#00000080]'>
            {/* Modal Section*/}
            <div className='scrollbar-hide overflow-y-scroll max-h-[95vh] bg-white dark:bg-[#2b2c37]
        text-black dark:text-white shadow-md shadow-[#364e7e1a] max-w-md mx-auto w-full px-8 py-8 rounded-xl'>
                <form onSubmit={onSubmit}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className='text-lg font-bold text-gray-800 dark:text-white'>
                            {boardType === "edit" ? `"${initialData?.name || 'Pipeline'}" Edit` : 'Add New Pipeline'}
                        </h3>
                        {boardType === 'edit' && initialData?.createdAt && (
                            <span className="text-xs text-gray-500">
                                Created At: {new Date(initialData.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                        )}
                    </div>
                    {/*Pipeline Name*/}

                    <div className='mt-5 flex flex-col space-y-3'>
                        <label className='text-sm dark:text-white text-gray-500'>
                            Pipeline Name
                        </label>
                        <input
                            className='bg-transparent px-4 py-2 rounded-md text-sm border border-gray-600 focus:outline-[#635fc7] outline-1 ring-0 w-full'
                            placeholder='e.g Web Development'
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                            id='pipeline-name-input'
                            aria-label="Pipeline name"
                        />
                        {boardType === 'edit' && initialData?.description && (
                            <p className="text-xs text-gray-500 mt-1">
                                {initialData.description}
                            </p>
                        )}
                    </div>

                    {/*Pipeline Columns*/}

                    <div className='mt-5 flex flex-col space-y-3'>
                        <label className='text-sm dark:text-white text-gray-500'>
                            Pipeline Columns
                        </label>
                        {console.log(defaultStatus)}
                        {defaultStatus?.map((status, index) => {
                            return (
                                <div key={index} className='flex items-center mb-2'>
                                    <input
                                        className='bg-transparent px-4 py-2 rounded-md text-sm border border-gray-600 focus:outline-[#635fc7]
                                    outline-1 ring-0 w-full mr-5'
                                        placeholder='e.g Frontend Development'
                                        type="text"
                                        value={status.name}
                                        onChange={(e) => {
                                            onChange(status.id, e.target.value)
                                        }}
                                        id={`pipeline-status-input-${index}`}
                                    />
                                    <img
                                        src={crossIcon}
                                        alt="Remove status"
                                        className='cursor-pointer w-4 h-4'
                                        onClick={() => {
                                            onDelete(status.id)
                                        }}
                                    />
                                </div>
                            );
                        })}
                        {/* Create Blank Input Without Add Status Button Start */}
                        {/* <div className='flex items-center'>
                        <input className='bg-transparent px-4 py-2 rounded-md text-sm border border-gray-600 focus:outline-[#635fc7] outline-1 ring-0 w-full'
                            placeholder='e.g In Progress'
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.target.value.trim()) {
                                    dispatch(addStatus({ title: newStatus, name: newStatus, default: false }));
                                    setNewStatus('');
                                }
                            }}
                            id='pipeline-new-status-input'
                        />
                        <img src={crossIcon} alt="" className='cursor-pointer w-5 h-5' />
                    </div> */}
                        {/* Create Blank Input Without Add Status Button End */}


                    </div>
                    {/* Create New Status Button */}
                    <div className="flex flex-col space-y-2 mt-4">
                        {boardType === 'edit' && (
                            <p className="text-xs text-gray-500 text-center">
                                {defaultStatus.length} columns •&nbsp;
                                {defaultStatus.reduce((total, col) => total + (col.tasks?.length || 0), 0)} total tasks
                            </p>
                        )}
                        <button
                            type="button"
                            className='bg-[#635fc7] hover:bg-[#4e4ac4] text-white px-4 py-2 rounded-full transition-colors duration-200 flex items-center justify-center space-x-2'
                            onClick={onAddStatus}
                        >
                            <span>+</span>
                            <span>Add New Status</span>
                        </button>

                    </div>


                    {/* Save Button */}
                    <div className="mt-6 space-y-2">
                        <button
                            type="submit"
                            className='w-full items-center hover:bg-[#4e4ac4] bg-[#635fc7] py-2.5 text-white rounded-full font-medium transition-colors duration-200'
                            onClick={boardType === "edit" ? updateBoard : createBoard}>
                            {boardType === "edit" ? "Save Changes" : "Create New Pipeline"}
                        </button>
                        {boardType === 'edit' && (
                            <button
                                type="button"
                                onClick={() => setBoardModalOpen(false)}
                                className="w-full items-center hover:bg-gray-100 dark:hover:bg-gray-700 py-2 text-[#635fc7] dark:text-[#a8a4ff] rounded-full font-medium transition-colors duration-200"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
