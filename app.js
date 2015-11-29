const SMOOTH = 0.7,
  FFT_SIZE = 256,
  WAVES = 3;

var audioCtx = new AudioContext(),
  analyserL = audioCtx.createAnalyser(),
  analyserR = audioCtx.createAnalyser(),
  splitter = audioCtx.createChannelSplitter(),
  processor = audioCtx.createScriptProcessor(),
  source;

analyserL.smoothingTimeConstant = SMOOTH;
analyserL.fftSize = FFT_SIZE;

analyserR.smoothingTimeConstant = SMOOTH;
analyserR.fftSize = FFT_SIZE;

splitter.connect(analyserL, 0, 0);
splitter.connect(analyserR, 1, 0);
splitter.connect(processor);

processor.connect(audioCtx.destination);
processor.onaudioprocess = function() {
  var arrL,
    arrR,
    channelL,
    channelR;

  arrL = new Uint8Array(analyserL.frequencyBinCount);
  analyserL.getByteFrequencyData(arrL);
  channelL = getAverage(arrL);

  arrR = new Uint8Array(analyserR.frequencyBinCount);
  analyserR.getByteFrequencyData(arrR);
  channelR = getAverage(arrR);

  drawAmplitudes(channelL, channelR);
}

navigator.mediaDevices
  .getUserMedia({ audio: true, video: false })
  .then(function(stream) {
    source = audioCtx.createMediaStreamSource(stream);
    source.connect(splitter);
  });

function getAverage(array) {
  var result = [],
    i = 0,
    j = 0,
    fragmentSize = 0,
    size = Math.floor(array.length / WAVES);

  for (j = 0; j < WAVES; j++) {
    result[j] = 1;
    fragmentSize = j === 0 ? size * 1 : size * j;

    for (i = 0; i < size; i++) {
      result[j] += array[fragmentSize + i];
    }

    result[j] = result[j] / size;
  }
  return result;
}

function drawAmplitudes(channelL, channelR) {
  var canvas = document.getElementById('arctic-modulation-canvas'),
    ctx = canvas.getContext('2d'),
    translateX = (window.innerWidth - 174) / 2 + 0.5,
    initP = 9.5,
    nextP = 16.5,
    path = new Path2D(),
    i;

  canvas.width = window.innerWidth;
  canvas.height = 300;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'miter';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  path.moveTo(0, canvas.height / 2 + 0.5);
  path.lineTo(translateX, canvas.height / 2 + 0.5);

  for (i = channelR.length - 1; i >= 0; i--) {
    path.quadraticCurveTo(
      initP + translateX,
      150 - channelR[i],
      nextP + translateX,
      canvas.height / 2 + 0.5
    );
    initP += 16.5;
    nextP += 15.5;
    path.quadraticCurveTo(
      initP + translateX,
      150 + channelL[i],
      nextP + translateX,
      canvas.height / 2 + 0.5
    );
    initP += 14.5;
    nextP += 15.5;
  }

  ctx.stroke(path);
  ctx.scale(-1, 1);
  ctx.translate(-173 - translateX * 2, +0.25);
  ctx.stroke(path);
  ctx.restore();
}
