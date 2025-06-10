import React from 'react'

export default function Footer() {
  return (
    <div className='p-4 fixed left-0 bottom-0 right-0 text-gray-600 dark:text-white bg-white dark:bg-[#2b2c37] z-50 shadow-md'>
      <div className='container mx-auto flex justify-between items-center'>
        <div className='text-sm'>
          © {new Date().getFullYear()} Kanban Task Manager 
        </div>
        <div className='flex items-center space-x-4'>
          <a href='https://zeynelcmurat.com/' target="_blank" className='text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
            About
          </a>
        </div>
      </div>
    </div>
  )
}
