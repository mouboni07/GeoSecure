// MAP INITIALIZATION

const map = L.map("map").setView([22.5, 78.9], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

let points = [];
let markers = [];
let polygon = null;
let receivedFile = null;
let locationVerified = false;


// ADD BOUNDARY POINTS

map.on("click", function(e) {
    points.push([e.latlng.lat, e.latlng.lng]);

    const marker = L.marker(e.latlng).addTo(map);
    markers.push(marker);

    if (polygon) {
        map.removeLayer(polygon);
    }

    if (points.length >= 3) {
        polygon = L.polygon(points, {
            color: "blue",
            fillOpacity: 0.2
        }).addTo(map);
    }

    document.getElementById("pointCount").innerText =
        "Boundary points: " + points.length;
});


// CLEAR BOUNDARY

function clearBoundary() {
    markers.forEach(marker => map.removeLayer(marker));

    if (polygon) {
        map.removeLayer(polygon);
    }

    points = [];
    markers = [];
    polygon = null;

    document.getElementById("pointCount").innerText =
        "Boundary points: 0";
}


// SEARCH ADDRESS

async function searchAddress() {
    const address = document.getElementById("address").value;

    if (!address) {
        alert("Enter an address first.");
        return;
    }

    try {
        const url =
            "https://nominatim.openstreetmap.org/search?format=json&q=" +
            encodeURIComponent(address);

        const response = await fetch(url);
        const results = await response.json();

        if (results.length === 0) {
            alert("Location not found.");
            return;
        }

        const lat = Number(results[0].lat);
        const lon = Number(results[0].lon);

        map.setView([lat, lon], 15);
        L.marker([lat, lon]).addTo(map)
            .bindPopup("Selected location").openPopup();

    } catch (error) {
        alert("Unable to search for this location.");
    }
}


// BASE64 CONVERSION

function toBase64(bytes) {
    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary);
}

function fromBase64(value) {
    return Uint8Array.from(atob(value), c => c.charCodeAt(0));
}


// ENCRYPT AND SEND FILE

async function encryptAndSend() {
    const file = document.getElementById("fileInput").files[0];
    const receiver = document.getElementById("receiver").value;
    const address = document.getElementById("address").value;

    const result = document.getElementById("sendResult");

    if (!file || !receiver || !address || points.length < 3) {
        alert("Enter receiver details, select a file and create a boundary with at least 3 points.");
        return;
    }

    if (file.size > 15 * 1024 * 1024) {
        alert("Please select a file smaller than 15 MB.");
        return;
    }

    try {
        result.innerText = "Encrypting file...";

        const rawKey = crypto.getRandomValues(new Uint8Array(32));

        const key = await crypto.subtle.importKey(
            "raw",
            rawKey,
            { name: "AES-GCM" },
            false,
            ["encrypt"]
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));

        const originalData = await file.arrayBuffer();

        const encryptedData = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            originalData
        );

        const payload = {
            filename: file.name,
            receiver: receiver,
            address: address,
            boundaries: points,
            iv: toBase64(iv),
            ciphertext: toBase64(new Uint8Array(encryptedData))
        };

        const response = await fetch("/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Upload failed.");
        }

        const secretKey = toBase64(rawKey);

        result.innerHTML = `
            <p class="success"><b>File encrypted and stored successfully!</b></p>
            <p><b>File ID:</b> ${data.file_id}</p>
            <p><b>AES Key:</b> ${secretKey}</p>
            <p>Save both values. The receiver needs them to decrypt the file.</p>
        `;

        document.getElementById("fileId").value = data.file_id;
        document.getElementById("secretKey").value = secretKey;

    } catch (error) {
        result.innerText = "Error: " + error.message;
    }
}


// POINT-IN-POLYGON CHECK

function isInsidePolygon(lat, lon, polygonPoints) {
    let inside = false;

    for (
        let i = 0, j = polygonPoints.length - 1;
        i < polygonPoints.length;
        j = i++
    ) {
        const xi = polygonPoints[i][0];
        const yi = polygonPoints[i][1];

        const xj = polygonPoints[j][0];
        const yj = polygonPoints[j][1];

        const intersects =
            ((yi > lon) !== (yj > lon)) &&
            (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);

        if (intersects) {
            inside = !inside;
        }
    }

    return inside;
}


// GET FILE INFORMATION

async function getReceivedFile() {
    const fileId = document.getElementById("fileId").value.trim();

    if (!fileId) {
        throw new Error("Enter the File ID.");
    }

    const response = await fetch("/file/" + encodeURIComponent(fileId));

    if (!response.ok) {
        throw new Error("File not found.");
    }

    receivedFile = await response.json();
    return receivedFile;
}


// VERIFY RECEIVER LOCATION

async function verifyLocation() {
    const result = document.getElementById("receiveResult");

    try {
        const fileData = await getReceivedFile();

        if (!navigator.geolocation) {
            throw new Error("Geolocation is not supported.");
        }

        result.innerText = "Checking receiver location...";

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                const allowed = isInsidePolygon(
                    lat,
                    lon,
                    fileData.boundaries
                );

                if (allowed) {
                    locationVerified = true;

                    result.innerHTML =
                        '<p class="success"><b>Location verified!</b></p>' +
                        '<p>Receiver is inside the permitted geographical boundary.</p>';
                } else {
                    locationVerified = false;

                    result.innerHTML =
                        '<p class="error"><b>Access denied!</b></p>' +
                        '<p>Receiver is outside the permitted geographical boundary.</p>';
                }
            },

            error => {
                locationVerified = false;
                result.innerText =
                    "Unable to obtain location. Please allow location access.";
            },

            {
                enableHighAccuracy: true,
                timeout: 15000
            }
        );

    } catch (error) {
        locationVerified = false;
        result.innerText = error.message;
    }
}


// DOWNLOAD AND DECRYPT

async function downloadAndDecrypt() {
    const result = document.getElementById("receiveResult");

    try {
        if (!locationVerified) {
            throw new Error("Verify your location before downloading.");
        }

        const fileData = await getReceivedFile();

        const secret = document.getElementById("secretKey").value.trim();

        if (!secret) {
            throw new Error("Enter the AES key.");
        }

        const rawKey = fromBase64(secret);
        const iv = fromBase64(fileData.iv);
        const encryptedData = fromBase64(fileData.ciphertext);

        const key = await crypto.subtle.importKey(
            "raw",
            rawKey,
            { name: "AES-GCM" },
            false,
            ["decrypt"]
        );

        const decryptedData = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encryptedData
        );

        const blob = new Blob([decryptedData]);

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileData.filename;

        link.click();

        URL.revokeObjectURL(link.href);

        result.innerHTML =
            '<p class="success"><b>File decrypted and downloaded successfully!</b></p>';

    } catch (error) {
        result.innerHTML =
            '<p class="error">' + error.message + '</p>';
    }
}