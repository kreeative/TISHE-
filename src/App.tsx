import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Campaign from './components/Campaign'
import Collection from './components/Collection'
import LengthGuide from './components/LengthGuide'
import WhyUs from './components/WhyUs'
import Circle from './components/Circle'
import Vip from './components/Vip'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import AccountModal from './components/AccountModal'
import { StoreProvider } from './components/StoreContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function HomePage() {
  return (
    <>
      <Hero />
      <Campaign />
      <Collection />
    </>
  )
}

function OurHairPage() {
  return <WhyUs />
}

function CollectionsPage() {
  return (
    <>
      <Collection />
      <LengthGuide />
    </>
  )
}

function CirclePage() {
  return <Circle />
}

function ContactPage() {
  return <Vip />
}

function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-[#FFF8F2] tracking-[-0.02em] flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <Nav />
          <main className="pt-16 sm:pt-[72px] flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/our-hair" element={<OurHairPage />} />
              <Route path="/collections" element={<CollectionsPage />} />
              <Route path="/circle" element={<CirclePage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>
          <Footer />
          <CartDrawer />
          <AccountModal />
        </div>
      </HashRouter>
    </StoreProvider>
  )
}

export default App
