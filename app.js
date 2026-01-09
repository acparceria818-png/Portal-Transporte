// app.js - CÓDIGO COMPLETO ATUALIZADO
import { 
  db,
  auth,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
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
  getAvisos,
  updateAviso,
  deleteAviso,
  getEscalas,
  addEscala,
  updateEscala,
  deleteEscala,
  resolverEmergencia,
  resolverFeedback,
  responderFeedback,
  getRelatorios,
  getEstatisticasDashboard,
  getRotasPorTipo,
  getMotoristasAtivos
} from './firebase.js';

// Estado global
let estadoApp = {
  motorista: null,
  passageiro: null,
  admin: null,
  rotaAtiva: null,
  onibusAtivo: null,
  watchId: null,
  isOnline: navigator.onLine,
  perfil: null,
  unsubscribeRotas: null,
  unsubscribeEmergencias: null,
  unsubscribeFeedbacks: null,
  unsubscribeAvisos: null,
  emergenciaAtiva: false,
  avisosAtivos: [],
  escalas: [],
  estatisticas: null,
  ultimaLocalizacao: null,
  distanciaTotal: 0,
  onlineUsers: []
};

// Dados de ônibus disponíveis
const ONIBUS_DISPONIVEIS = [
  { placa: 'TEZ-2J56', tag_ac: 'AC LO 583', tag_vale: '1JI347', cor: 'BRANCA', empresa: 'MUNDIAL P E L DE BENS MOVEIS LTDA' },
  { placa: 'TEZ-2J60', tag_ac: 'AC LO 585', tag_vale: '1JI348', cor: 'BRANCA', empresa: 'MUNDIAL P E L DE BENS MOVEIS LTDA' },
  { placa: 'TEZ-2J57', tag_ac: 'AC LO 584', tag_vale: '1JI349', cor: 'BRANCA', empresa: 'MUNDIAL P E L DE BENS MOVEIS LTDA' },
  { placa: 'SJD5G38', tag_ac: 'AC LO 610', tag_vale: '1JI437', cor: 'BRANCA', empresa: 'MUNDIAL P E L DE BENS MOVEIS LTDA' },
  { placa: 'SYA5A51', tag_ac: 'AC LO 611', tag_vale: '1JI436', cor: 'BRANCA', empresa: 'MUNDIAL P E L DE BENS MOVEIS LTDA' },
  { placa: 'TEZ2J58', tag_ac: 'AC LO 609', tag_vale: '1JI420', cor: 'BRANCA', empresa: 'MUNDIAL P E L DE BENS MOVEIS LTDA' },
  { placa: 'PZS6858', tag_ac: 'VL 080', tag_vale: '-', cor: 'BRANCA', empresa: 'A C PARCERIA E TERRAPLENAGEM LTDA' },
  { placa: 'PZW5819', tag_ac: 'VL 083', tag_vale: '-', cor: 'BRANCA', empresa: 'A C PARCERIA E TERRAPLENAGEM LTDA' }
];

// Rotas disponíveis
const ROTAS_DISPONIVEIS = [
  { id: 'adm01', nome: 'ROTA ADM 01', tipo: 'adm', desc: 'Rota administrativa 01', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=18BCgBpobp1Olzmzy0RnPCUEd7Vnkc5s&usp=sharing' },
  { id: 'adm02', nome: 'ROTA ADM 02', tipo: 'adm', desc: 'Rota administrativa 02', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1WxbIX8nw0xyGBLMvvi1SF3DRuwmZ5oM&usp=sharing' },
  { id: 'op01', nome: 'ROTA 01', tipo: 'operacional', desc: 'Rota operacional 01', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1jCfFxq1ZwecS2IcHy7xGFLLgttsM-RQ&usp=sharing' },
  { id: 'op02', nome: 'ROTA 02', tipo: 'operacional', desc: 'Rota operacional 02', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1LCvNJxWBbZ_chpbdn_lk_Dm6NPA194g&usp=sharing' },
  { id: 'op03', nome: 'ROTA 03', tipo: 'operacional', desc: 'Rota operacional 03', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1bdwkrClh5AZml0mnDGlOzYcaR4w1BL0&usp=sharing' },
  { id: 'op04', nome: 'ROTA 04', tipo: 'operacional', desc: 'Rota operacional 04', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1IEuZ4TCi9EU_AcB2Ags2jD-RaFs0754&usp=sharing' },
  { id: 'op05', nome: 'ROTA 05', tipo: 'operacional', desc: 'Rota operacional 05', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1L9xjAWFUupMc7eQbqVJz-SNWlYX5SHo&usp=sharing' },
  { id: 'ret01', nome: 'RETORNO OVERLAND - ROTA 01', tipo: 'retorno', desc: 'Rota de retorno Overland 01', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1ClQVIaRLOYYWHU7fvP87r1BVy85a_eg&usp=sharing' },
  { id: 'ret02', nome: 'RETORNO OVERLAND - ROTA 02', tipo: 'retorno', desc: 'Rota de retorno Overland 02', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1WOIMgeLgV01B8yk7HoX6tazdCHXQnok&usp=sharing' }
];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 AC Transporte Portal - Inicializando...');
  
  // Adicionar rodapé em todas as páginas
  adicionarRodape();
  
  // Verificar sessão existente
  verificarSessao();
  
  // Inicializar funcionalidades
  initDarkMode();
  initPWA();
  initEventListeners();
  initConnectionMonitor();
  initAvisos();
  iniciarMonitoramentoOnline();
  
  console.log('✅ Aplicativo inicializado com sucesso');
});

// ========== ADICIONAR RODAPÉ ==========
function adicionarRodape() {
  const footer = document.createElement('footer');
  footer.className = 'footer-dev';
  footer.innerHTML = `
    <div class="footer-content">
      <span>Desenvolvido por Juan Sales</span>
      <div class="footer-contacts">
        <a href="tel:+5594992233753"><i class="fas fa-phone"></i> (94) 99223-3753</a>
        <a href="mailto:Juansalesadm@gmail.com"><i class="fas fa-envelope"></i> Juansalesadm@gmail.com</a>
      </div>
    </div>
  `;
  document.body.appendChild(footer);
}

// ========== GERENCIAMENTO DE SESSÃO ==========
function verificarSessao() {
  const perfil = localStorage.getItem('perfil_ativo');
  const matricula = localStorage.getItem('motorista_matricula');
  const nome = localStorage.getItem('motorista_nome');
  const adminLogado = localStorage.getItem('admin_logado');
  
  if (perfil === 'motorista' && matricula && nome) {
    estadoApp.motorista = { matricula, nome };
    estadoApp.perfil = 'motorista';
    mostrarTela('tela-motorista');
    updateUserStatus(nome, matricula);
    iniciarMonitoramentoAvisos();
    carregarEscalaMotorista(matricula);
    
    // Carregar ônibus salvo
    const onibusSalvo = localStorage.getItem('onibus_ativo');
    if (onibusSalvo) {
      estadoApp.onibusAtivo = JSON.parse(onibusSalvo);
      atualizarInfoOnibus();
    }
  } else if (perfil === 'passageiro') {
    estadoApp.perfil = 'passageiro';
    mostrarTela('tela-passageiro');
    iniciarMonitoramentoPassageiro();
    iniciarMonitoramentoAvisos();
  } else if (perfil === 'admin' && adminLogado) {
    estadoApp.perfil = 'admin';
    estadoApp.admin = { 
      nome: 'Administrador',
      email: localStorage.getItem('admin_email')
    };
    mostrarTela('tela-admin-dashboard');
    iniciarMonitoramentoAdmin();
    carregarEscalas();
  }
}

function updateUserStatus(nome, matricula) {
  const userStatus = document.getElementById('userStatus');
  const userName = document.getElementById('userName');
  const motoristaNome = document.getElementById('motoristaNome');
  const motoristaMatricula = document.getElementById('motoristaMatricula');
  
  if (userStatus) userStatus.style.display = 'flex';
  if (userName) userName.textContent = nome;
  if (motoristaNome) motoristaNome.textContent = nome;
  if (motoristaMatricula) motoristaMatricula.textContent = matricula;
  
  // Atualizar tags do motorista
  atualizarInfoOnibus();
}

function atualizarInfoOnibus() {
  if (!estadoApp.motorista || !estadoApp.onibusAtivo) return;
  
  const userTags = document.querySelector('.user-tags');
  if (!userTags) return;
  
  userTags.innerHTML = `
    <span class="user-tag"><i class="fas fa-bus"></i> ${estadoApp.onibusAtivo.placa}</span>
    <span class="user-tag"><i class="fas fa-tag"></i> ${estadoApp.onibusAtivo.tag_ac}</span>
    <span class="user-tag"><i class="fas fa-id-card"></i> ${estadoApp.onibusAtivo.tag_vale}</span>
  `;
}

// ========== SELEÇÃO DE PERFIL ==========
window.entrarNoPortal = function () {
  mostrarTela('telaEscolhaPerfil');
};

window.selecionarPerfil = function (perfil) {
  console.log('👤 Perfil selecionado:', perfil);
  estadoApp.perfil = perfil;
  localStorage.setItem('perfil_ativo', perfil);

  if (perfil === 'motorista') {
    mostrarTela('tela-motorista-login');
  } else if (perfil === 'passageiro') {
    estadoApp.passageiro = { nome: 'Passageiro' };
    mostrarTela('tela-passageiro');
    iniciarMonitoramentoPassageiro();
    iniciarMonitoramentoAvisos();
  } else if (perfil === 'admin') {
    mostrarTela('tela-admin-login');
  }
};

// ========== LOGIN MOTORISTA ==========
window.confirmarMatriculaMotorista = async function () {
  showLoading('🔍 Validando matrícula...');
  
  const input = document.getElementById('matriculaMotorista');
  const loginBtn = document.getElementById('loginBtn');
  
  if (!input) {
    alert('Campo de matrícula não encontrado');
    hideLoading();
    return;
  }

  const matricula = input.value.trim().toUpperCase();

  if (!matricula) {
    alert('Informe sua matrícula');
    input.focus();
    hideLoading();
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Validando...';
    
    const snap = await getColaborador(matricula);

    if (!snap.exists()) {
      alert('❌ Matrícula não encontrada');
      input.focus();
      return;
    }

    const dados = snap.data();

    if (!dados.ativo) {
      alert('❌ Colaborador inativo. Contate a administração.');
      return;
    }

    if (dados.perfil !== 'motorista') {
      alert('❌ Este acesso é exclusivo para motoristas');
      return;
    }

    localStorage.setItem('motorista_matricula', matricula);
    localStorage.setItem('motorista_nome', dados.nome);
    localStorage.setItem('motorista_email', dados.email || '');
    localStorage.setItem('perfil_ativo', 'motorista');
    
    estadoApp.motorista = { 
      matricula, 
      nome: dados.nome,
      email: dados.email || ''
    };
    
    carregarOnibus();
    console.log('✅ Motorista autenticado:', dados.nome);

  } catch (erro) {
    console.error('Erro Firebase:', erro);
    alert('❌ Erro ao validar matrícula. Verifique sua conexão e tente novamente.');
  } finally {
    hideLoading();
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    }
  }
};

// ========== CARREGAR ÔNIBUS (CORRIGIDO - SEM FUNDO VERMELHO) ==========
function carregarOnibus() {
  const container = document.getElementById('onibusList');
  if (!container) return;
  
  container.innerHTML = ONIBUS_DISPONIVEIS.map(onibus => `
    <div class="onibus-card" onclick="selecionarOnibus('${onibus.placa}')">
      <div class="onibus-icon">
        <i class="fas fa-bus"></i>
      </div>
      <div class="onibus-info">
        <h4>${onibus.placa}</h4>
        <p><strong>TAG AC:</strong> ${onibus.tag_ac}</p>
        <p><strong>TAG VALE:</strong> ${onibus.tag_vale}</p>
        <small><i class="fas fa-paint-brush"></i> ${onibus.cor}</small>
      </div>
      <div class="onibus-select">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  `).join('');
  
  mostrarTela('tela-selecao-onibus');
}

// ========== SELEÇÃO DE ÔNIBUS ==========
window.selecionarOnibus = function(placa) {
  const onibus = ONIBUS_DISPONIVEIS.find(o => o.placa === placa);
  if (!onibus) {
    alert('Ônibus não encontrado');
    return;
  }
  
  estadoApp.onibusAtivo = onibus;
  localStorage.setItem('onibus_ativo', JSON.stringify(onibus));
  
  // Solicitar permissão de localização
  solicitarPermissaoLocalizacao();
};

function solicitarPermissaoLocalizacao() {
  console.log('📍 Iniciando solicitação de localização...');
  
  if (!navigator.geolocation) {
    console.warn('❌ Geolocation não suportada');
    finalizarLoginSemGPS();
    return;
  }
  
  showLoading('📍 Obtendo localização...');
  
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('✅ GPS obtido no login:', position.coords);
      hideLoading();
      finalizarLoginComGPS(position);
    },
    (error) => {
      console.warn('⚠️ GPS falhou no login:', error.message);
      hideLoading();
      
      alert('📍 Localização não disponível no momento.\n\nO login será realizado normalmente. Você pode ativar o GPS depois.');
      
      finalizarLoginSemGPS();
    },
    options
  );
  
  function finalizarLoginComGPS(position) {
    if (!estadoApp.motorista || !estadoApp.onibusAtivo) return;
    
    updateUserStatus(estadoApp.motorista.nome, estadoApp.motorista.matricula);
    
    const onibusElement = document.getElementById('motoristaOnibus');
    if (onibusElement) {
      onibusElement.textContent = `${estadoApp.onibusAtivo.placa} (${estadoApp.onibusAtivo.tag_ac})`;
    }
    
    mostrarTela('tela-motorista');
    iniciarMonitoramentoAvisos();
    
    alert(`✅ Login realizado!\n\n👋 ${estadoApp.motorista.nome}\n🚌 ${estadoApp.onibusAtivo.placa}\n📍 GPS ativo (Precisão: ${position.coords.accuracy.toFixed(0)}m)`);
  }
  
  function finalizarLoginSemGPS() {
    if (!estadoApp.motorista || !estadoApp.onibusAtivo) return;
    
    updateUserStatus(estadoApp.motorista.nome, estadoApp.motorista.matricula);
    
    const onibusElement = document.getElementById('motoristaOnibus');
    if (onibusElement) {
      onibusElement.textContent = `${estadoApp.onibusAtivo.placa} (${estadoApp.onibusAtivo.tag_ac})`;
    }
    
    mostrarTela('tela-motorista');
    iniciarMonitoramentoAvisos();
    
    alert(`✅ Login realizado!\n\n👋 ${estadoApp.motorista.nome}\n🚌 ${estadoApp.onibusAtivo.placa}\n📍 GPS desativado`);
  }
}

// ========== LOGIN ADMIN ==========
window.loginAdmin = async function () {
  const email = document.getElementById('adminEmail').value;
  const senha = document.getElementById('adminSenha').value;
  
  if (!email || !senha) {
    alert('Preencha e-mail e senha');
    return;
  }
  
  const ADMIN_CREDENTIALS = {
    email: 'admin@acparceria.com',
    senha: '050370'
  };
  
  if (email === ADMIN_CREDENTIALS.email && senha === ADMIN_CREDENTIALS.senha) {
    localStorage.setItem('admin_logado', 'true');
    localStorage.setItem('admin_email', email);
    localStorage.setItem('perfil_ativo', 'admin');
    
    estadoApp.admin = { email, nome: 'Administrador' };
    
    mostrarTela('tela-admin-dashboard');
    iniciarMonitoramentoAdmin();
    iniciarMonitoramentoEmergencias();
    iniciarMonitoramentoFeedbacks();
    iniciarMonitoramentoAvisos();
    carregarEscalas();
    
    console.log('✅ Admin logado com sucesso');
  } else {
    alert('❌ Credenciais inválidas');
  }
};

// ========== LOGOUT ==========
window.logout = function () {
  if (estadoApp.watchId) {
    navigator.geolocation.clearWatch(estadoApp.watchId);
    estadoApp.watchId = null;
  }
  
  if (estadoApp.unsubscribeRotas) estadoApp.unsubscribeRotas();
  if (estadoApp.unsubscribeEmergencias) estadoApp.unsubscribeEmergencias();
  if (estadoApp.unsubscribeFeedbacks) estadoApp.unsubscribeFeedbacks();
  if (estadoApp.unsubscribeAvisos) estadoApp.unsubscribeAvisos();
  
  estadoApp = {
    motorista: null,
    passageiro: null,
    admin: null,
    rotaAtiva: null,
    onibusAtivo: null,
    watchId: null,
    isOnline: navigator.onLine,
    perfil: null,
    unsubscribeRotas: null,
    unsubscribeEmergencias: null,
    unsubscribeFeedbacks: null,
    unsubscribeAvisos: null,
    emergenciaAtiva: false,
    avisosAtivos: [],
    escalas: [],
    estatisticas: null,
    ultimaLocalizacao: null,
    distanciaTotal: 0,
    onlineUsers: []
  };
  
  localStorage.removeItem('perfil_ativo');
  localStorage.removeItem('motorista_matricula');
  localStorage.removeItem('motorista_nome');
  localStorage.removeItem('motorista_email');
  localStorage.removeItem('onibus_ativo');
  localStorage.removeItem('admin_logado');
  localStorage.removeItem('admin_email');
  
  const userStatus = document.getElementById('userStatus');
  if (userStatus) userStatus.style.display = 'none';
  
  const pararRotaBtn = document.getElementById('pararRotaBtn');
  if (pararRotaBtn) pararRotaBtn.style.display = 'none';
  
  const rotaStatus = document.getElementById('rotaStatus');
  if (rotaStatus) rotaStatus.textContent = 'Nenhuma rota ativa';
  
  mostrarTela('welcome');
  
  console.log('👋 Usuário deslogado');
};

// ========== SISTEMA DE GPS EM TEMPO REAL ==========
async function obterLocalizacaoTempoReal() {
  console.log('📍 Sistema GPS Tempo Real iniciado...');
  
  return new Promise((resolve, reject) => {
    const opcoesGPS = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('✅ GPS obtido em tempo real:', pos.coords);
        resolve(pos);
      },
      (err) => {
        console.warn('❌ GPS tempo real falhou:', err.message);
        reject(err);
      },
      opcoesGPS
    );
  });
}

// ========== FUNÇÕES DE ROTA E LOCALIZAÇÃO ==========
window.iniciarRota = async function (nomeRota) {
  console.log(`🛣️ Iniciando rota: ${nomeRota}`);
  
  if (!estadoApp.motorista || !estadoApp.onibusAtivo) {
    alert('❌ Motorista ou ônibus não configurado. Faça login novamente.');
    mostrarTela('tela-motorista-login');
    return;
  }

  if (!confirm(`🚀 Iniciar Rota: ${nomeRota}\n\nÔnibus: ${estadoApp.onibusAtivo.placa}\n\nSua localização será compartilhada em tempo real.`)) {
    return;
  }

  const btn = event?.target;
  const btnOriginalText = btn?.textContent || '▶️ Iniciar Rota';
  if (btn) {
    btn.classList.add('loading');
    btn.textContent = 'Obtendo localização...';
    btn.disabled = true;
  }

  try {
    let position;
    
    try {
      position = await obterLocalizacaoTempoReal();
      console.log('📍 Localização obtida:', position.coords);
    } catch (erro) {
      console.warn('❌ GPS falhou:', erro);
      alert('❌ Não foi possível obter localização precisa. Verifique as permissões do GPS e tente novamente.');
      if (btn) {
        btn.classList.remove('loading');
        btn.textContent = btnOriginalText;
        btn.disabled = false;
      }
      return;
    }
    
    // Enviar primeira localização
    await enviarLocalizacaoTempoReal(nomeRota, position.coords);
    
    // Iniciar monitoramento contínuo
    estadoApp.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        await enviarLocalizacaoTempoReal(nomeRota, pos.coords);
      },
      (erro) => {
        console.warn('⚠️ Erro no monitoramento GPS:', erro);
        mostrarNotificacao('⚠️ GPS', 'Problema na obtenção da localização');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000
      }
    );
    
    estadoApp.rotaAtiva = nomeRota;
    
    const rotaStatus = document.getElementById('rotaStatus');
    if (rotaStatus) {
      rotaStatus.textContent = `📍 Rota ativa: ${nomeRota}`;
      rotaStatus.classList.remove('simulada');
    }
    
    const pararBtn = document.getElementById('pararRotaBtn');
    if (pararBtn) pararBtn.style.display = 'block';
    
    mostrarNotificacao('✅ Rota Iniciada', `Rota "${nomeRota}" iniciada com sucesso!`);
    
    mostrarTela('tela-motorista');
    
    alert(`✅ Rota "${nomeRota}" iniciada com sucesso!\n\n📍 Localização ativa em tempo real\n🚌 Ônibus: ${estadoApp.onibusAtivo.placa}\n🎯 Precisão: ${position.coords.accuracy.toFixed(0)}m`);

  } catch (erro) {
    console.error('❌ Erro ao iniciar rota:', erro);
    alert(`❌ Não foi possível iniciar a rota:\n\n${erro.message || 'Erro desconhecido'}\n\nVerifique sua conexão e tente novamente.`);
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.textContent = btnOriginalText;
      btn.disabled = false;
    }
  }
};

