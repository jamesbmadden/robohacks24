document.querySelector('#command-buttons').style.display = 'none';

const STATE = {
  connected: false,
  controllerConnected: false,
  controllerIndex: 0,
  crawlMode: false,
  isSaving: false,
  isReplaying: false,
  replayIndex: 0,
  dataToReplay: [],
  dataToSave: [],
  servoDown: false,
  buttonsDown: new Set()
}

// loop and query the gamepad state
const gamepadLoop = () => {

  // if no controller connected, exit the loop
  if (!STATE.controllerConnected) return;
  if (!STATE.connected) return;

  // read from controller!
  const { buttons, axes } = navigator.getGamepads()[STATE.controllerIndex];

  let turn = Math.abs(axes[0]) > 0.2 ? axes[0] : 0;
  let speed = buttons[7].value;
  let servoMsg;

  // handle servo first so it actually gets handled
  if (!buttons[8].pressed && STATE.buttonsDown.has('menu')) {
    STATE.buttonsDown.delete('menu');
  } else if (buttons[8].pressed && !STATE.buttonsDown.has('menu')) {
    STATE.buttonsDown.add('menu');
    // toggle servo drop
    if (STATE.servoDown) {
      // tell the servo to go up
      STATE.servoDown = false;
      servoMsg = `s/60/`; // set angle to 60deg
    } else {
      STATE.servoDown = true;
      servoMsg = `s/0/`;
    }
    window.electronAPI.sendMsg(servoMsg);
  }

  // if a is pressed, enter turbo mode (max voltage output to motors, above normal limit)
  if (STATE.buttonsDown.has('a')) {
    speed = 1.275;
  }

  // if reverse is on (right bumper pressed), flip speed
  if (STATE.buttonsDown.has('rb')) {
    speed = -1 * speed;
  }

  // add d-pad controls that OVERRIDE OTHER INPUTS
  if (STATE.buttonsDown.has('up')) {
    speed = 0.6;
  } else if (STATE.buttonsDown.has('down')) {
    speed = -0.6;
  }

  if (STATE.buttonsDown.has('left')) {
    speed = 0.6;
    turn = -1;
  } else if (STATE.buttonsDown.has('right')) {
    speed = 0.6;
    turn = 1;
  }

  // format the data for send
  // right trigger is buttons[7]!
  // left stick is axes[0]!
  // FORMAT:  ` mode/{...arguments} `
  // mode i is for controller (i)nput, mode s is for (s)ervo command!
  // input format is `i/{speed}/{turn}`, servo format is `s/{angle}`
  let msg = `i/${speed}/${turn}/`;

  // if replaying, get data from there instead
  if (STATE.isReplaying) {
    console.log('replaying');
    msg = STATE.dataToReplay[STATE.replayIndex];
    STATE.replayIndex++;
    // check if out of data
    if (STATE.replayIndex === STATE.dataToReplay.length) {
      STATE.isReplaying = false;
    }
  }

  console.log(msg);
  if (!servoMsg) {
    window.electronAPI.sendMsg(msg);
  }

  // KEEP TRACK OF AND HANDLE BUTTON PRESSES
  // menu = 8
  // rb == 5
  // Y == 3
  // X == 2
  // B == 1
  // A == 0
  // <: 14
  // ^: 12
  // \/: 13
  // >: 15
  if (!buttons[3].pressed && STATE.buttonsDown.has('y')) {
    STATE.buttonsDown.delete('y');
  } else if (buttons[3].pressed && !STATE.buttonsDown.has('y')) {
    STATE.buttonsDown.add('y');
    if (STATE.isSaving == false) {
      STATE.isSaving = true;
      STATE.dataToSave = [];
    } else {
      STATE.isSaving = false;
      window.electronAPI.saveToFile(JSON.stringify(STATE.dataToSave), `paths/${document.querySelector('#filepath-new').value}`);
    }
  }

  if (!buttons[2].pressed && STATE.buttonsDown.has('x')) {
    STATE.buttonsDown.delete('x');
  } else if (buttons[2].pressed && !STATE.buttonsDown.has('x')) {
    STATE.buttonsDown.add('x');
    if (STATE.isReplaying == false) {
      window.electronAPI.readFile(`paths/${document.querySelector('#filepath-X-replay').value}`);
    }
  }

  if (!buttons[1].pressed && STATE.buttonsDown.has('b')) {
    STATE.buttonsDown.delete('b');
  } else if (buttons[1].pressed && !STATE.buttonsDown.has('b')) {
    STATE.buttonsDown.add('b');
    if (STATE.isReplaying == false) {
      window.electronAPI.readFile(`paths/${document.querySelector('#filepath-B-replay').value}`);
    }
  }

  if (!buttons[5].pressed && STATE.buttonsDown.has('rb')) {
    STATE.buttonsDown.delete('rb');
  } else if (buttons[5].pressed && !STATE.buttonsDown.has('rb')) {
    STATE.buttonsDown.add('rb');
  }

  if (!buttons[0].pressed && STATE.buttonsDown.has('a')) {
    STATE.buttonsDown.delete('a');
  } else if (buttons[0].pressed && !STATE.buttonsDown.has('a')) {
    STATE.buttonsDown.add('a');
  }

  if (!buttons[14].pressed && STATE.buttonsDown.has('left')) {
    STATE.buttonsDown.delete('left');
  } else if (buttons[14].pressed && !STATE.buttonsDown.has('left')) {
    STATE.buttonsDown.add('left');
  }

  if (!buttons[12].pressed && STATE.buttonsDown.has('up')) {
    STATE.buttonsDown.delete('up');
  } else if (buttons[12].pressed && !STATE.buttonsDown.has('up')) {
    STATE.buttonsDown.add('up');
  }
  
  if (!buttons[13].pressed && STATE.buttonsDown.has('down')) {
    STATE.buttonsDown.delete('down');
  } else if (buttons[13].pressed && !STATE.buttonsDown.has('down')) {
    STATE.buttonsDown.add('down');
  }

  if (!buttons[15].pressed && STATE.buttonsDown.has('right')) {
    STATE.buttonsDown.delete('right');
  } else if (buttons[15].pressed && !STATE.buttonsDown.has('right')) {
    STATE.buttonsDown.add('right');
  }

  if (STATE.isSaving) {
    STATE.dataToSave.push(msg);
  }

  requestAnimationFrame(gamepadLoop);
}

