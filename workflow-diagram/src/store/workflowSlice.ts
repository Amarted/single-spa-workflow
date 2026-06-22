import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { WorkflowStep } from '@shared/workflow/interfaces/WorkflowStep';
import type { RootState } from './store';

export interface WorkflowState {
  steps: WorkflowStep[];
  name: string;
  selectedStep: number | null;
}

const initialState: WorkflowState = {
  steps: [],
  name: '',
  selectedStep: null,
};

export const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setSteps(state, action: PayloadAction<WorkflowStep[]>) {
      state.steps = action.payload;
    },
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setSelectedStep(state, action: PayloadAction<number | null>) {
      state.selectedStep = action.payload;
    },
  },
});

export const { setSteps, setName, setSelectedStep } = workflowSlice.actions;

// Селекторы (обрати внимание: RootState!)
export const selectSteps = (state: RootState) => state.workflow.steps;
export const selectName = (state: RootState) => state.workflow.name;
export const selectSelectedStep = (state: RootState) => state.workflow.selectedStep;
