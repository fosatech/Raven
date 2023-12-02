const socket = io.connect(window.location.protocol + '//' + window.location.hostname + ':5000');

const startButton = document.getElementById("startStopScan");

const container = document.getElementById('canvasContainer');
const canvas = document.getElementById('waterfall');
const activityBar = document.getElementById('activityBar');

const activityCtx = activityBar.getContext('2d');
const ctx = canvas.getContext('2d');

const liveWindowContainer = document.getElementById('liveOverlayContainer');
const liveWindow = document.getElementById('liveOverlay');

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

const startTCPButton = document.getElementById('startRTLTCP');

let rtlClientIP = document.getElementById('rtlTCPIP').value;
let rtlClientPort = document.getElementById('rtlTCPPort').value;

const currentTCPFreq = document.getElementById('currentTCPFreq');

let activeTCPServer = false;
let ongoingScan = false;

let actualHoverFreq = 0;

minSliderDB.textContent = sliderMin.value;
maxSliderDB.textContent = sliderMax.value;
thresholdValue.textContent = thresholdSlider.value;



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
        freqStart: freqStart,
        freqEnd: freqEnd,
        gain: gain,
        fftBin: fftBin
    };

    // Send data to the backend
    if (ongoingScan) {
        stopScan(rtlSettings);
    } else {
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

startTCPButton.addEventListener("click", function() {

    rtlClientIP = document.getElementById('rtlTCPIP').value;
    rtlClientPort = document.getElementById('rtlTCPPort').value;

    const tcpSettings = {
        activeTCPServer: activeTCPServer,
        rtlClientIP: rtlClientIP,
        rtlClientPort: rtlClientPort
    };

    // Send data to the backend
    if (activeTCPServer) {
        stopTCPServer(tcpSettings);
    } else {
        startTCPServer(tcpSettings);
    }
})

function startTCPServer(tcpSettings) {

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

        activeTCPServer = true;
        buttonUpdate(startTCPButton, "Stop Server", activeTCPServer);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function stopTCPServer(tcpSettings) {

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

        activeTCPServer = false;
        buttonUpdate(startTCPButton, "Start Server", activeTCPServer);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}



// rtl_tcp frequency picker

function ctrlClickHandler(event) {

    if (event.ctrlKey || event.metaKey) {
        if (event.button === 0) {

            currentTCPFreq.textContent = infoBoxFreq.textContent
            fetch("rtl_tcp_frequency", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ currentTCPFreq: actualHoverFreq })
            })
            .then(response => response.json())
            .then(data => {
                // Handle data
                console.log(data);

                const totalFreq = freqEnd - freqStart;

                const rtlWidth = (2.4 / totalFreq * 100);

                const viewWindowLocation  = ( ( (currentTCPFreq.textContent - 1.2) - freqStart ) / totalFreq * 100);
                console.log(viewWindowLocation);
                liveWindow.style.left = `${viewWindowLocation}%`
                liveWindow.style.width = `${rtlWidth}%`
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }
}

canvas.addEventListener('click', ctrlClickHandler);



// Drawing logic

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

function dBToColor(dB) {
    // Assume dB is between -100 and 0 here

    const minDB = minSliderDB.textContent;
    const maxDB = maxSliderDB.textContent;

    const ratio = ((dB - minDB) / (maxDB - minDB));

    const red = Math.floor(255 * (ratio ** 2));
    const green = Math.floor(200 * (ratio));
    const blue = Math.floor(75 * (1 - ratio ** 2));

    return [red, green, blue];
}

function activityColor(dB) {

    if (dB > thresholdValue.textContent) {
        const red = 255;
        const green = 255;
        const blue = 0;
        return [red, green, blue, 255]
    } else {
        return [0, 0, 0, 200];
    }
}

function drawRow(dBValues) {

    const imgData = ctx.createImageData(canvas.width, 1);
    const activityData = activityCtx.createImageData(activityBar.width, 1);

    // const tempCanvas = document.createElement('canvas');
    // const tempCtx = tempCanvas.getContext('2d');


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
        activityData.data[index * 4 + 3] = activeColor[3];          // Alpha
    })

    // tempCtx.putImageData(activityData, 0, 0);

    activityCtx.putImageData(activityData, 0, 0);

    ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 1, canvas.width, canvas.height)
    ctx.putImageData(imgData, 0, 0);

    // Draw the new row at the top

    // Shift the existing image data one row down
    // const existingData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // ctx.putImageData(existingData, 0, 1);
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

    // FIX hardcoded time ratio
    infoBoxTime.textContent = y.toFixed(2) * 2;

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

    liveWindowContainer.style.transformOrigin = `left top`;

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
    liveWindowContainer.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${currentScale})`;

    // container.style.transform = `translate(${translateX}px, ${translateY}px) scaleX(${currentScale})`;
}



// Socket handling

let setLength = true;
let newData = false;

socket.on('new_data', function(data) {

    // set scan statue to true; just incase a scan is already going when webpage is loaded
    if (ongoingScan == false) {
        ongoingScan = true;
        buttonUpdate(startButton, "Stop Scan", ongoingScan);
    }

    const parsedData = data.data;
    // Extract the dB values from the CSV data
    const dBValues = parsedData.map(Number);

    if (setLength) {
        const fullLength = dBValues.length;

        canvas.width = fullLength;
        canvas.height = 1000;

        activityBar.width = fullLength;
        activityBar.height = 1;

        setLength = false;
    }

    // Update the canvas with the new data

    newData = dBValues;

    // drawRow(dBValues);
});

setInterval(() => {
    if (ongoingScan == true && newData != false) {
        drawRow(newData);
    }
}, 2000);

// updateCanvasTransform();