import React, { useState } from 'react';
import styles from './ProductSearch.module.css';

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [origin, setOrigin] = useState('');
  const [freshOnly, setFreshOnly] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const fetchProducts = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: searchTerm,
        ...(origin && { origin }),
        ...(freshOnly && { fresh_only: 'true' }),
      })
      const url = `https://0x2d19ed1571399daed3783441d1ddb16e54ade11e.diode.link/api/v1/products/cheapest?${params.toString()}`
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch product data');
      }

      const data = (await response.json()).map((p) => {
        const parsed = p.last_updated.split('T')
        p.last_updated = parsed[0]
        return p
      });
      setProducts(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (loading) return
      fetchProducts();
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className={styles.container}>
      {/* Input Group */}
      <div className={styles.inputGroup}>
        <input
          type="text"
          value={searchTerm}
          placeholder="Enter product (e.g., aardbeien)"
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
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

        <button onClick={fetchProducts} className={styles.searchButton}>
          Search
        </button>
      </div>

      {/* <label className={styles.checkboxLabel}>
        <input 
          type="checkbox" 
          checked={freshOnly} 
          onChange={(e) => setFreshOnly(e.target.checked)} 
        />
        Fresh items only
      </label> */}

      {/* Loading & Error States */}
      {loading && <p>Searching products for "{searchTerm}"...</p>}
      {error && <p className={styles.errorMessage}>Error: {error}</p>}

      {/* Results Table */}
      {!loading && products.length > 0 && (
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
                  <span>{item.title + (item.retailer !== 'jm_nl' ? ' ' + item.unit_size : '')}</span>
                  {item.value_note === 'bonus' && (
                    <span className={styles.bonusBadge}>
                      {'Bonus'}
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

      {!loading && products.length === 0 && searchTerm && !error && (
        <p className={styles.emptyMessage}>No products found. Press Enter to search.</p>
      )}
    </div>
  );
}