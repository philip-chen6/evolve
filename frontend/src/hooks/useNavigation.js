import { useEffect } from 'react';
import { useSceneStore } from '../core/SceneManager';

// Hook to handle navigation for scene transitions
export function useNavigation({
    sceneKey,
    zoomFunction,
    isVisible,
}) {
    const { isSearchSubmitted, isSearchHandled, setSearchHandled } = useSceneStore();

    useEffect(() => {
        if (isVisible && isSearchSubmitted && !isSearchHandled) {
            zoomFunction();
            setSearchHandled(true); // Mark search as handled
        }
    }, [isVisible, isSearchSubmitted, isSearchHandled, zoomFunction, setSearchHandled, sceneKey]);
}