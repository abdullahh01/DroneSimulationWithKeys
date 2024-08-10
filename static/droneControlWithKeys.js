import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";
import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/DRACOLoader.js";
import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/RGBELoader.js";
import { Sky } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Sky.js";

var scene = new THREE.Scene();
// Setup Sky
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;

skyUniforms["turbidity"].value = 5;
skyUniforms["rayleigh"].value = 2;
skyUniforms["mieCoefficient"].value = 0.005;
skyUniforms["mieDirectionalG"].value = 0.5;

// Set up the sun position
const sun = new THREE.Vector3();

function updateSunPosition() {
  const theta = Math.PI * (0.45 - 0.5);
  const phi = 2 * Math.PI * (0.25 - 0.5);

  sun.x = Math.cos(phi);
  sun.y = Math.sin(phi) * Math.sin(theta);
  sun.z = Math.sin(phi) * Math.cos(theta);

  sky.material.uniforms["sunPosition"].value.copy(sun);
}

updateSunPosition();
var camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
console.log(document.getElementById("droneSim"));

document.getElementById("droneSim").appendChild(renderer.domElement);
var mixer;

// gltf loader with draco decoder
const rgbeLoader = new RGBELoader();
rgbeLoader.load("./models/cloud_layers_2k.hdr", function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
});

var loader = new GLTFLoader();
loader.setDRACOLoader(
  new DRACOLoader().setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
);
var drone;
loader.load(
  "./models/Drone.glb",
  function (gltf) {
    drone = gltf.scene;
    drone.position.y = 0;
    drone.position.x = 0;
    drone.position.z = 0;
    drone.scale.set(5, 5, 5);
    drone.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        //child.material.color.setHex(0xffffff, 1);
      }
    });

    scene.add(drone);
    mixer = new THREE.AnimationMixer(drone);
    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

function scale(value, inMin, inMid, inMax, outMin, outMid, outMax) {
  if (value <= inMid) {
    return ((value - inMin) * (outMid - outMin)) / (inMid - inMin) + outMin;
  } else {
    return ((value - inMid) * (outMax - outMid)) / (inMax - inMid) + outMid;
  }
}

var scan_two;
var scan_three;
var last_yaw = 0;
var camera_yaw = 0;
var camera_pitch = 0;
var desiredAltitude = 0;
var euler = new THREE.Euler(0, 0, 0, "YXZ"); // 'YXZ' dönüş sırasını belirler
var quaternion = new THREE.Quaternion();
var pitch = 0;

// Geçmiş hız değerlerini saklamak için değişkenler
var lastPitchSpeed = 0;
var lastRollSpeed = 0;
var lastThrottleSpeed = 0;

var drone_at_ground_last_x = 0;
var drone_at_ground_last_z = 0;
// add texture
var texture = new THREE.TextureLoader().load("./models/ground.jpg");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.castShadow = false;
texture.repeat.set(5, 5);

