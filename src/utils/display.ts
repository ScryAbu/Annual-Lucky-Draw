import { Employee, DisplayOptions } from '../types'

export const DEFAULT_DISPLAY: DisplayOptions = {
  showId: true, showName: true, showDepartment: true, showPhoto: true,
}

export function displayLines(employee: Employee, options: DisplayOptions): string[] {
  return [options.showId ? employee.id : '', options.showName ? employee.name : '',
    options.showDepartment ? employee.department : ''].filter(Boolean)
}
