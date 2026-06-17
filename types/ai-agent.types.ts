export type ToolStatus = 'pending' | 'executing' | 'success' | 'error'

export interface ToolCall {
  id: string 
  name: string
  input: Record<string, unknown> 
  status: ToolStatus
  result?: string 
  error?: string 
  startTime: Date
  endTime?: Date
  executionTime?: number
}

export interface AgentStep {
  id: string
  type: 'thinking' | 'tool_call' | 'response'
  thinking?: string 
  toolCalls?: ToolCall[] 
  response?: string
  timestamp: Date
}

// A chat message
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  steps?: AgentStep[]
  timestamp: Date
  isStreaming?: boolean
}

// Chat state
export interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  error?: string
  currentExecution?: {
    steps: AgentStep[]
    currentStepIndex: number
  }
}

// Tool execution result from the API
export interface ToolExecutionResult {
  type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'
  content?: string
  tool?: string
  input?: Record<string, unknown>
  result?: string
  error?: string
  iteration?: number
}