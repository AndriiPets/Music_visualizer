import {
  drawStraitBarVisualizer,
  drawMirroredBarVisualizer,
  drawSpiralBarVisualizer,
} from "./lib/visualisers.js";

const container = document.getElementById("container");
const canvas = document.getElementById("canvas1");
const file = document.getElementById("fileupload");

//Monitors window size and resizes canvas accordingly
const observer = new ResizeObserver((entries) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});
observer.observe(canvas);

const NUM_OF_BARS = 128; //32, 64, 128, 256, 512, 1024
const drawVisualiser = drawSpiralBarVisualizer; //Visualizer style

const canvasCtx = canvas.getContext("2d");
let audioSource;
let analyser;

//initial visualization
container.addEventListener("click", function () {
  const audio1 = document.getElementById("audio1");
  const audioCtx = new AudioContext();
  audio1.src = "media/BRAZIL.wav";

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

//visuilize uploaded file
file.addEventListener("change", function () {
  const files = this.files;
  console.log(files);
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
