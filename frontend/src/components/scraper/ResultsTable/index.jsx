import React, { useState, useMemo } from 'react';
import { FaEye } from 'react-icons/fa';
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
    const { results, loading, error, removeProperty, preAnalysis } = useScraper();
    const [filters, setFilters] = useState({
        property: '',
        value: '',
        minPrice: '',
        maxPrice: '',
        rooms: '',
        location: ''
    });
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: 'asc'
    });

    const tableData = useMemo(() => {
        if (!results?.data?.properties) return [];

        try {
            const properties = results.data.properties;
            const data = [];

            // Estrategias de procesamiento de datos
            const processingStrategies = {
                'Precio': (value) => {
                    const price = parseFloat(value.replace(/[^\d.]/g, ''));
                    return { 
                        id: 'price', 
                        property: 'Precio', 
                        value: price ? `${price.toLocaleString()}€` : 'No especificado',
                        numericValue: price || 0
                    };
                },
                'Habitaciones': (value) => ({
                    id: 'rooms',
                    property: 'Habitaciones', 
                    value: value,
                    numericValue: parseInt(value) || 0
                }),
                'Ubicación': (value) => ({
                    id: 'location',
                    property: 'Ubicación',
                    value: value
                })
            };

            // Procesar datos con estrategias específicas
            Object.entries(properties).forEach(([key, value]) => {
                const strategy = processingStrategies[key];
                if (strategy) {
                    data.push(strategy(value));
                } else {
                    data.push({
                        id: key,
                        property: key,
                        value: String(value)
                    });
                }
            });

            // Añadir recomendación de IA
            if (results.data.aiRecommendation) {
                data.push({
                    id: 'ai_recommendation',
                    property: 'Recomendación IA',
                    value: results.data.aiRecommendation,
                    expanded: true // Nueva propiedad para expandir
                });
            }

            return data;
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

            // Filtros específicos
            const filterMatch = Object.entries(filters).every(([key, value]) => {
                if (!value) return true;

                switch(key) {
                    case 'minPrice':
                        return item.id === 'price' ? 
                            item.numericValue >= parseFloat(value) : true;
                    case 'maxPrice':
                        return item.id === 'price' ? 
                            item.numericValue <= parseFloat(value) : true;
                    case 'rooms':
                        return item.id === 'rooms' ? 
                            item.numericValue === parseInt(value) : true;
                    case 'location':
                        return item.id === 'location' ? 
                            item.value.toLowerCase().includes(value.toLowerCase()) : true;
                    default:
                        return String(item[key]).toLowerCase().includes(value.toLowerCase());
                }
            });

            return searchMatch && filterMatch;
        });
    }, [tableData, searchTerm, filters]);

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a.numericValue !== undefined ? a.numericValue : a.value;
            const bValue = b.numericValue !== undefined ? b.numericValue : b.value;

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
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar la propiedad. Por favor, intenta de nuevo.');
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
        setFilters({
            property: '',
            value: '',
            minPrice: '',
            maxPrice: '',
            rooms: '',
            location: ''
        });
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
            <div className="filters-section">
                <div className="price-filters">
                    <input
                        type="number"
                        placeholder="Precio mínimo"
                        value={filters.minPrice}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            minPrice: e.target.value
                        }))}
                    />
                    <input
                        type="number"
                        placeholder="Precio máximo"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            maxPrice: e.target.value
                        }))}
                    />
                </div>
                <div className="rooms-filter">
                    <select
                        value={filters.rooms}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            rooms: e.target.value
                        }))}
                    >
                        <option value="">Habitaciones</option>
                        <option value="1">1 Habitación</option>
                        <option value="2">2 Habitaciones</option>
                        <option value="3">3 Habitaciones</option>
                        <option value="4">4+ Habitaciones</option>
                    </select>
                </div>
                <input
                    type="text"
                    placeholder="Filtrar por ubicación"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({
                        ...prev,
                        location: e.target.value
                    }))}
                />
            </div>

            {Object.entries(filters).some(([key, value]) => value) && (
                <div className="applied-filters">
                    {Object.entries(filters)
                        .filter(([key, value]) => value)
                        .map(([key, value]) => (
                            <div key={key} className="applied-filter-tag">
                                {key}: {value}
                                <span 
                                    className="remove-filter" 
                                    onClick={() => setFilters(prev => ({...prev, [key]: ''}))}
                                >
                                    <XCircle size={16} />
                                </span>
                            </div>
                        ))
                    }
                </div>
            )}

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
                    
                    {(Object.keys(filters).some(key => filters[key]) || searchTerm) && (
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
                    </thead>
                    <tbody>
                        {sortedData.map((item) => (
                            <tr 
                                key={item.id} 
                                className={item.isAiRecommendation ? 'ai-recommendation-row' : ''}
                            >
                                <td 
                                    className="truncated-cell" 
                                    data-full-text={item.property}
                                >
                                    {item.property}
                                </td>
                                <td 
                                    className={`truncated-cell ${item.isAiRecommendation ? 'ai-recommendation' : ''}`} 
                                    data-full-text={item.value}
                                >
                                    {item.value.length > 100 && !item.isAiRecommendation 
                                        ? item.value.slice(0, 100) + '...' 
                                        : item.value}
                                </td>
                                <td>
                                    {item.isAiRecommendation ? (
                                        <button
                                            className="view-recommendation-button"
                                            onClick={() => setSelectedRecommendation(item.value)}
                                            title="Ver recomendación completa"
                                        >
                                            <FaEye />
                                        
                                        </button>
                                    ) : (
                                        <button
                                            className="delete-button"
                                            onClick={() => handleDelete(item.id)}
                                            title="Eliminar propiedad"
                                        >
                                            <MinusCircle />
                                        </button>
                                    )}
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

            {/* Modal para recomendación de IA */}
            {selectedRecommendation && (
                <div className="ai-recommendation-modal" onClick={() => setSelectedRecommendation(null)}>
                    <div 
                        className="modal-content" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            className="modal-close-button" 
                            onClick={() => setSelectedRecommendation(null)}
                        >
                            <XCircle />
                        </button>
                        <h2>Recomendación de IA</h2>
                        <div className="modal-recommendation-text">
                            {selectedRecommendation}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResultsTable;