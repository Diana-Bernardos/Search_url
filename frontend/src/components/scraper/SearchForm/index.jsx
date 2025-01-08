// src/components/scraper/SearchForm/index.jsx
import React, { useState } from 'react';
import axios from '../../../api/axios';

const SearchForm = ({ onSubmit }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/scraper/scrape', { url });
      
      if (response.data) {
        onSubmit(response.data);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.error || 'Error al analizar la URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="input-group">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Introduce una URL para analizar"
          required
          className="search-input"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="search-button"
        >
          {loading ? 'Analizando...' : 'Analizar URL'}
        </button>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </form>
  );
};

export default SearchForm;