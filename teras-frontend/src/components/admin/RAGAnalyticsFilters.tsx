// teras-frontend/src/components/admin/RAGAnalyticsFilters.tsx
import { useState, useEffect } from 'react';
import { Filter, X, Calendar, User, Clock, FileText, ChevronDown } from 'lucide-react';
import { authFetch } from '../../utils/authFetch';
import './RAGAnalyticsFilters.css';

interface FilterOptions {
  doc_types: string[];
  user_types: string[];
  active_users: Array<{user__id: number; user__username: string; query_count: number}>;
  response_time_presets: Array<{label: string; min: number; max: number}>;
  docs_used_presets: Array<{label: string; min: number; max: number}>;
}

interface FilterValues {
  days?: number;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  user_type?: string;
  response_time_min?: number;
  response_time_max?: number;
  docs_used_min?: number;
  docs_used_max?: number;
  doc_type?: string;
}

interface Props {
  onFilterChange: (filters: FilterValues) => void;
  onReset: () => void;
}

export default function RAGAnalyticsFilters({ onFilterChange, onReset }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    days: 365
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    // Compter filtres actifs
    const count = Object.keys(filters).filter(key => {
      const value = filters[key as keyof FilterValues];
      return value !== undefined && value !== '' && key !== 'days';
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const loadFilterOptions = async () => {
    try {
      const res = await authFetch('/api/ai/analytics/filter-options/');
      const data = await res.json();
      setFilterOptions(data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleFilterChange = (key: keyof FilterValues, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(filters);
    setIsOpen(false);
  };

  const resetFilters = () => {
    const defaultFilters = { days: 365 };
    setFilters(defaultFilters);
    onReset();
    setIsOpen(false);
  };

  return (
    <div className="analytics-filters">
      <button 
        className={`filter-toggle ${activeFiltersCount > 0 ? 'has-filters' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Filter size={18} />
        Filtres
        {activeFiltersCount > 0 && (
          <span className="filter-badge">{activeFiltersCount}</span>
        )}
        <ChevronDown size={16} className={isOpen ? 'rotated' : ''} />
      </button>

      {isOpen && (
        <>
          <div className="filter-overlay" onClick={() => setIsOpen(false)} />
          <div className="filter-panel">
            <div className="filter-header">
              <h3>
                <Filter size={20} />
                Filtres avancés
              </h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="filter-content">
              {/* Période */}
              <div className="filter-group">
                <label>
                  <Calendar size={16} />
                  Période
                </label>
                <div className="filter-row">
                  <select
                    value={filters.days || 365}
                    onChange={(e) => handleFilterChange('days', Number(e.target.value))}
                  >
                    <option value={365}>12 derniers mois</option>
                    <option value={180}>6 derniers mois</option>
                    <option value={90}>90 derniers jours</option>
                    <option value={7}>7 derniers jours</option>
                    <option value={30}>30 derniers jours</option>
                    <option value={0}>Plage personnalisée</option>
                  </select>
                </div>

                {filters.days === 0 && (
                  <div className="filter-row">
                    <input
                      type="date"
                      placeholder="Date début"
                      value={filters.start_date || ''}
                      onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    />
                    <input
                      type="date"
                      placeholder="Date fin"
                      value={filters.end_date || ''}
                      onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Type d'utilisateur */}
              <div className="filter-group">
                <label>
                  <User size={16} />
                  Type d'utilisateur
                </label>
                <select
                  value={filters.user_type || ''}
                  onChange={(e) => handleFilterChange('user_type', e.target.value || undefined)}
                >
                  <option value="">Tous les types</option>
                  {filterOptions?.user_types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Utilisateur spécifique */}
              <div className="filter-group">
                <label>
                  <User size={16} />
                  Utilisateur spécifique
                </label>
                <select
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Tous les utilisateurs</option>
                  {filterOptions?.active_users.map(user => (
                    <option key={user.user__id} value={user.user__id}>
                      {user.user__username} ({user.query_count} requêtes)
                    </option>
                  ))}
                </select>
              </div>

              {/* Temps de réponse */}
              <div className="filter-group">
                <label>
                  <Clock size={16} />
                  Temps de réponse
                </label>
                <div className="preset-buttons">
                  {filterOptions?.response_time_presets.map((preset, i) => (
                    <button
                      key={i}
                      className={`preset-btn ${
                        filters.response_time_min === preset.min && 
                        filters.response_time_max === preset.max ? 'active' : ''
                      }`}
                      onClick={() => {
                        handleFilterChange('response_time_min', preset.min);
                        handleFilterChange('response_time_max', preset.max);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    className="preset-btn clear"
                    onClick={() => {
                      handleFilterChange('response_time_min', undefined);
                      handleFilterChange('response_time_max', undefined);
                    }}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Documents utilisés */}
              <div className="filter-group">
                <label>
                  <FileText size={16} />
                  Documents utilisés
                </label>
                <div className="preset-buttons">
                  {filterOptions?.docs_used_presets.map((preset, i) => (
                    <button
                      key={i}
                      className={`preset-btn ${
                        filters.docs_used_min === preset.min && 
                        filters.docs_used_max === preset.max ? 'active' : ''
                      }`}
                      onClick={() => {
                        handleFilterChange('docs_used_min', preset.min);
                        handleFilterChange('docs_used_max', preset.max);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <button
                    className="preset-btn clear"
                    onClick={() => {
                      handleFilterChange('docs_used_min', undefined);
                      handleFilterChange('docs_used_max', undefined);
                    }}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>

              {/* Type de document */}
              <div className="filter-group">
                <label>
                  <FileText size={16} />
                  Type de document
                </label>
                <select
                  value={filters.doc_type || ''}
                  onChange={(e) => handleFilterChange('doc_type', e.target.value || undefined)}
                >
                  <option value="">Tous les types</option>
                  {filterOptions?.doc_types.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-footer">
              <button className="btn-reset" onClick={resetFilters}>
                Réinitialiser tout
              </button>
              <button className="btn-apply" onClick={applyFilters}>
                Appliquer les filtres
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
