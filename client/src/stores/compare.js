import { defineStore } from 'pinia'
import { getFundDetail } from '../api/fund'

const STORAGE_KEY = 'fund-compare-list'

export const useCompareStore = defineStore('compare', {
  state: () => ({
    codes: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  }),
  getters: {
    count: (state) => state.codes.length,
    isFull: (state) => state.codes.length >= 4,
    hasCode: (state) => (code) => state.codes.includes(code),
  },
  actions: {
    addCode(code) {
      if (!this.codes.includes(code) && this.codes.length < 4) {
        this.codes.push(code)
        this._save()
      }
    },
    removeCode(code) {
      this.codes = this.codes.filter(c => c !== code)
      this._save()
    },
    toggleCode(code) {
      if (this.codes.includes(code)) {
        this.removeCode(code)
      } else if (this.codes.length < 4) {
        this.addCode(code)
      }
    },
    clear() {
      this.codes = []
      this._save()
    },
    _save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.codes))
    },
  },
})
