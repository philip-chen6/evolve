import "./App.css";
import { Canvas } from "@react-three/fiber";
import { Suspense, useState, useMemo, useEffect } from "react";
import { NoToneMapping } from "three";
import Galaxy from "./components/Galaxy"; // The original OGL galaxy
import { Galaxy as GalaxyScene } from "./components/Galaxy/Galaxy.jsx"; // The new R3F galaxy
import DecryptedText from "./components/DecryptedText";
import SplitText from "./components/Text";
import GlassSearchBar from "./components/GlassSearchBar";
import Vignette from "./components/Vignette";
import Overlay from "./components/Overlay";
import LoadingScreen from "./components/LoadingScreen";
import { motion } from "framer-motion";
import {
  EffectComposer,
  Bloom,
  Selection,
  Select,
} from "@react-three/postprocessing";
import { useSceneStore } from "./core/SceneManager";
import Timeline from "./components/Timeline";

const galaxyFocal = [0.5, 0.25];
const galaxyRotation = [1.0, 0.0];

function App() {
  const { isLoading, isIntroComplete, searchQuery, startReverse, navigationState } = useSceneStore();
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isTimelinePage, setIsTimelinePage] = useState(false);
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    // On initial application load, if there is any hash, force a hard reload to the base URL.
    // This runs only once and ensures any "restart" brings the user to the clean homepage.
    if (window.location.hash) {
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const wasTimeline = isTimelinePage;
      const isNowTimeline = window.location.hash.startsWith('#timeline');

      if (wasTimeline && !isNowTimeline) {
        // Transitioning from timeline back to galaxy
        startReverse();
        setIsTimelinePage(false); // Exit timeline view to show galaxy
        setIsReturning(true);
      } else {
        setIsTimelinePage(isNowTimeline);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [isTimelinePage, startReverse]);
  
  const handleMouseMove = (event) => {
    const { clientX, clientY, currentTarget } = event;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width;
    const y = 1.0 - (clientY - top) / height; // Invert Y for shader coordinate system
    setMousePosition({ x, y });
  };

  const galaxySceneCanvas = useMemo(
    () => (
      <Canvas
        className="galaxy-scene-canvas"
        camera={{ position: [0, -10, 4.5], fov: 75 }}
        gl={{ alpha: true, toneMapping: NoToneMapping }} // Ensure transparency
      >
        <Suspense fallback={null}>
          <Selection>
            <EffectComposer multisampling={0} disableNormalPass={true}>
              <Bloom
                intensity={2}
                luminanceThreshold={0.1}
                luminanceSmoothing={0.1}
                height={1024}
                mipmapBlur={true}
              />
            </EffectComposer>
            <Select enabled>
              <GalaxyScene />
            </Select>
          </Selection>
        </Suspense>
      </Canvas>
    ),
    []
  );

  if (isTimelinePage) {
    return <Timeline />;
  }

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
      {isLoading && <LoadingScreen />}
      <Overlay />
      {/* Layer 1: Original interactive galaxy background */}
      <div className="galaxy-background">
        <Galaxy
          focal={galaxyFocal}
          rotation={galaxyRotation}
          mouseRepulsion={true}
          mouseInteraction={false} // Disable internal listener
          mousePosition={mousePosition} // Pass position as prop
          density={1}
          glowIntensity={0.5}
          saturation={0.5}
          hueShift={200}
          repulsionStrength={1.0}
          twinkleIntensity={0.4}
          rotationSpeed={0.1}
          animateIn={false}
        />
      </div>

      {/* Layer 2: New static galaxy, rendered on a transparent canvas */}
      {galaxySceneCanvas}

      {/* Layer 3: UI Elements */}
      <Vignette />
      <div className="content-container">
        <motion.header
          className="page-header"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: isReturning ? 0.5 : 0, duration: 1.5 }}
        >
          <h1 className="title">
            {isIntroComplete && (
              <DecryptedText
                text="evolve"
                animateOn="view"
                sequential={true}
                speed={150}
              />
            )}
          </h1>
          {isIntroComplete && (
            <SplitText
              text="generate a timeline of key events for any topic."
              className="subhead"
              tag="p"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="words"
              from={{ opacity: 0, y: 20 }}
              to={{ opacity: 1, y: 0 }}
            />
          )}
        </motion.header>
        <div className="search-bar-wrapper">
          <GlassSearchBar />
        </div>
      </div>
    </div>
  );
}


export default App;