import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

<<<<<<< HEAD
function App() {
  const [currentPage, setCurrentPage] = useState("wardrobe")
  const [scannedGarment, setScannedGarment] = useState(null)
  const [wardrobeKey, setWardrobeKey] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      {currentPage === "wardrobe" && (
        <Wardrobe key={wardrobeKey} onAddGarment={() => setCurrentPage("addGarment")} />
      )}
      {currentPage === "addGarment" && (
        <AddGarment
          onSuccess={(garment) => {
            setScannedGarment(garment)
            setCurrentPage("reviewTags")
          }}
          onBack={() => setCurrentPage("wardrobe")}
        />
      )}
      {currentPage === "reviewTags" && (
        <ReviewTags
          garment={scannedGarment}
          onBack={() => setCurrentPage("addGarment")}
          onSave={() => {
            setWardrobeKey((k) => k + 1)   // forces Wardrobe to remount and refetch
            setCurrentPage("wardrobe")
          }}
        />
      )}
    </div>
  )
=======
import { LogoutButton } from '@/components/LogoutButton';
import AddGarment from '@/pages/AddGarment';
import ForgotPassword from '@/pages/ForgotPassword';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ReviewTags from '@/pages/ReviewTags';
import Wardrobe from '@/pages/Wardrobe';
import OutfitMatcher from '@/pages/OutfitMatcher';
import OutfitSuggestions from '@/pages/OutfitSuggestions';
import { useAuthStore } from '@/store/auth-store';

const AUTH_PAGES = new Set(['login', 'register', 'forgot-password']);

function getInitialPage() {
  const { user, token } = useAuthStore.getState();
  return user && token ? 'wardrobe' : 'login';
>>>>>>> main
}

export default function App() {
  const [page, setPage] = useState(getInitialPage);
  const [pendingGarment, setPendingGarment] = useState(null);
  const [authState, setAuthState] = useState(() => {
    const { user, token } = useAuthStore.getState();
    return { user, token };
  });

  useEffect(() => useAuthStore.subscribe(setAuthState), []);

  useEffect(() => {
    if (!authState.user || !authState.token) {
      if (!AUTH_PAGES.has(page)) {
        setPage('login');
      }
      return;
    }

    if (AUTH_PAGES.has(page)) {
      setPage('wardrobe');
    }
  }, [authState.token, authState.user, page]);

  const handleNavigate = (nextPage) => {
    setPage(nextPage);
  };

  const handleUploadSuccess = (garment) => {
    setPendingGarment(garment);
    setPage('review-tags');
  };

  const handleSaveGarment = () => {
    setPendingGarment(null);
    setPage('wardrobe');
  };

  const isAuthenticated = Boolean(authState.user && authState.token);

  return (
    <>
      <Toaster position="top-right" richColors />

      {isAuthenticated && !AUTH_PAGES.has(page) ? (
        <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-6">
          <LogoutButton onNavigate={handleNavigate} />
        </div>
      ) : null}

      {page === 'login' ? <Login onNavigate={handleNavigate} /> : null}
      {page === 'register' ? <Register onNavigate={handleNavigate} /> : null}
      {page === 'forgot-password' ? <ForgotPassword onNavigate={handleNavigate} /> : null}
      {page === 'wardrobe' ? (
        <Wardrobe 
          onAddGarment={() => handleNavigate('add-garment')} 
          onShowOutfitSuggestions={() => handleNavigate('outfit-suggestions')}
          onMatchOutfits={() => handleNavigate('outfit-matcher')}
        />
      ) : null}
      {page === 'add-garment' ? (
        <AddGarment onBack={() => handleNavigate('wardrobe')} onSuccess={handleUploadSuccess} />
      ) : null}
      {page === 'review-tags' ? (
        <ReviewTags
          garment={pendingGarment}
          onBack={() => handleNavigate('add-garment')}
          onSave={handleSaveGarment}
        />
      ) : null}
      {page === 'outfit-matcher' ? (
        <OutfitMatcher onBack={() => handleNavigate('wardrobe')} />
      ) : null}
      {page === 'outfit-suggestions' ? (
        <OutfitSuggestions onBack={() => handleNavigate('wardrobe')} />
      ) : null}
    </>
  );
}