const container = document.getElementById("container");
const canvas = document.getElementById("canvas1");
canvas.width = window.innerWidth;
canvas.heigth = window.innerHeight;
const canvasCtx = canvas.getContext("2d");
let audioSource;
let analyser;

container.addEventListener("click", function () {
  let audio1 = document.getElementById("audio1");
  audio1.src = "media/BRAZIL.wav";
  const audioCtx = new AudioContext();

  audio1.play();
  if (!audioSource) {
    audioSource = audioCtx.createMediaElementSource(audio1);
    analyser = audioCtx.createAnalyser();
    audioSource.connect(analyser);
    analyser.connect(audioCtx.destination);
  }

  analyser.fftSize = 64;
  const bufferLenght = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLenght);

  const barWidth = canvas.width / bufferLenght;
  let barHeight;
  let x;

  function animate() {
    x = 0;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.heigth);
    analyser.getByteFrequencyData(dataArray);

    for (let i = 0; i < bufferLenght; i++) {
      barHeight = dataArray[i];
      canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
      canvasCtx.fillRect(
        x,
        canvas.height - barHeight / 2,
        barWidth,
        barHeight / 2
      );
      x += barWidth;
    }
    requestAnimationFrame(animate);
  }
  animate();
});
