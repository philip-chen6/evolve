import { useEffect } from 'react';
import { useSceneStore } from '../core/SceneManager';

// Hook to handle navigation for scene transitions
export function useNavigation({
    sceneKey,
    zoomFunction,
    isVisible,
}) {
    const { isSearchSubmitted, resetSearch } = useSceneStore();

    useEffect(() => {
        if (isVisible && isSearchSubmitted) {
            zoomFunction();
            resetSearch(); // Reset after triggering zoom
        }
    }, [isVisible, isSearchSubmitted, zoomFunction, resetSearch, sceneKey]);
}