import { useState } from 'react'
import MainMenu from './components/MainMenu'
import LevelSelect from './components/LevelSelect'
import GamePlay from './components/GamePlay'
import { getFirstLevel } from './game/LevelRegistry'
import './App.css'

type Page = 'menu' | 'level-select' | 'game'

function App() {
  const [page, setPage] = useState<Page>('menu')
  const [selectedLevelId, setSelectedLevelId] = useState(() => getFirstLevel().id)

  const openLevel = (levelId: string) => {
    setSelectedLevelId(levelId)
    setPage('game')
  }

  if (page === 'menu') {
    return <MainMenu onStart={() => setPage('level-select')} />
  }

  if (page === 'level-select') {
    return (
      <LevelSelect
        onBack={() => setPage('menu')}
        onSelectLevel={openLevel}
      />
    )
  }

  return (
    <GamePlay
      levelId={selectedLevelId}
      onBackToLevelSelect={() => setPage('level-select')}
      onSelectLevel={openLevel}
    />
  )
}

export default App
