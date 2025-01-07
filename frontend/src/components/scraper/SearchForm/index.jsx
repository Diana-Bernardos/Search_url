// src/components/scraper/SearchForm/index.js
import React, { useState } from 'react';
import { Search, Link2 } from 'lucide-react';
import './SearchForm.css';

const SearchForm = ({ onSubmit, loading }) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    if (value) {
      setIsValidUrl(validateUrl(value));
    } else {
      setIsValidUrl(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateUrl(url)) {
      onSubmit(url);
    } else {
      setIsValidUrl(false);
    }
  };

  return (
    <div className="search-form-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-wrapper">
          <Link2 
            className="url-icon"
            size={20}
          />
          <input
            type="url"
            value={url}
            onChange={handleChange}
            placeholder="Ingresa la URL del sitio web (ej: https://ejemplo.com)"
            className={`search-input ${!isValidUrl ? 'invalid' : ''}`}
            required
          />
          {!isValidUrl && (
            <span className="validation-message">
              Por favor, ingresa una URL válida
            </span>
          )}
        </div>

        <button
          type="submit"
          className={`search-button ${loading ? 'loading' : ''}`}
          disabled={loading || !isValidUrl}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              <span>Analizando...</span>
            </>
          ) : (
            <>
              <Search size={20} />
              <span>Analizar URL</span>
            </>
          )}
        </button>
      </form>

      <div className="search-tips">
        <h3>Tips para el análisis:</h3>
        <ul>
          <li>Asegúrate de incluir el protocolo (http:// o https://)</li>
          <li>Verifica que la URL sea accesible públicamente</li>
          <li>Algunos sitios pueden requerir más tiempo de análisis</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchForm;