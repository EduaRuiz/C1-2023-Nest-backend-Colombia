import { Injectable } from '@nestjs/common';

import * as auth from 'firebase-admin/auth';
import firebase from 'firebase-admin';
import * as serviceAccount from './sofkabank-firebase.json';

const params = {
  type: serviceAccount.type,
  projectId: serviceAccount.project_id,
  privateKeyId: serviceAccount.private_key_id,
  privateKey: serviceAccount.private_key,
  clientEmail: serviceAccount.client_email,
  clientId: serviceAccount.client_id,
  authUri: serviceAccount.auth_uri,
  tokenUri: serviceAccount.token_uri,
  authProviderX509CertUrl: serviceAccount.auth_provider_x509_cert_url,
  clientC509CertUrl: serviceAccount.client_x509_cert_url,
};
firebase.initializeApp({
  credential: firebase.credential.cert(params),
});

@Injectable()
export class GoogleStrategy {
  async verify(token: string) {
    const checkRevoked = true;
    auth
      .getAuth()
      .verifyIdToken(token, checkRevoked)
      .then((decodedToken) => {
        return decodedToken;
      })
      .catch((error) => {
        if (error.code == 'auth/id-token-revoked') {
          return 'Token revoked';
        } else {
          return error;
        }
      });
  }

  async verify2(token: string): Promise<auth.DecodedIdToken> {
    const checkRevoked = true;
    return auth.getAuth().verifyIdToken(token, checkRevoked);
  }
}
