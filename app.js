// app.js - CÓDIGO COMPLETO FINAL ATUALIZADO
import { 
  db, 
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
  signOut,
  serverTimestamp
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
  emergenciaAtiva: false
};

// Dados de ônibus disponíveis
const ONIBUS_DISPONIVEIS = [
  { placa: 'ABC-1234', modelo: 'Mercedes-Benz O-500', capacidade: 50 },
  { placa: 'DEF-5678', modelo: 'Volvo B450R', capacidade: 45 },
  { placa: 'GHI-9012', modelo: 'Marcopolo Paradiso', capacidade: 55 },
  { placa: 'JKL-3456', modelo: 'Neobus Mega', capacidade: 48 },
  { placa: 'MNO-7890', modelo: 'Scania K360', capacidade: 52 }
];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 AC Transporte Portal - Inicializando...');
  
  // Verificar sessão existente
  verificarSessao();
  
  // Inicializar funcionalidades
  initDarkMode();
  initPWA();
  initEventListeners();
  initAccessibility();
  initConnectionMonitor();
  initAvisos();
  
  // Iniciar clima
  buscarClimaAtual();
  
  console.log('✅ Aplicativo inicializado com sucesso');
});

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
  } else if (perfil === 'passageiro') {
    estadoApp.perfil = 'passageiro';
    mostrarTela('tela-passageiro');
    iniciarMonitoramentoPassageiro();
    iniciarMonitoramentoAvisos();
  } else if (perfil === 'admin' && adminLogado) {
    estadoApp.perfil = 'admin';
    estadoApp.admin = { nome: 'Administrador' };
    mostrarTela('tela-admin-dashboard');
    iniciarMonitoramentoAdmin();
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
    
    // Buscar colaborador no Firebase
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

    // ✅ Login autorizado - mostrar seleção de ônibus
    localStorage.setItem('motorista_matricula', matricula);
    localStorage.setItem('motorista_nome', dados.nome);
    localStorage.setItem('motorista_email', dados.email || '');
    localStorage.setItem('perfil_ativo', 'motorista');
    
    estadoApp.motorista = { 
      matricula, 
      nome: dados.nome,
      email: dados.email || ''
    };
    
    // Mostrar tela de seleção de ônibus
    mostrarTela('tela-selecao-onibus');
    
    console.log('✅ Motorista autenticado:', dados.nome);

  } catch (erro) {
    console.error('Erro Firebase:', erro);
    alert('❌ Erro ao validar matrícula. Verifique sua conexão e tente novamente.');
  } finally {
    hideLoading();
    loginBtn.disabled = false;
    loginBtn.textContent = 'Entrar';
  }
};

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
  if (!navigator.geolocation) {
    alert('❌ Geolocalização não suportada neste navegador.');
    mostrarTela('tela-motorista');
    return;
  }
  
  showLoading('📍 Solicitando permissão de localização...');
  
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log('✅ Permissão de localização concedida');
      hideLoading();
      
      // Atualizar interface
      updateUserStatus(estadoApp.motorista.nome, estadoApp.motorista.matricula);
      
      // Mostrar tela do motorista com todas as funcionalidades
      mostrarTela('tela-motorista');
      
      // Iniciar monitoramento de avisos
      iniciarMonitoramentoAvisos();
      
      alert(`✅ Login realizado com sucesso!\n\n👋 Bem-vindo, ${estadoApp.motorista.nome}\n🚌 Ônibus: ${estadoApp.onibusAtivo.placa}\n📍 Localização ativada`);
    },
    (error) => {
      hideLoading();
      console.error('Erro na localização:', error);
      
      if (error.code === 1) {
        alert('⚠️ Permissão de localização negada.\n\nPara usar todas as funcionalidades, ative a localização nas configurações do navegador.');
      }
      
      // Mostrar tela mesmo sem localização
      mostrarTela('tela-motorista');
      iniciarMonitoramentoAvisos();
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ========== LOGIN ADMIN ==========
window.loginAdmin = async function () {
  const email = document.getElementById('adminEmail').value;
  const senha = document.getElementById('adminSenha').value;
  
  if (!email || !senha) {
    alert('Preencha e-mail e senha');
    return;
  }
  
  // Credenciais fixas (ALTERE AQUI PARA PRODUÇÃO)
  const ADMIN_CREDENTIALS = {
    email: 'admin@acparceria.com',
    senha: '050370'
  };
  
  if (email === ADMIN_CREDENTIALS.email && senha === ADMIN_CREDENTIALS.senha) {
    // Login local bem sucedido
    localStorage.setItem('admin_logado', 'true');
    localStorage.setItem('admin_email', email);
    localStorage.setItem('perfil_ativo', 'admin');
    
    estadoApp.admin = { email, nome: 'Administrador' };
    
    // Mostrar dashboard
    mostrarTela('tela-admin-dashboard');
    iniciarMonitoramentoAdmin();
    iniciarMonitoramentoEmergencias();
    iniciarMonitoramentoFeedbacks();
    iniciarMonitoramentoAvisos();
    
    console.log('✅ Admin logado com sucesso');
  } else {
    alert('❌ Credenciais inválidas');
  }
};

// ========== LOGOUT ==========
window.logout = function () {
  // Parar todas as monitorações
  if (estadoApp.watchId) {
    navigator.geolocation.clearWatch(estadoApp.watchId);
    estadoApp.watchId = null;
  }
  
  if (estadoApp.unsubscribeRotas) estadoApp.unsubscribeRotas();
  if (estadoApp.unsubscribeEmergencias) estadoApp.unsubscribeEmergencias();
  if (estadoApp.unsubscribeFeedbacks) estadoApp.unsubscribeFeedbacks();
  if (estadoApp.unsubscribeAvisos) estadoApp.unsubscribeAvisos();
  
  // Limpar estado
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
    emergenciaAtiva: false
  };
  
  // Limpar storage
  localStorage.removeItem('perfil_ativo');
  localStorage.removeItem('motorista_matricula');
  localStorage.removeItem('motorista_nome');
  localStorage.removeItem('motorista_email');
  localStorage.removeItem('onibus_ativo');
  localStorage.removeItem('admin_logado');
  localStorage.removeItem('admin_email');
  
  // Resetar interface
  document.getElementById('userStatus').style.display = 'none';
  document.getElementById('pararRotaBtn').style.display = 'none';
  document.getElementById('rotaStatus').textContent = 'Nenhuma rota ativa';
  
  // Voltar para tela inicial
  mostrarTela('welcome');
  
  console.log('👋 Usuário deslogado');
};

