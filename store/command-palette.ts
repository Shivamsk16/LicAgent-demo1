import { create } from "zustand";

type CommandPaletteStore = {
  open: boolean;
  shortcutsOpen: boolean;
  setOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  toggle: () => void;
};

export const useCommandPaletteStore = create<CommandPaletteStore>((set) => ({
  open: false,
  shortcutsOpen: false,
  setOpen: (open) => set({ open }),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  toggle: () => set((s) => ({ open: !s.open })),
}));
