const socket = io.connect('http://' + window.location.host + '');

const startButton = document.getElementById("startStopScan");

const container = document.getElementById('canvasContainer');
const canvas = document.getElementById('waterfall');
const activityBar = document.getElementById('activityBar');

const activityCtx = activityBar.getContext('2d');
const ctx = canvas.getContext('2d');

const liveWindowContainer = document.getElementById('liveOverlayContainer');

const sliderMin = document.getElementById('minDB');
const sliderMax = document.getElementById('maxDB');

const minSliderDB = document.getElementById('sliderMinValue');
const maxSliderDB = document.getElementById('sliderMaxValue');

const thresholdSlider = document.getElementById('thresholdSlider');
const thresholdValue = document.getElementById('thresholdValue');

const infoBoxFreq = document.getElementById("infoBoxFreq");
const infoBoxTime = document.getElementById("infoBoxTime");

let freqStart = document.getElementById("frequencyRangeMin").value;
let freqEnd = document.getElementById("frequencyRangeMax").value;
let gain = document.getElementById("gain").value;
let fftBin = document.getElementById("fftBinSize").value;

let startTCPButtons = document.querySelectorAll('.rtlTCPInfo');
let tcpServerDiv = document.querySelector('.rtlTCPInfo');
let liveOverlayDiv = document.querySelector('.liveOverlayContainer');
let liveOverlay = document.querySelectorAll('.liveOverlayContainer');

const serverControlTemplate = document.getElementById('tcp-button-template').innerHTML;
const liveOverlayTemplate = document.getElementById('liveOverlayTemplate').innerHTML;

const rtlTCPDevicesTemplate = document.getElementById('rtl-tcp-template').innerHTML;
const rtlTCPSettingsContainer = document.querySelector('.rtlTCPDeviceSettingsContainer');

let currentInstanceFreq = 0;

let rtlTCPDeviceSettings = {};

const scanDeviceType = document.getElementById('deviceType');
let currentDevice = scanDeviceType.value;

const refreshIntervals = {
    'rtl-sdr': 2000,
    'hackrf': 200
};

var refreshInterval = refreshIntervals[currentDevice];

// Waterfall and activity bar colors
const waterfallColorScheme = document.getElementById("waterfallColorSchema");
let waterfallMap = waterfallColorScheme.value;

const activityBarColor = document.getElementById('activityBarColorSchema');
let currentActivityBarColor = JSON.parse(activityBarColor.value);

// Change on TCP server and scan start/stop
// let activeTCPServer = false;
let ongoingScan = false;

let setLength = true;
let newData = false;

let actualHoverFreq = 0;

minSliderDB.textContent = sliderMin.value;
maxSliderDB.textContent = sliderMax.value;
thresholdValue.textContent = thresholdSlider.value;




// Create rtl-tcp devices

document.addEventListener('DOMContentLoaded', () => {
    var rtlTCPDeviceAmount = 0;
    initializeOriginalRtlTcpDiv();

    // Handles adding a new rtl-tcp device
    rtlTCPSettingsContainer.addEventListener('click', function(event) {
        if (event.target.classList.contains('add-rtltcp-button')) {
            rtlTCPDeviceAmount++;
            let newDiv = cloneDiv(rtlTCPDeviceAmount);
            rtlTCPSettingsContainer.appendChild(newDiv);
        }

        if (event.target.classList.contains('remove-rtltcp-button')) {
            let divToRemove = event.target.parentNode;
            let suffix = divToRemove.id.replace('rtl-tcp-input', '');
            rtlTCPSettingsContainer.removeChild(divToRemove);

            delete rtlTCPDeviceSettings[suffix];
            removeStartServerButton(suffix);

            const liveWindow = document.getElementById('liveOverlay' + currentInstanceFreq);
            liveWindow.style.display = "none";

            const tcpSettings = {
                serverID: suffix,
                deviceID: 0,
                activeTCPServer: true,
                rtlServerIP: 0,
                rtlServerPort: 0,
                rtlClientPort: 0
            };

            stopTCPServer(tcpSettings);
        }
    });

    rtlTCPSettingsContainer.addEventListener('change', function(event) {
        if (event.target.classList.contains('rtlTCPSettingsColor')) {
            let suffix = event.target.parentNode.id.replace('rtl-tcp-input', '');
            const rtlServerButton = document.getElementById('startRTLTCP' + suffix);
            const rtlServerFreq = document.getElementById('currentTCPFreqBox' + suffix);
            const color = document.getElementById('rtlTCPSettingsColor' + suffix).value;

            rtlServerButton.style.color = `${color}`;
            rtlServerFreq.style.color = `${color}`;
        }
    });
});




