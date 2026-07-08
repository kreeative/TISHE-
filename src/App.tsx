import Hero from './components/Hero'
import Campaign from './components/Campaign'
import Collection from './components/Collection'
import LengthGuide from './components/LengthGuide'
import WhyUs from './components/WhyUs'
import Circle from './components/Circle'
import VipFooter from './components/VipFooter'
import CartDrawer from './components/CartDrawer'
import AccountModal from './components/AccountModal'
import { StoreProvider } from './components/StoreContext'

function App() {
  return (
    <StoreProvider>
      <div id="top" className="min-h-screen bg-[#FFF8F2] tracking-[-0.02em]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <Hero />
        <Campaign />
        <Collection />
        <LengthGuide />
        <WhyUs />
        <Circle />
        <VipFooter />
        <CartDrawer />
        <AccountModal />
      </div>
    </StoreProvider>
  )
}

export default App
