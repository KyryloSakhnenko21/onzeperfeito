// ── Parametros ───────────────────────────────────────────────
@description('Regiao Azure onde os recursos serao criados')
param location string = 'francecentral'

@description('Nome do projeto — usado como prefixo nos recursos')
param projectName string = 'onzeperfeito'

@description('Nome da base de dados CosmosDB')
param databaseName string = 'onzeperfeito'

@description('SKU do Container Registry')
@allowed(['Basic', 'Standard', 'Premium'])
param containerRegistrySku string = 'Basic'

@description('Runtime stack do App Service')
param appServiceRuntime string = 'PYTHON|3.11'

// ── Variaveis ─────────────────────────────────────────────────
var cosmosAccountName     = '${projectName}-cosmos'
var storageAccountName    = '${projectName}storage'
var appServicePlanName    = '${projectName}-plan'
var appServiceName        = '${projectName}-app'
var containerRegistryName = '${projectName}Registry'
var functionAppName       = '${projectName}-functions'
var functionStorageName   = '${projectName}funcstorage'

// ── 1. Azure Cosmos DB ────────────────────────────────────────
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: cosmosAccountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    capabilities: [
      { name: 'EnableServerless' }
    ]
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    enableFreeTier: false
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
  }
}

var containers = [
  { name: 'jogadores',       partitionKey: '/clube'          }
  { name: 'utilizadores',    partitionKey: '/email'          }
  { name: 'equipas',         partitionKey: '/utilizador_id'  }
  { name: 'ligas',           partitionKey: '/tipo'           }
  { name: 'pontuacoes',      partitionKey: '/jornada'        }
  { name: 'eventos_jornada', partitionKey: '/jornada'        }
]

resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = [
  for container in containers: {
    parent: cosmosDatabase
    name: container.name
    properties: {
      resource: {
        id: container.name
        partitionKey: {
          paths: [ container.partitionKey ]
          kind: 'Hash'
        }
      }
    }
  }
]

// ── 2. BLOB Storage ───────────────────────────────────────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    allowBlobPublicAccess: true
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource imagensContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'imagens'
  properties: {
    publicAccess: 'Blob'
  }
}

// ── 3. Azure Container Registry ───────────────────────────────
resource containerRegistry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: containerRegistryName
  location: location
  sku: {
    name: containerRegistrySku
  }
  properties: {
    adminUserEnabled: true
  }
}

// ── 4. App Service Plan ───────────────────────────────────────
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}


// ── 5. App Service ────────────────────────────────────────────
resource appService 'Microsoft.Web/sites@2023-01-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: appServiceRuntime
      appSettings: [
        {
          name: 'COSMOS_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'COSMOS_DATABASE'
          value: databaseName
        }
        {
          name: 'BLOB_ACCOUNT_NAME'
          value: storageAccount.name
        }
      ]
    }
    httpsOnly: true
  }
}

// ── 6. Storage para Azure Functions ───────────────────────────
resource functionStorage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: functionStorageName
  location: 'northeurope'
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

// ── 7. Azure Function App ─────────────────────────────────────
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: 'northeurope'
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: functionAppPlan.id
    siteConfig: {
      linuxFxVersion: 'Node|22'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${functionStorage.name};EndpointSuffix=core.windows.net;AccountKey=${functionStorage.listKeys().keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'COSMOS_ENDPOINT'
          value: cosmosAccount.properties.documentEndpoint
        }
        {
          name: 'COSMOS_DATABASE'
          value: databaseName
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1'
        }
      ]
    }
  }
}

// ── 8. App Service Plan para Functions ────────────────────────
resource functionAppPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: '${projectName}-functions-plan'
  location: 'northeurope'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'linux'
  properties: {
    reserved: true
  }
}

// ── Outputs ───────────────────────────────────────────────────
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output appServiceUrl string = 'https://${appService.properties.defaultHostName}'
output containerRegistryLoginServer string = containerRegistry.properties.loginServer
output storageAccountName string = storageAccount.name