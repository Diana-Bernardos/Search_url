import React, { useState, useMemo } from 'react';
import { Search, XCircle, Filter, ArrowUpDown, MinusCircle } from 'lucide-react';
import '../ResultsTable/ResultsTable.css';

const ResultsTable = ({ results, onDeleteProperty }) => {
    const [filters, setFilters] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const processData = (obj, prefix = '') => {
        const data = [];
        let index = 0; // Initialize index here
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object' && value !== null) { // Check for null
                const nestedData = processData(value, '');
                data.push(...nestedData.map(item => ({
                    ...item,
                    id: `${prefix}${key}-${index++}`,
                    property: `${prefix}${item.property}`
                })));
            } else {
                data.push({
                    id: prefix ? `${prefix}${key}` : key,
                    property: prefix ? `${prefix}${key}` : key,
                    value: value !== null ? value.toString() : 'N/A' // Handle null values
                });
            }
        }
        return data;
    };

    const tableData = useMemo(() => {
      console.log("Datos recibidos en ResultsTable:", results); 
        if (!results?.data?.properties) return [];
        try {
            return processData(results.data.properties);
        } catch (error) {
            console.error('Error al procesar datos:', error);
            return [];
        }
    }, [results]);

    const filteredData = useMemo(() => {
        return tableData.filter(item => {
            const searchMatch = !searchTerm ||
                item.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(item.value).toLowerCase().includes(searchTerm.toLowerCase());

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

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleDelete = async (propertyId) => {
        try {
            await onDeleteProperty(propertyId);
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar la propiedad'); // Consider using a better error display
        }
    };

    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    if (!results?.data?.properties || Object.keys(results?.data?.properties).length === 0) {
      return (
          <div className="results-table-container">
              <div className="no-results">No hay resultados disponibles</div>
          </div>
      );
  }

  return (
    <div className="results-table-container">
        <div className="table-header">
            <div className="search-filter">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Buscar propiedades..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {searchTerm && <button className="clear-search" onClick={() => setSearchTerm('')}><XCircle size={18} /></button>}
                </div>
                {(Object.keys(filters).length > 0 || searchTerm) && (<button className="clear-filters-button" onClick={clearFilters}><Filter size={16} /> Limpiar filtros</button>)}
            </div>
        </div>

        <div className="table-wrapper">
            <table className="results-table">
                <thead>
                    <tr>
                        <th onClick={() => handleSort('property')}>
                            <div className="th-content">Propiedad<ArrowUpDown size={16} /></div>
                        </th>
                        <th onClick={() => handleSort('value')}>
                            <div className="th-content">Valor<ArrowUpDown size={16} /></div>
                        </th>
                        <th>Acciones</th>
                    </tr>
                    <tr className="filter-row">
                        <th><input type="text" placeholder="Filtrar propiedad..." value={filters.property || ''} onChange={(e) => setFilters(prev => ({ ...prev, property: e.target.value }))} /></th>
                        <th><input type="text" placeholder="Filtrar valor..." value={filters.value || ''} onChange={(e) => setFilters(prev => ({ ...prev, value: e.target.value }))} /></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((item) => (
                        <tr key={item.id}>
                            <td>{item.property}</td>
                            <td>{item.value}</td>
                            <td>
                                <button className="delete-button" onClick={() => handleDelete(item.id)} title="Eliminar propiedad"><MinusCircle size={18} /></button>
                            </td>
                        </tr>
                    ))}
                    {sortedData.length === 0 && (
                        <tr><td colSpan="3" className="no-results">No se encontraron resultados</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);
};

export default ResultsTable;