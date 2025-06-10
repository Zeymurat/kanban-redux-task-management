import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateTask } from '../redux/boardsSlice';

export default function Task({ task, columnId, boardId, onClick }) {  
  const dispatch = useDispatch();
  const [isHovered, setIsHovered] = useState(false);
  
  // Tamamlanan alt görev sayısını hesapla
  const completedSubtasks = task?.subtasks?.filter(st => st.isCompleted).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;

  // Görev durumunu güncelle
  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(updateTask({
        boardId,
        columnId,
        taskId: task.id,
        updates: { status: newStatus }
      })).unwrap();
    } catch (err) {
      console.error('Görev güncellenirken hata oluştu:', err);
    }
  };

  const handleClick = (e) => {
    e.stopPropagation();
    
    const clickData = { 
      taskId: task?.id, 
      title: task?.title,
      columnId,
      boardId,
      event: 'click',
      timestamp: new Date().toISOString(),
      hasOnClick: !!onClick,
      task: task ? {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        subtasks: task.subtasks?.length || 0
      } : null
    };
    
    console.log('Task clicked:', clickData);
    
    if (onClick && task) {
      console.log('Calling onClick handler with task and columnId:', {
        taskId: task.id,
        columnId,
        timestamp: new Date().toISOString()
      });
      onClick(task, columnId);
    } else if (!task) {
      console.warn('Task is null or undefined in handleClick');
    } else if (!onClick) {
      console.warn('onClick handler is not defined');
    }
  };

  return (
    <div 
      className={`p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer 
        hover:shadow-md transition-shadow ${isHovered ? 'ring-2 ring-blue-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h4 className='font-bold text-gray-800 dark:text-white mb-2 line-clamp-2'>
        {task.title}
      </h4>
      
      {task.description && (
        <p className='text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2'>
          {task.description}
        </p>
      )}
      
      {totalSubtasks > 0 && (
        <div className='text-xs text-gray-500 dark:text-gray-400 mb-2'>
          {completedSubtasks} / {totalSubtasks} alt görev tamamlandı
        </div>
      )}
      
      {/* Görev atanmış kişiler */}
      {task.assignees?.length > 0 && (
        <div className='flex items-center mt-2'>
          {task.assignees.slice(0, 3).map((assignee, index) => (
            <div 
              key={assignee.id || index}
              className='w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 -ml-2 first:ml-0 border-2 border-white dark:border-gray-800'
              title={assignee.name}
            >
              {assignee.avatar || assignee.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {task.assignees.length > 3 && (
            <div className='w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400 -ml-2 border-2 border-white dark:border-gray-800'>
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      )}
      
      {/* Görev etiketleri */}
      {task.labels?.length > 0 && (
        <div className='flex flex-wrap gap-1 mt-2'>
          {task.labels.map((label, index) => (
            <span 
              key={index}
              className='px-2 py-0.5 text-xs rounded-full'
              style={{ 
                backgroundColor: `${label.color}20`,
                color: label.color,
                border: `1px solid ${label.color}40`
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      
      {/* Görev detayları */}
      <div className='flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400'>
        <div className='flex items-center'>
          {task.dueDate && (
            <span className={`flex items-center ${new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}`}>
              <svg className='w-3 h-3 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' />
              </svg>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className='flex items-center'>
          {task.priority && (
            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
              task.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {task.priority === 'high' ? 'Yüksek' : task.priority === 'medium' ? 'Orta' : 'Düşük'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
