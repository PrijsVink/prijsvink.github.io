import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import brandImg from './assets/brand-logo.png'
import './App.css'
import ProductSearch from './components/ProductSearch'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section className="brand-intro">
        <img
          className="brand-logo"
          src={brandImg}
          alt="PrijsVink"
        />

        <h1 className="brand-name">PrijsVink</h1>

        <p className="brand-tagline">
          From every cent to every centilitre, there’s a smarter choice
          for every shopper.
        </p>
      </section>
      <section id="center">
        <div>
          <p>Let's try it out</p>
        </div>
        <div>
          <QueryClientProvider client={queryClient}>
            <ProductSearch />
          </QueryClientProvider>
        </div>
      </section>

      <section id="spacer"></section>
    </>
  )
}

export default App
