import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastWithTimeout extends Toast {
  timeoutId?: NodeJS.Timeout;
}

interface ToastStore {
  toasts: ToastWithTimeout[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let counter = 0;

const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const id = `${Date.now()}-${++counter}`;
    const newToast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // Auto remove after duration (default 5 seconds)
    const duration = toast.duration || 5000;
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
      
      // Store timeout ID for cleanup
      set((state) => ({
        toasts: state.toasts.map(t => 
          t.id === id ? { ...t, timeoutId } : t
        )
      }));
    }
  },
  removeToast: (id) => {
    // Clear timeout if toast is manually removed
    const toast = get().toasts.find(t => t.id === id);
    if (toast?.timeoutId) {
      clearTimeout(toast.timeoutId);
    }
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  clearToasts: () => {
    set({ toasts: [] });
  },
}));

export function useToast() {
  const { addToast, removeToast, clearToasts } = useToastStore();
  
  return {
    toast: {
      success: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'success', title, message, duration }),
      error: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'error', title, message, duration }),
      warning: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'warning', title, message, duration }),
      info: (title: string, message?: string, duration?: number) =>
        addToast({ type: 'info', title, message, duration }),
    },
    dismiss: removeToast,
    dismissAll: clearToasts,
  };
}

export function useToasts() {
  return useToastStore((state) => state.toasts);
}

// Helper hook to show API error messages
export function useApiErrorToast() {
  const { toast } = useToast();
  
  return (error: unknown) => {
    // Type guard for axios-like errors
    const axiosError = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
    const status = axiosError?.response?.status;
    const message = axiosError?.response?.data?.message || 
                   (error instanceof Error ? error.message : String(error));
    
    if (status === 401) {
      toast.info('Refreshing authentication...', 'Please wait a moment');
    } else if (status === 403) {
      toast.error('Access Denied', "You don't have access to this resource");
    } else if (status === 404) {
      toast.warning('Not Found', 'The requested resource was not found');
    } else if (status === 429) {
      toast.warning('Rate Limited', 'Too many requests. Please try again later');
    } else if (status && status >= 400 && status < 500) {
      toast.warning('Client Error', message || 'Please check your request and try again');
    } else if (status && status >= 500) {
      toast.error('Server Error', 'Something went wrong. Please try again');
    } else if (!navigator.onLine) {
      toast.error('Connection Lost', 'Please check your internet connection');
    } else {
      toast.error('Error', message || 'An unexpected error occurred');
    }
  };
}