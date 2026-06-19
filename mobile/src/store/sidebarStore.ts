import { create } from 'zustand';

type SidebarState = {
  open: boolean;
  activeRoute?: string;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  setActiveRoute: (route?: string) => void;
};

export const useSidebarStore = create<SidebarState>((set) => ({
  open: false,
  activeRoute: undefined,
  openSidebar: () => set({ open: true }),
  closeSidebar: () => set({ open: false }),
  toggleSidebar: () => set((s) => ({ open: !s.open })),
  setActiveRoute: (activeRoute) => set({ activeRoute }),
}));
