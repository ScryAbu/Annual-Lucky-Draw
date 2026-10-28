import { Employee } from '../types'
import { useThemeStore } from '../stores/themeStore'
import { displayLines } from '../utils/display'
import { generateDefaultAvatar } from '../utils/imageLoader'

export function ParticipantInfo({ employee }: { employee: Employee }) {
  const options = useThemeStore(s => s.displayOptions)
  const color = useThemeStore(s => s.theme.colors.primary)
  return <div className="flex flex-col items-center gap-2">
    {options.showPhoto && <img className="w-24 h-24 rounded-full object-cover" src={employee.photoData || generateDefaultAvatar(employee.name || employee.id, color)} alt="" />}
    {displayLines(employee, options).map((text, index) => <p className={index === 0 ? 'text-2xl font-bold' : 'text-sm'} key={index}>{text}</p>)}
  </div>
}