async function enviarLocalizacaoTempoReal(nomeRota, coords) {
  if (!estadoApp.motorista || !estadoApp.onibusAtivo) return;

  try {
    // Calcular distância percorrida
    let distanciaKm = 0;
    if (estadoApp.ultimaLocalizacao) {
      const lat1 = estadoApp.ultimaLocalizacao.latitude;
      const lon1 = estadoApp.ultimaLocalizacao.longitude;
      const lat2 = coords.latitude;
      const lon2 = coords.longitude;
      
      distanciaKm = calcularDistancia(lat1, lon1, lat2, lon2);
    }
    
    // Atualizar distância total
    estadoApp.distanciaTotal = (estadoApp.distanciaTotal || 0) + distanciaKm;
    estadoApp.ultimaLocalizacao = coords;

    const dadosAtualizacao = {
      motorista: estadoApp.motorista.nome,
      matricula: estadoApp.motorista.matricula,
      email: estadoApp.motorista.email,
      rota: nomeRota,
      onibus: estadoApp.onibusAtivo.placa,
      tag_ac: estadoApp.onibusAtivo.tag_ac,
      tag_vale: estadoApp.onibusAtivo.tag_vale,
      modelo: estadoApp.onibusAtivo.empresa,
      capacidade: 50,
      latitude: coords.latitude,
      longitude: coords.longitude,
      velocidade: coords.speed ? (coords.speed * 3.6).toFixed(1) : '0',
      precisao: coords.accuracy,
      distancia: estadoApp.distanciaTotal.toFixed(2),
      ativo: true,
      timestamp: new Date(),
      online: true,
      ultimaAtualizacao: new Date()
    };
    
    await updateLocalizacao(estadoApp.motorista.matricula, dadosAtualizacao);
    
    console.log('📍 Localização enviada:', new Date().toLocaleTimeString(), 
                'Distância:', estadoApp.distanciaTotal.toFixed(2), 'km',
                'Velocidade:', dadosAtualizacao.velocidade, 'km/h',
                'Precisão:', coords.accuracy.toFixed(0), 'm');
  } catch (erro) {
    console.error('Erro ao enviar localização:', erro);
  }
}

// Função para calcular distância entre dois pontos (Haversine formula)
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

window.pararRota = function () {
  if (!estadoApp.watchId) return;
  
  if (!confirm('Deseja realmente parar o compartilhamento da rota?')) {
    return;
  }
  
  navigator.geolocation.clearWatch(estadoApp.watchId);
  estadoApp.watchId = null;
  estadoApp.rotaAtiva = null;
  estadoApp.distanciaTotal = 0;
  estadoApp.ultimaLocalizacao = null;
  
  if (estadoApp.motorista) {
    updateLocalizacao(estadoApp.motorista.matricula, {
      ativo: false,
      online: false,
      timestamp: new Date()
    });
  }
  
  document.getElementById('rotaStatus').textContent = 'Nenhuma rota ativa';
  document.getElementById('pararRotaBtn').style.display = 'none';
  
  mostrarNotificacao('⏹️ Rota Encerrada', 'Localização não está mais sendo compartilhada.');
};

// ========== BOTÃO DE EMERGÊNCIA COM SINISTRO ==========
window.ativarEmergencia = async function() {
  if (!estadoApp.motorista) {
    alert('❌ Faça login como motorista para usar esta função');
    return;
  }
  
  if (estadoApp.emergenciaAtiva) {
    estadoApp.emergenciaAtiva = false;
    document.getElementById('emergenciaBtn').textContent = '🚨 EMERGÊNCIA';
    document.getElementById('emergenciaBtn').classList.remove('emergencia-ativa');
    mostrarNotificacao('✅ Emergência Desativada', 'Situação de emergência encerrada');
    return;
  }
  
  // Mostrar opções
  const opcao = await mostrarOpcoesEmergencia();
  
  if (!opcao) return;
  
  if (opcao === 'sinistro') {
    // Abrir formulário de sinistro
    window.open('https://forms.gle/ima9J1SrgVyYVgvc9', '_blank');
    return;
  }
  
  const descricao = prompt('Descreva brevemente a situação:');
  if (!descricao) return;
  
  try {
    await registrarEmergencia({
      motorista: estadoApp.motorista.nome,
      matricula: estadoApp.motorista.matricula,
      onibus: estadoApp.onibusAtivo?.placa || 'Não informado',
      rota: estadoApp.rotaAtiva || 'Não informada',
      tipo: opcao,
      descricao: descricao,
      status: 'pendente',
      timestamp: new Date()
    });
    
    estadoApp.emergenciaAtiva = true;
    document.getElementById('emergenciaBtn').textContent = '✅ EMERGÊNCIA ATIVA';
    document.getElementById('emergenciaBtn').classList.add('emergencia-ativa');
    
    mostrarNotificacao('🚨 EMERGÊNCIA ATIVADA', 'A equipe de suporte foi notificada!');
    
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
  } catch (erro) {
    console.error('Erro ao registrar emergência:', erro);
    alert('❌ Erro ao ativar emergência. Tente novamente.');
  }
};

