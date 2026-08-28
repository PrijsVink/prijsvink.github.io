import React, { useState } from 'react'
import styles from './ProductSearch.module.css'
import { useQuery } from '@tanstack/react-query'

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [origin, setOrigin] = useState('')
  const [freshOnly, setFreshOnly] = useState(false)

  const supermarketMap = {
    ah_nl: 'Albert Heijn',
    jm_nl: 'Jumbo',
    aldi_nl: 'Aldi',
    lidl_nl: 'Lidl',
    dekamarkt_nl: 'DekaMarkt',
    spar_nl: 'Spar',
    hoogvliet_nl: 'Hoogvliet',
    dirk_nl: 'Dirk',
  }

  const fetchProducts = async (searchTerm, origin) => {
    const params = new URLSearchParams({
      q: searchTerm,
      ...(origin && { origin }),
    })

    const url = `https://api.prijsvink.xyz/api/v1/products/cheapest?${params.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch product data')
    }

    const rawData = await response.json()
    return rawData.map((p) => ({
      ...p,
      last_updated: p.last_updated ? p.last_updated.split('T')[0] : ''
    }))
  }

  const [activeSearch, setActiveSearch] = useState(null)

  const { 
    data: products = [], 
    isFetching, 
    isFetched, 
    error 
  } = useQuery({
    queryKey: ['products', activeSearch?.term, activeSearch?.origin],
    queryFn: () => fetchProducts(activeSearch.term, activeSearch.origin),
    enabled: !!activeSearch?.term,
    staleTime: 1000 * 60 * 5,
  })

  const handleClick = (e) => {
    if (isFetching) return
    if (!searchTerm.trim()) return
    
    setActiveSearch({
      term: searchTerm,
      origin
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={searchTerm}
          placeholder="Enter product (e.g., aardbeien)"
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          className={styles.selectFilter}
        >
          <option value="">All Origins</option>
          <option value="holland">Holland Only</option>
        </select>

        <button onClick={handleClick} className={styles.searchButton} disabled={isFetching}>
          {isFetching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {isFetching && <p>Searching products for "{searchTerm}"...</p>}
      {error && <p className={styles.errorMessage}>Error: {error.message}</p>}

      {!isFetching && products.length > 0 && (
        <table className={styles.resultsTable}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.tableCell}>Product</th>
              <th className={styles.tableCell}>Store</th>
              <th className={styles.tableCell}>Price</th>
              <th className={styles.tableCell}>Updated</th>
            </tr>
          </thead>
          <tbody>
            {products.slice(0, 10).map((item, index) => (
              <tr key={item.id || index} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <span>{item.title + (item.retailer !== 'jm_nl' ? ' ' + (item.unit_size || '') : '')}</span>
                  {item.is_bonus && item.value_note?.length > 0 && (
                    <span className={styles.bonusBadge} title={item.value_note}>
                      {item.value_note}
                    </span>
                  )}
                </td>
                <td className={styles.storeCell}>
                  <span className={styles[item.retailer + '_logo']} aria-label={supermarketMap[item.retailer]} role="img" />
                </td>
                <td className={styles.numericCell}>
                  <span className={styles.priceTag}>€{item.lowest_price}</span>
                </td>
                <td className={styles.numericCell}>
                  {formatDate(item.last_updated)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!isFetching && products.length === 0 && searchTerm && !error && (
        <p className={styles.emptyMessage}>No products found. Press Enter or click Search.</p>
      )}
    </div>
  )
}