// ========== FUNÇÕES DE ROTA E LOCALIZAÇÃO ==========
window.iniciarRota = async function (nomeRota) {
  if (!navigator.geolocation) {
    alert('❌ Geolocalização não suportada neste navegador.');
    return;
  }

  if (!estadoApp.motorista || !estadoApp.onibusAtivo) {
    alert('❌ Motorista ou ônibus não configurado. Faça login novamente.');
    mostrarTela('tela-motorista-login');
    return;
  }

  if (!await checkLocationPermission()) {
    return;
  }

  if (!confirm(`🚀 Iniciar Rota: ${nomeRota}\n\nÔnibus: ${estadoApp.onibusAtivo.placa}\n\nSua localização será compartilhada em tempo real.`)) {
    return;
  }

  // Atualizar interface
  const btn = event?.target;
  if (btn) {
    btn.classList.add('loading');
    btn.textContent = 'Iniciando...';
  }

  try {
    // Primeira localização imediata
    const position = await getCurrentPosition();
    await enviarLocalizacao(nomeRota, position.coords);
    
    // Iniciar monitoramento contínuo
    estadoApp.watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        await enviarLocalizacao(nomeRota, pos.coords);
      },
      (erro) => {
        console.error('Erro na geolocalização:', erro);
        mostrarNotificacao('⚠️ Erro na localização', 'Verifique as permissões do GPS');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    estadoApp.rotaAtiva = nomeRota;
    
    // Atualizar interface
    document.getElementById('rotaStatus').textContent = `📍 Rota ativa: ${nomeRota}`;
    document.getElementById('pararRotaBtn').style.display = 'block';
    
    mostrarNotificacao('✅ Rota Iniciada', `Rota "${nomeRota}" iniciada com sucesso!`);
    
    // Mostrar tela do motorista
    mostrarTela('tela-motorista');

  } catch (erro) {
    console.error('Erro ao iniciar rota:', erro);
    alert('❌ Não foi possível iniciar a rota. Verifique sua conexão e permissões de localização.');
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.textContent = '▶️ Iniciar Rota';
    }
  }
};

