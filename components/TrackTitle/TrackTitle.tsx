interface TrackTitleProps {
  title: string
  artist: string
  year: number
}

export default function TrackTitle({ title, artist, year }: TrackTitleProps) {
  return (
    <div className="track-title-block">
      <p className="track-title">{title}</p>
      <p className="track-meta">
        {artist} · {year}
      </p>
    </div>
  )
}
