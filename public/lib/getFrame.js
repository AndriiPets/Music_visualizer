export const getFrame = (canvas, count) => {
  console.log(`frame ${count} incoming`);
  let frame = canvas.toDataURL();
  //localStorage.setItem(count, frame);
};
