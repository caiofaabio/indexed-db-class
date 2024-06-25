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
    const setDB = (db: IDBDatabase) => this.setDB(db)
    const loadTables = (evt: any, version: number) =>
      this.loadTables(evt, version)

    return new Promise((res, rej) => {
      const req = indexedDB.open(dbName, parseInt(DB_VERSION))

      req.onsuccess = function (evt: any) {
        setDB(req.result)
        res("OpenDb DONE")
      }

      req.onerror = function (evt: any) {
        rej(`OpenDb Error: ${evt?.target}`)
      }

      req.onupgradeneeded = function (evt: any) {
        loadTables(evt.target.result, evt.oldVersion)
      }
    })
  }

  loadTables(db: any, version: number) {
    if (version < parseInt(DB_VERSION)) {
      console.log("IndexedDb has a new version")
    }

    this.objectStoreToCreate.forEach((storeDefinition) => {
      const { name, keyPath, autoIncrement } = storeDefinition
      if (!db.objectStoreNames.contains(name)) {
        db.createObjectStore(name, { keyPath, autoIncrement })
      }
    })
  }

  getObjectStore(storeName: string, mode: IDBTransactionMode) {
    if (this.db) {
      const tx = this.db.transaction(storeName, mode)

      return tx.objectStore(storeName)
    } else {
      throw new Error("DB not init yet")
    }
  }

  async addOrUpdate(data: any, storeName: string) {
    const store = this.getObjectStore(storeName, "readwrite")

    if (data.id) {
      const getRequest = store.get(data.id)

      getRequest.onsuccess = (evt: any) => {
        const existingItem = evt.target.result

        if (existingItem) {
          const updateRequest = store.put(data)
          updateRequest.onsuccess = () => {
            console.log("Item updated successfully")
          }
          updateRequest.onerror = () => {
            console.error("Error updating item")
          }
        } else {
          const addRequest = store.add(data)
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
      const addRequest = store.add(data)
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
    const store = this.getObjectStore(storeName, "readonly")
    const getStore = store.get(id)

    return await new Promise((res, rej) => {
      getStore.onsuccess = () => {
        res(getStore)
      }
    })
  }

  async objectExists(
    id: IDBValidKey | IDBKeyRange,
    storeName: string
  ): Promise<boolean> {
    const store = this.getObjectStore(storeName, "readonly")
    const getSore = store.get(id)

    return new Promise((res, rej) => {
      getSore.onsuccess = () => {
        res(!!getSore.result)
      }
    })
  }

  async getStore(name: string): Promise<any> {
    const storeDB: any = []
    const store = this.getObjectStore(name, "readonly")
    let req = store.openCursor()

    return new Promise((res, rej) => {
      req.onsuccess = function (evt: any) {
        const cursor = evt.target.result
        if (cursor) {
          store.get(cursor.key).onsuccess = function (evt: any) {
            storeDB.push(evt.target.result)
          }
          cursor.continue()
        } else {
          res(storeDB)
        }
      }
    })
  }

  async deleteItem(
    id: IDBValidKey | IDBKeyRange,
    storeName: string
  ): Promise<void> {
    const store = this.getObjectStore(storeName, "readwrite")
    const deleteRequest = store.delete(id)

    return new Promise((res, rej) => {
      deleteRequest.onsuccess = () => {
        console.log("Item deleted")
        confirm("Are you sure you want to delete this item?")
        res()
      }
      deleteRequest.onerror = (error) => {
        console.error("Error deleting item")
        rej(error)
      }
    })
  }
}

export default IndexedDB
