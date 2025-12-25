import { NextResponse } from 'next/server'

const GUDUARI_LAT = 42.4779
const GUDUARI_LON = 44.4796

export async function GET() {
  const apiKey = process.env.WEATHERAPI_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'API key missing' },
      { status: 500 }
    )
  }

  const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${GUDUARI_LAT},${GUDUARI_LON}&aqi=no`

  const res = await fetch(url)

  if (!res.ok) {
    const text = await res.text()
    console.error('WeatherAPI error:', text)

    return NextResponse.json(
      { error: text },
      { status: res.status }
    )
  }

  const data = await res.json()
  return NextResponse.json(data)
}
