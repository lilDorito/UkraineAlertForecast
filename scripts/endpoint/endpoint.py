import os
import json
import boto3
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)

S3_BUCKET = os.environ["S3_BUCKET"]
S3_PREFIX = os.environ.get("S3_PREFIX", "predictions")

@app.route("/latest", methods=["GET"])
def latest():
    region_filter = request.args.get("region")

    try:
        s3 = boto3.client("s3")
        obj = s3.get_object(Bucket=S3_BUCKET, Key=f"{S3_PREFIX}/latest.json")
        data: dict = json.loads(obj["Body"].read())
    except (BotoCoreError, ClientError) as e:
        return jsonify({"error": f"S3 fetch failed: {e}"}), 502

    if region_filter:
        forecast = data.get("regions_forecast", {})
        if region_filter not in forecast:
            return jsonify({"error": f"Region '{region_filter}' not found"}), 404
        data["regions_forecast"] = {region_filter: forecast[region_filter]}

    return jsonify(data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=os.environ.get("FLASK_DEBUG", "0") == "1")