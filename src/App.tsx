import { useState, useEffect } from 'react'
import MainMenu from './components/MainMenu'
import LevelSelect from './components/LevelSelect'
import GamePlay from './components/GamePlay'
import AudioSettings from './components/AudioSettings'
import { audioManager } from './audio/AudioManager'
import { getFirstLevel } from './game/LevelRegistry'
import './App.css'

type Page = 'menu' | 'level-select' | 'game'

function App() {
  const [page, setPage] = useState<Page>('menu')
  const [selectedLevelId, setSelectedLevelId] = useState(() => getFirstLevel().id)

  // 启动 BGM（等用户第一次交互后播放）
  useEffect(() => {
    audioManager.initBgmOnUserInteraction()
  }, [])

  const openLevel = (levelId: string) => {
    setSelectedLevelId(levelId)
    setPage('game')
  }

  return (
    <>
      <AudioSettings />
      {page === 'menu' && <MainMenu onStart={() => setPage('level-select')} />}
      {page === 'level-select' && (
        <LevelSelect
          onBack={() => setPage('menu')}
          onSelectLevel={openLevel}
        />
      )}
      {page === 'game' && (
        <GamePlay
          levelId={selectedLevelId}
          onBackToLevelSelect={() => setPage('level-select')}
          onSelectLevel={openLevel}
        />
      )}
    </>
  )
}

export default App
