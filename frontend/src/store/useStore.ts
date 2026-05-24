import { create } from 'zustand';
import { Assignment } from '@/types';

interface AppState {
  assignments: Assignment[];
  currentAssignment: Assignment | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  setAssignments: (assignments: Assignment[]) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  setIsLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  assignments: [],
  currentAssignment: null,
  isLoading: false,
  sidebarOpen: true,
  setAssignments: (assignments) => set({ assignments }),
  addAssignment: (assignment) => set((state) => ({ 
    assignments: [assignment, ...state.assignments] 
  })),
  updateAssignment: (id, updates) => set((state) => ({
    assignments: state.assignments.map(a => a._id === id ? { ...a, ...updates } : a),
    currentAssignment: state.currentAssignment?._id === id 
      ? { ...state.currentAssignment, ...updates } 
      : state.currentAssignment
  })),
  setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}));
