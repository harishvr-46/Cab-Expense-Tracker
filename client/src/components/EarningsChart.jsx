import React from 'react'

export default function EarningsChart({ trips }) {
  if (!trips || trips.length === 0) return null

  // Group trips by date and calculate daily earnings
  const dailyData = {}
  trips.forEach(trip => {
    const date = new Date(trip.timestamp).toLocaleDateString()
    if (!dailyData[date]) {
      dailyData[date] = { trips: 0, fare: 0, toll: 0 }
    }
    dailyData[date].trips += 1
    dailyData[date].fare += Number(trip.fare || 0)
    dailyData[date].toll += Number(trip.toll || 0)
  })

  const dates = Object.keys(dailyData).slice(-7) // Last 7 days
  const maxFare = Math.max(...dates.map(d => dailyData[d].fare), 1)

  return (
    <div className="card dashboard-section">
      <div className="section-header">
        <h3>Earnings Trend</h3>
        <span className="status-pill">Last 7 days</span>
      </div>
      <div className="chart-container">
        <svg viewBox="0 0 600 300" className="chart-svg">
          {/* Y-axis */}
          <line x1="40" y1="20" x2="40" y2="260" stroke="#e2e8f0" strokeWidth="2" />
          {/* X-axis */}
          <line x1="40" y1="260" x2="580" y2="260" stroke="#e2e8f0" strokeWidth="2" />

          {/* Grid lines and labels */}
          {[0, 25, 50, 75, 100].map((percent) => (
            <g key={percent}>
              <line x1="35" y1={260 - (percent / 100) * 240} x2="580" y2={260 - (percent / 100) * 240} 
                    stroke="#f1f5f9" strokeWidth="1" />
              <text x="20" y={260 - (percent / 100) * 240 + 4} fontSize="12" color="#6b7280" textAnchor="end">
                {Math.round((percent / 100) * maxFare)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {dates.map((date, idx) => {
            const barHeight = (dailyData[date].fare / maxFare) * 240
            const x = 60 + (idx * 70)
            return (
              <g key={date}>
                <rect x={x} y={260 - barHeight} width="50" height={barHeight} fill="url(#barGradient)" rx="4" />
                <text x={x + 25} y="280" fontSize="12" textAnchor="middle" fill="#6b7280">
                  {new Date(date).getDate()}
                </text>
              </g>
            )
          })}

          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor:'#2563eb',stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:'#06b6d4',stopOpacity:1}} />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-color" style={{background:'#2563eb'}}></div>
          <span>Earnings (₹)</span>
        </div>
      </div>
    </div>
  )
}
