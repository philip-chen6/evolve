import { Points, useGLTF } from '@react-three/drei'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { GALAXY, GLOBAL, SCENE_MANAGER } from '../../config/config'
import { useSceneStore } from '../../core/SceneManager'
import { gsap } from 'gsap'
import { createNavigationAnimation } from '../../utils/navigationAnimation';
import { useNavigation } from '../../hooks/useNavigation'
import { useBloomComposer } from '../../hooks/usePostProcessing'
import { setupZoomCamera } from '../../utils/setupZoomCamera'
import { Color, Group, MathUtils, Mesh, MeshBasicMaterial, PerspectiveCamera, PointsMaterial, TextureLoader, Vector3 } from 'three'

export function Galaxy() {
  const { camera } = useThree();

  const {
    currentScene,
    zoomDirection,
    getZoomOutCameraData, setZoomOutCameraData,
    endTransition,
    startFadeToBlack,
    setOverlayColor,
  } = useSceneStore();

  const sceneKey = 'galaxy'
  const sceneVisible = currentScene === sceneKey;

  const isMobile = false;

  const galaxyRef = useRef()
  const solarSystemStarRef = useRef(); // ref of the solar system star (star in the middle of the galaxy)

  const starTexture = useLoader(TextureLoader, SCENE_MANAGER.SCENE_ASSETS.textures.galaxy.disc)

  // load the galaxy model
  const { nodes } = useGLTF(SCENE_MANAGER.SCENE_ASSETS.models.galaxy.galaxy)
  const [positions, colors] = useMemo(() => {
    nodes.Object_2.geometry.center()
    const positions = new Float32Array(
      nodes.Object_2.geometry.attributes.position.array.buffer
    )
    const colors = new Float32Array(positions.length)

    const getDistanceToCenter = (x, y, z) =>
      Math.sqrt(x * x + y * y + z * z)

    // make colors closer to 0, 0, 0 be more reddish and colors further away be more blueish
    const color = new Color()
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      const distanceToCenter = getDistanceToCenter(x, y, z)
      const normalizedDistanceToCenter = distanceToCenter / 100

      color.setRGB(
        Math.cos(normalizedDistanceToCenter),
        MathUtils.randFloat(0, 0.8),
        Math.sin(normalizedDistanceToCenter)
      )
      color.toArray(colors, i)
    }
    return [positions, colors]
  }, [nodes])

  // const composer = useBloomComposer(sceneVisible);

  // render
  useFrame(({ clock, camera }) => {
    // slowly rotate the galaxy
    galaxyRef.current.rotation.z = clock.getElapsedTime() / 15

    // solar system star size based on distance to camera (closer = bigger)
    if (solarSystemStarRef?.current) {
      const objectPosition = new Vector3();
      solarSystemStarRef.current.getWorldPosition(objectPosition);

      const dist = objectPosition.distanceTo(camera.position);

      let starSize = 1 / (dist * 0.5);
      starSize = Math.max(GALAXY.SOLAR_SYSTEM_STAR.SIZE_MIN, Math.min(starSize, GALAXY.SOLAR_SYSTEM_STAR.SIZE_MAX));
      solarSystemStarRef.current.scale.set(starSize, starSize, starSize);
    }

    // render bloom
    // if (composer) {
    //   composer.render();
    // }
  })

  function zoomInGalaxyFunction() {
    setOverlayColor('#ffffff');
    startFadeToBlack();
    setupZoomCamera(camera, 'galaxy', false, {
      getZoomOutCameraData,
      setZoomOutCameraData,
      endTransition
    });

    if (!solarSystemStarRef.current) return

    const initial = isMobile ? GLOBAL.INITIAL_CAMERA_MOBILE_POS : GLOBAL.INITIAL_CAMERA_DESKTOP_POS;

    const tweenObj = { progress: 0 };

    const tl = gsap.timeline({
      onUpdate: function () {
        const solarSystemStarPosition = new Vector3();
        solarSystemStarRef.current.getWorldPosition(solarSystemStarPosition);

        const material = solarSystemStarRef.current.material;

        const distanceToSolarSystemStar = solarSystemStarPosition.distanceTo(camera.position);
        if (distanceToSolarSystemStar < GALAXY.STAR_ZOOM_EFFECT_DISTANCE) { // zoomed in too close to the star - make zoom in effect
          camera.position.copy(solarSystemStarPosition).add(GALAXY.SOLAR_SYSTEM_STAR.CAMERA_OFFSET.clone());

          const minFov = GALAXY.SOLAR_SYSTEM_STAR.ZOOMED_IN_FOV;
          const maxFov = camera.fov;
          camera.fov = MathUtils.lerp(maxFov, minFov, .9);

          material.color.set(0x000) // make the star black when zoomed in
        } else {
          const minFov = camera.fov;
          const maxFov = isMobile ? GLOBAL.INITIAL_CAMERA_MOBILE_FOV : GLOBAL.INITIAL_CAMERA_DESKTOP_FOV;
          camera.fov = MathUtils.lerp(maxFov, minFov, .1);

          material.color.set(GALAXY.SOLAR_SYSTEM_STAR.COLOR) // reset the star color when zoomed out
        }

        camera.updateProjectionMatrix();
      },
      onComplete: () => {
        endTransition(true);
      }
    });

    tl.to(tweenObj, {
      progress: 1,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: function () {
        let dynamicTarget = (() => {
          const pos = new Vector3();
          solarSystemStarRef.current.getWorldPosition(pos);
          pos.add(GALAXY.SOLAR_SYSTEM_STAR.CAMERA_OFFSET.clone());
          return pos;
        })();

        const newPosition = initial.clone().lerp(dynamicTarget, tweenObj.progress);
        camera.position.copy(newPosition);

        camera.updateProjectionMatrix();
      }
    });
  }

  useNavigation({
    sceneKey: sceneKey,
    zoomFunction: zoomInGalaxyFunction,
    isVisible: sceneVisible,
  });

  return (
    <group dispose={null} ref={galaxyRef} position={[0, -5.0, 0]}>
      <light
        position={[0, 0, 0]}
        intensity={0.5}
      />
      <ambientLight intensity={0.5} />

      <Points scale={0.05} positions={positions} colors={colors}>
        <pointsMaterial
          transparent
          depthWrite={false}
          vertexColors
          opacity={1}
          size={0.025}
          sizeAttenuation={true}
          blending={2} // THREE.AdditiveBlending
        />
      </Points>

      <group name="SolarSystemStar">
        <mesh
          ref={solarSystemStarRef}
          position={GALAXY.SOLAR_SYSTEM_STAR.INIT_POSITION}
        >
          <sphereGeometry args={GALAXY.SOLAR_SYSTEM_STAR.INIT_SIZE} />
          <meshStandardMaterial map={starTexture} color={GALAXY.SOLAR_SYSTEM_STAR.COLOR} emissive={0xffffff} emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  );
}
