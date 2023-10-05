export function drawStraitBarVisualizer(
  canvasCtx,
  canvasWidth,
  canvasHeight,
  bufferLenght,
  x,
  barWidth,
  barHeight,
  dataArray
) {
  for (let i = 0; i < bufferLenght; i++) {
    barHeight = dataArray[i];
    const red = (i * barHeight) / 10;
    const green = i * 4;
    const blue = barHeight / 2;
    canvasCtx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    canvasCtx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);
    x += barWidth;
  }
}

export function drawMirroredBarVisualizer(
  canvasCtx,
  canvasWidth,
  canvasHeight,
  bufferLenght,
  x,
  barWidth,
  barHeight,
  dataArray
) {
  const halfBarWidth = canvasWidth / 2 / bufferLenght;
  for (let i = 0; i < bufferLenght; i++) {
    barHeight = dataArray[i];
    const red = (i * barHeight) / 10;
    const green = i * 4;
    const blue = barHeight / 2;
    canvasCtx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    canvasCtx.fillRect(
      canvasWidth / 2 - x,
      canvasHeight - barHeight,
      halfBarWidth,
      barHeight
    );
    x += halfBarWidth;
  }
  for (let i = 0; i < bufferLenght; i++) {
    barHeight = dataArray[i];
    const red = (i * barHeight) / 10;
    const green = i * 4;
    const blue = barHeight / 2;
    canvasCtx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    canvasCtx.fillRect(x, canvasHeight - barHeight, halfBarWidth, barHeight);
    x += halfBarWidth;
  }
}

export function drawSpiralBarVisualizer(
  canvasCtx,
  canvasWidth,
  canvasHeight,
  bufferLenght,
  x,
  barWidth,
  barHeight,
  dataArray
) {
  for (let i = 0; i < bufferLenght; i++) {
    barHeight = dataArray[i];
    canvasCtx.save();
    canvasCtx.translate(canvasWidth / 2, canvasHeight / 2);
    canvasCtx.rotate((i * (Math.PI * 2)) / bufferLenght);
    const red = (i * barHeight) / 10;
    const green = i * 4;
    const blue = barHeight / 2;
    canvasCtx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
    canvasCtx.fillRect(0, 0, barWidth, barHeight);
    x += barWidth;
    canvasCtx.restore();
  }
}