function mostrarOpcoesEmergencia() {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal">
        <button class="close" onclick="this.parentElement.parentElement.remove(); resolve(null)">✕</button>
        <h3><i class="fas fa-exclamation-triangle"></i> Tipo de Emergência</h3>
        <p>Selecione o tipo de emergência:</p>
        
        <div class="sinistro-options">
          <div class="sinistro-option" onclick="selecionarOpcao('acidente')">
            <i class="fas fa-car-crash"></i>
            <h4>Acidente</h4>
          </div>
          
          <div class="sinistro-option" onclick="selecionarOpcao('mecanico')">
            <i class="fas fa-cog"></i>
            <h4>Problema Mecânico</h4>
          </div>
          
          <div class="sinistro-option" onclick="selecionarOpcao('saude')">
            <i class="fas fa-heartbeat"></i>
            <h4>Problema de Saúde</h4>
          </div>
          
          <div class="sinistro-option" onclick="selecionarOpcao('sinistro')">
            <i class="fas fa-file-alt"></i>
            <h4>Sinistro/Avaria</h4>
            <small>Preencher formulário</small>
          </div>
        </div>
        
        <div class="action-footer">
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove(); resolve(null)">
            Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Configurar handlers
    window.selecionarOpcao = function(opcao) {
      modal.remove();
      resolve(opcao);
    };
  });
}

// ========== FEEDBACK ==========
window.abrirFeedback = function(perfil) {
  mostrarTela(`tela-feedback-${perfil}`);
};

window.enviarFeedback = async function(perfil) {
  const tipo = document.getElementById(`feedbackTipo${perfil}`)?.value;
  const mensagem = document.getElementById(`feedbackMensagem${perfil}`)?.value;
  
  if (!tipo || !mensagem) {
    alert('Preencha todos os campos');
    return;
  }
  
  if (mensagem.length < 10) {
    alert('A mensagem deve ter pelo menos 10 caracteres');
    return;
  }
  
  try {
    const dados = {
      tipo: tipo,
      mensagem: mensagem,
      status: 'pendente',
      timestamp: new Date()
    };
    
    if (perfil === 'motorista' && estadoApp.motorista) {
      dados.motorista = estadoApp.motorista.nome;
      dados.matricula = estadoApp.motorista.matricula;
      dados.perfil = 'motorista';
    } else if (perfil === 'passageiro') {
      dados.perfil = 'passageiro';
    }
    
    await registrarFeedback(dados);
    
    document.getElementById(`feedbackMensagem${perfil}`).value = '';
    
    if (perfil === 'motorista') {
      mostrarTela('tela-motorista');
    } else {
      mostrarTela('tela-passageiro');
    }
    
    mostrarNotificacao('✅ Feedback Enviado', 'Obrigado pelo seu feedback!');
    
  } catch (erro) {
    console.error('Erro ao enviar feedback:', erro);
    alert('❌ Erro ao enviar feedback. Tente novamente.');
  }
};

