import { useState } from 'react'
import brandImg from './assets/brand-logo.png'
import './App.css'
import ProductSearch from './components/ProductSearch';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section class="brand-intro">
        <img
          class="brand-logo"
          src={brandImg}
          alt="PrijsVink"
        />

        <h1 class="brand-name">PrijsVink</h1>

        <p class="brand-tagline">
          From every cent to every centilitre, there’s a smarter choice
          for every shopper.
        </p>
      </section>
      <section id="center">
        <div>
          <p>Let's try it out</p>
        </div>
        <div>
          <ProductSearch />
        </div>
      </section>

      <section id="spacer"></section>
    </>
  )
}

export default App
