import { useEffect, useMemo, useState } from "react";

type Memory = {
  title: string;
  caption: string;
  image: string;
};

const memories: Memory[] = [
  {
    title: "First Meet",
    caption: "The day everything changed with one smile.",
    image:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Best Moments",
    caption: "Little laughs, long talks, and the sweetest memories.",
    image:
      "https://images.unsplash.com/photo-1516589091380-5d8e87df6999?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Recent Memories",
    caption: "Still falling for you in every passing day.",
    image:
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
  },
];

const App = () => {
  const [typedText, setTypedText] = useState("");
  const [showSurprise, setShowSurprise] = useState(false);
  const [progressiveReveal, setProgressiveReveal] = useState(false);

  const finalHeading = "Happy Birthday, Kalindi 💖";

  const confetti = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.8}s`,
        duration: `${1.8 + Math.random() * 1.8}s`,
      })),
    [showSurprise],
  );

  useEffect(() => {
    const timer = setTimeout(() => setProgressiveReveal(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let index = 0;
    const typeTimer = setInterval(() => {
      setTypedText(finalHeading.slice(0, index + 1));
      index += 1;
      if (index >= finalHeading.length) clearInterval(typeTimer);
    }, 70);

    return () => clearInterval(typeTimer);
  }, []);


  useEffect(() => {
    const onScroll = () => {
      document.documentElement.style.setProperty("--scrollY", `${window.scrollY}px`);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.18 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const scrollToMemories = () => {
    document.getElementById("memories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="journey-app">
      <div className="floating-hearts" aria-hidden>
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={`heart h${i + 1}`}>
            💖
          </span>
        ))}
      </div>

      {showSurprise && (
        <>
          <div className="confetti-layer" aria-hidden>
            {confetti.map((piece) => (
              <span
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: piece.left,
                  animationDelay: piece.delay,
                  animationDuration: piece.duration,
                }}
              />
            ))}
          </div>
          <div className="surprise-modal-backdrop" onClick={() => setShowSurprise(false)}>
            <article className="surprise-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Surprise for You 🎁</h3>
              <p>
                You are the softest light in my life. Thank you for every smile,
                every hug, and every moment that feels like home.
              </p>
              <button className="journey-btn" onClick={() => setShowSurprise(false)}>
                Keep This Moment 💌
              </button>
            </article>
          </div>
        </>
      )}

      <section className="hero reveal visible">
        <div className="glass-card parallax-layer">
          <p className="hero-chip">A Story of Us</p>
          <h1>{typedText}</h1>
          <p className="hero-subtext">
            Every year with you feels more magical than the last. Today is all about your smile.
          </p>
          <button className="journey-btn" onClick={scrollToMemories}>
            Start Our Journey 💌
          </button>
          <button className="scroll-hint" onClick={scrollToMemories}>
            Scroll Down ↓
          </button>
        </div>
      </section>

      <section id="memories" className={`memories reveal ${progressiveReveal ? "" : "hidden"}`}>
        <div className="section-head">
          <h2>Our Memory Lane</h2>
          <p>From first hello to forever feelings.</p>
        </div>
        <div className="memory-grid">
          {memories.map((memory, idx) => (
            <article className="memory-card glass-card" key={memory.title}>
              <span className="memory-step">Step {idx + 1}</span>
              <figure>
                <img src={memory.image} alt={memory.title} loading="lazy" />
              </figure>
              <div>
                <h3>{memory.title}</h3>
                <p>{memory.caption}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="love-letter reveal">
        <article className="glass-card letter-card">
          <h2>To My Kalindi</h2>
          <p>
            You make ordinary days feel special. Your kindness, your laughter,
            and your warm heart have given my world new meaning.
          </p>
          <p>
            No matter how many birthdays pass,
            <span> I will always choose you, celebrate you, and love you more.</span>
          </p>
          <p>Happy Birthday, my love. 💖</p>
        </article>
      </section>

      <section className="surprise reveal">
        <div className="glass-card section-center">
          <h2>One More Special Moment</h2>
          <p>There is one tiny surprise waiting for your smile.</p>
          <button className="journey-btn" onClick={() => setShowSurprise(true)}>
            Open Surprise 🎁
          </button>
        </div>
      </section>

      <section className="final reveal">
        <div className="glass-card section-center">
          <h2>Once again, Happy Birthday My Love 💖</h2>
          <p>Forever grateful for you, today and always.</p>
        </div>
      </section>
    </main>
  );
};

export default App;
