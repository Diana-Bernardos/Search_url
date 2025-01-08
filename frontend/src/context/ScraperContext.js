// src/context/ScraperContext.js
import React, { createContext, useContext, useState } from 'react';
import axios from '../api/axios';

const ScraperContext = createContext(null);

export const ScraperProvider = ({ children }) => {
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeUrl = async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('/scraper', { url });
            setResults(response.data);
            return response.data;
        } catch (err) {
            setError(err.response?.data?.error || 'Error al analizar URL');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScraperContext.Provider value={{
            results,
            loading,
            error,
            analyzeUrl
        }}>
            {children}
        </ScraperContext.Provider>
    );
};

export const useScraper = () => {
    const context = useContext(ScraperContext);
    if (!context) {
        throw new Error('useScraper debe usarse dentro de ScraperProvider');
    }
    return context;
};