// ========== NOVA FUNÇÃO: CARREGAR ROTAS PARA PASSAGEIRO ==========
window.carregarRotasPassageiro = async function() {
  const container = document.getElementById('rotasPassageiroContainer');
  if (!container) return;
  
  showLoading('Carregando informações das rotas...');
  
  try {
    // Buscar motoristas ativos
    const q = query(collection(db, 'rotas_em_andamento'), 
      where("ativo", "==", true),
      where("online", "==", true)
    );
    const snapshot = await getDocs(q);
    const motoristasAtivos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Agrupar motoristas por rota
    const motoristasPorRota = {};
    motoristasAtivos.forEach(motorista => {
      if (motorista.rota && motorista.ativo !== false) {
        if (!motoristasPorRota[motorista.rota]) {
          motoristasPorRota[motorista.rota] = [];
        }
        motoristasPorRota[motorista.rota].push(motorista);
      }
    });
    
    // Criar HTML para todas as rotas
    let html = '<div class="rotas-passageiro-grid">';
    
    ROTAS_DISPONIVEIS.forEach(rota => {
      const motoristasNaRota = motoristasPorRota[rota.nome] || [];
      const temMotorista = motoristasNaRota.length > 0;
      
      html += `
        <div class="rota-passageiro-card ${temMotorista ? 'com-motorista' : 'sem-motorista'}">
          <div class="rota-passageiro-header">
            <div class="rota-passageiro-icon">
              ${rota.tipo === 'adm' ? '🏢' : rota.tipo === 'retorno' ? '🔄' : '🚛'}
            </div>
            <div class="rota-passageiro-info">
              <h4>${rota.nome}</h4>
              <p class="rota-descricao">${rota.desc}</p>
              <div class="rota-passageiro-status">
                ${temMotorista ? 
                  `<span class="status-online"><i class="fas fa-circle"></i> ${motoristasNaRota.length} motorista(s) ativo(s)</span>` :
                  `<span class="status-offline"><i class="fas fa-circle"></i> Sem motoristas ativos</span>`
                }
              </div>
            </div>
          </div>
          
          ${temMotorista ? `
            <div class="motoristas-na-rota">
              <h5><i class="fas fa-users"></i> Motoristas ativos nesta rota:</h5>
              ${motoristasNaRota.map(motorista => {
                const ultimaAtualizacao = motorista.ultimaAtualizacao ? 
                  new Date(motorista.ultimaAtualizacao.toDate()) : 
                  new Date();
                
                const tempoDecorrido = calcularTempoDecorrido(ultimaAtualizacao);
                const precisaoText = motorista.precisao ? 
                  `Precisão: ${motorista.precisao.toFixed(0)}m` : '';
                
                return `
                <div class="motorista-passageiro-item">
                  <div class="motorista-info">
                    <strong><i class="fas fa-user"></i> ${motorista.motorista}</strong>
                    <span class="onibus-info">${motorista.onibus}</span>
                  </div>
                  <div class="motorista-detalhes">
                    ${motorista.distancia ? `<span class="detalhe-item"><i class="fas fa-road"></i> ${motorista.distancia} km</span>` : ''}
                    ${motorista.velocidade ? `<span class="detalhe-item"><i class="fas fa-tachometer-alt"></i> ${motorista.velocidade} km/h</span>` : ''}
                    <span class="detalhe-item"><i class="fas fa-clock"></i> ${tempoDecorrido}</span>
                    ${precisaoText ? `<span class="detalhe-item"><i class="fas fa-crosshairs"></i> ${precisaoText}</span>` : ''}
                  </div>
                  <div class="motorista-acoes">
                    <button class="btn small" onclick="verLocalizacaoMotorista(${motorista.latitude}, ${motorista.longitude}, '${motorista.motorista}', '${motorista.onibus}')">
                      <i class="fas fa-map-marker-alt"></i> Ver Mapa
                    </button>
                    <button class="btn small secondary" onclick="verDetalhesMotorista('${motorista.matricula}')">
                      <i class="fas fa-info-circle"></i> Detalhes
                    </button>
                  </div>
                </div>
              `}).join('')}
            </div>
          ` : `
            <div class="sem-motorista-message">
              <p><i class="fas fa-info-circle"></i> Nenhum motorista ativo nesta rota no momento.</p>
            </div>
          `}
          
          <div class="rota-passageiro-actions">
            <button class="btn secondary" onclick="abrirRotaNoMaps('${rota.nome}')">
              <i class="fas fa-map"></i> Ver Rota no Maps
            </button>
            ${temMotorista ? `
              <button class="btn" onclick="verTodosMotoristasRota('${rota.nome}')">
                <i class="fas fa-eye"></i> Ver Todos os Motoristas
              </button>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
  } catch (error) {
    console.error('Erro ao carregar rotas para passageiro:', error);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h4>Erro ao carregar rotas</h4>
        <p>Não foi possível carregar as informações das rotas. Tente novamente mais tarde.</p>
        <button class="btn btn-secondary" onclick="carregarRotasPassageiro()">
          <i class="fas fa-redo"></i> Tentar Novamente
        </button>
      </div>
    `;
  } finally {
    hideLoading();
  }
};

// ========== FUNÇÃO PARA VER TODOS OS MOTORISTAS DE UMA ROTA ==========
window.verTodosMotoristasRota = function(nomeRota) {
  console.log('Ver todos os motoristas da rota:', nomeRota);
  alert(`Motoristas na rota ${nomeRota}\n\nEsta funcionalidade mostrará todos os motoristas ativos nesta rota.`);
};

// ========== FUNÇÃO PARA VER DETALHES DO MOTORISTA ==========
window.verDetalhesMotorista = async function(matricula) {
  try {
    showLoading('Carregando detalhes do motorista...');
    
    const q = query(collection(db, 'rotas_em_andamento'), 
      where("matricula", "==", matricula),
      where("ativo", "==", true)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      alert('Motorista não encontrado ou não está ativo.');
      hideLoading();
      return;
    }
    
    const motorista = snapshot.docs[0].data();
    const ultimaAtualizacao = motorista.ultimaAtualizacao ? 
      new Date(motorista.ultimaAtualizacao.toDate()) : 
      new Date();
    
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-user-circle"></i> Detalhes do Motorista</h3>
        
        <div class="motorista-detalhes-modal">
          <div class="motorista-info-modal">
            <div class="info-item">
              <span class="info-label"><i class="fas fa-user"></i> Nome:</span>
              <span class="info-value">${motorista.motorista}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="fas fa-id-card"></i> Matrícula:</span>
              <span class="info-value">${motorista.matricula}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="fas fa-bus"></i> Ônibus:</span>
              <span class="info-value">${motorista.onibus}</span>
            </div>
            <div class="info-item">
              <span class="info-label"><i class="fas fa-route"></i> Rota:</span>
              <span class="info-value">${motorista.rota}</span>
            </div>
            ${motorista.tag_ac ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-tag"></i> TAG AC:</span>
              <span class="info-value">${motorista.tag_ac}</span>
            </div>
            ` : ''}
            ${motorista.distancia ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-road"></i> Distância:</span>
              <span class="info-value">${motorista.distancia} km rodados</span>
            </div>
            ` : ''}
            ${motorista.velocidade ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-tachometer-alt"></i> Velocidade:</span>
              <span class="info-value">${motorista.velocidade} km/h</span>
            </div>
            ` : ''}
            <div class="info-item">
              <span class="info-label"><i class="fas fa-clock"></i> Última atualização:</span>
              <span class="info-value">${ultimaAtualizacao.toLocaleTimeString()}</span>
            </div>
            ${motorista.precisao ? `
            <div class="info-item">
              <span class="info-label"><i class="fas fa-crosshairs"></i> Precisão GPS:</span>
              <span class="info-value">${motorista.precisao.toFixed(0)} metros</span>
            </div>
            ` : ''}
          </div>
          
          <div class="motorista-acoes-modal">
            <button class="btn" onclick="verLocalizacaoMotorista(${motorista.latitude}, ${motorista.longitude}, '${motorista.motorista}', '${motorista.onibus}')">
              <i class="fas fa-map-marker-alt"></i> Ver no Mapa
            </button>
            <button class="btn secondary" onclick="abrirRotaNoMaps('${motorista.rota}')">
              <i class="fas fa-route"></i> Ver Rota
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (error) {
    console.error('Erro ao carregar detalhes do motorista:', error);
    alert('Erro ao carregar detalhes do motorista.');
  } finally {
    hideLoading();
  }
};

// ========== MONITORAMENTO PARA PASSAGEIRO (ATUALIZADO) ==========
function iniciarMonitoramentoPassageiro() {
  if (estadoApp.unsubscribeRotas) return;
  
  estadoApp.unsubscribeRotas = monitorarRotas((rotas) => {
    const container = document.getElementById('rotasAtivasList');
    if (!container) return;
    
    const rotasAtivas = rotas.filter(r => r.ativo !== false && r.online !== false);
    
    if (rotasAtivas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i class="fas fa-bus-slash"></i></div>
          <h4>Nenhuma rota ativa no momento</h4>
          <p>Não há motoristas compartilhando localização no momento.</p>
          <button class="btn btn-secondary" onclick="mostrarTela('tela-rotas-passageiro')">
            <i class="fas fa-route"></i> Ver Todas as Rotas
          </button>
        </div>
      `;
      return;
    }
    
    // Agrupar por rota
    const rotasAgrupadas = {};
    rotasAtivas.forEach(rota => {
      if (!rotasAgrupadas[rota.rota]) {
        rotasAgrupadas[rota.rota] = [];
      }
      rotasAgrupadas[rota.rota].push(rota);
    });
    
    // Ordenar rotas: ADM primeiro, depois operacionais, depois retorno
    const rotasOrdenadas = Object.entries(rotasAgrupadas).sort(([a], [b]) => {
      const tipoA = a.includes('ADM') ? 0 : a.includes('RETORNO') ? 2 : 1;
      const tipoB = b.includes('ADM') ? 0 : b.includes('RETORNO') ? 2 : 1;
      return tipoA - tipoB;
    });
    
    container.innerHTML = rotasOrdenadas.map(([nomeRota, motoristas]) => `
      <div class="rota-grupo">
        <h4><i class="fas fa-route"></i> ${nomeRota}</h4>
        ${motoristas.map(motorista => {
          const ultimaAtualizacao = motorista.ultimaAtualizacao ? 
            new Date(motorista.ultimaAtualizacao.toDate()) : 
            new Date();
          
          return `
          <div class="motorista-card">
            <div class="motorista-info">
              <div class="motorista-header">
                <strong><i class="fas fa-user"></i> ${motorista.motorista}</strong>
                <span class="onibus-badge">${motorista.onibus}</span>
              </div>
              <div class="motorista-detalhes">
                <span class="detalhe-item"><i class="fas fa-road"></i> ${motorista.distancia || '0'} km</span>
                <span class="detalhe-item"><i class="fas fa-tachometer-alt"></i> ${motorista.velocidade || '0'} km/h</span>
                <span class="detalhe-item"><i class="fas fa-clock"></i> ${ultimaAtualizacao.toLocaleTimeString()}</span>
                ${motorista.precisao ? `<span class="detalhe-item"><i class="fas fa-crosshairs"></i> ${motorista.precisao.toFixed(0)}m</span>` : ''}
              </div>
            </div>
            <div class="motorista-actions">
              <button class="btn small" onclick="verLocalizacaoMotorista(${motorista.latitude}, ${motorista.longitude}, '${motorista.motorista}', '${motorista.onibus}')">
                <i class="fas fa-map-marker-alt"></i> Mapa
              </button>
              <button class="btn small secondary" onclick="abrirRotaNoMaps('${motorista.rota}')">
                <i class="fas fa-route"></i> Rota
              </button>
            </div>
          </div>
        `}).join('')}
      </div>
    `).join('');
  });
}

// ========== FUNÇÕES RESTANTES (MANTIDAS IGUAIS) ==========
// [As funções restantes permanecem exatamente como estavam...]

function iniciarMonitoramentoAdmin() {
  if (estadoApp.unsubscribeRotas) return;
  
  estadoApp.unsubscribeRotas = monitorarRotas((rotas) => {
    const container = document.getElementById('adminRotasList');
    const countElement = document.getElementById('rotasAtivasCount');
    const motoristasAtivosElement = document.getElementById('motoristasAtivosCount');
    
    if (!container) return;
    
    const rotasAtivas = rotas.filter(r => r.ativo !== false && r.online !== false);
    
    if (countElement) {
      countElement.textContent = rotasAtivas.length;
    }
    
    if (motoristasAtivosElement) {
      const motoristasUnicos = [...new Set(rotasAtivas.map(r => r.matricula))];
      motoristasAtivosElement.textContent = motoristasUnicos.length;
    }
    
    if (rotasAtivas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚛</div>
          <h4>Nenhuma rota ativa</h4>
          <p>Nenhum motorista está compartilhando localização no momento.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = rotasAtivas.map(rota => `
      <div class="rota-admin-card ${rota.velocidade > 100 ? 'velocidade-alta' : ''}">
        <div class="rota-admin-header">
          <div>
            <strong>${rota.rota}</strong>
            <span class="onibus-tag">${rota.onibus} (${rota.tag_ac})</span>
          </div>
          <span class="status-badge ${rota.velocidade > 100 ? 'alerta' : 'ativo'}">
            ${rota.velocidade > 100 ? '⚡' : '✅'} ${rota.velocidade ? rota.velocidade + ' km/h' : 'Ativo'}
          </span>
        </div>
        
        <div class="rota-admin-info">
          <div class="info-row">
            <span>👤 Motorista:</span>
            <span>${rota.motorista} (${rota.matricula})</span>
          </div>
          <div class="info-row">
            <span>📍 Localização:</span>
            <span>${rota.latitude?.toFixed(6)}, ${rota.longitude?.toFixed(6)}</span>
          </div>
          <div class="info-row">
            <span>📏 Distância:</span>
            <span>${rota.distancia || '0'} km rodados</span>
          </div>
          <div class="info-row">
            <span>⏱️ Última atualização:</span>
            <span>${rota.ultimaAtualizacao ? new Date(rota.ultimaAtualizacao.toDate()).toLocaleTimeString() : '--:--'}</span>
          </div>
          <div class="info-row">
            <span>🎯 Precisão:</span>
            <span>${rota.precisao ? rota.precisao.toFixed(0) + 'm' : '--'}</span>
          </div>
        </div>
        
        <div class="rota-admin-actions">
          <button class="btn small" onclick="verMapaAdmin(${rota.latitude}, ${rota.longitude})">
            🗺️ Ver Mapa
          </button>
          <button class="btn small secondary" onclick="verDetalhesRota('${rota.matricula}')">
            📊 Detalhes
          </button>
          <button class="btn small warning" onclick="enviarNotificacaoMotorista('${rota.matricula}')">
            📢 Notificar
          </button>
        </div>
      </div>
    `).join('');
  });
}

function iniciarMonitoramentoEmergencias() {
  if (estadoApp.unsubscribeEmergencias) return;
  
  estadoApp.unsubscribeEmergencias = monitorarEmergencias((emergencias) => {
    const container = document.getElementById('emergenciasList');
    const countElement = document.getElementById('emergenciasCount');
    
    if (!container) return;
    
    const emergenciasAtivas = emergencias.filter(e => e.status === 'pendente');
    
    if (countElement) {
      countElement.textContent = emergenciasAtivas.length;
    }
    
    if (emergenciasAtivas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h4>Nenhuma emergência ativa</h4>
          <p>Todas as situações estão sob controle.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = emergenciasAtivas.map(emergencia => `
      <div class="emergencia-card">
        <div class="emergencia-header">
          <div class="emergencia-titulo">
            <span class="emergencia-icon">🚨</span>
            <strong>${emergencia.tipo}</strong>
          </div>
          <span class="tempo-decorrido">${calcularTempoDecorrido(emergencia.timestamp)}</span>
        </div>
        
        <div class="emergencia-info">
          <div class="info-row">
            <span>👤 Motorista:</span>
            <span>${emergencia.motorista} (${emergencia.matricula})</span>
          </div>
          <div class="info-row">
            <span>🚌 Ônibus:</span>
            <span>${emergencia.onibus}</span>
          </div>
          <div class="info-row">
            <span>🗺️ Rota:</span>
            <span>${emergencia.rota}</span>
          </div>
          <div class="info-row">
            <span>📝 Descrição:</span>
            <span>${emergencia.descricao}</span>
          </div>
        </div>
        
        <div class="emergencia-actions">
          <button class="btn small success" onclick="resolverEmergenciaAdmin('${emergencia.id}')">
            ✅ Resolver
          </button>
          <button class="btn small" onclick="contatarMotoristaAdmin('${emergencia.matricula}')">
            📞 Contatar
          </button>
          <button class="btn small warning" onclick="verLocalizacaoEmergencia('${emergencia.id}')">
            📍 Localização
          </button>
        </div>
      </div>
    `).join('');
  });
}

function iniciarMonitoramentoFeedbacks() {
  if (estadoApp.unsubscribeFeedbacks) return;
  
  estadoApp.unsubscribeFeedbacks = monitorarFeedbacks((feedbacks) => {
    const container = document.getElementById('feedbacksList');
    const countElement = document.getElementById('feedbacksCount');
    
    if (!container) return;
    
    const feedbacksPendentes = feedbacks.filter(f => f.status === 'pendente');
    
    if (countElement) {
      countElement.textContent = feedbacksPendentes.length;
    }
    
    if (feedbacksPendentes.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💭</div>
          <h4>Nenhum feedback pendente</h4>
          <p>Todos os feedbacks foram revisados.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = feedbacksPendentes.map(feedback => `
      <div class="feedback-card">
        <div class="feedback-header">
          <div>
            <span class="feedback-perfil">${feedback.perfil === 'motorista' ? '👤 Motorista' : '🧍 Passageiro'}</span>
            <span class="feedback-tipo ${feedback.tipo}">${feedback.tipo}</span>
          </div>
          <span class="tempo-decorrido">${calcularTempoDecorrido(feedback.timestamp)}</span>
        </div>
        
        <div class="feedback-mensagem">
          <p>${feedback.mensagem}</p>
        </div>
        
        ${feedback.motorista ? `
        <div class="feedback-info">
          <small>👤 ${feedback.motorista} ${feedback.matricula ? `(${feedback.matricula})` : ''}</small>
        </div>
        ` : ''}
        
        <div class="feedback-actions">
          <button class="btn small success" onclick="resolverFeedbackAdmin('${feedback.id}')">
            ✅ Resolver
          </button>
          <button class="btn small" onclick="responderFeedbackAdmin('${feedback.id}')">
            💬 Responder
          </button>
        </div>
      </div>
    `).join('');
  });
}

function iniciarMonitoramentoAvisos() {
  if (estadoApp.unsubscribeAvisos) return;
  
  estadoApp.unsubscribeAvisos = monitorarAvisos((avisos) => {
    estadoApp.avisosAtivos = avisos;
    
    const avisosCount = document.getElementById('avisosCount');
    if (avisosCount) {
      avisosCount.textContent = avisos.length;
      avisosCount.style.display = avisos.length > 0 ? 'inline' : 'none';
    }
  });
}

// ========== MONITORAMENTO DE USUÁRIOS ONLINE ==========
function iniciarMonitoramentoOnline() {
  setInterval(async () => {
    await atualizarOnlineUsers();
  }, 30000);
  
  atualizarOnlineUsers();
}

async function atualizarOnlineUsers() {
  try {
    const snapshot = await getDocs(collection(db, 'rotas_em_andamento'));
    const onlineUsers = snapshot.docs
      .filter(doc => {
        const data = doc.data();
        return data.online === true && data.ativo !== false;
      })
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    
    estadoApp.onlineUsers = onlineUsers;
    
    const usuariosOnlineElement = document.getElementById('usuariosOnline');
    if (usuariosOnlineElement) {
      usuariosOnlineElement.textContent = onlineUsers.length;
    }
    
    if (document.getElementById('tela-relatorios')?.classList.contains('ativa')) {
      atualizarListaOnlineUsers();
    }
  } catch (error) {
    console.error('Erro ao buscar usuários online:', error);
  }
}

function atualizarListaOnlineUsers() {
  const container = document.getElementById('onlineUsersList');
  if (!container) return;
  
  if (estadoApp.onlineUsers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-users-slash"></i>
        <h4>Nenhum usuário online</h4>
        <p>Nenhum motorista está ativo no momento.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="online-user-list">
      ${estadoApp.onlineUsers.map(user => `
        <div class="online-user-item">
          <span class="online-dot"></span>
          <div class="user-info">
            <strong>${user.motorista}</strong>
            <small>${user.onibus} • ${user.rota}</small>
          </div>
          <small>${user.ultimaAtualizacao ? new Date(user.ultimaAtualizacao.toDate()).toLocaleTimeString() : ''}</small>
        </div>
      `).join('')}
    </div>
  `;
}

// ========== FUNÇÕES AUXILIARES ==========
function calcularTempoDecorrido(timestamp) {
  if (!timestamp) return 'Agora mesmo';
  
  const agora = new Date();
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = agora - data;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins} min atrás`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h atrás`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d atrás`;
}

// ========== NAVEGAÇÃO ENTRE TELAS ==========
window.mostrarTela = function(id) {
  console.log('🔄 Mostrando tela:', id);
  
  document.querySelectorAll('.tela').forEach(tela => {
    tela.classList.add('hidden');
    tela.classList.remove('ativa');
  });
  
  const alvo = document.getElementById(id);
  if (!alvo) {
    console.error('Tela não encontrada:', id);
    return;
  }
  
  alvo.classList.remove('hidden');
  alvo.classList.add('ativa');
  
  switch(id) {
    case 'tela-rotas':
      setTimeout(() => carregarRotas(), 100);
      break;
    case 'tela-passageiro':
      iniciarMonitoramentoPassageiro();
      break;
    case 'tela-admin-dashboard':
      iniciarMonitoramentoAdmin();
      break;
    case 'tela-motorista':
      atualizarInfoMotorista();
      break;
    case 'tela-rotas-passageiro':
      carregarRotasPassageiro();
      break;
    case 'tela-relatorios':
      carregarRelatorios();
      atualizarListaOnlineUsers();
      break;
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function atualizarInfoMotorista() {
  if (!estadoApp.motorista) return;
  
  const nomeElement = document.getElementById('motoristaNome');
  const matriculaElement = document.getElementById('motoristaMatricula');
  
  if (nomeElement) nomeElement.textContent = estadoApp.motorista.nome;
  if (matriculaElement) matriculaElement.textContent = estadoApp.motorista.matricula;
  
  const userInfo = document.querySelector('.user-info');
  if (userInfo && !document.querySelector('.user-tags')) {
    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'user-tags';
    userInfo.appendChild(tagsDiv);
    atualizarInfoOnibus();
  }
}

// ========== CARREGAMENTO DE ROTAS PARA MOTORISTA ==========
function carregarRotas() {
  const container = document.getElementById('routesContainer');
  if (!container) {
    console.error('Container de rotas não encontrado');
    return;
  }
  
  const motoristaLogado = !!estadoApp.motorista;
  const onibusSelecionado = !!estadoApp.onibusAtivo;
  
  container.innerHTML = ROTAS_DISPONIVEIS.map(rota => `
    <div class="route-item ${rota.tipo}" data-tipo="${rota.tipo}">
      <div class="route-info">
        <div class="route-header">
          <span class="route-icon">${rota.tipo === 'adm' ? '🏢' : rota.tipo === 'retorno' ? '🔄' : '🚛'}</span>
          <div>
            <div class="route-nome">${rota.nome}</div>
            <small class="route-desc">${rota.desc}</small>
          </div>
        </div>
        <div class="route-status" id="status-${rota.id}">
          <small>🔄 Verificando motoristas...</small>
        </div>
      </div>
      <div class="route-actions">
        ${motoristaLogado && onibusSelecionado ? `
          <button class="btn" onclick="iniciarRota('${rota.nome}')">
            ▶️ Iniciar Rota
          </button>
        ` : `
          <button class="btn disabled" disabled title="Selecione um ônibus primeiro">
            ⚠️ Selecione ônibus
          </button>
        `}
        <button class="btn secondary" onclick="abrirRotaNoMaps('${rota.nome}')">
          🗺️ Abrir Rota
        </button>
        <button class="btn outline" onclick="verMotoristasNaRota('${rota.nome}')">
          👁️ Ver Motoristas
        </button>
      </div>
    </div>
  `).join('');
  
  verificarMotoristasPorRota();
}

async function verificarMotoristasPorRota() {
  const q = query(collection(db, 'rotas_em_andamento'), where("ativo", "==", true));
  const snapshot = await getDocs(q);
  const rotasAtivas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  
  rotasAtivas.forEach(rota => {
    const statusElement = document.getElementById(`status-${rota.id}`);
    if (statusElement) {
      statusElement.innerHTML = `
        <small>✅ <strong>${rota.motorista}</strong> no ônibus ${rota.onibus}</small>
        <small>📏 ${rota.distancia || '0'} km rodados</small>
        <small>📍 ${rota.velocidade ? rota.velocidade + ' km/h' : 'Ativo'}</small>
      `;
    }
  });
  
  document.querySelectorAll('.route-item').forEach(item => {
    const routeId = item.querySelector('.route-status')?.id.replace('status-', '');
    if (routeId && !rotasAtivas.find(r => r.id === routeId)) {
      const statusElement = document.getElementById(`status-${routeId}`);
      if (statusElement) {
        statusElement.innerHTML = `<small>⏳ Nenhum motorista ativo</small>`;
      }
    }
  });
}

// ========== FUNÇÕES DE MAPA ==========
window.abrirRotaNoMaps = function(nomeRota) {
  const rotas = {
    'ROTA ADM 01': 'https://www.google.com/maps/d/u/1/edit?mid=18BCgBpobp1Olzmzy0RnPCUEd7Vnkc5s&usp=sharing',
    'ROTA ADM 02': 'https://www.google.com/maps/d/u/1/edit?mid=1WxbIX8nw0xyGBLMvvi1SF3DRuwmZ5oM&usp=sharing',
    'ROTA 01': 'https://www.google.com/maps/d/u/1/edit?mid=1jCfFxq1ZwecS2IcHy7xGFLLgttsM-RQ&usp=sharing',
    'ROTA 02': 'https://www.google.com/maps/d/u/1/edit?mid=1LCvNJxWBbZ_chpbdn_lk_Dm6NPA194g&usp=sharing',
    'ROTA 03': 'https://www.google.com/maps/d/u/1/edit?mid=1bdwkrClh5AZml0mnDGlOzYcaR4w1BL0&usp=sharing',
    'ROTA 04': 'https://www.google.com/maps/d/u/1/edit?mid=1IEuZ4TCi9EU_AcB2Ags2jD-RaFs0754&usp=sharing',
    'ROTA 05': 'https://www.google.com/maps/d/u/1/edit?mid=1L9xjAWFUupMc7eQbqVJz-SNWlYX5SHo&usp=sharing',
    'RETORNO OVERLAND - ROTA 01': 'https://www.google.com/maps/d/u/1/edit?mid=1ClQVIaRLOYYWHU7fvP87r1BVy85a_eg&usp=sharing',
    'RETORNO OVERLAND - ROTA 02': 'https://www.google.com/maps/d/u/1/edit?mid=1WOIMgeLgV01B8yk7HoX6tazdCHXQnok&usp=sharing'
  };
  
  const url = rotas[nomeRota];
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    alert('Rota não encontrada');
  }
};

window.verLocalizacaoMotorista = function(lat, lng, motorista, onibus) {
  const url = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
  window.open(url, '_blank', 'noopener,noreferrer');
  
  mostrarNotificacao('📍 Localização', `Abrindo localização de ${motorista} (${onibus})`);
};

window.verMapaAdmin = function(lat, lng) {
  const url = `https://www.google.com/maps/@${lat},${lng},15z`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.verMotoristasNaRota = async function(nomeRota) {
  mostrarTela('tela-ver-motoristas');
  
  try {
    const q = query(collection(db, 'rotas_em_andamento'), 
      where("ativo", "==", true),
      where("rota", "==", nomeRota)
    );
    
    const snapshot = await getDocs(q);
    const motoristas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const container = document.getElementById('motoristasContainer');
    if (!container) return;
    
    if (motoristas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users-slash"></i>
          <h4>Nenhum motorista ativo</h4>
          <p>Não há motoristas compartilhando localização nesta rota no momento.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = motoristas.map(motorista => `
      <div class="motorista-detalhe-card">
        <div class="motorista-detalhe-header">
          <div class="motorista-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="motorista-info-detalhe">
            <h4>${motorista.motorista}</h4>
            <p>Matrícula: ${motorista.matricula}</p>
            <span class="onibus-badge">${motorista.onibus}</span>
          </div>
        </div>
        
        <div class="motorista-detalhe-info">
          <div class="info-row">
            <span><i class="fas fa-route"></i> Rota:</span>
            <span>${motorista.rota}</span>
          </div>
          <div class="info-row">
            <span><i class="fas fa-road"></i> Distância:</span>
            <span>${motorista.distancia || '0'} km rodados</span>
          </div>
          <div class="info-row">
            <span><i class="fas fa-tachometer-alt"></i> Velocidade:</span>
            <span>${motorista.velocidade || '0'} km/h</span>
          </div>
          <div class="info-row">
            <span><i class="fas fa-clock"></i> Última atualização:</span>
            <span>${motorista.ultimaAtualizacao ? new Date(motorista.ultimaAtualizacao.toDate()).toLocaleTimeString() : '--:--'}</span>
          </div>
          <div class="info-row">
            <span><i class="fas fa-map-marker-alt"></i> Localização:</span>
            <span>${motorista.latitude?.toFixed(4)}, ${motorista.longitude?.toFixed(4)}</span>
          </div>
        </div>
        
        <div class="motorista-detalhe-actions">
          <button class="btn" onclick="verLocalizacaoMotorista(${motorista.latitude}, ${motorista.longitude}, '${motorista.motorista}', '${motorista.onibus}')">
            <i class="fas fa-map"></i> Ver Mapa
          </button>
          <button class="btn secondary" onclick="abrirRotaNoMaps('${motorista.rota}')">
            <i class="fas fa-route"></i> Ver Rota
          </button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Erro ao carregar motoristas:', error);
  }
};

// ========== NOTIFICAÇÕES ==========
function mostrarNotificacao(titulo, mensagem) {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações desktop");
    return;
  }
  
  if (Notification.permission === "granted") {
    criarNotificacao(titulo, mensagem);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        criarNotificacao(titulo, mensagem);
      }
    });
  }
  
  criarNotificacaoTela(titulo, mensagem);
}

function criarNotificacao(titulo, mensagem) {
  const notification = new Notification(titulo, {
    body: mensagem,
    icon: 'logo.jpg',
    tag: 'ac-transporte'
  });
  
  notification.onclick = function() {
    window.focus();
    this.close();
  };
}

function criarNotificacaoTela(titulo, mensagem) {
  const notificacao = document.createElement('div');
  notificacao.className = 'notificacao-tela';
  notificacao.innerHTML = `
    <div class="notificacao-conteudo">
      <strong>${titulo}</strong>
      <p>${mensagem}</p>
    </div>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    if (notificacao.parentElement) {
      notificacao.remove();
    }
  }, 5000);
}

// ========== FUNÇÕES ADMIN ==========
window.enviarNotificacaoGeral = async function() {
  const titulo = document.getElementById('notificacaoTitulo').value;
  const mensagem = document.getElementById('notificacaoMensagem').value;
  const destino = document.getElementById('notificacaoDestino').value;
  
  if (!titulo || !mensagem) {
    alert('Preencha título e mensagem');
    return;
  }
  
  try {
    await registrarAviso({
      titulo: titulo,
      mensagem: mensagem,
      destino: destino,
      ativo: true,
      timestamp: new Date()
    });
    
    document.getElementById('notificacaoTitulo').value = '';
    document.getElementById('notificacaoMensagem').value = '';
    
    mostrarNotificacao('📢 Notificação Enviada', `Notificação enviada para ${destino}`);
    
  } catch (erro) {
    console.error('Erro ao enviar notificação:', erro);
    alert('❌ Erro ao enviar notificação');
  }
};

// ========== GESTÃO DE AVISOS (ADMIN) ==========
window.gerenciarAvisos = async function() {
  try {
    showLoading('Carregando avisos...');
    
    const avisos = await getAvisos();
    estadoApp.avisosAtivos = avisos;
    
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal large">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-bullhorn"></i> Gerenciar Avisos</h3>
        
        <div class="admin-actions-bar">
          <button class="btn success" onclick="criarNovoAviso()">
            <i class="fas fa-plus"></i> Novo Aviso
          </button>
        </div>
        
        <div class="avisos-admin-list">
          ${avisos.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-bullhorn"></i>
              <h4>Nenhum aviso cadastrado</h4>
              <p>Clique em "Novo Aviso" para criar o primeiro.</p>
            </div>
          ` : avisos.map(aviso => `
            <div class="aviso-admin-item" id="aviso-${aviso.id}">
              <div class="aviso-admin-header">
                <div>
                  <h4>${aviso.titulo}</h4>
                  <small class="aviso-destino-badge">Para: ${aviso.destino || 'Todos'}</small>
                  <small class="aviso-data">${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleString() : ''}</small>
                </div>
                <div class="aviso-admin-actions">
                  <button class="icon-btn" onclick="editarAviso('${aviso.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="icon-btn danger" onclick="excluirAviso('${aviso.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div class="aviso-admin-content">
                <p>${aviso.mensagem}</p>
                <div class="aviso-status">
                  <span class="status-badge ${aviso.ativo ? 'ativo' : 'inativo'}">
                    ${aviso.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (erro) {
    console.error('Erro ao carregar avisos:', erro);
    alert('❌ Erro ao carregar avisos');
  } finally {
    hideLoading();
  }
};

window.criarNovoAviso = function() {
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3><i class="fas fa-plus"></i> Criar Novo Aviso</h3>
      
      <div class="form-group">
        <label>Título *</label>
        <input type="text" id="novoAvisoTitulo" class="form-input" placeholder="Título do aviso" required>
      </div>
      
      <div class="form-group">
        <label>Mensagem *</label>
        <textarea id="novoAvisoMensagem" class="form-input" rows="4" placeholder="Mensagem do aviso" required></textarea>
      </div>
      
      <div class="form-group">
        <label>Destino</label>
        <select id="novoAvisoDestino" class="form-input">
          <option value="todos">Todos</option>
          <option value="motoristas">Motoristas</option>
          <option value="passageiros">Passageiros</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" id="novoAvisoAtivo" checked> Aviso ativo
        </label>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarNovoAviso()">
          <i class="fas fa-save"></i> Salvar Aviso
        </button>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
};

window.salvarNovoAviso = async function() {
  const titulo = document.getElementById('novoAvisoTitulo').value;
  const mensagem = document.getElementById('novoAvisoMensagem').value;
  const destino = document.getElementById('novoAvisoDestino').value;
  const ativo = document.getElementById('novoAvisoAtivo').checked;
  
  if (!titulo || !mensagem) {
    alert('Preencha título e mensagem');
    return;
  }
  
  try {
    showLoading('Salvando aviso...');
    
    await registrarAviso({
      titulo: titulo,
      mensagem: mensagem,
      destino: destino,
      ativo: ativo,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Aviso Criado', 'Aviso criado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    gerenciarAvisos();
    
  } catch (erro) {
    console.error('Erro ao salvar aviso:', erro);
    alert('❌ Erro ao salvar aviso');
  } finally {
    hideLoading();
  }
};

window.editarAviso = async function(avisoId) {
  try {
    showLoading('Carregando aviso...');
    
    const aviso = estadoApp.avisosAtivos.find(a => a.id === avisoId);
    if (!aviso) {
      alert('Aviso não encontrado');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-back';
    modal.innerHTML = `
      <div class="modal">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-edit"></i> Editar Aviso</h3>
        
        <div class="form-group">
          <label>Título *</label>
          <input type="text" id="editarAvisoTitulo" class="form-input" value="${aviso.titulo || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Mensagem *</label>
          <textarea id="editarAvisoMensagem" class="form-input" rows="4" required>${aviso.mensagem || ''}</textarea>
        </div>
        
        <div class="form-group">
          <label>Destino</label>
          <select id="editarAvisoDestino" class="form-input">
            <option value="todos" ${aviso.destino === 'todos' ? 'selected' : ''}>Todos</option>
            <option value="motoristas" ${aviso.destino === 'motoristas' ? 'selected' : ''}>Motoristas</option>
            <option value="passageiros" ${aviso.destino === 'passageiros' ? 'selected' : ''}>Passageiros</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>
            <input type="checkbox" id="editarAvisoAtivo" ${aviso.ativo ? 'checked' : ''}> Aviso ativo
          </label>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="salvarEdicaoAviso('${avisoId}')">
            <i class="fas fa-save"></i> Salvar Alterações
          </button>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (erro) {
    console.error('Erro ao carregar aviso:', erro);
    alert('❌ Erro ao carregar aviso');
  } finally {
    hideLoading();
  }
};

window.salvarEdicaoAviso = async function(avisoId) {
  const titulo = document.getElementById('editarAvisoTitulo').value;
  const mensagem = document.getElementById('editarAvisoMensagem').value;
  const destino = document.getElementById('editarAvisoDestino').value;
  const ativo = document.getElementById('editarAvisoAtivo').checked;
  
  if (!titulo || !mensagem) {
    alert('Preencha título e mensagem');
    return;
  }
  
  try {
    showLoading('Salvando alterações...');
    
    await updateAviso(avisoId, {
      titulo: titulo,
      mensagem: mensagem,
      destino: destino,
      ativo: ativo,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Aviso Atualizado', 'Aviso atualizado com sucesso!');
    
    document.querySelector('.modal-back').remove();
    gerenciarAvisos();
    
  } catch (erro) {
    console.error('Erro ao atualizar aviso:', erro);
    alert('❌ Erro ao atualizar aviso');
  } finally {
    hideLoading();
  }
};

window.excluirAviso = async function(avisoId) {
  if (!confirm('Tem certeza que deseja excluir este aviso?\n\nEsta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    showLoading('Excluindo aviso...');
    
    await deleteAviso(avisoId);
    
    mostrarNotificacao('✅ Aviso Excluído', 'Aviso excluído com sucesso!');
    
    const avisoElement = document.getElementById(`aviso-${avisoId}`);
    if (avisoElement) {
      avisoElement.remove();
    }
    
    if (document.querySelectorAll('.aviso-admin-item').length === 0) {
      const container = document.querySelector('.avisos-admin-list');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-bullhorn"></i>
            <h4>Nenhum aviso cadastrado</h4>
            <p>Clique em "Novo Aviso" para criar o primeiro.</p>
          </div>
        `;
      }
    }
    
  } catch (erro) {
    console.error('Erro ao excluir aviso:', erro);
    alert('❌ Erro ao excluir aviso');
  } finally {
    hideLoading();
  }
};

// ========== GESTÃO DE ESCALAS (ADMIN) ==========
async function carregarEscalas() {
  try {
    const escalas = await getEscalas();
    estadoApp.escalas = escalas;
  } catch (erro) {
    console.error('Erro ao carregar escalas:', erro);
  }
}

async function carregarEscalaMotorista(matricula) {
  try {
    console.log('Buscando escala para matrícula:', matricula);
    
    const escalas = await getEscalas();
    console.log('Todas as escalas carregadas:', escalas);
    
    const escalaMotorista = escalas.find(escala => {
      const match = escala.matricula && escala.matricula.toString() === matricula.toString();
      if (match) {
        console.log('Escala encontrada:', escala);
      }
      return match;
    });
    
    if (escalaMotorista) {
      console.log('Escala encontrada para matrícula:', matricula);
      estadoApp.escalaMotorista = escalaMotorista;
      atualizarTelaEscala(escalaMotorista);
      
      mostrarNotificacao('✅ Escala Carregada', 'Sua escala foi carregada com sucesso!');
      
      return escalaMotorista;
    } else {
      console.log('Nenhuma escala encontrada para matrícula:', matricula);
      
      const container = document.querySelector('.escala-dias');
      if (container) {
        container.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1;">
            <i class="fas fa-calendar-times" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
            <h4>Nenhuma escala encontrada</h4>
            <p>Não foi encontrada uma escala para a matrícula <strong>${matricula}</strong>.</p>
            <p>Entre em contato com a administração para cadastrar sua escala.</p>
            <button class="btn btn-secondary" onclick="location.reload()">
              <i class="fas fa-redo"></i> Tentar Novamente
            </button>
          </div>
        `;
      }
      
      mostrarNotificacao('⚠️ Escala não encontrada', `Matrícula ${matricula} não possui escala cadastrada.`);
      
      return null;
    }
  } catch (erro) {
    console.error('Erro ao carregar escala do motorista:', erro);
    
    const container = document.querySelector('.escala-dias');
    if (container) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #ff6b6b; margin-bottom: 16px;"></i>
          <h4>Erro ao carregar escala</h4>
          <p>Ocorreu um erro ao carregar sua escala. Tente novamente.</p>
          <p><small>Erro: ${erro.message}</small></p>
          <button class="btn btn-secondary" onclick="location.reload()">
            <i class="fas fa-redo"></i> Tentar Novamente
          </button>
        </div>
      `;
    }
    
    mostrarNotificacao('❌ Erro', 'Não foi possível carregar sua escala. Tente novamente.');
    
    return null;
  }
}

function atualizarTelaEscala(escala) {
  const container = document.querySelector('.escala-dias');
  if (!container) {
    console.error('Container .escala-dias não encontrado');
    return;
  }
  
  if (!escala) {
    console.error('Escala é undefined ou null');
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-exclamation-circle"></i>
        <h4>Escala não disponível</h4>
        <p>Dados da escala não puderam ser carregados.</p>
      </div>
    `;
    return;
  }

  console.log('Atualizando tela com escala:', escala);
  
  const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  
  if (!escala.dias || !Array.isArray(escala.dias)) {
    console.warn('Escala sem dias definidos ou estrutura inválida:', escala);
    escala.dias = [];
  }
  
  container.innerHTML = diasSemana.map(dia => {
    const diaEscala = escala.dias.find(d => {
      return d && d.dia && d.dia.trim().toLowerCase() === dia.toLowerCase();
    });
    
    console.log(`Dia ${dia}:`, diaEscala);
    
    return `
      <div class="dia-escala ${diaEscala ? '' : 'folga'}">
        <div class="dia-nome">${dia}</div>
        <div class="dia-info">
          ${diaEscala ? `
            <span class="turno ${getTurnoClass(diaEscala.horario)}">${diaEscala.horario || '00:00 - 00:00'}</span>
            <span class="rota">${diaEscala.rota || 'Sem rota'}</span>
            ${diaEscala.onibus ? `<small class="onibus-escala">${diaEscala.onibus}</small>` : ''}
          ` : `
            <span class="folga-text">FOLGA</span>
          `}
        </div>
      </div>
    `;
  }).join('');
  
  const infoHeader = document.querySelector('.escala-info');
  if (infoHeader && !infoHeader.querySelector('.escala-motorista-info')) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'escala-motorista-info';
    infoDiv.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>Motorista:</strong> ${escala.motorista || 'Não informado'}
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Matrícula:</strong> ${escala.matricula || 'Não informada'}
      </div>
      ${escala.periodo ? `
        <div>
          <strong>Período:</strong> ${escala.periodo}
        </div>
      ` : ''}
    `;
    infoHeader.appendChild(infoDiv);
  }
}

function getTurnoClass(horario) {
  if (!horario) return 'manha';
  if (horario.includes('06:00')) return 'manha';
  if (horario.includes('14:00')) return 'tarde';
  if (horario.includes('22:00')) return 'noite';
  return 'manha';
}

window.gerenciarEscalas = async function() {
  try {
    showLoading('Carregando escalas...');
    
    await carregarEscalas();
    
    const modal = document.createElement('div');
    modal.className = 'modal-back large';
    modal.innerHTML = `
      <div class="modal xlarge">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-calendar-alt"></i> Gerenciar Escalas</h3>
        
        <div class="admin-actions-bar">
          <button class="btn success" onclick="criarNovaEscala()">
            <i class="fas fa-plus"></i> Nova Escala
          </button>
          <button class="btn info" onclick="exportarEscalas()">
            <i class="fas fa-download"></i> Exportar
          </button>
          <button class="btn warning" onclick="verificarEscalasDuplicadas()">
            <i class="fas fa-search"></i> Verificar Duplicidades
          </button>
        </div>
        
        <div class="escalas-admin-list">
          ${estadoApp.escalas.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-calendar"></i>
              <h4>Nenhuma escala cadastrada</h4>
              <p>Clique em "Nova Escala" para criar a primeira.</p>
            </div>
          ` : estadoApp.escalas.map(escala => `
            <div class="escala-admin-item" id="escala-${escala.id}">
              <div class="escala-admin-header">
                <div>
                  <h4>${escala.motorista || 'Sem nome'} - ${escala.matricula || 'Sem matrícula'}</h4>
                  <small class="escala-periodo">${escala.periodo || 'Sem período definido'}</small>
                  <small class="escala-timestamp">Criada em: ${escala.timestamp ? new Date(escala.timestamp).toLocaleDateString('pt-BR') : 'Data desconhecida'}</small>
                </div>
                <div class="escala-admin-actions">
                  <button class="icon-btn" onclick="editarEscala('${escala.id}')" title="Editar">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="icon-btn danger" onclick="excluirEscala('${escala.id}')" title="Excluir">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <div class="escala-dias-admin">
                ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => {
                  const diaEscala = escala.dias ? escala.dias.find(d => d.dia && d.dia.trim().toLowerCase() === dia.toLowerCase()) : null;
                  return `
                    <div class="dia-escala-admin ${diaEscala ? '' : 'folga'}">
                      <div class="dia-nome-admin">${dia}</div>
                      <div class="dia-info-admin">
                        ${diaEscala ? `
                          <span class="turno-admin ${getTurnoClass(diaEscala.horario)}">${diaEscala.horario || '00:00 - 00:00'}</span>
                          <span class="rota-admin">${diaEscala.rota || 'Sem rota'}</span>
                          ${diaEscala.onibus ? `<small class="onibus-admin">${diaEscala.onibus}</small>` : ''}
                        ` : `
                          <span class="folga-text-admin">FOLGA</span>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
  } catch (erro) {
    console.error('Erro ao carregar escalas:', erro);
    alert('❌ Erro ao carregar escalas');
  } finally {
    hideLoading();
  }
};

window.verificarEscalasDuplicadas = function() {
  const escalas = estadoApp.escalas;
  const duplicadas = {};
  
  escalas.forEach(escala => {
    const matricula = escala.matricula;
    if (matricula) {
      if (!duplicadas[matricula]) {
        duplicadas[matricula] = [];
      }
      duplicadas[matricula].push(escala);
    }
  });
  
  const duplicadosEncontrados = Object.keys(duplicadas).filter(matricula => duplicadas[matricula].length > 1);
  
  if (duplicadosEncontrados.length > 0) {
    let mensagem = 'Escalas duplicadas encontradas:\n\n';
    duplicadosEncontrados.forEach(matricula => {
      mensagem += `Matrícula ${matricula}:\n`;
      duplicadas[matricula].forEach((escala, index) => {
        mensagem += `  ${index + 1}. ${escala.motorista || 'Sem nome'} (ID: ${escala.id})\n`;
      });
      mensagem += '\n';
    });
    alert(mensagem);
  } else {
    alert('✅ Nenhuma escala duplicada encontrada.');
  }
};

window.criarNovaEscala = function() {
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.innerHTML = `
    <div class="modal large">
      <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3><i class="fas fa-plus"></i> Criar Nova Escala</h3>
      
      <div class="form-group">
        <label>Motorista *</label>
        <input type="text" id="novaEscalaMotorista" class="form-input" placeholder="Nome do motorista" required>
      </div>
      
      <div class="form-group">
        <label>Matrícula *</label>
        <input type="text" id="novaEscalaMatricula" class="form-input" placeholder="Matrícula" required>
        <small class="form-help">Verifique se já existe uma escala para esta matrícula</small>
      </div>
      
      <div class="form-group">
        <label>Período (Ex: "01/01/2024 - 31/01/2024")</label>
        <input type="text" id="novaEscalaPeriodo" class="form-input" placeholder="Período da escala">
      </div>
      
      <div class="form-section">
        <h4><i class="fas fa-calendar-day"></i> Dias da Semana</h4>
        <div class="dias-escala-form">
          ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => `
            <div class="dia-form-group">
              <div class="dia-form-header">
                <strong>${dia}</strong>
                <label class="switch">
                  <input type="checkbox" id="toggle-${dia}" checked>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="dia-form-content" id="content-${dia}">
                <div class="form-group-sm">
                  <label>Horário</label>
                  <select class="form-input-sm" id="${dia}-horario">
                    <option value="06:00 - 14:00">06:00 - 14:00 (Manhã)</option>
                    <option value="14:00 - 22:00">14:00 - 22:00 (Tarde)</option>
                    <option value="22:00 - 06:00">22:00 - 06:00 (Noite)</option>
                    <option value="00:00 - 00:00">Folga</option>
                  </select>
                </div>
                <div class="form-group-sm">
                  <label>Rota</label>
                  <select class="form-input-sm" id="${dia}-rota">
                    <option value="">Selecione...</option>
                    ${ROTAS_DISPONIVEIS.map(rota => `<option value="${rota.nome}">${rota.nome}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group-sm">
                  <label>Ônibus</label>
                  <select class="form-input-sm" id="${dia}-onibus">
                    <option value="">Selecione...</option>
                    ${ONIBUS_DISPONIVEIS.map(onibus => `<option value="${onibus.placa}">${onibus.placa} (${onibus.tag_ac})</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="form-actions">
        <button class="btn btn-primary" onclick="salvarNovaEscala()">
          <i class="fas fa-save"></i> Salvar Escala
        </button>
        <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
  
  ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].forEach(dia => {
    const toggle = document.getElementById(`toggle-${dia}`);
    const content = document.getElementById(`content-${dia}`);
    
    if (toggle && content) {
      toggle.addEventListener('change', function() {
        content.style.display = this.checked ? 'block' : 'none';
      });
    }
  });
};

window.salvarNovaEscala = async function() {
  const motorista = document.getElementById('novaEscalaMotorista').value;
  const matricula = document.getElementById('novaEscalaMatricula').value;
  const periodo = document.getElementById('novaEscalaPeriodo').value;
  
  if (!motorista || !matricula) {
    alert('Preencha nome do motorista e matrícula');
    return;
  }
  
  try {
    const escalasExistentes = await getEscalas();
    const escalaExistente = escalasExistentes.find(escala => 
      escala.matricula && escala.matricula.toString() === matricula.toString()
    );
    
    if (escalaExistente) {
      const confirmar = confirm(`Já existe uma escala para a matrícula ${matricula}.\n\nMotorista: ${escalaExistente.motorista}\n\nDeseja continuar mesmo assim?`);
      if (!confirmar) {
        return;
      }
    }
  } catch (erro) {
    console.error('Erro ao verificar escala existente:', erro);
  }
  
  const dias = [];
  ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].forEach(dia => {
    const toggle = document.getElementById(`toggle-${dia}`);
    if (toggle && toggle.checked) {
      const horario = document.getElementById(`${dia}-horario`).value;
      const rota = document.getElementById(`${dia}-rota`).value;
      const onibus = document.getElementById(`${dia}-onibus`).value;
      
      dias.push({
        dia: dia,
        horario: horario,
        rota: rota,
        onibus: onibus
      });
    }
  });
  
  try {
    showLoading('Salvando escala...');
    
    await addEscala({
      motorista: motorista,
      matricula: matricula,
      periodo: periodo,
      dias: dias,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Escala Criada', 'Escala criada com sucesso!');
    
    document.querySelector('.modal-back').remove();
    gerenciarEscalas();
    
  } catch (erro) {
    console.error('Erro ao salvar escala:', erro);
    alert('❌ Erro ao salvar escala');
  } finally {
    hideLoading();
  }
};

window.editarEscala = async function(escalaId) {
  try {
    showLoading('Carregando escala...');
    
    const escala = estadoApp.escalas.find(e => e.id === escalaId);
    if (!escala) {
      alert('Escala não encontrada');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-back large';
    modal.innerHTML = `
      <div class="modal">
        <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
        <h3><i class="fas fa-edit"></i> Editar Escala</h3>
        
        <div class="form-group">
          <label>Motorista *</label>
          <input type="text" id="editarEscalaMotorista" class="form-input" value="${escala.motorista || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Matrícula *</label>
          <input type="text" id="editarEscalaMatricula" class="form-input" value="${escala.matricula || ''}" required>
        </div>
        
        <div class="form-group">
          <label>Período</label>
          <input type="text" id="editarEscalaPeriodo" class="form-input" value="${escala.periodo || ''}">
        </div>
        
        <div class="form-section">
          <h4><i class="fas fa-calendar-day"></i> Dias da Semana</h4>
          <div class="dias-escala-form">
            ${['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dia => {
              const diaEscala = escala.dias ? escala.dias.find(d => d.dia && d.dia.trim().toLowerCase() === dia.toLowerCase()) : null;
              const temDia = !!diaEscala;
              
              return `
                <div class="dia-form-group">
                  <div class="dia-form-header">
                    <strong>${dia}</strong>
                    <label class="switch">
                      <input type="checkbox" id="edit-toggle-${dia}" ${temDia ? 'checked' : ''}>
                      <span class="slider"></span>
                    </label>
                  </div>
                  <div class="dia-form-content" id="edit-content-${dia}" style="display: ${temDia ? 'block' : 'none'}">
                    <div class="form-group-sm">
                      <label>Horário</label>
                      <select class="form-input-sm" id="edit-${dia}-horario">
                        <option value="06:00 - 14:00" ${diaEscala?.horario === '06:00 - 14:00' ? 'selected' : ''}>06:00 - 14:00 (Manhã)</option>
                        <option value="14:00 - 22:00" ${diaEscala?.horario === '14:00 - 22:00' ? 'selected' : ''}>14:00 - 22:00 (Tarde)</option>
                        <option value="22:00 - 06:00" ${diaEscala?.horario === '22:00 - 06:00' ? 'selected' : ''}>22:00 - 06:00 (Noite)</option>
                        <option value="00:00 - 00:00" ${diaEscala?.horario === '00:00 - 00:00' ? 'selected' : ''}>Folga</option>
                      </select>
                    </div>
                    <div class="form-group-sm">
                      <label>Rota</label>
                      <select class="form-input-sm" id="edit-${dia}-rota">
                        <option value="">Selecione...</option>
                        ${ROTAS_DISPONIVEIS.map(rota => `
                          <option value="${rota.nome}" ${diaEscala?.rota === rota.nome ? 'selected' : ''}>${rota.nome}</option>
                        `).join('')}
                      </select>
                    </div>
                    <div class="form-group-sm">
                      <label>Ônibus</label>
                      <select class="form-input-sm" id="edit-${dia}-onibus">
                        <option value="">Selecione...</option>
                        ${ONIBUS_DISPONIVEIS.map(onibus => `
                          <option value="${onibus.placa}" ${diaEscala?.onibus === onibus.placa ? 'selected' : ''}>${onibus.placa} (${onibus.tag_ac})</option>
                        `).join('')}
                      </select>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="salvarEdicaoEscala('${escalaId}')">
            <i class="fas fa-save"></i> Salvar Alterações
          </button>
          <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i> Cancelar
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].forEach(dia => {
      const toggle = document.getElementById(`edit-toggle-${dia}`);
      const content = document.getElementById(`edit-content-${dia}`);
      
      if (toggle && content) {
        toggle.addEventListener('change', function() {
          content.style.display = this.checked ? 'block' : 'none';
        });
      }
    });
    
  } catch (erro) {
    console.error('Erro ao carregar escala:', erro);
    alert('❌ Erro ao carregar escala');
  } finally {
    hideLoading();
  }
};

window.salvarEdicaoEscala = async function(escalaId) {
  const motorista = document.getElementById('editarEscalaMotorista').value;
  const matricula = document.getElementById('editarEscalaMatricula').value;
  const periodo = document.getElementById('editarEscalaPeriodo').value;
  
  if (!motorista || !matricula) {
    alert('Preencha nome do motorista e matrícula');
    return;
  }
  
  const dias = [];
  ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].forEach(dia => {
    const toggle = document.getElementById(`edit-toggle-${dia}`);
    if (toggle && toggle.checked) {
      const horario = document.getElementById(`edit-${dia}-horario`).value;
      const rota = document.getElementById(`edit-${dia}-rota`).value;
      const onibus = document.getElementById(`edit-${dia}-onibus`).value;
      
      dias.push({
        dia: dia,
        horario: horario,
        rota: rota,
        onibus: onibus
      });
    }
  });
  
  try {
    showLoading('Salvando alterações...');
    
    await updateEscala(escalaId, {
      motorista: motorista,
      matricula: matricula,
      periodo: periodo,
      dias: dias,
      timestamp: new Date()
    });
    
    mostrarNotificacao('✅ Escala Atualizada', 'Escala atualizada com sucesso!');
    
    document.querySelector('.modal-back').remove();
    gerenciarEscalas();
    
  } catch (erro) {
    console.error('Erro ao salvar escala:', erro);
    alert('❌ Erro ao salvar escala');
  } finally {
    hideLoading();
  }
};

window.excluirEscala = async function(escalaId) {
  if (!confirm('Tem certeza que deseja excluir esta escala?\n\nEsta ação não pode ser desfeita.')) {
    return;
  }
  
  try {
    showLoading('Excluindo escala...');
    
    await deleteEscala(escalaId);
    
    mostrarNotificacao('✅ Escala Excluída', 'Escala excluída com sucesso!');
    
    const escalaElement = document.getElementById(`escala-${escalaId}`);
    if (escalaElement) {
      escalaElement.remove();
    }
    
  } catch (erro) {
    console.error('Erro ao excluir escala:', erro);
    alert('❌ Erro ao excluir escala');
  } finally {
    hideLoading();
  }
};

window.exportarEscalas = function() {
  if (estadoApp.escalas.length === 0) {
    alert('Não há escalas para exportar');
    return;
  }
  
  let csvContent = "Motorista;Matrícula;Período;Segunda;Terça;Quarta;Quinta;Sexta;Sábado;Domingo\n";
  
  estadoApp.escalas.forEach(escala => {
    const dias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    const diasInfo = dias.map(dia => {
      const diaEscala = escala.dias ? escala.dias.find(d => d.dia && d.dia.trim().toLowerCase() === dia.toLowerCase()) : null;
      if (diaEscala) {
        return `${diaEscala.horario || ''} - ${diaEscala.rota || ''}${diaEscala.onibus ? ` (${diaEscala.onibus})` : ''}`;
      }
      return 'FOLGA';
    });
    
    csvContent += `${escala.motorista || ''};${escala.matricula || ''};${escala.periodo || ''};${diasInfo.join(';')}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `escalas_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarNotificacao('✅ Escalas Exportadas', 'Download iniciado!');
};

// ========== FUNÇÕES DE EMERGÊNCIA (ADMIN) ==========
window.resolverEmergenciaAdmin = async function(emergenciaId) {
  if (!confirm('Marcar esta emergência como resolvida?')) {
    return;
  }
  
  try {
    showLoading('Resolvendo emergência...');
    
    await resolverEmergencia(emergenciaId);
    
    mostrarNotificacao('✅ Emergência Resolvida', 'A emergência foi marcada como resolvida.');
    
    const emergenciaElement = document.querySelector(`[onclick*="${emergenciaId}"]`)?.closest('.emergencia-card');
    if (emergenciaElement) {
      emergenciaElement.remove();
    }
    
  } catch (erro) {
    console.error('Erro ao resolver emergência:', erro);
    alert('❌ Erro ao resolver emergência');
  } finally {
    hideLoading();
  }
};

window.contatarMotoristaAdmin = function(matricula) {
  const mensagem = encodeURIComponent(`Olá! Estamos entrando em contato referente a uma emergência registrada.`);
  const url = `https://wa.me/55${matricula}?text=${mensagem}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

window.verLocalizacaoEmergencia = async function(emergenciaId) {
  try {
    const emergencia = estadoApp.emergenciasAtivas?.find(e => e.id === emergenciaId);
    if (emergencia) {
      const url = `https://www.google.com/maps?q=${emergencia.latitude},${emergencia.longitude}&z=15`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Localização da emergência não disponível');
    }
  } catch (erro) {
    console.error('Erro ao abrir localização:', erro);
    alert('Erro ao abrir localização');
  }
};

// ========== FUNÇÕES DE FEEDBACK (ADMIN) ==========
window.resolverFeedbackAdmin = async function(feedbackId) {
  if (!confirm('Marcar este feedback como resolvido?')) {
    return;
  }
  
  try {
    showLoading('Resolvendo feedback...');
    
    await resolverFeedback(feedbackId);
    
    mostrarNotificacao('✅ Feedback Resolvido', 'O feedback foi marcado como resolvido.');
    
    const feedbackElement = document.querySelector(`[onclick*="${feedbackId}"]`)?.closest('.feedback-card');
    if (feedbackElement) {
      feedbackElement.remove();
    }
    
  } catch (erro) {
    console.error('Erro ao resolver feedback:', erro);
    alert('❌ Erro ao resolver feedback');
  } finally {
    hideLoading();
  }
};

window.responderFeedbackAdmin = function(feedbackId) {
  const resposta = prompt('Digite sua resposta para este feedback:');
  if (!resposta) return;
  
  try {
    showLoading('Enviando resposta...');
    
    responderFeedback(feedbackId, resposta);
    
    mostrarNotificacao('✅ Resposta Enviada', 'Resposta enviada com sucesso!');
    
  } catch (erro) {
    console.error('Erro ao responder feedback:', erro);
    alert('❌ Erro ao responder feedback');
  } finally {
    hideLoading();
  }
};

// ========== RELATÓRIOS ==========
async function carregarRelatorios() {
  try {
    showLoading('Carregando relatórios...');
    
    const estatisticas = await getEstatisticasDashboard();
    estadoApp.estatisticas = estatisticas;
    
    const q = query(collection(db, 'rotas_em_andamento'), 
      where("ativo", "==", true),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    const rotasAtivas = snapshot.docs.map(d => d.data());
    
    const frequenciaRotas = {};
    rotasAtivas.forEach(rota => {
      if (rota.rota) {
        frequenciaRotas[rota.rota] = (frequenciaRotas[rota.rota] || 0) + 1;
      }
    });
    
    const rotasFrequentes = Object.entries(frequenciaRotas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const container = document.getElementById('relatoriosContainer');
    if (container) {
      container.innerHTML = `
        <div class="dashboard-grid">
          <div class="dashboard-card large">
            <h3><i class="fas fa-chart-pie"></i> Estatísticas Gerais</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-number">${estatisticas.totalRotasAtivas}</div>
                <div class="stat-label">Rotas Ativas</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${estadoApp.onlineUsers.length}</div>
                <div class="stat-label">Usuários Online</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${estatisticas.totalEmergencias}</div>
                <div class="stat-label">Emergências</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">${estatisticas.totalFeedbacks}</div>
                <div class="stat-label">Feedbacks</div>
              </div>
            </div>
          </div>
          
          <div class="dashboard-card">
            <h3><i class="fas fa-route"></i> Rotas por Tipo</h3>
            <div class="chart-container">
              <div class="chart-bar" style="height: ${(estatisticas.rotasPorTipo?.operacional || 0) * 20}px">
                <span>Operacional: ${estatisticas.rotasPorTipo?.operacional || 0}</span>
              </div>
              <div class="chart-bar" style="height: ${(estatisticas.rotasPorTipo?.adm || 0) * 20}px">
                <span>ADM: ${estatisticas.rotasPorTipo?.adm || 0}</span>
              </div>
              <div class="chart-bar" style="height: ${(estatisticas.rotasPorTipo?.retorno || 0) * 20}px">
                <span>Retorno: ${estatisticas.rotasPorTipo?.retorno || 0}</span>
              </div>
            </div>
          </div>
          
          <div class="dashboard-card">
            <h3><i class="fas fa-bus"></i> Rotas Mais Frequentes</h3>
            <div class="rotas-frequentes">
              ${rotasFrequentes.length > 0 ? 
                rotasFrequentes.map(([rota, count]) => `
                  <div class="rota-frequente-item">
                    <span>${rota}</span>
                    <span class="rota-count">${count} viagens</span>
                  </div>
                `).join('') : 
                '<p class="empty-state">Nenhuma rota registrada</p>'
              }
            </div>
          </div>
          
          <div class="dashboard-card">
            <h3><i class="fas fa-users"></i> Usuários Online</h3>
            <div id="onlineUsersList">
              <div class="online-user-list">
                ${estadoApp.onlineUsers.length > 0 ? 
                  estadoApp.onlineUsers.map(user => `
                    <div class="online-user-item">
                      <span class="online-dot"></span>
                      <div class="user-info">
                        <strong>${user.motorista}</strong>
                        <small>${user.onibus} • ${user.rota}</small>
                      </div>
                      <small>${user.ultimaAtualizacao ? new Date(user.ultimaAtualizacao.toDate()).toLocaleTimeString() : ''}</small>
                    </div>
                  `).join('') : 
                  '<div class="empty-state"><p>Nenhum usuário online</p></div>'
                }
              </div>
            </div>
          </div>
        </div>
        
        <div class="relatorios-actions">
          <button class="btn" onclick="exportarRelatorios()">
            <i class="fas fa-file-export"></i> Exportar Relatórios
          </button>
          <button class="btn secondary" onclick="atualizarRelatorios()">
            <i class="fas fa-sync"></i> Atualizar
          </button>
        </div>
      `;
    }
    
  } catch (erro) {
    console.error('Erro ao carregar relatórios:', erro);
    
    const container = document.getElementById('relatoriosContainer');
    if (container) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-chart-line"></i>
          <h4>Erro ao carregar relatórios</h4>
          <p>Tente novamente mais tarde.</p>
        </div>
      `;
    }
  } finally {
    hideLoading();
  }
}

window.atualizarRelatorios = function() {
  carregarRelatorios();
};

window.exportarRelatorios = function() {
  if (!estadoApp.estatisticas) {
    alert('Nenhum dado disponível para exportar');
    return;
  }
  
  let csvContent = "Relatório AC Transporte\n";
  csvContent += `Data: ${new Date().toLocaleDateString()}\n\n`;
  csvContent += "Métrica,Valor\n";
  csvContent += `Rotas Ativas,${estadoApp.estatisticas.totalRotasAtivas}\n`;
  csvContent += `Usuários Online,${estadoApp.onlineUsers.length}\n`;
  csvContent += `Emergências Pendentes,${estadoApp.estatisticas.totalEmergencias}\n`;
  csvContent += `Feedbacks Pendentes,${estadoApp.estatisticas.totalFeedbacks}\n\n`;
  csvContent += "Rotas por Tipo\n";
  csvContent += `Operacional,${estadoApp.estatisticas.rotasPorTipo?.operacional || 0}\n`;
  csvContent += `ADM,${estadoApp.estatisticas.rotasPorTipo?.adm || 0}\n`;
  csvContent += `Retorno,${estadoApp.estatisticas.rotasPorTipo?.retorno || 0}\n`;
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio_ac_transporte_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  mostrarNotificacao('✅ Relatório Exportado', 'Download iniciado!');
};

// ========== FUNÇÕES DE TEMAS E PWA ==========
function initDarkMode() {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedPreference = localStorage.getItem('ac_dark');
  
  if (savedPreference === '1' || (!savedPreference && prefersDark.matches)) {
    document.body.classList.add('dark');
    updateDarkModeIcon(true);
  }
  
  darkToggle.addEventListener('click', toggleDarkMode);
  
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('ac_dark')) {
      if (e.matches) {
        document.body.classList.add('dark');
        updateDarkModeIcon(true);
      } else {
        document.body.classList.remove('dark');
        updateDarkModeIcon(false);
      }
    }
  });
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('ac_dark', isDark ? '1' : '0');
  updateDarkModeIcon(isDark);
  
  const darkToggle = document.getElementById('darkToggle');
  if (darkToggle) {
    darkToggle.style.transform = 'scale(0.95)';
    setTimeout(() => {
      darkToggle.style.transform = '';
    }, 150);
  }
}

function updateDarkModeIcon(isDark) {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  darkToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  darkToggle.setAttribute('title', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
}

function initPWA() {
  const installBtn = document.getElementById('installBtn');
  if (!installBtn) return;
  
  let deferredPrompt;
  
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'flex';
    console.log('📱 PWA pode ser instalado');
  });
  
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('Este aplicativo já está instalado ou não pode ser instalado.');
      return;
    }
    
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('✅ Usuário aceitou a instalação');
      installBtn.style.display = 'none';
    } else {
      console.log('❌ Usuário recusou a instalação');
    }
    
    deferredPrompt = null;
  });
  
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA instalado com sucesso');
    installBtn.style.display = 'none';
  });
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    installBtn.style.display = 'none';
  }
}

// ========== FUNÇÕES DE CONEXÃO ==========
function initConnectionMonitor() {
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  updateOnlineStatus();
}

function updateOnlineStatus() {
  estadoApp.isOnline = navigator.onLine;
  const statusElement = document.getElementById('connectionStatus');
  const offlineBanner = document.getElementById('offlineBanner');
  
  if (statusElement) {
    statusElement.innerHTML = estadoApp.isOnline ? '<i class="fas fa-circle"></i>' : '<i class="fas fa-circle"></i>';
    statusElement.style.color = estadoApp.isOnline ? '#4CAF50' : '#FF5722';
    statusElement.title = estadoApp.isOnline ? 'Online' : 'Offline';
  }
  
  if (offlineBanner) {
    offlineBanner.style.display = estadoApp.isOnline ? 'none' : 'block';
  }
  
  if (!estadoApp.isOnline) {
    console.warn('📶 Aplicativo offline');
    mostrarNotificacao('📶 Modo Offline', 'Algumas funcionalidades podem não estar disponíveis');
  }
}

// ========== AVISOS ==========
function initAvisos() {
  const avisosBtn = document.getElementById('avisosBtn');
  if (avisosBtn) {
    avisosBtn.addEventListener('click', mostrarAvisos);
  }
}

window.mostrarAvisos = function() {
  const avisos = estadoApp.avisosAtivos || [];
  
  if (avisos.length === 0) {
    alert('📭 Nenhum aviso no momento');
    return;
  }
  
  const avisosHTML = avisos.filter(aviso => aviso.ativo).map(aviso => `
    <div class="aviso-item">
      <div class="aviso-header">
        <strong>${aviso.titulo}</strong>
        <small>${aviso.timestamp ? new Date(aviso.timestamp.toDate()).toLocaleDateString() : ''}</small>
      </div>
      <p>${aviso.mensagem}</p>
      <small class="aviso-destino">Para: ${aviso.destino || 'Todos'}</small>
    </div>
  `).join('');
  
  const modal = document.createElement('div');
  modal.className = 'modal-back';
  modal.innerHTML = `
    <div class="modal">
      <button class="close" onclick="this.parentElement.parentElement.remove()">✕</button>
      <h3>📢 Avisos e Comunicados</h3>
      <div class="avisos-list">
        ${avisosHTML}
      </div>
      <div style="margin-top:12px">
        <button class="btn" onclick="this.parentElement.parentElement.remove()">Fechar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.style.display = 'flex';
};

// ========== FUNÇÕES DE UTILIDADE ==========
function showLoading(message = 'Carregando...') {
  const overlay = document.getElementById('loadingOverlay');
  const text = document.getElementById('loadingText');
  
  if (overlay) overlay.style.display = 'flex';
  if (text) text.textContent = message;
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.style.display = 'none';
}

function initEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
  
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  });
}

function closeAllModals() {
  document.querySelectorAll('.modal-back').forEach(modal => {
    modal.remove();
  });
}

// ========== SERVICE WORKER ==========
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('✅ ServiceWorker registrado:', registration.scope);
      })
      .catch(error => {
        console.log('❌ Falha ao registrar ServiceWorker:', error);
      });
  });
}

// ========== SUPPORT - WHATSAPP ==========
window.abrirSuporteWhatsApp = function() {
  const telefone = '5593992059914';
  const mensagem = encodeURIComponent('Olá! Preciso de suporte no Portal de Transporte da AC Parceria.');
  const url = `https://wa.me/${telefone}?text=${mensagem}`;
  
  window.open(url, '_blank', 'noopener,noreferrer');
};

// ========== FUNÇÕES AUXILIARES ADICIONAIS ==========
window.verFormsControle = function() {
  window.open('https://forms.gle/UDniKxPqcMKGUhFQA', '_blank');
};

window.verDetalhesRota = function(matricula) {
  alert(`Detalhes da rota para matrícula: ${matricula}\n\nEm desenvolvimento...`);
};

window.enviarNotificacaoMotorista = function(matricula) {
  const mensagem = prompt('Digite a mensagem para o motorista:');
  if (mensagem) {
    alert(`Notificação enviada para o motorista ${matricula}:\n\n${mensagem}`);
  }
};

console.log('🚀 app.js carregado com sucesso!');
