import { create } from 'zustand'

const GEMINI_KEY_STORAGE = 'viet-contexto.admin.geminiApiKey'
const GEMINI_MODEL_STORAGE = 'viet-contexto.admin.geminiModel'

export type GeminiModel = 'gemini-2.5-flash' | 'gemini-2.5-pro'

type AdminStore = {
  geminiApiKey: string
  geminiModel: GeminiModel
  rememberKey: boolean
  setGeminiApiKey: (key: string, remember: boolean) => void
  setGeminiModel: (model: GeminiModel) => void
  clearGeminiKey: () => void
  loadSavedSettings: () => void
}

export const useAdminStore = create<AdminStore>((set) => ({
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  rememberKey: false,

  setGeminiApiKey: (key, remember) => {
    if (remember) {
      localStorage.setItem(GEMINI_KEY_STORAGE, key)
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE)
    }
    set({ geminiApiKey: key, rememberKey: remember })
  },

  setGeminiModel: (model) => {
    localStorage.setItem(GEMINI_MODEL_STORAGE, model)
    set({ geminiModel: model })
  },

  clearGeminiKey: () => {
    localStorage.removeItem(GEMINI_KEY_STORAGE)
    set({ geminiApiKey: '', rememberKey: false })
  },

  loadSavedSettings: () => {
    const key = localStorage.getItem(GEMINI_KEY_STORAGE) ?? ''
    const model = (localStorage.getItem(GEMINI_MODEL_STORAGE) as GeminiModel) ?? 'gemini-2.5-flash'
    set({ geminiApiKey: key, geminiModel: model, rememberKey: !!key })
  },
}))
