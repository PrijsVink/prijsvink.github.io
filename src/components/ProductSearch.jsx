import React, { useState, useEffect, useRef } from 'react'
import styles from './ProductSearch.module.css'
import { useInfiniteQuery } from '@tanstack/react-query'

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [origin, setOrigin] = useState('')
  const [freshOnly, setFreshOnly] = useState(false)
  const [activeSearch, setActiveSearch] = useState(null)
  const loadMoreRef = useRef(null)

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

  const fetchProducts = async ({ pageParam = 1, queryKey }) => {
    const [_, searchTerm, origin] = queryKey
    if (!searchTerm || !searchTerm.trim()) return { items: [], nextPage: null }

    const params = new URLSearchParams({
      q: searchTerm,
      page: pageParam.toString(),
      ...(origin && { origin }),
    })

    const url = `https://api.prijsvink.xyz/api/v1/products/cheapest?${params.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch product data')
    }

    const rawData = await response.json()
    const formattedData = rawData.data.map((p) => ({
      ...p,
      last_updated: p.last_updated ? p.last_updated.split('T')[0] : ''
    }))
    return {
      items: formattedData,
      nextPage: rawData.has_more ? pageParam + 1 : undefined
    }
  }

  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isFetching, 
    isFetched, 
    error 
  } = useInfiniteQuery({
    queryKey: ['products', activeSearch?.term, activeSearch?.origin],
    queryFn: fetchProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!activeSearch?.term,
    staleTime: 1000 * 60 * 5,
  })

  const products = data?.pages.flatMap((page) => page.items) || []

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) observer.observe(currentRef)

    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleExecuteSearch = (e) => {
    if (isFetching || !searchTerm.trim()) return
    
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

        <button 
          onClick={handleExecuteSearch} 
          className={styles.searchButton} 
          disabled={isFetching}
          aria-label="Search"
        >
          <svg 
            viewBox="0 0 24 24" 
            width="20" 
            height="20" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span className={styles.buttonText}>
            {isFetching && !isFetchingNextPage ? 'Searching...' : 'Search'}
          </span>
        </button>
      </div>

      {isFetching && !isFetchingNextPage && (
        <p>Searching products for "{activeSearch?.term}"...</p>
      )}
      {error && <p className={styles.errorMessage}>Error: {error.message}</p>}

      {products.length > 0 && (
        <>
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
              {products.map((item, index) => (
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

          <div ref={loadMoreRef} style={{ padding: '1rem', textAlign: 'center' }}>
            {isFetchingNextPage && <p>Loading more deals...</p>}
            {!hasNextPage && products.length > 0 && (
              <p style={{ color: '#666', fontSize: '0.875rem' }}>End of product results.</p>
            )}
          </div>
        </>
      )}

      {!isFetching && isFetched && products.length === 0 && !error && (
        <p className={styles.emptyMessage}>No products found for "{activeSearch?.term}".</p>
      )}
    </div>
  )
}