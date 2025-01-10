// src/pages/Dashboard/index.jsx
import React, { useState } from 'react';
import { useScraper } from '../../context/ScraperContext';
import ResultsTable from '../../components/scraper/ResultsTable';
import { Search } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const [url, setUrl] = useState('');
    const { analyzeUrl, loading, error } = useScraper();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await analyzeUrl(url);
        } catch (err) {
            console.error('Error:', err);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>Analizador de URLs</h1>
                <p className="dashboard-description">
                    Ingresa una URL para analizar su contenido y metadatos
                </p>
            </div>

            <div className="search-section">
                <form onSubmit={handleSubmit} className="search-form">
                    <div className="input-wrapper">
                        <Search className="search-icon" size={20} />
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://ejemplo.com"
                            required
                            className="url-input"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-text">
                                <span className="loading-dots">Analizando</span>
                            </span>
                        ) : (
                            'Analizar URL'
                        )}
                    </button>
                </form>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}
            </div>

            <div className="results-section">
                <ResultsTable />
            </div>
        </div>
    );
};

export default Dashboard;