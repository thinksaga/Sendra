
import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
    keycloakIssuer: process.env.KEYCLOAK_ISSUER_URL, // e.g., http://localhost:8080/realms/Sendra
    audience: process.env.KEYCLOAK_AUDIENCE, // e.g., account (or your client id if using audience mapper)
}));