// Initializes origial rtltcp options and stores them

function initializeOriginalRtlTcpDiv() {
    let firstDiv = cloneDiv(0);
    rtlTCPSettingsContainer.appendChild(firstDiv);
    updateIDsAndListeners(firstDiv, '0');
}

function addStartServerButton(suffix) {

    let newHtml = serverControlTemplate.replace(/{{id}}/g, suffix);
    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHtml.trim();
    let newDiv = tempDiv.firstChild;

    let newTunedHtml = liveOverlayTemplate.replace(/{{id}}/g, suffix);
    let tempTunedDiv = document.createElement('div');
    tempTunedDiv.innerHTML = newTunedHtml.trim();
    let newTunedDiv = tempTunedDiv.firstChild;
    
    tcpServerDiv.appendChild(newDiv);
    liveOverlayDiv.appendChild(newTunedDiv);

    let newButton = document.getElementById('startRTLTCP' + suffix);
    let centerFreq = document.getElementById('currentTCPFreqBox' + suffix);

    newButton.classList.add("startTCPServer");

    newButton.addEventListener('click', function() {
        tcpServerButtonHandler(newButton);
    });

    centerFreq.addEventListener('click', function() {
        currentInstanceFreq = suffix;
        outlineSelectedServer(centerFreq);
    })
}

function outlineSelectedServer(currentServer) {
    const allTCPButtons = document.querySelectorAll('.rtlTCPInfo');
    allTCPButtons.forEach(div => {
        const divElements = div.querySelectorAll('.currentTCPFreqBox');

        divElements.forEach(span => {
            const color = document.getElementById('rtlTCPSettingsColor' + currentInstanceFreq).value;

            // Check if the span is the currentServer
            if (span.id === 'currentTCPFreqBox' + currentInstanceFreq) {
                span.style.border = `2px solid ${color}`;
            } else {
                span.style.border = `2px solid rgba(0, 0, 0, 0)`;
            }
        })
    })
}

function removeStartServerButton(suffix) {
    let divToRemove = document.getElementById('tcp-button-container' + suffix);
    if (divToRemove) {
        divToRemove.parentNode.removeChild(divToRemove);
    }
}

function cloneDiv(suffix) {

    const port = 6969 + suffix;
    const clientPort = 1234 + suffix;

    let newHtml = rtlTCPDevicesTemplate
        .replace(/{{port}}/g, port.toString())
        .replace(/{{client-port}}/g, clientPort.toString())
        .replace(/{{id}}/g, suffix);

    let tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHtml.trim();
    let newClone = tempDiv.firstChild;
    
    updateIDsAndListeners(newClone, suffix);

    // Add remove button to clone
    if (suffix > 0) {
        let removeRtlTcpButton = document.createElement('button');
        removeRtlTcpButton.textContent = `-`;
        removeRtlTcpButton.className = 'remove-rtltcp-button';

        let addRtlTcpButton = newClone.querySelector('.add-rtltcp-button');
        newClone.insertBefore(removeRtlTcpButton, addRtlTcpButton.nextSibling);
    }

    addStartServerButton(suffix);

    return newClone;
}

function updateIDsAndListeners(newDiv, suffix) {
    const elements = newDiv.querySelectorAll('[id]');
    const deviceKey = suffix;

    rtlTCPDeviceSettings[deviceKey] = {};

    elements.forEach(e1 => {
        e1.addEventListener('input', () => {
            rtlTCPDeviceSettings[deviceKey][e1.className] = e1.value;
        });

        rtlTCPDeviceSettings[deviceKey][e1.className] = e1.value || e1.placeholder || '';
    });
}




// Settings popup

document.getElementById("settingsBtn").onclick = function() {
    document.getElementById("settingsPopup").style.display = "block";
};

document.querySelector(".close-btn").onclick = function() {
    document.getElementById("settingsPopup").style.display = "none";
};

// Close the popup if user clicks outside of it
window.onclick = function(event) {
    let popup = document.getElementById("settingsPopup");
    if (event.target == popup) {
        popup.style.display = "none";
    }
};

waterfallColorScheme.addEventListener('change', function() {
    waterfallMap = this.value;
});

activityBarColor.addEventListener('change', function() {
    currentActivityBarColor = JSON.parse(this.value);
});

scanDeviceType.addEventListener('change', function() {
    currentDevice = this.value;
    var refreshInterval = refreshIntervals[currentDevice];
});




// Start button

