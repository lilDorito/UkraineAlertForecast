# Ukraine Alert Forecast
 
A machine learning system that forecasts air raid alert probabilities across all Ukrainian regions for the next 24 hours. Predictions are served via a REST API and visualized on an interactive map updated daily.
 
**Live:** [ukraine-alert-forecast.vercel.app](https://ukraine-alert-forecast.vercel.app)
 
---
 
## Overview
 
The system collects data from multiple sources daily, merges it and appends to a historical dataset, engineers features, retrains a LightGBM model, and publishes a 24-hour per-region forecast every morning. The frontend displays the forecast as a heatmap over a Ukraine map with hourly resolution.
 
---
 
## Architecture
 
### Backend (AWS EC2 Ubuntu):
- Cron Jobs (nightly pipeline):
  - Data collectors (alarms, Reddit, Telegram, weather, ISW)
  - Merging + feature engineering
  - Model retraining (LightGBM multioutput)
  - Prediction -> S3
- Flask + Gunicorn -> /latest endpoint

### Frontend (Vercel)
- api/forecast.js  (serverless proxy)
- React + Vite app
- Connected to backend via HTTP (x-api-key)
 
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
| 05:55 | Generate predictions -> publish |
 
---
 
## Data
 
| Type | Description |
|--------|-------------|
| **Alarm data** | Historical air raid alert records per region |
| **Weather** | Daily weather features per region |
| **Telegram** | Telegram channel monitoring |
| **Reddit** | Reddit posts filtered for conflict content |
| **ISW** | Institute for the Study of War daily toplines |
 
---
 
## Model
 
- **Algorithm:** LightGBM multioutput classifier
- **Task:** Probability score per region per hour + binary classification on calibrated probability (alert/no alert)
- **Features:** Lag features from alarm history, weather, NLP signals from Telegram/Reddit/ISW, temporal features (hour, day of week, etc.)
- **Retraining:** Daily, automatically via cron
- **Alternatives evaluated:** Logistic Regression, Linear Regression, Random Forest, XGBoost
 
---
 
## Frontend
 
Built with **React + Vite**, deployed on **Vercel**.
 
### Stack
- React 18
- Custom SVG Ukraine map
 
### Features
- Interactive choropleth map colored by alert probability
- 24-hour heatmap bar (click or drag to jump)
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
 
### Backend (EC2)
 
```bash
# Clone and set up environment
git clone https://github.com/lilDorito/UkraineAlertForecast
cd UkraineAlertForecast
bash setup.sh

# Fill in your credentials
cp .env.example .env
 
# Activate venv and install dependencies
source .venv/bin/activate
pip install -r requirements.txt

# Run the Flask endpoint
gunicorn -w 2 -b 0.0.0.0:80 scripts.endpoint.endpoint:app
```
 
Set up cron jobs as described in the pipeline table above.
 
Required environment variables / secrets:
[env.example](https://github.com/lilDorito/UkraineAlertForecast/blob/main/.env.example)
 
### Frontend (Vercel)
 
```bash
cd scripts/ukraine-alert-map
npm install
npm run dev          # local dev
npm run build        # production build
```
 
Deploy by connecting the repo to Vercel. Set the following environment variable in Vercel dashboard:
 
| Variable | Description |
|----------|-------------|
| `API_KEY` | Key for authenticating requests to the EC2 endpoint |
 
The `api/forecast.js` serverless function proxies requests from the frontend to the EC2 backend, injecting the API key server-side.

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
 
## Credits & Sources
 
- [alerts.in.ua](https://alerts.in.ua/) — historical & daily alert data
- [Institute for the Study of War (ISW)](https://www.understandingwar.org) — historical & daily toplines
- [Open-Meteo](https://open-meteo.com) — weather forecast API
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
