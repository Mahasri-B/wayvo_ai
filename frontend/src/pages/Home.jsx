import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Route } from 'lucide-react';
import SearchSection from '../components/SearchSection';
import StatsRow from '../components/StatsRow';
import QuickActions from '../components/QuickActions';
import ChatPanel from '../components/ChatPanel';
import RouteCard from '../components/RouteCard';
import MapView from '../components/MapView';
import LoadingSkeleton from '../components/LoadingSkeleton';
import HillStations from '../components/HillStations';
import SettingsPanel from '../components/SettingsPanel';
import { searchRoutes, getRouteGeometry } from '../utils/api';
import toast from 'react-hot-toast';

export default function Home({ activeTab, onTabChange, darkMode }) {
  const [loading, setLoading]        = useState(false);
  const [results, setResults]        = useState(null);
  const [routeGeo, setRouteGeo]      = useState(null);
  const [selectedRoute, setSelected] = useState(null);
  const [searchParams, setParams]    = useState(null);

  const handleSearch = async (params) => {
    setLoading(true);
    setResults(null);
    setRouteGeo(null);
    setParams(params);
    try {
      const [routeRes, geoRes] = await Promise.allSettled([
        searchRoutes(params),
        getRouteGeometry(params.from_location, params.to_location),
      ]);
      if (routeRes.status === 'fulfilled') {
        setResults(routeRes.value);
        onTabChange?.(routeRes.value.routes?.length > 0 ? 'routes' : 'map');
        if (!routeRes.value.routes?.length) {
          toast('No routes found for this combination yet.', { icon: '🗺️' });
        }
      } else {
        const err = routeRes.reason;
        if (err?.code === 'ECONNREFUSED' || err?.message?.includes('Network Error')) {
          toast.error('Backend not reachable. Run: uvicorn app.main:app --reload in the backend folder.');
        } else {
          toast.error('Search failed: ' + (err?.response?.data?.detail || err?.message || 'Unknown error'));
        }
      }
      if (geoRes.status === 'fulfilled') setRouteGeo(geoRes.value);
    } catch { toast.error('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const handleQuickAction = (actionId) => {
    const prompts = {
      'nearby':      'Find nearby bus and train stations in Tamil Nadu',
      'weather':     'What is the current weather situation for travel in Tamil Nadu?',
      'hill-safety': 'What are the hill road safety tips for Tamil Nadu ghat roads?',
      'guidelines':  'What are the travel guidelines for Tamil Nadu?',
    };
    if (prompts[actionId]) {
      onTabChange?.('chat');
      window.dispatchEvent(new CustomEvent('quickAction', { detail: prompts[actionId] }));
    }
  };

  const routeContext = searchParams ? {
    from_location: searchParams.from_location,
    to_location:   searchParams.to_location,
    routes:        results?.routes?.slice(0, 2),
  } : null;

  const LeftCol = () => (
    <div className="hidden md:flex flex-col gap-3 flex-shrink-0 overflow-y-auto" style={{ width: 300 }}>
      <QuickActions onAction={handleQuickAction} />
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#F8F9FA' }}>
      {/* Hide search+stats on mobile for tabs that don't need them */}
      <div className={`flex-shrink-0 ${['chat','map','hills','saved','settings'].includes(activeTab) ? 'hidden md:block' : ''}`}>
        <SearchSection onSearch={handleSearch} loading={loading} />
      </div>
      <div className={`flex-shrink-0 ${['chat','map','hills','saved','settings'].includes(activeTab) ? 'hidden md:block' : ''}`}>
        <StatsRow />
      </div>
      <div className="flex-1 overflow-hidden flex gap-3 px-2 md:px-4 py-3 min-h-0 pb-16 md:pb-3">
        <AnimatePresence mode="wait">

          {/* CHAT */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex gap-3 w-full h-full">
              <LeftCol />
              <div className="flex-1 min-w-0 min-h-0"><ChatPanel routeContext={routeContext} /></div>
            </motion.div>
          )}

          {/* ROUTES */}
          {activeTab === 'routes' && (
            <motion.div key="routes" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="flex gap-3 w-full h-full">
              <LeftCol />
              <div className="flex-1 min-w-0 overflow-y-auto space-y-3 pb-2">
                {loading && <LoadingSkeleton />}
                {!loading && results?.routes?.length > 0 && results.routes.map((r, i) => (
                  <RouteCard key={r.route_id} route={r} index={i}
                    onSelect={r => { setSelected(r); onTabChange?.('map'); }}
                    isSelected={selectedRoute?.route_id === r.route_id} />
                ))}
                {!loading && !results && (
                  <div className="white-card p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                      <Bus size={24} style={{ color: '#7C3AED' }} />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">No search yet</h3>
                    <p className="text-gray-400 text-sm">Search a route above to see multimodal options.</p>
                  </div>
                )}
                {!loading && results?.routes?.length === 0 && (
                  <div className="white-card p-10 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Route size={24} className="text-gray-400" />
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">No routes in database</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">Load your datasets using the ingestion script.</p>
                    <code className="block mt-3 text-xs text-purple-600 bg-purple-50 rounded-xl px-4 py-2">
                      python ingestion/ingest.py --file data.csv --type bus_routes
                    </code>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* MAP */}
          {activeTab === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-full">
              <MapView routeData={routeGeo} alerts={results?.active_alerts || []} selectedRoute={selectedRoute} />
            </motion.div>
          )}

          {/* HILL STATIONS */}
          {activeTab === 'hills' && (
            <motion.div key="hills" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full h-full overflow-hidden">
              <HillStations />
            </motion.div>
          )}

          {['saved','settings'].includes(activeTab) && (
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center">
              {activeTab === 'settings' ? (
                <SettingsPanel darkMode={darkMode} />
              ) : (
                <div className="white-card p-12 text-center max-w-md">
                  <h3 className="font-bold text-gray-800 text-lg mb-2">Saved Trips</h3>
                  <p className="text-gray-400 text-sm">Your saved trips and favorite routes will appear here.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
