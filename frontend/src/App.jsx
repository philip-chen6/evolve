import "./App.css";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { NoToneMapping } from "three";
import Galaxy from "./components/Galaxy"; // The original OGL galaxy
import { Galaxy as GalaxyScene } from "./components/Galaxy/Galaxy.jsx"; // The new R3F galaxy
import DecryptedText from "./components/DecryptedText";
import SplitText from "./components/Text";
import GlassSearchBar from "./components/GlassSearchBar";
import Vignette from "./components/Vignette";
import BlackOverlay from "./components/BlackOverlay";

function App() {
  return (
    <div className="component-container">
      <BlackOverlay />
      {/* Layer 1: Original interactive galaxy background */}
      <Galaxy
        mouseRepulsion={true}
        mouseInteraction={true}
        density={1}
        glowIntensity={0.5}
        saturation={0.5}
        hueShift={200}
        repulsionStrength={0.5}
        twinkleIntensity={0.4}
        rotationSpeed={0.1}
        animateIn={true}
      />

      {/* Layer 2: New static galaxy, rendered on a transparent canvas */}
      <Canvas
        className="galaxy-scene-canvas"
        camera={{ position: [0, -10, 4.5], fov: 75 }}
        gl={{ alpha: true, toneMapping: NoToneMapping }} // Ensure transparency
      >
        <Suspense fallback={null}>
          <GalaxyScene />
        </Suspense>
      </Canvas>

      {/* Layer 3: UI Elements */}
      <Vignette />
      <div className="content-container">
        <header className="page-header">
          <h1 className="title">
            <DecryptedText text="evolve" animateOn="view" sequential={true} speed={150} />
          </h1>
          <SplitText
            text="generate a timeline of key papers for any topic."
            className="subhead"
            tag="p"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="words"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
          />
        </header>
        <div className="search-bar-wrapper">
          <GlassSearchBar />
        </div>
      </div>
    </div>
  );
}

export default App;