import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getEnv, FirebaseConfig } from "./env";
import crypto from 'crypto';

const firebaseConfig: FirebaseConfig = getEnv();

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const auth = getAuth(app);

export interface Account {
  id: string;
  userIds: string[];
  createdAt: Date;
}

export interface Transaction {
  data: Date;
  valor: number;
  mesReferencia: number;
  anoReferencia:number;
  descricao: string;
  categoria: string;
  subcategoria: string;
  parcela: string;
  pais: string;
  accountId: string;
}

export const generateAccountId = () => {
  return crypto.randomBytes(16).toString('hex');
};

export const createAccount = async (userId: string): Promise<string> => {
  try {
    const accountId = generateAccountId();
    await addDoc(collection(db, "accounts"), {
      id: accountId,
      userIds: [userId],
      createdAt: new Date()
    });
    return accountId;
  } catch (e) {
    console.error("Error creating account:", e);
    throw e;
  }
};

export const getAccountForUser = async (userId: string): Promise<string | null> => {
  try {
    const accountsRef = collection(db, "accounts");
    const q = query(accountsRef, where("userIds", "array-contains", userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().id;
    }
    
    // If no account exists, create one
    return await createAccount(userId);
  } catch (e) {
    console.error("Error getting account:", e);
    throw e;
  }
};

export const addTransaction = async (transaction: Transaction) => {
  try {
    const docRef = await addDoc(collection(db, "transactions"), transaction);
    console.log("Document written with ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};
