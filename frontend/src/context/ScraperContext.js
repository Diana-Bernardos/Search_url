// src/context/ScraperContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { 
    scrapeUrl as scrapeUrlService,
    getScrapingHistory,
    deleteProperty
} from '../services/scraperService';

const ScraperContext = createContext(null);

export const ScraperProvider = ({ children }) => {
    const [results, setResults] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeUrl = async (url) => {
        setLoading(true);
        setError(null);
        try {
            const response = await scrapeUrlService(url);
            
            // Formatear los resultados
            const formattedResults = {
                data: {
                    url: url,
                    properties: response.properties || {}
                }
            };
            
            setResults(formattedResults);
            return formattedResults;
        } catch (err) {
            console.error('Error en analyzeUrl:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await getScrapingHistory();
            setHistory(data);
            return data;
        } catch (err) {
            console.error('Error al obtener historial:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeProperty = async (propertyId) => {
        try {
            await deleteProperty(propertyId);
            
            // Actualizar el estado local
            setResults(prevResults => {
                if (!prevResults?.data?.properties) return prevResults;
                
                const newProperties = { ...prevResults.data.properties };
                delete newProperties[propertyId];
                
                return {
                    data: {
                        ...prevResults.data,
                        properties: newProperties
                    }
                };
            });
        } catch (err) {
            console.error('Error al eliminar propiedad:', err);
            setError(err.message);
            throw err;
        }
    };

    const clearResults = () => {
        setResults(null);
        setError(null);
    };

    return (
        <ScraperContext.Provider
            value={{
                results,
                history,
                loading,
                error,
                analyzeUrl,
                fetchHistory,
                removeProperty,
                clearResults,
                setError
            }}
        >
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