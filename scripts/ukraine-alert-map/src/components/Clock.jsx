import { useRef, useCallback, useMemo, memo } from 'react';

const CX = 55, CY = 55, R = 46;

const StaticClock = memo(({ alarmSectors, ticks, labels }) => (
  <g>
    <circle cx={CX} cy={CY} r={R} fill="#0d0d1a" stroke="#1e1e30" strokeWidth="0.5" />
    {alarmSectors}
    {ticks}
    {labels}
  </g>
));

const Hand = memo(({ hour, tipColor }) => {
  const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;
  const hx = CX + R * 0.58 * Math.cos(angle);
  const hy = CY + R * 0.58 * Math.sin(angle);
  return (
    <g>
      <line
        x1={CX} y1={CY} x2={hx.toFixed(1)} y2={hy.toFixed(1)}
        stroke="#c8c8d8" strokeWidth="2.5" strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r="3.5" fill="#c8c8d8" />
      <circle cx={hx.toFixed(1)} cy={hy.toFixed(1)} r="4" fill={tipColor} />
    </g>
  );
});

export default function Clock({ currentHour, onHourChange, regionData, orderedTimestamps }) {
  const svgRef = useRef(null);
  const dragging = useRef(false);
  const rafId = useRef(null);

  const getHourFromEvent = useCallback((e) => {
    if (!svgRef.current) return currentHour;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    const scale = 110 / rect.width;
    const x = (clientX - rect.left) * scale - CX;
    const y = (clientY - rect.top) * scale - CY;
    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    return Math.floor((angle / (2 * Math.PI)) * 24) % 24;
  }, [currentHour]);

  const updateHour = useCallback((e) => {
    if (!dragging.current) return;
    const newHour = getHourFromEvent(e);
    if (newHour !== currentHour) {
      onHourChange(newHour);
    }
  }, [getHourFromEvent, onHourChange, currentHour]);

  const onMove = useCallback((e) => {
    e.preventDefault();
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => updateHour(e));
  }, [updateHour]);

  const onStart = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    updateHour(e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
  }, [updateHour, onMove]);

  const onEnd = useCallback(() => {
    dragging.current = false;
    if (rafId.current) cancelAnimationFrame(rafId.current);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onEnd);
    window.removeEventListener('touchmove', onMove);
    window.removeEventListener('touchend', onEnd);
  }, [onMove]);

  const alarmSectors = useMemo(() => {
    if (!regionData || !orderedTimestamps) return [];
    const sectors = [];
    orderedTimestamps.forEach((ts, i) => {
      if (regionData[ts.key]?.binary) {
        const a1 = (i / 24) * 2 * Math.PI - Math.PI / 2;
        const a2 = ((i + 1) / 24) * 2 * Math.PI - Math.PI / 2;
        const x1 = CX + R * Math.cos(a1);
        const y1 = CY + R * Math.sin(a1);
        const x2 = CX + R * Math.cos(a2);
        const y2 = CY + R * Math.sin(a2);
        sectors.push(
          <path key={i}
            d={`M${CX} ${CY} L${x1.toFixed(1)} ${y1.toFixed(1)} A${R} ${R} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`}
            fill="#ff330044" stroke="none"
          />
        );
      }
    });
    return sectors;
  }, [regionData, orderedTimestamps]);

  const ticks = useMemo(() => {
    const t = [];
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * 2 * Math.PI - Math.PI / 2;
      const r1 = i % 6 === 0 ? R - 10 : i % 3 === 0 ? R - 6 : R - 4;
      const x1 = CX + R * Math.cos(a);
      const y1 = CY + R * Math.sin(a);
      const x2 = CX + r1 * Math.cos(a);
      const y2 = CY + r1 * Math.sin(a);
      t.push(
        <line key={i}
          x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)}
          stroke={i % 6 === 0 ? '#555' : '#252535'}
          strokeWidth={i % 6 === 0 ? 1.5 : 0.8}
        />
      );
    }
    return t;
  }, []);

  const labels = useMemo(() => {
    return [0, 6, 12, 18].map(h => {
      const a = (h / 24) * 2 * Math.PI - Math.PI / 2;
      const lx = CX + (R - 17) * Math.cos(a);
      const ly = CY + (R - 17) * Math.sin(a);
      return (
        <text key={h} x={lx.toFixed(1)} y={ly.toFixed(1)}
          textAnchor="middle" dominantBaseline="central"
          fill="#555" fontSize="8" fontFamily="'DM Mono', monospace">
          {h}
        </text>
      );
    });
  }, []);

  const currentSlot = regionData && orderedTimestamps ? regionData[orderedTimestamps[currentHour]?.key] : null;
  const tipColor = currentSlot?.binary ? '#ff4444' : '#5acc5a';

  return (
    <svg
      ref={svgRef}
      width="110" height="110" viewBox="0 0 110 110"
      style={{ cursor: 'pointer', userSelect: 'none', display: 'block' }}
      onMouseDown={onStart}
      onTouchStart={onStart}
    >
      <StaticClock alarmSectors={alarmSectors} ticks={ticks} labels={labels} />
      <Hand hour={currentHour} tipColor={tipColor} />
    </svg>
  );
}