async function enviarLocalizacao(nomeRota, coords) {
  if (!estadoApp.motorista || !estadoApp.onibusAtivo) return;

  try {
    await updateLocalizacao(estadoApp.motorista.matricula, {
      motorista: estadoApp.motorista.nome,
      matricula: estadoApp.motorista.matricula,
      email: estadoApp.motorista.email,
      rota: nomeRota,
      onibus: estadoApp.onibusAtivo.placa,
      modelo: estadoApp.onibusAtivo.modelo,
      capacidade: estadoApp.onibusAtivo.capacidade,
      latitude: coords.latitude,
      longitude: coords.longitude,
      velocidade: coords.speed ? (coords.speed * 3.6).toFixed(1) : null,
      precisao: coords.accuracy,
      ativo: true,
      timestamp: new Date()
    });
    
    console.log('📍 Localização enviada:', new Date().toLocaleTimeString());
  } catch (erro) {
    console.error('Erro ao enviar localização:', erro);
  }
}

window.pararRota = function () {
  if (!estadoApp.watchId) return;
  
  if (!confirm('Deseja realmente parar o compartilhamento da rota?')) {
    return;
  }
  
  navigator.geolocation.clearWatch(estadoApp.watchId);
  estadoApp.watchId = null;
  estadoApp.rotaAtiva = null;
  
  // Limpar do Firebase
  if (estadoApp.motorista) {
    updateLocalizacao(estadoApp.motorista.matricula, {
      ativo: false,
      timestamp: new Date()
    });
  }
  
  // Atualizar interface
  document.getElementById('rotaStatus').textContent = 'Nenhuma rota ativa';
  document.getElementById('pararRotaBtn').style.display = 'none';
  
  mostrarNotificacao('⏹️ Rota Encerrada', 'Localização não está mais sendo compartilhada.');
};

// ========== BOTÃO DE EMERGÊNCIA ==========
window.ativarEmergencia = async function() {
  if (!estadoApp.motorista) {
    alert('❌ Faça login como motorista para usar esta função');
    return;
  }
  
  if (estadoApp.emergenciaAtiva) {
    // Desativar emergência
    estadoApp.emergenciaAtiva = false;
    document.getElementById('emergenciaBtn').textContent = '🚨 EMERGÊNCIA';
    document.getElementById('emergenciaBtn').classList.remove('emergencia-ativa');
    mostrarNotificacao('✅ Emergência Desativada', 'Situação de emergência encerrada');
    return;
  }
  
  const tipo = prompt('Tipo de emergência:\n1. Acidente\n2. Problema mecânico\n3. Problema de saúde\n4. Outro\n\nDigite o número:');
  
  if (!tipo) return;
  
  const descricao = prompt('Descreva brevemente a situação:');
  if (!descricao) return;
  
  try {
    await registrarEmergencia({
      motorista: estadoApp.motorista.nome,
      matricula: estadoApp.motorista.matricula,
      onibus: estadoApp.onibusAtivo?.placa || 'Não informado',
      rota: estadoApp.rotaAtiva || 'Não informada',
      tipo: getTipoEmergencia(tipo),
      descricao: descricao,
      status: 'pendente',
      timestamp: new Date()
    });
    
    estadoApp.emergenciaAtiva = true;
    document.getElementById('emergenciaBtn').textContent = '✅ EMERGÊNCIA ATIVA';
    document.getElementById('emergenciaBtn').classList.add('emergencia-ativa');
    
    mostrarNotificacao('🚨 EMERGÊNCIA ATIVADA', 'A equipe de suporte foi notificada!');
    
    // Vibrar dispositivo (se suportado)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
    
  } catch (erro) {
    console.error('Erro ao registrar emergência:', erro);
    alert('❌ Erro ao ativar emergência. Tente novamente.');
  }
};

