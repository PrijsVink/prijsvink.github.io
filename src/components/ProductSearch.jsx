import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import styles from './ProductSearch.module.css'

const supermarkets = [
  { id: 'ah_nl', name: 'Albert Heijn' },
  { id: 'jm_nl', name: 'Jumbo' },
  { id: 'lidl_nl', name: 'Lidl' },
  { id: 'aldi_nl', name: 'Aldi' },
  { id: 'dekamarkt_nl', name: 'DekaMarkt' },
  { id: 'hoogvliet_nl', name: 'Hoogvliet' },
  { id: 'dirk_nl', name: 'Dirk' },
  { id: 'spar_nl', name: 'SPAR' },
]

const supermarketMap = Object.fromEntries(
  supermarkets.map((store) => [store.id, store.name]),
)

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSearch, setActiveSearch] = useState(null)

  const [selectedRetailers, setSelectedRetailers] = useState(
    () => new Set(supermarkets.map((store) => store.id)),
  )

  const loadMoreRef = useRef(null)

  const allSelected = selectedRetailers.size === supermarkets.length

  const fetchProducts = async ({ pageParam = 1, queryKey }) => {
    const [, searchTerm] = queryKey

    if (!searchTerm?.trim()) {
      return { items: [], nextPage: null }
    }

    const params = new URLSearchParams({
      q: searchTerm,
      page: pageParam.toString(),
      retailers: activeSearch?.retailers.join(',')
    })

    const url =
      `https://api.prijsvink.xyz/api/v1/products/cheapest?${params.toString()}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch product data')
    }

    const rawData = await response.json()

    const formattedData = rawData.data.map((product) => ({
      ...product,
      last_updated: product.last_updated
        ? product.last_updated.split('T')[0]
        : '',
    }))

    return {
      items: formattedData,
      nextPage: rawData.has_more ? pageParam + 1 : undefined,
    }
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isFetched,
    error,
  } = useInfiniteQuery({
    queryKey: ['products', activeSearch?.term, activeSearch?.retailers],
    queryFn: fetchProducts,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!activeSearch?.term,
    staleTime: 1000 * 60 * 5,
  })

  const products = data?.pages.flatMap((page) => page.items) || []

  const filteredProducts = products.filter((product) =>
    selectedRetailers.has(product.retailer),
  )

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.5 },
    )

    const currentRef = loadMoreRef.current

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const toggleRetailer = (retailerId) => {
    setSelectedRetailers((current) => {
      const next = new Set(current)

      if (next.has(retailerId)) {
        next.delete(retailerId)
      } else {
        next.add(retailerId)
      }

      return next
    })
  }

  const toggleAllRetailers = () => {
    setSelectedRetailers(
      allSelected
        ? new Set()
        : new Set(supermarkets.map((store) => store.id)),
    )
  }

  const handleExecuteSearch = (event) => {
    event?.preventDefault()

    if (
      isFetching ||
      !searchTerm.trim() ||
      selectedRetailers.size === 0
    ) {
      return
    }

    const retailers = [...selectedRetailers].sort()
    setActiveSearch({
      term: searchTerm.trim(),
      retailers,
    })
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''

    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className={styles.container}>
      <form
        className={styles.searchForm}
        onSubmit={handleExecuteSearch}
      >
        <div className={styles.inputGroup}>
          <input
            type="search"
            value={searchTerm}
            placeholder="Zoek bijvoorbeeld melk, koffie of aardappelen"
            onChange={(event) => setSearchTerm(event.target.value)}
            className={styles.searchInput}
            aria-label="Zoek product"
          />

          <button
            type="submit"
            className={styles.searchButton}
            disabled={
              isFetching ||
              !searchTerm.trim() ||
              selectedRetailers.size === 0
            }
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
              <line
                x1="21"
                y1="21"
                x2="16.65"
                y2="16.65"
              />
            </svg>

            <span className={styles.buttonText}>
              {isFetching && !isFetchingNextPage
                ? 'Zoeken...'
                : 'Zoeken'}
            </span>
          </button>
        </div>

        <div className={styles.retailerFilter}>
          <div className={styles.filterHeader}>
            <span>
              Zoek in supermarkten
              <span className={styles.selectedCount}>
                {selectedRetailers.size}/{supermarkets.length}
              </span>
            </span>

            <button
              type="button"
              className={styles.selectAllButton}
              onClick={toggleAllRetailers}
            >
              {allSelected ? 'Alles wissen' : 'Alles selecteren'}
            </button>
          </div>

          <div className={styles.retailerGrid}>
            {supermarkets.map((store) => {
              const selected = selectedRetailers.has(store.id)

              return (
                <label
                  key={store.id}
                  className={`${styles.retailerChip} ${
                    selected ? styles.retailerChipSelected : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleRetailer(store.id)}
                    className={styles.retailerCheckbox}
                  />

                  <span
                    className={styles[`${store.id}_logo`]}
                    aria-hidden="true"
                  />

                  <span className={styles.visuallyHidden}>
                    {store.name}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      </form>

      {isFetching && !isFetchingNextPage && (
        <p className={styles.statusMessage}>
          Producten zoeken voor "{activeSearch?.term}"...
        </p>
      )}

      {error && (
        <p className={styles.errorMessage}>
          Er ging iets mis: {error.message}
        </p>
      )}

      {filteredProducts.length > 0 && (
        <>
          <table className={styles.resultsTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.tableCell}>Product</th>
                <th className={styles.tableCell}>Winkel</th>
                <th className={styles.tableCell}>Prijs</th>
                <th className={styles.tableCell}>Bijgewerkt</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={styles.tableRow}
                >
                  <td className={styles.tableCell}>
                    <span>
                      {item.title +
                        (item.retailer !== 'jm_nl'
                          ? ` ${item.unit_size || ''}`
                          : '')}
                    </span>

                    {item.is_bonus &&
                      item.value_note?.length > 0 && (
                        <span
                          className={styles.bonusBadge}
                          title={item.value_note}
                        >
                          {item.value_note}
                        </span>
                      )}
                  </td>

                  <td className={styles.storeCell}>
                    <span
                      className={
                        styles[`${item.retailer}_logo`]
                      }
                      aria-label={
                        supermarketMap[item.retailer]
                      }
                      role="img"
                    />
                  </td>

                  <td className={styles.numericCell}>
                    <span className={styles.priceTag}>
                      €{item.lowest_price}
                    </span>
                  </td>

                  <td className={styles.numericCell}>
                    {formatDate(item.last_updated)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div
            ref={loadMoreRef}
            className={styles.loadMore}
          >
            {isFetchingNextPage && (
              <p>Meer aanbiedingen laden...</p>
            )}

            {!hasNextPage && filteredProducts.length > 0 && (
              <p>Einde van de resultaten.</p>
            )}
          </div>
        </>
      )}

      {!isFetching &&
        isFetched &&
        filteredProducts.length === 0 &&
        !error && (
          <p className={styles.emptyMessage}>
            Geen producten gevonden voor "
            {activeSearch?.term}" in de geselecteerde
            supermarkten.
          </p>
        )}
    </div>
  )
}