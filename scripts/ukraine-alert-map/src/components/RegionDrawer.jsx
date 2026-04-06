import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import Clock from './Clock';
import { useLanguage } from '../context/LanguageContext';

export default function RegionDrawer({ region, regionData, orderedTimestamps, currentHour, onClose }) {
  const { t, getRegionName } = useLanguage();
  const isOpen = !!region;
  const [localHour, setLocalHour] = useState(currentHour);

  useEffect(() => {
    if (isOpen) {
      setLocalHour(currentHour);
    }
  }, [currentHour, isOpen]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const currentTs = orderedTimestamps[localHour];
  const currentSlot = regionData && currentTs ? regionData[currentTs.key] : null;
  const isAlert = currentSlot?.binary ?? false;

  const chartData = regionData
    ? orderedTimestamps.map((ts, i) => ({
        label: ts.label,
        probability: Math.round((regionData[ts.key]?.probability ?? 0) * 100),
        binary: regionData[ts.key]?.binary ?? false,
        index: i,
      }))
    : [];

  const alarmHours = orderedTimestamps.filter(ts => regionData?.[ts.key]?.binary);
  const displayName = region ? getRegionName(region) : '';

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.binary) {
      return <circle cx={cx} cy={cy} r={5} fill="#ff3300" stroke="#ff6600" strokeWidth={1.5} />;
    }
    return <circle cx={cx} cy={cy} r={2} fill="#e84a4a" />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="chart-tooltip">
        <div className="tooltip-time">{d.label}</div>
        <div className="tooltip-prob">{d.probability}%</div>
        {d.binary && <div className="tooltip-alert">⚠ Alert</div>}
      </div>
    );
  };

  return (
    <>
      <div className={`drawer-overlay${isOpen ? ' open' : ''}`} onClick={onClose} />
      <div className={`drawer${isOpen ? ' open' : ''}`}>
        <button className="drawer-close" onClick={onClose}>×</button>

        <div className="drawer-header">
          <div className="drawer-region-name">{displayName}</div>
          <div className="drawer-sub">24-hour forecast (Kyiv local time)</div>
        </div>

        {currentSlot && (
          <div className="badges">
            <div className="badge badge-stat">
              <span>{Math.round(currentSlot.probability * 100)}%</span>
              {t('probability')}
            </div>
            <div className="badge badge-stat">
              <span>{typeof currentSlot.score === 'number' ? currentSlot.score.toFixed(3) : currentSlot.score}</span>
              {t('modelScore')}
            </div>
            <div className={`badge ${isAlert ? 'badge-alert' : 'badge-safe'}`}>
              <span className={`status-pip ${isAlert ? 'pip-alert' : 'pip-safe'}`} />
              {isAlert ? t('likelyAlert') : t('likelyNoAlert')}
            </div>
          </div>
        )}

        {!regionData && (
          <div className="badges">
            <div className="badge badge-stat">
              <span>—</span>{t('fullDataComing')}
            </div>
          </div>
        )}

        <div className="drawer-section">
          <div className="section-label">{t('probOver24h')}</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e84a4a" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#e84a4a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis domain={[0, 100]} tick={{ fill: '#444', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={orderedTimestamps[localHour]?.label} stroke="#ffffff22" strokeWidth={1} strokeDasharray="3 3" />
                <Area
                  type="monotone" dataKey="probability"
                  stroke="#e84a4a" strokeWidth={1.5}
                  fill="url(#probGrad)"
                  dot={<CustomDot />}
                  activeDot={{ r: 4, fill: '#ff6666' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">Full data not available in demo</div>
          )}
        </div>

        <div className="drawer-section">
          <div className="section-label">{t('alertHours')}</div>
          <div className="alarm-hours">
            {alarmHours.length > 0
              ? alarmHours.map(ts => (
                  <span
                    key={ts.key}
                    className="ah-badge"
                    onClick={() => setLocalHour(orderedTimestamps.findIndex(t => t.key === ts.key))}
                  >
                    {ts.label}
                  </span>
                ))
              : <span className="no-alert-text">{t('noAlertHours')}</span>
            }
          </div>
        </div>

        <div className="drawer-section">
          <div className="section-label">{t('navigateHours')}</div>
          <div className="clock-container">
            <Clock
              currentHour={localHour}
              onHourChange={setLocalHour}
              regionData={regionData}
              orderedTimestamps={orderedTimestamps}
            />
            <div className="clock-time-label">{orderedTimestamps[localHour]?.label}</div>
          </div>
        </div>
      </div>
    </>
  );
}