/////////////////////////////////////////////////////////////////////////
///// IMPORT
import {
  Clock,
  DirectionalLight,
  Group,
  LoadingManager,
  MeshPhongMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  WebGLRenderer,
  sRGBEncoding,
} from "three";
import { TWEEN } from "three/examples/jsm/libs/tween.module.min.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import "./main.css";

/////////////////////////////////////////////////////////////////////////
//// LOADING MANAGER
const ftsLoader = document.querySelector(".lds-roller");
const looadingCover = document.getElementById("loading-text-intro");
const loadingManager = new LoadingManager();

loadingManager.onLoad = function () {
  document.querySelector(".main-container").style.visibility = "visible";
  document.querySelector("body").style.overflow = "auto";

  // Initialize text parallax elements
  textContainer = document.querySelector(".first");
  textH1 = document.querySelector(".first > h1");
  textH2 = document.querySelector(".first > h2");

  const yPosition = { y: 0 };

  new TWEEN.Tween(yPosition)
    .to({ y: 100 }, 900)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()
    .onUpdate(function () {
      looadingCover.style.setProperty(
        "transform",
        `translate( 0, ${yPosition.y}%)`
      );
    })
    .onComplete(function () {
      looadingCover.parentNode.removeChild(
        document.getElementById("loading-text-intro")
      );
      TWEEN.remove(this);
    });

  introAnimation();
  ftsLoader.parentNode.removeChild(ftsLoader);

  window.scroll(0, 0);
};

/////////////////////////////////////////////////////////////////////////
//// DRACO LOADER TO LOAD DRACO COMPRESSED MODELS FROM BLENDER
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
dracoLoader.setDecoderConfig({ type: "js" });
const loader = new GLTFLoader(loadingManager);
loader.setDRACOLoader(dracoLoader);

/////////////////////////////////////////////////////////////////////////
///// DIV CONTAINER CREATION TO HOLD THREEJS EXPERIENCE
const container = document.getElementById("canvas-container");

/////////////////////////////////////////////////////////////////////////
///// GENERAL VARIABLES
let oldMaterial;
let width = container.clientWidth;
let height = container.clientHeight;

// Text parallax elements
let textContainer;
let textH1;
let textH2;

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION
const scene = new Scene();

/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG
const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
});
renderer.autoClear = true;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
renderer.setSize(width, height);
renderer.outputEncoding = sRGBEncoding;
container.appendChild(renderer.domElement);

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG
const cameraGroup = new Group();
scene.add(cameraGroup);

const camera = new PerspectiveCamera(35, width / height, 1, 100);
camera.position.set(19, 1.54, -0.1);
cameraGroup.add(camera);

/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN
window.addEventListener("resize", () => {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1));
});

/////////////////////////////////////////////////////////////////////////
///// SCENE LIGHTS
const sunLight = new DirectionalLight(0x435c72, 0.08);
sunLight.position.set(-100, 0, -100);
scene.add(sunLight);

const fillLight = new PointLight(0x88b2d9, 2.7, 4, 3);
fillLight.position.set(30, 3, 1.8);
scene.add(fillLight);

/////////////////////////////////////////////////////////////////////////
///// LOADING GLB/GLTF MODEL FROM BLENDER
loader.load("models/gltf/graces-draco2.glb", function (gltf) {
  gltf.scene.traverse((obj) => {
    if (obj.isMesh) {
      oldMaterial = obj.material;
      obj.material = new MeshPhongMaterial({
        shininess: 45,
      });
    }
  });
  scene.add(gltf.scene);
  clearScene();
});

function clearScene() {
  oldMaterial.dispose();
  renderer.renderLists.dispose();
}

/////////////////////////////////////////////////////////////////////////
//// INTRO CAMERA ANIMATION USING TWEEN
function introAnimation() {
  new TWEEN.Tween(camera.position.set(0, 4, 2.7))
    .to({ x: 0, y: 2.4, z: 8.8 }, 3500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()
    .onComplete(function () {
      TWEEN.remove(this);
    });
}

/////////////////////////////////////////////////////////////////////////
//// PARALLAX CONFIG
const cursor = { x: 0, y: 0 };
const clock = new Clock();
let previousTime = 0;

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION

function rendeLoop() {
  TWEEN.update();

  renderer.render(scene, camera);

  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  const parallaxY = cursor.y;
  fillLight.position.y -=
    (parallaxY * 9 + fillLight.position.y - 2) * deltaTime;

  const parallaxX = cursor.x;
  fillLight.position.x +=
    (parallaxX * 8 - fillLight.position.x) * 2 * deltaTime;

  cameraGroup.position.z -=
    (parallaxY / 3 + cameraGroup.position.z) * 2 * deltaTime;
  cameraGroup.position.x +=
    (parallaxX / 3 - cameraGroup.position.x) * 2 * deltaTime;

  // Apply parallax effect to text elements (reduced intensity to prevent overflow)
  if (textContainer) {
    const textParallaxX = parallaxX * 15; // Reduced intensity
    const textParallaxY = parallaxY * 10; // Reduced intensity

    textContainer.style.transform = `translate(${textParallaxX}px, ${textParallaxY}px)`;
  }

  // Apply individual parallax to text elements for layered effect
  if (textH1) {
    const h1ParallaxX = parallaxX * 8;
    const h1ParallaxY = parallaxY * 5;
    textH1.style.transform = `translate(${h1ParallaxX}px, ${h1ParallaxY}px)`;
  }

  if (textH2) {
    const h2ParallaxX = parallaxX * 12;
    const h2ParallaxY = parallaxY * 8;
    textH2.style.transform = `translate(${h2ParallaxX}px, ${h2ParallaxY}px)`;
  }

  requestAnimationFrame(rendeLoop);
}

rendeLoop();

//////////////////////////////////////////////////
//// ON MOUSE MOVE TO GET CAMERA POSITION
document.addEventListener(
  "mousemove",
  (event) => {
    event.preventDefault();

    cursor.x = event.clientX / window.innerWidth - 0.5;
    cursor.y = event.clientY / window.innerHeight - 0.5;
  },
  false
);
