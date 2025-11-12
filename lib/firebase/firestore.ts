import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  nomeLoja: string | null;
  plano: "free" | "pro" | "premium";
  whatsappNumber: string | null;
  mensagemTemplate: string;
  createdAt: Timestamp | null;
  lastActiveAt: Timestamp | null;
}

export interface Catalogo {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  public: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Produto {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  preco: number | null;
  imagemUrl: string | null;
  linkExterno: string | null;
  visivel: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

// User functions
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { uid, ...docSnap.data() } as UserProfile;
  }
  return null;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const docRef = doc(db, "publicUsernames", username.toLowerCase());
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
}

export async function setUsername(uid: string, username: string): Promise<void> {
  const usernameLower = username.toLowerCase();
  
  // Verificar se já existe
  const exists = await checkUsernameExists(usernameLower);
  if (exists) {
    throw new Error("Username já está em uso");
  }

  // Atualizar usuário
  await updateUserProfile(uid, { username });

  // Criar/atualizar referência pública
  await setDoc(doc(db, "publicUsernames", usernameLower), { uid });
}

// Catalogo functions
export async function getCatalogos(uid: string): Promise<Catalogo[]> {
  const q = query(
    collection(db, "users", uid, "catalogos"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Catalogo[];
}

export async function getCatalogo(
  uid: string,
  catalogoId: string
): Promise<Catalogo | null> {
  const docRef = doc(db, "users", uid, "catalogos", catalogoId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Catalogo;
  }
  return null;
}

export async function getCatalogoBySlug(
  uid: string,
  slug: string
): Promise<Catalogo | null> {
  const q = query(
    collection(db, "users", uid, "catalogos"),
    where("slug", "==", slug)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as Catalogo;
}

export async function createCatalogo(
  uid: string,
  data: Omit<Catalogo, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const catalogosRef = collection(db, "users", uid, "catalogos");
  const newDocRef = doc(catalogosRef);
  await setDoc(newDocRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return newDocRef.id;
}

export async function updateCatalogo(
  uid: string,
  catalogoId: string,
  data: Partial<Catalogo>
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "catalogos", catalogoId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCatalogo(
  uid: string,
  catalogoId: string
): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "catalogos", catalogoId));
}

// Produto functions
export async function getProdutos(
  uid: string,
  catalogoId: string
): Promise<Produto[]> {
  const q = query(
    collection(db, "users", uid, "catalogos", catalogoId, "produtos"),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Produto[];
}

export async function getProduto(
  uid: string,
  catalogoId: string,
  produtoId: string
): Promise<Produto | null> {
  const docRef = doc(db, "users", uid, "catalogos", catalogoId, "produtos", produtoId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Produto;
  }
  return null;
}

export async function createProduto(
  uid: string,
  catalogoId: string,
  data: Omit<Produto, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const produtosRef = collection(db, "users", uid, "catalogos", catalogoId, "produtos");
  const newDocRef = doc(produtosRef);
  await setDoc(newDocRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return newDocRef.id;
}

export async function updateProduto(
  uid: string,
  catalogoId: string,
  produtoId: string,
  data: Partial<Produto>
): Promise<void> {
  await updateDoc(
    doc(db, "users", uid, "catalogos", catalogoId, "produtos", produtoId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    }
  );
}

export async function deleteProduto(
  uid: string,
  catalogoId: string,
  produtoId: string
): Promise<void> {
  await deleteDoc(
    doc(db, "users", uid, "catalogos", catalogoId, "produtos", produtoId)
  );
}

// Public functions
export async function getUidByUsername(username: string): Promise<string | null> {
  const docRef = doc(db, "publicUsernames", username.toLowerCase());
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().uid;
  }
  return null;
}

export async function getPublicCatalogo(
  username: string,
  catalogSlug: string
): Promise<{ catalogo: Catalogo; produtos: Produto[]; user: UserProfile } | null> {
  const uid = await getUidByUsername(username);
  if (!uid) return null;

  const user = await getUserProfile(uid);
  if (!user) return null;

  const catalogo = await getCatalogoBySlug(uid, catalogSlug);
  if (!catalogo || !catalogo.public) return null;

  const produtos = await getProdutos(uid, catalogo.id);
  const produtosVisiveis = produtos.filter((p) => p.visivel);

  return { catalogo, produtos: produtosVisiveis, user };
}

