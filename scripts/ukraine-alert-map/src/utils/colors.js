export function probToColor(p) {
  if (p < 0.04) return '#0a1a0a'
  if (p < 0.1)  return '#1a3a10'
  if (p < 0.2)  return '#2e6612'
  if (p < 0.3)  return '#5a9e0f'
  if (p < 0.4)  return '#a8cc10'
  if (p < 0.5)  return '#e8cc00'
  if (p < 0.6)  return '#f09000'
  if (p < 0.7)  return '#e85000'
  if (p < 0.8)  return '#d42000'
  return '#bb0000'
}
