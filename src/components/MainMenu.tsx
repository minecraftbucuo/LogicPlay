// 主菜单页面（占位，后续步骤完善）

function MainMenu({ onStart }: { onStart: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a1a',
      color: '#e0e0e0',
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '8px', color: '#00d4ff' }}>LogicPlay</h1>
      <p style={{ fontSize: '18px', marginBottom: '40px', color: '#888' }}>边玩边学算法</p>
      <button
        onClick={onStart}
        style={{
          padding: '14px 48px',
          fontSize: '20px',
          background: '#00d4ff',
          color: '#0a0a1a',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        开始游戏
      </button>
    </div>
  )
}

export default MainMenu
