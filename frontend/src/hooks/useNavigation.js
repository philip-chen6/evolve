import { useEffect } from 'react';
import { useSceneStore } from '../core/SceneManager';

// Hook to handle navigation for scene transitions
export function useNavigation({
    sceneKey,
    zoomFunction,
    isVisible,
}) {
    const { isSearchSubmitted, resetSearchSubmittedFlag } = useSceneStore();

    useEffect(() => {
        if (isVisible && isSearchSubmitted) {
            zoomFunction();
            resetSearchSubmittedFlag(); // Reset after triggering zoom
        }
    }, [isVisible, isSearchSubmitted, zoomFunction, resetSearchSubmittedFlag, sceneKey]);
}