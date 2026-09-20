export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api', // Se actualizará con la URL de AWS API Gateway una vez creada
  azure: {
    clientId: 'dca1a06c-9b36-484d-8909-ae95c3f26301',
    tenantId: '5970cdb9-bbea-48dd-ad49-c3aacc2c1241',
    authority: 'https://login.microsoftonline.com/5970cdb9-bbea-48dd-ad49-c3aacc2c1241',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    apiEndpoint: 'http://localhost:8080/api',
    scopes: [
      'api://dca1a06c-9b36-484d-8909-ae95c3f26301/access_as_user',
      'api://barriodigital-api/access_as_user',
      'user.read'
    ]
  }
};
