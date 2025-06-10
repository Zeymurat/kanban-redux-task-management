import React, { useState } from 'react';
import Task from './Task';

export default function Column({ column, boardId, onTaskClick }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className='w-72 flex-shrink-0 h-full flex flex-col'>
      <div className='flex items-center mb-4 mt-2'>
        <div
          className='w-3 h-3 rounded-full mr-2'
          style={{ backgroundColor: column.color || '#6366f1' }}
        />
        <h3 className='text-xs font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase'>
          {column.name} ({column.tasks?.length || 0})
        </h3>
      </div>

      <div className='flex-1 flex flex-col overflow-y-auto scrollbar-hide max-h-[calc(100vh-190px)] pr-1'>
        <div className='space-y-4 p-1'>
          <div 
            className={`p-4 text-center text-gray-800 dark:text-white bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer 
            hover:shadow-md transition-shadow ${isHovered ? 'ring-2 ring-blue-500' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => onTaskClick(null, column.id)}
          >
            + Add New Task
          </div>
          
          {column?.tasks && column.tasks.length > 0 ? (
            column.tasks.map((task) => (
              <div key={task.id} onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(task, column.id);
              }}>
                <Task
                  task={task}
                  columnId={column.id}
                  boardId={boardId}
                  onClick={onTaskClick}
                />
              </div>
            ))
          ) : (
            <div className='text-center text-gray-500 dark:text-gray-400 py-4'>
              No tasks yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
