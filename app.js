import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'; // used for the navigation across the space
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'; // used for the font of the text
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'; // used for the text for the cubes
import nebula from '../src/images/nebula.jpg'; // nebula image loaded 

// global variables used for this project
const MAX_TASKS = 15;
const CUBE_SIZE = 1.5;
const CUBE_HEIGHT_INCREMENT = 2.5;
const TEXT_SIZE = 0.3;
const TEXT_HEIGHT = 0.05;
const TEXT_COLOR = 0x0000FF;
const CUBE_COLOR = 0x00FF00;
const AMBIENT_LIGHT_COLOR = 0x333333;
const DIRECTIONAL_LIGHT_COLOR = 0xFFFFFF;
const DIRECTIONAL_LIGHT_INTENSITY = 0.8;
const CAMERA_START_Z = 13;
const AXIS_HELPER_SIZE = 15;
const GRID_HELPER_SIZE = 30;
const DIRECTIONAL_LIGHT_POSITION = [-30, 50, 0];

// choosing the renderer for the overall scene 
const renderer = new THREE.WebGLRenderer();
let counter = 0;
renderer.setSize(window.innerWidth, window.innerHeight); // setting the window sise
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene(); // initialising the scene 
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
); // initialising the camera

// orbit controls for navigating across the map using the mouse scroll and dragging the space around using the mouse
const orbit = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 2, CAMERA_START_Z);
orbit.update(); // constantly updating the orbit controls for smooth movement

// starting positions for the cube in the space
let position_register = { x: -3, y: 1, z: 0 };
let vacant_positions = [];
let cubes = [];
let fonts = null;

// Load font for text, source has been taken from the Internet
const loader = new FontLoader();
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    fonts = font;
});

// Add a cube with a text label
function add_cube(task) {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: CUBE_COLOR }); // I have used StandardMaterial for the cubes to be darker 
    let vacant_position;                                                    // so that the light could be noticed better
    const cube = new THREE.Mesh(geometry, material);

    // these vacant positions are used so that if the user has removed a task and wishes to add another one, it will be added to the 
    // position of the latest removed
    if (vacant_positions.length > 0){
        vacant_position = vacant_positions.pop(); // the new cube will be added to the latest position of the removed cube
        // set the position of the cube
        cube.position.set(vacant_position[0], vacant_position[1], position_register.z);
        scene.add(cube);
        cubes.push(cube);
    } else {
        // we are making sure that the cubes are added in a matrix form, meaning when the x coordinate reaches the value 3, the next cube
        // will be placed on top and in a line order
        if (position_register.x >= 3) {
            position_register.x = -3;
            position_register.y += CUBE_HEIGHT_INCREMENT;
        } else {
            if (counter > 1) {
                position_register.x += CUBE_SIZE;
            }
        }

        // set the position of the cube
        cube.position.set(position_register.x, position_register.y, position_register.z);
        scene.add(cube);
        cubes.push(cube);
    }
   
    // use the font for the geometric text
    // the text is attatched above the cube itself
    if (fonts) {
        const textGeometry = new TextGeometry(task, {
            font: fonts,
            size: TEXT_SIZE,
            height: TEXT_HEIGHT,
        });
        const textMaterial = new THREE.MeshBasicMaterial({ color: TEXT_COLOR }); // color for the text is blue
        const textMesh = new THREE.Mesh(textGeometry, textMaterial); // creating the text mesh
        textGeometry.computeBoundingBox(); // calculating the computeBoundingBox, used for positioning the text
        const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x; // setting the width of the text
        textMesh.position.set(cube.position.x - textWidth / 2, cube.position.y + 0.8, cube.position.z); // setting the position of the text

        scene.add(textMesh); // adding the text to the scene
        cube.textMesh = textMesh; // attributing textMesh to the corresponding cube
    }
}

// Initialize scene helpers
const axishelper = new THREE.AxesHelper(AXIS_HELPER_SIZE);
scene.add(axishelper);

const gridhelper = new THREE.GridHelper(GRID_HELPER_SIZE);
scene.add(gridhelper);

// Set background texture
const textureloader = new THREE.TextureLoader();
scene.background = textureloader.load(nebula);

// Add lights to the scene
const ambientlight = new THREE.AmbientLight(AMBIENT_LIGHT_COLOR);
scene.add(ambientlight);

const directionallight = new THREE.DirectionalLight(DIRECTIONAL_LIGHT_COLOR, DIRECTIONAL_LIGHT_INTENSITY);
scene.add(directionallight);
directionallight.position.set(...DIRECTIONAL_LIGHT_POSITION);

// Animate the scene
// the cubes are rotating
function animate(time) {
    cubes.forEach(cube => {
        cube.rotation.x = time / 1000; // rotation for x
        cube.rotation.y = time / 1000; // rotation for y
    });

    renderer.render(scene, camera); // render the scene with the camera
}

// setting the animation loop
renderer.setAnimationLoop(animate);

// Add task to the list and scene
function addTask() {
    const taskInput = document.getElementById('taskInput');
    const task = taskInput.value;
    if (task && counter < MAX_TASKS) {
        counter += 1; // cpunting the tasks so that we know when to reacj the maximum limit
        add_cube(task);
        const taskList = document.getElementById('taskList'); // getting the taskList
        const li = document.createElement('li'); // creating a list item from the html document
        li.textContent = task;

        li.addEventListener('click', function() { // adding event for clicking for removing the cube from the space
            const index = Array.from(taskList.children).indexOf(li); // taking the index of the cube we want removed
            taskList.removeChild(li); // removing the index of the task corresponding to the cube from the taskList
            remove_cube(index); // removing the cube corresponding to the index
            counter -= 1; // decreasing the number of tasks
        });

        taskList.appendChild(li); // adding a new task as a list item 
        taskInput.value = ''; // clearing the taskInput so that the user can enter a new task
    }
}

// Remove cube and its text from the scene
function remove_cube(index) {
    const cube = cubes[index]; // getting the corresponding cube from the list according to the index
    scene.remove(cube); // removing the cube from the scene
    if (cube.textMesh) { // if the cube has a textMesh we also remove it
        scene.remove(cube.textMesh); // removing the textmesh corresponding to the cube
    }

    const position = [cube.position.x, cube.position.y];
    vacant_positions.push(position);
    cubes.splice(index, 1); // line used to ensure the fact that when a task is removed, the cube is also removed

    if (cubes.length == 0){ // after there are no more cubes in the scene I reset the starting positions 
        position_register = { x: -3, y: 1, z: 0 }; 
        vacant_positions.length = 0; // If there are no more cubes on the scene, it means that there are no more vacant positions either. 
    }
}

// Add event listener for the add task button
document.querySelector('button').addEventListener('click', addTask);