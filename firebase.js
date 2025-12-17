// firebase.js - Configuração completa do Firebase (CORRIGIDA)

// ================= IMPORTAÇÕES =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ================= CONFIGURAÇÃO FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyA5KEaKntt9wPYcy60DutrqvIH34piXsXk",
  authDomain: "transporte-f7aea.firebaseapp.com",
  databaseURL: "https://transporte-f7aea-default-rtdb.firebaseio.com",
  projectId: "transporte-f7aea",
  storageBucket: "transporte-f7aea.firebasestorage.app",
  messagingSenderId: "551406731008",
  appId: "1:551406731008:web:90855ffcd9ac0ef1d93de5"
};

// ================= INICIALIZAÇÃO =================
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ================= AUTENTICAÇÃO =================
async function loginEmailSenha(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    return userCredential.user;
  } catch (error) {
    throw new Error(getErrorMessage(error.code));
  }
}

function getErrorMessage(errorCode) {
  const messages = {
    'auth/invalid-email': 'E-mail inválido',
    'auth/user-disabled': 'Usuário desativado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde'
  };
  return messages[errorCode] || 'Erro ao fazer login';
}

// ================= COLABORADORES =================
async function getColaborador(matricula) {
  const docRef = doc(db, 'colaboradores', matricula);
  return await getDoc(docRef);
}

async function getColaboradorByEmail(email) {
  const q = query(
    collection(db, 'colaboradores'),
    where("email", "==", email)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.empty ? null : querySnapshot.docs[0];
}

// ================= ROTAS =================
async function updateLocalizacao(matricula, dados) {
  const docRef = doc(db, 'rotas_em_andamento', matricula);
  return await setDoc(
    docRef,
    { ...dados, ultimaAtualizacao: serverTimestamp() },
    { merge: true }
  );
}

// ================= REGISTROS =================
async function registrarEmergencia(dados) {
  return await addDoc(collection(db, 'emergencias'), {
    ...dados,
    timestamp: serverTimestamp()
  });
}

async function registrarFeedback(dados) {
  return await addDoc(collection(db, 'feedbacks'), {
    ...dados,
    timestamp: serverTimestamp()
  });
}

async function registrarAviso(dados) {
  return await addDoc(collection(db, 'avisos'), {
    ...dados,
    timestamp: serverTimestamp()
  });
}

// ================= MONITORAMENTO =================
function monitorarRotas(callback) {
  return onSnapshot(collection(db, 'rotas_em_andamento'), snapshot => {
    const rotas = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.ativo !== false && data.latitude && data.longitude) {
        rotas.push({ id: docSnap.id, ...data });
      }
    });
    callback(rotas);
  });
}

function monitorarEmergencias(callback) {
  return onSnapshot(collection(db, 'emergencias'), snapshot => {
    const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(dados);
  });
}

function monitorarFeedbacks(callback) {
  return onSnapshot(collection(db, 'feedbacks'), snapshot => {
    const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(dados);
  });
}

function monitorarAvisos(callback) {
  const q = query(collection(db, 'avisos'), where("ativo", "==", true));
  return onSnapshot(q, snapshot => {
    const dados = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(dados);
  });
}

// ================= ADMIN =================
async function getFormsControleVeiculos() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 7);

  const q = query(
    collection(db, 'controle_veiculos'),
    where("data", ">=", dataLimite)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ================= EXPORTAÇÕES =================
export {
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  getColaborador,
  getColaboradorByEmail,
  updateLocalizacao,
  registrarEmergencia,
  registrarFeedback,
  registrarAviso,
  monitorarRotas,
  monitorarEmergencias,
  monitorarFeedbacks,
  monitorarAvisos,
  getFormsControleVeiculos,
  loginEmailSenha,
  signOut
};
