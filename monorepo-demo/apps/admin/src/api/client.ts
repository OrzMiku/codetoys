import axios from 'axios'

export type AdminTodo = {
  userId: number
  id: number
  title: string
  completed: boolean
}

export const apiClient = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com',
  timeout: 8000,
})

export const fetchTodos = async () => {
  const { data } = await apiClient.get<AdminTodo[]>('/todos', {
    params: { _limit: 5 },
  })

  return data
}
