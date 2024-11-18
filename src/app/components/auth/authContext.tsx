"use client";

import { createContext, useContext, useReducer, useEffect } from "react";
import { auth, getAccountForUser } from "../../services/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

interface AuthState {
  user: User | null;
  accountId: string | null;
  loading: boolean;
  error: string | null;
}

enum AuthActionType {
  LOGIN_START = "LOGIN_START",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  SIGNUP_START = "SIGNUP_START",
  SIGNUP_SUCCESS = "SIGNUP_SUCCESS",
  SIGNUP_FAILURE = "SIGNUP_FAILURE",
  LOGOUT = "LOGOUT",
  SET_USER = "SET_USER",
  SET_ACCOUNT = "SET_ACCOUNT",
}

interface AuthAction {
  type: AuthActionType;
  payload?: User | string | null;
}

const initialState: AuthState = {
  user: null,
  accountId: null,
  loading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.LOGIN_START:
    case AuthActionType.SIGNUP_START:
      return { ...state, loading: true, error: null };
    case AuthActionType.LOGIN_SUCCESS:
    case AuthActionType.SIGNUP_SUCCESS:
      return { ...state, loading: false, user: action.payload as User, error: null };
    case AuthActionType.LOGIN_FAILURE:
    case AuthActionType.SIGNUP_FAILURE:
      return { ...state, loading: false, error: action.payload as string };
    case AuthActionType.LOGOUT:
      return { ...state, user: null, accountId: null };
    case AuthActionType.SET_USER:
      return { ...state, user: action.payload as User | null };
    case AuthActionType.SET_ACCOUNT:
      return { ...state, accountId: action.payload as string | null };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      dispatch({ type: AuthActionType.SET_USER, payload: user });
      
      if (user) {
        try {
          const accountId = await getAccountForUser(user.uid);
          dispatch({ type: AuthActionType.SET_ACCOUNT, payload: accountId });
        } catch (error) {
          console.error("Error getting account:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: AuthActionType.LOGIN_START });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      dispatch({
        type: AuthActionType.LOGIN_SUCCESS,
        payload: userCredential.user,
      });
      
      const accountId = await getAccountForUser(userCredential.user.uid);
      dispatch({ type: AuthActionType.SET_ACCOUNT, payload: accountId });
    } catch (error: unknown) {
      console.error("Login error:", error);
      dispatch({ 
        type: AuthActionType.LOGIN_FAILURE, 
        payload: error instanceof Error ? error.message : "Erro ao fazer login"
      });
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    dispatch({ type: AuthActionType.SIGNUP_START });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      dispatch({
        type: AuthActionType.SIGNUP_SUCCESS,
        payload: userCredential.user,
      });
      
      const accountId = await getAccountForUser(userCredential.user.uid);
      dispatch({ type: AuthActionType.SET_ACCOUNT, payload: accountId });
    } catch (error: unknown) {
      console.error("Signup error:", error);
      dispatch({ 
        type: AuthActionType.SIGNUP_FAILURE, 
        payload: error instanceof Error ? error.message : "Erro ao criar conta"
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      dispatch({ type: AuthActionType.LOGOUT });
    } catch (error: unknown) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