function getTipoEmergencia(numero) {
  const tipos = {
    '1': 'Acidente',
    '2': 'Problema mecânico',
    '3': 'Problema de saúde',
    '4': 'Outro'
  };
  return tipos[numero] || 'Outro';
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
    
    // Limpar campos
    document.getElementById(`feedbackMensagem${perfil}`).value = '';
    
    // Voltar para tela anterior
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

// ========== MONITORAMENTO ==========
function iniciarMonitoramentoPassageiro() {
  if (estadoApp.unsubscribeRotas) return;
  
  estadoApp.unsubscribeRotas = monitorarRotas((rotas) => {
    const container = document.getElementById('rotasAtivasList');
    if (!container) return;
    
    if (rotas.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🚌</div>
          <h4>Nenhuma rota ativa no momento</h4>
          <p>Não há motoristas compartilhando localização no momento.</p>
        </div>
      `;
      return;
    }
    
    // Agrupar por rota
    const rotasAgrupadas = {};
    rotas.forEach(rota => {
      if (!rotasAgrupadas[rota.rota]) {
        rotasAgrupadas[rota.rota] = [];
      }
      rotasAgrupadas[rota.rota].push(rota);
    });
    
    container.innerHTML = Object.entries(rotasAgrupadas).map(([nomeRota, motoristas]) => `
      <div class="rota-grupo">
        <h4>${nomeRota}</h4>
        ${motoristas.map(motorista => `
          <div class="motorista-card">
            <div class="motorista-info">
              <div class="motorista-header">
                <strong>👤 ${motorista.motorista}</strong>
                <span class="onibus-badge">${motorista.onibus}</span>
              </div>
              <div class="motorista-detalhes">
                <small>📍 ${motorista.latitude?.toFixed(4)}, ${motorista.longitude?.toFixed(4)}</small>
                <small>⏱️ ${motorista.timestamp ? new Date(motorista.timestamp.toDate()).toLocaleTimeString() : '--:--'}</small>
                ${motorista.velocidade ? `<small>🚗 ${motorista.velocidade} km/h</small>` : ''}
              </div>
            </div>
            <div class="motorista-actions">
              <button class="btn small" onclick="verLocalizacaoMotorista(${motorista.latitude}, ${motorista.longitude}, '${motorista.motorista}', '${motorista.onibus}')">
                📍 Ver Mapa
              </button>
              <button class="btn small secondary" onclick="abrirRotaNoMaps('${nomeRota}')">
                🗺️ Abrir Rota
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');
  });
}

function iniciarMonitoramentoAdmin() {
  if (estadoApp.unsubscribeRotas) return;
  
  estadoApp.unsubscribeRotas = monitorarRotas((rotas) => {
    const container = document.getElementById('adminRotasList');
    const countElement = document.getElementById('rotasAtivasCount');
    const motoristasAtivosElement = document.getElementById('motoristasAtivosCount');
    
    if (!container) return;
    
    const rotasAtivas = rotas.filter(r => r.ativo !== false);
    
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
            <span class="onibus-tag">${rota.onibus}</span>
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
            <span>⏱️ Última atualização:</span>
            <span>${rota.timestamp ? new Date(rota.timestamp.toDate()).toLocaleTimeString() : '--:--'}</span>
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
    if (!container) return;
    
    const emergenciasAtivas = emergencias.filter(e => e.status === 'pendente');
    
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
          <button class="btn small success" onclick="resolverEmergencia('${emergencia.id}')">
            ✅ Resolver
          </button>
          <button class="btn small" onclick="contatarMotorista('${emergencia.matricula}')">
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
    if (!container) return;
    
    const feedbacksPendentes = feedbacks.filter(f => f.status === 'pendente');
    
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
          <button class="btn small success" onclick="resolverFeedback('${feedback.id}')">
            ✅ Resolver
          </button>
          <button class="btn small" onclick="responderFeedback('${feedback.id}')">
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
    // Atualizar contador de avisos
    const avisosCount = document.getElementById('avisosCount');
    if (avisosCount) {
      avisosCount.textContent = avisos.length;
      avisosCount.style.display = avisos.length > 0 ? 'inline' : 'none';
    }
    
    // Armazenar avisos para exibição
    estadoApp.avisosAtivos = avisos;
  });
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

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });
  });
}

async function checkLocationPermission() {
  if (!navigator.permissions) return true;
  
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    
    if (permission.state === 'denied') {
      alert('❌ Permissão de localização negada. Ative nas configurações do navegador.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('API de permissões não suportada:', error);
    return true;
  }
}

// ========== NAVEGAÇÃO ENTRE TELAS ==========
window.mostrarTela = function(id) {
  console.log('🔄 Mostrando tela:', id);
  
  // Esconder todas as telas
  document.querySelectorAll('.tela').forEach(tela => {
    tela.classList.add('hidden');
    tela.classList.remove('ativa');
  });
  
  // Mostrar tela alvo
  const alvo = document.getElementById(id);
  if (!alvo) {
    console.error('Tela não encontrada:', id);
    return;
  }
  
  alvo.classList.remove('hidden');
  alvo.classList.add('ativa');
  
  // Ações específicas por tela
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
  }
  
  // Rolagem suave para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

function atualizarInfoMotorista() {
  if (!estadoApp.motorista) return;
  
  // Atualizar nome e matrícula
  const nomeElement = document.getElementById('motoristaNome');
  const matriculaElement = document.getElementById('motoristaMatricula');
  const onibusElement = document.getElementById('motoristaOnibus');
  
  if (nomeElement) nomeElement.textContent = estadoApp.motorista.nome;
  if (matriculaElement) matriculaElement.textContent = estadoApp.motorista.matricula;
  if (onibusElement && estadoApp.onibusAtivo) {
    onibusElement.textContent = `${estadoApp.onibusAtivo.placa} - ${estadoApp.onibusAtivo.modelo}`;
  }
}

// ========== CARREGAMENTO DE ROTAS ==========
function carregarRotas() {
  const rotas = [
    { id: 'adm01', nome: 'ROTA ADM 01', tipo: 'adm', desc: 'Rota administrativa 01', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=18BCgBpobp1Olzmzy0RnPCUEd7Vnkc5s&usp=sharing' },
    { id: 'adm02', nome: 'ROTA ADM 02', tipo: 'adm', desc: 'Rota administrativa 02', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1WxbIX8nw0xyGBLMvvi1SF3DRuwmZ5oM&usp=sharing' },
    { id: 'op01', nome: 'ROTA 01', tipo: 'operacional', desc: 'Rota operacional 01', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1jCfFxq1ZwecS2IcHy7xGFLLgttsM-RQ&usp=sharing' },
    { id: 'op02', nome: 'ROTA 02', tipo: 'operacional', desc: 'Rota operacional 02', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1LCvNJxWBbZ_chpbdn_lk_Dm6NPA194g&usp=sharing' },
    { id: 'op03', nome: 'ROTA 03', tipo: 'operacional', desc: 'Rota operacional 03', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1bdwkrClh5AZml0mnDGlOzYcaR4w1BL0&usp=sharing' },
    { id: 'op04', nome: 'ROTA 04', tipo: 'operacional', desc: 'Rota operacional 04', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1ejibzdZkhX2QLnP9YgvvHdQpZELFvXo&usp=sharing' },
    { id: 'op05', nome: 'ROTA 05', tipo: 'operacional', desc: 'Rota operacional 05', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1L9xjAWFUupMc7eQbqVJz-SNWlYX5SHo&usp=sharing' },
    { id: 'ret01', nome: 'RETORNO OVERLAND - ROTA 01', tipo: 'retorno', desc: 'Rota de retorno Overland 01', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1ClQVIaRLOYYWHU7fvP87r1BVy85a_eg&usp=sharing' },
    { id: 'ret02', nome: 'RETORNO OVERLAND - ROTA 02', tipo: 'retorno', desc: 'Rota de retorno Overland 02', mapsUrl: 'https://www.google.com/maps/d/u/1/edit?mid=1WOIMgeLgV01B8yk7HoX6tazdCHXQnok&usp=sharing' }
  ];
  
  const container = document.getElementById('routesContainer');
  if (!container) {
    console.error('Container de rotas não encontrado');
    return;
  }
  
  const motoristaLogado = !!estadoApp.motorista;
  const onibusSelecionado = !!estadoApp.onibusAtivo;
  
  container.innerHTML = rotas.map(rota => `
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
  
  // Verificar motoristas em cada rota
  verificarMotoristasPorRota();
}

async function verificarMotoristasPorRota() {
  if (!estadoApp.unsubscribeRotas) {
    // Se não há monitoramento ativo, criar um temporário
    const unsubscribe = monitorarRotas((rotas) => {
      const rotasAtivas = rotas.filter(r => r.ativo !== false);
      
      rotasAtivas.forEach(rota => {
        const statusElement = document.getElementById(`status-${rota.id}`);
        if (statusElement) {
          statusElement.innerHTML = `
            <small>✅ <strong>${rota.motorista}</strong> no ônibus ${rota.onibus}</small>
            <small>📍 ${rota.velocidade ? rota.velocidade + ' km/h' : 'Ativo'}</small>
          `;
        }
      });
      
      // Atualizar rotas sem motoristas
      document.querySelectorAll('.route-item').forEach(item => {
        const routeId = item.querySelector('.route-status')?.id.replace('status-', '');
        if (routeId && !rotasAtivas.find(r => r.id === routeId)) {
          const statusElement = document.getElementById(`status-${routeId}`);
          if (statusElement) {
            statusElement.innerHTML = `<small>⏳ Nenhum motorista ativo</small>`;
          }
        }
      });
    });
    
    // Guardar unsubscribe para limpar depois
    setTimeout(() => unsubscribe(), 5000);
  }
}

// ========== FUNÇÕES DE MAPA ==========
window.abrirRotaNoMaps = function(nomeRota) {
  const rotas = {
    'ROTA ADM 01': 'https://www.google.com/maps/d/u/1/edit?mid=18BCgBpobp1Olzmzy0RnPCUEd7Vnkc5s&usp=sharing',
    'ROTA ADM 02': 'https://www.google.com/maps/d/u/1/edit?mid=1WxbIX8nw0xyGBLMvvi1SF3DRuwmZ5oM&usp=sharing',
    'ROTA 01': 'https://www.google.com/maps/d/u/1/edit?mid=1jCfFxq1ZwecS2IcHy7xGFLLgttsM-RQ&usp=sharing',
    'ROTA 02': 'https://www.google.com/maps/d/u/1/edit?mid=1LCvNJxWBbZ_chpbdn_lk_Dm6NPA194g&usp=sharing',
    'ROTA 03': 'https://www.google.com/maps/d/u/1/edit?mid=1bdwkrClh5AZml0mnDGlOzYcaR4w1BL0&usp=sharing',
    'ROTA 04': 'https://www.google.com/maps/d/u/1/edit?mid=1ejibzdZkhX2QLnP9YgvvHdQpZELFvXo&usp=sharing',
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

window.verMotoristasNaRota = function(nomeRota) {
  mostrarTela('tela-ver-motoristas');
  // Aqui você implementaria a lógica para filtrar motoristas por rota
};

// ========== CLIMA ==========
async function buscarClimaAtual() {
  try {
    // API de clima (exemplo com OpenWeatherMap)
    // Para produção, você precisa de uma chave de API
    const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Sao Paulo,BR&units=metric&lang=pt_br&appid=SUA_API_KEY_AQUI');
    const data = await response.json();
    
    if (data.main) {
      const climaElement = document.getElementById('climaAtual');
      if (climaElement) {
        climaElement.innerHTML = `
          <div class="clima-info">
            <span>🌡️ ${Math.round(data.main.temp)}°C</span>
            <small>${data.weather[0].description}</small>
          </div>
        `;
      }
    }
  } catch (error) {
    console.log('Não foi possível obter dados do clima:', error);
  }
}

// ========== NOTIFICAÇÕES ==========
function mostrarNotificacao(titulo, mensagem) {
  // Verificar se notificações são suportadas
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações desktop");
    return;
  }
  
  // Verificar permissão
  if (Notification.permission === "granted") {
    criarNotificacao(titulo, mensagem);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        criarNotificacao(titulo, mensagem);
      }
    });
  }
  
  // Também mostrar notificação na tela
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
  
  // Remover automaticamente após 5 segundos
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
    
    // Limpar campos
    document.getElementById('notificacaoTitulo').value = '';
    document.getElementById('notificacaoMensagem').value = '';
    
    mostrarNotificacao('📢 Notificação Enviada', `Notificação enviada para ${destino}`);
    
  } catch (erro) {
    console.error('Erro ao enviar notificação:', erro);
    alert('❌ Erro ao enviar notificação');
  }
};

window.verFormsControle = function() {
  window.open('https://docs.google.com/spreadsheets/d/1w1KEIbWk7vjsYUvVzCm7-OSERgQVqUys77nZCLabhdE/edit?usp=sharing', '_blank', 'noopener,noreferrer');
};

// ========== FUNÇÕES DE TEMAS E PWA ==========
function initDarkMode() {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedPreference = localStorage.getItem('ac_dark');
  
  // Aplicar tema
  if (savedPreference === '1' || (!savedPreference && prefersDark.matches)) {
    document.body.classList.add('dark');
    updateDarkModeIcon(true);
  }
  
  // Configurar alternância
  darkToggle.addEventListener('click', toggleDarkMode);
  
  // Ouvir mudanças no sistema
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
  
  // Feedback tátil
  const darkToggle = document.getElementById('darkToggle');
  darkToggle.style.transform = 'scale(0.95)';
  setTimeout(() => {
    darkToggle.style.transform = '';
  }, 150);
}

function updateDarkModeIcon(isDark) {
  const darkToggle = document.getElementById('darkToggle');
  if (!darkToggle) return;
  
  darkToggle.textContent = isDark ? '☀️' : '🌙';
  darkToggle.setAttribute('title', isDark ? 'Alternar para modo claro' : 'Alternar para modo escuro');
  darkToggle.setAttribute('aria-label', isDark ? 'Modo escuro ativo - clique para modo claro' : 'Modo claro ativo - clique para modo escuro');
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
    statusElement.textContent = estadoApp.isOnline ? '●' : '○';
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

function mostrarAvisos() {
  const avisos = estadoApp.avisosAtivos || [];
  
  if (avisos.length === 0) {
    alert('📭 Nenhum aviso no momento');
    return;
  }
  
  const avisosHTML = avisos.map(aviso => `
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
}

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
  // Fechar modais com ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
  
  // Fechar modal clicando fora
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

// ========== EXPORTAR FUNÇÕES PARA ESCOPO GLOBAL ==========
window.openModal = function(modalType) {
  const modalId = modalType === 'avisosModal' ? 'avisosModalBack' : 'ajudaModalBack';
  const modal = document.getElementById(modalId);
  
  if (modal) {
    modal.style.display = 'flex';
  }
};

window.closeModal = function(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
};

// Exportar todas as funções necessárias
window.mostrarTela = mostrarTela;
window.entrarNoPortal = entrarNoPortal;
window.selecionarPerfil = selecionarPerfil;
window.confirmarMatriculaMotorista = confirmarMatriculaMotorista;
window.selecionarOnibus = selecionarOnibus;
window.loginAdmin = loginAdmin;
window.logout = logout;
window.iniciarRota = iniciarRota;
window.pararRota = pararRota;
window.ativarEmergencia = ativarEmergencia;
window.abrirFeedback = abrirFeedback;
window.enviarFeedback = enviarFeedback;
window.abrirRotaNoMaps = abrirRotaNoMaps;
window.verLocalizacaoMotorista = verLocalizacaoMotorista;
window.verMapaAdmin = verMapaAdmin;
window.verMotoristasNaRota = verMotoristasNaRota;
window.enviarNotificacaoGeral = enviarNotificacaoGeral;
window.verFormsControle = verFormsControle;

console.log('🚀 app.js carregado com sucesso!');
