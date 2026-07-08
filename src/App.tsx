import Hero from './components/Hero'
import Collection from './components/Collection'
import WhyUs from './components/WhyUs'
import VipFooter from './components/VipFooter'

function App() {
  return (
    <div id="top" className="min-h-screen bg-black tracking-[-0.02em]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
      <Hero />
      <Collection />
      <WhyUs />
      <VipFooter />
    </div>
  )
}

export default App
