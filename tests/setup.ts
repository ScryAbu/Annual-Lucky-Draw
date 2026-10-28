import 'fake-indexeddb/auto'
import { vi } from 'vitest'
vi.stubGlobal('alert', vi.fn())
vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