addEventListener('gamepadconnected', event => {
  STATE.controllerConnected = true;
  STATE.controllerIndex = event.gamepad.index;
  document.querySelector('#controller-msg').textContent = 'Controller Connected!';
  requestAnimationFrame(gamepadLoop);
})

addEventListener("gamepaddisconnected", () => {
  STATE.controllerConnected = false;
  alert("Controller was disconnected");
});

const connectButton = document.querySelector('#connect-button');
const disconnectButton = document.querySelector('#disconnect-button');

// when the connect button is pressed, attempt to connect to the board
connectButton.addEventListener('click', () => {
  connectButton.disabled = true;
  window.electronAPI.startConnect();
});

disconnectButton.addEventListener('click', () => {
  STATE.connected = false;
  disconnectButton.disabled = true;
  connectButton.disabled = false;
  window.electronAPI.disconnect();
});

// recieve message from main process
window.electronAPI.onConnected(() => {
  console.log("connected");
  STATE.connected = true;
  disconnectButton.disabled = false;
  document.querySelector('#command-buttons').style.display = 'block';

  addButtonListeners();
})

// recieve data from the main process
window.electronAPI.onFileContent(data => {
  STATE.dataToReplay = JSON.parse(data);
  console.log(STATE.dataToReplay);
  STATE.isReplaying = true;
  STATE.replayIndex = 0;
});