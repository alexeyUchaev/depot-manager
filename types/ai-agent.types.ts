// Типы для AI Agent с Cline-style интерфейсом

// Статусы tool execution
export type ToolStatus = 'pending' | 'executing' | 'success' | 'error'

// Сам tool call с результатом
export interface ToolCall {
  id: string // уникальный ID для отслеживания
  name: string // имя tool (getProducts, createOrder и т.д.)
  input: Record<string, unknown> // параметры tool
  status: ToolStatus
  result?: string // результат выполнения
  error?: string // если была ошибка
  startTime: Date
  endTime?: Date
  executionTime?: number // в миллисекундах
}

// Шаг в цепочке рассуждений агента
export interface AgentStep {
  id: string
  type: 'thinking' | 'tool_call' | 'response'
  thinking?: string // промежуточное рассуждение
  toolCalls?: ToolCall[] // если это шаг с tool calls
  response?: string // финальный ответ модели
  timestamp: Date
}

// Сообщение в чате
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: AgentStep[] // для assistant - цепочка выполнения
  timestamp: Date
  isStreaming?: boolean
}

// Состояние чата
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
  currentExecution?: {
    steps: AgentStep[]
    currentStepIndex: number
  }
}

// Результат tool execution от API
export interface ToolExecutionResult {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  tool?: string
  input?: Record<string, unknown>
  result?: string
  error?: string
  iteration?: number
}