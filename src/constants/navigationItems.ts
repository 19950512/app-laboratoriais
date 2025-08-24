export const navigationItems = [
  { 
    label: 'Dashboard', 
    route: '/dashboard', 
    always: false // Será verificado pelas permissões
  },
  { 
    label: 'Perfil', 
    route: '/profile', 
    always: true // Sempre acessível
  },
  { 
    label: 'Auditoria', 
    route: '/audit-logs', 
    always: false
  },
  { 
    label: 'Contas Bancarias', 
    route: '/bank-accounts', 
    always: false
  },
  { 
    label: 'Admin Empresa', 
    route: '/business-admin', 
    always: false
  }
];
