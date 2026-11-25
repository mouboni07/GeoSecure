from flask import Flask, render_template, request, jsonify
import uuid
import base64

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024

files = {}

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    data = request.json

    file_id = str(uuid.uuid4())

    files[file_id] = {
        "filename": data["filename"],
        "ciphertext": data["ciphertext"],
        "iv": data["iv"],
        "address": data["address"],
        "boundaries": data["boundaries"],
        "receiver": data["receiver"]
    }

    return jsonify({
        "success": True,
        "file_id": file_id
    })


@app.route("/file/<file_id>")
def get_file(file_id):
    if file_id not in files:
        return jsonify({"error": "File not found"}), 404

    return jsonify(files[file_id])


if __name__ == "__main__":
    app.run(debug=True)