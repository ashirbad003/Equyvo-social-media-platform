import { CognitoUserPool, CognitoUserAttribute, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: import.meta.env.VITE_AWS_USER_POOL_ID,
  ClientId: import.meta.env.VITE_AWS_APP_CLIENT_ID,
  region: import.meta.env.VITE_AWS_REGION || 'eu-north-1'
};

const hasCredentials = !!(poolData.UserPoolId && poolData.ClientId);

export const userPool = hasCredentials ? new CognitoUserPool(poolData) : null;

export const getCurrentUser = () => {
  if (!userPool) return null;
  return userPool.getCurrentUser();
};

export const getCurrentSession = () => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      if (import.meta.env.DEV) {
        const mockSession = {
          getIdToken: () => ({
            decodePayload: () => ({
              sub: 'mock-user-id',
              email: 'mock@example.com',
              'cognito:username': 'mockuser',
              name: 'Mock User'
            })
          }),
          isValid: () => true
        };
        resolve(mockSession);
        return;
      }
      resolve(null);
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err: any, session: any) => {
      if (err) {
        resolve(null);
      } else {
        resolve(session);
      }
    });
  });
};

export const signUp = (email: string, password: string) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      if (import.meta.env.DEV) {
        resolve({
          user: {
            getUsername: () => email,
            attributes: []
          },
          userConfirmed: false
        });
        return;
      }
      reject(new Error('AWS Cognito not configured'));
      return;
    }

    const attributeList = [
      new CognitoUserAttribute({
        Name: 'email',
        Value: email,
      }),
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

export const signIn = (email: string, password: string) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      if (import.meta.env.DEV) {
        const mockSession = {
          getIdToken: () => ({
            decodePayload: () => ({
              sub: 'mock-user-id',
              email: email,
              'cognito:username': email.split('@')[0],
              name: email.split('@')[0]
            })
          }),
          isValid: () => true
        };
        resolve(mockSession);
        return;
      }
      reject(new Error('AWS Cognito not configured'));
      return;
    }

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (session) => {
        resolve(session);
      },
      onFailure: (err) => {
        reject(err);
      },
      newPasswordRequired: () => {
        reject(new Error('New password required'));
      },
    });
  });
};

export const signOut = () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    currentUser.signOut();
  }
};

export const confirmRegistration = (email: string, code: string) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      if (import.meta.env.DEV) {
        resolve('SUCCESS');
        return;
      }
      reject(new Error('AWS Cognito not configured'));
      return;
    }

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

export const resendConfirmationCode = (email: string) => {
  return new Promise((resolve, reject) => {
    if (!userPool) {
      if (import.meta.env.DEV) {
        resolve('SUCCESS');
        return;
      }
      reject(new Error('AWS Cognito not configured'));
      return;
    }

    const userData = {
      Username: email,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);

    cognitoUser.resendConfirmationCode((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
