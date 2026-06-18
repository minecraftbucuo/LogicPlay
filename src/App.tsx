import { useState } from 'react'
import MainMenu from './components/MainMenu'
import GamePlay from './components/GamePlay'
import './App.css'

type Page = 'menu' | 'game'

function App() {
  const [page, setPage] = useState<Page>('menu')

  if (page === 'menu') {
    return <MainMenu onStart={() => setPage('game')} />
  }

  return <GamePlay onBackToMenu={() => setPage('menu')} />
}

export default App
