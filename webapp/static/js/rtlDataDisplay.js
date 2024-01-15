const socket = io.connect('http://' + window.location.host + '');

const startButton = document.getElementById("startStopScan");

const container = document.getElementById('canvasDivContainer');
const canvasDiv = document.getElementById('canvasDiv');
// const activityContainer = document.getElementById('activityContainer');
const activityBarContainer = document.getElementById('activityBarContainer');
const canvas = document.getElementById('waterfall');
const activityBar = document.getElementById('activityBar');

const activityCtx = activityBar.getContext('2d');
const ctx = canvas.getContext('2d');

const zoomedCanvas = document.getElementById('zoomedInCanvas');
const zoomedCtx = zoomedCanvas.getContext('2d');

const liveOverlayContainer = document.getElementById('live-overlay-container');

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
let selectedServerTcpFreq = 0;

let rtlTCPDeviceSettings = {};

const scanDeviceType = document.getElementById('deviceType');
let currentDevice = scanDeviceType.value;

const refreshIntervals = {
    'rtl-sdr': 2000,
    'hackrf': 100
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

let testSet = false;


// REDACTED Functionality

const olympusSystemNames = document.getElementById('olympusSysInfo');
const olympusDeviceNames = document.getElementById('olympusDevInfo');

// Color maps

const colorMapDefault = [
    [0, 0, 20],
    [0, 10, 30],
    [0, 20, 50],
    [0, 30, 80],
    [0, 50, 100],
    [0, 150, 150],
    [100, 200, 150],
    [255, 255, 0]
];

const colorMapDefaultPeaks = [
    [0, 0, 20],
    [0, 10, 30],
    [0, 20, 50],
    [0, 30, 80],
    [0, 50, 100],
    [0, 150, 150],
    [100, 200, 150],
    [255, 255, 0],
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




// DATABASE DTO

class DeviceDTO {
    constructor(id, deviceId, name, callsign, classOfStation, mode, transmitPower, modulationType, band, frequencyStart, frequencyStop, locationName, otherDeviceInfo, systemId) {
        
        var freqStart = frequencyStart;
        var freqStop = frequencyStop;

        if (typeof frequencyStart === 'object' && frequencyStart !== null) {
            // console.log("@freq")
            var freqStart = frequencyStart.low;
            var freqStop = frequencyStart.high;
        }
        this.id = {
            value: id,
            htmlid: "db-device-id",
            htmlname: "Database ID",
            python: "id"
        };
        this.deviceId = {
            value: deviceId,
            htmlid: "add-device-id",
            htmlname: "Device ID",
            python: "device_id"
        }
        this.name = {
            value: name,
            htmlid: "add-device-name",
            htmlname: "Device Name",
            python: "name"
        };
        this.callsign = {
            value: callsign,
            htmlid: "add-device-callsign",
            htmlname: "Callsign",
            python: "callsign"
        };
        this.classOfStation = {
            value: classOfStation,
            htmlid: "add-device-station-class",
            htmlname: "Station Class",
            python: "class_of_station"
        };
        this.mode = {
            value: mode,
            htmlid: "add-device-mode",
            htmlname: "Mode",
            python: "mode"
        };
        this.transmitPower = {
            value: transmitPower,
            htmlid: "add-device-tx-power",
            htmlname: "Transmit Power",
            python: "transmit_power"
        };
        this.modulationType = {
            value: modulationType,
            htmlid: "add-device-modulation",
            htmlname: "Modulation Type",
            python: "modulation_type"
        };
        this.band = {
            value: band,
            htmlid: "add-device-band",
            htmlname: "Band",
            python: "band"
        };
        this.frequencyStart = {
            value: freqStart,
            htmlid: "add-device-freq-start",
            htmlname: "Start Frequency",
            python: "frequency_start"
        };
        this.frequencyStop = {
            value: freqStop,
            htmlid: "add-device-freq-stop",
            htmlname: "Stop Frequency",
            python: "frequency_stop"
        };
        this.locationName = {
            value: locationName,
            htmlid: "add-device-location-name",
            htmlname: "Location Name",
            python: "location_name"
        };
        this.otherDeviceInfo = {
            value: otherDeviceInfo,
            htmlid: "add-device-other-info",
            htmlname: "Other Information",
            python: "other_device_info"
        };
        this.systemId = {
            value: systemId,
            htmlid: "add-device-system-id",
            htmlname: "System Database ID (Leave blank to autofill)",
            python: "system_id"
        };
    }
}

class SystemDTO { 
    constructor(id, systemId, name, email, postalCode, industry, licenseType, licenseSubtype, licenseStatus, licenseNumber, licenseDateOfEffect, licenseDateOfExpiry, otherInfo, devices) {
        this.id = {
            value: id,
            htmlid: "db-system-id",
            htmlname: "Database ID",
            python: "id"
        };
        this.systemId = {
            value: systemId,
            htmlid: "add-system-id",
            htmlname: "System ID",
            python: "system_id"
        }
        this.name = {
            value: name,
            htmlid: "add-system-name",
            htmlname: "System Name",
            python: "name"
        };
        this.email = {
            value: email,
            htmlid: "add-system-email",
            htmlname: "Email",
            python: "email"
        };
        this.postalCode = {
            value: postalCode,
            htmlid: "add-system-postal-code",
            htmlname: "Postal Code",
            python: "postal_code"
        };
        this.industry = {
            value: industry,
            htmlid: "add-system-industry",
            htmlname: "Industry",
            python: "industry"
        };
        this.licenseType = {
            value: licenseType,
            htmlid: "add-system-license-type",
            htmlname: "License Type",
            python: "license_type"
        };
        this.licenseSubtype = {
            value: licenseSubtype,
            htmlid: "add-system-license-subtype",
            htmlname: "License Subtype",
            python: "license_subtype"
        };
        this.licenseStatus = {
            value: licenseStatus,
            htmlid: "add-system-license-status",
            htmlname: "License Status",
            python: "license_status"
        };
        this.licenseNumber = {
            value: licenseNumber,
            htmlid: "add-system-license-number",
            htmlname: "License Number",
            python: "license_number"
        };
        this.licenseDateOfEffect = {
            value: licenseDateOfEffect,
            htmlid: "add-system-license-date-of-effect",
            htmlname: "License Date of Effect",
            python: "license_date_of_effect"
        };
        this.licenseDateOfExpiry = {
            value: licenseDateOfExpiry,
            htmlid: "add-system-license-date-of-expiry",
            htmlname: "License Date of Expiry",
            python: "license_date_of_expiry"
        };
        this.otherInfo = {
            value: otherInfo,
            htmlid: "add-system-other-info",
            htmlname: "Other Information",
            python: "other_info"
        };

        this.devices = devices; // devices.map(device => new DeviceDTO(...Object.values(device)));
        // Assuming devices are handled separately
    }
}




// Create rtl-tcp devices

document.addEventListener('DOMContentLoaded', () => {

    refreshDatabase();
    systemView();
    
    if (testSet){
        const testScanImg = document.getElementById('testIMG');
        testScanImg.onload = function() {
            let freqStart = 400;
            let freqEnd = 1000;
            console.log("DRAWING");
            canvas.width = testScanImg.width;
            canvas.height = testScanImg.height;
            ctx.drawImage(testScanImg, 0, 0, canvas.width, canvas.height);
        }
    }

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

document.querySelectorAll(".close-btn").forEach(button => {
    button.addEventListener('click', function(event) {
        document.getElementById("settingsPopup").style.display = "none";
        document.getElementById("olympusPopup").style.display = "none";
    })
})

// Close the popup if user clicks outside of it
window.onclick = function(event) {
    let settingsPopup = document.getElementById("settingsPopup");
    let olympusPopup = document.getElementById("olympusPopup");
    if (event.target == olympusPopup || event.target == settingsPopup) {
        settingsPopup.style.display = "none";
        olympusPopup.style.display = "none";
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




// Olympus popup

document.getElementById("olympusBtn").onclick = function() {
    document.getElementById("olympusPopup").style.display = "block";
};

document.getElementById('olympus-api-submit-btn').onclick = function() {
    const apiKey = document.getElementById('api-key').value;
    const location = document.getElementById('location-latlong').value;

    sendData = {
        apiKey: apiKey,
        location: location
    }

    fetch("configure_api", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(sendData)
    })
}




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

// {
//   "data": {
//     "systems": {
//       "edges": [
//         {
//           "node": {
//             "id": "WPXA403-2488131-1_851365000_851385000_0",
//             "licensee": {
//               "name": "State of Colorado",
//               "email": "OITCommservices@state.co.us",
//               "postalCode": "80203"
//             },
//             "devices": [
//               {
//                 "id": "WPXA403-2488131-1_851365000_851385000_0_0",
//                 "mode": "F_T",
//                 "transmitPower": 100,
//                 "modulationType": null,
//                 "band": "800 MHz (806-896 MHz)",
//                 "frequency": 851375000,
//                 "location": {
//                   "name": "ATOP STORM KING MOUNTAIN 17.3 MI SE, MONTROSE, MONTROSE, CO",
//                   "geom": {
//                     "string": "POINT(-107.638944 38.338056)"
//                   }
//                 }
//               }
//             ]
//           }
//         }

function ctrlClickHandler(event) {

    changeRtlFreq = {
        serverID: currentInstanceFreq,
        frequency: actualHoverFreq
    }

    const liveWindow = document.getElementById('liveOverlay' + currentInstanceFreq);
    console.log(currentInstanceFreq);

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
                // console.log(data);

                // Set lvie freq window
                const totalFreq = freqEnd - freqStart;
                const rtlWidth = (2.4 / totalFreq * 100);
                const hackrfWidth = (20 / totalFreq * 100);

                const color = document.getElementById('rtlTCPSettingsColor' + currentInstanceFreq).value;

                const viewWindowLocation  = ( ( (selectedServerTcpFreq.textContent - 1.2) - freqStart ) / totalFreq * 100);
                liveWindow.style.left = `${viewWindowLocation}%`
                liveWindow.style.width = `${rtlWidth}%`
                liveWindow.style.height = `100vh`
                liveWindow.style.border = `1px solid ${color}`
                liveWindow.style.borderTop = `4px solid ${color}`
                // liveWindow.style.border = `1px solid ${color}`
                console.log(canvasDiv.getBoundingClientRect().height);
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }
}

canvas.addEventListener('click', ctrlClickHandler);




// Drawing logic

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

let canvasMousePositionX = 0;
let canvasMousePositionY = 0;

canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    canvasMousePositionX = x;
    canvasMousePositionY = y;

    const hoverFreq = parseInt(freqStart) + ((freqEnd - freqStart) * (x / canvas.width));
    actualHoverFreq = parseInt(hoverFreq.toFixed(6) * 1000000);

    infoBoxFreq.textContent = hoverFreq.toFixed(3);

    const timeRatio = refreshInterval / 1000;
    infoBoxTime.textContent = (y.toFixed(2) * timeRatio).toFixed(2);

});




// Zooming logic

let isPanning = false;
let startX, startY;
let startTranslateX, startTranslateY;
let translateX = 0, translateY = 0;

canvas.addEventListener('mousedown', (e) => {
    isPanning = true;
    startX = e.clientX - container.offsetLeft;
    startY = e.clientY - container.offsetTop;

    startTranslateX = event.clientX - translateX;
    startTranslateY = event.clientY - translateY;
    canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    const x = e.clientX - container.offsetLeft;
    const y = e.clientY - container.offsetTop;

    translateX = event.clientX - startTranslateX;
    translateY = event.clientY - startTranslateY;

    container.scrollLeft -= (x - startX);
    container.scrollTop -= (y - startY);
    // activityContainer.scrollLeft -= (x - startX);

    // updateCanvasTransform();

    startX = x;
    startY = y;
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
    canvas.style.cursor = 'default';
});

let currentScale = 1;

container.addEventListener('wheel', function(event) {
    event.preventDefault();  // Prevent default browser scroll

    // Determine the zoom direction
    const zoomFactor = 0.05;  // Smaller zoom steps
    const direction = event.deltaY < 0 ? 1 : -1;

    // Calculate minimum scale based on container and canvas widths
    const minWidthScale = container.offsetWidth / canvas.offsetWidth;

    // Update current scale
    currentScale = (1 + direction * zoomFactor);

    // Prevent zoom out beyond container width
    if (currentScale < minWidthScale) {
        currentScale = minWidthScale;
    }
    
    const scaledWidth = canvas.offsetWidth * currentScale;
    const scaledHeight = canvas.offsetHeight * currentScale;

    // console.log(scaledWidth);
    // console.log(scaledHeight);
    // canvas.style.width = `${scaledWidth}px`;
    // canvas.style.height = `${scaledHeight}px`;

    canvasDiv.style.width = `${scaledWidth}px`;
    canvas.style.height = `${scaledHeight}px`;

    // liveOverlay.forEach(function(div) {
    //     div.style.width = `${scaledWidth}px`;
    // })

    // Adjust scroll position
    if (currentScale != minWidthScale) {
        adjustScrollPosition();
    }
});

function adjustScrollPosition() {
    return;
}





// Bottom toolbar

const toolbarContainer = document.querySelector('.toolbar-items');
const toolbarContainerDivs = toolbarContainer.querySelectorAll('.toolbar-item');

const sigintViewButton = document.getElementById('view-sigint-button');
const viewSysButton = document.getElementById('view-systems-button');
const editSysButton = document.getElementById('edit-systems-button');
const getSysButton = document.getElementById('get-systems-button');

const editSelectedSysButton = document.getElementById('edit-selected-system');
const writeSelectedSysButton = document.getElementById('write-selected-system');
const addNewSysButton = document.getElementById('add-new-system');
const deleteSelectedSy = document.getElementById('delete-delected-system');

const sysContainer = document.getElementById('systems-container');
const addSysContainer = document.getElementById('add-system-container');
const olympusSysContainer = document.getElementById('olympus-sys-container');
const sigintContainer = document.getElementById('sigint-container');

const getFromDbButton = document.getElementById('edit-selected-system');
const pushToDbButton= document.getElementById('write-selected-system');
const addToDbButton = document.getElementById('add-new-system');
const removeFromDbButton = document.getElementById('delete-selected-system');

const olympusGetSystemsInScanButton = document.getElementById('get-systems-in-scan');
const olympusGetSystemsInRangeButton = document.getElementById('get-systems-in-range');
const olympusAddSystemToDbButton = document.getElementById('olympus-add-system-to-db');
const olympusAddSystemsToDbButton = document.getElementById('olympus-add-all-systems-to-db');

const sysInfoTextBox = document.getElementById('sysInfo');
const devInfoTextBox = document.getElementById('devInfo');

const systemInfoInputContainer = document.getElementById('add-system-info-container');
const deviceInfoInputContainer = document.getElementById('add-device-info-container');

let allLoadedSystems = [];
let olympusAllLoadedSystems = [];

let currentSelectedSystem = false;
let currentSelectedDevice = false;

function resetSystemInputFields() {
    const sysDTO = new SystemDTO;
    while (systemInfoInputContainer.firstChild) {
        systemInfoInputContainer.removeChild(systemInfoInputContainer.firstChild);
    }

    Object.keys(sysDTO).forEach(key => {
        if (key !== 'devices' && key !== 'id') {
            const newInput = document.createElement('input');
            newInput.id = sysDTO[key].htmlid;
            newInput.placeholder = sysDTO[key].htmlname;

            systemInfoInputContainer.appendChild(newInput);
        }
        if (key == 'id') {
            const newDiv = document.createElement('div');
            newDiv.id = sysDTO[key].htmlid;
            newDiv.classList.add('db-id-div')

            systemInfoInputContainer.appendChild(newDiv);
        }
    })
}

function resetDeviceInputFields() {
    const devDTO = new DeviceDTO;
    while (deviceInfoInputContainer.firstChild) {
        deviceInfoInputContainer.removeChild(deviceInfoInputContainer.firstChild);
    }

    Object.keys(devDTO).forEach(key => {
        if (key !== 'id') {
            const newInput = document.createElement('input');
            newInput.id = devDTO[key].htmlid;
            newInput.placeholder = devDTO[key].htmlname;

            deviceInfoInputContainer.appendChild(newInput);
        }
        if (key == 'id') {
            const newDiv = document.createElement('div');
            newDiv.id = devDTO[key].htmlid;
            newDiv.classList.add('db-id-div')

            deviceInfoInputContainer.appendChild(newDiv);
        }
    })
}

function createDatabaseInputFields() {
    resetSystemInputFields();
    resetDeviceInputFields();    
}

sigintViewButton.addEventListener('click', function(event) {
    sigintView();
})

viewSysButton.addEventListener('click', function(event) {
    systemView();
    // returnDbSchema();
})

editSysButton.addEventListener('click', function(event) {
    addSystemView();
    createDatabaseInputFields();
})

getSysButton.addEventListener('click', function(event) {
    getSysView();
})

function sigintView() {
    toolbarContainerDivs.forEach(d => {
        d.style.display = 'none';
    })
    sysContainer.style.display = 'flex';
    sigintContainer.style.display = 'flex'
}

function systemView() {
    toolbarContainerDivs.forEach(d => {
        d.style.display = 'none';
    })
    sysContainer.style.display = 'flex';
}

function addSystemView() {
    toolbarContainerDivs.forEach(d => {
        d.style.display = 'none';
    })
    sysContainer.style.display = 'flex';
    addSysContainer.style.display = 'flex';
}

function getSysView() {
    toolbarContainerDivs.forEach(d => {
        d.style.display = 'none';
    })
    olympusSysContainer.style.display = 'flex';
}

getFromDbButton.addEventListener('click', function(event) {
    let currentSys = "";
    let currentDev = "";

    if (currentSelectedSystem) {
        currentSys = allLoadedSystems.find(sys => sys.id.value == currentSelectedSystem);
        Object.keys(currentSys).forEach(key => {
            if (key !== 'devices' && key !== 'id') {
                document.getElementById(currentSys[key].htmlid).value = currentSys[key].value;
            }
            if (key == 'id') {
                document.getElementById(currentSys[key].htmlid).textContent = currentSys[key].value;
            }
        })

        if (currentSelectedDevice) {
            currentDev = currentSys.devices.find(dev => dev.id.value == currentSelectedDevice);
            if (currentDev) {
                Object.keys(currentDev).forEach(key => {
                    if (key !== 'devices' && key !== 'id') {
                        document.getElementById(currentDev[key].htmlid).value = currentDev[key].value;
                    }
                    if (key == 'id') {
                        document.getElementById(currentDev[key].htmlid).textContent = currentDev[key].value;
                    }
                })
            } else {
                resetDeviceInputFields();
            }
        }
    }
})

pushToDbButton.addEventListener('click', function(event) {
    const newSysDTO = createDTOFromInputs(SystemDTO);
    const newDevDTO = createDTOFromInputs(DeviceDTO);

    newSysDTO.devices = [newDevDTO]

    const pushDB = [newSysDTO]
    console.log(pushDB);

    pushToPatabase(pushDB, 'update');
    createDatabaseInputFields();
})

addToDbButton.addEventListener('click', function(event) {
    createDatabaseInputFields();
    refreshDatabase();
})

removeFromDbButton.addEventListener('click', function(event) {
    const newSysDTO = createDTOFromInputs(SystemDTO);
    const newDevDTO = createDTOFromInputs(DeviceDTO);

    newSysDTO.devices = newDevDTO
    deleteFromDatabase(newSysDTO)
    // refreshes the db input fields
    createDatabaseInputFields();

    console.log(newSysDTO, newDevDTO);
    
})

olympusGetSystemsInScanButton.addEventListener('click', function(event) {
    olympusGetSystemsCall(freqStart, freqEnd);
})

olympusGetSystemsInRangeButton.addEventListener('click', function(event) {
    selectedFreq = getSelectedFreq();
    if (selectedFreq) {
        lowFreq = selectedFreq[0];
        highFreq = selectedFreq[1];
        olympusGetSystemsCall(lowFreq, highFreq);
    }
})

olympusAddSystemToDbButton.addEventListener('click', function(event) {

})

olympusAddSystemsToDbButton.addEventListener('click', function(event) {
    console.log(olympusAllLoadedSystems);
    pushToPatabase(olympusAllLoadedSystems, 'add');
})

function getSelectedFreq() {
    let lowFreq = null;
    let highFreq = null;

    selectedFreq = selectedServerTcpFreq.textContent;
    if (selectedFreq) {
        lowFreq = parseInt(selectedFreq) - 1.2;
        highFreq = parseInt(selectedFreq) + 1.2;
    }

    return [lowFreq, highFreq]
}

function createDTOFromInputs(dto) {
    const newDto = new dto;
    dtoInputs = [];

    Object.keys(newDto).forEach(key => {
        if (key !== 'devices' && key !== 'id') {
            const item = document.getElementById(newDto[key].htmlid).value;
            dtoInputs.push(item);
        }
        if (key == 'id') {
            const item = document.getElementById(newDto[key].htmlid).textContent;
            dtoInputs.push(item);
        }
        if (key == 'devices') {
            dtoInputs.push();
        }
    })

    return new dto(...dtoInputs);
}

function olympusGetSystemsCall(startFreq, stopFreq) {

    message = {
        startFrequency: startFreq,
        stopFrequency: stopFreq
    }

    fetch("olympus_getsystem", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
    })
    .then(response => response.json())
    .then(data => {
        if (data.apiResponse.results.length > 0) {
            const apiResponse = data.apiResponse.results
            // const node = apiResponse[0].node;
            // const devices = node.devices

            const systems = [];

            apiResponse.forEach(system => {
                systemNode = system.node;
                // let licensee = systemNode.licensee;

                // if (!systemNode.license) {
                //     let license = '';
                // }

                // console.log(systemNode.devices);

                // systemName = `${systemNode.licensee.name}\n [${systemNode.id}]`

                newSystem = new SystemDTO(
                    '',
                    systemNode.id,
                    systemNode.licensee.name,
                    systemNode.licensee.email,
                    systemNode.licensee.postalCode,
                    systemNode.licensee.industry,
                    systemNode.licence.type,
                    systemNode.licence.subtype,
                    systemNode.licence.status,
                    systemNode.licence.number,
                    systemNode.licence.dateOfEffect,
                    systemNode.licence.dateOfExpiry,
                    '',
                    systemNode.devices.map(deviceData => new DeviceDTO(
                        '',
                        deviceData.id,
                        deviceData.callsign,
                        deviceData.callsign,
                        deviceData.classOfStation,
                        deviceData.mode,
                        deviceData.transmitPower,
                        deviceData.modulationType,
                        deviceData.band,
                        deviceData.frequency,
                        '',
                        deviceData.location.name,
                        deviceData.location,
                        '' //systemNode.id
                    ))
                );
                systems.push(newSystem);
            })

            olympusAllLoadedSystems = systems;
            createSystemEntries(olympusAllLoadedSystems, olympusSystemNames, olympusDeviceNames)
            // console.log(node.licensee);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    }); 
}

function loadSystemDevices(systemDiv, deviceDiv, systems) {

    while (deviceDiv.firstChild) {
        deviceDiv.removeChild(deviceDiv.firstChild);
    }

    // console.log(systems);

    const devices = systems.devices; //.find(dev => dev.id.value == [systemDiv.id]);

    devices.forEach(device => {
        const parentDiv = document.createElement('div');
        const parentSpan = document.createElement('span');
        const childDiv = document.createElement('div');

        childDiv.style.display = 'none';
        parentDiv.id = device.id.value;
        parentSpan.textContent = device.name.value;

        Object.keys(device).forEach(key => {
            if (key !== 'name') {
                const childSpan = document.createElement('span');
                const descriptorSpan = document.createElement('span');

                descriptorSpan.style.fontWeight = `bold`

                if (device[key].value) {
                    descriptorSpan.textContent = `${device[key].htmlname}::`
                    childSpan.textContent = device[key].value;

                    childDiv.appendChild(descriptorSpan);
                    childDiv.appendChild(document.createElement('br'));
                    childDiv.appendChild(childSpan);
                    childDiv.appendChild(document.createElement('br'));
                    childDiv.appendChild(document.createElement('br'));
                }
            }
        })

        parentDiv.addEventListener('click', function(event) {
            divClickFunctionality(this, childDiv);
            console.log(this.id);
            currentSelectedDevice = this.id;
        })

        parentDiv.appendChild(parentSpan);
        parentDiv.appendChild(childDiv);

        parentDiv.classList.add('parent-container-item');
        childDiv.classList.add('child-container-item');

        deviceDiv.appendChild(parentDiv);

    })
}

function createSystemEntries(systems, desiredDiv, desiredDeviceDiv) {
    

    while (desiredDiv.firstChild) {
        desiredDiv.removeChild(desiredDiv.firstChild);
    }

    console.log(systems);

    systems.forEach(item => {

        const parentDiv = document.createElement('div');
        const parentSpan = document.createElement('span');
        const childDiv = document.createElement('div');
        const parentIDSpan = document.createElement('span');

        childDiv.style.display = 'none';
        parentDiv.id = item.id.value;
        parentSpan.textContent = item.name.value;

        parentIDSpan.textContent = `${item.systemId.value.slice(-20)}`

        parentIDSpan.style.fontSize = `10px`;
        parentIDSpan.style.fontWeight = `normal`;
        parentIDSpan.style.color = `#888`

        Object.keys(item).forEach(key => {
            if (key !== 'name' && key !== 'devices') {
                const childSpan = document.createElement('span');
                const descriptorSpan = document.createElement('span');

                descriptorSpan.style.fontWeight = `bold`

                if (item[key].value) {
                    descriptorSpan.textContent = `${item[key].htmlname}::`
                    childSpan.textContent = item[key].value;

                    childDiv.appendChild(descriptorSpan);
                    childDiv.appendChild(document.createElement('br'));
                    childDiv.appendChild(childSpan);
                    childDiv.appendChild(document.createElement('br'));
                    childDiv.appendChild(document.createElement('br'));
                }
            }
        })

        // console.log(systems, item)
        
        parentDiv.addEventListener('click', function(event) {
            divClickFunctionality(this, childDiv);
            loadSystemDevices(this, desiredDeviceDiv, item);
            currentSelectedSystem = this.id;
        })

        parentDiv.appendChild(parentSpan);
        parentDiv.appendChild(document.createElement('br'));
        parentDiv.appendChild(parentIDSpan)
        parentDiv.appendChild(childDiv);

        parentDiv.classList.add('parent-container-item');
        childDiv.classList.add('child-container-item');

        desiredDiv.appendChild(parentDiv);
    })
}

function divClickFunctionality(div, childDiv) {
    if (childDiv.style.display == 'none' && div.style.border !== '1px solid orange') {
            div.style.border = '1px solid orange';
            childDiv.style.display = 'none';
        } else if (childDiv.style.display == 'block' && div.style.border == '1px solid orange') {
            childDiv.style.display = 'none';
        } else {
            childDiv.style.display = 'block';
        }
        
        for (const child of div.parentNode.children) {
            child.style.border = '1px solid #111';
        }
        
        div.style.border = '1px solid orange';
}


function refreshDatabase() {
    fetch("get_systems", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => {

        // Replace with custom DTO
        const systems = data.map(systemData => new SystemDTO(
            systemData.id,
            systemData.system_id,
            systemData.name,
            systemData.email,
            systemData.postal_code,
            systemData.industry,
            systemData.license_type,
            systemData.license_subtype,
            systemData.license_status,
            systemData.license_number,
            systemData.license_date_of_effect,
            systemData.license_date_of_expiry,
            systemData.other_info,
            systemData.devices.map(deviceData => new DeviceDTO(
                deviceData.id,
                deviceData.device_id,
                deviceData.name,
                deviceData.callsign,
                deviceData.class_of_station,
                deviceData.mode,
                deviceData.transmit_power,
                deviceData.modulation_type,
                deviceData.band,
                deviceData.frequency_start,
                deviceData.frequency_stop,
                deviceData.location_name,
                deviceData.other_device_info,
                deviceData.system_id
            ))
        ));

        allLoadedSystems = systems;
        createSystemEntries(allLoadedSystems, sysInfoTextBox, devInfoTextBox)
        console.log(systems)
    })
    .catch(error => {
        console.error('Error in refreshDatabase(): ', error);
    });
}

function getFromDatabase() {

}

function pushToPatabase(newInfo, pushType) {

    databaseContent = {
        postData: newInfo,
        type: pushType
    }

    fetch("add_system", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(databaseContent)
    })
    .then(response => response.json())
    .then(data => {
        console.log(databaseContent);
        refreshDatabase();
    })
    .catch(error => {
        console.error('Error in refreshDatabase(): ', error);
    })

}

function deleteFromDatabase(systemInfo) {
    databaseContent = {
        postData: systemInfo
    }

    fetch("remove_system", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(databaseContent)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data)
        refreshDatabase();
    })
    .catch(error => {
        console.error('Error in refreshDatabase(): ', error);
    })

}

function queryOlympusSystems() {

}

function queryOlympusSignals() {

}

function pushScanToOlympus() {

}

// MOVE

const sigidReferenceDiv = document.getElementById('sigid-info-container');
const sigidSignalDiv = document.getElementById('signal-info-container');
let currentSelectedSignal = null;

let sigidSignalData = null;

document.getElementById('get-sigid-from-range-btn').onclick = function() {
    selectedFreq = getSelectedFreq();
    if (selectedFreq) {
        lowFreq = selectedFreq[0];
        highFreq = selectedFreq[1];

        getSigidData(lowFreq, highFreq);
    }
}

function loadSignalInfo(parentDiv, signalDiv, signal) {
    while (signalDiv.firstChild) {
        signalDiv.removeChild(signalDiv.firstChild);
    }

    const signalImage = document.createElement('img');
    const containerDiv = document.createElement('div');
    const imageContainerDiv = document.createElement('div');
    const childDiv = document.createElement('div');

    signalImage.referrerPolicy = 'no-referrer';
    signalImage.style.width = `90%`;
    signalImage.src = signal.spectrumImage;

    Object.keys(signal).forEach(key => {
        const childSpan = document.createElement('span');
        const descriptorSpan = document.createElement('span');

        descriptorSpan.style.fontWeight = `bold`;
        childSpan.style.fontWeight = `normal`;

        descriptorSpan.textContent = `${key}::`
        childSpan.textContent = signal[key];

        childDiv.appendChild(descriptorSpan);
        childDiv.appendChild(document.createElement('br'));
        childDiv.appendChild(childSpan);
        childDiv.appendChild(document.createElement('br'));
        childDiv.appendChild(document.createElement('br'));
    })

    imageContainerDiv.appendChild(signalImage);
    imageContainerDiv.classList.add('signal-image-container')

    containerDiv.appendChild(imageContainerDiv);
    containerDiv.appendChild(childDiv);
    containerDiv.classList.add('parent-container-item');

    signalDiv.appendChild(containerDiv);
}

function createSignalEntries(signals, desiredDiv, signalDiv) {
    while (desiredDiv.firstChild) {
        desiredDiv.removeChild(desiredDiv.firstChild);
    }

    console.log(signals);

    signals.forEach(item => {

        const parentDiv = document.createElement('div');
        const parentSpan = document.createElement('span');

        parentDiv.id = item.title;
        parentSpan.textContent = item.title;

        // console.log(systems, item)
        
        parentDiv.addEventListener('click', function(event) {
            divClickFunctionality(this, signalDiv);
            loadSignalInfo(this, signalDiv, item);
            currentSelectedSignal = this.id;
        })

        parentDiv.appendChild(parentSpan);
        parentDiv.classList.add('parent-container-item');

        desiredDiv.appendChild(parentDiv);
    })
}

function getSigidData(lowFreq, highFreq) {

    request = {
        lowFrequency: lowFreq,
        highFrequency: highFreq
    }

    fetch("get_sigid", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.response) {
            response = data.response.results;
            if (response.length > 0) {
                sigidSignalData = response;
                console.log(sigidSignalData);
                
                createSignalEntries(sigidSignalData, sigidReferenceDiv, sigidSignalDiv);
            }
        }
    })
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
        canvas.height = 2000;

        let currentYScale = canvas.height / window.getComputedStyle(canvas).getPropertyValue('height');

        // container.width = fullLength;

        activityBar.width = fullLength;
        activityBar.height = 1;

        setLength = false;
    }

    // Update the canvas with the new data

    newData = dBValues;
    // drawRow(dBValues)
});

setInterval(() => {
    if (ongoingScan == true && newData != false && currentDevice == 'hackrf') {
        drawRow(newData);
    }
}, refreshIntervals['hackrf']);

setInterval(() => {
    if (ongoingScan == true && newData != false && currentDevice == 'rtl-sdr') {
        drawRow(newData);
    }
}, refreshIntervals['rtl-sdr']);

// updateCanvasTransform();