const { auth } = require('express-oauth2-jwt-bearer');

const authMiddleware = auth({
  audience: process.env.AUTH0_AUDIENCE || 'http://localhost:3000', // We can use this as API identifier
  issuerBaseURL: `https://dev-75hmnmpo5heusns5.us.auth0.com/`,
  tokenSigningAlg: 'RS256'
});

module.exports = authMiddleware

