import { userPool, getCurrentUser, getCurrentSession, signUp, signIn, signOut, confirmRegistration, resendConfirmationCode } from './aws';

export interface User {
  id: string;
  email: string;
  username?: string;
  avatar?: string;
  fullName?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const getAuthenticatedUser = async (): Promise<User | null> => {
  try {
    if (!userPool) {
      return null;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      return null;
    }

    let session;
    try {
      session = await getCurrentSession();
    } catch {
      return null;
    }

    if (!session || !session.isValid()) {
      return null;
    }

    let payload;
    try {
      payload = session.getIdToken().decodePayload();
    } catch {
      return null;
    }
    
    return {
      id: payload.sub,
      email: payload.email,
      username: payload['cognito:username'] || payload.email,
      fullName: payload.name || payload.email.split('@')[0],
    };
  } catch {
    return null;
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result: any = await signUp(email, password);
    return {
      success: true,
      user: result.user,
      userConfirmed: result.userConfirmed,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign up',
    };
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const session: any = await signIn(email, password);
    const payload = session.getIdToken().decodePayload();
    
    const user: User = {
      id: payload.sub,
      email: payload.email,
      username: payload['cognito:username'] || payload.email,
      fullName: payload.name || payload.email.split('@')[0],
    };

    return {
      success: true,
      user,
      session,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign in',
    };
  }
};

export const signOutUser = () => {
  try {
    signOut();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to sign out',
    };
  }
};

export const confirmEmail = async (email: string, code: string) => {
  try {
    const result: any = await confirmRegistration(email, code);
    return {
      success: true,
      result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to confirm email',
    };
  }
};

export const resendConfirmation = async (email: string) => {
  try {
    const result: any = await resendConfirmationCode(email);
    return {
      success: true,
      result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to resend confirmation',
    };
  }
};

const CURRENT_USER_KEY = 'equyvo_current_user';

export const storeCurrentUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  return null;
};

export const clearStoredUser = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem('userProfile');
  }
};

export const checkAuthStatus = async (): Promise<AuthState> => {
  try {
    if (!userPool) {
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    }

    const user = await getAuthenticatedUser();
    return {
      user,
      isLoading: false,
      isAuthenticated: !!user,
    };
  } catch {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    };
  }
};
