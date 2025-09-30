import "./App.css";
import Galaxy from "./components/Galaxy";
import SplitText from "./components/Text";
import GlassSearchBar from "./components/GlassSearchBar";
import Vignette from "./components/Vignette";

function App() {
  const handleAnimationComplete = () => {
    console.log("All letters have animated!");
  };
  return (
    <div className="component-container">
      <Galaxy
        mouseRepulsion={true}
        mouseInteraction={true}
        density={1}
        glowIntensity={0.5}
        saturation={0.5}
        hueShift={200}
        repulsionStrength={0.5}
      />
      <Vignette />
      <div className="content-container">
        <header className="page-header">
          <SplitText
            text="evolve"
            className="title"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            onLetterAnimationComplete={handleAnimationComplete}
          />
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
