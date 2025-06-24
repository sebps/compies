import { useState } from 'react'
import { HalfCircleButton } from './components/HalfCircleButton/HalfCircleButton'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <h1>COMPIES</h1>
        <div className="card">
          <HalfCircleButton />
        </div>
        <div className="card">
          <HalfCircleButton mode="material" color='#fefefe'/>
        </div>
        <div className="card">
          <HalfCircleButton mode="outlined"/>
        </div>
        <div className="card">
          <HalfCircleButton mode="outlined">
            Test
          </HalfCircleButton>
        </div>
      </div>
    </>
  )
}

export default App
