import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
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
  origem: string;
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

// Updated function to fetch transactions from Firestore
export const getTransactions = async (accountId: string, currentYear: number = new Date().getFullYear()): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, "transactions");
    
    // Get current date details
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Determine start and end months for filtering
    const startMonth = currentYear === currentDate.getFullYear() 
      ? Math.max(1, currentMonth - 12)  // Last 6 months for current year
      : 1;  // First month for other years
    
    const endMonth = currentYear === currentDate.getFullYear() 
      ? currentMonth 
      : 12;

    // Create query with explicit null checks
    const q = query(
      transactionsRef, 
      where("accountId", "==", accountId),
      where("anoReferencia", "==", currentYear),
      where("mesReferencia", ">=", startMonth),
      where("mesReferencia", "<=", endMonth),
      orderBy("mesReferencia", "desc")
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Additional null checks before pushing
      if (
        data.accountId && 
        data.mesReferencia !== undefined && 
        data.anoReferencia !== undefined
      ) {
        transactions.push({
          id: doc.id,
          data: data.data.toDate(), // Assuming 'data' is a Firestore Timestamp
          valor: data.valor,
          mesReferencia: data.mesReferencia,
          anoReferencia: data.anoReferencia,
          descricao: data.descricao,
          categoria: data.categoria,
          subcategoria: data.subcategoria,
          parcela: data.parcela,
          pais: data.pais,
          accountId: data.accountId,
          origem: data.origem
        } as Transaction);
      }
    });
    
    return transactions;
  } catch (e) {
    console.error("Error fetching transactions: ", e);
    throw e;
  }
};
