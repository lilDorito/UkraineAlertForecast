# Ukraine Alert Forecast

A machine learning system that forecasts air raid alert probabilities across all Ukrainian regions for the next 24 hours. Predictions are served via a REST API and visualized on an interactive map updated daily.

**Live:** [ukraine-alert-forecast.vercel.app](https://ukraine-alert-forecast.vercel.app)

---

## Overview

The system collects data from multiple sources daily, merges it and appends to a historical dataset, engineers features, retrains a LightGBM model, and publishes a 24-hour per-region forecast every morning. The frontend displays the forecast as a heatmap over a Ukraine map with hourly resolution.

---

## ⚠️ Data Collection Notice

The historical dataset required to train the model is **not included** in this repository and is non-trivial to reconstruct:

- **Alarm data** — requires running the historical scraper from scratch
- **Reddit** — requires downloading raw dumps from [AcademicTorrents](https://academictorrents.com/) archives via torrent and filtering locally
- **Telegram** — requires an active Telegram account, API credentials, and time to collect history
- **Weather & ISW** — relatively straightforward via the provided scripts

Full historical backfill can take significant time and disk space. The daily cron pipeline assumes this data already exists.

**This repo is primarily a reference implementation.** The live deployment at [ukraine-alert-forecast.vercel.app](https://ukraine-alert-forecast.vercel.app) runs on a private dataset built over time.

---

## Architecture

### Backend (AWS EC2 Ubuntu)
- Cron jobs run a nightly pipeline:
  - Data collectors (alarms, Reddit, Telegram, weather, ISW)
  - Merging + feature engineering
  - Model retraining (LightGBM multioutput)
  - Prediction generation -> uploaded to S3 at `s3://{S3_BUCKET}/{S3_PREFIX}/latest.json`
- Flask + Gunicorn serve the `/latest` endpoint, reading the latest prediction from S3

### Frontend (Vercel)
- `api/forecast.js` — serverless proxy
- React + Vite app
- Connected to backend via HTTP (`x-api-key`)

### Nightly Pipeline (UTC)

| Time  | Job |
|-------|-----|
| 02:00 | Collect alarm data |
| 02:45 | Collect Reddit posts |
| 03:15 | Collect Telegram messages |
| 03:30 | Collect weather data |
| 03:45 | Collect ISW toplines |
| 04:00 | Append alarms to historical alarms dataset |
| 04:15 | Merge all sources |
| 04:30 | Generate features |
| 04:45 | Retrain LightGBM model |
| 05:55 | Generate predictions -> publish to S3 |

---

## Data

| Type | Description |
|------|-------------|
| **Alarms** | Historical air raid alert records per region |
| **Weather** | Daily weather features per region |
| **Telegram** | Telegram channel monitoring |
| **Reddit** | Reddit posts filtered for conflict content |
| **ISW** | Institute for the Study of War daily toplines |

---

## Model

- **Algorithm:** LightGBM multioutput classifier
- **Task:** Probability score per region per hour + binary classification on calibrated probability (alert / no alert)
- **Features:** Lag features from alarm history, weather, NLP signals from Telegram/Reddit/ISW, temporal features (hour, day of week, etc.)
- **Retraining:** Daily, automatically via cron
- **Alternatives evaluated:** Logistic Regression, Linear Regression, Random Forest, XGBoost

**Pipeline performance (average across daily retrains):**

| Metric | Score |
|--------|-------|
| F1 Score | ~0.819 |
| Prec | ~0.812 |
| Recall | ~0.825 |
| AUC-ROC | ~0.923 |

---

## Frontend

Built with **React + Vite**, deployed on **Vercel**.

- React 18
- Interactive choropleth map colored by alert probability
- 24-hour heatmap bar (click or drag to jump to any hour)
- Per-region drawer with probability chart, alert hours, and analog clock
- Playback animation across hours
- Auto-updates daily at 06:00 UTC

---

## Repository Structure

```
UkraineAlertForecast/
├── datasets/           # Raw and processed data (.csv)
├── models/             # Trained model artifacts (.pkl)
├── scripts/
│   ├── alarms/         # Alarm data collection & processing
│   ├── reddit/         # Reddit scraping & filtering
│   ├── telegram/       # Telegram scraping
│   ├── weather/        # Weather data collection
│   ├── isw/            # ISW toplines scraping
│   ├── features/       # Feature engineering
│   ├── merge/          # Dataset merging
│   ├── train/          # Model training (lgb, xgb, randf, log_reg, lin_reg)
│   ├── predict/        # Prediction generation & S3 upload
│   ├── endpoint/       # Flask API server
│   └── ukraine-alert-map/  # React frontend
├── logs/               # Per-component logs
├── requirements.txt    # .venv requirements
└── setup.sh            # Setup script for folders & structure
```

---

## Setup & Deployment

### 1. Clone & Environment

```bash
git clone https://github.com/lilDorito/UkraineAlertForecast
cd UkraineAlertForecast
bash setup.sh

cp .env.example .env
# Fill in all credentials (see sections below)
```

---

### 2. API Keys & Credentials

#### alerts.in.ua API Key

The alarm data collector uses the [alerts.in.ua](https://alerts.in.ua/) API.

1. Go to [alerts.in.ua](https://alerts.in.ua/)
2. Navigate to **About us** -> **API** (available only on Ukrainian language page)
3. Fill in the form thoughtfully and wait for an email with key (should not take more than 48h)
4. Copy the key into your `.env`:

```env
ALERTS_IN_UA_API_KEY=your-alerts-in-ua-api-key
```

#### Telegram API ID & Hash (Telethon)

Telegram data is collected via [Telethon](https://docs.telethon.dev/), which requires an active Telegram account and an API app.

1. Sign in to [my.telegram.org](https://my.telegram.org) with your Telegram phone number
2. Go to **API development tools**
3. Fill in the form (App title and short name can be anything, e.g. `AlertForecast`)
4. Click **Create application** — you'll receive your `api_id` and `api_hash`
5. Copy them into your `.env`:

```env
TELEGRAM_API_ID=your-telegram-api-id
TELEGRAM_API_HASH=your-telegram-api-hash
```

> **Note:** On the first run, Telethon will prompt you to authenticate with your phone number and a one-time code sent by Telegram. A session file will be created locally so subsequent runs don't require re-authentication.

---

### 3. S3 & IAM (Prediction Storage)

Predictions are uploaded to S3 after each nightly run and read back by the Flask endpoint to serve forecasts.

#### Create the S3 bucket

```bash
aws s3 mb s3://your-bucket-name --region your-region
```

#### Create an IAM policy

Save the following as `s3-forecast-policy.json`, replacing `your-bucket-name`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/predictions/*"
      ]
    }
  ]
}
```

#### Create an IAM user and attach the policy

```bash
# Create the policy
aws iam create-policy \
  --policy-name UkraineAlertS3Policy \
  --policy-document file://s3-forecast-policy.json

# Create a dedicated IAM user
aws iam create-user --user-name ukraine-alert-bot

# Attach the policy (replace YOUR_ACCOUNT_ID)
aws iam attach-user-policy \
  --user-name ukraine-alert-bot \
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/UkraineAlertS3Policy

# Generate access keys
aws iam create-access-key --user-name ukraine-alert-bot
```

Copy the returned `AccessKeyId` and `SecretAccessKey` into your `.env`:

```env
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_DEFAULT_REGION=your-region
S3_BUCKET=your-bucket-name
S3_PREFIX=predictions
```

---

### 4. Backend (EC2)

Set up cron jobs as described in the pipeline table above.

Install system dependencies:

```bash
sudo apt update
sudo apt install nginx
```

Then install Python dependencies into the venv:

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

#### 4.1 Test the endpoint

Before setting up a persistent service, verify the app runs correctly:

```bash
cd /path/to/UkraineAlertForecast
.venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 scripts.endpoint.endpoint:app
```

#### 4.2 Run as a systemd service

To keep the endpoint running persistently across reboots, set it up as a systemd service.

Create the service file:

```bash
sudo nano /etc/systemd/system/flaskapp.service
```

Paste the following, adjusting paths to your repo location:

```ini
[Unit]
Description=Flask (Gunicorn) Latest Endpoint
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/path/to/UkraineAlertForecast
EnvironmentFile=/path/to/UkraineAlertForecast/.env
ExecStart=/path/to/UkraineAlertForecast/.venv/bin/gunicorn \
    --chdir /path/to/UkraineAlertForecast \
    -w 4 \
    -b 0.0.0.0:5000 \
    --access-logfile - \
    --error-logfile - \
    scripts.endpoint.endpoint:app
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable flaskapp
sudo systemctl start flaskapp
sudo systemctl status flaskapp
```

#### 4.3 Set up Nginx reverse proxy

Gunicorn listens on port 5000. Nginx sits in front and exposes the endpoint on port 80.

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/ukraine-alert-forecast
```

Paste the following, replacing the IP with your EC2 instance's address:

```nginx
server {
    listen 80;
    server_name your-ec2-ip;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the config and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/ukraine-alert-forecast /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

The endpoint will now be reachable at `http://your-ec2-ip/latest`.

#### EC2 environment variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_API_ID` | Telegram app ID from my.telegram.org |
| `TELEGRAM_API_HASH` | Telegram app hash from my.telegram.org |
| `ALERTS_IN_UA_API_KEY` | alerts.in.ua API key |
| `AWS_ACCESS_KEY_ID` | IAM user access key |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key |
| `AWS_DEFAULT_REGION` | AWS region of your S3 bucket |
| `S3_BUCKET` | S3 bucket name for prediction storage |
| `S3_PREFIX` | Key prefix for predictions (e.g. `predictions`) |
| `API_KEY` | Secret key used to authenticate frontend -> backend requests |

See [.env.example](./.env.example) for the full template.

---

## Credits & Sources

- [alerts.in.ua](https://alerts.in.ua/) — historical & daily alert data
- [Institute for the Study of War (ISW)](https://www.understandingwar.org) — historical & daily toplines
- [Open-Meteo](https://open-meteo.com) — weather forecast & historical data API
- [Arctic Shift](https://arctic-shift.photon-reddit.com/) — Reddit submissions/comments scraping API
- [Telethon](https://tl.telethon.dev/) — Telegram post scraping API
- [LightGBM](https://lightgbm.readthedocs.io) — gradient boosting framework
- [Vercel](https://vercel.com) — frontend hosting
- [SanGreel](https://github.com/SanGreel/reddit-dump-extractor) — Reddit dump extractor
- Subreddits monitored: `r/ukraine`, `r/worldnews`
- Telegram channels monitored:
  ```
  @radar_raketa, @Ukraine_UA_24_7, @air_alert_telegram, @alarmua,
  @ukrpravda_news, @pravda_ukraineee, @suspilnenews, @uniannet,
  @hromadske_ua, @war_monitor, @nexta_live, @GeneralStaffZSU, @kpszsu
  ```

---

## License

This is a learning/research project. No data is distributed with this repository.

See [LICENSE](./LICENSE).
