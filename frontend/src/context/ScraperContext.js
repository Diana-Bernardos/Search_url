// src/context/ScraperContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { 
    scrapeUrl as analyzeUrlService,
    getHistorialBusquedas,
    eliminarPropiedad,
    guardarBusqueda
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
            console.log('Iniciando análisis de URL:', url);
            const response = await analyzeUrlService(url);
            
            const formattedResults = {
                data: {
                    properties: response.properties || {},
                    url: url  // Guardamos la URL también
                }
            };
            
            console.log('Resultados formateados:', formattedResults);
            setResults(formattedResults);
            
            return formattedResults;
        } catch (err) {
            console.error('Error en analyzeUrl:', err);
            setError(err.message || 'Error al analizar la URL');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await getHistorialBusquedas();
            setHistory(data);
            return data;
        } catch (err) {
            console.error('Error al obtener historial:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const removeProperty = async (propertyId) => {
        try {
            await eliminarPropiedad(propertyId);
            setResults(prevResults => {
                if (!prevResults?.data?.properties) {
                    console.log('No hay propiedades para eliminar');
                    return prevResults;
                }
                
                const newProperties = { ...prevResults.data.properties };
                delete newProperties[propertyId];
                
                console.log('Propiedades actualizadas después de eliminar:', newProperties);
                
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

    const saveSearch = async () => {
        try {
            if (!results?.data?.properties) {
                throw new Error('No hay resultados para guardar');
            }

            setLoading(true);
            await guardarBusqueda({
                url: results.data.url,
                properties: results.data.properties
            });

            await fetchHistory();
            return true;
        } catch (error) {
            console.error('Error al guardar búsqueda:', error);
            setError(error.message || 'Error al guardar la búsqueda');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (results) {
            console.log('Estado actual de results:', results);
        }
    }, [results]);

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
                saveSearch,
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