function buttonUpdate(button, buttonText, isRunning) {

    switch (isRunning) {
        case true:
            button.textContent = buttonText;
            button.classList.remove("startButton");
            button.classList.add("stopButton");
            break;

        case false:
            button.textContent = buttonText;
            button.classList.remove("stopButton");
            button.classList.add("startButton");
            break;

        default:
            console.log("Button Error")
    }
}

startButton.addEventListener("click", function() {

    freqStart = document.getElementById("frequencyRangeMin").value;
    freqEnd = document.getElementById("frequencyRangeMax").value;
    gain = document.getElementById("gain").value;
    fftBin = document.getElementById("fftBinSize").value;

    const rtlSettings = {
        ongoingScan: ongoingScan,
        currentDevice: currentDevice,
        freqStart: freqStart,
        freqEnd: freqEnd,
        gain: gain,
        fftBin: fftBin
    };

    // Send data to the backend
    if (ongoingScan) {
        stopScan(rtlSettings);
    } else {
        setLength = true;
        startScan(rtlSettings);
    }
    
});

function startScan(rtlSettings) {

    fetch("start_scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ rtlSettings: rtlSettings })
    })
    .then(response => response.json())
    .then(data => {
        // Handle data
        console.log(data);

        ongoingScan = true;
        buttonUpdate(startButton, "Stop Scan", ongoingScan);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function stopScan(rtlSettings) {

    fetch("start_scan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ rtlSettings: rtlSettings })
    })
    .then(response => response.json())
    .then(data => {
        // Handle data
        console.log(data);

        ongoingScan = false;
        buttonUpdate(startButton, "Start Scan", ongoingScan);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}




// rtl_tcp config

function tcpServerButtonHandler(button) {

    const rtlButtonID = button.id.charAt(button.id.length - 1);

    const rtlServerIP = rtlTCPDeviceSettings[rtlButtonID].rtlTCPSettingsIP;
    const rtlServerPort = rtlTCPDeviceSettings[rtlButtonID].rtlTCPSettingsPort;
    const rtlClientPort = rtlTCPDeviceSettings[rtlButtonID].rtlTCPSettingsClientPort;
    const deviceID = rtlTCPDeviceSettings[rtlButtonID].rtlTCPSettingsDeviceID;

    let tcpSettings = {
        serverID: rtlButtonID,
        deviceID: deviceID,
        activeTCPServer: true,
        rtlServerIP: rtlServerIP,
        rtlServerPort: rtlServerPort,
        rtlClientPort: rtlClientPort
    };

    // Send data to the backend
    if (button.classList.contains("startTCPServer")) {
        tcpSettings.activeTCPServer = false;
        startTCPServer(tcpSettings, button);

        button.classList.remove("startTCPServer");
        button.classList.add("stopTCPServer");

    } else {
        tcpSettings.activeTCPServer = false;
        stopTCPServer(tcpSettings, button);

        button.classList.add("startTCPServer");
        button.classList.remove("stopTCPServer");
    }
}


function startTCPServer(tcpSettings, startTCPButton) {

    fetch("rtl_tcp_start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tcpSettings: tcpSettings })
    })
    .then(response => response.json())
    .then(data => {
        // Handle data
        console.log(data);

        // activeTCPServer = true;

        if (startTCPButton) {
            serverID = startTCPButton.id.replace('startRTLTCP', '');
            buttonUpdate(startTCPButton, "Stop TCP Server #" + serverID, true);
        };
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function stopTCPServer(tcpSettings, startTCPButton) {

    fetch("rtl_tcp_start", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ tcpSettings: tcpSettings })
    })
    .then(response => response.json())
    .then(data => {
        // Handle data
        console.log(data);

        // activeTCPServer = false;
        if (startTCPButton) {
            serverID = startTCPButton.id.replace('startRTLTCP', '')
            buttonUpdate(startTCPButton, "Start TCP Server #" + serverID, false);
        };
    })
    .catch(error => {
        console.error('Error:', error);
    });
}




// rtl_tcp frequency picker

function ctrlClickHandler(event) {

    changeRtlFreq = {
        serverID: currentInstanceFreq,
        frequency: actualHoverFreq
    }

    const liveWindow = document.getElementById('liveOverlay' + currentInstanceFreq);

    if (event.ctrlKey || event.metaKey) {
        if (event.button === 0) {

            selectedServerTcpFreq = document.getElementById('currentTCPFreq' + currentInstanceFreq);
            selectedServerTcpFreq.textContent = infoBoxFreq.textContent;
            fetch("rtl_tcp_frequency", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ changeRtlFreq: changeRtlFreq })
            })
            .then(response => response.json())
            .then(data => {
                // Handle data

                const totalFreq = freqEnd - freqStart;
                const rtlWidth = (2.4 / totalFreq * 100);

                const color = document.getElementById('rtlTCPSettingsColor' + currentInstanceFreq).value;

                const viewWindowLocation  = ( ( (selectedServerTcpFreq.textContent - 1.2) - freqStart ) / totalFreq * 100);
                liveWindow.style.left = `${viewWindowLocation}%`
                liveWindow.style.width = `${rtlWidth}%`
                liveWindow.style.height = `${canvas.clientHeight}px`
                liveWindow.style.borderTop = `3px solid ${color}`
                // liveWindow.style.border = `1px solid ${color}`
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }
}

canvas.addEventListener('click', ctrlClickHandler);




// Drawing logic

const colorMapDefault = [
    [0, 20, 50],
    [0, 50, 100],
    [50, 100, 100],
    [150, 150, 20],
    [255, 255, 0]
];

const colorMapDefaultPeaks = [
    [0, 20, 50],
    [0, 50, 100],
    [50, 100, 100],
    [200, 200, 20],
    [255, 0, 0]
];

const colorMapBW = [
    [10, 10, 10],
    [50, 50, 50],
    [100, 100, 100],
    [150, 150, 150],
    [255, 255, 255]
]

const colorMapBWRed = [
    [10, 10, 10],
    [50, 50, 50],
    [100, 100, 100],
    [150, 150, 150],
    [255, 0, 0]
]

const colorMapNightVision = [
    [10, 0, 0],
    [50, 0, 0],
    [100, 0, 0],
    [150, 0, 0],
    [255, 0, 0]
]

const colorMapNightVisionPeaks = [
    [10, 0, 0],
    [50, 0, 0],
    [100, 0, 0],
    [150, 0, 0],
    [255, 255, 0]
]

const waterfallColorMaps = {
    "colorMapDefault": colorMapDefault,
    "colorMapDefaultPeaks": colorMapDefaultPeaks,
    "colorMapBW": colorMapBW,
    "colorMapBWRed": colorMapBWRed,
    "colorMapNightVision": colorMapNightVision,
    "colorMapNightVisionPeaks": colorMapNightVisionPeaks
}

sliderMin.addEventListener('input', function() {
    const sliderValueMin = sliderMin.value;
    minSliderDB.textContent = sliderValueMin;
});

sliderMax.addEventListener('input', function() {
    const sliderValueMax = sliderMax.value;
    maxSliderDB.textContent = sliderValueMax;
});

thresholdSlider.addEventListener('input', function() {
    const thresholdDB = thresholdSlider.value;
    thresholdValue.textContent = thresholdDB;
});

function lerp(start, end, t) {
    return start + (end - start) * t;
}

function dBToColor(dB) {
    // Assume dB is between -100 and 0 here

    const map = waterfallColorMaps[waterfallMap];

    const minDB = minSliderDB.textContent;
    const maxDB = maxSliderDB.textContent;

    var ratio = ((dB - minDB) / (maxDB - minDB));

    if (ratio < 0) {
        var ratio = 0;
    };

    if (ratio > 1) {
        var ratio = 1;
    };
    
    const maxIndex = map.length - 1;
    const scaledRatio = ratio * maxIndex;
    const i = Math.floor(scaledRatio);
    const t = scaledRatio - i;

    if (i < 0) return map[0];
    if (i >= maxIndex) return map[maxIndex];

    const startColor = map[i];
    const endColor = map[i + 1];

    const red = Math.round(lerp(startColor[0], endColor[0], t));
    const green = Math.round(lerp(startColor[1], endColor[1], t));
    const blue = Math.round(lerp(startColor[2], endColor[2], t));

    // var exponentRatio = (ratio ** 2);

    // const red = Math.floor(255 * (exponentRatio));
    // const green = Math.floor(200 * (ratio));
    // const blue = Math.floor(75 * (1 - exponentRatio));

    return [red, green, blue];
}

function activityColor(dB) {

    if (dB > thresholdValue.textContent) {
        const red = currentActivityBarColor[0];
        const green = currentActivityBarColor[1];
        const blue = currentActivityBarColor[2];
        return [red, green, blue, 255]
    } else {
        return [0, 0, 0, 200];
    }
}

function drawRow(dBValues) {

    const imgData = ctx.createImageData(canvas.width, 1);
    const activityData = activityCtx.createImageData(activityBar.width, 1);

    dBValues.forEach((dB, index) => {
        const color = dBToColor(dB);

        // Set the pixel color
        imgData.data[index * 4] = color[0];         // Red
        imgData.data[index * 4 + 1] = color[1];     // Green
        imgData.data[index * 4 + 2] = color[2];     // Blue
        imgData.data[index * 4 + 3] = 255;          // Alpha
    });

    dBValues.forEach((dB, index) => {
        const activeColor = activityColor(dB);

        activityData.data[index * 4] = activeColor[0];         // Red
        activityData.data[index * 4 + 1] = activeColor[1];     // Green
        activityData.data[index * 4 + 2] = activeColor[2];     // Blue
        activityData.data[index * 4 + 3] = activeColor[3];     // Alpha
    })

    activityCtx.putImageData(activityData, 0, 0);

    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 1, canvas.width, canvas.height)
    ctx.putImageData(imgData, 0, 0);
}




// Frequency and time logic

canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;    // relationship bitmap vs. element for X
    const scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for Y

    const x = (event.clientX - rect.left) * scaleX;  // scale mouse coordinates after they have
    const y = (event.clientY - rect.top) * scaleY;   // been adjusted to be relative to element

    const hoverFreq = parseInt(freqStart) + ((freqEnd - freqStart) * (x / canvas.width));
    actualHoverFreq = parseInt(hoverFreq.toFixed(6) * 1000000);

    infoBoxFreq.textContent = hoverFreq.toFixed(3);

    const timeRatio = refreshInterval / 1000;
    infoBoxTime.textContent = (y.toFixed(2) * timeRatio).toFixed(2);

});




