import './App.css'

const NAV_BUTTONS = [
  { label: 'Profile',     graphic: null },
  { label: 'Join Event',  graphic: null },
  { label: 'Connect',     graphic: null },
]

function NavButton({ label, graphic }) {
  return (
    <button type="button" className="nav-btn">
      <div className="nav-btn-graphic">
        {graphic && <img src={graphic} alt="" />}
      </div>
      <span>{label}</span>
    </button>
  )
}

function App() {
  return (
    <main className="landing">
      <div className="btn-grid">
        {NAV_BUTTONS.map((btn) => (
          <NavButton key={btn.label} {...btn} />
        ))}
      </div>
    </main>
  )
}

export default App