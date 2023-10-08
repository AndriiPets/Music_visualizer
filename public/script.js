import {
  drawStraitBarVisualizer,
  drawMirroredBarVisualizer,
  drawSpiralBarVisualizer,
} from "./lib/visualisers.js";
import { getFrame } from "./lib/getFrame.js";

const container = document.getElementById("container");
const canvas = document.getElementById("canvas1");
const file = document.getElementById("fileupload");
const button = document.getElementById("renderButton");

//Monitors window size and resizes canvas accordingly
const observer = new ResizeObserver((entries) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
observer.observe(canvas);

const NUM_OF_BARS = 256; //32, 64, 128, 256, 512, 1024
const drawVisualiser = drawStraitBarVisualizer; //Visualizer style

const canvasCtx = canvas.getContext("2d");
let audioSource;
let analyser;

//Render button is active only when file is chosen
document.querySelector("input[type=file]").onchange = ({
  target: { value },
}) => {
  document.querySelector("button[type=submit]").disabled = !value;
};

button.addEventListener("click", function () {
  console.log("hi");
});

//initial visualization
container.addEventListener("click", function () {
  const audio1 = document.getElementById("audio1");
  const audioCtx = new AudioContext();
  audio1.src = "/public/media/BRAZIL.wav";
  //audioLen = audioCtx.decodeAudioData();

  audio1.play();
  const analyserData = loadAnalyserPipeline(audioCtx, audio1);
  const bufferLenght = analyserData[0];
  const dataArray = analyserData[1];

  const barWidth = canvas.width / bufferLenght;
  let barHeight;
  let x;
  let frameCount = 0;

  function animate() {
    x = 0;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    analyser.getByteFrequencyData(dataArray);

    drawVisualiser(
      canvasCtx,
      canvas.width,
      canvas.height,
      bufferLenght,
      x,
      barWidth,
      barHeight,
      dataArray
    );
    //console.log(dataArray);
    //getFrame(canvas, frameCount);
    frameCount++;
    requestAnimationFrame(animate);
  }
  animate();
});

//visuilize uploaded file
file.addEventListener("change", function () {
  const files = this.files;
  console.log(files);
  getSampleDuration(files[0]);
  const audio1 = document.getElementById("audio1");
  const audioCtx = new AudioContext();
  audio1.src = URL.createObjectURL(files[0]);
  audio1.load();

  audio1.play();
  const analyserData = loadAnalyserPipeline(audioCtx, audio1);
  const bufferLenght = analyserData[0];
  const dataArray = analyserData[1];

  const barWidth = canvas.width / bufferLenght;
  let barHeight;
  let x;

  function animate() {
    x = 0;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    analyser.getByteFrequencyData(dataArray);

    drawVisualiser(
      canvasCtx,
      canvas.width,
      canvas.height,
      bufferLenght,
      x,
      barWidth,
      barHeight,
      dataArray
    );
    requestAnimationFrame(animate);
  }
  animate();
});

function loadAnalyserPipeline(audioCtx, audio1) {
  if (!audioSource) {
    audioSource = audioCtx.createMediaElementSource(audio1);
    analyser = audioCtx.createAnalyser();
    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  analyser.fftSize = NUM_OF_BARS;
  const bufferLenght = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLenght);
  analyser.getByteFrequencyData(dataArray);

  return [bufferLenght, dataArray];
}

function getSampleDuration(audio) {
  let reader = new FileReader();

  reader.onload = function (e) {
    let ctx = new AudioContext();

    ctx.decodeAudioData(e.target.result, function (buffer) {
      let duration = buffer.duration;
      console.log(duration);
    });
  };
  reader.onerror = function (e) {
    console.error("An error ocurred reading this file", e);
  };

  reader.readAsArrayBuffer(audio);
}
