import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, User, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== "undefined") {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
  }
}

export { auth };

const provider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error("Firebase não está inicializado");
  }
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

export async function signOut() {
  if (!auth) {
    throw new Error("Firebase não está inicializado");
  }
  await auth.signOut();
}

