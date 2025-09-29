'use client';
import {create} from 'zustand';

type LogoOverlayState = {
    show: boolean;                 // default visible
    setShow: (v: boolean) => void;
    hide: () => void;
    showNow: () => void;
};

export const useLogoOverlayVisibility = create<LogoOverlayState>((set) => ({
    show: true,
    setShow: (v) => set({show: v}),
    hide: () => set({show: false}),
    showNow: () => set({show: true}),
}));
