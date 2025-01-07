// src/pages/Dashboard/index.jsx
import React from 'react';
import { useScraper } from '../../context/ScraperContext';
import SearchForm from '../../components/scraper/SearchForm';
import ResultsTable from '../../components/scraper/ResultsTable';
import './Dashboard.css';

const Dashboard = () => {
  const { results, loading, error, analyzeUrl, removeProperty } = useScraper();

  return (
    <div className="dashboard-container">
      <SearchForm onSubmit={analyzeUrl} loading={loading} />
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading && (
        <div className="loading-message">
          Analizando URL...
        </div>
      )}

      {results && results.data && (
        <div className="results-section">
          <ResultsTable
            results={results.data}
            onDeleteProperty={removeProperty}
          />
        </div>
      )}
    </div>
  );
};
export default Dashboard;