// Simple auth store using Zustand-like pattern
// This is a lightweight state management solution

let authState = {
  user: null,
  token: null,
};

let listeners = [];

export const useAuthStore = {
  // Get current state
  getState: () => ({
    user: authState.user,
    token: authState.token,
    setUser: (user) => {
      authState.user = user;
      notifyListeners();
    },
    setToken: (token) => {
      authState.token = token;
      notifyListeners();
    },
    logout: () => {
      authState.user = null;
      authState.token = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      notifyListeners();
    },
    clearAuth: () => {
      authState = {
        user: null,
        token: null,
      };
      notifyListeners();
    },
  }),

  // Subscribe to changes
  subscribe: (listener) => {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  },

  // Initialize from localStorage
  initialize: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (user && token) {
      authState.user = JSON.parse(user);
      authState.token = token;
    }
  },
};

function notifyListeners() {
  listeners.forEach((listener) => listener(authState));
}

// Initialize on load
useAuthStore.initialize();
