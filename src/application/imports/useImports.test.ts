import { describe, expect, it } from 'vitest'
import { aContactImport, pageOf } from '../../test/fakes'
import { hasImportFinished, IMPORT_POLLING_INTERVAL_MS, importsPollingInterval, runningImportIds } from './useImports'

describe('hasImportFinished', () => {
  it('detects an import that was running and no longer is', () => {
    expect(hasImportFinished(new Set(['a', 'b']), new Set(['b']))).toBe(true)
  })

  it('ignores imports that are still running or that just started', () => {
    expect(hasImportFinished(new Set(['a']), new Set(['a', 'b']))).toBe(false)
    expect(hasImportFinished(new Set(), new Set(['a']))).toBe(false)
  })

  it('collects the ids of running imports only', () => {
    const page = pageOf([
      aContactImport({ id: 'pending', status: 'Pending' }),
      aContactImport({ id: 'processing', status: 'Processing' }),
      aContactImport({ id: 'done', status: 'Completed' }),
    ])

    expect(runningImportIds(page)).toEqual(new Set(['pending', 'processing']))
  })
})

describe('importsPollingInterval', () => {
  it.each(['Pending', 'Processing'] as const)('keeps polling while an import is %s', (status) => {
    const page = pageOf([aContactImport({ status: 'Completed' }), aContactImport({ status })])

    expect(importsPollingInterval(page)).toBe(IMPORT_POLLING_INTERVAL_MS)
  })

  it('stops polling when every import has finished', () => {
    const page = pageOf([
      aContactImport({ status: 'Completed' }),
      aContactImport({ status: 'CompletedWithErrors' }),
      aContactImport({ status: 'Failed' }),
    ])

    expect(importsPollingInterval(page)).toBe(false)
  })

  it('does not poll before the first response', () => {
    expect(importsPollingInterval(undefined)).toBe(false)
  })
})
