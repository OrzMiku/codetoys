import { create } from 'zustand'

type DashboardState = {
  selectedRegion: string
  refreshCount: number
  setSelectedRegion: (selectedRegion: string) => void
  bumpRefresh: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedRegion: 'Yangling',
  refreshCount: 0,
  setSelectedRegion: (selectedRegion) => set({ selectedRegion }),
  bumpRefresh: () => set((state) => ({ refreshCount: state.refreshCount + 1 })),
}))
