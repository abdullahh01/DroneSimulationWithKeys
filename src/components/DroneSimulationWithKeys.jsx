import { useEffect, useRef, useState } from 'react';
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";
import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/DRACOLoader.js";
// import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js";
import { RGBELoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/RGBELoader.js";
import { Sky } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/objects/Sky.js";

const DroneSimulation = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Basic setup
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    let mixer;
    // Setup Sky
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    const skyUniforms = sky.material.uniforms;
    skyUniforms["turbidity"].value = 5;
    skyUniforms["rayleigh"].value = 2;
    skyUniforms["mieCoefficient"].value = 0.005;
    skyUniforms["mieDirectionalG"].value = 0.5;

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
    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('../../static/models/cloud_layers_2k.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
    });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(new DRACOLoader().setDecoderPath('https://www.gstatic.com/draco/v1/decoders/'));
    
    let drone = null;
    loader.load('../../static/models/Drone.glb', (gltf) => {
      drone = gltf.scene;
      drone.position.set(0, 0, 0);
      drone.scale.set(10, 10, 10);
      drone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(drone);
      mixer = new THREE.AnimationMixer(drone);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).play();
      });
    });
    // add texture
var texture = new THREE.TextureLoader().load("../../static/models/ground.jpg");
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.castShadow = false;
texture.repeat.set(5, 5);

loader.load(
  "../../static/models/mount.glb",
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

function scale(value, inMin, inMid, inMax, outMin, outMid, outMax) {
  if (value <= inMid) {
    return ((value - inMin) * (outMid - outMin)) / (inMid - inMin) + outMin;
  } else {
    return ((value - inMid) * (outMax - outMid)) / (inMax - inMid) + outMid;
  }
}

var scan_two;
var scan_three;
loader.load(
  "../../static/models/scan.gltf",
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
    scene.add(scan_three);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);
    // Add light
    const light = new THREE.AmbientLight(0x888888, 1);
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(10, 20, 10);
    scene.add(light, pointLight);

    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xccbdc5, 30, 120);

    camera.position.set(0, 5, -10);
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.update();

    // Keyboard controls
    const keyboard = {
      pitchForward: false,
      pitchBackward: false,
      rollLeft: false,
      rollRight: false,
      yawLeft: false,
      yawRight: false,
      throttleUp: false,
      throttleDown: false,
    };

    window.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowUp':
          keyboard.pitchBackward = true;
          break;
          case 'ArrowDown':
          keyboard.pitchForward = true;
          break;
        case 'ArrowLeft':
          keyboard.rollLeft = true;
          break;
        case 'ArrowRight':
          keyboard.rollRight = true;
          break;
        case 'a':
          keyboard.yawLeft = true;
          break;
        case 'd':
          keyboard.yawRight = true;
          break;
        case 'w':
          keyboard.throttleUp = true;
          break;
        case 's':
          keyboard.throttleDown = true;
          break;
        default:
          break;
      }
    });

    window.addEventListener('keyup', (event) => {
      switch (event.key) {
        case 'ArrowUp':
          keyboard.pitchBackward = false;
          break;
          case 'ArrowDown':
          keyboard.pitchForward = false;
          break;
        case 'ArrowLeft':
          keyboard.rollLeft = false;
          break;
        case 'ArrowRight':
          keyboard.rollRight = false;
          break;
        case 'a':
          keyboard.yawLeft = false;
          break;
        case 'd':
          keyboard.yawRight = false;
          break;
        case 'w':
          keyboard.throttleUp = false;
          break;
        case 's':
          keyboard.throttleDown = false;
          break;
        default:
          break;
      }
    });

  var cameraoffset = new THREE.Vector3(6, 10, -10);
  var cameraLerpFactor = 0.05; // control the speed of interpolation (0.05 is a good starting value)

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
  var last_yaw = 0;
  var camera_yaw = 0;
  var camera_pitch = 0;
  var desiredAltitude = 0;
  var drone_at_ground_last_x = 0;
  var drone_at_ground_last_z = 0;

  const animate = () => {
    requestAnimationFrame(animate);
    // Rest of the animate code...
  
    var activeCamera;
    if (droneView) {
      activeCamera = droneCamera;
    } else if (bottomView) {
      activeCamera = droneCameraTwo;
    } else {
      activeCamera = camera;
    }
  
    if (drone) {
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      const quaternion = new THREE.Quaternion();
  
      let roll = 0, pitch = 0, yaw = 0, throttle = 0, yawSpeed = 7; // Adjust this value to control yaw speed
  
      if (keyboard.pitchForward) pitch = -0.2;
      else if (keyboard.pitchBackward) pitch = 0.2;
  
      if (keyboard.rollLeft) roll = -0.2;
      else if (keyboard.rollRight) roll = 0.2;
  
      if (keyboard.yawLeft) yaw = yawSpeed;
      else if (keyboard.yawRight) yaw = -yawSpeed;
  
      if (keyboard.throttleUp) throttle = 0.2;
      else if (keyboard.throttleDown) throttle = -0.2;
  
      last_yaw += yaw * 0.01;
  
      euler.set(pitch, last_yaw, roll);
      quaternion.setFromEuler(euler);
      drone.quaternion.copy(quaternion);
  
      const forward = new THREE.Vector3(0, 0, 1);
      const right = new THREE.Vector3(-1, 0, 0);
      const up = new THREE.Vector3(0, 1, 0);
  
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
  
      if (droneView) {
        droneCamera.position.copy(drone.position);
  
        var cameraEuler = new THREE.Euler(0, 0, 0, "YXZ");
        var cameraQuaternion = new THREE.Quaternion();
  
        camera_yaw = last_yaw + Math.PI;
        cameraEuler.set(0, camera_yaw, 0);
        cameraQuaternion.setFromEuler(cameraEuler);
  
        droneCamera.quaternion.copy(cameraQuaternion);
  
        droneCamera.position.add(
          new THREE.Vector3(0, -0.3, 0.8).applyQuaternion(drone.quaternion)
        );
      } else if (bottomView) {
        droneCameraTwo.position.copy(drone.position);
        droneCameraTwo.position.y -= 0.2;
        droneCameraTwo.position.z -= 0.2;
  
        var cameraEulerBomb = new THREE.Euler(0, 0, 0, "YXZ");
        var cameraQuaternionBomb = new THREE.Quaternion();
  
        camera_yaw = last_yaw + Math.PI;
        camera_pitch = -Math.PI / 2;
        cameraEulerBomb.set(camera_pitch, camera_yaw, 0);
        cameraQuaternionBomb.setFromEuler(cameraEulerBomb);
  
        droneCameraTwo.quaternion.copy(cameraQuaternionBomb);
      } else if (fix_camera) {
        camera.position.set(0, 5, -10);
        camera.lookAt(drone.position);
      } else {
        try {
          camera.lookAt(drone.position);
        } catch (error) {
          console.log("Error",error);
        }
      }
    }
  
    if (mixer) {
      mixer.update(scale(desiredAltitude, -1, 0, 1, 0, 0.5, 5));
    }
    
    if (drone && drone.position) {
      var targetPosition = new THREE.Vector3();
      targetPosition.copy(drone.position).add(cameraoffset);
      if (!droneView) {
        camera.position.lerp(targetPosition, cameraLerpFactor);
      }
      
    }
    // controls.update();
    renderer.render(scene, activeCamera);
  };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh', position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: "50px", }} />;
}

export default DroneSimulation