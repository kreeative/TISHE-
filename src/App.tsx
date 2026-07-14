import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Campaign from './components/Campaign'
import Collection from './components/Collection'
import LengthGuide from './components/LengthGuide'
import WhyUs from './components/WhyUs'
import Circle from './components/Circle'
import Vip from './components/Vip'
import Quiz from './components/Quiz'
import ProductPage from './components/ProductPage'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import AccountModal from './components/AccountModal'
import PageTransition from './components/PageTransition'
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

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
        <Route path="/our-hair" element={<PageTransition><OurHairPage /></PageTransition>} />
        <Route path="/collections" element={<PageTransition><CollectionsPage /></PageTransition>} />
        <Route path="/circle" element={<PageTransition><CirclePage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />
        <Route path="/quiz" element={<PageTransition><Quiz /></PageTransition>} />
        <Route path="/products/:handle" element={<PageTransition><ProductPage /></PageTransition>} />
        <Route path="*" element={<PageTransition><HomePage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="min-h-screen bg-[#FAF7F3] tracking-[-0.02em] flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <Nav />
          <main className="pt-16 sm:pt-[72px] flex-1">
            <AnimatedRoutes />
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
