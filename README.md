# 🔐 GeoSecure – Secure Geo-Locked File Delivery System

**Design and Analysis of Secure Data Delivery Based on Geo Information**

GeoSecure is a web-based prototype designed to demonstrate secure file sharing using AES encryption and geographical access restrictions. It allows a sender to encrypt a file, define a permitted geographical boundary, and verify the receiver's location before allowing file decryption.

## 🚀 Features

- **Secure File Encryption:** Encrypts uploaded files using AES-GCM.
- **Geofencing:** Allows users to define permitted geographical boundaries by selecting points on an interactive map.
- **Interactive Map:** Uses Leaflet and OpenStreetMap.
- **Location Verification:** Checks whether the receiver's browser-reported location falls inside the permitted geographical boundary.
- **Secure File Retrieval:** Allows file decryption using the generated AES key after location verification.
- **Local Deployment:** Runs locally using Python Flask.

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| Flask | Web framework |
| HTML5 | Webpage structure |
| CSS3 | Interface styling |
| JavaScript | Frontend functionality |
| Web Crypto API | AES-GCM encryption and decryption |
| Leaflet.js | Interactive maps |
| OpenStreetMap | Map data |

## 📁 Project Structure

```text
GeoSecure/
│
├── app.py
├── requirements.txt
├── README.md
│
├── templates/
│   └── index.html
│
└── static/
    ├── css/
    │   └── style.css
    │
    └── js/
        └── script.js
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/mouboni07/GeoSecure.git
cd GeoSecure
```

### 2. Install dependencies

```bash
py -m pip install -r requirements.txt
```

### 3. Run the application

```bash
py app.py
```

### 4. Open in browser

Visit:

```text
http://127.0.0.1:5000
```

## 📌 How It Works

1. The sender enters sender and receiver details.
2. The sender selects a file for secure delivery.
3. A geographical address is entered and located on the map.
4. The sender draws a permitted geographical boundary.
5. The file is encrypted using AES-GCM.
6. The encrypted file and geographical boundary information are stored by the Flask application.
7. The receiver enters the File ID and AES key.
8. The receiver's browser location is checked against the permitted boundary.
9. If the location is within the boundary, the file can be decrypted and downloaded.

## 🔒 Security Considerations

- AES-GCM provides authenticated encryption.
- The AES key is generated randomly for each uploaded file.
- The initialization vector (IV) is generated separately for each encryption.
- Browser geolocation is not tamper-proof and can potentially be spoofed.
- The current prototype uses in-memory storage and is intended for educational demonstration, not production deployment.

## 🔮 Future Improvements

- Persistent database integration.
- Email-based file delivery and notifications.
- Stronger receiver location authentication using Wi-Fi or Bluetooth signals.
- Improved key management and secure key distribution.
- Production-grade deployment and access control.

## 👩‍💻 Project Information

**Project Title:** Design and Analysis of Secure Data Delivery Based on Geo Information

**Project Name:** GeoSecure

**Repository:** [GitHub – GeoSecure](https://github.com/mouboni07/GeoSecure)

---

*Developed as an academic project to demonstrate secure data delivery using encryption and geographical access control.*
