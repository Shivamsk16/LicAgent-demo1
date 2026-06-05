import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
};

type ToastStore = {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts.slice(-4), { ...toast, id }] }));
    const duration = toast.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  show: (opts: Omit<ToastItem, "id">) => useToastStore.getState().add(opts),
  success: (title: string, description?: string, action?: ToastAction) =>
    useToastStore.getState().add({ title, description, variant: "success", action }),
  error: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "error", duration: 6000 }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "warning" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().add({ title, description, variant: "info" }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
  promise: async <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T> => {
    const id = useToastStore.getState().add({
      title: messages.loading,
      variant: "info",
      duration: 0,
    });
    try {
      const result = await promise;
      useToastStore.getState().dismiss(id);
      useToastStore.getState().add({ title: messages.success, variant: "success" });
      return result;
    } catch (e) {
      useToastStore.getState().dismiss(id);
      useToastStore.getState().add({
        title: messages.error,
        description: e instanceof Error ? e.message : undefined,
        variant: "error",
        duration: 6000,
      });
      throw e;
    }
  },
};
