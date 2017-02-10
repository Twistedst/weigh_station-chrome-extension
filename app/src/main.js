let serialPort = require('serialport');
// import TextDecoder from 'text-encoding';

const DEVICE_PATH = '/dev/tty.usbserial';
const BAUD_RATE = 19200;
const regex = /([0-9.]+) (lb|kg) NET/g;
const parsers = serialPort.parsers;

const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const port = new SerialPort(DEVICE_PATH, {
  baudRate: BAUD_RATE
});

port.pipe(parser);

port.on('open', () => console.log('Port open to ' + DEVICE_PATH));

parser.on('data', console.log);

//* Define all helper function *//
/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
const arrayBufferToString = function (buffer) {

  let dataView = new DataView(buffer);
  let decodedString = new TextDecoder('utf-8').decode(dataView);
  return decodedString;
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
const stringToArrayBuffer = (str) => {

  let uint8array = new TextEncoder().encode(str);
  return uint8array;
};

const log = function (msg) {
  let buffer = document.querySelector('#buffer');
  buffer.innerHTML += msg + '<br/>';
};

//Pass the weight into the UI div 'scale_reading' for the old UI
const injectWeightIntoUI = (weight) => {
  $('scale_reading').update(weight);
  $('scale_reading').innerHTML;
};

