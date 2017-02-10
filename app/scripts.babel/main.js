const DEVICE_PATH = '/dev/tty.usbserial';
const serial = chrome.serial;
const BAUD_RATE = 19200;
const regex = /([0-9.]+) (lb|kg) NET/g;


/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
let arrayBufferToString = function (buffer) {

  let dataView = new DataView(buffer);
  let decodedString = new TextDecoder('utf-8').decode(dataView);
  return decodedString;
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
let stringToArrayBuffer = function (str) {

  let uint8array = new TextEncoder().encode(str);
  return uint8array;
};

/* Serial Connection Object*/
let SerialConnection = function () {
  this.connectionId = -1;
  this.lineBuffer = '';
  this.boundOnReceive = this.onReceive.bind(this);
  this.boundOnReceiveError = this.onReceiveError.bind(this);
  this.validateLine = this.validateLine.bind(this);
  this.onConnect = new chrome.Event();
  this.onReadLine = new chrome.Event();
  this.onError = new chrome.Event();
};

// onConnect Event Handler
SerialConnection.prototype.onConnectComplete = function (connectionInfo) {
  if (!connectionInfo) {
    log('Connection failed.');
    return;
  }
  this.connectionId = connectionInfo.connectionId;
  // chrome.serial.getInfo(this.connectionId, function (info) {
  //   console.log('INFO');
  //   console.log(info);
  // });
  chrome.serial.onReceive.addListener(this.boundOnReceive);
  chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
  this.onConnect.dispatch();
};

// onReceive Event Handler
SerialConnection.prototype.onReceive = function (receiveInfo) {
  if (receiveInfo.connectionId !== this.connectionId) {
    return;
  }
  this.lineBuffer += arrayBufferToString(receiveInfo.data);

  let index;
  while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
    let line = this.lineBuffer.substr(0, index + 1);
    this.onReadLine.dispatch(line);
    this.lineBuffer = this.lineBuffer.substr(index + 1);
    // console.log(line);
  }
};

SerialConnection.prototype.onReceiveError = function (errorInfo) {
  if (errorInfo.connectionId === this.connectionId) {
    this.onError.dispatch(errorInfo.error);
  }
};

SerialConnection.prototype.connect = function (path) {
  serial.connect(path, { bitrate: BAUD_RATE }, this.onConnectComplete.bind(this))
};

SerialConnection.prototype.send = function (msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, stringToArrayBuffer(msg), function () {
  });
};

SerialConnection.prototype.disconnect = function () {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.disconnect(this.connectionId, function () {
  });
};

// Use Regex to get only the information we want from the scale.
SerialConnection.prototype.validateLine = (line) => {
  let matched,
    wholeMatch,
    weight,
    units;

  while ((matched = regex.exec(line)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matched.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    wholeMatch = matched[0];
    weight = matched[1];
    units = matched[2];

    // The result can be accessed through the `matched`-variable.
    matched.forEach((match, groupIndex) => {
      console.log(`Found match, group ${groupIndex}: ${match}`);
    });
  }
  return weight;
};
/* Main Function */
let connection = new SerialConnection();

// onConnect Listener
connection.onConnect.addListener(function () {
  log('connected to: Weigh Station: ' + DEVICE_PATH);
  // connection.send('Hello Weigh Station');
});

// onReadLine Listener
connection.onReadLine.addListener(function (line) {
  // console.log(line);

  let validatedLine = connection.validateLine(line);
  if (validatedLine) {
    log(validatedLine);
  }
});

// Get all Devices available for connect
// serial.getDevices(function (devices) {
//   for (let i = 0; i < devices.length; i++) {
//     console.log(devices[i])
//   }
// });

// Connect to the designated device path
connection.connect(DEVICE_PATH);

function log(msg) {
  let buffer = document.querySelector('#buffer');
  buffer.innerHTML += msg + '<br/>';
}

/* Pass the weight into the UI div
   'scale_reading' for the old UI */
function injectWeightIntoUI(weight){
  $('scale_reading').update(weight);
  $('scale_reading').innerHTML;
}