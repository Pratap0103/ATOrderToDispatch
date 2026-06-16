import React, { useState } from 'react';
import { Plus, Search, RotateCcw, Filter, ChevronDown, Building2, HardHat, MapPin, Tag, Layers, Flame } from 'lucide-react';
import CompanyDetails from './CompanyDetails';
import KarigarDetails from './KarigarDetails';
import DeliveryLocation from './DeliveryLocation';
import OrderStage from './OrderStage';
import Category from './Category';
import Subcategory from './Subcategory';
import Melting from './Melting';

const VIEWS = [
  { id: 'company',  label: 'Company Details',    icon: Building2 },
  { id: 'karigar',  label: 'Karigar Details',     icon: HardHat   },
  { id: 'delivery', label: 'Delivery Locations',  icon: MapPin    },
  { id: 'orderstage', label: 'Order Stages',      icon: Tag       },
  { id: 'category', label: 'Category',            icon: Layers    },
  { id: 'subcategory', label: 'Subcategory',      icon: Layers    },
  { id: 'melting',  label: 'Melting',             icon: Flame     },
];

export default function Master() {
  const [activeView, setActiveView] = useState('company');
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  // Per-view filter states lifted here so Master toolbar can clear them
  const [companyFilters, setCompanyFilters] = useState({ companyName: [], location: [], emailDomain: [] });
  const [karigarTypeFilter, setKarigarTypeFilter] = useState([]);

  const currentView = VIEWS.find(v => v.id === activeView);

  const handleClearFilters = () => {
    setSearchQuery('');
    setCompanyFilters({ companyName: [], location: [], emailDomain: [] });
    setKarigarTypeFilter([]);
    setShowMobileFilters(false);
  };

  const handleViewChange = (id) => {
    setActiveView(id);
    setViewDropdownOpen(false);
    handleClearFilters();
  };

  const triggerAdd = () => {
    const map = {
      company:    'company-add-trigger',
      karigar:    'karigar-add-trigger',
      delivery:   'delivery-location-add-trigger',
      orderstage: 'order-stage-add-trigger',
      category:   'category-add-trigger',
      subcategory:'subcategory-add-trigger',
      melting:    'melting-add-trigger',
    };
    document.getElementById(map[activeView])?.click();
  };

  return (
    <div className="p-0 sm:p-2 md:p-6 space-y-2 md:space-y-4 flex flex-col h-full min-h-0">

      {/* ── Header Toolbar ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2 lg:gap-4 w-full px-2 sm:px-0">
        <div className="flex flex-col lg:flex-row w-full gap-2 lg:gap-3 items-center">

          {/* ── View Switcher Dropdown ── */}
          <div className="relative flex-shrink-0 w-full lg:w-auto z-30">
            <button
              id="master-view-switcher"
              onClick={() => setViewDropdownOpen(p => !p)}
              className="flex items-center gap-2 h-[32px] md:h-[38px] px-3 bg-white border border-amber-300 rounded-lg text-xs md:text-sm font-bold text-amber-700 hover:bg-amber-50 transition-all shadow-sm w-full lg:w-[190px] justify-between"
            >
              <div className="flex items-center gap-2">
                <currentView.icon size={15} className="text-amber-500 flex-shrink-0" />
                <span>{currentView.label}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform flex-shrink-0 ${viewDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {viewDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setViewDropdownOpen(false)} />
                <div className="absolute left-0 top-full mt-1 w-full lg:w-[190px] bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                  {VIEWS.map(v => (
                    <button
                      key={v.id}
                      onClick={() => handleViewChange(v.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold transition-colors ${
                        activeView === v.id
                          ? 'bg-amber-50 text-amber-700 border-l-2 border-amber-500'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <v.icon size={14} className={activeView === v.id ? 'text-amber-500' : 'text-gray-400'} />
                      {v.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Search bar + mobile controls ── */}
          <div className="flex items-center gap-2 w-full lg:w-auto lg:flex-[1.5]">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-[9px] lg:top-[11px] text-gray-400" size={14} />
              <input
                type="text"
                placeholder={`Search ${currentView.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg pl-8 pr-2 py-1.5 focus:outline-none focus:border-amber-500 text-xs md:text-sm h-[32px] md:h-[38px]"
              />
            </div>
            <button
              onClick={() => setShowMobileFilters(p => !p)}
              className={`lg:hidden flex items-center justify-center rounded-lg shadow-sm h-[32px] w-[32px] flex-shrink-0 transition ${showMobileFilters ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              title="Toggle Filters"
            >
              <Filter size={14} />
            </button>
            {!showMobileFilters && (
              <button onClick={triggerAdd} className="lg:hidden flex items-center justify-center bg-amber-600 text-white rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95" title={`Add ${currentView.label}`}>
                <Plus size={16} />
              </button>
            )}
            <button onClick={handleClearFilters} className="lg:hidden flex items-center justify-center bg-gray-50 text-gray-500 border border-gray-200 rounded-lg h-[32px] w-[32px] flex-shrink-0 shadow-sm active:scale-95" title="Clear Filters">
              <RotateCcw size={14} />
            </button>
          </div>

          {/* ── Desktop filter dropdowns slot — rendered by child page ── */}
          <div className={`${showMobileFilters ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row flex-nowrap gap-2 w-full lg:w-auto lg:flex-[6] overflow-visible`}>
            {/* Filters are slotted in by the child via the filterSlot prop pattern */}
            {activeView === 'company' && (
              <CompanyDetails
                externalSearch={searchQuery}
                externalFilters={companyFilters}
                onExternalFiltersChange={setCompanyFilters}
                showMobileFilters={showMobileFilters}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
            {activeView === 'karigar' && (
              <KarigarDetails
                searchQuery={searchQuery}
                typeFilter={karigarTypeFilter}
                onTypeFilterChange={setKarigarTypeFilter}
                showMobileFilters={showMobileFilters}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
            {activeView === 'delivery' && (
              <DeliveryLocation
                searchQuery={searchQuery}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
            {activeView === 'orderstage' && (
              <OrderStage
                searchQuery={searchQuery}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
            {activeView === 'category' && (
              <Category
                searchQuery={searchQuery}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
            {activeView === 'subcategory' && (
              <Subcategory
                searchQuery={searchQuery}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
            {activeView === 'melting' && (
              <Melting
                searchQuery={searchQuery}
                onClearFilters={handleClearFilters}
                filtersOnly={true}
              />
            )}
          </div>
        </div>

        {/* ── Desktop Add Button ── */}
        <button
          onClick={triggerAdd}
          className="hidden lg:flex bg-amber-600 hover:bg-amber-700 text-white rounded-lg items-center justify-center transition shadow-sm w-[38px] h-[38px] flex-shrink-0"
          title={`Add ${currentView.label}`}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* ── Active Page (table + modals) ── */}
      {activeView === 'company' && (
        <CompanyDetails
          externalSearch={searchQuery}
          externalFilters={companyFilters}
          onExternalFiltersChange={setCompanyFilters}
          showMobileFilters={showMobileFilters}
          onClearFilters={handleClearFilters}
        />
      )}
      {activeView === 'karigar' && (
        <KarigarDetails
          searchQuery={searchQuery}
          typeFilter={karigarTypeFilter}
          onTypeFilterChange={setKarigarTypeFilter}
          showMobileFilters={showMobileFilters}
          onClearFilters={handleClearFilters}
        />
      )}
      {activeView === 'delivery' && (
        <DeliveryLocation
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
      )}
      {activeView === 'orderstage' && (
        <OrderStage
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
      )}
      {activeView === 'category' && (
        <Category
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
      )}
      {activeView === 'subcategory' && (
        <Subcategory
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
      )}
      {activeView === 'melting' && (
        <Melting
          searchQuery={searchQuery}
          onClearFilters={handleClearFilters}
        />
      )}
    </div>
  );
}
