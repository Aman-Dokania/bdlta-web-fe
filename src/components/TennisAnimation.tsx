export default function TennisAnimation() {
  return (
    <div className="tennis-animation" aria-hidden="true">
      <div className="tennis-court-lines" />
      <div className="tennis-racket tennis-racket-one">
        <span className="tennis-racket-head" />
        <span className="tennis-racket-handle" />
      </div>
      <div className="tennis-racket tennis-racket-two">
        <span className="tennis-racket-head" />
        <span className="tennis-racket-handle" />
      </div>
      <div className="tennis-ball tennis-rally-ball" />
      <div className="tennis-ball tennis-ball-one" />
      <div className="tennis-ball tennis-ball-two" />
      <div className="tennis-ball tennis-ball-three" />
      <div className="tennis-ball tennis-ball-four" />
      <div className="tennis-ball tennis-ball-five" />
    </div>
  )
}