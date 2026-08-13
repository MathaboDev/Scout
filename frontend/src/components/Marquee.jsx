/**
 * A duplicated-track marquee: the item list is rendered twice back to back
 * and the whole strip translates by exactly -50%, so the loop point is
 * invisible. Pauses on hover/focus and is skipped entirely for people who
 * asked for reduced motion (handled globally in index.css).
 */
export default function Marquee({ items = [], className = "" }) {
  return (
    <div
      className={`group flex overflow-hidden whitespace-nowrap ${className}`}
      role="list"
      aria-label="Scout at a glance"
    >
      <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10 group-hover:[animation-play-state:paused]">
        {items.map((item, i) => (
          <span key={`a-${i}`} className="flex items-center gap-10">
            <span role="listitem">{item}</span>
            <span aria-hidden="true">✷</span>
          </span>
        ))}
      </div>
      <div
        className="flex shrink-0 animate-marquee items-center gap-10 pr-10 group-hover:[animation-play-state:paused]"
        aria-hidden="true"
      >
        {items.map((item, i) => (
          <span key={`b-${i}`} className="flex items-center gap-10">
            <span>{item}</span>
            <span>✷</span>
          </span>
        ))}
      </div>
    </div>
  );
}
