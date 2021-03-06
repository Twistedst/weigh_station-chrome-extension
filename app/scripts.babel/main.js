const DEVICE_PATH   = '/dev/tty.usbserial';
const CONNECTION_ID = '10001';
const serial        = chrome.serial;
const BAUD_RATE = 19200;

let connection = new SerialConnection();


/* Interprets an ArrayBuffer as UTF-8 encoded string data. */
var ab2str = function (buf) {
   // var bufView = new Uint8Array(buf);
  // var encodedString = String.fromCharCode.apply(null, bufView);
  // return decodeURIComponent(escape(encodedString));
  var dataView = new DataView(buf);
  // console.log(dataView.getUint8());
  var string = new TextDecoder('utf-8').decode(dataView);
  // console.log(string);
  return string;
};

/* Converts a string to UTF-8 encoding in a Uint8Array; returns the array buffer. */
var str2ab = function(str) {
  // var encodedString = unescape(encodeURIComponent(str));
  // var bytes = new Uint8Array(encodedString.length);
  // for (var i = 0; i < encodedString.length; ++i) {
  //   bytes[i] = encodedString.charCodeAt(i);
  // }
  // return bytes.buffer;
  var uint8array = new TextEncoder().encode(str);
  console.log(uint8array);
  return uint8array;
};

var SerialConnection = function () {
  this.connectionId        = -1;
  this.lineBuffer          = '';
  this.boundOnReceive      = this.onReceive.bind(this);
  this.boundOnReceiveError = this.onReceiveError.bind(this);
  this.onConnect           = new chrome.Event();
  this.onReadLine          = new chrome.Event();
  this.onError             = new chrome.Event();
};

SerialConnection.prototype.onConnectComplete = function (connectionInfo) {
  if (!connectionInfo) {
    log('Connection failed.');
    return;
  }
  this.connectionId = connectionInfo.connectionId;
  chrome.serial.getInfo(this.connectionId, function(info){
    console.log('INFO');
    console.log(info);
  });
  chrome.serial.onReceive.addListener(this.boundOnReceive);
  chrome.serial.onReceiveError.addListener(this.boundOnReceiveError);
  this.onConnect.dispatch();
};

SerialConnection.prototype.onReceive = function (receiveInfo) {
  if (receiveInfo.connectionId !== this.connectionId) {
    return;
  }
  // console.log(receiveInfo.data);
  this.lineBuffer += ab2str(receiveInfo.data);

  var index;
  while ((index = this.lineBuffer.indexOf('\n')) >= 0) {
    var line = this.lineBuffer.substr(0, index + 1);
    console.log('Data: ' + line);
    this.onReadLine.dispatch(line);
    this.lineBuffer = this.lineBuffer.substr(index + 1);
  }
  console.log(this.lineBuffer);
};

SerialConnection.prototype.onReceiveError = function (errorInfo) {
  if (errorInfo.connectionId === this.connectionId) {
    this.onError.dispatch(errorInfo.error);
  }
};

SerialConnection.prototype.connect = function (path) {
  serial.connect(path, {bitrate: BAUD_RATE}, this.onConnectComplete.bind(this))
};

SerialConnection.prototype.send = function (msg) {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.send(this.connectionId, str2ab(msg), function () {
  });
};

SerialConnection.prototype.disconnect = function () {
  if (this.connectionId < 0) {
    throw 'Invalid connection';
  }
  serial.disconnect(this.connectionId, function () {
  });
};

connection.onConnect.addListener(function () {
  log('connected to: ' + DEVICE_PATH);
  // connection.send('Hello Weigh Station');
});

connection.onReadLine.addListener(function (line) {
  log('read line: ' + line);
});

chrome.serial.getDevices(function(devices) {
  for (var i = 0; i < devices.length; i++) {
    console.log(devices[i])
  }
});

connection.connect(DEVICE_PATH);

function log(msg) {
  var buffer = document.querySelector('#buffer');
  buffer.innerHTML += msg + '<br/>';
}