loader.load(
  "./models/mount.glb",
  function (gltf) {
    var mount = gltf.scene;
    mount.position.y = 5;
    mount.position.x = -120;
    mount.position.z = 0;
    mount.scale.set(50, 50, 50);
    mount.traverse(function (child) {
      if (child.isMesh) {
        child.material.map = texture;
        child.castShadow = false;
        child.receiveShadow = false;
        child.material.color.setHex(0xffffff, 1);
        child.material.side = THREE.DoubleSide;
      }
    });

    scene.add(mount);
  },
  undefined,

  function (error) {
    console.error(error);
  }
);
loader.load(
  "./models/scan.gltf",
  function (gltf) {
    var scan = gltf.scene;
    scan.position.y = 0;
    scan.position.x = -20;
    scan.position.z = 20;
    scan.rotation.y = Math.PI / 2;
    //scene.add(scan);

    scan.traverse(function (child) {
      if (child.isMesh) {
        child.material.color.setHex(0xaaaaaa, 0.5);
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scan_two = scan.clone();
    scan_two.position.set(10, 0, 30);
    //scene.add(scan_two);

    scan_three = scan.clone();
    scan_three.position.set(-18, 0, 60);
    scan_three.scale.set(0.7, 0.7, 0.7);
    //scene.add(scan_three);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

var light = new THREE.AmbientLight(0x888888, 1);
var pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
pointLight.position.set(10, 20, 10);
scene.add(light, pointLight);

scene.background = new THREE.Color(0xffffff);
//scene.add(new THREE.GridHelper(1000, 100, 0x000000, 0x000000));
scene.add(new THREE.AxesHelper(1000));

scene.fog = new THREE.Fog(0xccbdc5, 30, 120);

camera.position.set(0, 5, -10);
var controls = new OrbitControls(camera, renderer.domElement);
controls.update();

//   var bombDropped = false;
//   var bombAnimation = false;

var droneSpeed = 0.1; // Adjust this value to control speed
var yawSpeed = 1.5; // Adjust this value to control yaw speed

var keyboard = {
  pitchForward: false,
  pitchBackward: false,
  rollLeft: false,
  rollRight: false,
  yawLeft: false,
  yawRight: false,
  throttleUp: false,
  throttleDown: false,
};

// Map keyboard events to the drone control state
window.addEventListener("keydown", function (event) {
  switch (event.key) {
    case "ArrowUp":
      keyboard.pitchForward = true;
      break;
    case "ArrowDown":
      keyboard.pitchBackward = true;
      break;
    case "ArrowLeft":
      keyboard.rollLeft = true;
      break;
    case "ArrowRight":
      keyboard.rollRight = true;
      break;
    case "a": // Yaw left
      keyboard.yawLeft = true;
      break;
    case "d": // Yaw right
      keyboard.yawRight = true;
      break;
    case "w": // Throttle up
      keyboard.throttleUp = true;
      break;
    case "s": // Throttle down
      keyboard.throttleDown = true;
      break;
  }
});

window.addEventListener("keyup", function (event) {
  switch (event.key) {
    case "ArrowUp":
      keyboard.pitchForward = false;
      break;
    case "ArrowDown":
      keyboard.pitchBackward = false;
      break;
    case "ArrowLeft":
      keyboard.rollLeft = false;
      break;
    case "ArrowRight":
      keyboard.rollRight = false;
      break;
    case "a": // Yaw left
      keyboard.yawLeft = false;
      break;
    case "d": // Yaw right
      keyboard.yawRight = false;
      break;
    case "w": // Throttle up
      keyboard.throttleUp = false;
      break;
    case "s": // Throttle down
      keyboard.throttleDown = false;
      break;
  }
});

// Update drone controls based on keyboard input
function updateDroneControls() {
  var roll = 0,
    pitch = 0,
    yaw = 0,
    throttle = 0;

  if (keyboard.pitchForward) {
    pitch = -droneSpeed;
  } else if (keyboard.pitchBackward) {
    pitch = droneSpeed;
  }

  if (keyboard.rollLeft) {
    roll = -droneSpeed;
  } else if (keyboard.rollRight) {
    roll = droneSpeed;
  }

  if (keyboard.yawLeft) {
    yaw = yawSpeed;
  } else if (keyboard.yawRight) {
    yaw = -yawSpeed;
  }

  if (keyboard.throttleUp) {
    throttle = droneSpeed;
  } else if (keyboard.throttleDown) {
    throttle = -droneSpeed;
  }

  last_yaw += yaw * 0.01;

  // Update drone orientation
  euler.set(pitch, last_yaw, roll);
  quaternion.setFromEuler(euler);
  drone.quaternion.copy(quaternion);

  // Update drone position
  var forward = new THREE.Vector3(0, 0, 1);
  var right = new THREE.Vector3(-1, 0, 0);
  var up = new THREE.Vector3(0, 1, 0);

  forward.applyQuaternion(quaternion);
  right.applyQuaternion(quaternion);
  up.applyQuaternion(quaternion);

  drone.position.add(forward.multiplyScalar(pitch));
  drone.position.add(right.multiplyScalar(roll));
  drone.position.add(up.multiplyScalar(throttle));

  if (drone.position.y < 0) {
    drone.position.y = 0;
    drone.position.x = drone_at_ground_last_x;
    drone.position.z = drone_at_ground_last_z;

    drone.rotation.x = 0;
    drone.rotation.z = 0;

    drone.traverse(function (child) {
      if (child.isMesh) {
        child.material.color.setHex(0xff0000, 1);
      }
    });
  } else {
    drone_at_ground_last_x = drone.position.x;
    drone_at_ground_last_z = drone.position.z;

    drone.traverse(function (child) {
      if (child.isMesh) {
        child.material.color.setHex(0xffffff, 1);
      }
    });
  }
}

var speed = 0;
var lastPosition = new THREE.Vector3();
function updateInfo() {
  var speedElement = document.getElementById("speed");
  var positionElement = document.getElementById("position");

  // Calculate the speed as the distance travelled since last frame
  var distance = drone.position.distanceTo(lastPosition);
  speed = distance / (1 / 60); // Assuming animate is running at 60 FPS
  lastPosition.copy(drone.position);

  speedElement.innerText = "Speed: " + speed.toFixed(2);
  positionElement.innerText =
    "Position: (" +
    drone.position.x.toFixed(2) +
    ", " +
    drone.position.y.toFixed(2) +
    ", " +
    drone.position.z.toFixed(2) +
    ")";
}

var cameraoffset = new THREE.Vector3(10, 10, -10);
var cameraLerpFactor = 0.005; // control the speed of interpolation (0.05 is a good starting value)

// .joystick

var clock = new THREE.Clock();

var droneCamera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
droneCamera.position.set(0, 2, -5); // Position the droneCamera at the back of the drone

var droneCameraTwo = droneCamera.clone();

var droneView = false; // By default, the view is set to the main camera
var bottomView = false; // View from the bottom of the drone
var fix_camera = false; // View from the bottom of the drone

window.addEventListener("keydown", function (event) {
  // If key pressed is 'C' or 'c'
  if (event.key === "C" || event.key === "c") {
    droneView = !droneView; // Toggle the drone view
    bottomView = false; // If drone view is active, bottom view must be deactivated
  }
  // If key pressed is 'M' or 'm'
  else if (event.key === "M" || event.key === "m") {
    bottomView = !bottomView; // Toggle the bottom view
    droneView = false; // If bottom view is active, drone view must be deactivated
  }
});

var droneCameracontrol = { pitch: 0, yaw: 0 }; // Control object to store pitch and yaw values

window.addEventListener("keydown", function (event) {
  if (event.key === "V" || event.key === "v") {
    // If drone view is active, update the droneCamera's rotation based on the control values
    if (droneView) {
      droneCamera.rotation.x += droneCameracontrol.pitch; // Rotate around the x-axis
      droneCamera.rotation.y += droneCameracontrol.yaw; // Rotate around the y-axis
    }
  }
});

// Update the animate function to include keyboard control updates
var animate = function () {
  requestAnimationFrame(animate);

  // Update drone controls
  updateDroneControls();

  // Rest of the animate code...
  var activeCamera;
  if (droneView) {
    activeCamera = droneCamera;
  } else if (bottomView) {
    activeCamera = droneCameraTwo;
  } else {
    activeCamera = camera;
  }

  if (droneView) {
    // Kameranın drone ile aynı konumda olmasını sağla
    droneCamera.position.copy(drone.position);

    // Kameranın rotasyonunu ayarla
    var cameraEuler = new THREE.Euler(0, 0, 0, "YXZ");
    var cameraQuaternion = new THREE.Quaternion();

    // Kameranın yönünü, özellikle pitch ve yaw açılarını kullanarak ayarla
    // Burada, drone'un yaw açısını ve isteğe bağlı olarak pitch açısını
    // kullanabilirsiniz Roll genellikle gimbal kameralarda stabilize edilir ve
    // değiştirilmez
    camera_yaw = last_yaw + Math.PI;
    cameraEuler.set(0, camera_yaw, 0); // Sadece yaw açısını kullanarak kamera rotasyonu
    cameraQuaternion.setFromEuler(cameraEuler);

    // Kameranın quaternionunu ayarla
    droneCamera.quaternion.copy(cameraQuaternion);

    // Kamera için ek ayarlamalar
    // Örneğin, kamerayı biraz geri ve yukarı taşıyarak drone'u görüş alanında
    // tutabilirsiniz
    droneCamera.position.add(
      new THREE.Vector3(0, -0.3, 0.8).applyQuaternion(drone.quaternion)
    );
  } else if (bottomView) {
    droneCameraTwo.position.copy(drone.position);
    droneCameraTwo.position.y -= 0.2; // Position camera above the drone
    droneCameraTwo.position.z -= 0.2; // Position camera at the back of the
    // Adjust camera rotation
    var cameraEulerBomb = new THREE.Euler(0, 0, 0, "YXZ");
    var cameraQuaternionBomb = new THREE.Quaternion();

    camera_yaw = last_yaw + Math.PI;
    camera_pitch = -Math.PI / 2;
    cameraEulerBomb.set(camera_pitch, camera_yaw, 0); // Camera rotation using only yaw angle
    cameraQuaternionBomb.setFromEuler(cameraEulerBomb);

    //Adjust camera quaternion
    droneCameraTwo.quaternion.copy(cameraQuaternionBomb);
  } else if (fix_camera) {
    camera.position.set(0, 5, -10);
    camera.lookAt(drone.position);
  } else {
    camera.lookAt(drone.position);
  }

  //   var deltaTime = clock.getDelta();
  if (mixer) {
    mixer.update(scale(desiredAltitude, -1, 0, 1, 0, 0.5, 5));
  }

  var targetPosition = new THREE.Vector3();
  targetPosition.copy(drone.position).add(cameraoffset);

  // Interpolate camera position towards the target position
  if (!droneView) {
    camera.position.lerp(targetPosition, cameraLerpFactor);
  }

  renderer.render(scene, activeCamera);
  updateInfo();
};

animate();
