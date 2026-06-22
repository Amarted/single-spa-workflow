import { configureStore } from '@reduxjs/toolkit';
import { workflowSlice } from './workflowSlice';

export const store = configureStore({
  reducer: {
    workflow: workflowSlice.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
