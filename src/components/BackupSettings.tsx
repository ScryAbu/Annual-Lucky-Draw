import { useState, useRef } from 'react'
import { createBackup, restoreBackup, backupSchema } from '../utils/backup'

export default function BackupSettings() {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)
  return <section className="rounded-xl p-6 bg-black/10 space-y-4">
    <h3 className="text-lg font-semibold">保存与迁移活动</h3>
    <p>导出一个配置文件，包含名单、照片、奖项、中奖记录、外观和音乐。在另一台电脑导入即可继续使用。</p>
    <p className="text-sm">文件包含完整活动数据与高级设置，请妥善保管。导入会覆盖当前活动，建议先导出备份。</p>
    <div className="flex gap-4">
      <button disabled={busy} className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={async () => {
        setBusy(true)
        try {
          const data = await createBackup()
          const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }))
          const link = document.createElement('a'); link.href = url; link.download = '抽奖活动配置.json'; link.click()
          window.setTimeout(() => URL.revokeObjectURL(url), 1000)
          setMessage('配置文件已生成')
        } catch (error) { setMessage(`导出失败：${String(error)}`) }
        finally { setBusy(false) }
      }}>导出完整配置</button>
      <button disabled={busy} className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={() => input.current?.click()}>导入配置</button>
    </div>
    <input ref={input} type="file" accept=".json" hidden onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ''; if (!file) return
      setBusy(true)
      try {
        if (file.size > 100 * 1024 * 1024) throw new Error('配置文件不能超过 100 MB')
        const data = backupSchema.parse(JSON.parse(await file.text()))
        if (!confirm(`导入 ${data.employees.length} 人、${data.prizes.length} 个奖项，覆盖当前活动？`)) return
        await restoreBackup(data)
        location.reload()
      } catch (error) { setMessage(`导入失败，未替换活动数据：${String(error)}`) }
      finally { setBusy(false) }
    }} />
    <p role="status">{message}</p>
  </section>
}
