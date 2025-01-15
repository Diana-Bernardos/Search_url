// src/pages/Dashboard/index.jsx
import React, { useState } from 'react';
import { useScraper } from '../../context/ScraperContext';
import ResultsTable from '../../components/scraper/ResultsTable';
import { Search } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
    const [url, setUrl] = useState('');
    const { analyzeUrl, loading, error } = useScraper();
    const [localError, setLocalError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(null);

        // Validar URL
        if (!url.trim()) {
            setLocalError('Por favor, ingresa una URL');
            return;
        }

        // Procesar URL
        try {
            let processedUrl = url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                processedUrl = `https://${url}`;
            }

            await analyzeUrl(processedUrl);
        } catch (err) {
            console.error('Error:', err);
            setLocalError(err.message || 'Error al analizar la URL');
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
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Ingresa una URL (ej: https://example.com)"
                            className="url-input"
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={loading || !url.trim()}
                    >
                        {loading ? (
                            <span className="loading-text">Analizando...</span>
                        ) : (
                            'Analizar URL'
                        )}
                    </button>
                </form>

                {(localError || error) && (
                    <div className="error-message">
                        {localError || error}
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