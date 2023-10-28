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
  //animate();
});

//visuilize uploaded file
file.addEventListener("change", function () {
  const files = this.files;
  console.log(files);
  renderInit(files[0]);
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

function test(file) {
  const objectURL = URL.createObjectURL(file);
  let $audioCtx = new window.AudioContext();
  let $audioOff = null;
  let $analyser = null;
  let FFT_SIZE = 256;

  fetch(objectURL)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => $audioCtx.decodeAudioData(arrayBuffer))
    .then(async (audioBuffer) => {
      window.$audioBuffer = audioBuffer;
      return new Promise((resolve, reject) => {
        $audioOff = new window.OfflineAudioContext(
          2,
          audioBuffer.length,
          audioBuffer.sampleRate
        );
        $analyser = $audioOff.createAnalyser();
        $analyser.fftSize = FFT_SIZE;
        $analyser.smoothingTimeConstant = 0.96;
        $analyser.connect($audioOff.destination);
        let source = $audioOff.createBufferSource();
        source.buffer = audioBuffer;
        source.connect($analyser);
        let data = [];
        let fps = 30;
        let index = 0.4;
        let length = Math.ceil(audioBuffer.duration * fps);
        let time = 1 / fps;
        let onSuspend = () => {
          return new Promise((res, rej) => {
            index += 1;
            var raw = new Uint8Array($analyser.frequencyBinCount);
            $analyser.getByteFrequencyData(raw);
            data.push(raw);
            console.log(raw);
            if (index < length) {
              if (time * (index + 1) < audioBuffer.duration) {
                $audioOff.suspend(time * (index + 1)).then(onSuspend);
              }
              $audioOff.resume();
            }
            return res("OK");
          });
        };
        $audioOff.suspend(time * (index + 1)).then(onSuspend);
        source.start(0);
        console.log("Decoding Audio-Spectrum...");
        $audioOff
          .startRendering()
          .then(() => {
            console.log("[✔] Audio-Spectrum Decoded!");
            return resolve(data);
          })
          .catch((err) => {
            console.log("Rendering failed: " + err);
            throw { error: "Get audio data error", message: err };
          });
      });
    })
    .then(async (spectrumData) => {
      let final = await spectrumData;
      await prepareFrames(drawVisualiser, final, canvas, canvasCtx);
      await loadAudioToFFMPEG(file);
      render();
      /* DO SOMETHING WITH SPECTRUM DATA */
      /* spectrumData[ 0 ] is the first frame, depending of established fps */
      /* spectrumData[ 1 ] = 2nd frame ... */
    });
}

function test2(file) {
  const objectURL = URL.createObjectURL(file);
  fetch(objectURL)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      // It's of course also possible to re-use an existing
      // AudioContext to decode the mp3 instead of creating
      // a new one here.
      const offlineAudioContext = new OfflineAudioContext({
        length: 1,
        sampleRate: 44100,
      });

      return offlineAudioContext.decodeAudioData(arrayBuffer);
    })
    .then((audioBuffer) => {
      let monoChannel = audioBuffer.getChannelData(0);
      let bufferSize = 2048;
      window.Meyda.bufferSize = bufferSize;

      let numChunks = Math.floor(monoChannel.length / bufferSize);
      let lengthPerChunk =
        monoChannel.length / audioBuffer.sampleRate / numChunks; //in secs

      let data_chunks = [];
      for (let i = 0; i < numChunks; i++) {
        let chunk = monoChannel.slice(i * bufferSize, (i + 1) * bufferSize);
        console.log(chunk);
        let result = Meyda.extract("amplitudeSpectrum", chunk);
        console.log(result);
        data_chunks.push(result);
      }
    });
}

function loadAnalyserPipeline(audioCtx, audio1) {
  if (!audioSource) {
    audioSource = audioCtx.createMediaElementSource(audio1);
    analyser = audioCtx.createAnalyser();
    const processor = createFrequencyProcessor();
    audioSource.connect(analyser).connect(audioCtx.destination);
  }

  analyser.fftSize = NUM_OF_BARS;
  const bufferLenght = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLenght);
  analyser.getByteFrequencyData(dataArray);

  return [bufferLenght, dataArray];
}

async function createFrequencyProcessor() {
  const context = new AudioContext();

  let processorNode;

  try {
    processorNode = new AudioWorkletNode(context, "frequency.worklet");
  } catch (e) {
    try {
      console.log("adding...");
      await context.audioWorklet.addModule("frequency.worklet.js");
      processorNode = new AudioWorkletNode(context, "frequency.worklet");
    } catch (e) {
      console.log(`** Error: Unable to create worklet node: ${e}`);
      return null;
    }
  }

  await context.resume();
  return processorNode;
}

async function getAudioBuffer(file) {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  await loadAudioToFFMPEG(file);

  const dataArrayMatrix = await processFrequencyData(audioBuffer, {
    fps: 30,
    numberOfSamples: NUM_OF_BARS,
    maxDecibels: -25,
    minDecibels: -70,
    smoothingTimeConstant: 0.25,
  });
  return dataArrayMatrix;
}

//analyze frequency data ahead of time to draw frames and send them to the rendering pipline
async function processFrequencyData(audioBuffer, options) {
  const {
    fps,
    numberOfSamples,
    maxDecibels,
    minDecibels,
    smoothingTimeConstant,
  } = options;

  const frameFrequencies = [];

  //const processor = await createFrequencyProcessor();

  const oc = new OfflineAudioContext({
    length: audioBuffer.length,
    sampleRate: audioBuffer.sampleRate,
    numberOfChannels: audioBuffer.numberOfChannels,
  });

  const lengthInMillis = 1000 * (audioBuffer.length / audioBuffer.sampleRate);

  const source = new AudioBufferSourceNode(oc);
  source.buffer = audioBuffer;

  const az = new AnalyserNode(oc, {
    fftSize: numberOfSamples,
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

  console.log("start analysing audio spectrum data!");
  source.start(0);
  await oc.startRendering();
  console.log("finished anlasyng audio spectrum data!");
  //localStorage.clear();

  return frameFrequencies;
}

async function loadAudioToFFMPEG(audio) {
  //trying to pass audio to ffmpeg
  const name = audio.name.split(".")[1];
  ffmpeg.FS("writeFile", `input.${name}`, await fetchFile(audio));
}

async function prepareFrames(
  visualisationFunc,
  dataArrayMatrix,
  canvas,
  canvasCtx
) {
  const bufferLenght = dataArrayMatrix[0].length;
  const barWidth = canvas.width / bufferLenght;
  let barHeight;

  //drawing frame on the shadow canvas and sending it to be processd by the ffmpeg rendering pipline
  for (let i in dataArrayMatrix) {
    console.log(`frame ${i} incoming`);

    let freqencyDataArray = dataArrayMatrix[i];
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
      freqencyDataArray
    );
    await sleep(33);
    //create url containing base64 encoded PNG
    let frameURL = canvas.toDataURL("image/png");
    //console.log(`frame${i}::${frameURL}`);
    //decode url into 8bit binary array
    let frame = dataUrlToBytes(frameURL);

    //save binary PNG in the ffmpeg filesystem
    ffmpeg.FS("writeFile", `${i}.png`, frame);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function renderInit(file) {
  await ffmpeg.load();
  localStorage.clear();
  test2(file);
  //await getAudioBuffer(file);
  //const dataArrayMatrix = await getAudioBuffer(file);
  //await prepareFrames(drawVisualiser, dataArrayMatrix, canvas, canvasCtx);
  //await render();
}
