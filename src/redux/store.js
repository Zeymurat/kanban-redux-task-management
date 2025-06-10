import { configureStore } from '@reduxjs/toolkit';
import boardsReducer from './boardsSlice';
import { db } from '../firebase';

// Redux Toolkit otomatik olarak thunk'ı içerir, bu yüzden ayrıca eklemeye gerek yok
export const store = configureStore({
  reducer: {
    boards: boardsReducer
  },
  // middleware özelliğini tamamen kaldırıyoruz, çünkü getDefaultMiddleware zaten thunk'ı içeriyor
  devTools: process.env.NODE_ENV !== 'production'
});

export { db };
export default store;