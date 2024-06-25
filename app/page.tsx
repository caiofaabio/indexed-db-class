/* eslint-disable react-hooks/exhaustive-deps */
"use client"
import IndexedDB from "@/app/components/models/indexedDB"
import { useEffect, useState } from "react"

export default function Home() {
  const [name, setName] = useState("")
  const [age, setAge] = useState("")
  const [profession, setProfession] = useState("")
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const indexedDB = new IndexedDB("caioIndexedDB")

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        await indexedDB.openDb()
        console.log("DB opened")
        await fetchData()
      } catch (error) {
        console.error("Error: ", error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const fetchData = async () => {
    try {
      const storeData = await indexedDB.getStore("user")
      setData(storeData)
    } catch (error) {
      console.log("Error: ", error)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()

    try {
      const db = await indexedDB.openDb()
      const addDb = await indexedDB.addOrUpdate(
        { name, age, profession },
        "user"
      )
      console.log("User added")
      await fetchData()
    } catch (e) {
      console.error("Error: ", e)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await indexedDB.openDb()
      await indexedDB.deleteItem(id, "user")
      console.log("Item deleted")
      await fetchData()
    } catch (error) {
      console.error("Error: ", error)
    }
  }

  const label = "block mb-2 text-sm font-medium text-gray-900 dark:text-white"
  const input =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
  const btn =
    "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
  const btnDelete =
    "shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"
  const form =
    "max-w-lg w-full p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700"

  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-5">
      <h1 className="text-6xl">Add IndexedDB</h1>
      <form onSubmit={handleSubmit} className={form}>
        <label className={label}>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={input}
        />
        <br />
        <label className={label}>Age:</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className={input}
        />
        <br />
        <label className={label}>Profession:</label>
        <input
          type="text"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className={input}
        />
        <br />
        <button type="submit" className={btn}>
          Submit
        </button>
      </form>
      <div>
        <h2 className="text-4xl mb-4">Stored Users</h2>
        <ul className="list-disc">
          {loading || data.length === 0 ? (
            <p>Loading...</p>
          ) : (
            data.map((item, index) => (
              <li
                key={index}
                className="flex justify-between items-center mb-2"
              >
                Name: {item.name} - Idade: {item.age} - Profession:{" "}
                {item.profession}
                <button
                  className={btnDelete}
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </main>
  )
}
