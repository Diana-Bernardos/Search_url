import React, { createContext, useContext, useState } from 'react';
import { 
    scrapeUrl, 
    preAnalyzeUrl, 
    removeProperty as removePropertyService 
} from '../services/scraperService';

const ScraperContext = createContext(null);

export const ScraperProvider = ({ children }) => {
    const [results, setResults] = useState(null);
    const [preAnalysis, setPreAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const analyzeUrl = async (url) => {
        setLoading(true);
        setError(null);
        try {
            // Validación y formateo de URL
            if (!url || typeof url !== 'string') {
                throw new Error('URL inválida. Debe ser una cadena de texto.');
            }

            // Asegurar que la URL tenga un protocolo
            const formattedUrl = url.match(/^https?:\/\//)
                ? url
                : `https://${url.replace(/^\/+/, '')}`;

            console.group('Análisis de URL');
            console.log('URL formateada:', formattedUrl);

            // Primero hacemos el pre-análisis
            const preAnalysisResult = await preAnalyzeUrl(formattedUrl);
            setPreAnalysis(preAnalysisResult);

            // Luego hacemos el análisis completo
            const response = await scrapeUrl(formattedUrl);

            const formattedResults = {
                data: {
                    url: formattedUrl,
                    properties: response.data?.properties || {},
                    aiRecommendation: response.data?.aiRecommendation || '',
                    preAnalysis: preAnalysisResult
                }
            };

            console.log('Resultados formateados:', formattedResults);
            console.groupEnd();

            setResults(formattedResults);

            return formattedResults;
        } catch (err) {
            console.error('Error completo en analyzeUrl:', err);
            setError(err.message || 'Error al analizar la URL');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeProperty = async (propertyId) => {
        try {
            await removePropertyService(propertyId);

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
        } catch (error) {
            console.error('Error al eliminar propiedad:', error);
            setError('Error al eliminar la propiedad');
            throw error;
        }
    };

    return (
        <ScraperContext.Provider
            value={{
                results,
                preAnalysis,
                loading,
                error,
                analyzeUrl,
                removeProperty,
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