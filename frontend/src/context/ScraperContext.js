
// src/context/ScraperContext.js
import React, { createContext, useContext, useState } from 'react';
import {scrapeUrl, getHistory} from '../api/scraper';
import axios from '../api/axios';

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
      const data = await scrapeUrl(url); // Usa la función importada
      const formattedData = {
        data: {
          properties: data.properties || {} // Accede a las propiedades de la respuesta
        }
      };
      setResults(formattedData);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error al analizar la URL'); // Manejo mejorado de errores
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistory();
      setHistory(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };



  const removeProperty = async (propertyId) => {
    try {
        await axios.delete(`/scraper/property/${propertyId}`);
        
        // Actualizar el estado local
        setResults(prevResults => {
            if (!prevResults?.data?.properties) return prevResults;

            const newProperties = { ...prevResults.data.properties };
            delete newProperties[propertyId];

            return {
                ...prevResults,
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
        history,
        loading,
        error,
        analyzeUrl,
        fetchHistory,
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