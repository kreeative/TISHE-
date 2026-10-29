import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Campaign from './components/Campaign'
import Collection from './components/Collection'
import Reviews from './components/Reviews'
import LengthGuide from './components/LengthGuide'
import WhyUs from './components/WhyUs'
import Circle from './components/Circle'
import Contact from './components/Contact'
import Quiz from './components/Quiz'
import ProductPage from './components/ProductPage'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import AccountPage from './components/AccountPage'
import PolicyPage from './components/PolicyPage'
import OrderConfirmed from './components/OrderConfirmed'
import PageTransition from './components/PageTransition'
import WelcomePopup from './components/WelcomePopup'
import AnnouncementBar from './components/AnnouncementBar'
import { StoreProvider } from './components/StoreContext'
import { initAnalytics, trackPageView } from './lib/analytics'

// the dashboard is only downloaded by whoever opens it
const AdminApp = lazy(() => import('./admin/AdminApp'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

// Loads the pixels once, then reports every hash route as its own page view.
function Analytics() {
  const { pathname } = useLocation()
  useEffect(() => {
    initAnalytics()
  }, [])
  useEffect(() => {
    trackPageView(pathname)
  }, [pathname])
  return null
}

function HomePage() {
  return (
    <>
      <Hero />
      <Campaign />
      <Collection />
      <Reviews />
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
      <Reviews />
      <LengthGuide />
    </>
  )
}

function CirclePage() {
  return <Circle />
}

function ContactPage() {
  return <Contact />
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
        <Route path="/account" element={<PageTransition><AccountPage /></PageTransition>} />
        <Route path="/legal/:handle" element={<PageTransition><PolicyPage /></PageTransition>} />
        <Route path="/order/confirmed" element={<PageTransition><OrderConfirmed /></PageTransition>} />
        <Route path="/products/:handle" element={<PageTransition><ProductPage /><Reviews /></PageTransition>} />
        <Route path="*" element={<PageTransition><HomePage /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  )
}

// The shop, with its header and footer; or the dashboard on its own.
function Shell() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    )
  }
  return (
    <>
      <Analytics />
      <div className="min-h-screen bg-[#FAF7F3] tracking-[-0.02em] flex flex-col" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <AnnouncementBar />
        <Nav />
        <main className="pt-[100px] sm:pt-[108px] flex-1">
          <AnimatedRoutes />
        </main>
        <Footer />
        <CartDrawer />
        <WelcomePopup />
      </div>
    </>
  )
}

function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollToTop />
        <Shell />
      </HashRouter>
    </StoreProvider>
  )
}

export default App
