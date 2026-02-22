import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WaitlistHero } from '@/components/ui/waitlist-hero'
import FloatingFoodHeroDemo from '@/components/ui/floating-food-hero-demo'
import { WordPullUpDemo } from '@/components/ui/word-pull-up-demo'

const demo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('demo') : null

const Root =
  demo === 'waitlist' ? WaitlistHero
  : demo === 'hero' ? () => <FloatingFoodHeroDemo />
  : demo === 'words' ? () => (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-8">
        <WordPullUpDemo />
      </div>
    )
  : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