// Zooming logic

let currentScale = 1;

container.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent default browser scroll

    // Determine the zoom direction
    const zoomFactor = 0.05;  // Smaller zoom steps
    const direction = event.deltaY < 0 ? 1 : -1;

    // Calculate minimum scale based on container and canvas widths
    const minWidthScale = container.offsetWidth / canvas.offsetWidth;

    // Update current scale
    currentScale *= (1 + direction * zoomFactor);

    // Prevent zoom out beyond container width
    if (currentScale < minWidthScale) {
        currentScale = minWidthScale;
    }

    // Adjust transform-origin to be top and center for vertical alignment
    
    // container.style.transformOrigin = `left top`

    canvas.style.transformOrigin = `left top`;
    activityBar.style.transformOrigin = `left top`;

    liveOverlay.forEach(function(div) {
        div.style.transformOrigin = `left top`;
    });

    updateCanvasTransform();
});




// Draggin like Google

let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;

container.addEventListener('mousedown', function(event) {
    isDragging = true;
    startX = event.clientX - translateX;
    startY = event.clientY - translateY;
});

container.addEventListener('mousemove', function(event) {
    if (isDragging) {
        translateX = event.clientX - startX;
        translateY = event.clientY - startY;

        // Update the canvas position
        updateCanvasTransform();
    }
});

