import {
  drawStraitBarVisualizer,
  drawMirroredBarVisualizer,
  drawSpiralBarVisualizer,
} from "./lib/visualisers.js";
import { getFrame } from "./lib/getFrame.js";
import { dataUrlToBytes } from "./lib/dataUrlToBytes.js";

const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

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

//rendering specific constants
const renderCanvas = document.getElementById("renderCanvas");
const renderCanvasCtx = renderCanvas.getContext("2d", {
  willReadFrequently: true,
});

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
  getAudioBuffer(files[0]);
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
      // const duration = buffer.duration;
      // const sampleRate = buffer.sampleRate;
      // const audioCtxOff = new OfflineAudioContext(
      //   buffer.numberOfChannels,
      //   duration,
      //   sampleRate
      // );
      // const offAnalyser = audioCtxOff.createAnalyser();
      // offAnalyser.fftSize = NUM_OF_BARS;
      // offAnalyser.smoothingTimeConstant = 0.2;
      // offAnalyser.connect(audioCtxOff.destination);
      // const source = audioCtxOff.createBufferSource();
      // source.buffer = buffer;
      // source.connect(offAnalyser);
      // let frequencyDataMatrix = [[0]];
      // const fps = 30;
      // let index = 1;
      // const bufferLen = duration / sampleRate;
      // const time = 128 / sampleRate;
      // const onSuspend = () => {
      //   index++;
      //   let byteArray = new Uint8Array(analyser.frequencyBinCount);
      //   analyser.getByteFrequencyData(byteArray);
      //   frequencyDataMatrix.push(byteArray);
      //   const nextTime = time * index;
      //   console.log(
      //     `byte array ${byteArray} next time ${nextTime} buffLen ${bufferLen} duration ${duration}`
      //   );
      //   if (nextTime < bufferLen) {
      //     const nextTimeInSeconds = (index * time) / 1000;
      //     console.log(`next time ${nextTime} index ${index}`);
      //     audioCtxOff
      //       .suspend(nextTime)
      //       .then(onSuspend)
      //       .catch((err) =>
      //         console.log("Error in time partitioning" + ": " + err)
      //       );
      //   }
      //   audioCtxOff.resume();
      // };
      // audioCtxOff
      //   .suspend(0)
      //   .then(onSuspend)
      //   .catch((err) => console.log("Error in time partitioning" + ": " + err));
      // source.start(0);
      // console.log("Decoding audio spectrum...");
      // audioCtxOff
      //   .startRendering()
      //   .then(() => {
      //     console.log(
      //       "[OK]Decoding audio spectrum decoded" +
      //         ": " +
      //         `${frequencyDataMatrix}`
      //     );
      //     return frequencyDataMatrix;
      //   })
      //   .catch((err) => {
      //     console.log("Rendering failed" + ": " + err);
      //     throw { error: "Got audio data extraction error", message: err };
      //   });
    });
  };
  reader.onerror = function (e) {
    console.error("An error ocurred reading this file", e);
  };

  reader.readAsArrayBuffer(audio);
}

async function getAudioBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  await processFrequencyData(audioBuffer, file, {
    fps: 30,
    numberOfSamples: 2 ** 13,
    maxDecibels: -25,
    minDecibels: -70,
    smoothingTimeConstant: 0.2,
  });
}

//analyze frequency data ahead of time to draw frames and send them to the rendering pipline
async function processFrequencyData(audioBuffer, audio, options) {
  const {
    fps,
    numberOfSamples,
    maxDecibels,
    minDecibels,
    smoothingTimeConstant,
  } = options;

  const frameFrequencies = [];
  await ffmpeg.load();
  //trying to pass audio
  const name = audio.name.split(".")[1];
  ffmpeg.FS("writeFile", `input.${name}`, await fetchFile(audio));

  const oc = new OfflineAudioContext({
    length: audioBuffer.length,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
  });

  const lengthInMillis = 1000 * (audioBuffer.length / audioBuffer.sampleRate);

  const source = new AudioBufferSourceNode(oc);
  source.buffer = audioBuffer;

  const az = new AnalyserNode(oc, {
    fftSize: numberOfSamples * 2,
    smoothingTimeConstant,
    minDecibels,
    maxDecibels,
  });
  source.connect(az).connect(oc.destination);

  const msPerFrame = 1000 / fps;
  let currentFrame = 0;

  function process() {
    const frequenciesBufferLength = az.frequencyBinCount;
    const frequencies = new Uint8Array(frequenciesBufferLength);
    az.getByteFrequencyData(frequencies);

    // const times = new number[](az.frequencyBinCount);
    // az.getByteTimeDomainData(times);
    //console.log(`frequencies for frame:${currentFrame} ::${frequencies}`);
    //drawing frame on the shadow canvas and sending it to be processd by the ffmpeg rendering pipline
    prepareFrame(
      drawVisualiser,
      frequenciesBufferLength,
      frequencies,
      renderCanvas,
      renderCanvasCtx,
      currentFrame
    );
    frameFrequencies[currentFrame] = frequencies;

    const nextTime = (currentFrame + 1) * msPerFrame;

    if (nextTime < lengthInMillis) {
      currentFrame++;
      const nextTimeSeconds = (currentFrame * msPerFrame) / 1000;
      oc.suspend(nextTimeSeconds).then(process);
    }

    oc.resume();
  }

  oc.suspend(0).then(process);

  source.start(0);
  await oc.startRendering();
  localStorage.clear();

  await render();

  return frameFrequencies;
}

function prepareFrame(
  visualisationFunc,
  bufferLenght,
  dataArray,
  canvas,
  canvasCtx,
  count
) {
  const barWidth = canvas.width / bufferLenght;
  let barHeight;
  let x = 0;

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  visualisationFunc(
    canvasCtx,
    canvas.width,
    canvas.height,
    bufferLenght,
    x,
    barWidth,
    barHeight,
    dataArray
  );
  console.log(`frame ${count} incoming`);
  //const imageData = canvasCtx.getImageData(0, 0, canvas.width, canvas.height);

  //create url containing base64 encoded PNG
  const frameURL = canvas.toDataURL("image/png");
  //decode url into 8bit binary array
  const frame = dataUrlToBytes(frameURL);

  //save binary PNG in the ffmpeg filesystem
  ffmpeg.FS("writeFile", `${count}.png`, frame);
}

async function render() {
  const ffmpegCmd =
    "-r 30 -pattern_type glob -i *.png -c:v libx264 -pix_fmt yuv420p -vf scale=600:400 concat.mp4";
  const ffmpegArgs = ffmpegCmd.split(" ");
  await ffmpeg.run(...ffmpegArgs);

  const prepareAudioCmd = "-i input.flac -b:a 320k audio.mp3";
  const args = prepareAudioCmd.split(" ");
  await ffmpeg.run(...args);

  const ffmpegAudioCmd =
    "-i concat.mp4 -i audio.mp3 -map 0:v -map 1:a -c:v copy -c:a copy -shortest output.mp4";
  const ffmpegAudioArgs = ffmpegAudioCmd.split(" ");
  await ffmpeg.run(...ffmpegAudioArgs);

  const data = await ffmpeg.FS("readFile", "output.mp4");
  const video = document.getElementById("player");
  video.src = URL.createObjectURL(
    new Blob([data.buffer], { type: "video/mp4" })
  );
}
