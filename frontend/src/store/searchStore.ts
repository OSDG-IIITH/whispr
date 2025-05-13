import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface SearchState{
    searchQuery: string;
    setSearchQuery: (query: string) => void;
}

export const useSearchStore = create<SearchState>()(
    devtools(
        persist(
            (set) => ({
                searchQuery: '',
                setSearchQuery: (query: string) => set({ searchQuery: query }),
            }),
            { name: 'search-storage' }
        ),
        { name: 'search-store' }
    )
);