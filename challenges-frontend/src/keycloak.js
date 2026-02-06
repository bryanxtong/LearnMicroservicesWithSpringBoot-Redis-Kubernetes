import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    url: 'http://localhost:8180',
    realm: 'microservices-demo',
    clientId: 'challenges-app'
});

// Token refresh configuration
const MIN_TOKEN_VALIDITY_SECONDS = 30;

// Initialize Keycloak
export const initKeycloak = (onAuthenticatedCallback) => {
    keycloak.init({
        onLoad: 'login-required',
        checkLoginIframe: false,
        pkceMethod: 'S256'
    })
    .then((authenticated) => {
        if (authenticated) {
            console.log('User authenticated');
            // Set up automatic token refresh
            setInterval(() => {
                keycloak.updateToken(MIN_TOKEN_VALIDITY_SECONDS)
                    .then((refreshed) => {
                        if (refreshed) {
                            console.log('Token refreshed');
                        }
                    })
                    .catch(() => {
                        console.error('Failed to refresh token');
                        keycloak.logout();
                    });
            }, 10000);
            onAuthenticatedCallback();
        } else {
            console.warn('User not authenticated');
            keycloak.login();
        }
    })
    .catch((error) => {
        console.error('Keycloak initialization failed:', error);
    });
};

// Get the current access token
export const getToken = () => keycloak.token;

// Get the current username
export const getUsername = () => keycloak.tokenParsed?.preferred_username;

// Logout function
export const logout = () => {
    keycloak.logout({ redirectUri: window.location.origin });
};

// Check if user is authenticated
export const isAuthenticated = () => keycloak.authenticated;

export default keycloak;
