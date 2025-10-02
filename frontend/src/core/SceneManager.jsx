import { Quaternion, Vector3 } from 'three';
import { create } from 'zustand';
import { SCENE_MANAGER } from '../config/config';

export const useSceneStore = create((set, get) => ({
  searchQuery: '',
  loadingProgress: 0,
  loadingText: undefined,

  currentScene: 'galaxy', // start scene

  zoomDirection: null,
  sceneZoomed: null,

  isFullscreenActive: false,
  isSearchSubmitted: false,
  isSearchHandled: false,
  isFadingToBlack: false,
  isFadingFromBlack: false,
  isFadeComplete: false,
  overlayColor: '#000000',
  isLoading: true,
  isIntroComplete: false,

  // set default zoom out camera data for all scenes
  // used to save before zooming in and set back after zooming out
  zoomOutCameraData: Object.fromEntries(
    SCENE_MANAGER.SCENE_ORDER.map(scene => [scene, SCENE_MANAGER.ZOOM_OUT_CAMERA_DATA_DEFAULT])
  ),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setLoadingText: (text) => set({ loadingText: text }), // set loading text (optional)

  setSceneZoomed: (zoomed) => {
    set({ sceneZoomed: zoomed });
  },

  setFullscreenActive: (isActive) => {
    set({ isFullscreenActive: isActive });
  },

  submitSearch: (query) => set({ isSearchSubmitted: true, searchQuery: query, isSearchHandled: false }),
  setSearchHandled: (handled) => set({ isSearchHandled: handled }),
  startFadeToBlack: () => set({ isFadingToBlack: true, isFadeComplete: false }),
  startFadeFromBlack: () => set({ isFadingFromBlack: true }),
  completeFadeFromBlack: () => set({ isFadingFromBlack: false }),
  setOverlayColor: (color) => set({ overlayColor: color }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIntroComplete: () => set({ isIntroComplete: true }),
  completeFade: () => set({ isFadeComplete: true, isFadingToBlack: false }),
  resetSearch: () => set({ isSearchSubmitted: false, searchQuery: '', isSearchHandled: false }),

  getZoomOutCameraData: (scene) => {
    const { zoomOutCameraData } = get();
    return zoomOutCameraData[scene];
  },

  setZoomOutCameraData: (scene, data) => {
    set((state) => ({
      zoomOutCameraData: {
        ...state.zoomOutCameraData,
        [scene]: data
      }
    }));
  },

  endTransition: (isZoomIn) => {
    const { currentScene } = get();
    const currentIndex = SCENE_MANAGER.SCENE_ORDER.indexOf(currentScene);

    if (isZoomIn) {
      const nextIndex = Math.min(currentIndex + 1, SCENE_MANAGER.SCENE_ORDER.length - 1);
      const nextScene = SCENE_MANAGER.SCENE_ORDER[nextIndex];

      if (nextScene !== currentScene) { // end point, nowhere to go
        set({
          currentScene: nextScene,
          zoomDirection: 'in',
          sceneZoomed: null
        });
      }
    } else {
      const prevIndex = Math.max(currentIndex - 1, 0);
      const prevScene = SCENE_MANAGER.SCENE_ORDER[prevIndex];

      if (prevScene !== currentScene) { // end point, nowhere to go
        set({
          currentScene: prevScene,
          zoomDirection: 'out',
          sceneZoomed: null
        });
      }
    }
  }
}));