container.addEventListener('mouseup', function(event) {
    isDragging = false;
});

container.addEventListener('mouseleave', function(event) {
    isDragging = false;
});

function updateCanvasTransform() {
    // Constrain the translation to the boundaries
    const maxTranslateX = Math.max(canvas.offsetWidth * currentScale - canvas.offsetWidth, 0);
    const maxTranslateY = 0; // Restrict to the top edge

    translateX = Math.min(Math.max(translateX, -maxTranslateX), 0);
    translateY = Math.min(Math.max(translateY, -maxTranslateY), 0);

    const yScale = 30;

    canvas.style.transform = `translate(${translateX}px, ${translateY}px) scale(${currentScale})`;
    activityBar.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${currentScale})`;

    liveOverlay.forEach(function(div) {
        div.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${currentScale})`;
    })

    // container.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${currentScale})`;
}




// Socket handling

socket.on('new_data', function(dataIn) {

    // set scan statue to true; just incase a scan is already going when webpage is loaded
    if (ongoingScan == false) {
        ongoingScan = true;
        buttonUpdate(startButton, "Stop Scan", ongoingScan);
    }

    const parsedData = dataIn.data;
    // Extract the dB values from the CSV data
    const dBValues = parsedData.map(Number);

    if (setLength) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const fullLength = dBValues.length;

        canvas.width = fullLength;
        canvas.height = 1000;

        // container.width = fullLength;

        activityBar.width = fullLength;
        activityBar.height = 1;

        setLength = false;
    }

    // Update the canvas with the new data

    newData = dBValues;
});

setInterval(() => {
    if (ongoingScan == true && newData != false && currentDevice == 'hackrf') {
        drawRow(newData);
    }
}, 200);

setInterval(() => {
    if (ongoingScan == true && newData != false && currentDevice == 'rtl-sdr') {
        drawRow(newData);
    }
}, 2000);

// updateCanvasTransform();