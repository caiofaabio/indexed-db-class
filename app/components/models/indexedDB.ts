const DB_VERSION = "4"
const DB_NAME = "caioIndexedDB"

class IndexedDB {
  db?: IDBDatabase
  dbName: string

  objectStoreToCreate = [{ name: "user", keyPath: "id", autoIncrement: true }]

  constructor(owner: string) {
    this.dbName = owner
  }

  setDB(db: IDBDatabase) {
    this.db = db
  }

  async openDb() {
    const dbName = this.dbName
    const setDB = (db: IDBDatabase) => this.setDB(db) // Função para definir a instância do banco de dados
    const loadTables = (evt: any, version: number) =>
      this.loadTables(evt, version) // Função para carregar as tabelas durante o upgrade

    return new Promise((res, rej) => {
      const req = indexedDB.open(dbName, parseInt(DB_VERSION)) // Abre o banco de dados com o nome e a versão

      req.onsuccess = function (evt: any) {
        setDB(req.result) // Define a instância do banco de dados quando for bem-sucedido
        res("OpenDb DONE") // Retorna quando o banco de dados foi aberto com sucesso
      }

      req.onerror = function (evt: any) {
        rej(`OpenDb Error: ${evt?.target}`) // Rejeita com mensagem de erro se houver falha ao abrir o banco de dados
      }

      req.onupgradeneeded = function (evt: any) {
        loadTables(evt.target.result, evt.oldVersion) // Executa durante o upgrade do banco de dados
      }
    })
  }

  loadTables(db: any, version: number) {
    if (version < parseInt(DB_VERSION)) {
      console.log("IndexedDb has a new version") // Verifica e loga se há uma nova versão do IndexedDB
    }

    // Criação das object stores definidas na inicialização
    this.objectStoreToCreate.forEach((storeDefinition) => {
      const { name, keyPath, autoIncrement } = storeDefinition
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath, autoIncrement })
      }
    })
  }

  getObjectStore(storeName: string, mode: IDBTransactionMode) {
    if (this.db) {
      const tx = this.db.transaction(storeName, mode) // Cria uma transação para a object store especificada

      return tx.objectStore(storeName) // Retorna a object store da transação
    } else {
      throw new Error("DB not init yet") // Lança um erro se o banco de dados não estiver inicializado
    }
  }

  async addOrUpdate(data: any, storeName: string) {
    const store = this.getObjectStore(storeName, "readwrite") // Obtém a object store para escrita

    if (data.id) {
      const getRequest = store.get(data.id) // Obtém o item pelo ID

      getRequest.onsuccess = (evt: any) => {
        const existingItem = evt.target.result // Obtém o item existente

        if (existingItem) {
          const updateRequest = store.put(data) // Atualiza o item existente
          updateRequest.onsuccess = () => {
            console.log("Item updated successfully")
          }
          updateRequest.onerror = () => {
            console.error("Error updating item")
          }
        } else {
          const addRequest = store.add(data) // Adiciona um novo item
          addRequest.onsuccess = () => {
            console.log("Item added successfully")
          }
          addRequest.onerror = (error) => {
            console.error("add item error", `${storeName} || ${error}`)
          }
        }
      }

      getRequest.onerror = () => {
        console.error("Error getting item")
      }
    } else {
      const addRequest = store.add(data) // Adiciona um novo item se não houver ID especificado
      addRequest.onsuccess = () => {
        console.log("Item added successfully")
      }
      addRequest.onerror = (error) => {
        console.error("add item error", `${storeName} || ${error}`)
      }
    }
  }

  async getItemById(
    id: IDBValidKey | IDBKeyRange,
    storeName: string
  ): Promise<IDBRequest> {
    const store = this.getObjectStore(storeName, "readonly") // Obtém a object store para leitura
    const getStore = store.get(id) // Obtém o item pelo ID

    return await new Promise((res, rej) => {
      getStore.onsuccess = () => {
        res(getStore) // Retorna o item obtido
      }
    })
  }

  async objectExists(
    id: IDBValidKey | IDBKeyRange,
    storeName: string
  ): Promise<boolean> {
    const store = this.getObjectStore(storeName, "readonly") // Obtém a object store para leitura
    const getSore = store.get(id) // Obtém o item pelo ID

    return new Promise((res, rej) => {
      getSore.onsuccess = () => {
        res(!!getSore.result) // Retorna verdadeiro se o item existir
      }
    })
  }

  async getStore(name: string): Promise<any> {
    const storeDB: any = []
    const store = this.getObjectStore(name, "readonly") // Obtém a object store para leitura
    let req = store.openCursor() // Abre um cursor para percorrer os itens

    return new Promise((res, rej) => {
      req.onsuccess = function (evt: any) {
        const cursor = evt.target.result // Obtém o cursor

        if (cursor) {
          store.get(cursor.key).onsuccess = function (evt: any) {
            storeDB.push(evt.target.result) // Adiciona o item ao array
          }
          cursor.continue() // Continua para o próximo item
        } else {
          res(storeDB) // Retorna o array de itens
        }
      }
    })
  }

  async deleteItem(
    id: IDBValidKey | IDBKeyRange,
    storeName: string
  ): Promise<void> {
    const store = this.getObjectStore(storeName, "readwrite") // Obtém a object store para escrita
    const deleteRequest = store.delete(id) // Deleta o item pelo ID

    return new Promise((res, rej) => {
      deleteRequest.onsuccess = () => {
        console.log("Item deleted")
        confirm("Are you sure you want to delete this item?") // Confirmação para deletar o item
        res() // Retorna quando o item é deletado
      }
      deleteRequest.onerror = (error) => {
        console.error("Error deleting item") // Loga erro se houver problema ao deletar o item
        rej(error) // Rejeita com o erro ocorrido
      }
    })
  }
}

export default IndexedDB
