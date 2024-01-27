/*
  To get started:
  - only the first time on the command line run:
      npm install 
  - Every time you develop / test (look at package.json to change port for static server):
      npm run dev
  - To build your static site:
      npm run build
  - To preview a static site / build, after you have run the above command:
      npm run preview
*/

//import three.js
import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';//Dat Gui
import Stats from 'three/examples/jsm/libs/stats.module';//frame rate and other stats
import * as SkeletonUtils from'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {Hand} from './hand.js'

let scene, camera, renderer;
let light, dirLight, pointLight, fog, pointLightHelper;
let mouse = new THREE.Vector3();
var smoothMouse = new THREE.Vector3();
var dampingFactor = 0.1; 

//helpers
let gui, stats;

//hands Array
const hands = [];

function init() {
  //config Scene and Fog
  scene = new THREE.Scene();
  let density = 0.12;
  const fogColor = new THREE.Color(0x000000);
  fog =  new THREE.FogExp2(fogColor, density);
  scene.fog = fog;

  //config camera
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.y = 10;
  camera.rotation.x = - Math.PI / 2;

  //config renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild( renderer.domElement );

  //set up our scene
  // ambient light (from all around)
  light = new THREE.AmbientLight( 0xaaaaaa ); // soft white light
  scene.add( light );

  // //directional light
  // dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
  // dirLight.position.set( - 1, 1.75, 1 );//angle the light
  // dirLight.position.multiplyScalar( 20 );// move it back... or do it in one line
  // dirLight.shadow.camera.near = 0.01;
  // dirLight.shadow.camera.far = 100;
  // dirLight.shadow.camera.left = -10;
  // dirLight.shadow.camera.right = 10;
  // dirLight.shadow.camera.top = 10;
  // dirLight.shadow.camera.bottom = -10;
  // dirLight.shadow.mapSize.width = 2048;
  // dirLight.shadow.mapSize.height = 2048;
  // dirLight.shadow.bias = -0.001;
  // scene.add( dirLight );
  // dirLight.castShadow = true;

  //add point light
  pointLight = new THREE.PointLight(0xffffff, 90); 
  pointLight.shadow.camera.near = 0.01;
  pointLight.shadow.camera.far = 100;
  pointLight.shadow.camera.left = -50;
  pointLight.shadow.camera.right = 50;
  pointLight.shadow.camera.top = 50;
  pointLight.shadow.camera.bottom = -50;
  pointLight.shadow.mapSize.width = 2048;
  pointLight.shadow.mapSize.height = 2048;
  pointLight.shadow.bias = -0.001;
  pointLight.castShadow = true;
  scene.add(pointLight);
  pointLightHelper = new THREE.PointLightHelper(pointLight, 0.5); // Adjust size as needed
  scene.add(pointLightHelper);
  pointLightHelper.visible=false;
  
  //config plane
  let planeGeometry = new THREE.PlaneGeometry(36, 20, 100, 100);
  let planeMaterial = new THREE.MeshPhysicalMaterial({ color: 0x444444, side: THREE.DoubleSide}); // Adjust color as needed
  let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
  planeMesh.receiveShadow = true;
  planeMesh.castShadow = true;
  planeMesh.rotation.x = -Math.PI / 2;
  scene.add(planeMesh);
  planeMesh.position.set(0, 0, 0);

  
  //config GUI
  gui = new GUI({name: 'My GUI'});
  gui.add(fog, 'density', 0, 0.2);
  gui.add(pointLight, 'intensity', 10, 150);
  gui.open();
  gui.hide();
  //Put your glb files (all static assets) in the public folder
  new GLTFLoader()
  .setPath( 'models/' )
  .load( 'hand.gltf', function ( gltf ) {
    for(let i = -7; i <= 7; i += 2){
      for(let j = -4; j <= 4; j += 2){
        const model = SkeletonUtils.clone(gltf.scene.children[0]);
        model.position.set(i, 0, j);
        const hand = new Hand(model);
        scene.add(model);
        hands.push(hand);
      }
    }
  });

  //For frame rate etc
  stats = Stats();
  stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
  document.body.appendChild(stats.dom)
  stats.dom.style.display = "none";

  //add event listener, when window is resized call onWindowResize callback
  window.addEventListener('resize', onWindowResize );
  window.addEventListener('keydown', onKeyDown ); 
  window.addEventListener("mousemove", onMouseMove, false);
}

function animate() {
	requestAnimationFrame( animate );//manually call request next animation frame

  //render the scene
	renderer.render( scene, camera );
  
  //update stats
  stats.update();
  smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor;
  smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor;
  smoothMouse.z += (mouse.z - smoothMouse.z) * dampingFactor;
  pointLight.position.set(smoothMouse.x, smoothMouse.y, smoothMouse.z);
  updateHand();

  

}

//initialize then call animation loop
init();
animate();

function onWindowResize() {
  //resize everything on Window Resize
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

}

function onKeyDown(event) {

  // console.log(event.key);//https://developer.mozilla.org/en-US/docs/Web/API/Element/keydown_event
  if (event.key === "d") {
    //show hide the dat gui panel
    if(gui._hidden){
      pointLightHelper.visible=true;
      stats.dom.style.display = "block";
      gui.show();
    }else{
      pointLightHelper.visible=false;
      stats.dom.style.display = "none";
      gui.hide();
    }      
  }

};

function onMouseMove(event) {
  // Calculate mouse position in normalized device coordinates
  const m = new THREE.Vector2();
  m.x = (event.clientX / window.innerWidth) * 2 - 1;
  m.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Optionally, you can convert mouse position to world coordinates
  var raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(m, camera);

  // Assuming you have some objects in your scene
  var intersects = raycaster.intersectObjects(scene.children, true);
  intersects = intersects.filter(obj => obj.object.type == "Mesh");
  if (intersects.length > 0) {
    // The mouse is over an object
    var intersectionPoint = intersects[0].point;
    mouse = intersectionPoint;
    mouse.x *= 0.8;
    mouse.z *= 0.8;
    mouse.y = 5;
    // console.log("Mouse position in world coordinates:", intersectionPoint);
  }
}

function updateHand(){
  if(hands.length > 0){
    for(let hand of hands){
      const pos = hand.getPosition();
      const diff = new THREE.Vector3((pos.z - smoothMouse.z ) / -25, (pos.x - smoothMouse.x ) / -20, 0);
      hand.setRotation(diff);
    }
  }
}
