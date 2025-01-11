import React, { useState, useMemo } from 'react';
import { 
    Search, 
    XCircle, 
    Filter, 
    ArrowUpDown, 
    MinusCircle,
    Loader
} from 'lucide-react';
import { useScraper } from '../../../context/ScraperContext';
import './ResultsTable.css';

const ResultsTable = () => {
    const { results, loading, error, removeProperty } = useScraper();
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    // Log para debug
    console.log('Results en ResultsTable:', results);

    const tableData = useMemo(() => {
        // Modificamos esta parte para acceder a la estructura correcta
        if (!results?.data?.properties) {
            console.log('No hay propiedades en results');
            return [];
        }

        try {
            const properties = results.data.properties;
            return Object.entries(properties).flatMap(([key, value]) => {
                if (typeof value === 'object' && value !== null) {
                    return Object.entries(value).map(([subKey, subValue]) => ({
                        id: `${key}_${subKey}`,
                        property: `${key} - ${subKey}`,
                        value: String(subValue)
                    }));
                }
                return [{
                    id: key,
                    property: key,
                    value: String(value)
                }];
            });
        } catch (error) {
            console.error('Error al procesar datos:', error);
            return [];
        }
    }, [results]);

    const filteredData = useMemo(() => {
        return tableData.filter(item => {
            const searchMatch = !searchTerm || 
                item.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.value.toLowerCase().includes(searchTerm.toLowerCase());

            const filterMatch = Object.entries(filters).every(([key, value]) => {
                if (!value) return true;
                return String(item[key]).toLowerCase().includes(value.toLowerCase());
            });

            return searchMatch && filterMatch;
        });
    }, [tableData, searchTerm, filters]);

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = String(a[sortConfig.key]);
            const bValue = String(b[sortConfig.key]);

            if (aValue < bValue) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
    }, [filteredData, sortConfig]);

    const handleDelete = async (propertyId) => {
        try {
            if (window.confirm('¿Estás seguro de que deseas eliminar esta propiedad?')) {
                await removeProperty(propertyId);
                
                // Actualizar la UI removiendo la propiedad eliminada
                const updatedData = tableData.filter(item => item.id !== propertyId);
                tableData(updatedData);
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            // Mostrar error al usuario
            if (error.message.includes('no encontrada')) {
                alert('La propiedad ya no existe');
            } else {
                alert('Error al eliminar la propiedad. Por favor, intenta de nuevo.');
            }
        }
    };

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: 
                prevConfig.key === key && prevConfig.direction === 'asc' 
                    ? 'desc' 
                    : 'asc'
        }));
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    if (loading) {
        return (
            <div className="loading-container">
                <Loader />
                <p>Cargando resultados...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                {error}
            </div>
        );
    }

    if (!results?.data?.properties) {
        return (
            <div className="results-table-container">
                <div className="no-results">
                    No hay resultados disponibles
                </div>
            </div>
        );
    }

    return (
        <div className="results-table-container">
            <div className="table-header">
                <div className="search-filter">
                    <div className="search-box">
                        <Search />
                        <input
                            type="text"
                            placeholder="Buscar propiedades..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                <XCircle />
                            </button>
                        )}
                    </div>
                    
                    {(Object.keys(filters).length > 0 || searchTerm) && (
                        <button
                            className="clear-filters-button"
                            onClick={clearFilters}
                        >
                            <Filter />
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            <div className="table-wrapper">
                <table className="results-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('property')} role="columnheader">
                                <div className="th-content">
                                    Propiedad
                                    <ArrowUpDown className="sort-indicator" />
                                </div>
                            </th>
                            <th onClick={() => handleSort('value')} role="columnheader">
                                <div className="th-content">
                                    Valor
                                    <ArrowUpDown className="sort-indicator" />
                                </div>
                            </th>
                            <th>Acciones</th>
                        </tr>
                        <tr className="filter-row">
                            <th>
                                <input
                                    type="text"
                                    placeholder="Filtrar propiedad..."
                                    value={filters.property || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        property: e.target.value
                                    }))}
                                />
                            </th>
                            <th>
                                <input
                                    type="text"
                                    placeholder="Filtrar valor..."
                                    value={filters.value || ''}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        value: e.target.value
                                    }))}
                                />
                            </th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((item) => (
                            <tr key={item.id}>
                                <td className="truncated-cell" data-full-text={item.property}>
                                    {item.property}
                                </td>
                                <td className="truncated-cell" data-full-text={item.value}>
                                    {item.value}
                                </td>
                                <td>
                                    <button
                                        className="delete-button"
                                        onClick={() => handleDelete(item.id)}
                                        title="Eliminar propiedad"
                                    >
                                        <MinusCircle />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {sortedData.length === 0 && (
                            <tr>
                                <td colSpan="3" className="no-results">
                                    No se encontraron resultados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResultsTable;