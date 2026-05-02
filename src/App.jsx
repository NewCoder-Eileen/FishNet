import './App.css'

const NAV_LINKS = ['Home', 'Profile', 'Join Event', 'Connect', 'About', 'Privacy']

const NAV_BUTTONS = [
  { label: 'Profile',    graphic: null },
  { label: 'Join Event', graphic: null },
  { label: 'Connect',    graphic: null },
]

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        {null ?? <div className="nav-logo-placeholder">Logo</div>}
      </div>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link}><a href={`#${link.toLowerCase().replace(' ', '-')}`}>{link}</a></li>
        ))}
      </ul>
    </nav>
  )
}

function Jellyfish({ label, graphic }) {
  return (
    <button type="button" className="jellyfish">
      <div className="jelly-bell">
        <div className="jelly-shine" />
        <div className="jelly-graphic">
          {graphic && <img src={graphic} alt="" />}
        </div>
        <span className="jelly-label">{label}</span>
      </div>
      <div className="jelly-tentacles">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="tentacle" style={{ '--i': i }} />
        ))}
      </div>
    </button>
  )
}

function App() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero" id="home">
          <div className="hero-logo-placeholder">Your Logo Here</div>
        </section>

        <section className="about-section" id="about">
          <h2>About</h2>
          <p>Tell your story here — what is fishnet, who is it for, and what makes it different.</p>
        </section>

        <section className="btn-section" id="join-event">
          <div className="btn-grid">
            {NAV_BUTTONS.map((btn, i) => (
              <Jellyfish key={btn.label} {...btn} delay={i * 0.8} />
            ))}
          </div>
        </section>

        <section className="privacy-section" id="privacy">
          <h2>Privacy</h2>
          <p>Your privacy policy goes here.</p>
        </section>
      </main>
    </>
  )
}

export default App